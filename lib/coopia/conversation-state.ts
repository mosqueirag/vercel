import { detectIntent, type AssistantIntent, type AssistantService, type IntentDetection } from "../ai/intents";
import type { AssistantResult } from "../ai/results";

export type CoopiaJourneyStatus = "active" | "resolved" | "handoff";

export type CoopiaConversationState = {
  turnCount: number;
  unresolvedCount: number;
  journeyStatus: CoopiaJourneyStatus;
  currentStep?: string;
  lastOutcome?: string;
  handoffReason?: "requested" | "unrecognized" | "stagnated" | "tool_unavailable";
  intent?: AssistantIntent;
  service?: AssistantService;
};

export const emptyCoopiaConversationState: CoopiaConversationState = {
  turnCount: 0,
  unresolvedCount: 0,
  journeyStatus: "active",
};

const humanRequest = /\b(persona|humano|operador|asesor|whatsapp)\b/i;
const affirmative = /^(si|sí|dale|ok|okay|bueno|continuar|quiero)\b/i;
const priceQuestion = /\b(cu[aá]nto|precio|sale|valor|costo)\b/i;
const selectedPlan = /\b(segundo|segunda|2(?:do|da)?|ese plan)\b/i;

function contextualDetection(intent: AssistantIntent, service: AssistantService, confidence: number, suggestedAction: string): IntentDetection {
  return { intent, service, confidence, suggestedAction };
}

/**
 * Resolves short follow-ups without delegating the conversation memory to an LLM.
 * The caller only sends this state for its own journey; it never contains message text.
 */
export function resolveCoopiaIntent(message: string, state: CoopiaConversationState = emptyCoopiaConversationState): IntentDetection {
  const clean = message.trim();
  const normalized = clean.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (humanRequest.test(clean) || state.unresolvedCount >= 2 || (state.turnCount >= 4 && state.lastOutcome === "no_progress")) {
    return contextualDetection("contact_operator", state.service ?? "general", 0.99, "human_handoff");
  }
  if (selectedPlan.test(clean) && (state.intent === "internet_plans" || state.currentStep === "show_internet_plans")) {
    return contextualDetection("internet_plans", state.service === "fiber" ? "fiber" : "internet", 0.96, "select_internet_plan");
  }
  if (priceQuestion.test(clean) && (state.service === "internet" || state.service === "fiber")) {
    return contextualDetection("internet_plans", state.service, 0.96, "show_internet_plans");
  }
  if (affirmative.test(normalized) && ["internet_signup", "fiber_signup", "fiber_coverage"].includes(state.intent ?? "")) {
    return contextualDetection(state.service === "fiber" ? "fiber_coverage" : "internet_signup", state.service ?? "internet", 0.94, "check_coverage");
  }
  return detectIntent(clean);
}

export function shouldUseStructuredResolution(result: AssistantResult) {
  return result.intent !== "general_question" || result.requiresHuman || result.tool.status === "unavailable";
}

export function nextCoopiaConversationState(previous: CoopiaConversationState, result: AssistantResult): CoopiaConversationState {
  const progressed = result.nextStep !== previous.currentStep && result.intent !== "general_question";
  const unresolved = result.intent === "general_question" || result.tool.status === "unavailable";
  const unresolvedCount = unresolved ? previous.unresolvedCount + 1 : 0;
  const handoffReason = result.requiresHuman
    ? result.tool.status === "unavailable" ? "tool_unavailable" : result.intent === "contact_operator" ? "requested" : undefined
    : unresolvedCount >= 2 ? "unrecognized" : previous.turnCount + 1 >= 4 && !progressed ? "stagnated" : undefined;
  return {
    turnCount: previous.turnCount + 1,
    unresolvedCount,
    journeyStatus: handoffReason || result.requiresHuman ? "handoff" : progressed && ["installation", "open_payment", "open_virtual_office"].includes(result.nextStep) ? "resolved" : "active",
    currentStep: result.nextStep,
    lastOutcome: progressed ? "progressed" : "no_progress",
    handoffReason,
    intent: result.intent,
    service: result.service,
  };
}
