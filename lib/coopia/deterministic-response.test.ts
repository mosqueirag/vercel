import { describe, expect, it } from "vitest";
import { detectIntent } from "../ai/intents";
import { deterministicCoopiaResponse } from "./deterministic-response";

describe("deterministicCoopiaResponse", () => {
  it("keeps clear operational needs out of the LLM fallback", () => {
    expect(deterministicCoopiaResponse(detectIntent("Quiero pagar"))).toContain("Pago y factura");
    expect(deterministicCoopiaResponse(detectIntent("No tengo luz"))).toContain("Energía");
  });

  it("leaves ambiguous text for the controlled knowledge fallback", () => {
    expect(deterministicCoopiaResponse(detectIntent("Hola, necesito ayuda"))).toBeNull();
  });
});
