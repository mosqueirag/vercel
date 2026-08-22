import { describe, expect, it } from "vitest";
import { compareProtectedFacts, contentSourceHash, extractProtectedFacts, isRestrictiveEditorialType, proposalNeedsValidation } from "./proposals";

describe("editorial proposal safeguards", () => {
  it("detects protected phones, prices and URLs", () => {
    expect(extractProtectedFacts("WhatsApp +54 297 123-4567. Plan $ 39058.80. https://coopsar.test").map((fact) => fact.type)).toEqual(expect.arrayContaining(["phone", "price", "url"]));
  });
  it("requires validation when a protected fact changes", () => {
    expect(compareProtectedFacts("Precio $ 100", "Precio $ 200")).toEqual(expect.arrayContaining(["protected_fact_removed:price", "protected_fact_added:price"]));
  });
  it("keeps validation queue and legal content restrictive", () => {
    expect(proposalNeedsValidation("help_article", "Reglamento vigente", { suggested_ctas: [], suggested_coopia_intents: [], editorial_notes: "" }, true)).toEqual(expect.arrayContaining(["historical_validation_queue", "restricted_editorial_content"]));
    expect(isRestrictiveEditorialType("contact_channel", "")).toBe(true);
  });
  it("hashes the exact source deterministically", () => expect(contentSourceHash({ title: "Contenido" })).toBe(contentSourceHash({ title: "Contenido" })));
});
