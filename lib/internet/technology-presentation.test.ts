import { describe, expect, it } from "vitest";
import { getInternetTechnologyPresentation } from "./technology-presentation";

const plans = [
  { id: "fiber-50", slug: "fiber-50", name: "Fibra 50", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 50, speed_up_mbps: null, price_amount: null, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
  { id: "fiber-100", slug: "fiber-100", name: "Fibra 100", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 100, speed_up_mbps: null, price_amount: null, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
  { id: "wireless-20", slug: "wireless-20", name: "Wireless 20", description: null, audience: "home", technology: "WIRELESS", speed_down_mbps: 20, speed_up_mbps: null, price_amount: null, currency: "ARS", installation_price: null, installation_notes: null, benefits: [], conditions: null },
];

describe("technology presentation", () => {
  it("derives dynamic details only from catalog technology data", () => {
    expect(getInternetTechnologyPresentation(plans, "FTTH").speeds).toEqual([50, 100]);
    expect(getInternetTechnologyPresentation(plans, "WIRELESS").speeds).toEqual([20]);
    expect(getInternetTechnologyPresentation(plans, "ADSL").speeds).toEqual([]);
  });
});
