import { z } from "zod";
import { requireNewsAdmin } from "../../../../lib/admin-auth";
import { aggregateFiberDemand, commercialStatuses, type CommercialLead } from "../../../../lib/commercial-inbox";
import { createJourneyId, createSessionId } from "../../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../../lib/journey/recorder";

const requestTypes = ["installation", "coverage_validation", "fiber_waitlist"] as const;
const writeSchema = z.object({ id: z.string().uuid(), status: z.enum(commercialStatuses) });
const eventSchema = z.object({ id: z.string().uuid(), action: z.enum(["view", "contact_opened"]) });
const columns = "id,created_at,request_type,status,full_name,phone,email,address,street,zone,coverage_status,selected_plan,journey_id,consent,marketing_opt_in";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

function eventContext(eventType: "commercial_inbox_viewed" | "lead_viewed" | "lead_contact_opened" | "lead_status_changed" | "fiber_demand_viewed", metadata: Record<string, string>) {
  return {
    journeyId: createJourneyId(), sessionId: createSessionId(), page: "/admin/comercial", eventType, agent: "coopia",
    intent: "internet_signup" as const, service: "internet" as const, metadata,
  };
}

function toLead(row: Record<string, unknown>): CommercialLead {
  return {
    id: String(row.id), createdAt: String(row.created_at), requestType: row.request_type as CommercialLead["requestType"], status: row.status as CommercialLead["status"],
    fullName: String(row.full_name), phone: String(row.phone), email: typeof row.email === "string" ? row.email : null,
    address: String(row.address), street: typeof row.street === "string" ? row.street : null, zone: String(row.zone || ""),
    coverageStatus: typeof row.coverage_status === "string" ? row.coverage_status : null, selectedPlan: typeof row.selected_plan === "string" ? row.selected_plan : null,
    journeyId: typeof row.journey_id === "string" ? row.journey_id : null, contactConsent: row.consent === true, marketingOptIn: row.marketing_opt_in === true,
  };
}

export async function GET(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const status = params.get("status");
  if (type && !requestTypes.includes(type as (typeof requestTypes)[number])) return Response.json({ error: "Filtro inválido." }, { status: 400 });
  if (status && !commercialStatuses.includes(status as (typeof commercialStatuses)[number])) return Response.json({ error: "Filtro inválido." }, { status: 400 });

  let query = session.admin.from("internet_requests").select(columns, { count: "exact" }).order("created_at", { ascending: false }).limit(100);
  if (type) query = query.eq("request_type", type);
  if (status) query = query.eq("status", status);
  const [{ data, error, count }, { data: waitlist, error: demandError }] = await Promise.all([
    query,
    session.admin.from("internet_requests").select("street,zone").eq("request_type", "fiber_waitlist").limit(1000),
  ]);
  if (error || demandError) return Response.json({ error: "No pudimos cargar las oportunidades." }, { status: 503 });
  const leads = (data || []).map((row) => toLead(row as Record<string, unknown>));
  const demand = aggregateFiberDemand((waitlist || []).map((row) => ({ street: row.street, zone: row.zone || "" })));
  const summary = {
    total: count || 0,
    new: leads.filter((lead) => lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    waitingCoverage: leads.filter((lead) => lead.status === "waiting_coverage").length,
  };
  await recordJourneyEvent(eventContext("commercial_inbox_viewed", { type: type || "all", status: status || "all" }));
  if (waitlist?.length) await recordJourneyEvent(eventContext("fiber_demand_viewed", { groups: String(demand.length) }));
  return Response.json({ leads, demand, summary });
}

export async function PATCH(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = writeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Estado inválido." }, { status: 400 });
  const { data, error } = await session.admin.from("internet_requests").update({ status: parsed.data.status }).eq("id", parsed.data.id).select(columns).single();
  if (error || !data) return Response.json({ error: "No pudimos actualizar la oportunidad." }, { status: 503 });
  await recordJourneyEvent(eventContext("lead_status_changed", { status: parsed.data.status }));
  return Response.json({ lead: toLead(data as Record<string, unknown>) });
}

export async function POST(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Acción inválida." }, { status: 400 });
  const { data, error } = await session.admin.from("internet_requests").select("request_type").eq("id", parsed.data.id).maybeSingle();
  if (error || !data) return Response.json({ error: "No encontramos la oportunidad." }, { status: 404 });
  await recordJourneyEvent(eventContext(parsed.data.action === "view" ? "lead_viewed" : "lead_contact_opened", { requestType: data.request_type }));
  return new Response(null, { status: 204 });
}
