import { describe, expect, it, vi } from "vitest";
import { disabledProvider } from "./ai";

describe("local-first modes", () => {
  it("generate a manual preview without network access", () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network disabled in test"));
    const result = disabledProvider.generate({ objective: "Explain a local workflow" });
    expect(result.proposal.objective).toContain("Explain a local workflow");
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
});
