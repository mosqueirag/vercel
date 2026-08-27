import type { AssistantIntent, AssistantService } from "../ai/intents";

export const journeyEventTypes = [
  "journey_started", "page_viewed", "assistant_opened", "assistant_question_sent",
  "intent_detected", "tool_started", "tool_completed", "tool_failed",
  "fiber_coverage_checked", "fiber_lead_started", "fiber_lead_created", "internet_audience_selected",
  "fiber_coverage_check", "fiber_coverage_result", "internet_plans_viewed", "plan_view", "plan_selected", "lead_started", "lead_created", "lead_failed", "fiber_waitlist_started", "fiber_waitlist_created",
  "service_request_started", "service_request_submitted", "service_request_created", "service_request_failed",
  "service_request_status_checked", "human_handoff_opened",
  "ticket_started", "ticket_created", "ticket_status_checked", "service_status_viewed",
  "news_opened", "payment_information_viewed", "human_handoff_requested",
  "whatsapp_opened", "payment_portal_opened", "journey_completed", "journey_abandoned", "navigation_recommended",
  "complaint_intent_detected", "complaint_route_resolved", "complaint_whatsapp_opened",
  "commercial_inbox_viewed", "lead_viewed", "lead_contact_opened", "lead_status_changed", "fiber_demand_viewed",
  "navigation_executed", "contextual_component_rendered", "action_clicked", "form_started", "form_completed",
  "coopia_global_opened", "coopia_global_closed", "coopia_question", "coopia_action_clicked", "coopia_feedback", "coopia_unresolved", "coopia_handoff",
  "coopia_page_context", "coopia_message_sent", "coopia_intent_detected", "coopia_service_detected", "coopia_action_shown", "coopia_result", "coopia_error",
  "coopia_turn", "coopia_deterministic_response", "coopia_llm_requested", "coopia_llm_response", "coopia_llm_unavailable", "coopia_rate_limited",
] as const;

export type JourneyEventType = (typeof journeyEventTypes)[number];
export type JourneyContext = { journeyId: string; sessionId: string; page?: string; intent?: AssistantIntent; service?: AssistantService };
export type JourneyEvent = JourneyContext & {
  eventType: JourneyEventType;
  agent?: string;
  tool?: string;
  action?: string;
  result?: string;
  metadata?: Record<string, string | number | boolean | null>;
  durationMs?: number;
};
