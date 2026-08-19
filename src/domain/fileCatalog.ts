export type FileConvention = "open" | "agent-lab" | "runtime" | "custom";
export type FileScope = "agent" | "project" | "skill" | "run";
export type FileLifetime = "durable" | "runtime";
export type FileVisibility = "core" | "optional" | "separate";
export type FileGroup = "agent" | "project" | "skills" | "run" | "optional";

export type FileBuildingBlock = {
  id: string; filename: string; convention: FileConvention; scope: FileScope; lifetime: FileLifetime; visibility: FileVisibility; group: FileGroup;
  role: string; useWhen: string; avoidWhen: string; example: string; starter?: string;
};

const item = (id: string, filename: string, convention: FileConvention, scope: FileScope, lifetime: FileLifetime, visibility: FileVisibility, group: FileGroup, role: string, useWhen: string, avoidWhen: string, example: string, starter?: string): FileBuildingBlock => ({ id, filename, convention, scope, lifetime, visibility, group, role, useWhen, avoidWhen, example, starter });

export const fileCatalog: FileBuildingBlock[] = [
  item("agent", "AGENT.md", "agent-lab", "agent", "durable", "core", "agent", "One agent's mission and operating contract.", "The agent has a durable role, inputs, outputs, or boundaries.", "The request is a one-off task with no persistent agent identity.", "Research trustworthy sources and return a short cited brief."),
  item("agents", "AGENTS.md", "open", "project", "durable", "core", "project", "Shared project rules for coding agents.", "Several agents need the same repository rules.", "The instruction belongs only to one agent.", "Run focused tests before changing behavior."),
  item("skill", "SKILL.md", "open", "skill", "durable", "separate", "skills", "A reusable procedure an agent can follow.", "The procedure can be reused by several agents.", "It is a one-off instruction for one agent.", "Inspect → verify → summarize with citations."),
  item("task", "task.md", "runtime", "run", "runtime", "separate", "run", "The request for one run.", "A run needs a durable, inspectable task payload.", "The request is not persisted as a run.", "Review AGENT.md for unclear boundaries."),
  item("tools", "TOOLS.md", "agent-lab", "agent", "durable", "optional", "optional", "Tools this agent may use and their limits.", "Tool permissions or restrictions need to be explicit.", "The agent has no special tool boundary.", "Read project files. Do not delete or publish anything.", "# Tools\n\n- filesystem: read project files only\n- Do not delete or publish anything without approval.\n"),
  item("context", "CONTEXT.md", "custom", "agent", "durable", "optional", "optional", "Stable background the agent needs to do its job.", "Reusable context is too large for AGENT.md.", "The context is one short sentence that fits in AGENT.md.", "This project is a local-first macOS application.", "# Context\n\n## Background\n\nAdd only stable context that this agent will reuse.\n"),
  item("soul", "SOUL.md", "agent-lab", "agent", "durable", "optional", "optional", "Durable tone and working posture.", "Voice or behavior is part of the agent's role.", "AGENT.md already explains how the agent should behave.", "Be direct, cautious, and clearly state uncertainty.", "# Working posture\n\n- Be direct, cautious, and clear about uncertainty.\n"),
  item("memory", "MEMORY.md", "agent-lab", "agent", "durable", "optional", "optional", "Curated facts worth carrying forward.", "A fact should persist and improve future work.", "The information is temporary, sensitive, or cheap to recompute.", "Preferred output format: Markdown with source links.", "# Memory\n\n## Durable facts\n\n- Add only verified facts that improve future work.\n"),
  item("status", "STATUS.md", "agent-lab", "agent", "durable", "optional", "optional", "A human-readable progress snapshot.", "An agent or project needs a persistent handoff summary.", "The state belongs to one execution or is obvious from source files.", "Done: MVP validated. Next: add handoff review.", "# Status\n\n## Current state\n\n- Done:\n- In progress:\n- Next:\n"),
  item("review", "REVIEW.md", "custom", "agent", "durable", "optional", "optional", "Reusable review criteria or saved review notes.", "The agent performs recurring reviews with a stable rubric.", "The review is only a temporary run result.", "Check paths, tests, accessibility, and no silent overwrite.", "# Review criteria\n\n- Check paths and focused tests.\n- Check accessibility.\n- Check for silent overwrites.\n"),
];

export const conventionLabel = (convention: FileConvention) => convention === "agent-lab" ? "Agent Lab convention" : convention === "runtime" ? "Runtime artifact" : convention === "open" ? "Open convention" : "Custom";
export const scopeLabel = (scope: FileScope) => scope === "agent" ? "One agent" : scope === "project" ? "Project" : scope === "skill" ? "Reusable skill" : "One run";
export const lifetimeLabel = (lifetime: FileLifetime) => lifetime === "durable" ? "Durable" : "Runtime";
export const fileGroupLabel = (group: FileGroup) => group === "agent" ? "Agent" : group === "project" ? "Project" : group === "skills" ? "Skills" : group === "run" ? "Run files" : "Optional agent files";
