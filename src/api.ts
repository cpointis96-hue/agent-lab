import { invoke } from "@tauri-apps/api/core";

export type Point = { x: number; y: number };

export type AgentFile = {
  path: string;
  kind: string;
};

export type Agent = {
  id: string;
  name: string;
  slug: string;
  purpose: string;
  path: string;
  files: AgentFile[];
};

export type GraphNode = {
  id: string;
  kind: "agent";
  name: string;
  path: string;
  position: Point;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: string;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type ProjectSnapshot = {
  root: string;
  project: {
    id: string;
    name: string;
  };
  agents: Agent[];
  graph: Graph;
};

export const createProject = (parentPath: string, name: string) =>
  invoke<ProjectSnapshot>("create_project", {
    parentPath,
    name,
  });

export const openProject = (path: string) =>
  invoke<ProjectSnapshot>("open_project", { path });

export const createAgent = (projectRoot: string, name: string, purpose: string) =>
  invoke<ProjectSnapshot>("create_agent", {
    projectRoot,
    name,
    purpose,
  });

export const readProjectFile = (projectRoot: string, relativePath: string) =>
  invoke<string>("read_project_file", {
    projectRoot,
    relativePath,
  });

export const writeProjectFile = (
  projectRoot: string,
  relativePath: string,
  content: string,
) =>
  invoke<void>("write_project_file", {
    projectRoot,
    relativePath,
    content,
  });

export const saveAgentPosition = (
  projectRoot: string,
  agentId: string,
  position: Point,
) =>
  invoke<void>("save_agent_position", {
    projectRoot,
    agentId,
    x: position.x,
    y: position.y,
  });
