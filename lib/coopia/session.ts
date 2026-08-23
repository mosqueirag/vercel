import type { AssistantIntent, AssistantService } from "../ai/intents";

export type CoopiaMessage = { role: "user" | "assistant"; content: string };

export const coopiaSessionStorageKey = "coopsar-coopia-session-v1";
const maxMessages = 8;

export function compactMessages(messages: CoopiaMessage[]) {
  return messages.filter((message) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.length <= 1200).slice(-maxMessages);
}

export function shouldRecordPageView(recordedPages: string[], page: string) {
  return !recordedPages.includes(page);
}

export function coopiaEventMetadata(input: { helpful?: boolean; uiType?: string; fallbackType?: string; lastStep?: string }) {
  const metadata: Record<string, string | boolean> = {};
  if (typeof input.helpful === "boolean") metadata.helpful = input.helpful;
  if (input.uiType) metadata.ui_type = input.uiType.slice(0, 80);
  if (input.fallbackType) metadata.fallback_type = input.fallbackType.slice(0, 80);
  if (input.lastStep) metadata.last_step = input.lastStep.slice(0, 80);
  return metadata;
}

export function isPublicCoopiaPath(pathname: string) { return pathname !== "/admin" && !pathname.startsWith("/admin/"); }

export function coopiaRequestContext(input: { journeyId: string; sessionId: string; page: string; intent?: AssistantIntent; service?: AssistantService }) {
  return { journeyId: input.journeyId, sessionId: input.sessionId, page: input.page, intent: input.intent, service: input.service };
}

export function handoffSummary(input: { intent?: AssistantIntent; service?: AssistantService; lastStep?: string }) {
  return `Hola, necesito asistencia de COOPSAR. Motivo: ${input.intent || "consulta"}. Servicio: ${input.service || "general"}. Gestión: ${input.lastStep || "orientación"}.`;
}

export function officialWhatsAppHandoffUrl(contactValue: string | null | undefined, summary: string) {
  const number = (contactValue || "").replace(/\D/g, "");
  if (number.length < 8) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(summary)}`;
}

export type StoredCoopiaSession = {
  messages: CoopiaMessage[];
  /** LLM budget state only. COOPIA tools and the input remain available. */
  aiLimited: boolean;
  journeyId: string;
  sessionId: string;
  intent?: AssistantIntent;
  service?: AssistantService;
};

export function parseCoopiaSession(value: string | null): StoredCoopiaSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredCoopiaSession> & { limited?: unknown };
    if (typeof parsed.journeyId !== "string" || typeof parsed.sessionId !== "string") return null;
    return { messages: compactMessages(Array.isArray(parsed.messages) ? parsed.messages : []), aiLimited: Boolean(parsed.aiLimited ?? parsed.limited), journeyId: parsed.journeyId, sessionId: parsed.sessionId, intent: parsed.intent, service: parsed.service };
  } catch { return null; }
}
