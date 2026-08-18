# Agent Lab Milestone 2 to V1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Agent Lab from the first post-foundation filesystem milestone through a stable V1.0 educational workbench, while keeping every milestone independently testable, local-first, explainable, and safe.

**Architecture:** Preserve the three-panel Tauri application and real local files as the source of truth. Split the current React and Rust entry points by responsibility only when a milestone needs the boundary; keep `agent-lab.json` limited to visual/application metadata. Use Computer Use for every visible runtime criterion and deterministic terminal checks for types, tests, builds, logs, and filesystem truth.

**Tech Stack:** Tauri 2, Rust 2021, React 19, TypeScript 5.9, Vite 7, CodeMirror 6 when Milestone 2 replaces the textarea, `@xyflow/react` when Milestone 5 adds graph connections, Vitest for focused frontend domain tests, Rust unit/integration tests, Computer Use for macOS UI acceptance.

**Spec:** `PROJECT.md`; implementation policy: `AGENTS.md`, `AGENT.md`, `SUPERVISION.md`; live status: `PLAN.md`.

## Global Constraints

- Target macOS desktop with Tauri 2, React, and TypeScript.
- Real project files are the source of truth; no opaque database stores agent, skill, task, handoff, memory, or output content.
- `agent-lab.json` stores only project format version, visual graph metadata, and UI preferences.
- Manual and educational workflows remain usable without an account, cloud, or AI provider.
- AI mutations always follow `Propose → explain → let edit → apply`.
- Never silently delete or overwrite user-authored files.
- Normalize and validate every path; prevent traversal and symlink escape from the opened project root.
- Never execute imported project or skill content automatically.
- Add no autonomous shell execution, cloud infrastructure, Kubernetes, vector database requirement, marketplace, remote worker, or multi-machine orchestration before V1.0.
- Normal work stays in the primary thread; use one bounded worker only when delegation saves more time than its context/handoff cost. No nested or concurrent writers.
- The primary thread owns integration, architecture, `PLAN.md`, and milestone progression.
- Every milestone ends with one gate: automated checks, rebuilt `.app`, Computer Use journey, filesystem evidence, and one supervisor verdict.
- A repeated failure receives at most three correction cycles on the same evidenced root cause before the primary reports a blocker.

---

## Agent workflow

```text
Primary Builder + Orchestrator
  │
  ├── implements directly, or dispatches one milestone-worker
  │      └── exact task, files, interfaces, checks; no nesting
  │
  ├── reviews and integrates the result
  ├── runs targeted deterministic checks
  ├── uses Computer Use only for the affected UI/runtime path
  └── invokes one supervisor at the milestone gate
          ├── PASS → update PLAN.md and unlock next milestone
          ├── FAIL → smallest correction brief → fix → recheck
          └── evidence gap → primary performs missing Computer Use check
```

The `milestone-worker` is exceptional. The `supervisor` never implements product code. Full UI walkthroughs happen once at milestone gates; small fixes use only targeted checks and, when needed, the affected runtime path.

## Current baseline

Milestone 1 is complete. The real `.app` has been validated with Computer Use for project open, agent creation, real `AGENT.md` creation, editing, saving, node display, node movement, close, relaunch, reopen, and persistence. Baseline commands currently pass:

```bash
npm run typecheck
npm run build
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo test --offline --manifest-path src-tauri/Cargo.toml
```

Known baseline facts that shape Milestone 2:

- `src/App.tsx` owns too many UI responsibilities and should be split without changing behavior first.
- `src-tauri/src/lib.rs` owns domain models, commands, filesystem rules, and tests in one file.
- Rust already exposes `reveal_in_finder`, but the frontend does not expose or call it.
- Agent directories are scanned, but the project does not yet expose a complete real-file inventory.
- File reads return content only, so external-change conflict detection has no revision contract.
- There is no file watcher, CodeMirror integration, frontend test runner, file catalog, edge editor, or template workflow yet.

---

# Milestone 2 — Filesystem transparency and conflict-safe Markdown editing

## Outcome

The navigator reflects the real project tree, any supported Markdown file can be edited, external changes are detected without silent overwrite, and Finder reveal works from the rebuilt `.app`.

### Task 1: Record the Milestone 1 baseline and split responsibilities without behavior change

