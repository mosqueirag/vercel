import { describe, expect, it } from "vitest";
import { getInternetPlanPresentation } from "./plan-presentation";

describe("getInternetPlanPresentation", () => {
  it("uses friendly names while keeping commercial values on the source record", () => {
    const presentation = getInternetPlanPresentation({
      slug: "plan-comercial-100-mb-simetrico", name: "PLAN COMERCIAL 100 MB SIMETRICO", audience: "business", technology: "FTTH", speed_down_mbps: 100, speed_up_mbps: 100, installation_price: 0, installation_notes: null,
    });

    expect(presentation).toMatchObject({ displayName: "Comercial 100/100", technologyLabel: "Fibra óptica", speedLabel: "100 Mbps", secondaryLabel: "100 Mbps de subida" });
  });

  it("falls back to the managed plan name when the slug is not in the presentation map", () => {
    expect(getInternetPlanPresentation({ slug: "future-plan", name: "Plan futuro", audience: "", technology: "WIRELESS", speed_down_mbps: null, speed_up_mbps: null, installation_price: null, installation_notes: null }).displayName).toBe("Plan futuro");
  });

  it("presents the approved ADSL catalog entry with its commercial label", () => {
    expect(getInternetPlanPresentation({ slug: "plan-adsl-5-megas", name: "Plan ADSL 5 Megas", audience: "home", technology: "ADSL", speed_down_mbps: 5, speed_up_mbps: null, installation_price: null, installation_notes: null })).toMatchObject({ displayName: "ADSL 5", technologyLabel: "ADSL", speedLabel: "5 Mbps" });
  });
});
