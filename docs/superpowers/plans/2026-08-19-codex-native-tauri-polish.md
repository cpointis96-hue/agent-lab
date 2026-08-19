# Codex-style Native Tauri Polish Implementation Plan

> **For agentic workers:** Inline execution in the current isolated worktree; no subagents.

**Goal:** Make the existing Tauri/React Agent Lab feel like a restrained native macOS developer utility while preserving every existing feature and interaction.

**Architecture:** Keep the current React/Tauri architecture and business logic. Consolidate visual values in CSS custom properties, apply one shared compact control language, and add semantic light/dark overrides. Touch only the UI shell and shared styles unless an interaction needs a small accessibility fix.

**Tech Stack:** React, TypeScript, Tauri, CodeMirror, Lucide React, plain CSS.

**Spec:** `DESIGN.md` at the repository root

## Global Constraints

- Preserve existing filesystem, editor, simulation, runs, skills, recovery, and shortcut behavior.
- Keep the left navigator as the single primary navigation surface.
- Prefer compact icon-only actions with accessible labels and tooltips.
- Use shared tokens for spacing, colors, control heights, radii, separators, and selection.
- Verify light mode, dark mode, resizing, keyboard shortcuts, menus, disclosures, and hit targets.

### Task 1: Consolidate visual tokens and theme surfaces

**Files:**
- Modify: `src/styles.css`

- [x] Define shared light/dark CSS custom properties for surfaces, text, muted text, separators, selection, controls, spacing, and radii.
- [x] Re-express the final native pass through those variables and remove remaining decorative grid/shadow emphasis.
- [x] Add a `prefers-color-scheme: dark` block covering the app shell, panels, inputs, editor, menu, flow, dialogs, selection, and disabled states.
- [x] Keep reduced-motion behavior and explicit transition properties intact.

### Task 2: Unify compact controls and navigation rows

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [x] Use the shared ghost/icon control treatment for navigator header actions.
- [x] Remove decorative empty-state glyph text and keep the empty editor state informational but compact.
- [x] Add consistent truncation and tooltip behavior for root paths, project names, selected file labels, agent purposes, and flow metadata.
- [x] Preserve all `aria-label`, `title`, keyboard, disabled, and selection behavior.

### Task 3: Verify and package

**Files:**
- No production source changes unless verification exposes a regression.

- [x] Run `npm run check`.
- [x] Run `cargo fmt --check --manifest-path src-tauri/Cargo.toml` and `cargo test --offline --manifest-path src-tauri/Cargo.toml`.
- [x] Run `git diff --check`.
- [x] Rebuild the debug `.app`.
- [ ] Verify the packaged UI in light mode, dark mode, pane resize/collapse, menu, disclosure, editor selection, and keyboard shortcuts. Dark mode and core workspace controls were manually verified; light-mode toggle and the full interaction matrix remain unverified in this pass.
