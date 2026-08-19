# Agent Lab — Engineering Principles

Agent Lab is a small Tauri 2 + React + TypeScript macOS application. Prefer the smallest coherent implementation, explicit responsibilities, minimal dependencies, and readable local Markdown.

The filesystem is the source of truth. `agent-lab.json` stores application metadata only. Never silently overwrite or permanently delete user files. Validate and canonicalize paths, reject traversal and symlink escapes, keep destructive actions explicit and recoverable, and never execute arbitrary project-file content.

Preserve clarity, reliability, simplicity, local transparency, and educational value before visual polish or extensibility. Keep filesystem logic separate from presentation logic where practical.

## Locked product design

`DESIGN.md` is the visual source of truth. Read it before any UI change. The
current native macOS design is approved and locked: preserve its proportions,
typography, colors, surfaces, radii, selection states, panel composition, and
interaction language. Do not silently redesign or introduce a second styling
system. Behavior and small timing changes remain allowed when explicitly
requested. Visual changes require explicit user approval.
