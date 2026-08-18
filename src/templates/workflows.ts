import type { Relation } from "../domain/graph";

export type WorkflowTemplate = {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  teachingGoal: string;
  warning?: string;
  agents: Array<{ name: string; purpose: string }>;
  edges: Array<{ source: number; target: number; relation: Relation; label: string }>;
};

export type TemplateProposal = {
  agents: Array<{ id: string; name: string; purpose: string }>;
  files: Array<{ path: string; content: string }>;
  edges: Array<{ id: string; source: string; target: string; relation: Relation; label: string; description: string; payload: string; blocking: boolean; condition: string }>;
};

const slug = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const proposalForTemplate = (template: WorkflowTemplate): TemplateProposal => {
  const agents = template.agents.map((agent) => ({ ...agent, id: `agent:${slug(agent.name)}` }));
  return {
    agents,
    files: agents.map((agent) => ({ path: `agents/${slug(agent.name)}/AGENT.md`, content: `# ${agent.name}\n\n## Purpose\n\n${agent.purpose}\n` })),
    edges: template.edges.map((edge) => {
      const source = agents[edge.source].id;
      const target = agents[edge.target].id;
      return { id: `edge:${source}->${target}:${edge.relation}`, source, target, relation: edge.relation, label: edge.label, description: "", payload: "", blocking: edge.relation === "handoff", condition: "" };
    }),
  };
};

const chain = (names: string[], purpose: string, relation: Relation = "handoff") => ({
  agents: names.map((name) => ({ name, purpose })),
  edges: names.slice(1).map((_, index) => ({ source: index, target: index + 1, relation, label: relation[0].toUpperCase() + relation.slice(1) })),
});

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  { id: "blank", name: "Blank", level: "Beginner", teachingGoal: "Start with a clean project.", agents: [], edges: [] },
  { id: "single-agent", name: "Single Agent", level: "Beginner", teachingGoal: "One clear responsibility is often enough.", ...chain(["Researcher"], "Define one stable responsibility.") },
  { id: "research-analyze-review", name: "Research → Analyze → Review", level: "Beginner", teachingGoal: "Separate research, synthesis, and quality review.", ...chain(["Researcher", "Analyst", "Reviewer"], "Own one step of a readable workflow.") },
  { id: "router-specialists", name: "Router → Specialists", level: "Intermediate", teachingGoal: "Route work to focused specialists.", ...chain(["Router", "Specialist"], "Handle a defined workflow responsibility.", "route") },
  { id: "manager-workers", name: "Manager → Workers", level: "Intermediate", teachingGoal: "Coordinate bounded worker responsibilities.", ...chain(["Manager", "Worker"], "Complete a bounded task.", "delegation") },
  { id: "parallel-research", name: "Parallel Research", level: "Intermediate", teachingGoal: "Compare independent research streams.", agents: [{ name: "Researcher A", purpose: "Research one angle." }, { name: "Researcher B", purpose: "Research another angle." }, { name: "Synthesizer", purpose: "Combine visible findings." }], edges: [{ source: 0, target: 2, relation: "data", label: "Data" }, { source: 1, target: 2, relation: "data", label: "Data" }] },
  { id: "planner-executor-verifier", name: "Planner → Executor → Verifier", level: "Intermediate", teachingGoal: "Plan, execute, then verify.", ...chain(["Planner", "Executor", "Verifier"], "Advance one explicit stage.") },
  { id: "human-approval", name: "Human Approval", level: "Intermediate", teachingGoal: "Make approval a visible boundary.", ...chain(["Producer", "You"], "Review or approve a proposed result.", "approval") },
  { id: "handoff-support", name: "Handoff Support Team", level: "Advanced", teachingGoal: "Carry an explicit contract between roles.", ...chain(["Lead", "Support", "Reviewer"], "Pass a defined handoff payload.") },
  { id: "hierarchical-advanced", name: "Hierarchical — Advanced", level: "Advanced", teachingGoal: "Explore hierarchy only when it teaches a real boundary.", warning: "More agents add coordination cost.", ...chain(["Orchestrator", "Team Lead", "Specialist"], "Own a distinct level of responsibility.", "delegation") },
];

export const templateById = (id: string) => WORKFLOW_TEMPLATES.find((template) => template.id === id) ?? WORKFLOW_TEMPLATES[0];
