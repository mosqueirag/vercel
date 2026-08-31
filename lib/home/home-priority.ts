import type { AssistantIntent, AssistantService } from "../ai/intents";
import type { HomeQuickAction, HomeQuickActionId } from "./quick-actions";

export type HomePriority = {
  quickAction?: HomeQuickActionId;
  /** Existing continuation only when it adds a next step beyond COOPIA's result. */
  contextualPanel?: AssistantIntent;
  section: "internet" | "energy" | "funeral" | null;
};

const defaultPriority: HomePriority = { section: null };

/**
 * Derives a temporary Home emphasis from COOPIA's already-classified intent.
 * It deliberately has no user profile, storage, network, or LLM dependency.
 */
export function resolveHomePriority(intent?: AssistantIntent, service?: AssistantService): HomePriority {
  if (!intent) return defaultPriority;

  switch (intent) {
    case "pay_invoice":
    case "download_invoice":
    case "payment_methods":
    case "office_virtual":
    case "digital_invoice":
      // Payment actions are already rendered by COOPIA, so no second panel.
      return { quickAction: "pay_bill", section: null };
    case "energy_problem":
    case "resolve_complaint":
      return service === "energy" ? { quickAction: "energy_outage", contextualPanel: "energy_problem", section: "energy" } : defaultPriority;
    case "fiber_signup":
      return { quickAction: "internet_interest", contextualPanel: "fiber_signup", section: "internet" };
    case "internet_signup":
      return { quickAction: "internet_interest", contextualPanel: "fiber_signup", section: "internet" };
    case "fiber_coverage":
      return { quickAction: "internet_interest", contextualPanel: "fiber_coverage", section: "internet" };
    case "internet_plans":
    case "fiber_waitlist":
      return { quickAction: "internet_interest", section: "internet" };
    case "internet_problem":
      // Support remains support: never prioritize a commercial Internet CTA.
      return { contextualPanel: "internet_problem", section: "internet" };
    case "funeral_service":
      return { quickAction: "funeral_service", section: "funeral" };
    // The official service-request flow stays in COOPIA / Trámites. It is not
    // reintroduced as a fifth Home quick action.
    case "ownership_change":
    case "new_supply":
    case "phone_service":
    case "service_status":
    case "contact_operator":
    case "general_question":
    case "news_search":
      return defaultPriority;
  }
}

export function prioritizeHomeQuickActions(actions: readonly HomeQuickAction[], priority?: HomeQuickActionId) {
  if (!priority) return actions;
  const preferred = actions.find((action) => action.id === priority);
  return preferred ? [preferred, ...actions.filter((action) => action.id !== priority)] : actions;
}

export function homePriorityAnalyticsMetadata(priority: HomeQuickActionId) {
  return { priority_action: priority, source: "navigation_context" as const };
}

export function homePriorityEventKey(journeyId: string, intent: AssistantIntent | undefined, priority: HomeQuickActionId) {
  return `${journeyId}:${intent ?? "none"}:${priority}`;
}
