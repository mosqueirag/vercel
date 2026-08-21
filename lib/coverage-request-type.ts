export type CoverageNextAction = "installation" | "coverage_validation" | "fiber_waitlist";

/** The backend owns routing decisions; the UI must not infer one from status. */
export function requestTypeFromCoverage(coverage: { nextAction: CoverageNextAction } | null | undefined): CoverageNextAction {
  return coverage?.nextAction ?? "fiber_waitlist";
}
