import { describe, expect, it } from "vitest";
import { detectIntent } from "./intents";
import { resolveAssistantResult } from "./resolver";

describe("resolveAssistantResult", () => {
  it.each([
    ["Quiero fibra", "fiber_coverage"],
    ["No tengo Internet", "service_status"],
    ["Quiero pagar mi factura", "payment"],
    ["No tengo luz", "service_status"],
  ])("maps %s to approved UI %s", (message, ui) => expect(resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4").ui?.type).toBe(ui));
});
