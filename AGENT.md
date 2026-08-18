# Agent Lab — Engineering Principles

Agent Lab is a small Tauri 2 + React + TypeScript macOS application. Prefer the smallest coherent implementation, explicit responsibilities, minimal dependencies, and readable local Markdown.

The filesystem is the source of truth. `agent-lab.json` stores application metadata only. Never silently overwrite or permanently delete user files. Validate and canonicalize paths, reject traversal and symlink escapes, keep destructive actions explicit and recoverable, and never execute arbitrary project-file content.

Preserve clarity, reliability, simplicity, local transparency, and educational value before visual polish or extensibility. Keep filesystem logic separate from presentation logic where practical.
