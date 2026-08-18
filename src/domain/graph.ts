import type { GraphNode } from "./project";

export const RELATIONS = [
  "delegation",
  "handoff",
  "review",
  "approval",
  "route",
  "feedback",
  "data",
] as const;

export type Relation = typeof RELATIONS[number];
export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  relation: Relation;
  label: string;
  description: string;
  payload: string;
  blocking: boolean;
  condition: string;
};

export const edgeId = (source: string, target: string, relation: Relation) =>
  `edge:${source}->${target}:${relation}`;

export const isRelation = (value: string): value is Relation =>
  (RELATIONS as readonly string[]).includes(value);

export const validateEdge = (edge: WorkflowEdge, nodes: GraphNode[], existing: WorkflowEdge[] = []) => {
  if (!edge.source || !edge.target) throw new Error("An edge needs a source and target.");
  if (edge.source === edge.target) throw new Error("Self-edges are not supported.");
  if (!nodes.some((node) => node.id === edge.source) || !nodes.some((node) => node.id === edge.target)) {
    throw new Error("Both edge endpoints must be existing agents.");
  }
  if (!isRelation(edge.relation)) throw new Error("Unknown edge relation.");
  if (existing.some((item) => item.id !== edge.id && item.source === edge.source && item.target === edge.target && item.relation === edge.relation)) {
    throw new Error("This relation already exists between these agents.");
  }
  return edge;
};

export const defaultEdge = (source: string, target: string, relation: Relation = "handoff"): WorkflowEdge => ({
  id: edgeId(source, target, relation),
  source,
  target,
  relation,
  label: relation[0].toUpperCase() + relation.slice(1),
  description: "",
  payload: "",
  blocking: relation === "handoff",
  condition: "",
});
