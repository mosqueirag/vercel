import type { AssistantIntent, AssistantService } from "../ai/intents";

export const journeyEventTypes = [
  "journey_started", "page_viewed", "assistant_opened", "assistant_question_sent",
  "intent_detected", "tool_started", "tool_completed", "tool_failed",
  "fiber_coverage_checked", "fiber_lead_started", "fiber_lead_created",
  "fiber_coverage_check", "fiber_coverage_result", "internet_plans_viewed", "plan_view", "plan_selected", "lead_started", "lead_created", "lead_failed", "fiber_waitlist_started", "fiber_waitlist_created",
  "service_request_started", "service_request_submitted", "service_request_created", "service_request_failed",
  "service_request_status_checked", "human_handoff_opened",
  "ticket_started", "ticket_created", "ticket_status_checked", "service_status_viewed",
  "news_opened", "payment_information_viewed", "human_handoff_requested",
  "whatsapp_opened", "journey_completed", "journey_abandoned", "navigation_recommended",
  "complaint_intent_detected", "complaint_route_resolved", "complaint_whatsapp_opened",
  "navigation_executed", "contextual_component_rendered", "action_clicked", "form_started", "form_completed",
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
