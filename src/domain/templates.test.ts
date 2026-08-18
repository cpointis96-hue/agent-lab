import { describe, expect, it } from "vitest";
import { WORKFLOW_TEMPLATES, proposalForTemplate } from "../templates/workflows";

describe("workflow templates", () => {
  it("contains the ten documented templates with previewable edges", () => {
    expect(WORKFLOW_TEMPLATES).toHaveLength(10);
    for (const template of WORKFLOW_TEMPLATES) {
      expect(template.name).toBeTruthy();
      const proposal = proposalForTemplate(template);
      expect(proposal.files).toHaveLength(proposal.agents.length);
      for (const edge of template.edges) {
        expect(edge.source).toBeLessThan(template.agents.length);
        expect(edge.target).toBeLessThan(template.agents.length);
      }
      expect(proposal.edges).toHaveLength(template.edges.length);
    }
  });
});
