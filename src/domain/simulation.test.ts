import { describe, expect, it } from "vitest";
import { createSimulation, reduceSimulation } from "./simulation";
import type { ProjectSnapshot } from "./project";

const project = (relation: "handoff" | "approval" = "handoff"): ProjectSnapshot => ({
  root: "/tmp/project", project: { id: "p", name: "Project" },
  agents: [
    { id: "agent:a", name: "A", slug: "a", purpose: "A", path: "agents/a", files: [{ path: "agents/a/AGENT.md", kind: "markdown" }] },
    { id: "agent:b", name: "B", slug: "b", purpose: "B", path: "agents/b", files: [{ path: "agents/b/AGENT.md", kind: "markdown" }] },
  ], graph: { nodes: [{ id: "agent:a", kind: "agent", name: "A", path: "agents/a", position: { x: 0, y: 0 } }, { id: "agent:b", kind: "agent", name: "B", path: "agents/b", position: { x: 1, y: 1 } }], edges: [{ id: `edge:${relation}`, source: "agent:a", target: "agent:b", relation, label: relation, description: "", payload: "demo", blocking: relation === "approval", condition: "" }] },
});

describe("deterministic simulation", () => {
  it("replays the same event order and resets", () => {
    const first = reduceSimulation(reduceSimulation(createSimulation(project()), { type: "step" }), { type: "step" });
    const second = reduceSimulation(reduceSimulation(createSimulation(project()), { type: "step" }), { type: "step" });
    expect(first.trace.map((event) => event.id)).toEqual(second.trace.map((event) => event.id));
    expect(reduceSimulation(first, { type: "reset" }).trace).toEqual([]);
  });
  it("blocks approval until explicitly resolved", () => {
    const blocked = reduceSimulation(createSimulation(project("approval")), { type: "step" });
    expect(blocked.blocked).toBe(true);
    const resolved = reduceSimulation(blocked, { type: "resolve-approval" });
    expect(resolved.blocked).toBe(false);
    expect(resolved.trace[0].after).toBe("approval-resolved");
  });
  it("terminates play at the end", () => {
    const state = reduceSimulation(createSimulation(project()), { type: "play" });
    const done = reduceSimulation(state, { type: "step" });
    expect(done.cursor).toBe(1);
    expect(reduceSimulation(done, { type: "play" }).playing).toBe(false);
  });
  it("pauses and resumes deterministic playback", () => {
    const initial = createSimulation(project());
    const secondEvent = { ...initial.events[0], id: "simulation:second" };
    const playing = reduceSimulation({ ...initial, events: [...initial.events, secondEvent] }, { type: "play" });
    expect(playing.playing).toBe(true);
    const paused = reduceSimulation(playing, { type: "pause" });
    expect(paused.playing).toBe(false);
    const resumed = reduceSimulation(paused, { type: "play" });
    expect(resumed.playing).toBe(true);
  });
});
