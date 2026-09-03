import { describe, expect, it } from "vitest";
import { historicalEditorialEntityTypes, validationForSourceSlugs } from "../editorial/historical-corpus";
import { editorialRowsQueryOutcome } from "../editorial/site-page-bridge";

describe("historical editorial corpus safeguards", () => {
  it("limits the historical corpus to services, help articles and FAQs", () => {
    expect(historicalEditorialEntityTypes).toEqual(["help_article", "faq", "service"]);
    expect(historicalEditorialEntityTypes).not.toContain("internet_plan");
    expect(historicalEditorialEntityTypes).not.toContain("contact_channel");
  });

  it("maps validation only when an entity shares a real provenance source", () => {
    const queue = [{ status: "open", source_slugs: ["factura-digital"], reason: "Dato histórico", priority: "P1" }];
    expect(validationForSourceSlugs(["fibra-optica"], queue)).toEqual({ pending: false });
    expect(validationForSourceSlugs(["factura-digital"], queue)).toEqual({ pending: true, reason: "Dato histórico", priority: "P1" });
  });
});

describe("editorial inventory reads", () => {
  it("treats an empty successful query as an empty inventory", () => {
    expect(editorialRowsQueryOutcome([], null)).toEqual({ ok: true, rows: [] });
  });

  it("does not downgrade a failed REST query to an empty inventory", () => {
    expect(editorialRowsQueryOutcome(null, { code: "PGRST999" })).toEqual({ ok: false, reason: "query" });
  });

  it("treats malformed successful payloads as failures rather than empty data", () => {
    expect(editorialRowsQueryOutcome(null, null)).toEqual({ ok: false, reason: "invalid_response" });
  });
});
