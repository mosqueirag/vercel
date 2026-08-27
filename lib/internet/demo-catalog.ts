import type { PublicInternetPlan } from "../data/public-content";
import type { InternetAudience } from "./audience-selection";

export type CatalogAudience = InternetAudience | null;

function audiencePriority(plan: PublicInternetPlan, audience: CatalogAudience) {
  if (!audience) return 0;
  const expectedAudience = audience === "hogar" ? "home" : "business";
  if (plan.audience === expectedAudience) return 0;
  if (!plan.audience) return 1;
  return 2;
}

/**
 * The staging catalogue may help compare draft products, but it never decides
 * technical coverage. Audience only changes the presentation order.
 */
export function prioritizeInternetCatalogPlans(plans: readonly PublicInternetPlan[], audience: CatalogAudience) {
  const ordered = [...plans].sort((left, right) => audiencePriority(left, audience) - audiencePriority(right, audience));
  if (!audience) return { heading: "Planes de referencia", detail: null, preferred: ordered, alternatives: [] as PublicInternetPlan[] };

  const heading = audience === "hogar" ? "Planes para tu hogar" : audience === "comercio" ? "Planes para tu actividad comercial" : "Opciones para consultar para tu empresa";
  const detail = audience === "empresa" ? "La oferta final se confirma con el equipo comercial." : null;
  return {
    heading,
    detail,
    preferred: ordered.filter((plan) => audiencePriority(plan, audience) < 2),
    alternatives: ordered.filter((plan) => audiencePriority(plan, audience) === 2),
  };
}
