import { describe, expect, it } from "vitest";
import { canPublishEditorialProposal, publicationUpdateValues } from "./publication";

const safe = { entityType: "faq" as const, proposalStatus: "applied", candidateStatus: "draft", riskLevel: "low", validationFlags: [], validationPending: false };

describe("controlled editorial publication", () => {
  it("permits only an applied low-risk historical draft without validations", () => expect(canPublishEditorialProposal(safe).allowed).toBe(true));
  it("does not publish merely approved proposals", () => expect(canPublishEditorialProposal({ ...safe, proposalStatus: "approved" }).allowed).toBe(false));
  it("blocks validation flags, validation queue and non-low risk", () => {
    expect(canPublishEditorialProposal({ ...safe, validationFlags: ["protected_fact_added:phone"] }).allowed).toBe(false);
    expect(canPublishEditorialProposal({ ...safe, validationPending: true }).allowed).toBe(false);
    expect(canPublishEditorialProposal({ ...safe, riskLevel: "high" }).allowed).toBe(false);
  });
  it("never allows plans or contacts through the publication flow", () => {
    expect(canPublishEditorialProposal({ ...safe, entityType: "internet_plan" }).allowed).toBe(false);
    expect(canPublishEditorialProposal({ ...safe, entityType: "contact_channel" }).allowed).toBe(false);
  });
  it("publishes services without a nonexistent published_at column", () => {
    expect(publicationUpdateValues("service", "2026-08-22T00:00:00.000Z")).toEqual({ status: "published" });
    expect(publicationUpdateValues("site_page", "2026-08-22T00:00:00.000Z")).toEqual({ status: "published" });
  });
  it("permits an applied low-risk site page but still excludes plans and contacts", () => {
    expect(canPublishEditorialProposal({ ...safe, entityType: "site_page" }).allowed).toBe(true);
  });
  it("timestamps only articles and FAQs when explicitly publishing", () => {
    const publishedAt = "2026-08-22T00:00:00.000Z";
    expect(publicationUpdateValues("help_article", publishedAt)).toEqual({ status: "published", published_at: publishedAt });
    expect(publicationUpdateValues("faq", publishedAt)).toEqual({ status: "published", published_at: publishedAt });
  });
});
