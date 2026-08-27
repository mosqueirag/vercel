import { describe, expect, it } from "vitest";
import { hasPublishedCompatiblePlans, internetCanonicalPath, internetSalesHeroAction, shouldShowGeneralInternetCatalog, shouldShowInternetProductStory } from "./public-experience";
import { createPlanSelectedEvent, createPlanSelectionDetail, pickCompatiblePlan, requestedPlanIsCompatible } from "./plan-selection";

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
    expect(shouldShowGeneralInternetCatalog([])).toBe(false);
    expect(shouldShowGeneralInternetCatalog([{ id: "published" }])).toBe(true);
  });

  it("keeps product content available when no plan is published", () => {
    expect(shouldShowInternetProductStory([])).toBe(true);
    expect(shouldShowInternetProductStory([{ id: "published" }])).toBe(true);
  });

  it("keeps the landing commercial when no public plan exists", () => {
    expect(internetSalesHeroAction(false)).toEqual({ href: "#contratar", label: "Consultar Internet disponible" });
    expect(internetSalesHeroAction(true)).toEqual({ href: "#opciones", label: "Ver opciones de Internet" });
  });

  it("carries a selected public offer to coverage without treating it as compatible yet", () => {
    const plans = [{ id: "compatible", slug: "fibra", }, { id: "other", slug: "wireless" }];
    expect(createPlanSelectionDetail(plans[0])).toEqual({ planId: "compatible", planSlug: "fibra" });
    expect(pickCompatiblePlan(plans, "compatible")?.id).toBe("compatible");
    expect(pickCompatiblePlan(plans, "unavailable")?.id).toBe("compatible");
    expect(requestedPlanIsCompatible(plans, "compatible")).toBe(true);
    expect(requestedPlanIsCompatible(plans, "unavailable")).toBe(false);
    expect(createPlanSelectedEvent(plans[0], "journey-test", "session-test")).toEqual({
      journeyId: "journey-test",
      sessionId: "session-test",
      eventType: "plan_selected",
      result: "fibra",
      page: "/internet",
      service: "internet",
    });
  });
});
