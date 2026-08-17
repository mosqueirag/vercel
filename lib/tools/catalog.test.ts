import { describe, expect, it } from "vitest";
import { detectIntent } from "../ai/intents";
import { assistantToolNames, selectAssistantTool } from "./catalog";
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
});
