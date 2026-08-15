import type { AssistantIntent, AssistantService } from "./intents";

export const assistantActions = [
  "CHECK_COVERAGE", "REQUEST_INSTALLATION", "SHOW_SERVICE_STATUS", "START_DIAGNOSIS",
  "REPORT_ENERGY_PROBLEM", "OPEN_VIRTUAL_OFFICE", "SHOW_PAYMENT_METHODS",
  "DOWNLOAD_INVOICE", "OPEN_WHATSAPP",
] as const;

export type AssistantAction = (typeof assistantActions)[number];
export type AssistantUIType = "fiber_coverage" | "service_status" | "payment";
export type AssistantRecommendedAction = { id: AssistantAction; label: string; href?: string };
export type AssistantResult = {
  message: string;
  intent: AssistantIntent;
  service: AssistantService;
  confidence: number;
  ui?: { type: AssistantUIType; data: Record<string, string | number | boolean | null> };
  recommendedActions: AssistantRecommendedAction[];
  /** Compatibility alias for current UI consumers. */
  actions: AssistantRecommendedAction[];
  nextStep: string;
  requiresConfirmation: boolean;
  requiresHuman: boolean;
  tool: { name: string; kind: "read" | "write"; status: "ready" | "completed" | "unavailable" };
  journey: { journeyId: string; currentStep: string };
};

export type NavigationContextValue = {
  journeyId: string;
  sessionId: string;
  intent?: AssistantIntent;
  service?: AssistantService;
  currentStep?: string;
  previousActions: AssistantAction[];
  recommendedActions: AssistantResult["recommendedActions"];
};
