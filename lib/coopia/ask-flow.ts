import type { AssistantResult } from "../ai/results";

/** A structured action is authoritative; conversation is optional enrichment. */
export function hasUsableStructuredResult(result: AssistantResult) {
  return result.tool.status !== "unavailable" && Boolean(result.ui || result.actions.length || result.recommendedActions.length || result.requiresHuman || result.requiresConfirmation);
}

/** Rule-based results already provide a complete, actionable path without an LLM. */
export function shouldRequestConversationalReply(result: AssistantResult) {
  return !hasUsableStructuredResult(result) || result.orchestration.detection === "unknown";
}

export type CoopiaAskResolution = "structured_only" | "structured_with_chat" | "chat_only" | "error";

export function resolveCoopiaAskFlow({ structured, chatAvailable }: { structured?: AssistantResult; chatAvailable: boolean }): CoopiaAskResolution {
  if (structured && hasUsableStructuredResult(structured)) return shouldRequestConversationalReply(structured) && chatAvailable ? "structured_with_chat" : "structured_only";
  return chatAvailable ? "chat_only" : "error";
}
