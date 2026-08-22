import { describe, expect, it } from "vitest";

import { isIdempotentEditorialReviewTransition } from "./review-transition";

describe("editorial review transition idempotency", () => {
  it.each(["approved", "rejected", "needs_validation"])("reuses an unchanged %s review without another audit", (action) => {
    expect(isIdempotentEditorialReviewTransition(action, action)).toBe(true);
  });

  it("does not make applied, published or stale flows idempotent here because they have separate gates", () => {
    expect(isIdempotentEditorialReviewTransition("applied", "applied")).toBe(false);
    expect(isIdempotentEditorialReviewTransition("published", "published")).toBe(false);
    expect(isIdempotentEditorialReviewTransition("stale", "stale")).toBe(false);
  });
});
