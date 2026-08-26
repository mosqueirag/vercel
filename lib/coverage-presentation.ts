export type CoveragePresentationInput = {
  coverageStatus: "available" | "nearby" | "planned" | "unavailable" | "unknown";
  coverageSource: "exact_address" | "geographic_zone" | "nearby_address" | "unknown";
  technologies: string[];
  commercialAvailability: boolean;
};

function hasTechnology(coverage: CoveragePresentationInput, technology: string) {
  return coverage.technologies.includes(technology);
}

/** Public labels stay understandable while the resolver keeps canonical keys. */
export function coverageTechnologyLabel(technology: string) {
  if (technology === "FTTH") return "Fibra óptica";
  if (technology === "WIRELESS") return "Internet inalámbrico";
  return technology;
}

/**
 * Presentation follows the resolver's technical coverage result. Commercial
 * availability only adds plan information; it never negates confirmed coverage.
 */
export function coveragePresentation(coverage: CoveragePresentationInput | null) {
  const exactAvailable = coverage?.coverageSource === "exact_address" && coverage.coverageStatus === "available";
  const isZone = coverage?.coverageSource === "geographic_zone";
  const ftth = Boolean(coverage && hasTechnology(coverage, "FTTH"));
  const adsl = Boolean(coverage && hasTechnology(coverage, "ADSL"));

  if (exactAvailable && ftth) {
    return { eyebrow: "Cobertura confirmada", title: "Fibra Óptica disponible en tu domicilio", showTechnologies: true };
  }
  if (exactAvailable && adsl) {
    return { eyebrow: "Cobertura confirmada", title: "Servicio de Internet disponible en tu domicilio", showTechnologies: true };
  }
  if (isZone && ftth) {
    return { eyebrow: "Zona de Fibra Óptica", title: "Fibra Óptica disponible en tu zona", showTechnologies: true };
  }
  if (isZone && adsl) {
    return { eyebrow: "Zona habilitada — sujeto a validación técnica", title: "Internet disponible en tu zona", showTechnologies: true };
  }
  if (coverage?.coverageStatus === "nearby" || coverage?.coverageStatus === "planned") {
    return { eyebrow: "Validación requerida", title: "Validación técnica requerida", showTechnologies: true };
  }
  if (coverage?.coverageStatus === "unavailable" || coverage?.coverageStatus === "unknown") {
    return { eyebrow: "Información de cobertura", title: "Sin cobertura confirmada", showTechnologies: false };
  }
  return { eyebrow: "Información de cobertura", title: coverage?.commercialAvailability ? "Planes compatibles" : "Cobertura a confirmar", showTechnologies: true };
}
