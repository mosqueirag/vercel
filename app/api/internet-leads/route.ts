import { NextRequest } from "next/server";
import { z } from "zod";
import { deliverPendingOutbox } from "../../../lib/integrations/outbox";
import { isJourneyId, isSessionId } from "../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../lib/journey/recorder";
import { consumeRateLimit, secureFingerprint } from "../../../lib/security/rate-limit";
import { createSupabaseAdmin } from "../../../lib/supabase";

const schema = z.object({
  customerType: z.enum(["hogar", "comercio", "empresa"]), name: z.string().trim().min(3).max(100),
  phone: z.string().trim().min(8).max(30), email: z.string().email().max(150).optional().or(z.literal("")), address: z.string().trim().min(5).max(180).optional(),
  street: z.string().trim().min(3).max(120).optional(), streetNumber: z.coerce.number().int().min(1).max(999999).optional(),
  zone: z.string().trim().max(100).default(""), plan: z.string().trim().max(80).default(""), planId: z.string().uuid().optional().nullable(),
  coverageStatus: z.enum(["available", "nearby", "planned", "unavailable", "unknown"]).default("unknown"), requestType: z.enum(["installation", "coverage_validation", "fiber_waitlist"]).default("installation"),
  consent: z.literal(true), marketingOptIn: z.boolean().default(false), confirmed: z.literal(true), source: z.string().max(40).default("web"), journeyId: z.string().refine(isJourneyId), sessionId: z.string().refine(isSessionId),
});

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit(request, "internet-leads", 5, 600);
  if (!rate.allowed) return Response.json({ error: rate.available ? "Realizaste demasiados envíos. Esperá unos minutos." : "El servicio de protección no está disponible." }, { status: rate.available ? 429 : 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisá los campos obligatorios." }, { status: 400 });
  const context = { journeyId: parsed.data.journeyId, sessionId: parsed.data.sessionId, page: "/#contratar", service: "fiber" as const };
  await recordJourneyEvent({ ...context, eventType: parsed.data.requestType === "fiber_waitlist" ? "fiber_waitlist_started" : "lead_started", result: "confirmed" });
  const bucket = Math.floor(Date.now() / 300_000);
  const fingerprint = secureFingerprint("internet-lead", `${(parsed.data.email ?? "").toLowerCase()}|${parsed.data.phone.replace(/\D/g, "")}|${bucket}`);
  if (!fingerprint) return Response.json({ error: "El servicio de protección no está configurado." }, { status: 503 });
  const requestNumber = `NET-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const supabase = createSupabaseAdmin();
  if (!supabase) { await recordJourneyEvent({ ...context, eventType: "lead_failed", result: "storage_unavailable" }); return Response.json({ error: "El canal de registro no está disponible." }, { status: 503 }); }
  const street = parsed.data.street || parsed.data.address?.replace(/\s+\d+\s*$/, "") || "Domicilio informado";
  const streetNumber = parsed.data.streetNumber || Number(parsed.data.address?.match(/(\d+)\s*$/)?.[1] || 1);
  const { data, error } = await supabase.rpc("create_internet_request_v2_with_outbox", {
    p_request_number: requestNumber, p_journey_id: parsed.data.journeyId, p_session_id: parsed.data.sessionId, p_request_type: parsed.data.requestType,
    p_customer_type: parsed.data.customerType, p_full_name: parsed.data.name, p_phone: parsed.data.phone, p_email: parsed.data.email || "",
    p_street: street, p_street_number: streetNumber, p_zone: parsed.data.zone, p_coverage_status: parsed.data.coverageStatus,
    p_plan_id: parsed.data.planId || null, p_selected_plan: parsed.data.plan, p_contact_consent: parsed.data.consent,
    p_marketing_opt_in: parsed.data.marketingOptIn, p_source: parsed.data.source, p_deduplication_key: fingerprint,
  });
  if (error) {
    await recordJourneyEvent({ ...context, eventType: "lead_failed", result: error.code === "23505" ? "duplicate" : "storage_error" });
    if (error.code === "23505") return Response.json({ error: "Esta solicitud ya fue recibida recientemente." }, { status: 409 });
    console.error("Internet request storage failed", error.code); return Response.json({ error: "No pudimos registrar la solicitud. Intentá por WhatsApp." }, { status: 503 });
  }
  const row = Array.isArray(data) ? data[0] : data;
  const finalNumber = row?.request_number || requestNumber;
  const created = row?.created !== false;
  await recordJourneyEvent({ ...context, eventType: parsed.data.requestType === "fiber_waitlist" ? "fiber_waitlist_created" : "lead_created", result: created ? "stored" : "duplicate", metadata: { request_type: parsed.data.requestType, coverage_status: parsed.data.coverageStatus } });
  await deliverPendingOutbox();
  return Response.json({ requestNumber: finalNumber, stored: created, message: created ? "Recibimos tu solicitud. El equipo comercial verificará la información y se comunicará con vos." : "Esta solicitud ya fue recibida recientemente." }, { status: created ? 201 : 200 });
}
