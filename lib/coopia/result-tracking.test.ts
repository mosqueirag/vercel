import { describe, expect, it } from "vitest";
import type { AssistantResult } from "../ai/results";
import { eventTrackingContext, resultTrackingContext, resultTrackingKey, takeShownActionEvents, visibleAssistantActions, withEventTrackingContext } from "./result-tracking";

function result(input: Pick<AssistantResult, "intent" | "service" | "orchestration" | "recommendedActions">): AssistantResult {
  return {
    ...input,
    message: "Respuesta controlada",
    confidence: 0.96,
    actions: input.recommendedActions,
    nextStep: "coverage_validation",
    requiresConfirmation: false,
    requiresHuman: false,
    tool: { name: "official_data", kind: "read", status: "ready" },
    journey: { journeyId: "journey-test", currentStep: "coverage_validation" },
  };
}

const payment = result({
  intent: "pay_invoice", service: "billing", orchestration: { intent: "payment", analyticsKey: "payment", detection: "rule" },
  recommendedActions: [{ id: "OPEN_VIRTUAL_OFFICE", label: "Pagar" }],
});
const energy = result({
  intent: "energy_problem", service: "energy", orchestration: { intent: "energy_outage", analyticsKey: "energy_outage", detection: "rule" },
  recommendedActions: [{ id: "REPORT_ENERGY_PROBLEM", label: "Informar" }],
});
const interest = result({
  intent: "internet_signup", service: "internet", orchestration: { intent: "internet_interest", analyticsKey: "internet_interest", detection: "rule" },
  recommendedActions: [
    { id: "CHECK_COVERAGE", label: "Cobertura" },
    { id: "SHOW_INTERNET_PLANS", label: "Planes" },
    { id: "REQUEST_INSTALLATION", label: "Instalación" },
    { id: "OPEN_WHATSAPP", label: "WhatsApp" },
  ],
});
const funeral = result({
  intent: "funeral_service", service: "funeral", orchestration: { intent: "funeral_service", analyticsKey: "funeral_service", detection: "rule" },
  recommendedActions: [
    { id: "SHOW_FUNERAL_SERVICE", label: "Ver servicio de sepelio", href: "/sepelio" },
    { id: "CALL_FUNERAL_GUARD", label: "Llamar a guardia de sepelio", href: "tel:+542974000000" },
  ],
});

describe("COOPIA result tracking", () => {
  it("uses the current resolved result after payment then energy outage", () => {
    expect(resultTrackingContext(payment)).toMatchObject({ intent: "pay_invoice", service: "billing" });
    expect(resultTrackingContext(energy)).toEqual({ intent: "energy_problem", service: "energy", orchestrationIntent: "energy_outage" });
  });

  it("does not inherit billing after payment then internet interest", () => {
    const context = resultTrackingContext(interest);
    expect(context).toEqual({ intent: "internet_signup", service: "internet", orchestrationIntent: "internet_interest" });
    expect(context.intent).not.toBe("pay_invoice");
    expect(context.service).not.toBe("billing");
  });

  it("records a second pre-classification message without the prior payment context", () => {
    const priorNavigation = resultTrackingContext(payment);
    const payload = withEventTrackingContext({ eventType: "coopia_message_sent", metadata: { message_length: 12 } }, eventTrackingContext(priorNavigation, "none"));
    expect(payload).not.toHaveProperty("intent");
    expect(payload).not.toHaveProperty("service");
    expect(payload.metadata).toEqual({ message_length: 12 });
    expect(resultTrackingContext(energy)).toMatchObject({ intent: "energy_problem", service: "energy" });
  });

  it("keeps the next internet-interest message unclassified until the official result arrives", () => {
    const priorNavigation = resultTrackingContext(payment);
    expect(withEventTrackingContext({ eventType: "coopia_message_sent" }, eventTrackingContext(priorNavigation, "none"))).toEqual({ eventType: "coopia_message_sent" });
    expect(resultTrackingContext(interest)).toMatchObject({ intent: "internet_signup", service: "internet" });
  });

  it("keeps explicit result context and inherited navigation context available", () => {
    expect(withEventTrackingContext({ eventType: "coopia_result" }, resultTrackingContext(energy))).toMatchObject({ intent: "energy_problem", service: "energy" });
    expect(withEventTrackingContext({ eventType: "navigation_executed" }, { intent: "pay_invoice", service: "billing" })).toMatchObject({ intent: "pay_invoice", service: "billing" });
  });

  it("records every action shown once, including across a render retry", () => {
    const seen = new Set<string>();
    const key = resultTrackingKey(interest, 2);
    const actionIds = interest.recommendedActions.map((action) => action.id);
    const first = takeShownActionEvents({ journeyId: "journey-test", resultKey: key, result: interest, visibleActionIds: actionIds, seen });
    const retry = takeShownActionEvents({ journeyId: "journey-test", resultKey: key, result: interest, visibleActionIds: actionIds, seen });
    expect(first.map((event) => event.action)).toEqual(["CHECK_COVERAGE", "SHOW_INTERNET_PLANS", "REQUEST_INSTALLATION", "OPEN_WHATSAPP"]);
    expect(first.every((event) => event.context.intent === "internet_signup" && event.context.service === "internet" && event.metadata.orchestration_intent === "internet_interest")).toBe(true);
    expect(retry).toEqual([]);
  });

  it("keeps distinct results within the same journey independently traceable", () => {
    expect(resultTrackingKey(payment, 1)).not.toBe(resultTrackingKey(energy, 2));
  });

  it("uses only typed result fields in its client-side fingerprint and metadata", () => {
    const key = resultTrackingKey(interest, 3);
    const event = takeShownActionEvents({ journeyId: "journey-test", resultKey: key, result: interest, visibleActionIds: interest.recommendedActions.map((action) => action.id), seen: new Set() })[0];
    expect(key).not.toContain(interest.message);
    expect(JSON.stringify(event)).not.toContain(interest.message);
    expect(event.metadata).toEqual({ ui_type: "actions", orchestration_intent: "internet_interest" });
  });

  it("tracks only generic actions that are actually executable in the rendered card", () => {
    expect(visibleAssistantActions(funeral.actions).map((action) => action.id)).toEqual(["SHOW_FUNERAL_SERVICE", "CALL_FUNERAL_GUARD"]);
    const events = takeShownActionEvents({ journeyId: "journey-test", resultKey: resultTrackingKey(funeral, 4), result: funeral, visibleActionIds: ["SHOW_FUNERAL_SERVICE", "CALL_FUNERAL_GUARD"], seen: new Set() });
    expect(events.map((event) => event.action)).toEqual(["SHOW_FUNERAL_SERVICE", "CALL_FUNERAL_GUARD"]);
    expect(events.every((event) => event.context.intent === "funeral_service" && event.context.service === "funeral")).toBe(true);
  });

  it("does not create action-shown analytics for non-rendered actions", () => {
    expect(takeShownActionEvents({ journeyId: "journey-test", resultKey: resultTrackingKey(funeral, 5), result: funeral, visibleActionIds: [], seen: new Set() })).toEqual([]);
  });
});
