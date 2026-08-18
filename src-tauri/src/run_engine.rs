use super::permissions::{requires_approval, PermissionPolicy};
use super::runs::{self, RunEvent, RunSummary};
use crate::{canonical_directory, load_snapshot};
use std::fs;
use std::path::Path;

pub trait Provider {
    fn name(&self) -> &'static str;
    fn execute(&self, task: &str) -> Result<(String, u32), String>;
}

pub struct LocalDeterministicProvider;

impl Provider for LocalDeterministicProvider {
    fn name(&self) -> &'static str {
        "local-deterministic"
    }
    fn execute(&self, task: &str) -> Result<(String, u32), String> {
        if task.contains("[provider-failure]") {
            return Err("Provider failed before producing output.".to_string());
        }
        Ok((
            format!("# Local run output\n\nCompleted task: {task}\n"),
            24,
        ))
    }
}

pub fn start(root: &Path, agent_id: String, task: String) -> Result<RunSummary, String> {
    if task.trim().is_empty() {
        return Err("Run task cannot be empty.".to_string());
    }
    let snapshot = load_snapshot(root)?;
    if !snapshot.agents.iter().any(|agent| agent.id == agent_id) {
        return Err("Unknown run agent.".to_string());
    }
    let id = runs::next_id(root)?;
    let directory = runs::run_dir(root, &id)?;
    fs::create_dir(&directory).map_err(|error| format!("Could not create run folder: {error}"))?;
    for child in ["approvals", "handoffs", "outputs"] {
        runs::artifact_dir(root, &id, child)?;
    }
    fs::write(
        directory.join("task.md"),
        format!("# Run task\n\n{}\n", task.trim()),
    )
    .map_err(|error| format!("Could not write run task: {error}"))?;
    fs::write(directory.join("events.jsonl"), b"")
        .map_err(|error| format!("Could not initialize run events: {error}"))?;
    let policy = PermissionPolicy::default();
    let state = if requires_approval("write_project", &policy) {
        "waiting"
    } else {
        "running"
    };
    let timestamp = runs::now();
    let provider = LocalDeterministicProvider;
    let summary = RunSummary {
        id: id.clone(),
        task: task.trim().to_string(),
        agent_id,
        state: state.to_string(),
        provider: provider.name().to_string(),
        created_at: timestamp,
        updated_at: timestamp,
        calls: 1,
        input_tokens: Some(task.len() as u32),
        output_tokens: Some(0),
        estimated_cost: Some(0.0),
        cost_source: "local estimate; no provider billing".to_string(),
        last_error: None,
    };
    runs::write_json(&directory.join("run.json"), &summary)?;
    for edge in snapshot
        .graph
        .edges
        .iter()
        .filter(|edge| edge.source == summary.agent_id)
    {
        let handoff = serde_json::json!({
            "source": edge.source,
            "target": edge.target,
            "relation": edge.relation,
            "label": edge.label,
            "payload": edge.payload,
            "blocking": edge.blocking,
            "condition": edge.condition,
        });
        let handoff_name = format!(
            "{}.json",
            edge.id.replace(
                |character: char| !character.is_ascii_alphanumeric() && character != '-',
                "-"
            )
        );
        let handoffs = runs::artifact_dir(root, &id, "handoffs")?;
        runs::write_json(&handoffs.join(handoff_name), &handoff)?;
        runs::append_event(
            root,
            &id,
            &RunEvent {
                sequence: runs::read_events(root, &id)?.len() as u64,
                kind: "handoff_created".to_string(),
                state: state.to_string(),
                message: format!("Handoff prepared for {}.", edge.target),
                at: timestamp,
            },
        )?;
    }
    runs::append_event(
        root,
        &id,
        &RunEvent {
            sequence: 0,
            kind: "run_started".to_string(),
            state: state.to_string(),
            message: "Explicit local run started; no shell execution is available.".to_string(),
            at: timestamp,
        },
    )?;
    Ok(summary)
}

pub fn decide(root: &Path, id: String, approved: bool) -> Result<RunSummary, String> {
    let mut summary = runs::read_summary(root, &id)?;
    if summary.state != "waiting" {
        return Err("This run is not waiting for approval.".to_string());
    }
    summary.state = if approved { "running" } else { "blocked" }.to_string();
    summary.updated_at = runs::now();
    summary.output_tokens = Some(0);
    summary.last_error = (!approved).then(|| "Approval rejected by user.".to_string());
    let directory = runs::run_dir(root, &id)?;
    let outputs = runs::artifact_dir(root, &id, "outputs")?;
    runs::write_json(&directory.join("run.json"), &summary)?;
    runs::append_event(
        root,
        &id,
        &RunEvent {
            sequence: runs::read_events(root, &id)?.len() as u64,
            kind: if approved {
                "approval_granted"
            } else {
                "approval_rejected"
            }
            .to_string(),
            state: summary.state.clone(),
            message: if approved {
                "User approved the sensitive step."
            } else {
                "User rejected the sensitive step."
            }
            .to_string(),
            at: summary.updated_at,
        },
    )?;
    if approved {
        let provider = LocalDeterministicProvider;
        match provider.execute(&summary.task) {
            Ok((output, tokens)) => {
                summary.state = "complete".to_string();
                summary.output_tokens = Some(tokens);
                summary.updated_at = runs::now();
                runs::write_json(&directory.join("run.json"), &summary)?;
                fs::write(outputs.join("result.md"), output)
                    .map_err(|error| format!("Could not write run output: {error}"))?;
            }
            Err(error) => {
                summary.state = "failed".to_string();
                summary.last_error = Some(error.clone());
                summary.updated_at = runs::now();
                runs::write_json(&directory.join("run.json"), &summary)?;
                runs::append_event(
                    root,
                    &id,
                    &RunEvent {
                        sequence: runs::read_events(root, &id)?.len() as u64,
                        kind: "provider_failed".to_string(),
                        state: summary.state.clone(),
                        message: error,
                        at: summary.updated_at,
                    },
                )?;
            }
        }
    }
    Ok(summary)
}

pub fn cancel(root: &Path, id: String) -> Result<RunSummary, String> {
    let mut summary = runs::read_summary(root, &id)?;
    summary.state = "failed".to_string();
    summary.last_error = Some("Cancelled by user.".to_string());
    summary.updated_at = runs::now();
    let directory = runs::run_dir(root, &id)?;
    runs::write_json(&directory.join("run.json"), &summary)?;
    runs::append_event(
        root,
        &id,
        &RunEvent {
            sequence: runs::read_events(root, &id)?.len() as u64,
            kind: "run_cancelled".to_string(),
            state: summary.state.clone(),
            message: "Run cancelled explicitly by user.".to_string(),
            at: summary.updated_at,
        },
    )?;
    Ok(summary)
}

pub fn resume(root: &Path, id: String) -> Result<RunSummary, String> {
    let mut summary = runs::read_summary(root, &id)?;
    if summary.state == "complete" {
        return Ok(summary);
    }
    summary.state = "waiting".to_string();
    summary.updated_at = runs::now();
    let directory = runs::run_dir(root, &id)?;
    runs::write_json(&directory.join("run.json"), &summary)?;
    runs::append_event(
        root,
        &id,
        &RunEvent {
            sequence: runs::read_events(root, &id)?.len() as u64,
            kind: "run_resumed".to_string(),
            state: summary.state.clone(),
            message: "Run resumed and returned to its approval gate.".to_string(),
            at: summary.updated_at,
        },
    )?;
    Ok(summary)
}

pub fn root(path: &str) -> Result<std::path::PathBuf, String> {
    canonical_directory(Path::new(path), "project")
}
