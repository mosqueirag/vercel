import { describe, expect, it, vi } from "vitest";

import { applySimpleEditorialProposalTransition, isIdempotentEditorialReviewTransition, resolveEditorialProposalTransition } from "./review-transition";

describe("editorial review transition idempotency", () => {
  it.each(["approved", "rejected", "needs_validation"])("reuses an unchanged %s review without another audit", (action) => {
    expect(isIdempotentEditorialReviewTransition(action, action)).toBe(true);
  });

  it("does not make applied, published or stale flows idempotent here because they have separate gates", () => {
    expect(isIdempotentEditorialReviewTransition("applied", "applied")).toBe(false);
    expect(isIdempotentEditorialReviewTransition("published", "published")).toBe(false);
    expect(isIdempotentEditorialReviewTransition("stale", "stale")).toBe(false);
  });

  it.each([
    ["generated", "approved"],
    ["generated", "rejected"],
    ["generated", "needs_validation"],
    ["needs_validation", "approved"],
    ["needs_validation", "rejected"],
    ["approved", "rejected"],
  ])("allows the canonical simple transition %s → %s", (from, action) => {
    expect(resolveEditorialProposalTransition(from, action)).toEqual({ kind: "transition", nextStatus: action });
  });

  it.each([
    ["rejected", "approved"],
    ["rejected", "needs_validation"],
    ["applied", "approved"],
    ["applied", "rejected"],
    ["published", "approved"],
    ["published", "rejected"],
    ["stale", "approved"],
    ["approved", "needs_validation"],
  ])("rejects the invalid simple transition %s → %s", (from, action) => {
    expect(resolveEditorialProposalTransition(from, action)).toEqual({ kind: "invalid_transition" });
  });

  it.each(["needs_validation", "approved", "rejected"])('treats repeated simple %s as an audit-free no-op', (status) => {
    expect(resolveEditorialProposalTransition(status, status)).toEqual({ kind: "idempotent_noop" });
  });

  it("executes an allowed transition through compare-and-set and records one audit", async () => {
    const compareAndSet = vi.fn().mockResolvedValue({ proposal: { id: "proposal-1", status: "approved" }, error: null });
    const insertAudit = vi.fn().mockResolvedValue({ error: null });

    await expect(applySimpleEditorialProposalTransition("generated", "approved", { compareAndSet, insertAudit })).resolves.toEqual({ kind: "transition", proposal: { id: "proposal-1", status: "approved" } });
    expect(compareAndSet).toHaveBeenCalledWith({ expectedStatus: "generated", nextStatus: "approved" });
    expect(insertAudit).toHaveBeenCalledTimes(1);
    expect(insertAudit).toHaveBeenCalledWith({ action: "approved" });
  });

  it("rejects an invalid reactivation before any compare-and-set or audit write", async () => {
    const compareAndSet = vi.fn();
    const insertAudit = vi.fn();

    await expect(applySimpleEditorialProposalTransition("rejected", "approved", { compareAndSet, insertAudit })).resolves.toEqual({ kind: "invalid_transition" });
    expect(compareAndSet).not.toHaveBeenCalled();
    expect(insertAudit).not.toHaveBeenCalled();
  });

  it("does not audit a compare-and-set conflict caused by a stale client selection", async () => {
    const compareAndSet = vi.fn().mockResolvedValue({ proposal: null, error: null });
    const insertAudit = vi.fn();

    await expect(applySimpleEditorialProposalTransition("generated", "approved", { compareAndSet, insertAudit })).resolves.toEqual({ kind: "concurrency_conflict" });
    expect(compareAndSet).toHaveBeenCalledWith({ expectedStatus: "generated", nextStatus: "approved" });
    expect(insertAudit).not.toHaveBeenCalled();
  });
});
