import { contentSourceHash, editorialBatchOrder, editorialPromptVersion, isEditorialBatchCandidate, type EditorialEntityType } from "./proposals";

export type EditorialBatchCandidate = {
  id: string;
  entityType: EditorialEntityType;
  title: string;
  originalText: string;
  status: string;
};

export type EditorialBatchProposal = {
  entity_type: EditorialEntityType;
  entity_id: string;
  source_hash: string;
  prompt_version: string;
};

export function editorialCandidateSourceHash(candidate: Pick<EditorialBatchCandidate, "title" | "originalText" | "entityType">) {
  return contentSourceHash({ title: candidate.title, content: candidate.originalText, entityType: candidate.entityType });
}

export function selectProgressiveEditorialBatch<T extends EditorialBatchCandidate>(candidates: T[], proposals: EditorialBatchProposal[], limit: number) {
  const currentProposals = new Set(proposals.filter((proposal) => proposal.prompt_version === editorialPromptVersion).map((proposal) => `${proposal.entity_type}:${proposal.entity_id}:${proposal.source_hash}`));
  const eligible = candidates.filter((candidate) => candidate.status === "draft" && isEditorialBatchCandidate(candidate.entityType)).sort((a, b) => editorialBatchOrder.indexOf(a.entityType) - editorialBatchOrder.indexOf(b.entityType) || a.title.localeCompare(b.title, "es-AR"));
  const pendingCandidates = eligible.filter((candidate) => !currentProposals.has(`${candidate.entityType}:${candidate.id}:${editorialCandidateSourceHash(candidate)}`));
  const selected = pendingCandidates.slice(0, Math.max(1, Math.min(10, Math.floor(limit))));

  return {
    selected,
    totalCorpus: candidates.length,
    alreadyProcessed: eligible.length - pendingCandidates.length,
    remaining: Math.max(0, pendingCandidates.length - selected.length),
  };
}
