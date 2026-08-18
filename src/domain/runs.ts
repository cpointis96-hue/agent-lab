export type RunState = "idle" | "running" | "waiting" | "blocked" | "failed" | "complete";

export type RunSummary = {
  id: string;
  task: string;
  agentId: string;
  state: RunState;
  provider: string;
  createdAt: number;
  updatedAt: number;
  calls: number;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCost: number | null;
  costSource: string;
  lastError: string | null;
};

export type RunEvent = { sequence: number; kind: string; state: RunState; message: string; at: number };
