import type { CoopiaPageContext } from "./page-context";
import type { AssistantIntent, AssistantService } from "../ai/intents";

export type CoopiaQuickAction = { label: string; prompt: string };

const baseline: CoopiaQuickAction[] = [
  { label: "Pagar factura", prompt: "Quiero pagar una factura" },
  { label: "Informar un problema", prompt: "Quiero informar un problema" },
  { label: "Contratar internet", prompt: "Quiero contratar internet" },
  { label: "Otra consulta", prompt: "Necesito otra ayuda" },
];

export function getCoopiaQuickActions(context: CoopiaPageContext, journey?: { intent?: AssistantIntent; service?: AssistantService; currentStep?: string }): CoopiaQuickAction[] {
  if (journey?.service === "internet" || journey?.service === "fiber") {
    return [
      { label: "Consultar cobertura", prompt: "Sí, quiero consultar cobertura" },
      { label: "Ver planes", prompt: "¿Qué planes publicados tienen?" },
      { label: "Hablar con un asesor", prompt: "Quiero hablar con un asesor" },
    ];
  }
  if (journey?.service === "energy") return [{ label: "Informar falta de energía", prompt: "No tengo luz" }, { label: "Hablar con la guardia", prompt: "Quiero hablar con un operador de energía" }];
  const contextual = context.service === "energy" ? [{ label: "Informar falta de energía", prompt: "No tengo luz" }]
    : context.service === "fiber" || context.service === "internet" ? [{ label: "Consultar cobertura", prompt: "Quiero consultar cobertura de internet" }, { label: "Contratar internet", prompt: "Quiero contratar internet" }]
      : context.pageType === "news" || context.pageType === "article" ? [{ label: "Buscar una noticia", prompt: "Necesito encontrar una noticia o comunicado" }]
        : context.pageType === "tramite" ? [{ label: "Cambiar titularidad", prompt: "Quiero cambiar la titularidad" }]
          : [];
  return [...contextual, ...baseline].filter((action, index, values) => values.findIndex((value) => value.prompt === action.prompt) === index).slice(0, 4);
}
