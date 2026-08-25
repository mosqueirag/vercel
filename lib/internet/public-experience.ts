import type { PublicCoverageResult } from "./coverage-handoff";

/** Public plans are already filtered server-side by coverage compatibility. */
export function hasPublishedCompatiblePlans(coverage: Pick<PublicCoverageResult, "plans" | "commercialAvailability"> | null) {
  return Boolean(coverage?.commercialAvailability && coverage.plans.length);
}

export const internetCanonicalPath = "/internet";
