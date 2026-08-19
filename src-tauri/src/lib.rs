mod migrations;
mod permissions;
mod recovery;
mod run_engine;
mod runs;
mod skills;

use serde::{Deserialize, Serialize};
use skills::Skill;
use std::fs;
use std::io::Write;
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

const SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSnapshot {
    pub root: String,
    pub project: ProjectMeta,
    pub agents: Vec<Agent>,
    pub graph: Graph,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub root: String,
    pub recognized: Vec<String>,
    pub agent_folders: Vec<String>,
    pub has_metadata: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillAssignment {
    pub agent_id: String,
    pub skill_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateAgent {
    pub id: String,
    pub name: String,
    pub purpose: String,
}

#[derive(Debug, Deserialize)]
pub struct TemplateFile {
    pub path: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectMeta {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Graph {
    #[serde(default)]
    pub nodes: Vec<GraphNode>,
    #[serde(default)]
    pub edges: Vec<GraphEdge>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GraphNode {
    pub id: String,
    pub kind: String,
    pub name: String,
    pub path: String,
    pub position: Point,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub struct GraphEdge {
    pub id: String,
    pub source: String,
    pub target: String,
    pub relation: String,
    #[serde(default)]
    pub label: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub payload: String,
    #[serde(default)]
    pub blocking: bool,
    #[serde(default)]
    pub condition: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub purpose: String,
    pub path: String,
    pub files: Vec<AgentFile>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentFile {
    pub path: String,
    pub kind: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectFile {
    pub path: String,
    pub name: String,
    pub kind: String,
    pub convention: String,
    pub revision: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileDocument {
    pub path: String,
    pub content: String,
    pub revision: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CommandError {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UiPreferences {
    #[serde(default = "default_ui_mode")]
    pub mode: String,
}

impl Default for UiPreferences {
    fn default() -> Self {
        Self {
            mode: default_ui_mode(),
        }
    }
}

fn default_ui_mode() -> String {
    "learn".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PersistedProject {
    schema_version: u32,
    project: ProjectMeta,
    graph: Graph,
    #[serde(default)]
    ui_preferences: UiPreferences,
    #[serde(default)]
    skill_assignments: Vec<SkillAssignment>,
}

#[tauri::command]
fn create_project(parent_path: String, name: String) -> Result<ProjectSnapshot, String> {
    let project_name = validate_project_name(&name)?;
    let parent = canonical_directory(Path::new(&parent_path), "parent folder")?;
    let root = parent.join(&project_name);
    if root.exists() {
        return Err(format!(
            "Could not create project: `{}` already exists.",
            root.display()
        ));
    }

    fs::create_dir(&root).map_err(|error| format!("Could not create project folder: {error}"))?;
    for directory in ["agents", "skills", "shared"] {
        fs::create_dir(root.join(directory))
            .map_err(|error| format!("Could not create `{directory}`: {error}"))?;
    }

    write_new_file(
        &root.join("PROJECT.md"),
        &format!("# {project_name}\n\nA local Agent Lab project.\n"),
    )?;
    write_new_file(
        &root.join("AGENTS.md"),
        "# Project instructions\n\nAdd project-specific coding-agent instructions here.\n",
    )?;

    let persisted = PersistedProject {
        schema_version: SCHEMA_VERSION,
        project: ProjectMeta {
            id: new_local_id(),
            name: project_name,
        },
        graph: Graph::default(),
        ui_preferences: UiPreferences {
            mode: default_ui_mode(),
        },
        skill_assignments: Vec::new(),
    };
    write_metadata(&root, &persisted)?;
    load_snapshot(&root)
}

#[tauri::command]
fn open_project(path: String) -> Result<ProjectSnapshot, String> {
    let root = canonical_directory(Path::new(&path), "project")?;
    load_snapshot(&root)
}

#[tauri::command]
fn inspect_project(path: String) -> Result<ImportSummary, String> {
    let root = canonical_directory(Path::new(&path), "project")?;
    let mut recognized = Vec::new();
    for name in [
        "AGENTS.md",
        "PROJECT.md",
        "agent-lab.json",
        "agents",
        "skills",
        "SKILL.md",
    ] {
        let path = root.join(name);
        if let Ok(metadata) = fs::symlink_metadata(&path) {
            if !metadata.file_type().is_symlink() && (metadata.is_file() || metadata.is_dir()) {
                recognized.push(name.to_string());
            }
        }
    }
    let mut agent_folders = Vec::new();
    let agents_root = root.join("agents");
    if is_real_directory(&agents_root) {
        for entry in fs::read_dir(&agents_root)
            .map_err(|error| format!("Could not inspect agents: {error}"))?
        {
            let entry = entry.map_err(|error| format!("Could not inspect agents: {error}"))?;
            if is_real_directory(&entry.path()) {
                agent_folders.push(format!("agents/{}", entry.file_name().to_string_lossy()));
            }
        }
    }
    agent_folders.sort();
    Ok(ImportSummary {
        root: root.to_string_lossy().into_owned(),
        recognized,
        agent_folders,
        has_metadata: is_real_file(&root.join("agent-lab.json")),
    })
}

#[tauri::command]
fn apply_template(
    project_root: String,
    agents: Vec<TemplateAgent>,
    files: Vec<TemplateFile>,
    edges: Vec<GraphEdge>,
) -> Result<ProjectSnapshot, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    if agents.len() != files.len() {
        return Err("Template preview files must match template agents exactly.".to_string());
    }
    let mut metadata = read_or_reconstruct_metadata(&root)?;
    let mut created = Vec::new();
    let result = (|| {
        for agent in &agents {
            let slug = slugify(&agent.name)?;
            let id = format!("agent:{slug}");
            if agent.id != id || metadata.graph.nodes.iter().any(|node| node.id == id) {
                return Err(format!(
                    "Template agent `{}` is not a new validated agent.",
                    agent.name
                ));
            }
            if agent.purpose.trim().is_empty() {
                return Err("Template agent purpose cannot be empty.".to_string());
            }
            let file = files
                .iter()
                .find(|file| file.path == format!("agents/{slug}/AGENT.md"))
                .ok_or_else(|| format!("Template file missing for `{slug}`."))?;
            if file.content.trim().is_empty() {
                return Err("Template file content cannot be empty.".to_string());
            }
            let directory = root.join("agents").join(&slug);
            if directory.exists() {
                return Err(format!("Template target already exists: `{slug}`."));
            }
            fs::create_dir_all(&directory)
                .map_err(|error| format!("Could not stage template agent: {error}"))?;
            write_new_file(&directory.join("AGENT.md"), &file.content)?;
            created.push(directory);
            metadata.graph.nodes.push(GraphNode {
                id,
                kind: "agent".to_string(),
                name: agent.name.clone(),
                path: format!("agents/{slug}"),
                position: Point {
                    x: 32.0 + (metadata.graph.nodes.len() as f64 * 32.0),
                    y: 32.0 + (metadata.graph.nodes.len() as f64 * 32.0),
                },
            });
        }
        for edge in edges {
            validate_edge(&edge, &metadata.graph)?;
            metadata.graph.edges.push(edge);
        }
        write_metadata(&root, &metadata)?;
        Ok(())
    })();
    if let Err(error) = result {
        for directory in created.into_iter().rev() {
            let _ = fs::remove_dir_all(directory);
        }
        return Err(error);
    }
    load_snapshot(&root)
}

#[tauri::command]
fn get_ui_mode(project_root: String) -> Result<String, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    Ok(read_or_reconstruct_metadata(&root)?.ui_preferences.mode)
}

#[tauri::command]
fn set_ui_mode(project_root: String, mode: String) -> Result<String, String> {
    if mode != "learn" && mode != "build" {
        return Err("UI mode must be `learn` or `build`.".to_string());
    }
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let mut metadata = read_or_reconstruct_metadata(&root)?;
    metadata.ui_preferences.mode = mode.clone();
    write_metadata(&root, &metadata)?;
    Ok(mode)
}

#[tauri::command]
fn create_agent(
    project_root: String,
    name: String,
    purpose: String,
) -> Result<ProjectSnapshot, String> {
    create_agent_internal(project_root, name, purpose, None)
}

#[tauri::command]
fn create_agent_with_content(
    project_root: String,
    name: String,
    purpose: String,
    content: String,
) -> Result<ProjectSnapshot, String> {
    create_agent_internal(project_root, name, purpose, Some(content))
}

fn create_agent_internal(
    project_root: String,
    name: String,
    purpose: String,
    content_override: Option<String>,
) -> Result<ProjectSnapshot, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let clean_name = validate_agent_name(&name)?;
    let clean_purpose = purpose.trim();
    if clean_purpose.is_empty() {
        return Err("Agent purpose cannot be empty.".to_string());
    }
    let slug = slugify(&clean_name)?;
    let relative_path = format!("agents/{slug}");
    let agents_directory = checked_path(&root, "agents", true)?;
    fs::create_dir_all(&agents_directory)
        .map_err(|error| format!("Could not create agents directory: {error}"))?;
    let agent_directory = checked_path(&root, &relative_path, true)?;
    if agent_directory.exists() {
        return Err(format!("Could not create agent: `{slug}` already exists."));
    }
    fs::create_dir(&agent_directory)
        .map_err(|error| format!("Could not create agent directory: {error}"))?;

    let content = content_override.unwrap_or_else(|| format!(
        "# {clean_name}\n\n## Purpose\n\n{clean_purpose}\n\n## Responsibilities\n\n- Own the distinct responsibility described above and return work that another agent can inspect and use.\n\n## Inputs\n\n- An approved task, the relevant context, constraints, and the files or evidence needed to begin safely.\n\n## Outputs\n\n- A concise result with the work completed, supporting evidence, limitations, and any open handoff questions.\n\n## Boundaries\n\n- Do not expand scope, invent missing facts, modify unrelated files, or perform destructive actions without explicit authorization.\n"
    ));
    if content.trim().is_empty() {
        return Err("Agent content cannot be empty.".to_string());
    }
    write_new_file(&agent_directory.join("AGENT.md"), &content)?;

    let mut persisted = read_or_reconstruct_metadata(&root)?;
    persisted.graph.nodes.push(GraphNode {
        id: format!("agent:{slug}"),
        kind: "agent".to_string(),
        name: clean_name,
        path: relative_path,
        position: Point {
            x: 32.0 + (persisted.graph.nodes.len() as f64 * 32.0),
            y: 32.0 + (persisted.graph.nodes.len() as f64 * 32.0),
        },
    });
    write_metadata(&root, &persisted)?;
    load_snapshot(&root)
}

#[tauri::command]
fn read_project_file(project_root: String, relative_path: String) -> Result<String, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let file = checked_path(&root, &relative_path, false)?;
    if !file.is_file() {
        return Err(format!("File does not exist: `{relative_path}`."));
    }
    fs::read_to_string(&file).map_err(|error| format!("Could not read `{relative_path}`: {error}"))
}

#[tauri::command]
fn write_project_file(
    project_root: String,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    if relative_path == "agent-lab.json" {
        return Err("Project metadata can only be changed by Agent Lab.".to_string());
    }
    let file = checked_path(&root, &relative_path, true)?;
    if !file.is_file() {
        return Err(format!("File does not exist: `{relative_path}`."));
    }
    write_atomic(&file, &content)
}

#[tauri::command]
fn list_project_files(project_root: String) -> Result<Vec<ProjectFile>, CommandError> {
    let root = canonical_directory(Path::new(&project_root), "project").map_err(command_error)?;
    let mut files = Vec::new();
    inventory_directory(&root, &root, &mut files).map_err(command_error)?;
    files.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(files)
}

#[tauri::command]
fn read_project_document(
    project_root: String,
    relative_path: String,
) -> Result<FileDocument, CommandError> {
    let root = canonical_directory(Path::new(&project_root), "project").map_err(command_error)?;
    read_document_for_root(&root, &relative_path).map_err(command_error)
}

#[tauri::command]
fn write_project_document(
    project_root: String,
    relative_path: String,
    content: String,
    expected_revision: String,
) -> Result<FileDocument, CommandError> {
    let root = canonical_directory(Path::new(&project_root), "project").map_err(command_error)?;
    let current = read_document_for_root(&root, &relative_path).map_err(command_error)?;
    if current.revision != expected_revision {
        return Err(CommandError {
            code: "file_conflict".to_string(),
            message: format!("File changed externally: `{relative_path}`."),
        });
    }
    let file = checked_path(&root, &relative_path, false).map_err(command_error)?;
    write_atomic(&file, &content).map_err(command_error)?;
    read_document_for_root(&root, &relative_path).map_err(command_error)
}

#[tauri::command]
fn create_project_file(
    project_root: String,
    parent_path: String,
    name: String,
    initial_content: String,
) -> Result<FileDocument, CommandError> {
    let root = canonical_directory(Path::new(&project_root), "project").map_err(command_error)?;
    create_project_file_for_root(&root, &parent_path, &name, &initial_content)
        .map_err(command_error)
}

#[tauri::command]
fn rename_agent(
    project_root: String,
    agent_id: String,
    new_name: String,
) -> Result<ProjectSnapshot, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    rename_agent_for_root(&root, &agent_id, &new_name)?;
    load_snapshot(&root)
}

#[tauri::command]
fn preview_delete_agent(
    project_root: String,
    agent_id: String,
) -> Result<recovery::DeletePreview, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let metadata = read_or_reconstruct_metadata(&root)?;
    recovery::preview_delete_agent(&root, &metadata, &agent_id)
}

#[tauri::command]
fn trash_agent(project_root: String, agent_id: String) -> Result<recovery::RecoveryEntry, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let metadata = read_or_reconstruct_metadata(&root)?;
    let preview = recovery::preview_delete_agent(&root, &metadata, &agent_id)?;
    let staged_metadata = stage_metadata(
        &root,
        &recovery::metadata_without_agent(&metadata, &agent_id),
    )?;
    let entry = match recovery::move_to_recovery(&root, &preview, &metadata) {
        Ok(entry) => entry,
        Err(error) => {
            let _ = fs::remove_file(&staged_metadata);
            return Err(error);
        }
    };
    if let Err(error) = commit_staged_metadata(&root, &staged_metadata) {
        if let Err(rollback_error) = recovery::rollback_trash(&root, &entry) {
            return Err(format!(
                "Could not save deleted agent metadata: {error}. Folder rollback also failed: {rollback_error}."
            ));
        }
        let _ = fs::remove_file(&staged_metadata);
        return Err(format!("Could not save deleted agent metadata: {error}"));
    }
    Ok(entry)
}

#[tauri::command]
fn list_recovery_entries(project_root: String) -> Result<Vec<recovery::RecoveryEntry>, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    recovery::read_recovery_entries(&root)
}

#[tauri::command]
fn restore_recovery_entry(
    project_root: String,
    action_id: String,
) -> Result<ProjectSnapshot, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let (metadata, entry) = recovery::restore_from_recovery(&root, &action_id)?;
    if let Err(error) = write_metadata(&root, &metadata) {
        if let Err(rollback_error) =
            recovery::rollback_restore(&root, &action_id, &entry.agent_path)
        {
            return Err(format!(
                "Could not save restored agent metadata: {error}. Folder rollback also failed: {rollback_error}."
            ));
        }
        return Err(format!("Could not save restored agent metadata: {error}"));
    }
    load_snapshot(&root)
}

#[tauri::command]
fn save_agent_position(
    project_root: String,
    agent_id: String,
    x: f64,
    y: f64,
) -> Result<(), String> {
    if !x.is_finite() || !y.is_finite() {
        return Err("Node position must be finite.".to_string());
    }
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let mut persisted = read_or_reconstruct_metadata(&root)?;
    let node = persisted
        .graph
        .nodes
        .iter_mut()
        .find(|node| node.id == agent_id)
        .ok_or_else(|| format!("Unknown graph node `{agent_id}`."))?;
    node.position = Point { x, y };
    write_metadata(&root, &persisted)
}

const EDGE_RELATIONS: [&str; 7] = [
    "delegation",
    "handoff",
    "review",
    "approval",
    "route",
    "feedback",
    "data",
];

fn validate_edge(edge: &GraphEdge, graph: &Graph) -> Result<(), String> {
    if edge.source == edge.target {
        return Err("Self-edges are not supported.".to_string());
    }
    if !graph.nodes.iter().any(|node| node.id == edge.source)
        || !graph.nodes.iter().any(|node| node.id == edge.target)
    {
        return Err("Both edge endpoints must be existing agents.".to_string());
    }
    if !EDGE_RELATIONS.contains(&edge.relation.as_str()) {
        return Err(format!("Unknown edge relation `{}`.", edge.relation));
    }
    if graph.edges.iter().any(|existing| {
        existing.id != edge.id
            && existing.source == edge.source
            && existing.target == edge.target
            && existing.relation == edge.relation
    }) {
        return Err("This relation already exists between these agents.".to_string());
    }
    Ok(())
}

#[tauri::command]
fn upsert_edge(project_root: String, edge: GraphEdge) -> Result<ProjectSnapshot, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let mut metadata = read_or_reconstruct_metadata(&root)?;
    validate_edge(&edge, &metadata.graph)?;
    if let Some(existing) = metadata
        .graph
        .edges
        .iter_mut()
        .find(|item| item.id == edge.id)
    {
        *existing = edge;
    } else {
        metadata.graph.edges.push(edge);
    }
    write_metadata(&root, &metadata)?;
    load_snapshot(&root)
}

#[tauri::command]
fn delete_edge(project_root: String, edge_id: String) -> Result<ProjectSnapshot, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let mut metadata = read_or_reconstruct_metadata(&root)?;
    let original = metadata.graph.edges.len();
    metadata.graph.edges.retain(|edge| edge.id != edge_id);
    if metadata.graph.edges.len() == original {
        return Err(format!("Unknown graph edge `{edge_id}`."));
    }
    write_metadata(&root, &metadata)?;
    load_snapshot(&root)
}

#[tauri::command]
fn reveal_in_finder(project_root: String, relative_path: Option<String>) -> Result<(), String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let target = match relative_path {
        Some(relative) => checked_path(&root, &relative, false)?,
        None => root,
    };
    Command::new("/usr/bin/open")
        .arg("-R")
        .arg(&target)
        .status()
        .map_err(|error| format!("Could not reveal path in Finder: {error}"))?
        .success()
        .then_some(())
        .ok_or_else(|| "Finder could not reveal the requested path.".to_string())
}

