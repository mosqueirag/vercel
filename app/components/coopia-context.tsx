"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createJourneyId, createSessionId } from "../../lib/journey/ids";
import type { AssistantResult } from "../../lib/ai/results";
import type { AssistantIntent, AssistantService } from "../../lib/ai/intents";
import { compactMessages, coopiaEventMetadata, coopiaRequestContext, coopiaSessionStorageKey, handoffSummary, parseCoopiaSession, shouldRecordPageView, type CoopiaMessage } from "../../lib/coopia/session";
import { useNavigationContext } from "./navigation-context";

type CoopiaValue = {
  messages: CoopiaMessage[]; input: string; loading: boolean; error: string; limited: boolean; assistantResult: AssistantResult | null;
  journeyId: string; sessionId: string; intent?: AssistantIntent; service?: AssistantService; isOpen: boolean;
  setInput: (value: string) => void; ask: (text: string) => Promise<void>; setOpen: (open: boolean) => void;
  track: (eventType: string, metadata?: Record<string, string | boolean>, action?: string, result?: string) => void;
  feedback: (helpful: boolean) => void; handoffUrl: string;
};
const Context = createContext<CoopiaValue | null>(null);

function page() { return `${location.pathname}${location.hash}`; }

export function CoopiaProvider({ children }: { children: ReactNode }) {
  const navigation = useNavigationContext();
  const [messages, setMessages] = useState<CoopiaMessage[]>([]), [input, setInput] = useState(""), [loading, setLoading] = useState(false), [error, setError] = useState(""), [limited, setLimited] = useState(false), [assistantResult, setAssistantResult] = useState<AssistantResult | null>(null), [isOpen, setOpenState] = useState(false), [ids, setIds] = useState({ journeyId: "", sessionId: "" });
  const recordedPages = useRef<string[]>([]);

  const track = useCallback((eventType: string, metadata?: Record<string, string | boolean>, action?: string, result?: string) => {
    if (!ids.journeyId || !ids.sessionId) return;
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId: ids.journeyId, sessionId: ids.sessionId, eventType, page: page(), intent: navigation.intent, service: navigation.service, metadata, action, result }) }).catch(() => undefined);
  }, [ids, navigation.intent, navigation.service]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = parseCoopiaSession(sessionStorage.getItem(coopiaSessionStorageKey));
      const next = stored || { messages: [], limited: false, journeyId: sessionStorage.getItem("coopsar-journey-id") || createJourneyId(), sessionId: sessionStorage.getItem("coopsar-session-id") || createSessionId() };
      sessionStorage.setItem("coopsar-journey-id", next.journeyId); sessionStorage.setItem("coopsar-session-id", next.sessionId);
      setMessages(next.messages); setLimited(next.limited); setIds({ journeyId: next.journeyId, sessionId: next.sessionId });
      if (!sessionStorage.getItem("coopsar-journey-started")) {
        sessionStorage.setItem("coopsar-journey-started", "1");
        void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId: next.journeyId, sessionId: next.sessionId, eventType: "journey_started", page: page() }) }).catch(() => undefined);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => { if (ids.journeyId) sessionStorage.setItem(coopiaSessionStorageKey, JSON.stringify({ messages: compactMessages(messages), limited, ...ids, intent: navigation.intent, service: navigation.service })); }, [ids, limited, messages, navigation.intent, navigation.service]);
  useEffect(() => {
    if (!ids.journeyId || !shouldRecordPageView(recordedPages.current, page())) return;
    recordedPages.current = [...recordedPages.current, page()].slice(-20);
    track("page_viewed");
  });

  const setOpen = useCallback((open: boolean) => { setOpenState(open); track(open ? "coopia_global_opened" : "coopia_global_closed"); }, [track]);
  const ask = useCallback(async (text: string) => {
    const clean = text.trim(); if (!clean || loading || limited || !ids.journeyId) return;
    const next = compactMessages([...messages, { role: "user", content: clean }]);
    setMessages(next); setInput(""); setError(""); setLoading(true); track("coopia_question");
    try {
      const context = coopiaRequestContext({ journeyId: ids.journeyId, sessionId: ids.sessionId, page: page(), intent: navigation.intent, service: navigation.service });
      const [structuredResponse, response] = await Promise.all([fetch("/api/assistant/resolve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: clean, ...context }) }), fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next, ...context }) })]);
      if (structuredResponse.ok) { const result = await structuredResponse.json() as AssistantResult; setAssistantResult(result); navigation.applyResult(result, ids.sessionId); if (result.intent === "general_question" || result.tool.status === "unavailable" || result.requiresHuman) track("coopia_unresolved", coopiaEventMetadata({ fallbackType: result.tool.status === "unavailable" ? "tool_unavailable" : result.requiresHuman ? "human_handoff" : "official_information_unavailable", lastStep: result.nextStep }), undefined, result.intent); }
      if (!response.ok) { const data = await response.json().catch(() => ({})) as { error?: string }; if (data.error === "session_limit") setLimited(true); else throw new Error(data.error || "No pudimos responder."); return; }
      setMessages((current) => [...current, { role: "assistant", content: "" }]);
      const reader = response.body?.getReader(); if (!reader) throw new Error("Respuesta vacía"); const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; const chunk = decoder.decode(value, { stream: true }); setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, content: item.content + chunk } : item)); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos responder."); track("coopia_unresolved", coopiaEventMetadata({ fallbackType: "backend_error" })); }
    finally { setLoading(false); }
  }, [ids, limited, loading, messages, navigation, track]);
  const feedback = useCallback((helpful: boolean) => track("coopia_feedback", coopiaEventMetadata({ helpful, uiType: assistantResult?.ui?.type })), [assistantResult?.ui?.type, track]);
  const handoffUrl = `https://wa.me/?text=${encodeURIComponent(handoffSummary({ intent: navigation.intent, service: navigation.service, lastStep: assistantResult?.nextStep }))}`;
  const value = useMemo<CoopiaValue>(() => ({ messages, input, loading, error, limited, assistantResult, journeyId: ids.journeyId, sessionId: ids.sessionId, intent: navigation.intent, service: navigation.service, isOpen, setInput, ask, setOpen, track, feedback, handoffUrl }), [ask, assistantResult, error, feedback, handoffUrl, ids, input, isOpen, limited, loading, messages, navigation.intent, navigation.service, setOpen, track]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCoopia() { const value = useContext(Context); if (!value) throw new Error("CoopiaProvider is required"); return value; }
