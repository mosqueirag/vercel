import { describe, expect, it } from "vitest";
import type { PublicInternetPlan } from "../data/public-content";
import { filterInternetCatalogByAudience, prioritizeInternetCatalogPlans } from "./demo-catalog";

const plans: PublicInternetPlan[] = [
  { id: "home", slug: "plan-hogar-50-mb", name: "Hogar 50", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 50, speed_up_mbps: null, price_amount: 100, currency: "ARS", installation_price: 0, installation_notes: null, benefits: [], conditions: null },
  { id: "business", slug: "plan-comercial-100-mb-simetrico", name: "Comercial 100", description: null, audience: "business", technology: "FTTH", speed_down_mbps: 100, speed_up_mbps: 100, price_amount: 200, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
  { id: "unassigned", slug: "pending", name: "Pendiente", description: null, audience: "", technology: "WIRELESS", speed_down_mbps: 20, speed_up_mbps: null, price_amount: null, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
];

describe("Internet audience catalog filtering", () => {
  it("shows only home products after a home audience is selected", () => {
    const catalog = prioritizeInternetCatalogPlans(plans, "hogar");
    expect(catalog.heading).toBe("Planes para tu hogar");
    expect(catalog.preferred.map((plan) => plan.id)).toEqual(["home"]);
    expect(filterInternetCatalogByAudience(plans, "hogar").map((plan) => plan.id)).toEqual(["home"]);
  });

  it("shows only business products for comercio", () => {
    expect(prioritizeInternetCatalogPlans(plans, "comercio").preferred.map((plan) => plan.id)).toEqual(["business"]);
    expect(filterInternetCatalogByAudience(plans, "comercio").map((plan) => plan.id)).toEqual(["business"]);
  });

  it("does not expose a standard catalog before selecting an audience or for empresa", () => {
    expect(filterInternetCatalogByAudience(plans, null)).toEqual([]);
    expect(filterInternetCatalogByAudience(plans, "empresa")).toEqual([]);
    expect(prioritizeInternetCatalogPlans(plans, "empresa").heading).toBe("Internet para empresas");
  });
});