fn run_impl() -> tauri::Result<()> {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            create_project,
            open_project,
            inspect_project,
            apply_template,
            get_ui_mode,
            set_ui_mode,
            create_agent,
            create_agent_with_content,
            read_project_file,
            write_project_file,
            list_project_files,
            read_project_document,
            write_project_document,
            create_project_file,
            rename_agent,
            preview_delete_agent,
            trash_agent,
            list_recovery_entries,
            restore_recovery_entry,
            save_agent_position,
            upsert_edge,
            delete_edge,
            reveal_in_finder,
            list_skills,
            list_skill_assignments,
            set_skill_assignment,
            inspect_skill_import,
            apply_skill_import,
            list_runs,
            start_run,
            decide_run,
            cancel_run,
            resume_run,
            list_run_events
        ])
        .run(tauri::generate_context!())
}

fn command_error(message: String) -> CommandError {
    CommandError {
        code: "filesystem_error".to_string(),
        message,
    }
}

#[tauri::command]
fn list_skills(project_root: String) -> Result<Vec<Skill>, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    skills::discover(&root)
}

#[tauri::command]
fn list_skill_assignments(project_root: String) -> Result<Vec<SkillAssignment>, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    Ok(read_or_reconstruct_metadata(&root)?.skill_assignments)
}

