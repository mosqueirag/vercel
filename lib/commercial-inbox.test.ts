import { describe, expect, it } from "vitest";
import { aggregateFiberDemand, commercialWhatsAppUrl, isCommercialStatus } from "./commercial-inbox";

describe("commercial inbox helpers", () => {
  it("allows only statuses already supported by internet_requests", () => {
    expect(isCommercialStatus("contacted")).toBe(true);
    expect(isCommercialStatus("invented_pipeline_stage")).toBe(false);
  });

  it("builds a WhatsApp handoff without lead PII in its message", () => {
    const url = commercialWhatsAppUrl("+54 297 400 0000");
    expect(url).toMatch(/^https:\/\/wa\.me\/542974000000\?text=/);
    expect(decodeURIComponent(url || "")).not.toMatch(/DNI|domicilio|socio|nombre/i);
  });

  it("only returns grouped fiber demand and never contact fields", () => {
    const demand = aggregateFiberDemand([{ street: "CALLE TEST", zone: "Centro" }, { street: "CALLE TEST", zone: "Centro" }, { street: "OTRA", zone: "" }]);
    expect(demand).toEqual(expect.arrayContaining([{ label: "Centro", count: 2, dimension: "zone" }, { label: "CALLE TEST", count: 2, dimension: "street" }]));
    expect(demand).not.toEqual(expect.arrayContaining([expect.objectContaining({ label: "OTRA" })]));
  });
});
