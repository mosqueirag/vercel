const commercialNames: Record<string, string> = {
  "plan-hogar-50-mb": "Plan Hogar",
  "plan-hogar-100-mb": "Plan Hogar",
  "inalambrico-20-mb": "Plan Inalámbrico",
  "plan-adsl-5-megas": "Plan ADSL",
  "ftth-comercial-y-educacional-50-mb": "Plan Comercial",
  "plan-comercial-100-mb-simetrico": "Plan Comercial Simétrico",
};

export type InternetPlanPresentation = {
  displayName: string;
  audienceLabel: "Hogar" | "Comercial" | null;
  technologyLabel: string;
  speedLabel: string | null;
  secondaryLabel: string | null;
};

type InternetPlanPresentationInput = {
  slug: string;
  name: string;
  audience?: string | null;
  technology?: string | null;
  speed_down_mbps?: number | null;
  speed_up_mbps?: number | null;
  installation_price?: number | null;
  installation_notes?: string | null;
};

/** This is a display layer only; commercial facts stay in the typed plan record. */
export function getInternetPlanPresentation(plan: InternetPlanPresentationInput): InternetPlanPresentation {
  const download = plan.speed_down_mbps == null ? null : `${plan.speed_down_mbps} Mbps`;
  const upload = plan.speed_up_mbps == null ? null : `${plan.speed_up_mbps} Mbps de subida`;

  return {
    displayName: commercialNames[plan.slug] || plan.name,
    audienceLabel: plan.audience === "home" ? "Hogar" : plan.audience === "business" ? "Comercial" : null,
    technologyLabel: plan.technology === "FTTH" ? "Fibra óptica" : plan.technology === "ADSL" ? "ADSL" : /inal[aá]mbric/i.test(plan.technology || "") ? "Internet inalámbrico" : plan.technology || "Internet",
    speedLabel: download,
    // Internal migration notes stay in the managed record; they are not commercial copy.
    secondaryLabel: upload || (plan.installation_price === 0 ? "Instalación sin costo" : null),
  };
}
