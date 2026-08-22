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
    ["Quiero hacer un reclamo", "complaint_service_picker"],
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
      orchestration: { intent: "payment", analyticsKey: "payment", detection: "rule" },
    });
    expect(result.recommendedActions).toEqual(result.actions);
  });

  it("keeps confirmed fiber interest actionable even before a coverage result", async () => {
    const result = await resolveAssistantResult(detectIntent("Quiero fibra"), "JRN-2026-A1B2C3D4", toolFor("Quiero fibra"));
    expect(result.orchestration.intent).toBe("fiber_interest");
    expect(result.actions.map((action) => action.id)).toEqual(expect.arrayContaining(["CHECK_COVERAGE", "SHOW_INTERNET_PLANS", "REQUEST_INSTALLATION"]));
  });

  it("does not turn an unknown question into a ticketing flow", async () => {
    const result = await resolveAssistantResult(detectIntent("Hola, necesito ayuda"), "JRN-2026-A1B2C3D4", toolFor("Hola, necesito ayuda"));
    expect(result.orchestration.intent).toBe("unknown");
    expect(result.ui?.type).toBe("human_handoff");
    expect(result.ui?.type).not.toBe("service_request_form");
  });

  it("routes a generic complaint without creating a service request", async () => {
    const message = "Quiero hacer un reclamo";
    const result = await resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message));
    expect(result).toMatchObject({ requiresConfirmation: false, tool: { name: "resolveComplaintChannel", kind: "read", status: "ready" }, ui: { type: "complaint_service_picker" } });
    expect(result.ui?.type).not.toBe("service_request_form");
  });
  it("offers the compliant WhatsApp handoff for a resolved complaint", async () => {
    const message = "No tengo Internet";
    const result = await resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message, { status: "unknown", routingWindow: "after_hours", contactPurpose: "support", contactLabel: "Guardia de Comunicaciones", whatsappUrl: "https://wa.me/5491111111111?text=Hola" }));
    expect(result.actions).toContainEqual({ id: "OPEN_COMPLAINT_WHATSAPP", label: "Continuar tu reclamo por WhatsApp", href: "https://wa.me/5491111111111?text=Hola" });
    expect(result.complaintRoute).toEqual({ routingWindow: "after_hours", contactPurpose: "support", contactLabel: "Guardia de Comunicaciones" });
  });
  it("selects a trusted request type for the UI", async () => {
    const message = "Quiero una nueva conexión";
    expect(await resolveAssistantResult(detectIntent(message), "JRN-2026-A1B2C3D4", toolFor(message))).toMatchObject({ ui: { type: "service_request_form", data: { requestType: "new_supply" } }, requiresConfirmation: true });
  });
});
