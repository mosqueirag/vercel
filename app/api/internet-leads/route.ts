import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "../../../lib/supabase";

const schema = z.object({
  customerType: z.enum(["hogar", "comercio", "empresa"]), name: z.string().trim().min(3).max(100),
  phone: z.string().trim().min(8).max(30), email: z.string().email().max(150), address: z.string().trim().min(5).max(180),
  zone: z.string().trim().min(2).max(100), plan: z.string().trim().max(80), preferredTime: z.string().trim().max(80),
  consent: z.literal(true), source: z.string().max(40).default("web"),
});
const recent = new Map<string, number>();

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisá los campos obligatorios." }, { status: 400 });
  const fingerprint = `${parsed.data.email.toLowerCase()}|${parsed.data.phone}`;
  if ((recent.get(fingerprint) || 0) > Date.now() - 5 * 60_000) return Response.json({ error: "Esta solicitud ya fue recibida recientemente." }, { status: 409 });

  const requestNumber = `NET-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const supabase = createSupabaseAdmin();
  if (!supabase) return Response.json({ requestNumber, stored: false, message: "La solicitud fue validada, pero el canal de registro está pendiente de configuración." }, { status: 202 });

  const { error } = await supabase.from("internet_requests").insert({ request_number: requestNumber, customer_type: parsed.data.customerType, full_name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email, address: parsed.data.address, zone: parsed.data.zone, selected_plan: parsed.data.plan, preferred_contact_time: parsed.data.preferredTime, consent: parsed.data.consent, source: parsed.data.source });
  if (error) { console.error("Internet request storage failed", error.code); return Response.json({ error: "No pudimos registrar la solicitud. Intentá por WhatsApp." }, { status: 503 }); }
  recent.set(fingerprint, Date.now());
  if (process.env.N8N_WEBHOOK_URL && process.env.N8N_WEBHOOK_SECRET) fetch(process.env.N8N_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", "x-coopsar-secret": process.env.N8N_WEBHOOK_SECRET }, body: JSON.stringify({ event: "internet_request.created", requestNumber }) }).catch(() => console.error("n8n webhook unavailable"));
  return Response.json({ requestNumber, stored: true, message: "Recibimos tu solicitud. El equipo comercial verificará cobertura y se comunicará con vos." }, { status: 201 });
}
