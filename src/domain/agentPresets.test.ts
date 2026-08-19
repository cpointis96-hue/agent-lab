import { describe, expect, it } from "vitest";
import { AGENT_PRESETS, DEFAULT_AGENT_PRESET, agentMarkdown } from "./agentPresets";

describe("agent presets", () => {
  it("provides ten unique starter roles with useful purposes", () => {
    expect(AGENT_PRESETS).toHaveLength(10);
    expect(new Set(AGENT_PRESETS.map((preset) => preset.id)).size).toBe(10);
    expect(AGENT_PRESETS.every((preset) => preset.name && preset.purpose && preset.summary && preset.responsibilities && preset.inputs && preset.outputs && preset.boundaries)).toBe(true);
    expect(DEFAULT_AGENT_PRESET.id).toBe("researcher");
  });

  it("renders every preset as a complete agent brief", () => {
    for (const preset of AGENT_PRESETS) {
      const content = agentMarkdown(preset);
      expect(content).toContain("## Purpose");
      expect(content).toContain("## Responsibilities");
      expect(content).toContain("## Inputs");
      expect(content).toContain("## Outputs");
      expect(content).toContain("## Boundaries");
      expect(content).not.toMatch(/Define the stable|Describe what/);
    }
  });
});
