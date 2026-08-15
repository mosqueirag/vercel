"use client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AssistantAction, AssistantResult, NavigationContextValue } from "../../lib/ai/results";
type Value = NavigationContextValue & { applyResult: (result: AssistantResult, sessionId: string) => void; recordAction: (action: AssistantAction) => void };
const Context = createContext<Value | null>(null);
export function NavigationProvider({ children }: { children: ReactNode }) { const [state, setState] = useState<NavigationContextValue>({ journeyId: "", sessionId: "", previousActions: [], recommendedActions: [] }); const value = useMemo<Value>(() => ({ ...state, applyResult: (result, sessionId) => setState((current) => ({ ...current, journeyId: result.journey.journeyId, sessionId, intent: result.intent, service: result.service, currentStep: result.journey.currentStep, recommendedActions: result.actions })), recordAction: (action) => setState((current) => ({ ...current, previousActions: [...current.previousActions.slice(-7), action] })) }), [state]); return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useNavigationContext() { const value = useContext(Context); if (!value) throw new Error("NavigationProvider is required"); return value; }
