import { describe, expect, it } from "vitest";
import { createInternetCoveragePlanDetail, pickReferencePlanForCoverage } from "./coverage-plan-highlight";

const plans = [
  { id: "ftth-home", slug: "plan-hogar-50-mb", name: "Plan Hogar", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 50, speed_up_mbps: null, price_amount: 1, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
  { id: "wireless-home", slug: "inalambrico-20-mb", name: "Plan Inalámbrico", description: null, audience: "home", technology: "WIRELESS", speed_down_mbps: 20, speed_up_mbps: null, price_amount: 1, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
  { id: "adsl-home", slug: "plan-adsl-5-megas", name: "Plan ADSL", description: null, audience: "home", technology: "ADSL", speed_down_mbps: 5, speed_up_mbps: null, price_amount: 1, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
];

describe("coverage plan highlighting", () => {
  it("chooses the matching staging reference by technology and audience", () => {
    expect(pickReferencePlanForCoverage(plans, ["FTTH"], "hogar")?.id).toBe("ftth-home");
    expect(pickReferencePlanForCoverage(plans, ["WIRELESS"], "hogar")?.id).toBe("wireless-home");
    expect(pickReferencePlanForCoverage(plans, ["ADSL"], "hogar")?.id).toBe("adsl-home");
  });

  it("creates a coverage event without address or contact fields", () => {
    const detail = createInternetCoveragePlanDetail({ coverageStatus: "available", coverageSource: "exact_address", technology: "FTTH", technologies: ["FTTH"], commercialAvailability: true, plans: [plans[0]], nextAction: "installation", message: "ok", zoneMatch: false });
    expect(detail).toEqual({ coverageStatus: "available", commercialAvailability: true, technologies: ["FTTH"], availablePlanIds: ["ftth-home"], preferredPlanId: "ftth-home" });
    expect(JSON.stringify(detail)).not.toMatch(/street|number|email|phone/i);
  });
});
