export type FileConvention = "open" | "agent-lab" | "runtime" | "custom";

export type FileBuildingBlock = {
  id: string;
  filename: string;
  convention: FileConvention;
  role: string;
  useWhen: string;
  avoidWhen: string;
  example: string;
};

export const fileCatalog: FileBuildingBlock[] = [
  { id: "agent", filename: "AGENT.md", convention: "agent-lab", role: "Stable instructions and responsibility for one agent.", useWhen: "An agent has a durable role, boundaries, inputs, or outputs.", avoidWhen: "A one-off task has no persistent agent identity.", example: "## Purpose\n\nResearch and verify a narrow question." },
  { id: "agents", filename: "AGENTS.md", convention: "open", role: "Instructions shared by coding agents in a project.", useWhen: "Several coding agents need the same repository rules.", avoidWhen: "Only one local agent needs a private instruction.", example: "## Verification\n\nRun the focused test before changing behavior." },
  { id: "soul", filename: "SOUL.md", convention: "agent-lab", role: "Optional style or persona guidance.", useWhen: "A stable voice is part of the learning example.", avoidWhen: "The role is already clear from AGENT.md.", example: "Use a calm, direct tone." },
  { id: "tools", filename: "TOOLS.md", convention: "agent-lab", role: "Human-readable notes about available tools.", useWhen: "An agent needs an explicit, documented tool boundary.", avoidWhen: "No tool is actually available or needed.", example: "- filesystem: read project files only" },
  { id: "memory", filename: "MEMORY.md", convention: "agent-lab", role: "Durable facts worth carrying between tasks.", useWhen: "Facts persist and materially improve future work.", avoidWhen: "The agent is stateless or the facts are cheap to recompute.", example: "- Preferred output format: Markdown" },
  { id: "status", filename: "STATUS.md", convention: "agent-lab", role: "Human-readable current project state.", useWhen: "A project benefits from a concise handoff snapshot.", avoidWhen: "The state is already obvious from source files.", example: "## Current state\n\nMVP slice validated." },
  { id: "context", filename: "CONTEXT.md", convention: "custom", role: "Stable background context for a role or project.", useWhen: "Background is large enough to separate from instructions.", avoidWhen: "The context is short and belongs in AGENT.md.", example: "## Domain\n\nThis project is local-first." },
  { id: "review", filename: "REVIEW.md", convention: "custom", role: "Human-readable review notes or acceptance results.", useWhen: "A review outcome should remain visible on disk.", avoidWhen: "A transient chat message is sufficient.", example: "- filesystem paths checked\n- no silent overwrite" },
  { id: "task", filename: "task.md", convention: "runtime", role: "A transient task input for a single run.", useWhen: "A runtime needs a durable, inspectable task payload.", avoidWhen: "The task is not running or does not need persistence.", example: "## Request\n\nSummarize the local evidence." },
];

export const conventionLabel = (convention: FileConvention) =>
  convention === "agent-lab" ? "Agent Lab convention" : convention === "runtime" ? "Runtime artifact" : convention === "open" ? "Open convention" : "Custom";
