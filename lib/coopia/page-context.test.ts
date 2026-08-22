import { describe, expect, it } from "vitest";
import { deriveCoopiaPageContext } from "./page-context";

describe("deriveCoopiaPageContext", () => {
  it("derives safe service context from the pathname", () => {
    expect(deriveCoopiaPageContext("/fibra-optica", "/internet")).toMatchObject({ pageType: "service", service: "fiber", previousPage: "/internet" });
  });

  it("does not trust external-looking previous paths", () => {
    expect(deriveCoopiaPageContext("/noticias/aviso", "https://other.example").previousPage).toBe("/");
  });
});
