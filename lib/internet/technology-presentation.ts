import type { PublicInternetPlan } from "../data/public-content";

export const internetTechnologies = [
  { id: "FTTH", label: "Fibra óptica", heading: "Conectividad por fibra óptica" },
  { id: "ADSL", label: "ADSL", heading: "Conectividad ADSL" },
  { id: "WIRELESS", label: "Internet inalámbrico", heading: "Conectividad inalámbrica" },
] as const;

export type InternetTechnologyId = (typeof internetTechnologies)[number]["id"];

function matchesTechnology(plan: PublicInternetPlan, technology: InternetTechnologyId) {
  if (technology === "WIRELESS") return /wireless|inal[aá]mbric/i.test(plan.technology || "");
  return plan.technology === technology;
}

export function getInternetTechnologyPresentation(plans: readonly PublicInternetPlan[], technology: InternetTechnologyId) {
  const definition = internetTechnologies.find((item) => item.id === technology)!;
  const speeds = [...new Set(plans.filter((plan) => matchesTechnology(plan, technology)).map((plan) => plan.speed_down_mbps).filter((speed): speed is number => speed !== null))].sort((left, right) => left - right);
  const audiences = [...new Set(plans.filter((plan) => matchesTechnology(plan, technology)).map((plan) => plan.audience).filter(Boolean))];
  const maxSpeed = speeds.at(-1) ?? null;
  const description = maxSpeed
    ? `Encontramos opciones de ${definition.label.toLowerCase()} de hasta ${maxSpeed} Mbps en el catálogo actual.`
    : "La disponibilidad se confirma al consultar tu domicilio.";
  return { ...definition, speeds, audiences, description };
}
