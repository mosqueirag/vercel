import type { PublicInternetPlan } from "../data/public-content";
import type { InternetAudience } from "./audience-selection";

export type CatalogAudience = InternetAudience | null;

export function filterInternetCatalogByAudience(plans: readonly PublicInternetPlan[], audience: CatalogAudience) {
  if (audience === "empresa") return [];
  if (!audience) return [];
  const expectedAudience = audience === "hogar" ? "home" : "business";
  return plans.filter((plan) => plan.audience === expectedAudience);
}

/**
 * The staging catalogue may help compare draft products, but it never decides
 * technical coverage. Audience decides the public commercial category.
 */
export function prioritizeInternetCatalogPlans(plans: readonly PublicInternetPlan[], audience: CatalogAudience) {
  if (!audience) return { heading: "Elegí cómo vas a usar Internet", detail: "Así te mostramos las opciones correspondientes.", preferred: [] as PublicInternetPlan[], alternatives: [] as PublicInternetPlan[] };
  if (audience === "empresa") return { heading: "Internet para empresas", detail: "Consultá alternativas según la ubicación y las necesidades de conectividad de tu empresa.", preferred: [] as PublicInternetPlan[], alternatives: [] as PublicInternetPlan[] };

  const heading = audience === "hogar" ? "Planes para tu hogar" : "Planes para tu comercio";
  const detail = null;
  return {
    heading,
    detail,
    preferred: filterInternetCatalogByAudience(plans, audience),
    alternatives: [] as PublicInternetPlan[],
  };
}
