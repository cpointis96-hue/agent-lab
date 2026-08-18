use serde_json::Value;
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn load(root: &Path, current_version: u32) -> Result<Value, String> {
    let metadata = root.join("agent-lab.json");
    if !metadata.is_file() {
        return Err("Project metadata is missing.".to_string());
    }
    let content = fs::read_to_string(&metadata)
        .map_err(|error| format!("Could not read agent-lab.json: {error}"))?;
    let mut value: Value = serde_json::from_str(&content)
        .map_err(|error| format!("Could not parse agent-lab.json: {error}"))?;
    let version = value
        .get("schemaVersion")
        .and_then(Value::as_u64)
        .ok_or_else(|| "agent-lab.json has no schemaVersion.".to_string())?
        as u32;
    if version > current_version {
        return Err(format!(
            "Unsupported agent-lab.json schema version {version}."
        ));
    }
    if version == current_version {
        return Ok(value);
    }
    let backup_dir = root.join(".agent-lab-migrations").join(format!(
        "{}-{version}-to-{current_version}",
        migration_stamp()
    ));
    fs::create_dir_all(&backup_dir)
        .map_err(|error| format!("Could not create migration backup: {error}"))?;
    fs::copy(&metadata, backup_dir.join("agent-lab.json"))
        .map_err(|error| format!("Could not back up metadata before migration: {error}"))?;
    value["schemaVersion"] = Value::from(current_version);
    let temporary = metadata.with_extension("json.migrating");
    let encoded = serde_json::to_vec_pretty(&value)
        .map_err(|error| format!("Could not encode migrated metadata: {error}"))?;
    fs::write(&temporary, encoded)
        .map_err(|error| format!("Could not stage migrated metadata: {error}"))?;
    fs::rename(&temporary, &metadata)
        .map_err(|error| format!("Could not commit migrated metadata: {error}"))?;
    Ok(value)
}

fn migration_stamp() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}
