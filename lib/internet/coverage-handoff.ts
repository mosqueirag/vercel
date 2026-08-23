export type PublicInternetPlan = {
  id: string;
  name: string;
  slug: string;
  technology: string | null;
  speed_down_mbps: number | null;
  speed_up_mbps?: number | null;
  price_amount: number | null;
  currency: string | null;
};

export type PublicCoverageResult = {
  coverageStatus: "available" | "nearby" | "planned" | "unavailable" | "unknown";
  coverageSource: "exact_address" | "geographic_zone" | "nearby_address" | "unknown";
  technology: string | null;
  technologies: string[];
  commercialAvailability: boolean;
  plans: PublicInternetPlan[];
  nextAction: "installation" | "coverage_validation" | "fiber_waitlist";
  message: string;
  zoneMatch: boolean;
};

/**
 * The handoff is intentionally client-session scoped: it lets the Internet
 * Centre continue an already resolved coverage journey without adding an
 * address to a URL, analytics event or server log.
 */
export const internetJourneyHandoffKey = "coopsar:internet-journey-handoff:v1";
export const internetJourneyHandoffTtlMs = 20 * 60 * 1000;
export const internetJourneyCanonicalHref = "/#contratar";
export const showInternetPlansEvent = "coopsar:show-internet-journey";

export type InternetJourneyDestination = "plans" | "waitlist" | "validation";

export type InternetJourneyHandoff = {
  version: 1;
  createdAt: number;
  destination: InternetJourneyDestination;
  street: string;
  number: string;
  coverage: PublicCoverageResult;
};

export type ShowInternetPlansDetail = {
  handoff: InternetJourneyHandoff;
};

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

const coverageStatuses = new Set<PublicCoverageResult["coverageStatus"]>([
  "available",
  "nearby",
  "planned",
  "unavailable",
  "unknown",
]);
const coverageSources = new Set<PublicCoverageResult["coverageSource"]>([
  "exact_address",
  "geographic_zone",
  "nearby_address",
  "unknown",
]);
const coverageActions = new Set<PublicCoverageResult["nextAction"]>([
  "installation",
  "coverage_validation",
  "fiber_waitlist",
]);

function isPublicPlan(value: unknown): value is PublicInternetPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Record<string, unknown>;
  return typeof plan.id === "string" && typeof plan.name === "string" && typeof plan.slug === "string";
}

export function isPublicCoverageResult(value: unknown): value is PublicCoverageResult {
  if (!value || typeof value !== "object") return false;
  const coverage = value as Record<string, unknown>;
  return (
    typeof coverage.coverageStatus === "string" &&
    coverageStatuses.has(coverage.coverageStatus as PublicCoverageResult["coverageStatus"]) &&
    typeof coverage.coverageSource === "string" &&
    coverageSources.has(coverage.coverageSource as PublicCoverageResult["coverageSource"]) &&
    typeof coverage.commercialAvailability === "boolean" &&
    Array.isArray(coverage.technologies) &&
    coverage.technologies.every((technology) => typeof technology === "string") &&
    Array.isArray(coverage.plans) &&
    coverage.plans.every(isPublicPlan) &&
    typeof coverage.nextAction === "string" &&
    coverageActions.has(coverage.nextAction as PublicCoverageResult["nextAction"]) &&
    typeof coverage.message === "string" &&
    typeof coverage.zoneMatch === "boolean"
  );
}

export function getInternetJourneyDestination(coverage: PublicCoverageResult): InternetJourneyDestination {
  if (coverage.plans.length > 0) return "plans";
  return coverage.nextAction === "fiber_waitlist" ? "waitlist" : "validation";
}

export function createInternetJourneyHandoff(input: {
  street: string;
  number: string;
  coverage: PublicCoverageResult;
  createdAt?: number;
}): InternetJourneyHandoff {
  return {
    version: 1,
    createdAt: input.createdAt ?? Date.now(),
    destination: getInternetJourneyDestination(input.coverage),
    street: input.street.trim(),
    number: input.number.trim(),
    coverage: input.coverage,
  };
}

export function isInternetJourneyHandoff(value: unknown, now = Date.now()): value is InternetJourneyHandoff {
  if (!value || typeof value !== "object") return false;
  const handoff = value as Record<string, unknown>;
  if (
    handoff.version !== 1 ||
    typeof handoff.createdAt !== "number" ||
    handoff.createdAt > now ||
    now - handoff.createdAt > internetJourneyHandoffTtlMs ||
    (handoff.destination !== "plans" && handoff.destination !== "waitlist" && handoff.destination !== "validation") ||
    typeof handoff.street !== "string" ||
    handoff.street.trim().length < 2 ||
    typeof handoff.number !== "string" ||
    !/^\d{1,6}$/.test(handoff.number.trim()) ||
    !isPublicCoverageResult(handoff.coverage)
  ) {
    return false;
  }

  return handoff.destination === getInternetJourneyDestination(handoff.coverage);
}

export function saveInternetJourneyHandoff(storage: StorageLike, handoff: InternetJourneyHandoff) {
  storage.setItem(internetJourneyHandoffKey, JSON.stringify(handoff));
}

/** Consumes and removes the handoff, preventing accidental replay. */
export function consumeInternetJourneyHandoff(storage: StorageLike, now = Date.now()): InternetJourneyHandoff | null {
  const serialized = storage.getItem(internetJourneyHandoffKey);
  storage.removeItem(internetJourneyHandoffKey);
  if (!serialized) return null;

  try {
    const value: unknown = JSON.parse(serialized);
    return isInternetJourneyHandoff(value, now) ? value : null;
  } catch {
    return null;
  }
}
