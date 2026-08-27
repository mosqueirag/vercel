import { NextRequest } from "next/server";
import { funeralFamilyUpdateSchema } from "../../../lib/funeral-family-update";
import { isJourneyId, isSessionId } from "../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../lib/journey/recorder";
import { consumeRateLimit, secureFingerprint } from "../../../lib/security/rate-limit";
import { createSupabaseAdmin } from "../../../lib/supabase";

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit(request, "funeral-family-update", 3, 600);
  if (!rate.allowed) return Response.json({ error: rate.available ? "Realizaste demasiados envíos. Esperá unos minutos." : "El servicio de protección no está disponible." }, { status: rate.available ? 429 : 503 });
  const parsed = funeralFamilyUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisá los datos obligatorios del grupo familiar." }, { status: 400 });
  const value = parsed.data;
  const fingerprint = secureFingerprint("funeral-family-update", `${value.memberNumber.trim().toLowerCase()}|${value.holderDni}|${Math.floor(Date.now() / 600000)}`);
  if (!fingerprint) return Response.json({ error: "El servicio de protección no está configurado." }, { status: 503 });
  const supabase = createSupabaseAdmin();
  if (!supabase) return Response.json({ error: "El canal de registro no está disponible." }, { status: 503 });
  const requestNumber = `SEP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { data, error } = await supabase.rpc("create_funeral_family_update_request", {
    p_request_number: requestNumber, p_journey_id: value.journeyId || "", p_session_id: value.sessionId || "", p_member_number: value.memberNumber,
    p_holder_full_name: value.holderFullName, p_holder_dni: value.holderDni, p_phone: value.phone, p_email: value.email || "", p_consent: value.consent,
    p_source: "sepelio_web", p_deduplication_key: fingerprint,
    p_members: value.members.map((member) => ({ full_name: member.fullName, dni: member.dni, birth_date: member.birthDate, relationship: member.relationship })),
  });
  if (error) {
    console.error("Funeral family update storage failed", error.code);
    return Response.json({ error: "No pudimos registrar la actualización. Intentá nuevamente o comunicate con la guardia." }, { status: error.code === "23505" ? 409 : 503 });
  }
  const row = Array.isArray(data) ? data[0] : data;
  const created = row?.created !== false;
  if (value.journeyId && value.sessionId && isJourneyId(value.journeyId) && isSessionId(value.sessionId)) {
    await recordJourneyEvent({ journeyId: value.journeyId, sessionId: value.sessionId, page: "/sepelio/actualizar-grupo-familiar", service: "funeral", eventType: created ? "form_completed" : "form_started", action: "funeral_family_update", result: created ? "stored" : "duplicate", metadata: { member_count: value.members.length, source: "sepelio_web" } });
  }
  return Response.json({ requestNumber: row?.request_number || requestNumber, stored: created, message: created ? "Recibimos tu solicitud. El equipo de Sepelio la revisará y se comunicará por el canal informado." : "Esta solicitud ya fue recibida recientemente." }, { status: created ? 201 : 200 });
}