#[tauri::command]
fn set_skill_assignment(
    project_root: String,
    agent_id: String,
    skill_id: String,
    assigned: bool,
) -> Result<Vec<SkillAssignment>, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    let mut metadata = read_or_reconstruct_metadata(&root)?;
    let snapshot = load_snapshot(&root)?;
    if !snapshot.agents.iter().any(|agent| agent.id == agent_id) {
        return Err("Unknown agent for skill assignment.".to_string());
    }
    if !skills::discover(&root)?
        .iter()
        .any(|skill| skill.id == skill_id)
    {
        return Err("Unknown local skill for assignment.".to_string());
    }
    if assigned {
        if metadata
            .skill_assignments
            .iter()
            .all(|item| item.agent_id != agent_id || item.skill_id != skill_id)
        {
            metadata
                .skill_assignments
                .push(SkillAssignment { agent_id, skill_id });
        }
    } else {
        metadata
            .skill_assignments
            .retain(|item| item.agent_id != agent_id || item.skill_id != skill_id);
    }
    metadata.skill_assignments.sort_by(|a, b| {
        a.agent_id
            .cmp(&b.agent_id)
            .then(a.skill_id.cmp(&b.skill_id))
    });
    write_metadata(&root, &metadata)?;
    Ok(metadata.skill_assignments)
}

#[tauri::command]
fn inspect_skill_import(
    source_path: String,
    project_root: String,
) -> Result<skills::ImportPreview, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    skills::inspect_import(Path::new(&source_path), &root)
}

#[tauri::command]
fn apply_skill_import(source_path: String, project_root: String) -> Result<Vec<Skill>, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    skills::apply_import(Path::new(&source_path), &root)
}

#[tauri::command]
fn list_runs(project_root: String) -> Result<Vec<runs::RunSummary>, String> {
    let root = canonical_directory(Path::new(&project_root), "project")?;
    runs::list(&root)
}

#[tauri::command]
fn start_run(
    project_root: String,
    agent_id: String,
    task: String,
) -> Result<runs::RunSummary, String> {
    let root = run_engine::root(&project_root)?;
    run_engine::start(&root, agent_id, task)
}

#[tauri::command]
fn decide_run(
    project_root: String,
    run_id: String,
    approved: bool,
) -> Result<runs::RunSummary, String> {
    let root = run_engine::root(&project_root)?;
    run_engine::decide(&root, run_id, approved)
}

#[tauri::command]
fn cancel_run(project_root: String, run_id: String) -> Result<runs::RunSummary, String> {
    let root = run_engine::root(&project_root)?;
    run_engine::cancel(&root, run_id)
}

#[tauri::command]
fn resume_run(project_root: String, run_id: String) -> Result<runs::RunSummary, String> {
    let root = run_engine::root(&project_root)?;
    run_engine::resume(&root, run_id)
}

#[tauri::command]
fn list_run_events(project_root: String, run_id: String) -> Result<Vec<runs::RunEvent>, String> {
    let root = run_engine::root(&project_root)?;
    runs::read_events(&root, &run_id)
}

fn revision_for(path: &Path) -> Result<String, String> {
    let metadata = fs::metadata(path)
        .map_err(|error| format!("Could not inspect `{}`: {error}", path.display()))?;
    let modified = metadata
        .modified()
        .map_err(|error| format!("Could not inspect `{}`: {error}", path.display()))?;
    let nanos = modified
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("Could not inspect `{}`: {error}", path.display()))?
        .as_nanos();
    Ok(format!("{nanos}:{}", metadata.len()))
}

fn read_document_for_root(root: &Path, relative_path: &str) -> Result<FileDocument, String> {
    if relative_path == "agent-lab.json" {
        return Err("Project metadata is not an editable document.".to_string());
    }
    let file = checked_path(root, relative_path, false)?;
    if !file.is_file() {
        return Err(format!("File does not exist: `{relative_path}`."));
    }
    Ok(FileDocument {
        path: relative_path.to_string(),
        content: fs::read_to_string(&file)
            .map_err(|error| format!("Could not read `{relative_path}`: {error}"))?,
        revision: revision_for(&file)?,
    })
}

fn create_project_file_for_root(
    root: &Path,
    parent_path: &str,
    name: &str,
    initial_content: &str,
) -> Result<FileDocument, String> {
    let clean_name = validate_project_file_name(name)?;
    let parent = checked_path(root, parent_path, false)?;
    if !parent.is_dir() {
        return Err(format!("Parent directory does not exist: `{parent_path}`."));
    }
    let path = parent.join(&clean_name);
    write_new_file(&path, initial_content)?;
    let relative_path = path
        .strip_prefix(root)
        .map_err(|_| "Path escaped project root.".to_string())?
        .to_string_lossy()
        .replace('\\', "/");
    read_document_for_root(root, &relative_path)
}

fn rename_agent_for_root(root: &Path, agent_id: &str, new_name: &str) -> Result<(), String> {
    let clean_name = validate_agent_name(new_name)?;
    let new_slug = slugify(&clean_name)?;
    let mut persisted = read_or_reconstruct_metadata(root)?;
    let node = persisted
        .graph
        .nodes
        .iter()
        .find(|node| node.id == agent_id && node.kind == "agent")
        .ok_or_else(|| format!("Unknown agent graph node `{agent_id}`."))?;
    let old_id = node.id.clone();
    let old_path = node.path.clone();
    let old_slug = old_path
        .strip_prefix("agents/")
        .filter(|slug| !slug.is_empty() && !slug.contains('/'))
        .ok_or_else(|| format!("Agent node `{agent_id}` has an invalid path."))?;
    if slugify(old_slug)? != old_slug {
        return Err(format!(
            "Agent node `{agent_id}` has an invalid folder name."
        ));
    }

    let source = checked_path(root, &old_path, false)?;
    if !source.is_dir() {
        return Err(format!("Agent folder does not exist: `{old_path}`."));
    }
    let new_path = format!("agents/{new_slug}");
    let destination = checked_path(root, &new_path, true)?;
    if source != destination && destination.exists() {
        return Err(format!(
            "Could not rename `{old_path}` because a folder named `{new_slug}` already exists."
        ));
    }

    let new_id = format!("agent:{new_slug}");
    for node in &mut persisted.graph.nodes {
        if node.id == old_id {
            node.id = new_id.clone();
            node.name = clean_name.clone();
            node.path = new_path.clone();
        }
    }
    for edge in &mut persisted.graph.edges {
        if edge.source == old_id {
            edge.source = new_id.clone();
        }
        if edge.target == old_id {
            edge.target = new_id.clone();
        }
    }

    let staged_metadata = stage_metadata(root, &persisted)?;
    if source != destination {
        if let Err(error) = fs::rename(&source, &destination) {
            let _ = fs::remove_file(&staged_metadata);
            return Err(format!("Could not rename `{old_path}`: {error}"));
        }
    }
    if let Err(error) = commit_staged_metadata(root, &staged_metadata) {
        if source != destination {
            if let Err(rollback_error) = fs::rename(&destination, &source) {
                return Err(format!(
                    "Could not save renamed agent metadata: {error}. Folder rollback also failed: {rollback_error}."
                ));
            }
        }
        let _ = fs::remove_file(&staged_metadata);
        return Err(format!("Could not save renamed agent metadata: {error}"));
    }
    Ok(())
}

