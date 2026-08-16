import { describe, expect, it } from "vitest";
import { categoryDetails, normalizeStreet, parseServiceAddress } from "./coverage";

describe("coverage address normalization", () => {
  it("normalizes accents, punctuation and street prefixes", () => {
    expect(normalizeStreet("Av. José Hernández")).toBe("JOSE HERNANDEZ");
  });

  it("parses trailing and leading house numbers", () => {
    expect(parseServiceAddress("San Martín 1234")).toEqual({ streetNormalized: "SAN MARTIN", streetNumber: 1234 });
    expect(parseServiceAddress("1234 Calle Belgrano")).toEqual({ streetNormalized: "BELGRANO", streetNumber: 1234 });
    expect(parseServiceAddress("Av. 9 de Julio N° 790 y Ameghino")).toEqual({ streetNormalized: "9 DE JULIO", streetNumber: 790 });
  });

  it("does not invent a number", () => {
    expect(parseServiceAddress("Barrio sin altura")).toBeNull();
  });
});

describe("service category metadata", () => {
  it("preserves conservative technology labels", () => {
    expect(categoryDetails("ADSL HASTA 5 MB")).toEqual({ technology: "ADSL", speedMbps: 5 });
    expect(categoryDetails("PLAN HOGAR 50 MB")).toEqual({ technology: "Internet", speedMbps: 50 });
  });
});
