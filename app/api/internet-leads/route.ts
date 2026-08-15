import { NextRequest } from "next/server";
import { z } from "zod";
import { deliverPendingOutbox } from "../../../lib/integrations/outbox";
import { isJourneyId, isSessionId } from "../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../lib/journey/recorder";
import { consumeRateLimit, secureFingerprint } from "../../../lib/security/rate-limit";
import { createSupabaseAdmin } from "../../../lib/supabase";

const schema = z.object({
  customerType: z.enum(["hogar", "comercio", "empresa"]), name: z.string().trim().min(3).max(100),
  phone: z.string().trim().min(8).max(30), email: z.string().email().max(150), address: z.string().trim().min(5).max(180),
  zone: z.string().trim().min(2).max(100), plan: z.string().trim().max(80), preferredTime: z.string().trim().max(80),
  consent: z.literal(true), source: z.string().max(40).default("web"), journeyId: z.string().refine(isJourneyId), sessionId: z.string().refine(isSessionId),
});

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit(request, "internet-leads", 5, 600);
  if (!rate.allowed) return Response.json({ error: rate.available ? "Realizaste demasiados envíos. Esperá unos minutos." : "El servicio de protección no está disponible." }, { status: rate.available ? 429 : 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisá los campos obligatorios." }, { status: 400 });
  const context = { journeyId: parsed.data.journeyId, sessionId: parsed.data.sessionId, page: "/#contratar", service: "fiber" as const };
  await recordJourneyEvent({ ...context, eventType: "lead_started", result: "submitted" });
  const bucket = Math.floor(Date.now() / 300_000);
  const fingerprint = secureFingerprint("internet-lead", `${parsed.data.email.toLowerCase()}|${parsed.data.phone.replace(/\D/g, "")}|${bucket}`);
  if (!fingerprint) return Response.json({ error: "El servicio de protección no está configurado." }, { status: 503 });
  const requestNumber = `NET-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const supabase = createSupabaseAdmin();
  if (!supabase) { await recordJourneyEvent({ ...context, eventType: "lead_failed", result: "storage_unavailable" }); return Response.json({ error: "El canal de registro no está disponible." }, { status: 503 }); }
  const { error } = await supabase.rpc("create_internet_request_with_outbox", {
    p_request_number: requestNumber, p_journey_id: parsed.data.journeyId, p_session_id: parsed.data.sessionId,
    p_customer_type: parsed.data.customerType, p_full_name: parsed.data.name, p_phone: parsed.data.phone,
    p_email: parsed.data.email, p_address: parsed.data.address, p_zone: parsed.data.zone, p_selected_plan: parsed.data.plan,
    p_preferred_contact_time: parsed.data.preferredTime, p_consent: parsed.data.consent, p_source: parsed.data.source, p_deduplication_key: fingerprint,
  });
  if (error) {
    await recordJourneyEvent({ ...context, eventType: "lead_failed", result: error.code === "23505" ? "duplicate" : "storage_error" });
    if (error.code === "23505") return Response.json({ error: "Esta solicitud ya fue recibida recientemente." }, { status: 409 });
    console.error("Internet request storage failed", error.code); return Response.json({ error: "No pudimos registrar la solicitud. Intentá por WhatsApp." }, { status: 503 });
  }
  await recordJourneyEvent({ ...context, eventType: "lead_created", result: "stored", metadata: { request_number: requestNumber } });
  await deliverPendingOutbox();
  return Response.json({ requestNumber, stored: true, message: "Recibimos tu solicitud. El equipo comercial verificará cobertura y se comunicará con vos." }, { status: 201 });
}
