import { describe, expect, it } from "vitest";
import { preferredAgentFile } from "./project";

describe("preferredAgentFile", () => {
  it("prefers AGENT.md without inventing a file", () => {
    expect(preferredAgentFile([
      { path: "agents/researcher/TOOLS.md", kind: "custom" },
      { path: "agents/researcher/AGENT.md", kind: "agent-lab" },
    ])?.path).toBe("agents/researcher/AGENT.md");
  });
});
