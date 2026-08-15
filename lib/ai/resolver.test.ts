import { describe, expect, it } from "vitest";
import { detectIntent } from "./intents";
import { resolveAssistantResult } from "./resolver";
import { selectAssistantTool, type ToolResolution } from "../tools/catalog";

function toolFor(message: string, data?: ToolResolution["data"]): ToolResolution {
  const selection = selectAssistantTool(detectIntent(message));
  return { ...selection, status: data ? "completed" : "ready", data };
}

describe("resolveAssistantResult", () => {
  it.each([
    ["Quiero fibra", "fiber_coverage"],
    ["No tengo Internet", "service_status"],
    ["Quiero pagar mi factura", "payment"],
    ["No tengo luz", "service_status"],
  ])("maps %s to approved UI %s", (message, ui) => {
    expect(resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message)).ui?.type).toBe(ui);
  });

  it("returns the complete structured contract without exposing arbitrary UI", () => {
    const message = "Quiero pagar mi factura";
    const result = resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message, { virtualOffice: "https://example.test" }));
    expect(result).toMatchObject({
      intent: "pay_invoice",
      service: "billing",
      confidence: 0.96,
      nextStep: "open_payment",
      requiresConfirmation: false,
      requiresHuman: false,
      tool: { name: "getPaymentInformation", kind: "read", status: "completed" },
      ui: { type: "payment" },
    });
    expect(result.recommendedActions).toEqual(result.actions);
  });

  it("marks write tools as confirmation-required", () => {
    const message = "Quiero hacer un reclamo";
    const result = resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message));
    expect(result).toMatchObject({ requiresConfirmation: true, tool: { name: "createComplaint", kind: "write", status: "ready" } });
  });
});