fn inventory_directory(
    root: &Path,
    directory: &Path,
    files: &mut Vec<ProjectFile>,
) -> Result<(), String> {
    let entries = fs::read_dir(directory)
        .map_err(|error| format!("Could not scan `{}`: {error}", directory.display()))?;
    for entry in entries {
        let entry = entry.map_err(|error| format!("Could not inspect project entry: {error}"))?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        if should_skip_project_entry(&name) {
            continue;
        }
        let metadata = fs::symlink_metadata(&path)
            .map_err(|error| format!("Could not inspect `{}`: {error}", path.display()))?;
        if metadata.file_type().is_symlink() {
            continue;
        }
        if metadata.is_dir() {
            inventory_directory(root, &path, files)?;
            continue;
        }
        if !metadata.is_file() {
            continue;
        }
        let relative = path
            .strip_prefix(root)
            .map_err(|_| "Path escaped project root.".to_string())?
            .to_string_lossy()
            .replace('\\', "/");
        let kind = if path.extension().and_then(|ext| ext.to_str()) == Some("md") {
            "markdown"
        } else {
            "file"
        };
        let convention = match name.as_str() {
            "AGENT.md" | "AGENTS.md" | "MEMORY.md" | "TOOLS.md" | "PROJECT.md" => {
                "agent-lab".to_string()
            }
            _ => "custom".to_string(),
        };
        files.push(ProjectFile {
            path: relative,
            name,
            kind: kind.to_string(),
            convention,
            revision: revision_for(&path)?,
            size: metadata.len(),
        });
    }
    Ok(())
}

fn should_skip_project_entry(name: &str) -> bool {
    matches!(
        name,
        ".DS_Store" | ".git" | "node_modules" | "target" | ".agent-lab-recovery" | "agent-lab.json"
    ) || name.starts_with('.')
}

pub fn run() {
    if let Err(error) = run_impl() {
        eprintln!("error while running Agent Lab: {error}");
    }
}

fn load_snapshot(root: &Path) -> Result<ProjectSnapshot, String> {
    let persisted = read_or_reconstruct_metadata(root)?;
    let agents = scan_agents(root, &persisted.graph)?;
    let graph = merge_graph(persisted.graph, &agents);
    Ok(ProjectSnapshot {
        root: root.to_string_lossy().into_owned(),
        project: persisted.project,
        agents,
        graph,
    })
}

fn scan_agents(root: &Path, graph: &Graph) -> Result<Vec<Agent>, String> {
    let agents_root = root.join("agents");
    if !is_real_directory(&agents_root) {
        return Ok(Vec::new());
    }
    let agents_root = checked_path(root, "agents", false)?;
    let mut agents = Vec::new();
    let entries = fs::read_dir(&agents_root)
        .map_err(|error| format!("Could not read agents directory: {error}"))?;
    for entry in entries {
        let entry = entry.map_err(|error| format!("Could not inspect agent directory: {error}"))?;
        let directory = entry.path();
        if !is_real_directory(&directory) {
            continue;
        }
        let Some(slug) = directory.file_name().and_then(|name| name.to_str()) else {
            continue;
        };
        let agent_file = directory.join("AGENT.md");
        if !is_real_file(&agent_file) {
            continue;
        }
        let relative_path = format!("agents/{slug}");
        let graph_node = graph
            .nodes
            .iter()
            .find(|node| node.kind == "agent" && node.path == relative_path);
        let name = graph_node
            .map(|node| node.name.clone())
            .unwrap_or_else(|| title_from_slug(slug));
        let content = fs::read_to_string(&agent_file)
            .map_err(|error| format!("Could not read `{relative_path}/AGENT.md`: {error}"))?;
        let purpose = extract_purpose(&content);
        let mut files = Vec::new();
        let file_entries = fs::read_dir(&directory)
            .map_err(|error| format!("Could not read `{relative_path}`: {error}"))?;
        for file_entry in file_entries {
            let file_entry =
                file_entry.map_err(|error| format!("Could not inspect agent file: {error}"))?;
            let file_name = file_entry.file_name().to_string_lossy().into_owned();
            if should_skip_project_entry(&file_name) {
                continue;
            }
            if is_real_file(&file_entry.path()) {
                files.push(AgentFile {
                    path: format!("{relative_path}/{file_name}"),
                    kind: if file_name == "AGENT.md" {
                        "agent-lab".to_string()
                    } else {
                        "custom".to_string()
                    },
                });
            }
        }
        files.sort_by(|a, b| a.path.cmp(&b.path));
        agents.push(Agent {
            id: format!("agent:{slug}"),
            name,
            slug: slug.to_string(),
            purpose,
            path: relative_path,
            files,
        });
    }
    agents.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(agents)
}

fn is_real_directory(path: &Path) -> bool {
    fs::symlink_metadata(path)
        .map(|metadata| metadata.is_dir() && !metadata.file_type().is_symlink())
        .unwrap_or(false)
}

fn is_real_file(path: &Path) -> bool {
    fs::symlink_metadata(path)
        .map(|metadata| metadata.is_file() && !metadata.file_type().is_symlink())
        .unwrap_or(false)
}

fn merge_graph(mut graph: Graph, agents: &[Agent]) -> Graph {
    let agent_paths: Vec<&str> = agents.iter().map(|agent| agent.path.as_str()).collect();
    graph
        .nodes
        .retain(|node| node.kind != "agent" || agent_paths.iter().any(|path| *path == node.path));
    for (index, agent) in agents.iter().enumerate() {
        if graph.nodes.iter().all(|node| node.id != agent.id) {
            graph.nodes.push(GraphNode {
                id: agent.id.clone(),
                kind: "agent".to_string(),
                name: agent.name.clone(),
                path: agent.path.clone(),
                position: Point {
                    x: 32.0 + (index as f64 * 32.0),
                    y: 32.0 + (index as f64 * 32.0),
                },
            });
        }
    }
    graph
}

fn read_or_reconstruct_metadata(root: &Path) -> Result<PersistedProject, String> {
    let metadata = root.join("agent-lab.json");
    if metadata.is_file() {
        let value = migrations::load(root, SCHEMA_VERSION)?;
        let parsed: PersistedProject = serde_json::from_value(value)
            .map_err(|error| format!("Could not decode agent-lab.json: {error}"))?;
        return Ok(parsed);
    }
    let name = root
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("Local Agent Project")
        .to_string();
    Ok(PersistedProject {
        schema_version: SCHEMA_VERSION,
        project: ProjectMeta {
            id: new_local_id(),
            name,
        },
        graph: Graph::default(),
        ui_preferences: UiPreferences {
            mode: default_ui_mode(),
        },
        skill_assignments: Vec::new(),
    })
}

fn write_metadata(root: &Path, metadata: &PersistedProject) -> Result<(), String> {
    let json = serde_json::to_string_pretty(metadata)
        .map_err(|error| format!("Could not serialize project metadata: {error}"))?;
    write_atomic(&root.join("agent-lab.json"), &format!("{json}\n"))
}

fn stage_metadata(root: &Path, metadata: &PersistedProject) -> Result<PathBuf, String> {
    let json = serde_json::to_string_pretty(metadata)
        .map_err(|error| format!("Could not serialize project metadata: {error}"))?;
    let staged = root.join(format!(
        ".agent-lab-rename-{}.tmp",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| format!("Could not create temporary metadata path: {error}"))?
            .as_nanos()
    ));
    let result = (|| {
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&staged)
            .map_err(|error| format!("Could not stage project metadata: {error}"))?;
        file.write_all(format!("{json}\n").as_bytes())
            .map_err(|error| format!("Could not stage project metadata: {error}"))?;
        file.sync_all()
            .map_err(|error| format!("Could not flush staged project metadata: {error}"))
    })();
    if result.is_err() {
        let _ = fs::remove_file(&staged);
    }
    result.map(|()| staged)
}

fn commit_staged_metadata(root: &Path, staged: &Path) -> Result<(), String> {
    fs::rename(staged, root.join("agent-lab.json"))
        .map_err(|error| format!("Could not replace agent-lab.json: {error}"))
}

fn write_new_file(path: &Path, content: &str) -> Result<(), String> {
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|error| format!("Could not create `{}`: {error}", path.display()))?;
    file.write_all(content.as_bytes())
        .map_err(|error| format!("Could not write `{}`: {error}", path.display()))
}

