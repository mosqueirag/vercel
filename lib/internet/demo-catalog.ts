import type { PublicInternetPlan } from "../data/public-content";
import type { InternetAudience } from "./audience-selection";

export type CatalogAudience = InternetAudience | null;

function audiencePriority(plan: PublicInternetPlan, audience: CatalogAudience) {
  if (!audience) return 0;
  return plan.audience === (audience === "hogar" ? "home" : "business") ? 0 : 1;
}

/**
 * The staging catalogue may help compare draft products, but it never decides
 * technical coverage. Audience only changes the presentation order.
 */
export function prioritizeInternetCatalogPlans(plans: readonly PublicInternetPlan[], audience: CatalogAudience) {
  const ordered = [...plans].sort((left, right) => audiencePriority(left, audience) - audiencePriority(right, audience));
  if (!audience) return { preferred: ordered, alternatives: [] as PublicInternetPlan[] };
  return {
    preferred: ordered.filter((plan) => audiencePriority(plan, audience) === 0),
    alternatives: ordered.filter((plan) => audiencePriority(plan, audience) !== 0),
  };
}