**Files:**
- Modify: `package.json`
- Modify: `src/App.tsx`
- Modify: `src/api.ts`
- Create: `src/domain/project.ts`
- Create: `src/services/projectService.ts`
- Create: `src/components/WelcomeScreen.tsx`
- Create: `src/components/ProjectNavigator.tsx`
- Create: `src/components/MarkdownEditor.tsx`
- Create: `src/components/FlowGraph.tsx`
- Create: `src/components/CreateAgentDialog.tsx`
- Create: `src/domain/project.test.ts`
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/src/domain.rs`
- Create: `src-tauri/src/filesystem.rs`
- Create: `src-tauri/src/commands.rs`

**Interfaces:**
- Consumes: current `ProjectSnapshot`, `Agent`, `Graph`, and Tauri command names.
- Produces: the same runtime behavior with domain types in `src/domain/project.ts`, invoke wrappers in `src/services/projectService.ts`, and Rust commands separated from filesystem helpers.

- [ ] **Step 1: Add a focused frontend test runner and baseline scripts**

```json
{
  "scripts": {
    "test": "vitest run",
    "check": "npm run typecheck && npm run test && npm run build"
  },
  "devDependencies": {
    "vitest": "^3.2.0"
  }
}
```

Run: `npm install`

- [ ] **Step 2: Write a failing pure-domain test for selected-file derivation**

```ts
import { describe, expect, it } from "vitest";
import { preferredAgentFile } from "./project";

describe("preferredAgentFile", () => {
  it("prefers AGENT.md without inventing a file", () => {
    expect(preferredAgentFile([
      { path: "agents/researcher/TOOLS.md", kind: "custom" },
      { path: "agents/researcher/AGENT.md", kind: "agent-lab" },
    ])?.path).toBe("agents/researcher/AGENT.md");
  });
});
```

Run: `npm run test -- src/domain/project.test.ts`
Expected: FAIL because `preferredAgentFile` does not exist.

- [ ] **Step 3: Move types and implement the minimal helper**

```ts
export const preferredAgentFile = (files: AgentFile[]) =>
  files.find((file) => file.path.endsWith("/AGENT.md")) ?? files[0] ?? null;
```

- [ ] **Step 4: Extract components and Rust modules without changing command payloads**

Keep `App` as the stateful coordinator. Components receive explicit props and do not call Tauri directly. `commands.rs` owns `#[tauri::command]` functions; `filesystem.rs` owns path confinement and atomic writes; `domain.rs` owns serializable structs.

- [ ] **Step 5: Prove behavior preservation**

Run:

```bash
npm run check
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo test --offline --manifest-path src-tauri/Cargo.toml
```

Computer Use: open the existing project, select an agent, edit without saving, cancel by reopening the agent, create one temporary agent, and confirm the node appears.

- [ ] **Step 6: Commit the isolated refactor**

```bash
git add package.json package-lock.json src src-tauri/src
git commit -m "refactor: separate project UI and filesystem responsibilities"
```

### Task 2: Add a real project-file inventory and revision contract

**Files:**
- Modify: `src-tauri/src/domain.rs`
- Modify: `src-tauri/src/filesystem.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src/services/projectService.ts`
- Modify: `src/domain/project.ts`

**Interfaces:**
- Produces `ProjectFile`, `FileDocument`, `list_project_files`, `read_project_document`, and conflict-aware `write_project_document`.

- [ ] **Step 1: Write Rust tests for inventory, confinement, and revisions**

```rust
#[test]
fn project_inventory_is_sorted_and_excludes_agent_lab_metadata() {
    let files = list_project_files_for_root(&fixture_root()).unwrap();
    assert!(files.windows(2).all(|pair| pair[0].path <= pair[1].path));
    assert!(files.iter().all(|file| file.path != "agent-lab.json"));
}

#[test]
fn stale_revision_cannot_overwrite_external_content() {
    let opened = read_document_for_root(&fixture_root(), "PROJECT.md").unwrap();
    std::fs::write(fixture_root().join("PROJECT.md"), "external").unwrap();
    let result = write_document_for_root(
        &fixture_root(), "PROJECT.md", "mine", Some(&opened.revision)
    );
    assert!(matches!(result, Err(CommandError { code, .. }) if code == "file_conflict"));
}
```

- [ ] **Step 2: Add serializable domain types**

```rust
pub struct ProjectFile {
    pub path: String,
    pub name: String,
    pub kind: String,
    pub convention: String,
    pub revision: String,
    pub size: u64,
}

pub struct FileDocument {
    pub path: String,
    pub content: String,
    pub revision: String,
}

pub struct CommandError {
    pub code: String,
    pub message: String,
}
```

The revision is a deterministic string derived from canonical path metadata: modified nanoseconds plus file size. Content is read only when the user opens or reloads a file.

- [ ] **Step 3: Implement recursive metadata scanning**