fn write_atomic(path: &Path, content: &str) -> Result<(), String> {
    let temporary = path.with_extension(format!(
        "tmp-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| format!("Could not create temporary path: {error}"))?
            .as_nanos()
    ));
    let result = (|| {
        let mut file = fs::File::create(&temporary)
            .map_err(|error| format!("Could not prepare atomic write: {error}"))?;
        file.write_all(content.as_bytes())
            .map_err(|error| format!("Could not write temporary file: {error}"))?;
        file.sync_all()
            .map_err(|error| format!("Could not flush temporary file: {error}"))?;
        fs::rename(&temporary, path)
            .map_err(|error| format!("Could not replace `{}`: {error}", path.display()))
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

fn canonical_directory(path: &Path, label: &str) -> Result<PathBuf, String> {
    let canonical = fs::canonicalize(path)
        .map_err(|error| format!("Could not open {label} `{}`: {error}", path.display()))?;
    if !canonical.is_dir() {
        return Err(format!("The {label} must be a directory."));
    }
    Ok(canonical)
}

fn checked_path(root: &Path, relative: &str, allow_missing_file: bool) -> Result<PathBuf, String> {
    let relative_path = Path::new(relative);
    if relative_path.is_absolute()
        || relative_path.components().any(|component| {
            matches!(
                component,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err(format!("Path is outside the project root: `{relative}`."));
    }
    let candidate = root.join(relative_path);
    if candidate.exists() {
        let canonical = fs::canonicalize(&candidate)
            .map_err(|error| format!("Could not resolve `{relative}`: {error}"))?;
        if !canonical.starts_with(root) {
            return Err(format!("Path is outside the project root: `{relative}`."));
        }
        return Ok(canonical);
    }
    if !allow_missing_file {
        return Err(format!("Path does not exist: `{relative}`."));
    }
    let parent = candidate
        .parent()
        .ok_or_else(|| format!("Invalid project path: `{relative}`."))?;
    let canonical_parent = fs::canonicalize(parent)
        .map_err(|error| format!("Could not resolve parent for `{relative}`: {error}"))?;
    if !canonical_parent.starts_with(root) {
        return Err(format!("Path is outside the project root: `{relative}`."));
    }
    Ok(candidate)
}

fn validate_project_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() || trimmed == "." || trimmed == ".." {
        return Err("Project name cannot be empty or relative.".to_string());
    }
    if trimmed.contains('/') || trimmed.contains('\\') || trimmed.contains('\0') {
        return Err("Project name must be a single folder name.".to_string());
    }
    Ok(trimmed.to_string())
}

fn validate_agent_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Agent name cannot be empty.".to_string());
    }
    if trimmed.contains('/') || trimmed.contains('\\') || trimmed.contains('\0') {
        return Err("Agent name cannot contain path separators.".to_string());
    }
    Ok(trimmed.to_string())
}

fn validate_project_file_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() || trimmed == "." || trimmed == ".." {
        return Err("File name cannot be empty or relative.".to_string());
    }
    if trimmed.contains('/') || trimmed.contains('\\') || trimmed.contains('\0') {
        return Err("File name must be a single file name.".to_string());
    }
    let extension = Path::new(trimmed)
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_ascii_lowercase());
    if !matches!(
        extension.as_deref(),
        Some("md" | "json" | "yaml" | "yml" | "txt")
    ) {
        return Err("File type must be .md, .json, .yaml, .yml, or .txt.".to_string());
    }
    Ok(trimmed.to_string())
}

fn slugify(name: &str) -> Result<String, String> {
    let mut slug = String::new();
    for character in name.chars() {
        if character.is_ascii_alphanumeric() {
            slug.push(character.to_ascii_lowercase());
        } else if (character.is_whitespace() || matches!(character, '-' | '_' | '.'))
            && !slug.ends_with('-')
        {
            slug.push('-');
        }
    }
    let slug = slug.trim_matches('-').to_string();
    if slug.is_empty() {
        return Err("Agent name must contain at least one letter or number.".to_string());
    }
    Ok(slug)
}

