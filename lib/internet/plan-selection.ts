export type InternetPlanChoice = {
  id: string;
  slug: string;
};

export const selectInternetPlanEvent = "coopsar:select-internet-plan";

export type SelectInternetPlanDetail = {
  planId: string;
  planSlug: string;
};

export type PlanSelectedEvent = {
  journeyId: string;
  sessionId: string;
  eventType: "plan_selected";
  result: string;
  page: "/internet";
  service: "internet";
};

/**
 * A plan chosen from the public offer is only a preference. Coverage remains
 * the server-side authority and this choice is used only when the returned
 * compatible plans contain the same id.
 */
export function pickCompatiblePlan<T extends InternetPlanChoice>(plans: readonly T[], requestedPlanId: string | null) {
  return plans.find((plan) => plan.id === requestedPlanId) ?? plans[0] ?? null;
}

export function requestedPlanIsCompatible<T extends InternetPlanChoice>(plans: readonly T[], requestedPlanId: string | null) {
  return !requestedPlanId || plans.some((plan) => plan.id === requestedPlanId);
}

export function createPlanSelectionDetail(plan: InternetPlanChoice): SelectInternetPlanDetail {
  return { planId: plan.id, planSlug: plan.slug };
}

export function createPlanSelectedEvent(plan: InternetPlanChoice, journeyId: string, sessionId: string): PlanSelectedEvent {
  return { journeyId, sessionId, eventType: "plan_selected", result: plan.slug, page: "/internet", service: "internet" };
}
