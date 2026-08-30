import { describe, expect, it } from "vitest";
import type { PublicInternetPlan } from "../data/public-content";
import { filterInternetCatalogByAudience, filterPlansForCoverageAndAudience, prioritizeInternetCatalogPlans } from "./demo-catalog";

const plans: PublicInternetPlan[] = [
  { id: "home", slug: "plan-hogar-50-mb", name: "Hogar 50", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 50, speed_up_mbps: null, price_amount: 100, currency: "ARS", installation_price: 0, installation_notes: null, benefits: [], conditions: null },
  { id: "business", slug: "plan-comercial-100-mb-simetrico", name: "Comercial 100", description: null, audience: "business", technology: "FTTH", speed_down_mbps: 100, speed_up_mbps: 100, price_amount: 200, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
  { id: "adsl", slug: "plan-adsl-5-megas", name: "ADSL 5", description: null, audience: "home", technology: "ADSL", speed_down_mbps: 5, speed_up_mbps: null, price_amount: 100, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
  { id: "unassigned", slug: "pending", name: "Pendiente", description: null, audience: "", technology: "WIRELESS", speed_down_mbps: 20, speed_up_mbps: null, price_amount: null, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
];

describe("Internet audience catalog filtering", () => {
  it("shows only home products after a home audience is selected", () => {
    const catalog = prioritizeInternetCatalogPlans(plans, "hogar");
    expect(catalog.heading).toBe("Planes para tu hogar");
    expect(catalog.preferred.map((plan) => plan.id)).toEqual(["home", "adsl"]);
    expect(filterInternetCatalogByAudience(plans, "hogar").map((plan) => plan.id)).toEqual(["home", "adsl"]);
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

  it("locks home FTTH results to home FTTH plans and excludes technology-less plans", () => {
    const withNullTechnology = [...plans, { ...plans[0], id: "unknown-tech", technology: null }];
    expect(filterPlansForCoverageAndAudience(withNullTechnology, "hogar", { coverageStatus: "available", technologies: ["FTTH"] }).map((plan) => plan.id)).toEqual(["home"]);
  });

  it("shows only the technologies confirmed by coverage and supports multiple confirmed technologies", () => {
    expect(filterPlansForCoverageAndAudience(plans, "hogar", { coverageStatus: "available", technologies: ["ADSL"] }).map((plan) => plan.id)).toEqual(["adsl"]);
    expect(filterPlansForCoverageAndAudience(plans, "hogar", { coverageStatus: "nearby", technologies: ["FTTH", "ADSL"] }).map((plan) => plan.id)).toEqual(["home", "adsl"]);
  });

  it("does not show a compatible plan when coverage is unknown or unavailable", () => {
    expect(filterPlansForCoverageAndAudience(plans, "hogar", { coverageStatus: "unknown", technologies: ["FTTH"] })).toEqual([]);
    expect(filterPlansForCoverageAndAudience(plans, "hogar", { coverageStatus: "unavailable", technologies: [] })).toEqual([]);
  });

  it("keeps all plans from the selected audience before coverage is known", () => {
    expect(filterPlansForCoverageAndAudience(plans, "hogar", null).map((plan) => plan.id)).toEqual(["home", "adsl"]);
  });
});