Scan only inside the canonical project root. Do not follow directory symlinks. Exclude `.git`, `node_modules`, `target`, `.agent-lab-recovery`, and `agent-lab.json` from the editable inventory.

- [ ] **Step 4: Expose strict TypeScript wrappers**

```ts
export type FileDocument = { path: string; content: string; revision: string };

export const readProjectDocument = (projectRoot: string, relativePath: string) =>
  invoke<FileDocument>("read_project_document", { projectRoot, relativePath });

export const writeProjectDocument = (
  projectRoot: string,
  relativePath: string,
  content: string,
  expectedRevision: string,
) => invoke<FileDocument>("write_project_document", {
  projectRoot, relativePath, content, expectedRevision,
});
```

- [ ] **Step 5: Run targeted and full backend checks**

Run:

```bash
cargo test --offline --manifest-path src-tauri/Cargo.toml project_inventory
cargo test --offline --manifest-path src-tauri/Cargo.toml stale_revision
cargo test --offline --manifest-path src-tauri/Cargo.toml
npm run typecheck
```

- [ ] **Step 6: Commit the revision contract**

```bash
git add src src-tauri/src
git commit -m "feat: expose conflict-safe project file documents"
```

### Task 3: Replace the agent-only navigator with the real filesystem view

**Files:**
- Modify: `src/components/ProjectNavigator.tsx`
- Modify: `src/App.tsx`
- Create: `src/domain/fileTree.ts`
- Create: `src/domain/fileTree.test.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: sorted `ProjectFile[]`.
- Produces: deterministic `FileTreeNode[]`, accessible file buttons, and `onOpenFile(path)`.

- [ ] **Step 1: Write failing tree tests**

```ts
it("groups nested files without inventing directories", () => {
  expect(buildFileTree([
    file("PROJECT.md"),
    file("agents/researcher/AGENT.md"),
  ])).toMatchObject([
    { kind: "file", path: "PROJECT.md" },
    { kind: "directory", path: "agents", children: [
      { kind: "directory", path: "agents/researcher" },
    ] },
  ]);
});
```

- [ ] **Step 2: Implement immutable tree construction and accessible rendering**

Directory expansion stays in frontend UI state. File selection comes from `selectedFilePath`; agent selection remains linked when the chosen path belongs to an agent.

- [ ] **Step 3: Validate with Computer Use**

Open `PROJECT.md`, root `AGENTS.md`, an agent `AGENT.md`, and a nested custom Markdown file. Confirm each breadcrumb and editor content matches the real file.

- [ ] **Step 4: Commit the real filesystem navigator**

```bash
git add src
git commit -m "feat: show the real project filesystem"
```

### Task 4: Integrate CodeMirror with explicit saved and unsaved state

**Files:**
- Modify: `package.json`
- Modify: `src/components/MarkdownEditor.tsx`
- Create: `src/hooks/useFileDocument.ts`
- Create: `src/domain/editorState.ts`
- Create: `src/domain/editorState.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces editor states `clean | dirty | saving | conflict | error` and explicit `save()`.

- [ ] **Step 1: Add only the required CodeMirror packages**

```bash
npm install @codemirror/state @codemirror/view @codemirror/lang-markdown @codemirror/commands @codemirror/search
```

- [ ] **Step 2: Test the editor state reducer**

```ts
expect(reduceEditor(clean(document), { type: "edit", content: "changed" }).status)
  .toBe("dirty");
expect(reduceEditor(dirty(document), { type: "save-started" }).status)
  .toBe("saving");
```

- [ ] **Step 3: Integrate CodeMirror directly**

Enable Markdown highlighting, undo/redo, search, visible focus, and `⌘S`. Do not add an IDE framework or general state library.

- [ ] **Step 4: Validate editor behavior with Computer Use**

Open a Markdown file, type text, observe `Unsaved`, use `⌘S`, observe `Saved`, close and reopen the project, and confirm the saved content returns.

- [ ] **Step 5: Commit the editor**

```bash
git add package.json package-lock.json src
git commit -m "feat: add a conflict-aware Markdown editor"
```

### Task 5: Detect external changes and resolve conflicts without silent overwrite

**Files:**
- Create: `src/hooks/useProjectFilePoller.ts`
- Create: `src/components/FileConflictDialog.tsx`
- Create: `src/components/FileDiff.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src-tauri/src/commands.rs`

**Interfaces:**
- Consumes: `list_project_files` metadata every 1500 ms while a project is open.
- Produces: batched `added`, `removed`, and `changed` paths; selected-file conflict actions `Reload`, `Compare`, `Keep mine`.

- [ ] **Step 1: Test metadata diffing as a pure function**

