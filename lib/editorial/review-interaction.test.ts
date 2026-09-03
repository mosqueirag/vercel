import { describe, expect, it, vi } from "vitest";

import {
  canApplyEditorialProposal,
  canGenerateEditorialProposal,
  canReviewEditorialProposal,
  focusEditorialReviewPanel,
  isEditorialReviewDismissKey,
  proposalActionLabel,
  reconciliationWarning,
  replaceCanonicalProposal,
  reviewPendingLabel,
} from "./review-interaction";

describe("editorial review interactions", () => {
  it("moves the visible review panel into view and gives its heading focus", () => {
    const title = { focus: vi.fn() } as unknown as HTMLElement;
    const panel = {
      scrollIntoView: vi.fn(),
      querySelector: vi.fn(() => title),
    };

    focusEditorialReviewPanel(panel);

    expect(panel.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(panel.querySelector).toHaveBeenCalledWith("[data-editorial-review-title]");
    expect(title.focus).toHaveBeenCalledOnce();
  });

  it("allows applying only an approved proposal", () => {
    expect(canApplyEditorialProposal("approved")).toBe(true);
    expect(canApplyEditorialProposal("generated")).toBe(false);
    expect(canApplyEditorialProposal("needs_validation")).toBe(false);
    expect(canApplyEditorialProposal("rejected")).toBe(false);
    expect(canApplyEditorialProposal("applied")).toBe(false);
    expect(canApplyEditorialProposal("stale")).toBe(false);
  });

  it("labels and gates a single pending review action without allowing incompatible transitions", () => {
    expect(reviewPendingLabel("approved")).toBe("Aprobando…");
    expect(reviewPendingLabel("applied")).toBe("Aplicando…");
    expect(canReviewEditorialProposal("generated", "approved")).toBe(true);
    expect(canReviewEditorialProposal("needs_validation", "approved")).toBe(true);
    expect(canReviewEditorialProposal("approved", "rejected")).toBe(true);
    expect(canReviewEditorialProposal("approved", "applied")).toBe(true);
    expect(canReviewEditorialProposal("generated", "applied")).toBe(false);
    expect(canReviewEditorialProposal("rejected", "approved")).toBe(false);
    expect(canReviewEditorialProposal("rejected", "needs_validation")).toBe(false);
    expect(canReviewEditorialProposal("applied", "approved")).toBe(false);
    expect(canReviewEditorialProposal("published", "approved")).toBe(false);
    expect(canReviewEditorialProposal("stale", "approved")).toBe(false);
  });

  it("uses the canonical PATCH response immediately and preserves it when reconciliation fails", () => {
    const before = [{ id: "proposal-1", status: "generated" }, { id: "proposal-2", status: "approved" }];
    expect(replaceCanonicalProposal(before, { id: "proposal-1", status: "approved" })).toEqual([{ id: "proposal-1", status: "approved" }, { id: "proposal-2", status: "approved" }]);
    expect(reconciliationWarning()).toContain("operación fue confirmada");
  });

  it("does not allow proposal generation for published content", () => {
    expect(canGenerateEditorialProposal("draft")).toBe(true);
    expect(canGenerateEditorialProposal("published")).toBe(false);
  });

  it("uses copy that preserves idempotency when a proposal already exists", () => {
    expect(proposalActionLabel(false)).toBe("Generar propuesta");
    expect(proposalActionLabel(true)).toBe("Ver propuesta actual");
  });

  it("recognizes Escape as the review dismissal key", () => {
    expect(isEditorialReviewDismissKey("Escape")).toBe(true);
    expect(isEditorialReviewDismissKey("Enter")).toBe(false);
  });
});
