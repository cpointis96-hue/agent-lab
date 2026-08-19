import { describe, expect, it } from "vitest";
import { conventionLabel, fileCatalog, fileGroupLabel, lifetimeLabel } from "./fileCatalog";

describe("file catalog", () => {
  it("gives every building block a reason to use and avoid it", () => {
    expect(fileCatalog).toHaveLength(10);
    for (const item of fileCatalog) {
      expect(item.useWhen.length).toBeGreaterThan(10);
      expect(item.avoidWhen.length).toBeGreaterThan(10);
      expect(["Open format", "Agent Lab pattern", "Runtime file", "Project pattern"]).toContain(conventionLabel(item.convention));
      expect(lifetimeLabel(item.lifetime)).toMatch(/Durable|Runtime/);
    }
    expect(fileCatalog.find((item) => item.filename === "AGENTS.md")?.convention).toBe("open");
    expect(fileCatalog.find((item) => item.filename === "AGENT.md")?.convention).toBe("agent-lab");
  });

  it("keeps only the agent and project contracts in the default guide", () => {
    expect(fileCatalog.filter((item) => item.group !== "optional").map((item) => item.filename)).toEqual(["AGENT.md", "AGENTS.md", "SKILL.md", "task.md"]);
    expect(fileCatalog.filter((item) => item.visibility === "optional").every((item) => item.starter)).toBe(true);
    expect(fileGroupLabel("skills")).toBe("Skills");
    expect(fileGroupLabel("run")).toBe("Run files");
  });
});
