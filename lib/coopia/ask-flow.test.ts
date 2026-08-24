import { describe, expect, it } from "vitest";
import { resolveCoopiaAskFlow, shouldRequestConversationalReply } from "./ask-flow";
import type { AssistantResult } from "../ai/results";

function result(intent: AssistantResult["intent"], service: AssistantResult["service"], detection: "rule" | "unknown" = "rule"): AssistantResult {
  return { message: "Listo", intent, service, confidence: .99, recommendedActions: [{ id: "OPEN_VIRTUAL_OFFICE", label: "Continuar", href: "/" }], actions: [{ id: "OPEN_VIRTUAL_OFFICE", label: "Continuar", href: "/" }], nextStep: "continue", requiresConfirmation: false, requiresHuman: false, tool: { name: "official", kind: "read", status: "ready" }, journey: { journeyId: "JRN-test", currentStep: "continue" }, orchestration: { intent: intent as never, analyticsKey: intent as never, detection } };
}

describe("COOPIA ask flow", () => {
  it("keeps a valid structured result when conversational chat is unavailable", () => expect(resolveCoopiaAskFlow({ structured: result("pay_invoice", "billing"), chatAvailable: false })).toBe("structured_only"));
  it("uses chat only when the structured resolver is unavailable", () => { expect(resolveCoopiaAskFlow({ chatAvailable: true })).toBe("chat_only"); expect(resolveCoopiaAskFlow({ chatAvailable: false })).toBe("error"); });
  it("does not require chat for deterministic payment, energy and internet journeys", () => {
    for (const item of [result("pay_invoice", "billing"), result("energy_problem", "energy"), result("internet_signup", "internet")]) { expect(shouldRequestConversationalReply(item)).toBe(false); expect(resolveCoopiaAskFlow({ structured: item, chatAvailable: false })).toBe("structured_only"); }
  });
  it("allows an open question to add a conversational reply without replacing the structured result", () => expect(resolveCoopiaAskFlow({ structured: result("general_question", "general", "unknown"), chatAvailable: true })).toBe("structured_with_chat"));
});
