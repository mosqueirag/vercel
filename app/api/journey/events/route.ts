import { NextRequest } from "next/server";
import { z } from "zod";
import { isJourneyId, isSessionId } from "../../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../../lib/journey/recorder";
import { journeyEventTypes } from "../../../../lib/journey/types";
import { intentNames } from "../../../../lib/ai/intents";
import { consumeRateLimit } from "../../../../lib/security/rate-limit";

const publicEvents = ["journey_started", "page_viewed", "assistant_opened", "human_handoff_requested", "human_handoff_opened", "whatsapp_opened", "payment_portal_opened", "journey_abandoned", "navigation_executed", "contextual_component_rendered", "action_clicked", "quick_access_click", "app_download_click", "home_priority_applied", "form_started", "form_completed", "fiber_coverage_check", "fiber_coverage_result", "internet_plans_viewed", "internet_plan_recommended", "plan_view", "plan_selected", "internet_audience_selected", "enterprise_internet_interest", "enterprise_whatsapp_click", "lead_started", "fiber_waitlist_started", "service_request_started", "service_request_submitted", "service_request_status_checked", "complaint_intent_detected", "complaint_route_resolved", "complaint_whatsapp_opened", "coopia_global_opened", "coopia_global_closed", "coopia_question", "coopia_action_clicked", "coopia_feedback", "coopia_unresolved", "coopia_handoff", "coopia_page_context", "coopia_message_sent", "coopia_intent_detected", "coopia_service_detected", "coopia_action_shown", "coopia_result", "coopia_error"] as const;
const schema = z.object({
  journeyId: z.string().refine(isJourneyId),
  sessionId: z.string().refine(isSessionId),
  eventType: z.enum(publicEvents),
  page: z.string().trim().max(160).default("/"),
  intent: z.enum(intentNames).optional(),
  service: z.enum(["billing", "internet", "fiber", "energy", "phone", "funeral", "general"]).optional(),
  action: z.string().trim().max(80).optional(),
  result: z.string().trim().max(80).optional(),
  metadata: z.object({
    routingWindow: z.enum(["office_hours", "after_hours"]).optional(),
    contactPurpose: z.string().trim().min(2).max(80).optional(),
    helpful: z.boolean().optional(),
    ui_type: z.string().trim().max(80).optional(),
    fallback_type: z.string().trim().max(80).optional(),
    last_step: z.string().trim().max(80).optional(),
    page_type: z.enum(["home", "service", "news", "article", "help", "tramite", "contact", "institutional", "other"]).optional(),
    page_title: z.string().trim().max(80).optional(),
    entity_id: z.string().trim().max(80).nullable().optional(),
    previous_page: z.string().trim().max(160).nullable().optional(),
    message_length: z.number().int().min(0).max(1200).optional(),
    confidence: z.number().min(0).max(1).optional(),
    orchestration_intent: z.string().trim().max(80).optional(),
    outcome: z.enum(["resolved", "information_provided", "action_completed", "conversion", "handoff", "abandoned", "unresolved", "error", "action_recommended", "coverage_validation", "human_handoff"]).optional(),
    plan_id: z.string().uuid().optional(),
    technology: z.enum(["FTTH", "ADSL", "WIRELESS"]).nullable().optional(),
    coverage_status: z.enum(["available", "nearby", "planned", "unavailable", "unknown"]).optional(),
    commercial_availability: z.boolean().optional(),
    source: z.enum(["enterprise_panel", "home_quick_actions", "quick_actions_app", "contact_app", "navigation_context"]).optional(),
    action_id: z.enum(["pay_bill", "energy_outage", "internet_interest", "fiber_coverage", "change_holder", "funeral_service", "all_procedures"]).optional(),
    priority_action: z.enum(["pay_bill", "energy_outage", "internet_interest", "funeral_service"]).optional(),
    destination_type: z.enum(["internal", "external", "contact"]).optional(),
    platform: z.enum(["android"]).optional(),
    destination: z.enum(["google_play"]).optional(),
  }).optional(),
  durationMs: z.number().int().min(0).max(120000).optional(),
});

export function sanitizePublicCoopiaMetadata(metadata: z.infer<typeof schema>["metadata"]) {
  if (!metadata) return undefined;
  const { routingWindow, contactPurpose, helpful, ui_type, fallback_type, last_step, page_type, message_length, confidence, orchestration_intent, outcome, plan_id, technology, coverage_status, commercial_availability, source, action_id, priority_action, destination_type, platform, destination } = metadata;
  return { ...(routingWindow ? { routingWindow } : {}), ...(contactPurpose ? { contactPurpose } : {}), ...(typeof helpful === "boolean" ? { helpful } : {}), ...(ui_type ? { ui_type } : {}), ...(fallback_type ? { fallback_type } : {}), ...(last_step ? { last_step } : {}), ...(page_type ? { page_type } : {}), ...(typeof message_length === "number" ? { message_length } : {}), ...(typeof confidence === "number" ? { confidence } : {}), ...(orchestration_intent ? { orchestration_intent } : {}), ...(outcome ? { outcome } : {}), ...(plan_id ? { plan_id } : {}), ...(technology ? { technology } : {}), ...(coverage_status ? { coverage_status } : {}), ...(typeof commercial_availability === "boolean" ? { commercial_availability } : {}), ...(source ? { source } : {}), ...(action_id ? { action_id } : {}), ...(priority_action ? { priority_action } : {}), ...(destination_type ? { destination_type } : {}), ...(platform ? { platform } : {}), ...(destination ? { destination } : {}) };
}

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit(request, "journey-events", 30, 60);
  if (!rate.allowed) return Response.json({ error: rate.available ? "rate_limit" : "protection_unavailable" }, { status: rate.available ? 429 : 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !journeyEventTypes.includes(parsed.data.eventType)) return Response.json({ error: "invalid_event" }, { status: 400 });
  await recordJourneyEvent({ ...parsed.data, metadata: sanitizePublicCoopiaMetadata(parsed.data.metadata), agent: "coopia" });
  return new Response(null, { status: 204 });
}
