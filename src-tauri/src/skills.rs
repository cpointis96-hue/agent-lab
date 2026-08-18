use serde::Serialize;
use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Skill {
    pub id: String,
    pub slug: String,
    pub name: String,
    pub description: String,
    pub path: String,
    pub files: Vec<SkillFile>,
    pub trust_status: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct SkillFile {
    pub path: String,
    pub size: u64,
    pub executable_looking: bool,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImportPreview {
    pub skill_name: String,
    pub destination: String,
    pub files: Vec<SkillFile>,
    pub collisions: Vec<String>,
    pub has_executable_looking_files: bool,
}

pub fn inspect_import(source: &Path, root: &Path) -> Result<ImportPreview, String> {
    if fs::symlink_metadata(source)
        .map(|metadata| metadata.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err("Skill source symlinks are not allowed.".to_string());
    }
    let source = source.canonicalize().map_err(|_| {
        "Skill folder unavailable. Choose an existing folder containing SKILL.md.".to_string()
    })?;
    if !source.is_dir() || !real_file(&source.join("SKILL.md")) {
        return Err("Skill source must be a directory containing SKILL.md.".to_string());
    }
    let slug = source
        .file_name()
        .and_then(|name| name.to_str())
        .map(|name| {
            name.to_lowercase()
                .replace(|c: char| !c.is_ascii_alphanumeric() && c != '-', "-")
        })
        .ok_or_else(|| "Invalid skill source name.".to_string())?;
    let destination = format!("skills/{}", slug.trim_matches('-'));
    let mut files = Vec::new();
    collect_import_files(&source, &source, &mut files)?;
    let collisions = files
        .iter()
        .filter(|file| fs::symlink_metadata(root.join(&destination).join(&file.path)).is_ok())
        .map(|file| file.path.clone())
        .collect::<Vec<_>>();
    Ok(ImportPreview {
        skill_name: slug,
        destination,
        collisions,
        has_executable_looking_files: files.iter().any(|file| file.executable_looking),
        files,
    })
}

pub fn apply_import(source: &Path, root: &Path) -> Result<Vec<Skill>, String> {
    let preview = inspect_import(source, root)?;
    if !preview.collisions.is_empty() {
        return Err(format!(
            "Skill import collision: {}",
            preview.collisions.join(", ")
        ));
    }
    let source = source.canonicalize().map_err(|_| {
        "Skill folder unavailable. Choose an existing folder containing SKILL.md.".to_string()
    })?;
    let root = root
        .canonicalize()
        .map_err(|error| format!("Could not resolve project root: {error}"))?;
    let skills_root = root.join("skills");
    if fs::symlink_metadata(&skills_root)
        .map(|metadata| metadata.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err("Skill destination root cannot be a symlink.".to_string());
    }
    fs::create_dir_all(&skills_root)
        .map_err(|error| format!("Could not create skills directory: {error}"))?;
    let destination = confined_destination(&root, &preview.destination)?;
    if fs::symlink_metadata(&destination).is_ok() {
        return Err("Skill import destination already exists.".to_string());
    }
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| "Could not create temporary import name.".to_string())?
        .as_nanos();
    let temporary =
        destination.with_file_name(format!(".{}-importing-{stamp}", preview.skill_name));
    let result = (|| {
        fs::create_dir(&temporary)
            .map_err(|error| format!("Could not create skill staging directory: {error}"))?;
        copy_files(&source, &source, &temporary)?;
        fs::rename(&temporary, &destination)
            .map_err(|error| format!("Could not finalize skill import: {error}"))
    })();
    if result.is_err() {
        let _ = fs::remove_dir_all(&temporary);
    }
    result?;
    discover(&root)
}

fn confined_destination(root: &Path, relative: &str) -> Result<std::path::PathBuf, String> {
    let destination = root.join(relative);
    let parent = destination
        .parent()
        .ok_or_else(|| "Invalid skill destination.".to_string())?;
    for component in destination
        .strip_prefix(root)
        .unwrap_or(&destination)
        .components()
    {
        let current = root.join(component);
        if fs::symlink_metadata(&current)
            .map(|metadata| metadata.file_type().is_symlink())
            .unwrap_or(false)
        {
            return Err("Skill destination contains a symlink.".to_string());
        }
    }
    if !parent.starts_with(root) {
        return Err("Skill destination escaped project root.".to_string());
    }
    Ok(destination)
}

pub fn discover(root: &Path) -> Result<Vec<Skill>, String> {
    let skills_root = root.join("skills");
    if !real_dir(&skills_root) {
        return Ok(Vec::new());
    }
    let mut result = Vec::new();
    for entry in
        fs::read_dir(&skills_root).map_err(|error| format!("Could not read skills: {error}"))?
    {
        let entry = entry.map_err(|error| format!("Could not inspect skill: {error}"))?;
        let directory = entry.path();
        if !real_dir(&directory) {
            continue;
        }
        let Some(slug) = entry.file_name().to_str().map(str::to_string) else {
            continue;
        };
        let skill_file = directory.join("SKILL.md");
        if !real_file(&skill_file) {
            continue;
        }
        let content = fs::read_to_string(&skill_file)
            .map_err(|error| format!("Could not read skills/{slug}/SKILL.md: {error}"))?;
        let description = content
            .lines()
            .map(str::trim)
            .find(|line| !line.is_empty() && !line.starts_with('#'))
            .unwrap_or("Local procedural skill")
            .to_string();
        let mut files = Vec::new();
        collect_files(root, &directory, &mut files)?;
        files.sort_by(|a, b| a.path.cmp(&b.path));
        result.push(Skill {
            id: format!("skill:{slug}"),
            slug: slug.clone(),
            name: slug.replace('-', " "),
            description,
            path: format!("skills/{slug}"),
            files,
            trust_status: "Local · inert".to_string(),
        });
    }
    result.sort_by(|a, b| a.slug.cmp(&b.slug));
    Ok(result)
}

fn collect_files(root: &Path, directory: &Path, files: &mut Vec<SkillFile>) -> Result<(), String> {
    for entry in
        fs::read_dir(directory).map_err(|error| format!("Could not read skill files: {error}"))?
    {
        let entry = entry.map_err(|error| format!("Could not inspect skill file: {error}"))?;
        let path = entry.path();
        let metadata = fs::symlink_metadata(&path)
            .map_err(|error| format!("Could not inspect {}: {error}", path.display()))?;
        if metadata.file_type().is_symlink() {
            continue;
        }
        if metadata.is_dir() {
            collect_files(root, &path, files)?;
            continue;
        }
        if !metadata.is_file() {
            continue;
        }
        let relative = path
            .strip_prefix(root)
            .map_err(|_| "Skill path escaped project root.".to_string())?
            .to_string_lossy()
            .replace('\\', "/");
        let executable_looking = path
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| matches!(ext, "sh" | "command" | "js" | "py" | "rb"));
        files.push(SkillFile {
            path: relative,
            size: metadata.len(),
            executable_looking,
        });
    }
    Ok(())
}

