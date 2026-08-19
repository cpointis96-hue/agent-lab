# Agent file guidance implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution with the existing project checks.

**Goal:** Make Agent Lab teach the difference between agent, project, skill, and run files while creating only a useful `AGENT.md` by default, with compact contextual actions and one clear active file selection.

**Architecture:** Keep the local filesystem model and locked native macOS visual system. Use scoped catalog metadata to group the guide into Agent, Project, Skills, Run files, and optional files; keep guide selection visually secondary to the real editor selection; make agent actions contextual and icon-only; and generate a concrete starter document from the user's purpose in the Tauri command.

**Tech Stack:** React, TypeScript, Tauri 2, Rust, Vitest.

**Spec:** `DESIGN.md` and the file-model audit delivered in the conversation.

## Global Constraints

- Preserve local-first filesystem behavior and recoverable destructive actions.
- Do not generate optional empty agent files.
- Keep the existing compact macOS developer-tool visual language.
- Use concise English UI copy to match the current application.

### Task 1: File model and guide copy

**Files:** Modify `src/domain/fileCatalog.ts`, `src/components/FileInspector.tsx`, `src/components/FileCatalog.tsx`, `src/domain/fileCatalog.test.ts`.

- Add scope, lifetime, and pedagogical group metadata.
- Group the guide into Agent, Project, Skills, Run files, and optional agent files.
- Show the four essential concepts by default; reveal optional agent files on demand.
- Explain role first, then compact scope/lifetime/source metadata.
- Keep guide selection visually secondary so the editor remains the only strong file selection.

### Task 2: Agent creation, navigation, and contextual files

**Files:** Modify `src/App.tsx`, `src-tauri/src/lib.rs`.

- Create only `AGENT.md` with concrete purpose, inputs, outputs, and boundaries.
- Add an example hint under the purpose field.
- Open the created agent's `AGENT.md` automatically through the existing project reload.
- Make an agent directory row select the agent and open its primary file with one click.
- Keep creation to Name + Purpose and use the purpose as the first useful contract text.
- Add a hover/focus-revealed compact add-file action on an agent directory.
- Ensure Add file writes into the selected/contextual agent directory, never silently to project root.

### Task 3: Verification

**Files:** Existing tests and build output only.

- Run focused TypeScript/domain tests.
- Run Rust tests covering agent creation.
- Run the project typecheck, frontend tests, and build.
- Verify all icon-only actions have labels and explicit button semantics.
- Verify the packaged app preserves the locked layout and the new actions remain compact.