```ts
expect(diffFiles(previous, next)).toEqual({
  added: ["shared/CONTEXT.md"],
  removed: [],
  changed: ["agents/researcher/AGENT.md"],
});
```

- [ ] **Step 2: Implement metadata polling without rereading file content**

Pause polling while the app performs a write. Coalesce changes into one state update. Treat rename as removed plus added in Milestone 2.

- [ ] **Step 3: Implement the conflict actions**

`Reload` replaces the buffer with the current disk document. `Compare` shows current disk content beside the unsaved buffer. `Keep mine` retries only with the newly displayed disk revision after the user explicitly chooses it.

- [ ] **Step 4: Validate the real conflict path**

Computer Use opens a file and creates an unsaved edit. A terminal command modifies the same file externally. Computer Use must show `File changed externally`; `Compare` must show both versions; `Reload` and `Keep mine` are each exercised on separate passes. Inspect the final disk file after each pass.

- [ ] **Step 5: Commit external-change handling**

```bash
git add src src-tauri/src
git commit -m "feat: protect edits from external file conflicts"
```

### Task 6: Expose Reveal in Finder and pass the Milestone 2 gate

**Files:**
- Modify: `src/services/projectService.ts`
- Modify: `src/components/ProjectNavigator.tsx`
- Modify: `src/App.tsx`
- Modify: `src-tauri/src/commands.rs`
- Modify: `PLAN.md`

**Interfaces:**
- Produces `revealInFinder(projectRoot, relativePath?)` and contextual project/file actions.

- [ ] **Step 1: Add the frontend wrapper and contextual action**

```ts
export const revealInFinder = (projectRoot: string, relativePath?: string) =>
  invoke<void>("reveal_in_finder", { projectRoot, relativePath: relativePath ?? null });
```

- [ ] **Step 2: Add traversal and missing-path tests**

Run: `cargo test --offline --manifest-path src-tauri/Cargo.toml reveal_in_finder`

- [ ] **Step 3: Run the complete Milestone 2 automated gate**

```bash
npm run check
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo test --offline --manifest-path src-tauri/Cargo.toml
npm run tauri build -- --debug --bundles app
```

- [ ] **Step 4: Run the complete Milestone 2 Computer Use gate in the rebuilt `.app`**

Create or open a disposable project; browse root and nested Markdown files; edit and save; produce an external conflict; resolve it; reveal the project, an agent folder, and a file in Finder; close the window; relaunch; reopen; verify content and clean state. Confirm no persistent loading indicator or inaccessible control.

- [ ] **Step 5: Invoke `supervisor` and update status only on PASS**

The supervisor checks every criterion against direct evidence. On FAIL, apply only the correction brief and repeat the affected checks. On PASS, mark Milestone 2 complete in `PLAN.md`.

---

# Milestone 3 — Safe structural filesystem operations and recovery

## Outcome

Users can create supported files, rename agents transactionally, and remove agents through an explicit recoverable workflow.

### Task 7: Create supported files from the building-block menu

**Files:** `src-tauri/src/commands.rs`, `src-tauri/src/filesystem.rs`, `src/services/projectService.ts`, `src/components/AddFileDialog.tsx`, `src/domain/fileCatalog.ts`.

**Interfaces:** `create_project_file(projectRoot, parentPath, name, initialContent) -> FileDocument`; extensions limited to `.md`, `.json`, `.yaml`, `.yml`, `.txt`.

- [x] Write Rust tests for duplicate names, traversal, unsupported extensions, and `create_new` semantics.
- [x] Implement the command without overwriting existing files.
- [x] Add a contextual `Add file` dialog that previews the exact relative path.
- [x] Use Computer Use to create `TOOLS.md`, verify it on disk, and confirm cancel writes nothing.

### Task 8: Rename an agent transactionally

**Files:** `src-tauri/src/commands.rs`, `src-tauri/src/filesystem.rs`, `src-tauri/src/domain.rs`, `src/services/projectService.ts`, `src/components/RenameAgentDialog.tsx`.

**Interfaces:** `rename_agent(projectRoot, agentId, newName) -> ProjectSnapshot`; update folder path, node ID/path/name, edge endpoints, and metadata in one recoverable operation.

- [x] Write a test with two edges and a conflicting destination folder.
- [x] Stage metadata before rename; roll the folder back if metadata write fails.
- [x] Do not rewrite free-form Markdown references automatically.
- [x] Use Computer Use to rename, relaunch, and verify the folder, node, edges, and content.

### Task 9: Preview, recover, and finalize agent deletion

