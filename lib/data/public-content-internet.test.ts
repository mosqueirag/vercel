import { describe, expect, it } from "vitest";
import { isInternetRelatedFaq } from "./public-content";

describe("published Internet FAQ selection", () => {
  it("keeps only answers related to Internet technologies or coverage", () => {
    expect(isInternetRelatedFaq({ category: "Internet", question: "¿Cómo consulto cobertura?", answer: "Ingresá calle y altura." })).toBe(true);
    expect(isInternetRelatedFaq({ category: "General", question: "¿Cómo funciona el servicio de sepelio?", answer: "Consultá los canales oficiales." })).toBe(false);
  });
});
