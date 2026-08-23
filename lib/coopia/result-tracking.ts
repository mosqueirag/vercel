import type { AssistantIntent, AssistantService } from "../ai/intents";
import type { AssistantResult } from "../ai/results";
import { coopiaStepActions } from "./interaction-flow";

/**
 * Analytics emitted for a resolved answer must use the resolved result, rather
 * than navigation state. Navigation is React state and is intentionally
 * updated asynchronously after an answer is received.
 */
export type CoopiaResultTrackingContext = {
  intent: AssistantIntent;
  service: AssistantService;
  orchestrationIntent: AssistantResult["orchestration"]["intent"];
};

export type CoopiaEventContext = Partial<Pick<CoopiaResultTrackingContext, "intent" | "service">>;
export type CoopiaEventContextMode = CoopiaEventContext | "none" | undefined;

/** Pre-classification events intentionally carry no inferred navigation context. */
export function eventTrackingContext(fallback: CoopiaEventContext, mode: CoopiaEventContextMode) {
  if (mode === "none") return {};
  return { intent: mode?.intent ?? fallback.intent, service: mode?.service ?? fallback.service };
}

/** Adds context only when it exists, so optional route-schema fields remain absent. */
export function withEventTrackingContext<T extends Record<string, unknown>>(payload: T, context: CoopiaEventContext) {
  return {
    ...payload,
    ...(context.intent ? { intent: context.intent } : {}),
    ...(context.service ? { service: context.service } : {}),
  };
}

export type CoopiaShownActionEvent = {
  action: AssistantResult["recommendedActions"][number]["id"];
  result: AssistantResult["orchestration"]["analyticsKey"];
  metadata: Record<string, string>;
  context: CoopiaResultTrackingContext;
};

/** Only actions with a destination can be rendered as an executable ActionLink. */
export function visibleAssistantActions(actions: AssistantResult["recommendedActions"]) {
  return actions.filter((action) => Boolean(action.href));
}

/**
 * Single source of truth for action-shown analytics. This mirrors the controls
 * rendered by AssistantUIRenderer; analytics must never infer visibility first.
 */
export function visibleActionIdsForResult(result: AssistantResult): AssistantResult["recommendedActions"][number]["id"][] {
  const declared = new Set(result.actions.map((action) => action.id));
  const has = (id: AssistantResult["recommendedActions"][number]["id"]) => declared.has(id);
  const linkActions = coopiaStepActions(visibleAssistantActions(result.actions)).map((action) => action.id);

  if (result.ui?.type === "fiber_coverage" || result.ui?.type === "internet_plans") {
    return has("CHECK_COVERAGE") ? ["CHECK_COVERAGE"] : [];
  }
  if (result.ui?.type === "human_handoff") return has("OPEN_WHATSAPP") ? ["OPEN_WHATSAPP"] : [];
  if (result.ui?.type === "service_request_form") return result.actions.slice(0, 1).map((action) => action.id);
  if (result.ui?.type === "complaint_service_picker") return [];
  return linkActions;
}

export function resultTrackingContext(result: AssistantResult): CoopiaResultTrackingContext {
  return { intent: result.intent, service: result.service, orchestrationIntent: result.orchestration.intent };
}

export function resultTrackingKey(result: AssistantResult, sequence: number) {
  return `${result.orchestration.intent}:${result.intent}:${result.service}:${result.journey.currentStep}:${sequence}`;
}

/** Returns every visible action once for this response. Keys carry no user text or PII. */
export function takeShownActionEvents(input: { journeyId: string; resultKey: string; result: AssistantResult; visibleActionIds: AssistantResult["recommendedActions"][number]["id"][]; seen: Set<string> }) {
  const context = resultTrackingContext(input.result);
  const visibleActionIds = new Set(input.visibleActionIds);
  return input.result.recommendedActions.reduce<CoopiaShownActionEvent[]>((events, action) => {
    if (!visibleActionIds.has(action.id)) return events;
    const fingerprint = `${input.journeyId}:${input.resultKey}:${action.id}`;
    if (input.seen.has(fingerprint)) return events;
    input.seen.add(fingerprint);
    events.push({
      action: action.id,
      result: input.result.orchestration.analyticsKey,
      metadata: { ui_type: input.result.ui?.type || "actions", orchestration_intent: context.orchestrationIntent },
      context,
    });
    return events;
  }, []);
}
