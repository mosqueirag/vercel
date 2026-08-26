import type { PublicCoverageResult } from "./coverage-handoff";

/** Public plans are already filtered server-side by coverage compatibility. */
export function hasPublishedCompatiblePlans(coverage: Pick<PublicCoverageResult, "plans" | "commercialAvailability"> | null) {
  return Boolean(coverage?.commercialAvailability && coverage.plans.length);
}

export const internetCanonicalPath = "/internet";

/** The general catalog is useful only when COOPSAR has public plans to show. */
export function shouldShowGeneralInternetCatalog(plans: readonly unknown[]) {
  return plans.length > 0;
}
