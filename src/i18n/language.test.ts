import { describe, expect, it } from "vitest";
import { interpolate } from "./catalog";
import { resolveLocale } from "./language";

describe("language resolution", () => {
  it("uses an explicit locale regardless of system languages", () => {
    expect(resolveLocale("fr", ["en-US"])).toBe("fr");
    expect(resolveLocale("en", ["fr-FR"])).toBe("en");
  });

  it("follows French system languages when System is selected", () => {
    expect(resolveLocale("system", ["en-US", "fr-FR"])).toBe("fr");
    expect(resolveLocale("system", ["de-DE"])).toBe("en");
  });

  it("interpolates dynamic UI values without string concatenation", () => {
    expect(interpolate("{count} agents · {name}", { count: 2, name: "Researcher" })).toBe("2 agents · Researcher");
  });
});
