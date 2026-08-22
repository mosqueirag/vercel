import { describe, expect, it } from "vitest";
import { compareProtectedFacts, contentSourceHash, editorialBatchOrder, extractProtectedFacts, isEditorialBatchCandidate, isRestrictiveEditorialType, proposalIsStale, proposalNeedsValidation, proposalRiskLevel } from "./proposals";

describe("editorial proposal safeguards", () => {
  it("detects protected phones, prices and URLs", () => {
    expect(extractProtectedFacts("WhatsApp +54 297 123-4567. Plan $ 39058.80. https://coopsar.test").map((fact) => fact.type)).toEqual(expect.arrayContaining(["phone", "price", "url"]));
  });
  it("requires validation when a protected fact changes", () => {
    expect(compareProtectedFacts("Precio $ 100", "Precio $ 200")).toEqual(expect.arrayContaining(["protected_fact_removed:price", "protected_fact_added:price"]));
  });
  it("keeps validation queue and legal content restrictive", () => {
    expect(proposalNeedsValidation("help_article", "Reglamento vigente", { suggested_ctas: [], suggested_coopia_intents: [], editorial_notes: "" }, true)).toEqual(expect.arrayContaining(["historical_validation_queue", "restricted_editorial_content"]));
    expect(isRestrictiveEditorialType("contact_channel", "")).toBe(true);
  });
  it("classifies restricted content before protected facts and ordinary validation", () => {
    expect(proposalRiskLevel("help_article", ["restricted_editorial_content"])).toBe("restricted");
    expect(proposalRiskLevel("faq", ["protected_fact_added:phone"])).toBe("high");
    expect(proposalRiskLevel("faq", ["historical_validation_queue"])).toBe("medium");
    expect(proposalRiskLevel("faq", [])).toBe("low");
  });
  it("hashes the exact source deterministically", () => expect(contentSourceHash({ title: "Contenido" })).toBe(contentSourceHash({ title: "Contenido" })));
  it("limits the general editorial batch to low-risk content in deterministic order", () => {
    expect(editorialBatchOrder).toEqual(["help_article", "faq", "service"]);
    expect(isEditorialBatchCandidate("help_article")).toBe(true);
    expect(isEditorialBatchCandidate("faq")).toBe(true);
    expect(isEditorialBatchCandidate("service")).toBe(true);
    expect(isEditorialBatchCandidate("internet_plan")).toBe(false);
    expect(isEditorialBatchCandidate("contact_channel")).toBe(false);
  });
  it("marks a proposal stale only when the current draft source changed", () => {
    expect(proposalIsStale("same-hash", "same-hash")).toBe(false);
    expect(proposalIsStale("new-hash", "old-hash")).toBe(true);
  });
});
