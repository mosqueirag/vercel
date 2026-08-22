"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AssistantAction, AssistantResult, NavigationContextValue } from "../../lib/ai/results";
import { nextCoopiaConversationState } from "../../lib/coopia/conversation-state";
type Value = NavigationContextValue & { applyResult: (result: AssistantResult, sessionId: string) => void; recordAction: (action: AssistantAction) => void };
const Context = createContext<Value | null>(null);
const emptyState: NavigationContextValue = { journeyId: "", sessionId: "", previousActions: [], recommendedActions: [] };
const storageKey = "coopsar-navigation-context-v1";

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavigationContextValue>(emptyState);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as NavigationContextValue;
        if (typeof parsed.journeyId === "string" && typeof parsed.sessionId === "string" && Array.isArray(parsed.recommendedActions)) setState(parsed);
      } catch { sessionStorage.removeItem(storageKey); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (state.intent) sessionStorage.setItem(storageKey, JSON.stringify(state)); }, [state]);
  const applyResult = useCallback((result: AssistantResult, sessionId: string) => setState((current) => {
    const conversation = nextCoopiaConversationState({
      turnCount: current.turnCount ?? 0, unresolvedCount: current.unresolvedCount ?? 0, journeyStatus: current.journeyStatus ?? "active",
      currentStep: current.currentStep, lastOutcome: current.lastOutcome, handoffReason: current.handoffReason, intent: current.intent, service: current.service,
    }, result);
    return { ...current, ...conversation, journeyId: result.journey.journeyId, sessionId, recommendedActions: result.recommendedActions };
  }), []);
  const recordAction = useCallback((action: AssistantAction) => setState((current) => ({ ...current, previousActions: [...current.previousActions.slice(-7), action] })), []);
  const value = useMemo<Value>(() => ({ ...state, applyResult, recordAction }), [applyResult, recordAction, state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useNavigationContext() { const value = useContext(Context); if (!value) throw new Error("NavigationProvider is required"); return value; }
