import { describe, expect, it } from "vitest";
import { hasPublishedCompatiblePlans, internetCanonicalPath } from "./public-experience";

describe("public Internet experience", () => {
  it("uses one canonical public route", () => {
    expect(internetCanonicalPath).toBe("/internet");
  });

  it("does not render a plans section when coverage has no published compatible plans", () => {
    expect(hasPublishedCompatiblePlans({ commercialAvailability: false, plans: [] })).toBe(false);
  });

  it("renders only compatible plans returned by the server", () => {
    expect(hasPublishedCompatiblePlans({ commercialAvailability: true, plans: [{ id: "published", name: "Plan", slug: "plan", technology: "FTTH", speed_down_mbps: null, price_amount: null, currency: null }] })).toBe(true);
  });

  it("keeps an empty general catalog separate from a coverage result", () => {
    expect(hasPublishedCompatiblePlans({ commercialAvailability: false, plans: [] })).toBe(false);
  });
});
