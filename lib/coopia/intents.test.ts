import { describe, expect, it } from "vitest";
import { routeCoopiaIntent } from "./intents";

describe("routeCoopiaIntent", () => {
  it.each([
    ["quiero pagar", "payment"],
    ["pagar factura", "payment"],
    ["no tengo luz", "energy_outage"],
    ["estoy sin energía", "energy_outage"],
    ["no tengo internet", "internet_issue"],
    ["quiero contratar internet", "internet_interest"],
    ["quiero fibra", "fiber_interest"],
    ["llega fibra a mi casa", "fiber_coverage"],
    ["necesito sepelio", "funeral_service"],
    ["quiero hablar con una persona", "human_handoff"],
  ] as const)("routes %s to %s without an LLM", (message, id) => {
    expect(routeCoopiaIntent(message)).toMatchObject({ id, source: "rule" });
  });

  it("keeps an ambiguous request safe and explicit", () => {
    expect(routeCoopiaIntent("hola, necesito ayuda")).toMatchObject({ id: "unknown", source: "unknown", suggestedActions: ["REQUEST_HUMAN_HANDOFF"] });
  });
});
