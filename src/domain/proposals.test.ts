import { describe, expect, it } from "vitest";
import { explainProposal, generateLocalProposal, simplifyProposal } from "./proposals";

describe("local AI proposals", () => {
  it("generates, explains, simplifies, and never needs a provider", () => {
    const proposal = generateLocalProposal("Compare two research paths");
    expect(proposal.provider).toBe("disabled-local");
    expect(proposal.files).toHaveLength(3);
    expect(proposal.edges).toHaveLength(2);
    expect(explainProposal(proposal)).toContain("Researcher");
    expect(simplifyProposal(proposal).agents).toHaveLength(2);
  });
});
