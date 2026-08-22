import { contentSourceHash, type EditorialEntityType } from "./proposals";

export type EditorialGenerationCandidate = {
  entityType: EditorialEntityType;
  title: string;
  originalText: string;
  status: string;
};

export function editorialGenerationSourceHash(candidate: Pick<EditorialGenerationCandidate, "entityType" | "title" | "originalText">) {
  return contentSourceHash({ title: candidate.title, content: candidate.originalText, entityType: candidate.entityType });
}

export function canPersistGeneratedProposal(sourceHash: string, currentCandidate: EditorialGenerationCandidate | null) {
  if (!currentCandidate || currentCandidate.status !== "draft") return { allowed: false as const, reason: "stale_candidate" as const };
  return editorialGenerationSourceHash(currentCandidate) === sourceHash
    ? { allowed: true as const }
    : { allowed: false as const, reason: "stale_candidate" as const };
}
