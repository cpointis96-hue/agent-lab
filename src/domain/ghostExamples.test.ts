import { describe, expect, it } from "vitest";
import { ghostExampleFor } from "./ghostExamples";

describe("ghost examples", () => {
  it("provides render-only content for selected empty building blocks", () => {
    expect(ghostExampleFor("shared/MEMORY.md")).toContain("# Memory");
    expect(ghostExampleFor("notes.txt")).toBeNull();
  });
});
