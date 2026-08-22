import type { EditorialEntityType } from "./proposals";

export type EditorialReviewCandidate = {
  id: string;
  entityType: EditorialEntityType;
  status: string;
  validationPending: boolean;
  historicalCorpus: boolean;
};

export type EditorialReviewProposal = {
  id: string;
  entity_id: string;
  status: string;
  risk_level: string;
  validation_flags: string[];
};

const publicableTypes = new Set<EditorialEntityType>(["service", "help_article", "faq"]);

export function isLowRiskEditorialCandidate(candidate: EditorialReviewCandidate, proposal: EditorialReviewProposal | undefined) {
  return Boolean(
    proposal
      && candidate.historicalCorpus
      && publicableTypes.has(candidate.entityType)
      && candidate.status === "draft"
      && proposal.status === "generated"
      && proposal.risk_level === "low"
      && proposal.validation_flags.length === 0
      && !candidate.validationPending,
  );
}

export function isReadyToPublishEditorialCandidate(candidate: EditorialReviewCandidate, proposal: EditorialReviewProposal | undefined) {
  return Boolean(
    proposal
      && candidate.historicalCorpus
      && publicableTypes.has(candidate.entityType)
      && candidate.status === "draft"
      && proposal.status === "applied"
      && proposal.risk_level === "low"
      && proposal.validation_flags.length === 0
      && !candidate.validationPending,
  );
}

export function canBulkApproveEditorialProposal(proposal: EditorialReviewProposal | undefined) {
  return proposal?.status === "generated" || proposal?.status === "needs_validation";
}

export function canBulkApplyEditorialProposal(proposal: EditorialReviewProposal | undefined) {
  return proposal?.status === "approved";
}

export function selectLowRiskEditorialCandidates(candidates: EditorialReviewCandidate[], proposalsByCandidateId: Map<string, EditorialReviewProposal>) {
  return candidates.filter((candidate) => isLowRiskEditorialCandidate(candidate, proposalsByCandidateId.get(candidate.id))).map((candidate) => candidate.id);
}
