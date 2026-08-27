export type InternetPlanChoice = {
  id: string;
  slug: string;
  name?: string;
  speed_down_mbps?: number | null;
  speed_up_mbps?: number | null;
  price_amount?: number | null;
  currency?: string | null;
};

export const selectInternetPlanEvent = "coopsar:select-internet-plan";

export type SelectInternetPlanDetail = {
  planId: string;
  planSlug: string;
  planName?: string;
  speedDownMbps?: number | null;
  speedUpMbps?: number | null;
  priceAmount?: number | null;
  currency?: string | null;
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
  return { planId: plan.id, planSlug: plan.slug, planName: plan.name, speedDownMbps: plan.speed_down_mbps, speedUpMbps: plan.speed_up_mbps, priceAmount: plan.price_amount, currency: plan.currency };
}

export function createPlanSelectedEvent(plan: InternetPlanChoice, journeyId: string, sessionId: string): PlanSelectedEvent {
  return { journeyId, sessionId, eventType: "plan_selected", result: plan.slug, page: "/internet", service: "internet" };
}
