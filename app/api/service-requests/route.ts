import { NextRequest } from "next/server";
import { recordJourneyEvent } from "../../../lib/journey/recorder";
import { consumeRateLimit } from "../../../lib/security/rate-limit";
import { createServiceRequestNumber } from "../../../lib/service-requests/request-number";
import { parseServiceRequest } from "../../../lib/service-requests/schema";
import { createSupabaseAdmin } from "../../../lib/supabase";

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit(request, "service-requests", 5, 600);
  if (!rate.allowed) return Response.json({ error: rate.available ? "rate_limit" : "protection_unavailable" }, { status: rate.available ? 429 : 503 });
  const parsed = parseServiceRequest(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 });
  const { data } = parsed;
  const context = { journeyId: data.journeyId, sessionId: data.sessionId, page: "/#asistente", service: data.service };
  await recordJourneyEvent({ ...context, eventType: "service_request_submitted", result: data.requestType, metadata: { request_type: data.requestType, source: data.source } });
  const supabase = createSupabaseAdmin();
  if (!supabase) { await recordJourneyEvent({ ...context, eventType: "service_request_failed", result: "storage_unavailable", metadata: { request_type: data.requestType, source: data.source } }); return Response.json({ error: "storage_unavailable" }, { status: 503 }); }
  const requestNumber = createServiceRequestNumber();
  const { error } = await supabase.from("service_requests").insert({ request_number: requestNumber, request_type: data.requestType, service: data.service, journey_id: data.journeyId, session_id: data.sessionId, full_name: data.fullName, phone: data.phone, email: data.email, payload: data.payload, consent: data.consent, source: data.source });
  if (error) { console.error("Service request storage failed", error.code); await recordJourneyEvent({ ...context, eventType: "service_request_failed", result: "storage_error", metadata: { request_type: data.requestType, source: data.source } }); return Response.json({ error: "storage_error" }, { status: 503 }); }
  await recordJourneyEvent({ ...context, eventType: "service_request_created", result: "new", metadata: { request_type: data.requestType, source: data.source } });
  return Response.json({ requestNumber, requestType: data.requestType, createdAt: new Date().toISOString(), status: "new", nextStep: data.nextStep }, { status: 201 });
}
