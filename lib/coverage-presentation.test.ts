import { describe, expect, it } from "vitest";
import { coverageContextMessage, coveragePresentation, coverageTechnologyLabel } from "./coverage-presentation";

describe("coverage presentation", () => {
  it("presents exact FTTH availability independently from commercial plans", () => {
    expect(coveragePresentation({ coverageSource: "exact_address", coverageStatus: "available", technologies: ["FTTH"], commercialAvailability: false })).toMatchObject({ title: "Fibra Óptica disponible en tu domicilio" });
  });

  it("keeps nearby coverage as a technical validation", () => {
    expect(coveragePresentation({ coverageSource: "nearby_address", coverageStatus: "nearby", technologies: ["FTTH"], commercialAvailability: false })).toMatchObject({ eyebrow: null, title: "Validación técnica requerida" });
    expect(coverageContextMessage({ coverageSource: "nearby_address", coverageStatus: "nearby", technologies: ["FTTH"], commercialAvailability: false }, "La factibilidad de este domicilio requiere validación técnica.")).toBe("Encontramos información cercana o en planificación.");
  });

  it("only presents an unavailable result as no confirmed coverage", () => {
    expect(coveragePresentation({ coverageSource: "exact_address", coverageStatus: "unavailable", technologies: ["FTTH"], commercialAvailability: false })).toMatchObject({ title: "Sin cobertura confirmada" });
  });

  it("uses public technology labels without changing canonical resolver keys", () => {
    expect(coverageTechnologyLabel("FTTH")).toBe("Fibra óptica");
    expect(coverageTechnologyLabel("WIRELESS")).toBe("Internet inalámbrico");
    expect(coverageTechnologyLabel("ADSL")).toBe("ADSL");
  });
});
