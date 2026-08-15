import { describe, expect, it } from "vitest";
import { detectIntent } from "../ai/intents";
import { selectAssistantTool } from "./catalog";

describe("selectAssistantTool", () => {
  it.each([
    ["Quiero fibra", "checkFiberCoverage", "read", false],
    ["¿Hay fibra en mi calle?", "checkFiberCoverage", "read", false],
    ["No tengo Internet", "getInternetServiceStatus", "read", false],
    ["No tengo luz", "getEnergyServiceStatus", "read", false],
    ["Quiero pagar una factura", "getPaymentInformation", "read", false],
    ["Quiero hacer un reclamo", "createComplaint", "write", true],
  ])("routes %s to %s", (message, name, kind, requiresConfirmation) => {
    expect(selectAssistantTool(detectIntent(message))).toEqual({ name, kind, requiresConfirmation });
  });
});
