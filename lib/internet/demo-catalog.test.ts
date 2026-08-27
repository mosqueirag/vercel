import { describe, expect, it } from "vitest";
import type { PublicInternetPlan } from "../data/public-content";
import { prioritizeInternetCatalogPlans } from "./demo-catalog";

const plans: PublicInternetPlan[] = [
  { id: "home", slug: "plan-hogar-50-mb", name: "Hogar 50", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 50, speed_up_mbps: null, price_amount: 100, currency: "ARS", installation_price: 0, installation_notes: null, benefits: [], conditions: null },
  { id: "business", slug: "plan-comercial-100-mb-simetrico", name: "Comercial 100", description: null, audience: "business", technology: "FTTH", speed_down_mbps: 100, speed_up_mbps: 100, price_amount: 200, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
];

describe("prioritizeInternetCatalogPlans", () => {
  it("prioritizes home products after a home audience is selected", () => {
    const catalog = prioritizeInternetCatalogPlans(plans, "hogar");
    expect(catalog.preferred.map((plan) => plan.id)).toEqual(["home"]);
    expect(catalog.alternatives.map((plan) => plan.id)).toEqual(["business"]);
  });

  it("keeps business options first for commerce and company", () => {
    expect(prioritizeInternetCatalogPlans(plans, "comercio").preferred[0]?.id).toBe("business");
    expect(prioritizeInternetCatalogPlans(plans, "empresa").preferred[0]?.id).toBe("business");
  });
});
