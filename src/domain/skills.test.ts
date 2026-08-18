import { describe, expect, it } from "vitest";
import { validateSkillImportInventory } from "./skills";

describe("local skills", () => {
  it("flags executable-looking files and collisions without executing anything", () => {
    const preview = validateSkillImportInventory([{ path: "SKILL.md", size: 20, executableLooking: false }, { path: "scripts/check.sh", size: 8, executableLooking: true }], "skills/fact-check", ["skills/fact-check/SKILL.md"]);
    expect(preview.hasExecutableLookingFiles).toBe(true);
    expect(preview.collisions).toEqual(["skills/fact-check/SKILL.md"]);
    expect(preview.safe).toBe(false);
  });
  it("rejects traversal", () => {
    expect(() => validateSkillImportInventory([{ path: "../outside.sh", size: 1, executableLooking: true }], "skills/x")).toThrow(/traversal/);
  });
});
