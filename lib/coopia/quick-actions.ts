import type { CoopiaPageContext } from "./page-context";

export type CoopiaQuickAction = { label: string; prompt: string };

const baseline: CoopiaQuickAction[] = [
  { label: "Pagar factura", prompt: "Quiero pagar una factura" },
  { label: "Informar un problema", prompt: "Quiero informar un problema" },
  { label: "Consultar cobertura", prompt: "Quiero consultar cobertura de internet" },
  { label: "Ver cortes", prompt: "¿Hay cortes programados?" },
];

export function getCoopiaQuickActions(context: CoopiaPageContext): CoopiaQuickAction[] {
  const contextual = context.service === "energy" ? [{ label: "Informar falta de energía", prompt: "No tengo luz" }]
    : context.service === "fiber" || context.service === "internet" ? [{ label: "Consultar cobertura", prompt: "Quiero consultar cobertura de internet" }, { label: "Contratar internet", prompt: "Quiero contratar internet" }]
      : context.pageType === "news" || context.pageType === "article" ? [{ label: "Buscar una noticia", prompt: "Necesito encontrar una noticia o comunicado" }]
        : context.pageType === "tramite" ? [{ label: "Cambiar titularidad", prompt: "Quiero cambiar la titularidad" }]
          : [];
  return [...contextual, ...baseline].filter((action, index, values) => values.findIndex((value) => value.prompt === action.prompt) === index).slice(0, 6);
}
