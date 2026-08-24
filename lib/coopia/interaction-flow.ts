import type { AssistantRecommendedAction, AssistantResult } from "../ai/results";
import type { CoopiaPageContext } from "./page-context";

export type CoopiaNeed = { label: string; prompt: string };

const coreNeeds: CoopiaNeed[] = [
  { label: "Estoy sin energía", prompt: "Estoy sin energía" },
  { label: "Tengo problemas con Internet", prompt: "Tengo problemas con Internet" },
  { label: "Pagar una factura", prompt: "Quiero pagar una factura" },
  { label: "Quiero Internet", prompt: "Quiero Internet" },
];

const extraNeeds: CoopiaNeed[] = [
  { label: "Consultar cobertura", prompt: "Quiero consultar cobertura de internet" },
  { label: "Hacer un trámite", prompt: "Quiero hacer un trámite" },
  { label: "Necesito Sepelio", prompt: "Necesito información de sepelio" },
];

export function coopiaInitialNeeds(context: CoopiaPageContext) {
  const contextual = context.service === "energy" ? coreNeeds.slice(0, 1) : context.service === "internet" || context.service === "fiber" ? [coreNeeds[3], extraNeeds[0], coreNeeds[1]] : [];
  return [...contextual, ...coreNeeds].filter((item, index, items) => items.findIndex((candidate) => candidate.prompt === item.prompt) === index).slice(0, 4);
}

export function coopiaMoreNeeds(context: CoopiaPageContext) {
  const contextual = context.pageType === "tramite" ? [{ label: "Cambiar titularidad", prompt: "Quiero cambiar la titularidad" }] : context.pageType === "news" || context.pageType === "article" ? [{ label: "Buscar una noticia", prompt: "Necesito encontrar una noticia" }] : [];
  return [...extraNeeds, ...contextual];
}

export function coopiaJourneyLabel(result?: AssistantResult | null) {
  if (!result) return "";
  const service = ({ billing: "Facturas y pagos", energy: "Energía", internet: "Internet", fiber: "Internet y fibra", phone: "Telefonía", funeral: "Sepelio", general: "COOPSAR" } as const)[result.service];
  const step = result.ui?.type === "fiber_coverage" ? "Cobertura" : result.ui?.type === "internet_plans" ? "Planes" : result.ui?.type === "payment" ? "Pago" : result.ui?.type === "complaint_service_picker" ? "Reclamo" : "Atención";
  return `${service} › ${step}`;
}

/** A short, human context for the active guided step. Keep it separate from the
 * detailed journey label so the UI does not repeat internal step names. */
export function coopiaActiveContext(result?: AssistantResult | null) {
  if (!result) return "";
  return ({ billing: "Facturas y pagos", energy: "Energía", internet: "Internet", fiber: "Internet y fibra", phone: "Telefonía", funeral: "Sepelio", general: "COOPSAR" } as const)[result.service];
}

export function coopiaLoadingCopy(input: string) {
  const text = input.toLowerCase();
  if (text.includes("cobertura") || text.includes("internet") || text.includes("fibra")) return "Preparando el siguiente paso…";
  if (text.includes("luz") || text.includes("energ")) return "Verificando el estado del servicio…";
  if (text.includes("pagar") || text.includes("factura")) return "Buscando la mejor forma de ayudarte…";
  return "Consultando información oficial…";
}

const actionPriority: AssistantRecommendedAction["id"][] = ["CHECK_COVERAGE", "OPEN_VIRTUAL_OFFICE", "OPEN_COMPLAINT_WHATSAPP", "REQUEST_COVERAGE_VALIDATION", "REQUEST_INSTALLATION", "SELECT_INTERNET_PLAN", "SHOW_INTERNET_PLANS", "SHOW_FUNERAL_SERVICE", "CALL_FUNERAL_GUARD", "OPEN_WHATSAPP"];

/** Limits a guided step to one clear primary CTA and, at most, one secondary action. */
export function coopiaStepActions(actions: AssistantRecommendedAction[]) {
  const executable = actions.filter((action) => Boolean(action.href));
  return [...executable].sort((a, b) => {
    const left = actionPriority.indexOf(a.id); const right = actionPriority.indexOf(b.id);
    return (left < 0 ? 999 : left) - (right < 0 ? 999 : right);
  }).slice(0, 2);
}