fn collect_import_files(
    root: &Path,
    directory: &Path,
    files: &mut Vec<SkillFile>,
) -> Result<(), String> {
    for entry in
        fs::read_dir(directory).map_err(|error| format!("Could not read skill files: {error}"))?
    {
        let entry = entry.map_err(|error| format!("Could not inspect skill file: {error}"))?;
        let path = entry.path();
        let metadata = fs::symlink_metadata(&path)
            .map_err(|error| format!("Could not inspect {}: {error}", path.display()))?;
        if metadata.file_type().is_symlink() {
            return Err("Skill source contains a symlink; import cancelled.".to_string());
        }
        if metadata.is_dir() {
            collect_import_files(root, &path, files)?;
        } else if metadata.is_file() {
            let relative = path
                .strip_prefix(root)
                .map_err(|_| "Skill path escaped source root.".to_string())?
                .to_string_lossy()
                .replace('\\', "/");
            let executable_looking = path
                .extension()
                .and_then(|ext| ext.to_str())
                .is_some_and(|ext| matches!(ext, "sh" | "command" | "js" | "py" | "rb"));
            files.push(SkillFile {
                path: relative,
                size: metadata.len(),
                executable_looking,
            });
        }
    }
    Ok(())
}

fn copy_files(source_root: &Path, directory: &Path, destination_root: &Path) -> Result<(), String> {
    for entry in
        fs::read_dir(directory).map_err(|error| format!("Could not read import: {error}"))?
    {
        let entry = entry.map_err(|error| format!("Could not inspect import: {error}"))?;
        let path = entry.path();
        let metadata = fs::symlink_metadata(&path)
            .map_err(|error| format!("Could not inspect import file: {error}"))?;
        if metadata.file_type().is_symlink() {
            return Err("Skill import contains a symlink; import cancelled.".to_string());
        }
        let relative = path
            .strip_prefix(source_root)
            .map_err(|_| "Skill import escaped source root.".to_string())?;
        let destination = destination_root.join(relative);
        if metadata.is_dir() {
            fs::create_dir_all(&destination)
                .map_err(|error| format!("Could not create imported directory: {error}"))?;
            copy_files(source_root, &path, destination_root)?;
        } else if metadata.is_file() {
            if let Some(parent) = destination.parent() {
                fs::create_dir_all(parent)
                    .map_err(|error| format!("Could not create imported parent: {error}"))?;
            }
            fs::copy(&path, &destination)
                .map_err(|error| format!("Could not copy imported file: {error}"))?;
        }
    }
    Ok(())
}

fn real_dir(path: &Path) -> bool {
    fs::symlink_metadata(path)
        .map(|m| m.is_dir() && !m.file_type().is_symlink())
        .unwrap_or(false)
}
fn real_file(path: &Path) -> bool {
    fs::symlink_metadata(path)
        .map(|m| m.is_file() && !m.file_type().is_symlink())
        .unwrap_or(false)
}
