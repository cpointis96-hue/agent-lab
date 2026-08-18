import { describe, expect, it } from "vitest";
import { conventionLabel, fileCatalog } from "./fileCatalog";

describe("file catalog", () => {
  it("gives every building block a reason to use and avoid it", () => {
    expect(fileCatalog).toHaveLength(9);
    for (const item of fileCatalog) {
      expect(item.useWhen.length).toBeGreaterThan(10);
      expect(item.avoidWhen.length).toBeGreaterThan(10);
      expect(["Open convention", "Agent Lab convention", "Runtime artifact", "Custom"]).toContain(conventionLabel(item.convention));
    }
    expect(fileCatalog.find((item) => item.filename === "AGENTS.md")?.convention).toBe("open");
    expect(fileCatalog.find((item) => item.filename === "AGENT.md")?.convention).toBe("agent-lab");
  });
});
