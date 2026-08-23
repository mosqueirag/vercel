import type { IntentDetection } from "../ai/intents";
import { deterministicCoopiaResponse } from "./deterministic-response";

export type CoopiaChatTurn =
  | { mode: "deterministic"; response: string }
  | { mode: "llm" };

/**
 * COOPIA is the product experience; the LLM is an optional capability inside
 * it. Clear operational needs stay on deterministic, server-side tools.
 */
export function planCoopiaChatTurn(detection: IntentDetection): CoopiaChatTurn {
  const response = deterministicCoopiaResponse(detection);
  return response ? { mode: "deterministic", response } : { mode: "llm" };
}

export function llmUnavailableResponse() {
  return "**Seguimos con tu gestión**\n\nPuedo seguir ayudándote con pagos, cobertura, problemas de energía o Internet, trámites y atención personal. Para esta consulta puntual, también podés continuar con nuestro equipo por un canal oficial.";
}
