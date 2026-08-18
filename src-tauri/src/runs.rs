use serde::{Deserialize, Serialize};
use std::fs::{self, File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RunSummary {
    pub id: String,
    pub task: String,
    pub agent_id: String,
    pub state: String,
    pub provider: String,
    pub created_at: u128,
    pub updated_at: u128,
    pub calls: u32,
    pub input_tokens: Option<u32>,
    pub output_tokens: Option<u32>,
    pub estimated_cost: Option<f64>,
    pub cost_source: String,
    pub last_error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RunEvent {
    pub sequence: u64,
    pub kind: String,
    pub state: String,
    pub message: String,
    pub at: u128,
}

pub fn runs_root(root: &Path) -> PathBuf {
    root.join("runs")
}
pub fn run_dir(root: &Path, id: &str) -> Result<PathBuf, String> {
    if !id.starts_with("run-") || id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err("Invalid run id.".to_string());
    }
    let runs = runs_root(root);
    if fs::symlink_metadata(&runs)
        .map(|metadata| metadata.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err("Runs directory cannot be a symlink.".to_string());
    }
    let directory = runs.join(id);
    if fs::symlink_metadata(&directory)
        .map(|metadata| metadata.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err("Run directory cannot be a symlink.".to_string());
    }
    if let Ok(canonical) = directory.canonicalize() {
        if !canonical.starts_with(&runs.canonicalize().unwrap_or(runs.clone())) {
            return Err("Run path escaped project root.".to_string());
        }
    }
    Ok(directory)
}

pub fn now() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or(0)
}

pub fn next_id(root: &Path) -> Result<String, String> {
    let root = runs_root(root);
    if fs::symlink_metadata(&root)
        .map(|metadata| metadata.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err("Runs directory cannot be a symlink.".to_string());
    }
    fs::create_dir_all(&root)
        .map_err(|error| format!("Could not create runs directory: {error}"))?;
    let mut highest = 0u64;
    for entry in fs::read_dir(root).map_err(|error| format!("Could not read runs: {error}"))? {
        let name = entry
            .map_err(|error| format!("Could not inspect run: {error}"))?
            .file_name()
            .to_string_lossy()
            .to_string();
        if let Some(number) = name
            .strip_prefix("run-")
            .and_then(|value| value.parse::<u64>().ok())
        {
            highest = highest.max(number);
        }
    }
    Ok(format!("run-{highest:04}", highest = highest + 1))
}

pub fn write_json<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
    let temporary = path.with_extension("tmp");
    let content = serde_json::to_vec_pretty(value)
        .map_err(|error| format!("Could not encode run data: {error}"))?;
    fs::write(&temporary, content).map_err(|error| format!("Could not stage run data: {error}"))?;
    fs::rename(&temporary, path).map_err(|error| format!("Could not commit run data: {error}"))
}

pub fn read_summary(root: &Path, id: &str) -> Result<RunSummary, String> {
    let directory = run_dir(root, id)?;
    let content = fs::read_to_string(directory.join("run.json"))
        .map_err(|error| format!("Could not read run: {error}"))?;
    serde_json::from_str(&content).map_err(|error| format!("Could not decode run: {error}"))
}

pub fn append_event(root: &Path, id: &str, event: &RunEvent) -> Result<(), String> {
    static EVENT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    let _guard = EVENT_LOCK
        .get_or_init(|| Mutex::new(()))
        .lock()
        .map_err(|_| "Run event lock poisoned.".to_string())?;
    let existing = read_events(root, id)?;
    let mut event = event.clone();
    event.sequence = existing.len() as u64;
    let directory = run_dir(root, id)?;
    let path = directory.join("events.jsonl");
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|error| format!("Could not open run events: {error}"))?;
    serde_json::to_writer(&mut file, &event)
        .map_err(|error| format!("Could not encode run event: {error}"))?;
    file.write_all(b"\n")
        .map_err(|error| format!("Could not append run event: {error}"))?;
    file.sync_all()
        .map_err(|error| format!("Could not sync run event: {error}"))
}

pub fn artifact_dir(root: &Path, id: &str, name: &str) -> Result<PathBuf, String> {
    if !matches!(name, "approvals" | "handoffs" | "outputs") {
        return Err("Invalid run artifact directory.".to_string());
    }
    let directory = run_dir(root, id)?;
    let artifact = directory.join(name);
    if fs::symlink_metadata(&artifact)
        .map(|metadata| metadata.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err(format!(
            "Run artifact directory `{name}` cannot be a symlink."
        ));
    }
    if !artifact.exists() {
        fs::create_dir(&artifact)
            .map_err(|error| format!("Could not create run artifact directory: {error}"))?;
    }
    let canonical_root = root
        .canonicalize()
        .map_err(|error| format!("Could not resolve project root: {error}"))?;
    let canonical = artifact
        .canonicalize()
        .map_err(|error| format!("Could not resolve run artifact directory: {error}"))?;
    if !canonical.starts_with(&canonical_root) {
        return Err("Run artifact path escaped project root.".to_string());
    }
    Ok(artifact)
}

pub fn read_events(root: &Path, id: &str) -> Result<Vec<RunEvent>, String> {
    let path = run_dir(root, id)?.join("events.jsonl");
    if !path.is_file() {
        return Ok(Vec::new());
    }
    let reader = BufReader::new(
        File::open(path).map_err(|error| format!("Could not read run events: {error}"))?,
    );
    let mut events = Vec::new();
    for line in reader.lines() {
        let line = line.map_err(|error| format!("Could not read run event: {error}"))?;
        match serde_json::from_str::<RunEvent>(&line) {
            Ok(event) => events.push(event),
            Err(_) => break,
        }
    }
    Ok(events)
}

pub fn list(root: &Path) -> Result<Vec<RunSummary>, String> {
    let directory = runs_root(root);
    if !directory.is_dir() {
        return Ok(Vec::new());
    }
    let mut result = Vec::new();
    for entry in fs::read_dir(directory).map_err(|error| format!("Could not read runs: {error}"))? {
        let path = entry
            .map_err(|error| format!("Could not inspect run: {error}"))?
            .path();
        if path.is_dir() && path.join("run.json").is_file() {
            if let Ok(summary) = serde_json::from_str::<RunSummary>(
                &fs::read_to_string(path.join("run.json"))
                    .map_err(|error| format!("Could not read run: {error}"))?,
            ) {
                result.push(summary);
            }
        }
    }
    result.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(result)
}
