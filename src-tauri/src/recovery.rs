use crate::{GraphEdge, PersistedProject};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

const RECOVERY_DIRECTORY: &str = ".agent-lab-recovery";
const MANIFEST_NAME: &str = "recovery.json";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeletePreview {
    pub agent_id: String,
    pub agent_name: String,
    pub agent_path: String,
    pub files: Vec<String>,
    pub edges: Vec<GraphEdge>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryEntry {
    pub action_id: String,
    pub agent_id: String,
    pub agent_name: String,
    pub agent_path: String,
    pub files: Vec<String>,
    pub edges: Vec<GraphEdge>,
}

#[derive(Debug, Serialize, Deserialize)]
struct RecoveryManifest {
    entry: RecoveryEntry,
    metadata: PersistedProject,
}

pub(crate) fn preview_delete_agent(
    root: &Path,
    metadata: &PersistedProject,
    agent_id: &str,
) -> Result<DeletePreview, String> {
    let node = metadata
        .graph
        .nodes
        .iter()
        .find(|node| node.id == agent_id && node.kind == "agent")
        .ok_or_else(|| format!("Unknown agent graph node `{agent_id}`."))?;
    let path = valid_agent_path(&node.path, agent_id)?;
    let source = root.join(&path);
    let source_metadata = fs::symlink_metadata(&source)
        .map_err(|error| format!("Could not inspect `{}`: {error}", source.display()))?;
    if source_metadata.file_type().is_symlink() {
        return Err(format!("Agent folder `{}` cannot be a symlink.", node.path));
    }
    if !source_metadata.is_dir() {
        return Err(format!("Agent folder does not exist: `{}`.", node.path));
    }

    let mut files = Vec::new();
    collect_files(root, &source, &mut files)?;
    files.sort();
    let edges = metadata
        .graph
        .edges
        .iter()
        .filter(|edge| edge.source == agent_id || edge.target == agent_id)
        .cloned()
        .collect();
    Ok(DeletePreview {
        agent_id: agent_id.to_string(),
        agent_name: node.name.clone(),
        agent_path: path,
        files,
        edges,
    })
}

pub(crate) fn metadata_without_agent(
    metadata: &PersistedProject,
    agent_id: &str,
) -> PersistedProject {
    let mut next = metadata.clone();
    next.graph.nodes.retain(|node| node.id != agent_id);
    next.graph
        .edges
        .retain(|edge| edge.source != agent_id && edge.target != agent_id);
    next.skill_assignments
        .retain(|assignment| assignment.agent_id != agent_id);
    next
}

pub(crate) fn move_to_recovery(
    root: &Path,
    preview: &DeletePreview,
    metadata: &PersistedProject,
) -> Result<RecoveryEntry, String> {
    let recovery_root = root.join(RECOVERY_DIRECTORY);
    ensure_directory(&recovery_root, "recovery directory")?;
    let action_id = format!(
        "delete-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| format!("Could not create recovery action id: {error}"))?
            .as_nanos()
    );
    let action_root = recovery_root.join(&action_id);
    fs::create_dir(&action_root)
        .map_err(|error| format!("Could not create recovery action: {error}"))?;
    let entry = RecoveryEntry {
        action_id,
        agent_id: preview.agent_id.clone(),
        agent_name: preview.agent_name.clone(),
        agent_path: preview.agent_path.clone(),
        files: preview.files.clone(),
        edges: preview.edges.clone(),
    };
    write_manifest(
        &action_root.join(MANIFEST_NAME),
        &RecoveryManifest {
            entry: entry.clone(),
            metadata: metadata.clone(),
        },
    )?;
    let stored_agent = action_root.join("agent");
    let source = root.join(&preview.agent_path);
    let source_metadata = fs::symlink_metadata(&source)
        .map_err(|error| format!("Could not inspect `{}`: {error}", source.display()))?;
    if source_metadata.file_type().is_symlink() || !source_metadata.is_dir() {
        return Err(format!(
            "Agent folder `{}` is no longer safe to move.",
            preview.agent_path
        ));
    }
    fs::rename(&source, &stored_agent).map_err(|error| {
        format!(
            "Could not move `{}` into recovery: {error}",
            preview.agent_path
        )
    })?;
    Ok(entry)
}

pub(crate) fn read_recovery_entries(root: &Path) -> Result<Vec<RecoveryEntry>, String> {
    let recovery_root = root.join(RECOVERY_DIRECTORY);
    if !recovery_root.exists() {
        return Ok(Vec::new());
    }
    ensure_directory(&recovery_root, "recovery directory")?;
    let mut entries = Vec::new();
    for item in fs::read_dir(&recovery_root)
        .map_err(|error| format!("Could not read recovery directory: {error}"))?
    {
        let item = item.map_err(|error| format!("Could not inspect recovery entry: {error}"))?;
        let path = item.path();
        let file_type = item
            .file_type()
            .map_err(|error| format!("Could not inspect recovery entry: {error}"))?;
        if file_type.is_symlink() || !file_type.is_dir() {
            continue;
        }
        let manifest = read_manifest(&path.join(MANIFEST_NAME))?;
        if path.join("agent").is_dir() {
            entries.push(manifest.entry);
        }
    }
    entries.sort_by(|left, right| right.action_id.cmp(&left.action_id));
    Ok(entries)
}

pub(crate) fn restore_from_recovery(
    root: &Path,
    action_id: &str,
) -> Result<(PersistedProject, RecoveryEntry), String> {
    validate_action_id(action_id)?;
    let action_root = root.join(RECOVERY_DIRECTORY).join(action_id);
    let action_metadata = fs::symlink_metadata(&action_root)
        .map_err(|error| format!("Could not inspect recovery entry `{action_id}`: {error}"))?;
    if action_metadata.file_type().is_symlink() || !action_metadata.is_dir() {
        return Err(format!("Recovery entry `{action_id}` is invalid."));
    }
    let manifest = read_manifest(&action_root.join(MANIFEST_NAME))?;
    let agent_path = valid_agent_path(&manifest.entry.agent_path, &manifest.entry.agent_id)?;
    let destination = root.join(&agent_path);
    if destination.exists() {
        return Err(format!(
            "Could not restore `{}` because its original folder already exists.",
            manifest.entry.agent_path
        ));
    }
    let parent = destination
        .parent()
        .ok_or_else(|| "Recovery entry has an invalid agent path.".to_string())?;
    ensure_directory(parent, "agents directory")?;
    let stored_agent = action_root.join("agent");
    let stored_metadata = fs::symlink_metadata(&stored_agent)
        .map_err(|error| format!("Could not inspect recovered agent: {error}"))?;
    if stored_metadata.file_type().is_symlink() || !stored_metadata.is_dir() {
        return Err("Recovered agent folder is invalid.".to_string());
    }
    fs::rename(&stored_agent, &destination)
        .map_err(|error| format!("Could not restore agent folder: {error}"))?;
    Ok((manifest.metadata, manifest.entry))
}

pub(crate) fn rollback_restore(
    root: &Path,
    action_id: &str,
    agent_path: &str,
) -> Result<(), String> {
    fs::rename(
        root.join(agent_path),
        root.join(RECOVERY_DIRECTORY).join(action_id).join("agent"),
    )
    .map_err(|error| format!("Could not roll back restored agent folder: {error}"))
}

pub(crate) fn rollback_trash(root: &Path, entry: &RecoveryEntry) -> Result<(), String> {
    fs::rename(
        root.join(RECOVERY_DIRECTORY)
            .join(&entry.action_id)
            .join("agent"),
        root.join(&entry.agent_path),
    )
    .map_err(|error| format!("Could not roll back recovered agent folder: {error}"))
}

fn valid_agent_path(path: &str, agent_id: &str) -> Result<String, String> {
    let slug = path
        .strip_prefix("agents/")
        .filter(|slug| !slug.is_empty() && !slug.contains('/'))
        .ok_or_else(|| format!("Agent node `{agent_id}` has an invalid path."))?;
    Ok(format!("agents/{slug}"))
}

fn collect_files(root: &Path, directory: &Path, files: &mut Vec<String>) -> Result<(), String> {
    for item in fs::read_dir(directory)
        .map_err(|error| format!("Could not scan `{}`: {error}", directory.display()))?
    {
        let item = item.map_err(|error| format!("Could not inspect agent entry: {error}"))?;
        let path = item.path();
        let metadata = fs::symlink_metadata(&path)
            .map_err(|error| format!("Could not inspect `{}`: {error}", path.display()))?;
        if metadata.file_type().is_symlink() {
            return Err(format!(
                "Agent file `{}` cannot be a symlink.",
                path.display()
            ));
        }
        if metadata.is_dir() {
            collect_files(root, &path, files)?;
        } else if metadata.is_file() {
            files.push(
                path.strip_prefix(root)
                    .map_err(|_| "Agent file escaped project root.".to_string())?
                    .to_string_lossy()
                    .replace('\\', "/"),
            );
        }
    }
    Ok(())
}

fn ensure_directory(path: &Path, label: &str) -> Result<(), String> {
    if path.exists() {
        let metadata = fs::symlink_metadata(path)
            .map_err(|error| format!("Could not inspect {label}: {error}"))?;
        if metadata.file_type().is_symlink() || !metadata.is_dir() {
            return Err(format!("The {label} cannot be a symlink or file."));
        }
    } else {
        fs::create_dir_all(path).map_err(|error| format!("Could not create {label}: {error}"))?;
    }
    Ok(())
}

fn validate_action_id(action_id: &str) -> Result<(), String> {
    if action_id.is_empty()
        || action_id.contains('/')
        || action_id.contains('\\')
        || action_id.contains("..")
    {
        return Err("Recovery action id is invalid.".to_string());
    }
    Ok(())
}

fn write_manifest(path: &Path, manifest: &RecoveryManifest) -> Result<(), String> {
    let json = serde_json::to_string_pretty(manifest)
        .map_err(|error| format!("Could not serialize recovery manifest: {error}"))?;
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|error| format!("Could not create recovery manifest: {error}"))?;
    file.write_all(format!("{json}\n").as_bytes())
        .map_err(|error| format!("Could not write recovery manifest: {error}"))?;
    file.sync_all()
        .map_err(|error| format!("Could not flush recovery manifest: {error}"))
}

fn read_manifest(path: &Path) -> Result<RecoveryManifest, String> {
    let metadata = fs::symlink_metadata(path)
        .map_err(|error| format!("Could not inspect recovery manifest: {error}"))?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err("Recovery manifest is invalid.".to_string());
    }
    serde_json::from_str(
        &fs::read_to_string(path)
            .map_err(|error| format!("Could not read recovery manifest: {error}"))?,
    )
    .map_err(|error| format!("Could not parse recovery manifest: {error}"))
}
