export type InternetPlanChoice = {
  id: string;
  slug: string;
};

export const selectInternetPlanEvent = "coopsar:select-internet-plan";

export type SelectInternetPlanDetail = {
  planId: string;
  planSlug: string;
};

/**
 * A plan chosen from the public offer is only a preference. Coverage remains
 * the server-side authority and this choice is used only when the returned
 * compatible plans contain the same id.
 */
export function pickCompatiblePlan<T extends InternetPlanChoice>(plans: readonly T[], requestedPlanId: string | null) {
  return plans.find((plan) => plan.id === requestedPlanId) ?? plans[0] ?? null;
}

export function createPlanSelectionDetail(plan: InternetPlanChoice): SelectInternetPlanDetail {
  return { planId: plan.id, planSlug: plan.slug };
}
