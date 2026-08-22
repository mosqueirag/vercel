import { describe, expect, it } from "vitest";

import { editorialCandidateSourceHash, selectProgressiveEditorialBatch, type EditorialBatchCandidate } from "./batch-selection";
import { editorialPromptVersion } from "./proposals";

const candidate = (id: string, entityType: EditorialBatchCandidate["entityType"] = "help_article", status = "draft"): EditorialBatchCandidate => ({ id, entityType, status, title: `Contenido ${id.padStart(3, "0")}`, originalText: `Texto ${id}` });
const current = (item: EditorialBatchCandidate) => ({ entity_type: item.entityType, entity_id: item.id, source_hash: editorialCandidateSourceHash(item), prompt_version: editorialPromptVersion });

describe("progressive editorial batch selection", () => {
  it("continues after five candidates already have current proposals", () => {
    const candidates = Array.from({ length: 10 }, (_, index) => candidate(String(index + 1)));
    expect(selectProgressiveEditorialBatch(candidates, candidates.slice(0, 5).map(current), 5).selected.map((item) => item.id)).toEqual(["6", "7", "8", "9", "10"]);
  });

  it("keeps progressing after the first ten candidates were processed", () => {
    const candidates = Array.from({ length: 15 }, (_, index) => candidate(String(index + 1)));
    expect(selectProgressiveEditorialBatch(candidates, candidates.slice(0, 10).map(current), 5).selected.map((item) => item.id)).toEqual(["11", "12", "13", "14", "15"]);
  });

  it("treats an old source hash as pending while exact current hashes remain idempotent", () => {
    const item = candidate("1");
    const old = { ...current(item), source_hash: "old-source-hash" };
    expect(selectProgressiveEditorialBatch([item], [old], 5).selected).toHaveLength(1);
    expect(selectProgressiveEditorialBatch([item], [current(item)], 5)).toMatchObject({ selected: [], alreadyProcessed: 1, remaining: 0 });
  });

  it("excludes contacts, plans and published content while retaining the bounded historical corpus", () => {
    const corpus = [
      ...Array.from({ length: 24 }, (_, index) => candidate(`article-${index}`, "help_article")),
      ...Array.from({ length: 11 }, (_, index) => candidate(`faq-${index}`, "faq")),
      ...Array.from({ length: 9 }, (_, index) => candidate(`service-${index}`, "service")),
      candidate("plan", "internet_plan"),
      candidate("contact", "contact_channel"),
      candidate("published", "faq", "published"),
    ];
    const selection = selectProgressiveEditorialBatch(corpus, [], 10);
    expect(selection.totalCorpus).toBe(47);
    expect(selection.selected).toHaveLength(10);
    expect(selection.selected.every((item) => ["service", "help_article", "faq"].includes(item.entityType) && item.status === "draft")).toBe(true);
    expect(selectProgressiveEditorialBatch(corpus.slice(0, 44), [], 10).totalCorpus).toBe(44);
  });
});
