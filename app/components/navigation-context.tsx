"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AssistantAction, AssistantResult, NavigationContextValue } from "../../lib/ai/results";
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
  const applyResult = useCallback((result: AssistantResult, sessionId: string) => setState((current) => ({ ...current, journeyId: result.journey.journeyId, sessionId, intent: result.intent, service: result.service, currentStep: result.journey.currentStep, recommendedActions: result.actions })), []);
  const recordAction = useCallback((action: AssistantAction) => setState((current) => ({ ...current, previousActions: [...current.previousActions.slice(-7), action] })), []);
  const value = useMemo<Value>(() => ({ ...state, applyResult, recordAction }), [applyResult, recordAction, state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useNavigationContext() { const value = useContext(Context); if (!value) throw new Error("NavigationProvider is required"); return value; }
