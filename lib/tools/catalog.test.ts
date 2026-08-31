import { describe, expect, it } from "vitest";
import { detectIntent } from "../ai/intents";
import { assistantToolNames, resolveServiceStatusTool, selectAssistantTool } from "./catalog";
import { resolveComplaintRoute } from "../complaints/router";
import { writeToolDefinitions } from "./write";

describe("selectAssistantTool", () => {
  it.each([
    ["Quiero fibra", "checkFiberCoverage", "read", false],
    ["¿Hay fibra en mi calle?", "checkFiberCoverage", "read", false],
    ["No tengo Internet", "getInternetServiceStatus", "read", false],
    ["No tengo luz", "getEnergyServiceStatus", "read", false],
    ["Quiero pagar una factura", "getPaymentInformation", "read", false],
    ["Quiero hacer un reclamo", "resolveComplaintChannel", "read", false],
    ["Quiero cambiar la titularidad", "createOwnershipChangeRequest", "write", true],
    ["Quiero una nueva conexión", "createNewSupplyRequest", "write", true],
    ["Quiero recibir la factura digital", "createDigitalInvoiceRequest", "write", true],
    ["Necesito telefonía", "createPhoneRequest", "write", true],
  ])("routes %s to %s", (message, name, kind, requiresConfirmation) => {
    expect(selectAssistantTool(detectIntent(message))).toEqual({ name, kind, requiresConfirmation });
  });
  it("does not select a write tool for complaints", () => {
    expect(assistantToolNames).not.toContain("createComplaint");
    expect(writeToolDefinitions).not.toHaveProperty("createComplaint");
  });

  it.each([
    ["energy", "getEnergyServiceStatus", "outage", "https://wa.me/5491111111111"],
    ["energy", "getEnergyServiceStatus", "unknown", null],
    ["internet", "getInternetServiceStatus", "operational", null],
  ] as const)("keeps %s service status usable without depending on WhatsApp", (service, name, status, whatsappUrl) => {
    const selection = { name, kind: "read" as const, requiresConfirmation: false };
    const route = { ...resolveComplaintRoute(service, new Date("2026-08-22T15:00:00Z"), []), whatsappUrl };
    const result = resolveServiceStatusTool(selection, status, route);
    expect(result.status).toBe("completed");
    expect(result.data).toMatchObject({ status, whatsappUrl });
  });
});