**Files:** `src-tauri/src/recovery.rs`, `src-tauri/src/commands.rs`, `src/components/DeleteAgentDialog.tsx`, `src/components/RecoveryPanel.tsx`.

**Interfaces:** `preview_delete_agent -> DeletePreview`; `trash_agent -> RecoveryEntry`; `restore_recovery_entry -> ProjectSnapshot`. Recovery lives under `.agent-lab-recovery/<action-id>/` with a human-readable manifest and never outside the project root.

- [x] Test preview contents, edge reporting, recovery move, restore, and symlink escape rejection.
- [x] Require the dialog to list every affected file and edge before enabling confirmation.
- [x] Use Computer Use to cancel once, delete once, restore once, and verify disk contents after each action.
- [x] Run the Milestone 3 gate: `npm run check`, full Rust tests, debug app build, complete Computer Use create/rename/delete/restore/relaunch journey, supervisor PASS.
- [x] Update `PLAN.md` after PASS.

---

# Milestone 4 — Manual educational model, catalog, and Learn/Build modes

## Outcome

Agent Lab teaches why each file exists, when it is unnecessary, and displays examples without writing them implicitly.

### Task 10: Implement the static file building-block catalog

**Files:** `src/domain/fileCatalog.ts`, `src/domain/fileCatalog.test.ts`, `src/components/FileCatalog.tsx`, `src/components/FileInspector.tsx`.

