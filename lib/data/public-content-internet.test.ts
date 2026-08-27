import { describe, expect, it } from "vitest";
import { isFuneralRelatedFaq, isInternetRelatedFaq } from "./public-content";

describe("published Internet FAQ selection", () => {
  it("keeps only answers related to Internet technologies or coverage", () => {
    expect(isInternetRelatedFaq({ category: "Internet", question: "¿Cómo consulto cobertura?", answer: "Ingresá calle y altura." })).toBe(true);
    expect(isInternetRelatedFaq({ category: "General", question: "¿Cómo funciona el servicio de sepelio?", answer: "Consultá los canales oficiales." })).toBe(false);
  });
});

describe("published Sepelio FAQ selection", () => {
  it("keeps only answers relevant to the published service", () => {
    expect(isFuneralRelatedFaq({ category: "Sepelio", question: "¿Cómo consulto mi grupo familiar?", answer: "Canal oficial." })).toBe(true);
    expect(isFuneralRelatedFaq({ category: "Internet", question: "¿Cómo funciona la fibra?", answer: "Consultá cobertura." })).toBe(false);
  });
});
