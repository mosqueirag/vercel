import { describe, expect, it } from "vitest";
import { coverageAnalytics, resolveCoverageFromRecords, resolveCoverageFromZones, resolveCoverageWithPriority } from "./coverage-resolver";

const published = { id: "plan-ftth", name: "Plan FTTH", slug: "plan-ftth", technology: "FTTH", speed_down_mbps: 100, speed_up_mbps: 20, price_amount: null, currency: null, status: "published", published_at: "2026-01-01T00:00:00Z" };
const draft = { ...published, id: "draft", name: "Borrador", status: "draft" };

describe("geographic coverage resolver", () => {
  it("keeps an exact unavailable address ahead of a possible geographic zone", () => {
    const result = resolveCoverageFromRecords([{ street_number: 10, plan_name: null, technology: "FTTH", coverage_status: "unavailable" }], 10, [published]);
    expect(result).toMatchObject({ coverageSource: "exact_address", coverageStatus: "unavailable", plans: [] });
  });

  it("keeps exact coverage above any fallback", () => {
    const result = resolveCoverageFromRecords([{ street_number: 10, plan_name: null, technology: "FTTH", coverage_status: "available" }], 10, [published]);
    expect(result).toMatchObject({ coverageSource: "exact_address", coverageStatus: "available", commercialAvailability: true });
  });

  it("keeps exact planned coverage above a possible geographic zone", () => {
    const result = resolveCoverageFromRecords([{ street_number: 10, plan_name: null, technology: "FTTH", coverage_status: "planned" }], 10, [published]);
    expect(result).toMatchObject({ coverageSource: "exact_address", coverageStatus: "planned", plans: [] });
  });

  it("derives a conservative FTTH zone result and only published compatible plans", () => {
    const result = resolveCoverageFromZones([{ technologies: ["FTTH"] }], [published, draft]);
    expect(result).toMatchObject({ coverageSource: "geographic_zone", coverageStatus: "available", commercialAvailability: false, nextAction: "coverage_validation" });
    expect(result.plans.map((plan) => plan.id)).toEqual(["plan-ftth"]);
  });

  it("keeps all technologies found in overlapping geographic zones", () => {
    const result = resolveCoverageFromZones([{ technologies: ["ADSL", "WIRELESS"] }, { technologies: ["FTTH"] }], [published]);
    expect(result.technologies).toEqual(["ADSL", "FTTH", "WIRELESS"]);
  });

  it("records only non-PII coverage analytics", () => {
    const result = resolveCoverageFromZones([{ technologies: ["FTTH"] }], [published]);
    expect(coverageAnalytics(result)).toEqual({ coverage_source: "geographic_zone", technology: "FTTH", zone_match: true, coverage_status: "available" });
  });

  it("keeps an exact FTTH available address ahead of a polygon", () => {
    const result = resolveCoverageWithPriority([{ street_number: 450, plan_name: null, technology: "FTTH", coverage_status: "available" }], 450, [published], [{ technologies: ["ADSL"] }]);
    expect(result).toMatchObject({ coverageSource: "exact_address", coverageStatus: "available" });
  });

  it("keeps an exact unavailable address ahead of an FTTH polygon", () => {
    const result = resolveCoverageWithPriority([{ street_number: 450, plan_name: null, technology: "FTTH", coverage_status: "unavailable" }], 450, [published], [{ technologies: ["FTTH"] }]);
    expect(result).toMatchObject({ coverageSource: "exact_address", coverageStatus: "unavailable" });
  });

  it("keeps an exact planned address ahead of an FTTH polygon", () => {
    const result = resolveCoverageWithPriority([{ street_number: 450, plan_name: null, technology: "FTTH", coverage_status: "planned" }], 450, [published], [{ technologies: ["FTTH"] }]);
    expect(result).toMatchObject({ coverageSource: "exact_address", coverageStatus: "planned" });
  });

  it("uses a geographic FTTH zone ahead of nearby FTTH records", () => {
    const result = resolveCoverageWithPriority([{ street_number: 449, plan_name: null, technology: "FTTH", coverage_status: "available" }, { street_number: 451, plan_name: null, technology: "FTTH", coverage_status: "available" }], 450, [published], [{ technologies: ["FTTH"] }]);
    expect(result).toMatchObject({ coverageSource: "geographic_zone", coverageStatus: "available", technologies: ["FTTH"], nextAction: "coverage_validation", zoneMatch: true });
    expect(result?.message).toContain("Fibra Óptica COOPSAR");
  });

  it("resolves the España 450 fixture through its FTTH zone, not neighboring rows", () => {
    const result = resolveCoverageWithPriority([{ street_number: 449, plan_name: null, technology: "FTTH", coverage_status: "available" }, { street_number: 451, plan_name: null, technology: "FTTH", coverage_status: "available" }], 450, [published], [{ technologies: ["FTTH"] }]);
    expect(result).toMatchObject({ coverageSource: "geographic_zone", technologies: ["FTTH"], nextAction: "coverage_validation" });
  });

  it("uses nearby records only when no exact address or zone exists", () => {
    const result = resolveCoverageWithPriority([{ street_number: 449, plan_name: null, technology: "FTTH", coverage_status: "available" }], 450, [published], []);
    expect(result).toMatchObject({ coverageSource: "nearby_address", coverageStatus: "nearby", nextAction: "coverage_validation" });
  });

  it("returns null when neither exact, nearby nor zone coverage exists", () => {
    expect(resolveCoverageWithPriority([], 450, [published], [])).toBeNull();
  });
});
