import { NextRequest } from "next/server";
import { z } from "zod";
import { isJourneyId, isSessionId } from "../../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../../lib/journey/recorder";
import { journeyEventTypes } from "../../../../lib/journey/types";
import { intentNames } from "../../../../lib/ai/intents";
import { consumeRateLimit } from "../../../../lib/security/rate-limit";

const publicEvents = ["journey_started", "page_viewed", "assistant_opened", "human_handoff_requested", "human_handoff_opened", "whatsapp_opened", "journey_abandoned", "navigation_executed", "contextual_component_rendered", "action_clicked", "form_started", "form_completed", "fiber_coverage_check", "fiber_coverage_result", "internet_plans_viewed", "plan_view", "plan_selected", "lead_started", "fiber_waitlist_started", "service_request_started", "service_request_submitted", "service_request_status_checked", "complaint_intent_detected", "complaint_route_resolved", "complaint_whatsapp_opened"] as const;
const schema = z.object({
  journeyId: z.string().refine(isJourneyId),
  sessionId: z.string().refine(isSessionId),
  eventType: z.enum(publicEvents),
  page: z.string().trim().max(160).default("/"),
  intent: z.enum(intentNames).optional(),
  service: z.enum(["billing", "internet", "fiber", "energy", "phone", "funeral", "general"]).optional(),
  action: z.string().trim().max(80).optional(),
  result: z.string().trim().max(80).optional(),
  metadata: z.object({ routingWindow: z.enum(["office_hours", "after_hours"]), contactPurpose: z.string().trim().min(2).max(80) }).optional(),
});

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit(request, "journey-events", 30, 60);
  if (!rate.allowed) return Response.json({ error: rate.available ? "rate_limit" : "protection_unavailable" }, { status: rate.available ? 429 : 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !journeyEventTypes.includes(parsed.data.eventType)) return Response.json({ error: "invalid_event" }, { status: 400 });
  await recordJourneyEvent({ ...parsed.data, agent: "coopia" });
  return new Response(null, { status: 204 });
}
