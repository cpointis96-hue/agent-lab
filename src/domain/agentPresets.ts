export type AgentPreset = {
  id: string;
  name: string;
  purpose: string;
  summary: string;
};

export const AGENT_PRESETS: AgentPreset[] = [
  { id: "researcher", name: "Researcher", purpose: "Research official sources and return a short cited brief.", summary: "Finds, verifies, and summarizes reliable information." },
  { id: "supervisor", name: "Supervisor", purpose: "Coordinate the work, check completion, and surface blockers.", summary: "Keeps the workflow clear and stops when a decision is needed." },
  { id: "code-reviewer", name: "Code Reviewer", purpose: "Review code for correctness, regressions, and maintainability.", summary: "Looks for bugs, edge cases, and risky changes." },
  { id: "ui-ux-reviewer", name: "UI / UX Reviewer", purpose: "Review an interface for clarity, accessibility, and platform conventions.", summary: "Checks hierarchy, interaction, density, and usability." },
  { id: "planner", name: "Planner", purpose: "Turn a goal into a small, ordered plan with clear acceptance criteria.", summary: "Defines the next useful steps before implementation begins." },
  { id: "analyst", name: "Analyst", purpose: "Compare inputs, identify patterns, and explain the implications.", summary: "Transforms collected material into structured understanding." },
  { id: "fact-checker", name: "Fact Checker", purpose: "Verify claims against primary sources and label uncertainty.", summary: "Separates confirmed facts, inference, and missing evidence." },
  { id: "writer", name: "Writer", purpose: "Draft clear, concise content while preserving the requested voice.", summary: "Creates readable first drafts from an approved brief." },
  { id: "qa-tester", name: "QA Tester", purpose: "Test the requested journey and report reproducible failures.", summary: "Verifies behavior instead of trusting a successful build alone." },
  { id: "documentation", name: "Documentation Agent", purpose: "Keep project documentation accurate, concise, and easy to follow.", summary: "Turns decisions and behavior into durable local documentation." },
];

export const DEFAULT_AGENT_PRESET = AGENT_PRESETS[0];
