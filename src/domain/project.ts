export type AgentFile = { path: string; kind: string };
export type ProjectFile = { path: string; name: string; kind: string; convention: string; revision: string; size: number };
export type FileDocument = { path: string; content: string; revision: string };
export type Point = { x: number; y: number };
export type Agent = { id: string; name: string; slug: string; purpose: string; path: string; files: AgentFile[] };
export type GraphNode = { id: string; kind: "agent"; name: string; path: string; position: Point };
import type { WorkflowEdge } from "./graph";
export type GraphEdge = WorkflowEdge;
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };
export type ProjectSnapshot = { root: string; project: { id: string; name: string }; agents: Agent[]; graph: Graph };
export type DeletePreview = { agentId: string; agentName: string; agentPath: string; files: string[]; edges: GraphEdge[] };
export type RecoveryEntry = { actionId: string; agentId: string; agentName: string; agentPath: string; files: string[]; edges: GraphEdge[] };

export const preferredAgentFile = (files: AgentFile[]) =>
  files.find((file) => file.path.endsWith("/AGENT.md")) ?? files[0] ?? null;
