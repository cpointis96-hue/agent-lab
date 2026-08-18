import type { Agent, ProjectSnapshot } from "./project";
import type { WorkflowEdge } from "./graph";

export type SimulationEvent = {
  id: string;
  sender: string;
  receiver: string;
  relation: WorkflowEdge["relation"];
  payload: string;
  filesRead: string[];
  filesWritten: string[];
  before: string;
  after: string;
  approvalRequired: boolean;
};

export type SimulationState = {
  events: SimulationEvent[];
  cursor: number;
  trace: SimulationEvent[];
  playing: boolean;
  blocked: boolean;
};

export type SimulationAction =
  | { type: "load"; project: ProjectSnapshot }
  | { type: "play" }
  | { type: "step" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "resolve-approval" };

const agentById = (agents: Agent[], id: string) => agents.find((agent) => agent.id === id);

export const buildSimulationEvents = (project: ProjectSnapshot): SimulationEvent[] =>
  project.graph.edges.map((edge, index) => {
    const sender = agentById(project.agents, edge.source);
    const receiver = agentById(project.agents, edge.target);
    const senderFile = sender?.files.find((file) => file.path.endsWith("/AGENT.md"))?.path;
    return {
      id: `simulation:${index}:${edge.id}`,
      sender: sender?.name ?? edge.source,
      receiver: receiver?.name ?? edge.target,
      relation: edge.relation,
      payload: edge.payload || `${edge.label || edge.relation} payload`,
      filesRead: senderFile ? [senderFile] : [],
      filesWritten: [],
      before: index === 0 ? "task-created" : "previous-handoff-complete",
      after: edge.relation === "approval" ? "awaiting-approval" : "handoff-complete",
      approvalRequired: edge.relation === "approval" || edge.blocking && edge.condition.toLowerCase().includes("approval"),
    };
  });

export const createSimulation = (project: ProjectSnapshot): SimulationState => ({ events: buildSimulationEvents(project), cursor: 0, trace: [], playing: false, blocked: false });

export const reduceSimulation = (state: SimulationState, action: SimulationAction): SimulationState => {
  if (action.type === "load") return createSimulation(action.project);
  if (action.type === "reset") return { ...state, cursor: 0, trace: [], playing: false, blocked: false };
  if (action.type === "pause") return { ...state, playing: false };
  if (action.type === "play") return { ...state, playing: state.cursor < state.events.length && !state.blocked };
  if (action.type === "resolve-approval") {
    if (!state.blocked) return state;
    const event = state.events[state.cursor];
    return event ? { ...state, cursor: state.cursor + 1, trace: [...state.trace, { ...event, after: "approval-resolved" }], blocked: false, playing: false } : state;
  }
  if (state.playing || action.type === "step") {
    const event = state.events[state.cursor];
    if (!event || state.blocked) return { ...state, playing: false };
    if (event.approvalRequired) return { ...state, blocked: true, playing: false };
    return { ...state, cursor: state.cursor + 1, trace: [...state.trace, event], playing: state.playing && state.cursor + 1 < state.events.length };
  }
  return state;
};
