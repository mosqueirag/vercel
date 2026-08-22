import { describe, expect, it } from "vitest";
import { canBulkApplyEditorialProposal, canBulkApproveEditorialProposal, isReadyToPublishEditorialCandidate, selectLowRiskEditorialCandidates, type EditorialReviewCandidate, type EditorialReviewProposal } from "./bulk-review";

const candidate = (overrides: Partial<EditorialReviewCandidate> = {}): EditorialReviewCandidate => ({ id: "faq-1", entityType: "faq", status: "draft", validationPending: false, historicalCorpus: true, ...overrides });
const proposal = (overrides: Partial<EditorialReviewProposal> = {}): EditorialReviewProposal => ({ id: "proposal-1", entity_id: "faq-1", status: "generated", risk_level: "low", validation_flags: [], ...overrides });

describe("bulk editorial review safeguards", () => {
  it("selects only explicit low-risk generated historical drafts", () => {
    const safe = candidate();
    const needsValidation = candidate({ id: "faq-2", validationPending: true });
    const restricted = candidate({ id: "service-1", entityType: "service" });
    const selected = selectLowRiskEditorialCandidates(
      [safe, needsValidation, restricted],
      new Map([
        [safe.id, proposal()],
        [needsValidation.id, proposal({ id: "proposal-2", entity_id: needsValidation.id })],
        [restricted.id, proposal({ id: "proposal-3", entity_id: restricted.id, risk_level: "restricted", validation_flags: ["restricted_editorial_content"] })],
      ]),
    );
    expect(selected).toEqual([safe.id]);
  });

  it("requires an approved proposal before a bulk apply and never treats approval as publication", () => {
    expect(canBulkApproveEditorialProposal(proposal())).toBe(true);
    expect(canBulkApproveEditorialProposal(proposal({ status: "stale" }))).toBe(false);
    expect(canBulkApplyEditorialProposal(proposal())).toBe(false);
    expect(canBulkApplyEditorialProposal(proposal({ status: "approved" }))).toBe(true);
  });

  it("requires all publication gates for ready-to-publish", () => {
    expect(isReadyToPublishEditorialCandidate(candidate(), proposal({ status: "applied" }))).toBe(true);
    expect(isReadyToPublishEditorialCandidate(candidate(), proposal({ status: "approved" }))).toBe(false);
    expect(isReadyToPublishEditorialCandidate(candidate({ validationPending: true }), proposal({ status: "applied" }))).toBe(false);
    expect(isReadyToPublishEditorialCandidate(candidate(), proposal({ status: "applied", validation_flags: ["protected_fact_added:phone"] }))).toBe(false);
  });

  it("never selects plans or contacts for review or publication", () => {
    for (const entityType of ["internet_plan", "contact_channel"] as const) {
      expect(selectLowRiskEditorialCandidates([candidate({ entityType })], new Map([["faq-1", proposal()]]))).toEqual([]);
      expect(isReadyToPublishEditorialCandidate(candidate({ entityType }), proposal({ status: "applied" }))).toBe(false);
    }
  });
});
