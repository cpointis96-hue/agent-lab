# Agent Lab — Locked Design Reference

**Status: LOCKED**  
**Reference date: 2026-08-19**  
**Reference branch: `codex/native-macos-ui`**

This document is the visual source of truth for Agent Lab. The current native
macOS developer-tool design is approved and must remain stable across future
feature work.

## Non-negotiable direction

Agent Lab is a calm, compact, native macOS utility for developers and people
learning agent architecture.

Preserve:

- flat, edge-to-edge panels;
- thin structural separators;
- system macOS typography;
- compact 12–13 px interface density;
- icon-first contextual actions with accessible labels and tooltips;
- restrained selection states;
- draggable split panes;
- collapsible Navigator and Flow panes;
- quiet, short transitions;
- readable technical content in monospace only where appropriate.

Do not introduce:

- dashboard/card-grid layouts;
- marketing-style hero sections;
- large headings or oversized controls;
- decorative gradients or graph backgrounds;
- persistent text buttons when a familiar icon is clear;
- nested boxes and ornamental shadows;
- pill-shaped controls as a general language;
- a second visual system or ad-hoc component styling.

## Locked geometry

These values describe the approved desktop composition. They may be changed only
when the user explicitly asks to change the locked design.

| Element | Locked value |
| --- | --- |
| Top toolbar | 46 px high |
| Navigator default width | 248 px |
| Flow default width | 360 px |
| Splitter width | 5 px |
| Editor minimum width | 320 px |
| Panel header | 32 px minimum height |
| Flow canvas | 250 px initial height |
| Navigator search margin | 8 px top, 10 px horizontal |
| Compact icon control | 30 × 30 px |
| Standard compact button radius | 4 px |
| Menu/dialog radius | 6 px |
| Flow-node radius | 4 px |

The three-pane layout remains the primary composition:

```text
┌──────────────┬──────────────────────────┬───────────────┐
│ Navigator    │ Inspector / Editor       │ Flow          │
│ 248 px       │ flexible, min 320 px     │ 360 px        │
└──────────────┴──────────────────────────┴───────────────┘
```

Navigator and Flow can be hidden. Pane widths persist locally. Splitters remain
subtle until hover or active drag.

## Locked typography

Use the system stack:

```css
-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif
```

| Role | Locked value |
| --- | --- |
| Body/interface | 11–12 px |
| Project title | 12 px, semibold |
| Panel labels | 9 px, uppercase, letter-spaced |
| Supporting metadata | 10 px |
| Editor content | 13 px monospace, 1.6 line-height |
| Welcome title | 22 px |

Keep hierarchy restrained. Do not add a new display face, oversized title, or
heavy typographic contrast.

## Locked color language

These are the effective light-mode surfaces and states of the approved design:

| Token | Value | Use |
| --- | --- | --- |
| App background | `#f5f5f7` | window and welcome surface |
| Panel background | `#fbfbfc` | Navigator and Flow |
| Editor surface | `#ffffff` | editor content |
| Structural separator | `#e1e1e4` | panel and section boundaries |
| Primary text | `#1d1d1f` | main content |
| Secondary text | `#5d5d63` | quiet controls and metadata |
| Muted text | `#77777d` | labels and supporting copy |
| Selection / hover | `#e8e8eb` | selected rows and hover states |
| Control border | `#d5d5d8` | inputs and compact controls |
| Focus ring | existing visible 2 px outline | keyboard focus |

Color must not be the only indicator of state. Pair state changes with an icon,
label, selection, or structural cue.

## Locked interaction language

- Use icon-only actions when the meaning is conventional and obvious.
- Keep `aria-label` and `title` on every icon-only action.
- Reveal secondary row actions on hover and keyboard focus.
- Keep destructive actions explicit and recoverable.
- Use `⌘K` for the command palette and `⌘S` for save.
- Use `⌘1`, `⌘2`, and `⌘3` to focus the main workspace regions.
- Use disclosures for secondary Flow areas: Simulation, Learn, Runs, and Skills.
- Keep the filesystem tree available, but collapsed behind Project Files by default.
- Preserve keyboard focus visibility and reduced-motion behavior.

## Locked motion and surface behavior

Motion is feedback, not decoration. Keep transitions short and interruptible.
Do not add entrance animations to routine workspace rendering. Preserve the
existing reduced-motion override. Borders communicate structure; shadows are
reserved for transient menus and dialogs only.

## Change policy

Future agents MUST read this file before changing UI code.

Allowed without a design re-approval:

- bug fixes that preserve the locked appearance;
- accessibility fixes that improve readability or keyboard access;
- new features that use the existing tokens, spacing, controls, and hierarchy;
- changing a small interaction delay when the user explicitly requests it.

Requires explicit user approval:

- changing colors, typography, proportions, radii, panel composition, selection
  treatment, shadows, or the overall visual language;
- introducing a new component family, layout mode, or visual theme;
- replacing the current native macOS direction.

When a requested feature conflicts with this contract, stop and state the
conflict before implementing it. Do not silently redesign the application.

## Restore instruction

The approved design is also recorded by the Git tag:

```text
design-locked-2026-08-19
```

To ask Codex to restore it, say:

> Restore Agent Lab to the locked design reference `design-locked-2026-08-19`.
> Preserve project data and restore only the application design/code.

Codex must then inspect the worktree, show the proposed file changes, and avoid
touching project data such as `agents/`, `runs/`, or `agent-lab.json`.
