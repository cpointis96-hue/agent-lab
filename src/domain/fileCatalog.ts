export type FileConvention = "open" | "agent-lab" | "runtime" | "custom";
export type FileScope = "agent" | "project" | "skill" | "run";
export type FileLifetime = "durable" | "runtime";
export type FileVisibility = "core" | "optional" | "separate";
export type FileGroup = "agent" | "project" | "skills" | "run" | "optional";

export type FileBuildingBlock = {
  id: string;
  filename: string;
  convention: FileConvention;
  scope: FileScope;
  lifetime: FileLifetime;
  visibility: FileVisibility;
  group: FileGroup;
  role: string;
  useWhen: string;
  avoidWhen: string;
  example: string;
  starter?: string;
};

export const fileCatalog: FileBuildingBlock[] = [
  { id: "agent", filename: "AGENT.md", convention: "agent-lab", scope: "agent", lifetime: "durable", visibility: "core", group: "agent", role: "One agent's mission and operating contract.", useWhen: "The agent has a durable role, inputs, outputs, or boundaries.", avoidWhen: "The request is a one-off task with no persistent agent identity.", example: "Research trustworthy sources and return a short cited brief." },
  { id: "agents", filename: "AGENTS.md", convention: "open", scope: "project", lifetime: "durable", visibility: "core", group: "project", role: "Shared project rules for coding agents.", useWhen: "Several agents need the same repository rules.", avoidWhen: "The instruction belongs only to one agent.", example: "Run focused tests before changing behavior; never edit generated files." },
  { id: "skill", filename: "SKILL.md", convention: "open", scope: "skill", lifetime: "durable", visibility: "separate", group: "skills", role: "A reusable procedure an agent can follow.", useWhen: "The procedure can be reused by several agents.", avoidWhen: "It is a one-off instruction for one agent.", example: "Inspect → verify → summarize with citations." },
  { id: "task", filename: "task.md", convention: "runtime", scope: "run", lifetime: "runtime", visibility: "separate", group: "run", role: "The request for one run.", useWhen: "A run needs a durable, inspectable task payload.", avoidWhen: "The request is not persisted as a run.", example: "Review AGENT.md for unclear boundaries." },
  { id: "tools", filename: "TOOLS.md", convention: "agent-lab", scope: "agent", lifetime: "durable", visibility: "optional", group: "optional", role: "Tools this agent may use and their limits.", useWhen: "Tool permissions or restrictions need to be explicit.", avoidWhen: "The agent has no special tool boundary.", example: "Read project files. Do not delete or publish anything.", starter: "# Tools\n\n- filesystem: read project files only\n- Do not delete or publish anything without approval.\n" },
  { id: "context", filename: "CONTEXT.md", convention: "custom", scope: "agent", lifetime: "durable", visibility: "optional", group: "optional", role: "Stable background the agent needs to do its job.", useWhen: "Reusable context is too large for AGENT.md.", avoidWhen: "The context is one short sentence that fits in AGENT.md.", example: "This project is a local-first macOS application.", starter: "# Context\n\n## Background\n\nAdd only stable context that this agent will reuse.\n" },
  { id: "soul", filename: "SOUL.md", convention: "agent-lab", scope: "agent", lifetime: "durable", visibility: "optional", group: "optional", role: "Durable tone and working posture.", useWhen: "Voice or behavior is part of the agent's role.", avoidWhen: "AGENT.md already explains how the agent should behave.", example: "Be direct, cautious, and clearly state uncertainty.", starter: "# Working posture\n\n- Be direct, cautious, and clear about uncertainty.\n" },
  { id: "memory", filename: "MEMORY.md", convention: "agent-lab", scope: "agent", lifetime: "durable", visibility: "optional", group: "optional", role: "Curated facts worth carrying forward.", useWhen: "A fact should persist and improve future work.", avoidWhen: "The information is temporary, sensitive, or cheap to recompute.", example: "Preferred output format: Markdown with source links.", starter: "# Memory\n\n## Durable facts\n\n- Add only verified facts that improve future work.\n" },
  { id: "status", filename: "STATUS.md", convention: "agent-lab", scope: "agent", lifetime: "durable", visibility: "optional", group: "optional", role: "A human-readable progress snapshot.", useWhen: "An agent or project needs a persistent handoff summary.", avoidWhen: "The state belongs to one execution or is obvious from source files.", example: "Done: MVP validated. Next: add handoff review.", starter: "# Status\n\n## Current state\n\n- Done:\n- In progress:\n- Next:\n" },
  { id: "review", filename: "REVIEW.md", convention: "custom", scope: "agent", lifetime: "durable", visibility: "optional", group: "optional", role: "Reusable review criteria or saved review notes.", useWhen: "The agent performs recurring reviews with a stable rubric.", avoidWhen: "The review is only a temporary run result.", example: "Check paths, tests, accessibility, and no silent overwrite.", starter: "# Review criteria\n\n- Check paths and focused tests.\n- Check accessibility.\n- Check for silent overwrites.\n" },
];

export const conventionLabel = (convention: FileConvention) =>
  convention === "agent-lab" ? "Agent Lab pattern" : convention === "runtime" ? "Runtime file" : convention === "open" ? "Open format" : "Project pattern";

export const scopeLabel = (scope: FileScope) =>
  scope === "agent" ? "One agent" : scope === "project" ? "Project" : scope === "skill" ? "Reusable skill" : "One run";

export const lifetimeLabel = (lifetime: FileLifetime) => lifetime === "durable" ? "Durable" : "Runtime";

export const fileGroupLabel = (group: FileGroup) =>
  group === "agent" ? "Agent" : group === "project" ? "Project" : group === "skills" ? "Skills" : group === "run" ? "Run files" : "Optional agent files";
