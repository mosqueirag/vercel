import { describe, expect, it } from "vitest";
import { canEditPlan, canPublishInternetPlan, canonicalCommercialTechnology, normalizePlanBenefits, publicationIssues } from "./plan-governance";

describe("internet plan governance", () => {
  const complete = { name: "Plan Fibra", audience: "home" as const, technology: "FTTH", priceAmount: null, currency: null };
  it("requires an explicit, commercially coherent publication payload", () => {
    expect(canPublishInternetPlan(complete)).toBe(true);
    expect(publicationIssues({ ...complete, audience: null })).toContain("audience");
    expect(publicationIssues({ ...complete, technology: null })).toContain("technology");
  });
  it("allows a published plan with a nullable price but not a half price", () => {
    expect(canPublishInternetPlan(complete)).toBe(true);
    expect(canPublishInternetPlan({ ...complete, priceAmount: 1200, currency: null })).toBe(false);
  });
  it("uses the coverage taxonomy for the public commercial offer", () => {
    expect(canonicalCommercialTechnology("FTTH")).toBe("FTTH");
    expect(canonicalCommercialTechnology("Internet inalámbrico")).toBe("WIRELESS");
    expect(canonicalCommercialTechnology("inalambrico")).toBe("WIRELESS");
    expect(canonicalCommercialTechnology("ADSL")).toBeNull();
  });
  it("blocks fixture, test, and unsupported technologies from publication while keeping them editable as drafts", () => {
    const fixture = { ...complete, name: "Plan TEST", technology: "TEST" };
    expect(publicationIssues(fixture)).toContain("technology");
    expect(canPublishInternetPlan(fixture)).toBe(false);
    expect(canEditPlan("draft")).toBe(true);
    expect(canPublishInternetPlan({ ...complete, technology: "Satelital" })).toBe(false);
  });
  it("does not publish legacy ADSL automatically", () => {
    expect(canPublishInternetPlan({ ...complete, technology: "ADSL" })).toBe(false);
  });
  it("keeps benefits editor-safe and limits only empty or surplus entries", () => {
    expect(normalizePlanBenefits(["  Instalación sujeta a validación  ", "", "Soporte"])).toEqual(["Instalación sujeta a validación", "Soporte"]);
  });
  it("does not allow implicit edits of a live or archived offer", () => {
    expect(canEditPlan("draft")).toBe(true);
    expect(canEditPlan("published")).toBe(false);
    expect(canEditPlan("archived")).toBe(false);
  });
});