**Interfaces:** `FileBuildingBlock { id, filename, convention, role, useWhen, avoidWhen, example }`; include `AGENT.md`, `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `MEMORY.md`, `STATUS.md`, `CONTEXT.md`, `REVIEW.md`, and runtime `task.md`.

- [ ] Test that every catalog item has `useWhen`, `avoidWhen`, and a valid convention badge.
- [ ] Render concise descriptions and `Why?` explanations from static local data.
- [ ] Ensure the catalog never claims Agent Lab conventions are universal standards.
- [ ] Commit with `git commit -m "feat: add the educational file catalog"`.

### Task 11: Add ghost examples with explicit acceptance

**Files:** `src/domain/ghostExamples.ts`, `src/components/MarkdownEditor.tsx`, `src/domain/editorState.test.ts`.

**Interfaces:** ghost content is render-only until `Use example` dispatches a normal editor change; opening and closing an empty file writes zero bytes.

- [ ] Test that empty documents expose ghost content but remain clean.
- [ ] Use Computer Use to open an empty `MEMORY.md`, close it, and verify the file remains empty; then accept the example and save explicitly.
- [ ] Commit with `git commit -m "feat: teach file roles with non-persistent ghost examples"`.

### Task 12: Persist Learn/Build mode as UI metadata

**Files:** `src-tauri/src/domain.rs`, `src-tauri/src/commands.rs`, `src/domain/uiMode.ts`, `src/components/ModeSwitch.tsx`, `src/App.tsx`.

**Interfaces:** `UiPreferences { mode: "learn" | "build" }` stored only in `agent-lab.json`; Learn shows explanations, Build keeps them available on demand.

- [ ] Test schema-compatible defaulting to `learn` when preferences are absent.
- [ ] Use Computer Use to switch modes, relaunch, and confirm persistence and keyboard focus.
- [ ] Run the Milestone 4 gate: frontend tests, Rust tests, build, rebuilt `.app`, keyboard/accessibility Computer Use journey, supervisor PASS.
- [ ] Update `PLAN.md` only after PASS.

---

# Milestone 5 — Manual graph relations and handoff contracts

## Outcome

Users can connect agents, inspect and edit explicit communication contracts, and preserve nodes and edges across relaunch.

### Task 13: Introduce the graph library behind the existing graph interface

**Files:** `package.json`, `src/domain/graph.ts`, `src/domain/graph.test.ts`, `src/components/FlowGraph.tsx`.

**Interfaces:** `WorkflowEdge { id, source, target, relation, label, description, payload, blocking, condition }`; relation is one of `delegation | handoff | review | approval | route | feedback | data`.

- [ ] Install `@xyflow/react` only.
- [ ] Test relation validation and deterministic edge IDs.
- [ ] Preserve current node positions and visual density during migration.
- [ ] Use Computer Use to move, zoom, focus, and select nodes in the rebuilt app.

### Task 14: Create, inspect, edit, and remove edges safely

**Files:** `src-tauri/src/domain.rs`, `src-tauri/src/commands.rs`, `src/components/EdgeInspector.tsx`, `src/services/projectService.ts`.

**Interfaces:** `upsert_edge(projectRoot, edge) -> ProjectSnapshot`; `delete_edge(projectRoot, edgeId) -> ProjectSnapshot`; endpoints must exist and self-edges require explicit support, which V0.1 rejects.

- [ ] Write Rust serialization, endpoint, duplicate, and migration tests.
- [ ] Build an inspector that keeps details off the canvas and exposes the expected payload.
- [ ] Use Computer Use to create `Researcher → Analyst`, set `handoff`, enter payload text, relaunch, and verify persistence.
- [ ] Run the Milestone 5 gate including the PROJECT.md persistence test with three agents and two edges.
- [ ] Require supervisor PASS before updating `PLAN.md`.

---

# Milestone 6 — V0.1 templates, import, command access, and release gate

## Outcome

The complete manual lab is usable without external documentation and satisfies every V0.1 acceptance criterion.

### Task 15: Add static workflow templates with preview and confirmation

**Files:** `src/templates/workflows.ts`, `src/domain/templates.test.ts`, `src/components/TemplateGallery.tsx`, `src/components/TemplatePreview.tsx`, `src-tauri/src/commands.rs`.

**Interfaces:** template definitions contain level, teaching goal, agents, files, edges, and warning; `apply_template` receives a validated structured proposal and creates only previewed files.

- [ ] Implement Blank, Single Agent, Research→Analyze→Review, Router→Specialists, Manager→Workers, Parallel Research, Planner→Executor→Verifier, Human Approval, Handoff Support Team, and Hierarchical—Advanced.
- [ ] Test preview/apply equality and reject any unpreviewed path.
- [ ] Use Computer Use to preview, cancel, apply, and inspect the real files.

### Task 16: Open existing projects non-destructively and add fast command access

**Files:** `src-tauri/src/commands.rs`, `src/components/ImportReview.tsx`, `src/components/CommandPalette.tsx`, `src/domain/commands.ts`.

**Interfaces:** opening detects recognized files and agent-like folders but performs no moves; `⌘K` exposes local actions without duplicating permanent buttons.

- [ ] Test missing `agent-lab.json` reconstruction and no-write open behavior.
- [ ] Use Computer Use to open a hand-created folder and verify the proposed graph before accepting metadata creation.
- [ ] Validate `⌘K`, `⌘S`, `⌘P`, focus visibility, and reduced-motion behavior.

### Task 17: Pass the complete V0.1 release gate

**Files:** `PLAN.md`, `package.json`, release documentation only when evidence changes.

- [ ] Run all frontend and Rust tests, typecheck, build, debug `.app` build, and direct executable launch with no new macOS crash report.
- [ ] Use Computer Use in the rebuilt `.app` to create a blank project; create Researcher and Analyst; inspect a ghost example; edit files; create a handoff; reveal files in Finder; rename; delete and restore; close; relaunch; reopen; confirm exact architecture and layout.
- [ ] Verify disk files and `agent-lab.json` after the UI journey.
- [ ] Invoke supervisor; correct up to three evidenced cycles; mark V0.1 complete only on PASS.

---

# Milestone 7 — V0.2 AI Design Assistant with preview-first mutation

## Outcome

AI can propose agents, files, and workflows, explain and simplify them, but cannot mutate the project before explicit application.

### Task 18: Add provider abstraction and secure configuration

**Files:** `src/domain/ai.ts`, `src/services/aiService.ts`, `src-tauri/src/ai/mod.rs`, `src-tauri/src/secure_store.rs`, `src/components/AISettings.tsx`.

**Interfaces:** `AIProvider.generateStructured(request) -> StructuredGenerationResult`; secrets live in macOS secure storage, never project files or `agent-lab.json`.

- [ ] Recheck current official provider and Tauri secure-storage documentation before selecting exact adapters.
- [ ] Test provider-disabled behavior, schema rejection, redacted logs, and no-project-secret persistence.
- [ ] Use Computer Use to configure, remove, and run a non-mutating provider health check without displaying the secret.

### Task 19: Implement editable proposals and atomic apply

**Files:** `src/domain/proposals.ts`, `src/domain/proposals.test.ts`, `src/components/AgentProposal.tsx`, `src/components/WorkflowProposal.tsx`, `src/components/ProposalDiff.tsx`, `src-tauri/src/proposals.rs`.

**Interfaces:** structured proposal contains agents, files, skills, suggested edges, warnings, and exact target paths; `apply_proposal` rejects any payload different from the user-approved preview.

- [ ] Test that Generate, Explain, Simplify, and Cancel write no project files.
- [ ] Test atomic apply, conflict rejection, path confinement, and rollback.
- [ ] Use Computer Use to generate, edit, simplify, cancel, regenerate, apply, and inspect the exact real files.

### Task 20: Add explainability and architecture quality checks

**Files:** `src/domain/qualityChecks.ts`, `src/domain/qualityChecks.test.ts`, `src/components/ArchitectureExplanation.tsx`, `src/components/QualityPanel.tsx`, `src/components/ContextInspector.tsx`.

**Interfaces:** deterministic local checks cover unclear responsibility, duplicates, dead nodes, cycles, unbounded reviewer loops, memory everywhere, god orchestrator, context overload, unnecessary hierarchy, and unclear handoff.

- [ ] Ensure explanations describe visible inputs, transfers, outputs, and criteria without claiming private chain-of-thought.
- [ ] Add `What if I remove this?` for agents, files, skills, and edges, with losses, a simpler alternative, and a recommendation grounded in visible project structure.
- [ ] Run the V0.2 gate with provider disabled and enabled paths, preview-no-write evidence, apply evidence, privacy inspection, rebuilt `.app` Computer Use journey, and supervisor PASS.

---

# Milestone 8 — V0.3 deterministic simulation and curriculum

## Outcome

Users can see synthetic information move through a workflow without an LLM or paid API.

### Task 21: Build a pure deterministic simulation engine

**Files:** `src/domain/simulation.ts`, `src/domain/simulation.test.ts`, `src/components/SimulationControls.tsx`, `src/components/TracePanel.tsx`.

**Interfaces:** `SimulationState`, `SimulationEvent`, and reducer actions `play`, `step`, `pause`, `reset`; events expose sender, receiver, relation, synthetic payload, files read/written, and state transitions.

- [ ] Test deterministic event order, pause/resume, reset, approval blocking, and loop termination.
- [ ] Render payload motion with reduced-motion fallback and no claim of internal reasoning.
- [ ] Use Computer Use to Play, Step, Pause, Reset, inspect an event, and resolve a synthetic approval.

### Task 22: Add the curriculum and context reset exercise

**Files:** `src/content/lessons.ts`, `src/components/LessonPanel.tsx`, `src/components/ContextResetExercise.tsx`.

**Interfaces:** twelve local lessons from single agent through simplification; progress is UI metadata only.

- [ ] Test lesson ordering and that examples do not write to disk before explicit use.
- [ ] Demonstrate temporary context disappearing while project files remain.
- [ ] Run the V0.3 gate offline, with deterministic replay equality, accessibility, rebuilt `.app` Computer Use journey, and supervisor PASS.

---

# Milestone 9 — V0.4 skills and secure import

## Outcome

Users can create, inspect, assign, and import local skills without executing imported content.

### Task 23: Model skills and Agent↔Skill assignments

**Files:** `src-tauri/src/skills.rs`, `src/domain/skills.ts`, `src/components/SkillInspector.tsx`, `src/components/SkillAssignment.tsx`.

**Interfaces:** a skill is discovered from `skills/<slug>/SKILL.md`; assignments are visual metadata in `agent-lab.json`; skill content remains on disk.

- [ ] Test skill discovery, validation, shared assignment, missing files, and graph satellite rendering.
- [ ] Use Computer Use to create `fact-check`, assign it to Researcher, relaunch, and inspect both file and relationship.

### Task 24: Import local skills as inert data with preview

**Files:** `src-tauri/src/import.rs`, `src/components/SkillImportPreview.tsx`, `src/components/TrustBadge.tsx`.

**Interfaces:** import inventory lists every file, executable-looking file, size, destination, and collision; no imported script runs.

- [ ] Test traversal archives, symlinks, collisions, executable files, cancel-no-write, and approved copy.
- [ ] Add a local library view that lists only skills already present or explicitly imported on this Mac; it performs no remote discovery or execution.
- [ ] Use Computer Use to preview a skill containing a shell script, confirm the warning, cancel, import on a second pass, and verify no process was executed.
- [ ] Run the V0.4 gate with local-only operation, real disk verification, rebuilt `.app` Computer Use journey, and supervisor PASS.

---

# Milestone 10 — V0.5 real runs, handoffs, approvals, and recovery

## Outcome

Agent Lab can execute explicitly requested provider-backed runs with durable, inspectable artifacts and no autonomous arbitrary code execution.

### Task 25: Create durable run storage and append-only events

**Files:** `src-tauri/src/runs.rs`, `src/domain/runs.ts`, `src/components/RunInspector.tsx`, `src/components/RunTrace.tsx`.

**Interfaces:** `runs/run-XXXX/{task.md,run.json,events.jsonl,approvals,handoffs,outputs}`; events are append-only and resumable.

- [ ] Test run ID allocation, append atomicity, corrupted final event recovery, and project-root confinement.
- [ ] Ensure permanent agent files never absorb run task or transient state.

### Task 26: Execute provider calls with explicit permissions and approvals

**Files:** `src-tauri/src/run_engine.rs`, `src-tauri/src/permissions.rs`, `src/components/RunControls.tsx`, `src/components/ApprovalGate.tsx`.

**Interfaces:** run states `idle | running | waiting | blocked | failed | complete`; tools require an explicit allow policy; sensitive actions stop at approval.

- [ ] Test bounded reviewer loops, cancellation, retry, resume, approval rejection, and provider failure.
- [ ] Do not add autonomous shell execution. Imported scripts remain inert.
- [ ] Use Computer Use to start a run, inspect events, approve and reject separate gates, cancel, relaunch, resume, and inspect outputs.

### Task 27: Add usage metrics without hidden telemetry

**Files:** `src/domain/usage.ts`, `src/components/UsageSummary.tsx`, `src-tauri/src/runs.rs`.

**Interfaces:** local call count, duration, provider-reported tokens, and estimated cost labeled with its source; no analytics upload.

- [ ] Test missing provider metrics and estimation labels.
- [ ] Run the V0.5 gate with filesystem artifacts, resume after relaunch, permission denial, provider failure, Computer Use, and supervisor PASS.

---

# Milestone 11 — V1.0 stabilization, recovery, accessibility, and distribution

## Outcome

Agent Lab is a stable educational workbench whose complete product journey is safe, understandable, recoverable, and distributable on macOS.

### Task 28: Harden format migrations, recovery, performance, and privacy

**Files:** `src-tauri/src/migrations.rs`, `src-tauri/src/recovery.rs`, `src/domain/migrations.ts`, performance fixtures, privacy documentation.

**Interfaces:** every incompatible `schemaVersion` change has a tested backup and migration; projects with hundreds of small files open without rereading all content.

- [ ] Test old-schema migration, failed migration recovery, missing metadata reconstruction, watcher batching, and no network access in manual/simulation modes.
- [ ] Audit logs and project files for secrets and private model input leakage.

### Task 29: Complete keyboard, accessibility, visual-state, and failure audits

**Files:** all affected components and `src/styles.css`; no redesign unrelated to an evidenced issue.

- [ ] Verify keyboard navigation, focus visibility, labels, contrast, non-color state cues, and reduced motion with Computer Use.
- [ ] Exercise concrete errors for conflicts, missing paths, duplicate names, permission failure, provider failure, and corrupt metadata.
- [ ] Confirm every error proposes a safe corrective action where one exists.

### Task 30: Pass the final product test and package the release candidate

**Files:** `PLAN.md`, release notes, Tauri bundle configuration, packaging scripts only where required by evidence.

- [ ] Run `npm run check`, all Rust tests, debug and release Tauri builds, direct executable launch, and crash-report inspection.
- [ ] Run PROJECT.md section 70 end to end with Computer Use: create project; Researcher; Analyst; handoff; `fact-check` skill; AI Reviewer proposal/edit/apply; explain; simplify; simulate; inspect handoff; close; relaunch; reopen; verify complete state and layout.
- [ ] Repeat the final journey with AI disabled to prove manual, Learn, Build, and Simulation modes remain local-first.
- [ ] Inspect all real files, run artifacts, metadata boundaries, and secure-secret storage.
- [ ] Invoke supervisor for the V1.0 verdict. Mark complete only on PASS and no required evidence gap.
- [ ] Produce `Agent Lab.app`; produce a local DMG when `hdiutil` succeeds. Treat signing, notarization, and public updater as distribution work requiring explicit credentials and authorization, not as hidden V1 acceptance assumptions.

---

## Final self-review checklist

- Every V0.1 MUST item in `PROJECT.md` is covered by Milestones 2–6.
- V0.2, V0.3, V0.4, V0.5, and V1.0 roadmap sections each map to a milestone above.
- Every milestone has deterministic checks, a rebuilt `.app`, Computer Use acceptance, filesystem evidence, and supervisor PASS.
- Computer Use is used for application behavior; terminal checks are used for deterministic engineering evidence.
- No subagent nesting or concurrent agent swarm exists.
- No milestone permits silent deletion, silent overwrite, unpreviewed AI mutation, imported-code execution, or arbitrary shell execution.
- Types and command names introduced in earlier tasks are reused consistently by later tasks.
- The plan contains no unbounded reviewer loop; the correction limit is three cycles per evidenced root failure.
