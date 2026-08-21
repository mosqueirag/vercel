import { selectCoverage, type CoverageRecord, type CoverageStatus } from "./coverage-results";

export type CoverageTechnology = "FTTH" | "ADSL" | "WIRELESS";
export type CoverageSource = "exact_address" | "geographic_zone" | "nearby_address" | "unknown";
export type PublishedPlan = { id: string; name: string; slug: string; technology: string | null; speed_down_mbps: number | null; speed_up_mbps: number | null; price_amount: number | null; currency: string | null; status?: string; published_at?: string | null };
export type ZoneMatch = { technologies: string[] | null };
export type CoverageResolution = { coverageStatus: CoverageStatus; coverageSource: CoverageSource; confidence: "confirmed" | "zone" | "nearby" | "unknown"; technologies: CoverageTechnology[]; commercialAvailability: boolean; plans: PublishedPlan[]; nextAction: "installation" | "coverage_validation" | "fiber_waitlist"; message: string; zoneMatch: boolean };

export function canonicalTechnology(value: string | null | undefined): CoverageTechnology | null {
  const normalized = (value ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toUpperCase();
  if (normalized === "FTTH" || normalized === "FIBRA" || normalized === "FIBRA OPTICA") return "FTTH";
  if (normalized === "ADSL") return "ADSL";
  if (normalized === "WIRELESS" || normalized === "INALAMBRICO" || normalized === "INTERNET INALAMBRICO") return "WIRELESS";
  return null;
}

function technologiesFrom(records: CoverageRecord[]) {
  return [...new Set(records.map((record) => canonicalTechnology(record.technology)).filter((technology): technology is CoverageTechnology => Boolean(technology)))].sort();
}

function publishedCompatiblePlans(plans: PublishedPlan[], technologies: CoverageTechnology[], planName: string | null) {
  const now = Date.now();
  return plans.filter((plan) => plan.status === "published" && Boolean(plan.published_at) && Date.parse(plan.published_at!) <= now)
    .filter((plan) => plan.name === planName || (() => { const technology = canonicalTechnology(plan.technology); return technology !== null && technologies.includes(technology); })());
}

export function coverageAnalytics(resolution: CoverageResolution) {
  return { coverage_source: resolution.coverageSource, technology: resolution.technologies.join(",") || null, zone_match: resolution.zoneMatch, coverage_status: resolution.coverageStatus };
}

export function resolveCoverageFromRecords(records: CoverageRecord[], requestedNumber: number, plans: PublishedPlan[]): CoverageResolution | null {
  if (!records.length) return null;
  const selection = selectCoverage(records, requestedNumber);
  const technologies = technologiesFrom(selection.nearest);
  const compatible = selection.status === "available" ? publishedCompatiblePlans(plans, technologies, selection.nearest[0]?.plan_name ?? null) : [];
  const commercialAvailability = selection.status === "available" && compatible.length > 0;
  const exactAddress = selection.distance === 0;
  const confirmedTechnicalCoverage = exactAddress && selection.status === "available";
  return {
    coverageStatus: selection.status,
    coverageSource: exactAddress ? "exact_address" : "nearby_address", confidence: exactAddress ? "confirmed" : "nearby",
    technologies,
    commercialAvailability,
    plans: compatible,
    nextAction: commercialAvailability
      ? "installation"
      : confirmedTechnicalCoverage || selection.status === "nearby" || selection.status === "planned"
        ? "coverage_validation"
        : "fiber_waitlist",
    zoneMatch: false,
    message: commercialAvailability
      ? "Encontramos cobertura confirmada para tu domicilio y planes publicados compatibles. Podés revisar las alternativas disponibles."
      : confirmedTechnicalCoverage
        ? "La cobertura técnica está confirmada para tu domicilio. Todavía no hay un plan publicado compatible para contratación online; podés solicitar validación técnica o contacto comercial."
        : selection.status === "nearby" || selection.status === "planned"
          ? "Encontramos información cercana o en planificación. La disponibilidad requiere validación técnica."
          : "No encontramos cobertura confirmada para este domicilio. Podés solicitar que te avisemos cuando exista información oficial.",
  };
}

export function resolveCoverageFromZones(zones: ZoneMatch[], plans: PublishedPlan[]): CoverageResolution {
  const technologies = [...new Set(zones.flatMap((zone) => zone.technologies ?? []).map(canonicalTechnology).filter((technology): technology is CoverageTechnology => Boolean(technology)))].sort();
  if (!technologies.length) return { coverageStatus: "unknown", coverageSource: "unknown", confidence: "unknown", technologies: [], commercialAvailability: false, plans: [], nextAction: "fiber_waitlist", zoneMatch: false, message: "No encontramos cobertura confirmada para este domicilio. Podés solicitar que te avisemos cuando exista información oficial." };
  const compatible = publishedCompatiblePlans(plans, technologies, null);
  const message = technologies.length === 1 && technologies[0] === "FTTH"
    ? "Tu domicilio está dentro de una zona habilitada para Fibra Óptica COOPSAR. La disponibilidad final de instalación requiere validación técnica."
    : technologies.length === 1 && technologies[0] === "ADSL"
      ? "Tu domicilio está dentro de una zona con servicio ADSL. La disponibilidad final de instalación requiere validación técnica."
      : "En tu zona contamos con alternativas ADSL e Internet inalámbrico. La disponibilidad final de instalación requiere validación técnica.";
  return { coverageStatus: "available", coverageSource: "geographic_zone", confidence: "zone", technologies, commercialAvailability: false, plans: compatible, nextAction: "coverage_validation", zoneMatch: true, message };
}

export function hasExactCoverage(records: CoverageRecord[], requestedNumber: number) {
  return records.some((record) => record.street_number === requestedNumber);
}

/** Exact address data wins; matching zones win over rows from nearby heights. */
export function resolveCoverageWithPriority(records: CoverageRecord[], requestedNumber: number, plans: PublishedPlan[], zones: ZoneMatch[]): CoverageResolution | null {
  if (hasExactCoverage(records, requestedNumber)) return resolveCoverageFromRecords(records, requestedNumber, plans);
  const zoneResolution = resolveCoverageFromZones(zones, plans);
  if (zoneResolution.zoneMatch) return zoneResolution;
  return resolveCoverageFromRecords(records, requestedNumber, plans);
}
