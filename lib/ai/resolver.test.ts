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
    ["Quiero cambiar la titularidad", "service_request_form"],
    ["Quiero hacer un reclamo", "service_request_form"],
  ])("maps %s to approved UI %s", async (message, ui) => {
    expect((await resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message))).ui?.type).toBe(ui);
  });

  it("returns the complete structured contract without exposing arbitrary UI", async () => {
    const message = "Quiero pagar mi factura";
    const result = await resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message, { virtualOffice: "https://example.test" }));
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

  it("marks write tools as confirmation-required", async () => {
    const message = "Quiero hacer un reclamo";
    const result = await resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message));
    expect(result).toMatchObject({ requiresConfirmation: true, tool: { name: "createComplaint", kind: "write", status: "ready" } });
  });
  it("selects a trusted request type for the UI", async () => {
    const message = "Quiero una nueva conexión";
    expect(await resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message))).toMatchObject({ ui: { type: "service_request_form", data: { requestType: "new_supply" } }, requiresConfirmation: true });
  });
});
