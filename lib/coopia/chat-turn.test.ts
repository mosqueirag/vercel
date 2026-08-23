import { describe, expect, it } from "vitest";
import { detectIntent } from "../ai/intents";
import { llmUnavailableResponse, planCoopiaChatTurn } from "./chat-turn";

describe("COOPIA continuous chat planning", () => {
  it.each(["Quiero pagar", "¿Llega fibra a mi casa?", "Estoy sin Internet"]) ("keeps %s deterministic and outside the LLM budget", (message) => {
    expect(planCoopiaChatTurn(detectIntent(message))).toMatchObject({ mode: "deterministic" });
  });

  it("reserves the LLM for ambiguous language", () => {
    expect(planCoopiaChatTurn(detectIntent("Necesito ayuda con una situación especial"))).toEqual({ mode: "llm" });
  });

  it("keeps an actionable COOPIA response when the LLM budget is unavailable", () => {
    expect(llmUnavailableResponse()).toContain("Puedo seguir ayudándote");
  });
});
