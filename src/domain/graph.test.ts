import { describe, expect, it } from "vitest";
import { defaultEdge, edgeId, validateEdge } from "./graph";

const nodes = [
  { id: "agent:researcher", kind: "agent" as const, name: "Researcher", path: "agents/researcher", position: { x: 0, y: 0 } },
  { id: "agent:analyst", kind: "agent" as const, name: "Analyst", path: "agents/analyst", position: { x: 1, y: 1 } },
];

describe("graph relations", () => {
  it("creates deterministic ids and accepts valid edges", () => {
    const edge = defaultEdge(nodes[0].id, nodes[1].id);
    expect(edge.id).toBe(edgeId(nodes[0].id, nodes[1].id, "handoff"));
    expect(validateEdge(edge, nodes)).toEqual(edge);
  });

  it("rejects self edges, missing endpoints, and duplicates", () => {
    const edge = defaultEdge(nodes[0].id, nodes[1].id);
    expect(() => validateEdge(defaultEdge(nodes[0].id, nodes[0].id), nodes)).toThrow("Self");
    expect(() => validateEdge({ ...edge, source: "agent:missing" }, nodes)).toThrow("endpoints");
    expect(() => validateEdge({ ...edge, id: "other" }, nodes, [edge])).toThrow("already exists");
  });
});
