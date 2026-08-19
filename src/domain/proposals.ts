import type { TemplateProposal } from "../templates/workflows";
import { agentMarkdownFor } from "./agentPresets";

export type Proposal = TemplateProposal & {
  objective: string;
  explanation: string;
  warnings: string[];
  provider: "disabled-local";
};

const agent = (name: string, purpose: string) => ({ id: `agent:${name.toLowerCase()}`, name, purpose });
const fileFor = (item: { id: string; name: string; purpose: string }) => ({ path: `agents/${item.name.toLowerCase()}/AGENT.md`, content: agentMarkdownFor(item.name, item.purpose) });
const edge = (source: string, target: string, label: string) => ({ id: `edge:${source}->${target}:handoff`, source, target, relation: "handoff" as const, label, description: "", payload: "", blocking: true, condition: "When the previous step is complete" });

export const generateLocalProposal = (objective: string): Proposal => {
  const clean = objective.trim() || "Research and validate a narrow question";
  const agents = [agent("Researcher", "Research the objective and produce a concise evidence-based report."), agent("Analyst", "Synthesize the visible research into a useful answer."), agent("Reviewer", "Check clarity, evidence, and the stated acceptance criteria.")];
  return { objective: clean, provider: "disabled-local", explanation: "Researcher gathers evidence, Analyst synthesizes it, and Reviewer checks the visible result.", warnings: ["This is a local deterministic proposal. No provider or project content was sent anywhere."], agents, files: agents.map(fileFor), edges: [edge(agents[0].id, agents[1].id, "Research handoff"), edge(agents[1].id, agents[2].id, "Review handoff")] };
};

export const simplifyProposal = (proposal: Proposal): Proposal => {
  const agents = proposal.agents.filter((item) => item.name !== "Reviewer");
  return { ...proposal, agents, files: agents.map(fileFor), edges: [edge(agents[0].id, agents[1].id, "Direct handoff")], explanation: "The reviewer is removed because the visible proposal can be handled by one research-to-analysis handoff.", warnings: [...proposal.warnings, "Simplified variant removes an independent review boundary."] };
};

export const explainProposal = (proposal: Proposal) => proposal.explanation;
