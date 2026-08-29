import type { PublicInternetPlan } from "../data/public-content";
import type { InternetAudience } from "./audience-selection";
import type { PublicCoverageResult } from "./coverage-handoff";

/**
 * This browser-only event carries the server-authoritative coverage result to
 * the public catalogue. It deliberately contains no address or contact data.
 */
export const internetCoveragePlanEvent = "coopsar:internet-coverage-plan";

export type InternetCoveragePlanDetail = Pick<PublicCoverageResult, "coverageStatus" | "commercialAvailability" | "technologies"> & {
  availablePlanIds: string[];
  preferredPlanId: string | null;
};

export function createInternetCoveragePlanDetail(coverage: PublicCoverageResult): InternetCoveragePlanDetail {
  return {
    coverageStatus: coverage.coverageStatus,
    commercialAvailability: coverage.commercialAvailability,
    technologies: [...coverage.technologies],
    availablePlanIds: coverage.plans.map((plan) => plan.id),
    preferredPlanId: coverage.plans[0]?.id ?? null,
  };
}

function audienceMatches(plan: PublicInternetPlan, audience: InternetAudience | null) {
  if (!audience) return true;
  return audience === "hogar" ? plan.audience === "home" : plan.audience === "business";
}

function normalizedTechnology(technology: string | null) {
  const value = (technology || "").toUpperCase();
  if (value === "FTTH" || value === "ADSL" || value === "WIRELESS") return value;
  if (/INAL.MBRIC/.test(value)) return "WIRELESS";
  return value;
}

/** Staging-only presentation helper. It never changes technical coverage. */
export function pickReferencePlanForCoverage(
  plans: readonly PublicInternetPlan[],
  technologies: readonly string[],
  audience: InternetAudience | null,
) {
  const normalizedTechnologies = technologies.map((technology) => normalizedTechnology(technology));
  const candidates = plans.filter((plan) => normalizedTechnologies.includes(normalizedTechnology(plan.technology)));
  return candidates.find((plan) => audienceMatches(plan, audience)) ?? candidates[0] ?? null;
}

export function pickPlanForCoverageAudience(
  plans: readonly PublicInternetPlan[],
  detail: InternetCoveragePlanDetail,
  audience: InternetAudience | null,
  isDemo: boolean,
) {
  if (!audience || audience === "empresa") return null;
  const visiblePlans = plans.filter((plan) => audienceMatches(plan, audience));
  const available = detail.commercialAvailability
    ? visiblePlans.find((plan) => detail.availablePlanIds.includes(plan.id)) ?? null
    : null;
  if (available) return { plan: available, kind: "available" as const };
  if (!isDemo) return null;
  const reference = pickReferencePlanForCoverage(visiblePlans, detail.technologies, audience);
  return reference ? { plan: reference, kind: "reference" as const } : null;
}
