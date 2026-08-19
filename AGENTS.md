# Agent Lab — Execution Policy

Use the primary thread for normal work. Read `PLAN.md`, the relevant code, and only the needed `PROJECT.md` heading. Keep one writer and do not use routine subagents.

Risk tiers:

- Tier 0: documentation/inspection only; no build, Computer Use, or supervisor.
- Tier 1: bounded non-UI code; targeted test/typecheck only.
- Tier 2: UI/runtime change; targeted test plus the affected Computer Use path in `tauri dev` when available.
- Tier 3: milestone gate; full frontend check, Rust format/tests, one `.app` rebuild, complete Computer Use journey, filesystem evidence, then one supervisor verdict.

Use a bounded worker only when the task is genuinely isolated and delegation saves more time than its context/handoff cost. Never nest agents or run concurrent writers. The supervisor is a milestone-gate verifier, not an inner-loop reviewer.

Preserve local-first behavior, filesystem-as-source-of-truth, project-root confinement, traversal prevention, explicit destructive actions, recoverable deletion, and no arbitrary execution of project content. Keep the product simple and readable.

Before changing UI code, read `DESIGN.md`. The current macOS visual design is a
locked product decision. Keep one visual system, reuse the existing tokens and
interaction patterns, and do not change color, typography, proportions,
surfaces, radii, selection treatment, or panel composition without explicit
owner approval. A request to change behavior or timing does not authorize a
visual redesign.

Do not start the next milestone before the active milestone has a supervisor PASS. Update `PLAN.md` only when evidence changes.
