import { describe, expect, it } from "vitest";
import { emptyCoopiaConversationState, nextCoopiaConversationState, resolveCoopiaIntent, shouldUseStructuredResolution } from "./conversation-state";
import type { AssistantResult } from "../ai/results";

describe("COOPIA conversational state", () => {
  it("keeps an Internet journey when the person confirms the coverage step", () => {
    expect(resolveCoopiaIntent("Sí", { ...emptyCoopiaConversationState, intent: "internet_signup", service: "internet" })).toMatchObject({ intent: "internet_signup", suggestedAction: "check_coverage" });
  });
  it("answers a price follow-up in the current Internet journey", () => {
    expect(resolveCoopiaIntent("¿Cuánto sale?", { ...emptyCoopiaConversationState, service: "internet", currentStep: "check_coverage" })).toMatchObject({ intent: "internet_plans" });
  });
  it("keeps a contextual plan selection", () => {
    expect(resolveCoopiaIntent("Quiero el segundo", { ...emptyCoopiaConversationState, intent: "internet_plans", service: "internet" })).toMatchObject({ suggestedAction: "select_internet_plan" });
  });
  it("hands off after two consecutive unrecognized turns", () => {
    expect(resolveCoopiaIntent("no sé", { ...emptyCoopiaConversationState, unresolvedCount: 2 })).toMatchObject({ intent: "contact_operator" });
  });
  it("does not end a progressing journey at the fourth turn", () => {
    const result = { intent: "internet_signup", service: "internet", nextStep: "check_coverage", requiresHuman: false, tool: { status: "ready" } } as AssistantResult;
    expect(nextCoopiaConversationState({ ...emptyCoopiaConversationState, turnCount: 3, currentStep: "show_internet_plans" }, result)).toMatchObject({ journeyStatus: "active", lastOutcome: "progressed" });
  });
  it("routes a stagnated fourth turn to a person", () => {
    expect(resolveCoopiaIntent("todavía no sé", { ...emptyCoopiaConversationState, turnCount: 4, lastOutcome: "no_progress" })).toMatchObject({ intent: "contact_operator" });
  });
  it("keeps known action results out of generative chat", () => {
    expect(shouldUseStructuredResolution({ intent: "pay_invoice", requiresHuman: false, tool: { status: "completed" } } as AssistantResult)).toBe(true);
    expect(shouldUseStructuredResolution({ intent: "general_question", requiresHuman: false, tool: { status: "ready" } } as AssistantResult)).toBe(false);
  });
});
