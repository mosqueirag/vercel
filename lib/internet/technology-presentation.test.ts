import { describe, expect, it } from "vitest";
import { getInternetTechnologyPresentation } from "./technology-presentation";

describe("technology presentation", () => {
  it("presents concise technology characteristics without prices, speeds, availability, or CTAs", () => {
    const ftth = getInternetTechnologyPresentation("FTTH");
    expect(ftth.heading).toBe("Conectividad por fibra óptica");
    expect(ftth.facts).toContain("Conexión por fibra.");
    expect(JSON.stringify(ftth)).not.toMatch(/Mbps|precio|consultar mi domicilio/i);
  });
});
