import { describe, expect, it } from "vitest";
import { parseSitePageEditorialProposal } from "./site-page-proposal-schema";

describe("site page editorial generator schema", () => {
  const valid = { rewritten_eyebrow: "Ayuda", rewritten_title: "Centro de ayuda", rewritten_intro: "Guías oficiales.", editorial_notes: "Se simplificó el copy." };
  it("accepts only the top-level copy contract", () => expect(parseSitePageEditorialProposal(valid).success).toBe(true));
  it("rejects unexpected item and href fields", () => {
    expect(parseSitePageEditorialProposal({ ...valid, items: [] }).success).toBe(false);
    expect(parseSitePageEditorialProposal({ ...valid, href: "/otro" }).success).toBe(false);
  });
});
