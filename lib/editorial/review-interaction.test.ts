import { describe, expect, it, vi } from "vitest";

import {
  canApplyEditorialProposal,
  canGenerateEditorialProposal,
  focusEditorialReviewPanel,
  isEditorialReviewDismissKey,
  proposalActionLabel,
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