fn title_from_slug(slug: &str) -> String {
    slug.split('-')
        .filter(|part| !part.is_empty())
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn extract_purpose(content: &str) -> String {
    let mut in_purpose = false;
    let mut lines = Vec::new();
    for line in content.lines() {
        if line.trim().eq_ignore_ascii_case("## purpose") {
            in_purpose = true;
            continue;
        }
        if in_purpose && line.trim_start().starts_with("## ") {
            break;
        }
        if in_purpose && !line.trim().is_empty() {
            lines.push(line.trim());
        }
    }
    lines.join(" ")
}

fn new_local_id() -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default();
    format!("local-{millis}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static TEST_SEQUENCE: AtomicU64 = AtomicU64::new(0);

    fn test_root(prefix: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "{prefix}-{}-{}",
            std::process::id(),
            TEST_SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ))
    }

    #[test]
    fn slugify_creates_stable_safe_folder_names() {
        assert_eq!(slugify("Researcher 2").unwrap(), "researcher-2");
        assert_eq!(slugify("  A B  ").unwrap(), "a-b");
        assert!(slugify("---").is_err());
    }

    #[test]
    fn purpose_is_extracted_from_agent_markdown() {
        let content =
            "# Researcher\n\n## Purpose\n\nFind reliable sources.\n\n## Inputs\n\nA task.\n";
        assert_eq!(extract_purpose(content), "Find reliable sources.");
    }

    #[test]
    fn path_validation_rejects_parent_traversal() {
        let root = Path::new("/tmp/project");
        assert!(checked_path(root, "../outside.txt", true).is_err());
        assert!(checked_path(root, "/tmp/outside.txt", true).is_err());
    }

    #[test]
    fn filesystem_vertical_slice_survives_reopen() {
        let test_root = std::env::temp_dir().join(format!("agent-lab-test-{}", new_local_id()));
        fs::create_dir_all(&test_root).unwrap();

        let project = create_project(
            test_root.to_string_lossy().into_owned(),
            "Vertical Slice".to_string(),
        )
        .unwrap();
        let project = create_agent(
            project.root.clone(),
            "Researcher".to_string(),
            "Find reliable information.".to_string(),
        )
        .unwrap();
        let agent_path = "agents/researcher/AGENT.md".to_string();
        let updated = "# Researcher\n\n## Purpose\n\nFind and verify reliable information.\n";
        write_project_file(
            project.root.clone(),
            agent_path.clone(),
            updated.to_string(),
        )
        .unwrap();
        save_agent_position(
            project.root.clone(),
            "agent:researcher".to_string(),
            240.0,
            120.0,
        )
        .unwrap();

        let reopened = open_project(project.root.clone()).unwrap();
        assert_eq!(
            read_project_file(project.root.clone(), agent_path).unwrap(),
            updated
        );
        assert_eq!(reopened.agents[0].name, "Researcher");
        assert_eq!(
            reopened.agents[0].purpose,
            "Find and verify reliable information."
        );
        assert_eq!(reopened.graph.nodes[0].position.x, 240.0);
        assert_eq!(reopened.graph.nodes[0].position.y, 120.0);

        fs::remove_dir_all(test_root).unwrap();
    }

    #[test]
    fn project_inventory_is_sorted_and_excludes_agent_lab_metadata() {
        let root = std::env::temp_dir().join(format!("agent-lab-inventory-{}", new_local_id()));
        fs::create_dir_all(root.join("nested")).unwrap();
        fs::write(root.join("PROJECT.md"), "project").unwrap();
        fs::write(root.join("nested/NOTES.md"), "notes").unwrap();
        fs::write(root.join("agent-lab.json"), "{}").unwrap();
        let mut files = Vec::new();
        inventory_directory(&root, &root, &mut files).unwrap();
        files.sort_by(|a, b| a.path.cmp(&b.path));
        assert!(files.windows(2).all(|pair| pair[0].path <= pair[1].path));
        assert!(files.iter().all(|file| file.path != "agent-lab.json"));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn stale_revision_cannot_overwrite_external_content() {
        let root = std::env::temp_dir().join(format!("agent-lab-revision-{}", new_local_id()));
        fs::create_dir_all(&root).unwrap();
        fs::write(root.join("PROJECT.md"), "opened").unwrap();
        let canonical_root = fs::canonicalize(&root).unwrap();
        let opened = read_document_for_root(&canonical_root, "PROJECT.md").unwrap();
        fs::write(root.join("PROJECT.md"), "external").unwrap();
        let current = read_document_for_root(&canonical_root, "PROJECT.md").unwrap();
        assert_ne!(opened.revision, current.revision);
        assert_eq!(opened.content, "opened");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn create_project_file_rejects_duplicate_names() {
        let root = test_root("agent-lab-create");
        fs::create_dir_all(&root).unwrap();
        let root = fs::canonicalize(&root).unwrap();
        create_project_file_for_root(&root, "", "TOOLS.md", "first").unwrap();
        assert!(create_project_file_for_root(&root, "", "TOOLS.md", "second").is_err());
        assert_eq!(fs::read_to_string(root.join("TOOLS.md")).unwrap(), "first");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn create_project_file_rejects_traversal() {
        let root = test_root("agent-lab-create");
        fs::create_dir_all(&root).unwrap();
        let root = fs::canonicalize(&root).unwrap();
        assert!(create_project_file_for_root(&root, "../outside", "TOOLS.md", "").is_err());
        assert!(create_project_file_for_root(&root, "", "../TOOLS.md", "").is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn create_project_file_rejects_unsupported_extensions() {
        let root = test_root("agent-lab-create");
        fs::create_dir_all(&root).unwrap();
        let root = fs::canonicalize(&root).unwrap();
        assert!(create_project_file_for_root(&root, "", "TOOLS.rs", "").is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn create_project_file_uses_create_new_semantics() {
        let root = test_root("agent-lab-create");
        fs::create_dir_all(&root).unwrap();
        fs::write(root.join("TOOLS.md"), "existing").unwrap();
        let root = fs::canonicalize(&root).unwrap();
        assert!(create_project_file_for_root(&root, "", "TOOLS.md", "replacement").is_err());
        assert_eq!(
            fs::read_to_string(root.join("TOOLS.md")).unwrap(),
            "existing"
        );
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn rename_agent_updates_nodes_and_both_edge_endpoints_without_overwriting_destination() {
        let parent = test_root("agent-lab-rename");
        fs::create_dir_all(&parent).unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Rename Test".to_string(),
        )
        .unwrap();
        let project = create_agent(
            project.root,
            "Researcher".to_string(),
            "Find reliable information.".to_string(),
        )
        .unwrap();
        let project = create_agent(
            project.root,
            "Analyst".to_string(),
            "Assess the findings.".to_string(),
        )
        .unwrap();
        let root = PathBuf::from(&project.root);
        let mut metadata = read_or_reconstruct_metadata(&root).unwrap();
        metadata.graph.edges = vec![
            GraphEdge {
                id: "researches".to_string(),
                source: "agent:researcher".to_string(),
                target: "agent:analyst".to_string(),
                relation: "researches".to_string(),
                ..GraphEdge::default()
            },
            GraphEdge {
                id: "reports".to_string(),
                source: "agent:analyst".to_string(),
                target: "agent:researcher".to_string(),
                relation: "reports".to_string(),
                ..GraphEdge::default()
            },
        ];
        write_metadata(&root, &metadata).unwrap();
        fs::write(
            root.join("agents/researcher/AGENT.md"),
            "# Researcher\n\nFree-form reference to Researcher stays unchanged.\n",
        )
        .unwrap();

        rename_agent_for_root(&root, "agent:researcher", "Investigator").unwrap();
        let renamed = load_snapshot(&root).unwrap();
        assert!(root.join("agents/investigator").is_dir());
        assert!(!root.join("agents/researcher").exists());
        assert_eq!(
            renamed
                .agents
                .iter()
                .find(|agent| agent.slug == "investigator")
                .unwrap()
                .name,
            "Investigator"
        );
        assert!(renamed.graph.nodes.iter().any(|node| {
            node.id == "agent:investigator"
                && node.name == "Investigator"
                && node.path == "agents/investigator"
        }));
        assert_eq!(renamed.graph.edges[0].source, "agent:investigator");
        assert_eq!(renamed.graph.edges[1].target, "agent:investigator");
        assert!(
            fs::read_to_string(root.join("agents/investigator/AGENT.md"))
                .unwrap()
                .contains("reference to Researcher stays unchanged")
        );

        assert!(rename_agent_for_root(&root, "agent:investigator", "Analyst").is_err());
        assert!(root.join("agents/investigator").is_dir());
        assert!(root.join("agents/analyst").is_dir());

        fs::remove_dir_all(parent).unwrap();
    }

    fn recovery_project() -> (PathBuf, ProjectSnapshot) {
        let parent = test_root("agent-lab-recovery");
        fs::create_dir_all(&parent).unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Recovery Test".to_string(),
        )
        .unwrap();
        let project = create_agent(
            project.root,
            "Researcher".to_string(),
            "Find facts.".to_string(),
        )
        .unwrap();
        let project = create_agent(
            project.root,
            "Analyst".to_string(),
            "Assess facts.".to_string(),
        )
        .unwrap();
        let root = PathBuf::from(&project.root);
        let mut metadata = read_or_reconstruct_metadata(&root).unwrap();
        metadata.graph.edges = vec![
            GraphEdge {
                id: "researches".to_string(),
                source: "agent:researcher".to_string(),
                target: "agent:analyst".to_string(),
                relation: "researches".to_string(),
                ..GraphEdge::default()
            },
            GraphEdge {
                id: "reports".to_string(),
                source: "agent:analyst".to_string(),
                target: "agent:researcher".to_string(),
                relation: "reports".to_string(),
                ..GraphEdge::default()
            },
        ];
        write_metadata(&root, &metadata).unwrap();
        fs::create_dir(root.join("agents/researcher/notes")).unwrap();
        fs::write(
            root.join("agents/researcher/notes/SOURCES.md"),
            "source list",
        )
        .unwrap();
        (parent, open_project(project.root).unwrap())
    }

    #[test]
    fn delete_preview_lists_every_agent_file_and_affected_edge() {
        let (parent, project) = recovery_project();
        let root = PathBuf::from(&project.root);
        let preview = preview_delete_agent(project.root, "agent:researcher".to_string()).unwrap();
        assert_eq!(
            preview.files,
            vec![
                "agents/researcher/AGENT.md",
                "agents/researcher/notes/SOURCES.md"
            ]
        );
        assert_eq!(preview.edges.len(), 2);
        assert!(preview.edges.iter().any(|edge| edge.id == "researches"));
        assert!(preview.edges.iter().any(|edge| edge.id == "reports"));
        fs::remove_dir_all(parent).unwrap();
        assert!(!root.exists());
    }

    #[test]
    fn trash_moves_agent_and_preserves_recovery_manifest() {
        let (parent, project) = recovery_project();
        let root = PathBuf::from(&project.root);
        let entry = trash_agent(project.root.clone(), "agent:researcher".to_string()).unwrap();
        let recovery = root.join(".agent-lab-recovery").join(&entry.action_id);
        assert!(!root.join("agents/researcher").exists());
        assert!(recovery.join("agent/AGENT.md").is_file());
        assert!(recovery.join("agent/notes/SOURCES.md").is_file());
        assert!(recovery.join("recovery.json").is_file());
        let reopened = open_project(project.root).unwrap();
        assert!(reopened
            .agents
            .iter()
            .all(|agent| agent.id != "agent:researcher"));
        assert!(reopened.graph.edges.is_empty());
        fs::remove_dir_all(parent).unwrap();
    }

    #[test]
    fn trash_removes_agent_skill_assignments_but_recovery_keeps_restore_metadata() {
        let root = test_root("agent-lab-trash-assignment-cleanup");
        fs::create_dir_all(&root).unwrap();
        create_project(root.to_string_lossy().into_owned(), "Cleanup".to_string()).unwrap();
        create_agent(
            root.to_string_lossy().into_owned(),
            "Researcher".to_string(),
            "Gather evidence".to_string(),
        )
        .unwrap();
        let skill_root = root.join("skills/fact-check");
        fs::create_dir_all(&skill_root).unwrap();
        fs::write(skill_root.join("SKILL.md"), "# Fact check\n").unwrap();
        let assignments = set_skill_assignment(
            root.to_string_lossy().into_owned(),
            "agent:researcher".to_string(),
            "skill:fact-check".to_string(),
            true,
        )
        .unwrap();
        assert_eq!(assignments.len(), 1);
        trash_agent(
            root.to_string_lossy().into_owned(),
            "agent:researcher".to_string(),
        )
        .unwrap();
        assert!(list_skill_assignments(root.to_string_lossy().into_owned())
            .unwrap()
            .is_empty());
        let restored = list_recovery_entries(root.to_string_lossy().into_owned()).unwrap();
        assert_eq!(restored.len(), 1);
        restore_recovery_entry(
            root.to_string_lossy().into_owned(),
            restored[0].action_id.clone(),
        )
        .unwrap();
        assert_eq!(
            list_skill_assignments(root.to_string_lossy().into_owned())
                .unwrap()
                .len(),
            1
        );
    }

    #[test]
    fn restore_recovery_entry_restores_folder_metadata_and_graph() {
        let (parent, project) = recovery_project();
        let root = PathBuf::from(&project.root);
        let entry = trash_agent(project.root.clone(), "agent:researcher".to_string()).unwrap();
        let restored = restore_recovery_entry(project.root, entry.action_id).unwrap();
        assert!(root.join("agents/researcher/AGENT.md").is_file());
        assert!(root.join("agents/researcher/notes/SOURCES.md").is_file());
        assert!(restored
            .agents
            .iter()
            .any(|agent| agent.id == "agent:researcher"));
        assert_eq!(restored.graph.edges.len(), 2);
        assert_eq!(list_recovery_entries(restored.root).unwrap().len(), 0);
        fs::remove_dir_all(parent).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn delete_preview_rejects_agent_symlink_escape() {
        use std::os::unix::fs::symlink;

        let parent = test_root("agent-lab-recovery-symlink");
        let outside = test_root("agent-lab-recovery-outside");
        fs::create_dir_all(&parent).unwrap();
        fs::create_dir_all(&outside).unwrap();
        fs::write(outside.join("AGENT.md"), "outside").unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Symlink Test".to_string(),
        )
        .unwrap();
        let root = PathBuf::from(&project.root);
        symlink(&outside, root.join("agents/escaped")).unwrap();
        let mut metadata = read_or_reconstruct_metadata(&root).unwrap();
        metadata.graph.nodes.push(GraphNode {
            id: "agent:escaped".to_string(),
            kind: "agent".to_string(),
            name: "Escaped".to_string(),
            path: "agents/escaped".to_string(),
            position: Point { x: 0.0, y: 0.0 },
        });
        write_metadata(&root, &metadata).unwrap();
        assert!(preview_delete_agent(project.root, "agent:escaped".to_string()).is_err());
        assert!(outside.join("AGENT.md").is_file());
        fs::remove_dir_all(parent).unwrap();
        fs::remove_dir_all(outside).unwrap();
    }

    #[test]
    fn ui_preferences_default_to_learn_when_absent() {
        let parsed: UiPreferences = serde_json::from_str("{}").unwrap();
        assert_eq!(parsed.mode, "learn");
    }

    #[test]
    fn legacy_edges_migrate_with_empty_contract_defaults() {
        let parsed: GraphEdge = serde_json::from_str(
            r#"{"id":"legacy","source":"agent:a","target":"agent:b","relation":"handoff"}"#,
        )
        .unwrap();
        assert_eq!(parsed.label, "");
        assert_eq!(parsed.payload, "");
        assert!(!parsed.blocking);
    }

    #[test]
    fn old_project_metadata_migrates_with_a_backup_and_future_schema_stays_read_only() {
        let parent = test_root("agent-lab-migration");
        fs::create_dir_all(&parent).unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Migration Test".to_string(),
        )
        .unwrap();
        let metadata_path = PathBuf::from(&project.root).join("agent-lab.json");
        let original = fs::read_to_string(&metadata_path).unwrap();
        let mut old: serde_json::Value = serde_json::from_str(&original).unwrap();
        old["schemaVersion"] = serde_json::Value::from(0);
        fs::write(&metadata_path, serde_json::to_vec_pretty(&old).unwrap()).unwrap();
        let reopened = open_project(project.root.clone()).unwrap();
        assert_eq!(reopened.project.name, "Migration Test");
        assert!(PathBuf::from(&project.root)
            .join(".agent-lab-migrations")
            .is_dir());
        let migrated = fs::read_to_string(&metadata_path).unwrap();
        assert!(migrated.contains("\"schemaVersion\": 1"));
        let mut future: serde_json::Value = serde_json::from_str(&migrated).unwrap();
        future["schemaVersion"] = serde_json::Value::from(999);
        fs::write(&metadata_path, serde_json::to_vec_pretty(&future).unwrap()).unwrap();
        assert!(open_project(project.root.clone()).is_err());
        assert_eq!(
            fs::read_to_string(&metadata_path).unwrap(),
            serde_json::to_string_pretty(&future).unwrap()
        );
        fs::remove_dir_all(parent).unwrap();
    }

    #[test]
    fn missing_or_corrupt_metadata_has_a_safe_recovery_path() {
        let parent = test_root("agent-lab-metadata-errors");
        fs::create_dir_all(&parent).unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Metadata Errors".to_string(),
        )
        .unwrap();
        let root = PathBuf::from(&project.root);
        fs::remove_file(root.join("agent-lab.json")).unwrap();
        let reconstructed = open_project(project.root.clone()).unwrap();
        assert_eq!(reconstructed.project.name, "Metadata Errors");
        fs::write(root.join("agent-lab.json"), "{not-json").unwrap();
        assert!(open_project(project.root.clone()).is_err());
        assert!(read_project_document(project.root, "missing.md".to_string()).is_err());
        fs::remove_dir_all(parent).unwrap();
    }

    #[test]
    fn failed_migration_keeps_original_metadata_and_backup() {
        let parent = test_root("agent-lab-migration-failure");
        fs::create_dir_all(&parent).unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Migration Failure".to_string(),
        )
        .unwrap();
        let root = PathBuf::from(&project.root);
        let metadata = root.join("agent-lab.json");
        let mut old: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(&metadata).unwrap()).unwrap();
        old["schemaVersion"] = serde_json::Value::from(0);
        fs::write(&metadata, serde_json::to_vec_pretty(&old).unwrap()).unwrap();
        fs::create_dir(metadata.with_extension("json.migrating")).unwrap();
        assert!(open_project(project.root).is_err());
        assert!(root.join(".agent-lab-migrations").is_dir());
        assert!(fs::read_to_string(&metadata)
            .unwrap()
            .contains("\"schemaVersion\": 0"));
        fs::remove_dir_all(parent).unwrap();
    }

    #[test]
    fn inspect_project_is_read_only_and_detects_agent_folders() {
        let root = test_root("agent-lab-import-inspect");
        fs::create_dir_all(root.join("agents/researcher")).unwrap();
        fs::write(root.join("AGENTS.md"), "instructions").unwrap();
        let summary = inspect_project(root.to_string_lossy().into_owned()).unwrap();
        assert!(summary.recognized.contains(&"AGENTS.md".to_string()));
        assert_eq!(summary.agent_folders, vec!["agents/researcher"]);
        assert!(!root.join("agent-lab.json").exists());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    #[cfg(unix)]
    fn project_scan_skips_symlinked_agent_directories_and_files() {
        use std::os::unix::fs::symlink;
        let root = test_root("agent-lab-scan-symlink");
        let outside = test_root("agent-lab-scan-symlink-outside");
        fs::create_dir_all(root.join("agents/real")).unwrap();
        fs::create_dir_all(&outside).unwrap();
        fs::write(
            root.join("agents/real/AGENT.md"),
            "# Real\n\n## Purpose\n\nStay inside.\n",
        )
        .unwrap();
        fs::write(
            outside.join("AGENT.md"),
            "# Escaped\n\n## Purpose\n\nOutside root.\n",
        )
        .unwrap();
        symlink(&outside, root.join("agents/escaped")).unwrap();
        symlink(
            outside.join("AGENT.md"),
            root.join("agents/real/OUTSIDE.md"),
        )
        .unwrap();
        let summary = inspect_project(root.to_string_lossy().into_owned()).unwrap();
        assert_eq!(summary.agent_folders, vec!["agents/real"]);
        let snapshot = open_project(root.to_string_lossy().into_owned()).unwrap();
        assert_eq!(snapshot.agents.len(), 1);
        assert_eq!(snapshot.agents[0].files.len(), 1);
        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(outside).unwrap();
    }

    #[test]
    fn discovers_local_skills_and_marks_scripts_inert() {
        let root = test_root("agent-lab-skills");
        fs::create_dir_all(root.join("skills/fact-check/scripts")).unwrap();
        fs::write(
            root.join("skills/fact-check/SKILL.md"),
            "# Fact check\n\nVerify claims locally.\n",
        )
        .unwrap();
        fs::write(
            root.join("skills/fact-check/scripts/check.sh"),
            "echo never-run\n",
        )
        .unwrap();
        let found = skills::discover(&root).unwrap();
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].id, "skill:fact-check");
        assert!(found[0].files.iter().any(|file| file.executable_looking));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn skill_import_preview_detects_collision_without_copying() {
        let root = test_root("agent-lab-skill-import");
        let source = test_root("agent-lab-skill-source");
        fs::create_dir_all(root.join("skills/fact-check")).unwrap();
        fs::create_dir_all(&source).unwrap();
        fs::write(root.join("skills/fact-check/SKILL.md"), "existing").unwrap();
        fs::write(source.join("SKILL.md"), "incoming").unwrap();
        let preview = skills::inspect_import(&source, &root).unwrap();
        assert!(preview
            .destination
            .starts_with("skills/agent-lab-skill-source-"));
        assert!(preview.collisions.is_empty());
        assert!(!root.join("skills/agent-lab-skill-source").exists());
        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(source).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn skill_import_rejects_source_and_destination_symlinks_without_writing() {
        use std::os::unix::fs::symlink;

        let root = test_root("agent-lab-skill-import-confinement");
        let source = test_root("agent-lab-skill-source-confinement");
        let outside = test_root("agent-lab-skill-outside");
        fs::create_dir_all(root.join("skills")).unwrap();
        fs::create_dir_all(&source).unwrap();
        fs::create_dir_all(&outside).unwrap();
        fs::write(source.join("SKILL.md"), "incoming").unwrap();
        symlink(outside.join("payload.txt"), source.join("payload.txt")).unwrap();
        assert!(skills::inspect_import(&source, &root).is_err());
        assert!(!root
            .join("skills/agent-lab-skill-source-confinement")
            .exists());

        fs::remove_file(source.join("payload.txt")).unwrap();
        let destination = skills::inspect_import(&source, &root).unwrap().destination;
        symlink(&outside, root.join(destination)).unwrap();
        fs::write(outside.join("sentinel.txt"), "untouched").unwrap();
        assert!(skills::apply_import(&source, &root).is_err());
        assert_eq!(
            fs::read_to_string(outside.join("sentinel.txt")).unwrap(),
            "untouched"
        );

        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(source).unwrap();
        fs::remove_dir_all(outside).unwrap();
    }

    #[test]
    fn skill_assignment_is_shared_and_persisted_as_metadata() {
        let root = test_root("agent-lab-skill-assignment");
        fs::create_dir_all(root.join("agents/researcher")).unwrap();
        fs::create_dir_all(root.join("skills/fact-check")).unwrap();
        fs::write(
            root.join("agents/researcher/AGENT.md"),
            "# Researcher\n\n## Purpose\n\nResearch.\n",
        )
        .unwrap();
        fs::write(
            root.join("skills/fact-check/SKILL.md"),
            "# Fact check\n\nVerify.\n",
        )
        .unwrap();
        let assigned = set_skill_assignment(
            root.to_string_lossy().into_owned(),
            "agent:researcher".to_string(),
            "skill:fact-check".to_string(),
            true,
        )
        .unwrap();
        assert_eq!(assigned.len(), 1);
        let reopened = list_skill_assignments(root.to_string_lossy().into_owned()).unwrap();
        assert_eq!(reopened[0].skill_id, "skill:fact-check");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn real_run_is_durable_approval_gated_and_recovers_final_event() {
        let parent = test_root("agent-lab-run");
        fs::create_dir_all(&parent).unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Run Test".to_string(),
        )
        .unwrap();
        let project = create_agent(
            project.root,
            "Researcher".to_string(),
            "Find facts.".to_string(),
        )
        .unwrap();
        let project = create_agent(
            project.root,
            "Analyst".to_string(),
            "Assess facts.".to_string(),
        )
        .unwrap();
        let root = PathBuf::from(&project.root);
        let mut metadata = read_or_reconstruct_metadata(&root).unwrap();
        metadata.graph.edges.push(GraphEdge {
            id: "research-handoff".to_string(),
            source: "agent:researcher".to_string(),
            target: "agent:analyst".to_string(),
            relation: "handoff".to_string(),
            payload: "facts".to_string(),
            ..GraphEdge::default()
        });
        write_metadata(&root, &metadata).unwrap();
        let run = run_engine::start(
            &root,
            "agent:researcher".to_string(),
            "Review local notes".to_string(),
        )
        .unwrap();
        assert_eq!(run.state, "waiting");
        assert!(root.join("runs/run-0001/task.md").is_file());
        assert!(root
            .join("runs/run-0001/handoffs/research-handoff.json")
            .is_file());
        assert!(!root.join("agents/researcher/task.md").exists());
        fs::OpenOptions::new()
            .append(true)
            .open(root.join("runs/run-0001/events.jsonl"))
            .unwrap()
            .write_all(b"{broken")
            .unwrap();
        assert_eq!(runs::read_events(&root, &run.id).unwrap().len(), 2);
        let sequences = runs::read_events(&root, &run.id)
            .unwrap()
            .iter()
            .map(|event| event.sequence)
            .collect::<Vec<_>>();
        assert_eq!(sequences, vec![0, 1]);
        let completed = run_engine::decide(&root, run.id.clone(), true).unwrap();
        assert_eq!(completed.state, "complete");
        assert!(root.join("runs/run-0001/outputs/result.md").is_file());
        let listed = runs::list(&root).unwrap();
        assert_eq!(listed[0].id, run.id);
        fs::remove_dir_all(parent).unwrap();
    }

    #[test]
    fn run_provider_failure_is_durable_and_run_paths_reject_symlinks() {
        let parent = test_root("agent-lab-run-failure");
        fs::create_dir_all(&parent).unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Run Failure".to_string(),
        )
        .unwrap();
        let project = create_agent(
            project.root,
            "Researcher".to_string(),
            "Find facts.".to_string(),
        )
        .unwrap();
        let root = PathBuf::from(&project.root);
        let run = run_engine::start(
            &root,
            "agent:researcher".to_string(),
            "[provider-failure]".to_string(),
        )
        .unwrap();
        let failed = run_engine::decide(&root, run.id.clone(), true).unwrap();
        assert_eq!(failed.state, "failed");
        assert!(failed.last_error.is_some());
        assert!(runs::read_events(&root, &run.id)
            .unwrap()
            .iter()
            .any(|event| event.kind == "provider_failed"));
        #[cfg(unix)]
        {
            use std::os::unix::fs::symlink;
            let outside = test_root("agent-lab-run-outside");
            fs::create_dir_all(&outside).unwrap();
            let escaped_run = run_engine::start(
                &root,
                "agent:researcher".to_string(),
                "escaped output".to_string(),
            )
            .unwrap();
            fs::remove_dir(root.join(format!("runs/{}/outputs", escaped_run.id))).unwrap();
            symlink(
                &outside,
                root.join(format!("runs/{}/outputs", escaped_run.id)),
            )
            .unwrap();
            assert!(run_engine::decide(&root, escaped_run.id, true).is_err());
            fs::remove_dir_all(&outside).unwrap();
        }
        fs::remove_dir_all(parent).unwrap();
    }

    #[test]
    fn apply_template_writes_exact_preview_or_nothing() {
        let parent = test_root("agent-lab-template-apply");
        fs::create_dir_all(&parent).unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Template Test".to_string(),
        )
        .unwrap();
        let agents = vec![
            TemplateAgent {
                id: "agent:researcher".to_string(),
                name: "Researcher".to_string(),
                purpose: "Research.".to_string(),
            },
            TemplateAgent {
                id: "agent:analyst".to_string(),
                name: "Analyst".to_string(),
                purpose: "Analyze.".to_string(),
            },
        ];
        let files = vec![
            TemplateFile {
                path: "agents/researcher/AGENT.md".to_string(),
                content: "# Researcher".to_string(),
            },
            TemplateFile {
                path: "agents/analyst/AGENT.md".to_string(),
                content: "# Analyst".to_string(),
            },
        ];
        let edge = GraphEdge {
            id: "edge:agent:researcher->agent:analyst:handoff".to_string(),
            source: "agent:researcher".to_string(),
            target: "agent:analyst".to_string(),
            relation: "handoff".to_string(),
            ..GraphEdge::default()
        };
        let applied = apply_template(project.root.clone(), agents, files, vec![edge]).unwrap();
        assert_eq!(applied.graph.nodes.len(), 2);
        assert_eq!(applied.graph.edges.len(), 1);
        let before =
            fs::read_to_string(PathBuf::from(&project.root).join("agent-lab.json")).unwrap();
        assert!(apply_template(
            project.root.clone(),
            vec![TemplateAgent {
                id: "agent:broken".to_string(),
                name: "Broken".to_string(),
                purpose: "".to_string()
            }],
            vec![TemplateFile {
                path: "agents/broken/AGENT.md".to_string(),
                content: "# Broken".to_string()
            }],
            vec![]
        )
        .is_err());
        assert_eq!(
            fs::read_to_string(PathBuf::from(&project.root).join("agent-lab.json")).unwrap(),
            before
        );
        fs::remove_dir_all(parent).unwrap();
    }

    #[test]
    fn edge_commands_validate_endpoints_relations_and_persist_contract() {
        let (parent, project) = recovery_project();
        let edge = GraphEdge {
            id: "edge:researcher->analyst:handoff".to_string(),
            source: "agent:researcher".to_string(),
            target: "agent:analyst".to_string(),
            relation: "handoff".to_string(),
            label: "Validated report".to_string(),
            description: "Research is complete.".to_string(),
            payload: "Markdown report".to_string(),
            blocking: true,
            condition: "When complete".to_string(),
        };
        let saved = upsert_edge(project.root.clone(), edge.clone()).unwrap();
        assert!(saved.graph.edges.iter().any(|item| item == &edge));
        assert!(upsert_edge(
            project.root.clone(),
            GraphEdge {
                source: "agent:researcher".to_string(),
                target: "agent:researcher".to_string(),
                ..edge.clone()
            }
        )
        .is_err());
        assert!(upsert_edge(
            project.root.clone(),
            GraphEdge {
                source: "agent:missing".to_string(),
                ..edge.clone()
            }
        )
        .is_err());
        assert!(upsert_edge(
            project.root.clone(),
            GraphEdge {
                id: "other".to_string(),
                ..edge.clone()
            }
        )
        .is_err());
        let reopened = open_project(project.root.clone()).unwrap();
        assert_eq!(
            reopened
                .graph
                .edges
                .iter()
                .find(|item| item.id == edge.id)
                .unwrap()
                .payload,
            "Markdown report"
        );
        let edge_id = edge.id.clone();
        let deleted = delete_edge(project.root, edge.id).unwrap();
        assert!(deleted.graph.edges.iter().all(|item| item.id != edge_id));
        fs::remove_dir_all(parent).unwrap();
    }

    #[test]
    fn filesystem_inventory_excludes_macos_metadata() {
        let parent = test_root("agent-lab-macos-metadata");
        fs::create_dir_all(&parent).unwrap();
        let project = create_project(
            parent.to_string_lossy().into_owned(),
            "Metadata Test".to_string(),
        )
        .unwrap();
        let project = create_agent(
            project.root,
            "Researcher".to_string(),
            "Find facts.".to_string(),
        )
        .unwrap();
        let root = PathBuf::from(&project.root);
        fs::write(root.join(".DS_Store"), [0, 1, 2, 3]).unwrap();
        fs::write(root.join("agents/researcher/.DS_Store"), [0, 1, 2, 3]).unwrap();

        let files = list_project_files(project.root.clone()).unwrap();
        assert!(files.iter().all(|file| !file.path.contains(".DS_Store")));
        let reopened = open_project(project.root).unwrap();
        assert!(reopened.agents[0]
            .files
            .iter()
            .all(|file| !file.path.ends_with(".DS_Store")));
        fs::remove_dir_all(parent).unwrap();
    }
}
