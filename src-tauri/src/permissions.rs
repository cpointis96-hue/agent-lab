use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PermissionPolicy {
    pub allowed_tools: Vec<String>,
    pub sensitive_tools: Vec<String>,
}

impl Default for PermissionPolicy {
    fn default() -> Self {
        Self {
            allowed_tools: vec!["read_project".to_string()],
            sensitive_tools: vec!["write_project".to_string(), "network".to_string()],
        }
    }
}

pub fn requires_approval(tool: &str, policy: &PermissionPolicy) -> bool {
    policy.sensitive_tools.iter().any(|item| item == tool)
        && !policy.allowed_tools.iter().any(|item| item == tool)
}
