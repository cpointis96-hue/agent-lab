import { describe, expect, it } from "vitest";
import { disabledProvider } from "./ai";

describe("disabled AI provider", () => {
  it("returns a local proposal without credentials or project input", () => {
    const result = disabledProvider.generate({ objective: "Map a small workflow" });
    expect(result.provider).toBe("disabled-local");
    expect(result.proposal.objective).toBe("Map a small workflow");
    expect(JSON.stringify(result)).not.toMatch(/token|secret|api.?key/i);
  });
});
