import { describe, expect, it } from "vitest";
import { detectIntent } from "./intents";

describe("detectIntent", () => {
  it("detects the Phase A fiber signup success case", () => {
    expect(detectIntent("Quiero contratar fibra")).toMatchObject({ intent: "fiber_signup", service: "fiber", suggestedAction: "start_fiber_signup" });
  });
  it.each([
    ["¿Llega fibra a Rivadavia 1250?", "fiber_coverage"],
    ["Quiero Internet", "internet_signup"],
    ["Necesito internet para mi negocio", "internet_signup"],
    ["¿Qué planes tienen?", "internet_plans"],
    ["¿Cuánto sale Internet?", "internet_plans"],
    ["Quiero que me avisen cuando llegue fibra", "fiber_waitlist"],
    ["No tengo internet desde ayer", "internet_problem"],
    ["Quiero pagar una factura", "pay_invoice"],
    ["Necesito cambiar la titularidad", "ownership_change"],
  ])("classifies %s", (message, intent) => expect(detectIntent(message).intent).toBe(intent));
  it("uses a safe fallback", () => expect(detectIntent("Hola")).toMatchObject({ intent: "general_question", service: "general" }));
});
