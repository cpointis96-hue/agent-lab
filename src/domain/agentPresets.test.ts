import { describe, expect, it } from "vitest";
import { AGENT_PRESETS, DEFAULT_AGENT_PRESET } from "./agentPresets";

describe("agent presets", () => {
  it("provides ten unique starter roles with useful purposes", () => {
    expect(AGENT_PRESETS).toHaveLength(10);
    expect(new Set(AGENT_PRESETS.map((preset) => preset.id)).size).toBe(10);
    expect(AGENT_PRESETS.every((preset) => preset.name && preset.purpose && preset.summary)).toBe(true);
    expect(DEFAULT_AGENT_PRESET.id).toBe("researcher");
  });
});
