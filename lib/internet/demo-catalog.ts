import type { PublicInternetPlan } from "../data/public-content";
import type { InternetAudience } from "./audience-selection";
import type { InternetCoveragePlanDetail } from "./coverage-plan-highlight";

export type CatalogAudience = InternetAudience | null;

export type CanonicalInternetTechnology = "FTTH" | "ADSL" | "WIRELESS";

export function normalizeInternetTechnology(technology: string | null | undefined): CanonicalInternetTechnology | null {
  const normalized = (technology || "").trim().toUpperCase();
  if (normalized === "FTTH" || normalized === "ADSL" || normalized === "WIRELESS") return normalized;
  return /INAL.MBRIC/.test(normalized) ? "WIRELESS" : null;
}

export function filterInternetCatalogByAudience(plans: readonly PublicInternetPlan[], audience: CatalogAudience) {
  if (audience === "empresa") return [];
  if (!audience) return [];
  const expectedAudience = audience === "hogar" ? "home" : "business";
  return plans.filter((plan) => plan.audience === expectedAudience);
}

/**
 * Technical coverage limits the commercial cards that can be presented. The
 * browser never infers a technology from a plan name or a missing field.
 */
export function filterPlansForCoverageAndAudience(
  plans: readonly PublicInternetPlan[],
  audience: CatalogAudience,
  coverage: Pick<InternetCoveragePlanDetail, "coverageStatus" | "technologies"> | null,
) {
  const audiencePlans = filterInternetCatalogByAudience(plans, audience);
  if (!coverage) return audiencePlans;
  if (coverage.coverageStatus === "unavailable" || coverage.coverageStatus === "unknown") return [];

  const technologies = new Set(coverage.technologies.map(normalizeInternetTechnology).filter((technology): technology is CanonicalInternetTechnology => technology !== null));
  if (technologies.size === 0) return [];

  return audiencePlans.filter((plan) => {
    const technology = normalizeInternetTechnology(plan.technology);
    return technology !== null && technologies.has(technology);
  });
}

/**
 * The staging catalogue may help compare draft products, but it never decides
 * technical coverage. Audience decides the public commercial category.
 */
export function prioritizeInternetCatalogPlans(
  plans: readonly PublicInternetPlan[],
  audience: CatalogAudience,
  coverage: Pick<InternetCoveragePlanDetail, "coverageStatus" | "commercialAvailability" | "technologies"> | null = null,
) {
  if (!audience) return { heading: "Elegí cómo vas a usar Internet", detail: "Así te mostramos las opciones correspondientes.", preferred: [] as PublicInternetPlan[], alternatives: [] as PublicInternetPlan[] };
  if (audience === "empresa") return { heading: "Internet para empresas", detail: "Consultá alternativas según la ubicación y las necesidades de conectividad de tu empresa.", preferred: [] as PublicInternetPlan[], alternatives: [] as PublicInternetPlan[] };

  const technology = coverage?.technologies.map(normalizeInternetTechnology).find((item): item is CanonicalInternetTechnology => item !== null) ?? null;
  const isReference = Boolean(coverage && (coverage.coverageStatus === "nearby" || coverage.coverageStatus === "planned" || !coverage.commercialAvailability));
  const heading = isReference
    ? "Opciones de referencia para tu conexión."
    : technology === "FTTH"
      ? "Planes para tu conexión por fibra."
      : technology === "ADSL"
        ? "Planes disponibles para conexión ADSL."
        : technology === "WIRELESS"
          ? "Opciones de Internet inalámbrico."
          : audience === "hogar" ? "Planes para tu hogar" : "Planes para tu comercio";
  const detail = null;
  return {
    heading,
    detail,
    preferred: filterPlansForCoverageAndAudience(plans, audience, coverage),
    alternatives: [] as PublicInternetPlan[],
  };
}
