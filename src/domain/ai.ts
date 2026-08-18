import { generateLocalProposal, type Proposal } from "./proposals";

export type StructuredGenerationRequest = { objective: string };
export type StructuredGenerationResult = { provider: "disabled-local"; proposal: Proposal };

export type AIProvider = {
  id: "disabled-local";
  generate(request: StructuredGenerationRequest): StructuredGenerationResult;
};

/** Deliberately offline: no credentials, network client, or project content boundary. */
export const disabledProvider: AIProvider = {
  id: "disabled-local",
  generate: (request) => ({ provider: "disabled-local", proposal: generateLocalProposal(request.objective) }),
};
