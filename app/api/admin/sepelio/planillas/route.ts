import { z } from "zod";
import { isSameOrigin, requireNewsAdmin } from "../../../../../lib/admin-auth";
import { funeralRequestStatuses, maskDni, maskPhone } from "../../../../../lib/funeral-family-update";

const statusSchema = z.object({ id: z.string().uuid(), status: z.enum(funeralRequestStatuses) });
const listColumns = "id,request_number,member_number,holder_full_name,holder_dni,phone,status,created_at";
const detailColumns = "id,request_number,member_number,holder_full_name,holder_dni,phone,email,status,consent,source,created_at,updated_at";

function safeSearch(value: string | null) {
  return (value || "").trim().replace(/[%,()]/g, "").slice(0, 80);
}

export async function GET(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const { data: requestRow, error } = await session.admin.from("funeral_family_update_requests").select(detailColumns).eq("id", id).maybeSingle();
    if (error) return Response.json({ error: "No pudimos cargar la solicitud." }, { status: 503 });
    if (!requestRow) return Response.json({ error: "No encontramos la solicitud." }, { status: 404 });
    const [{ data: members, error: membersError }, { data: audit, error: auditError }] = await Promise.all([
      session.admin.from("funeral_family_update_members").select("id,full_name,dni,birth_date,relationship").eq("request_id", id).order("created_at"),
      session.admin.from("funeral_family_update_audit").select("id,action,old_status,new_status,actor_email,created_at").eq("request_id", id).order("created_at", { ascending: false }),
    ]);
    if (membersError || auditError) return Response.json({ error: "No pudimos cargar el detalle de la solicitud." }, { status: 503 });
    return Response.json({ request: requestRow, members: members || [], audit: audit || [] });
  }
  const status = new URL(request.url).searchParams.get("status");
  const search = safeSearch(new URL(request.url).searchParams.get("q"));
  let query = session.admin.from("funeral_family_update_requests").select(listColumns).order("created_at", { ascending: false }).limit(100);
  if (status && funeralRequestStatuses.includes(status as typeof funeralRequestStatuses[number])) query = query.eq("status", status);
  if (search) query = query.or(`request_number.ilike.%${search}%,holder_full_name.ilike.%${search}%,member_number.ilike.%${search}%`);
  const [{ data, error }, { count: total, error: totalError }, { count: newCount, error: newError }, { count: reviewCount, error: reviewError }] = await Promise.all([
    query,
    session.admin.from("funeral_family_update_requests").select("id", { count: "exact", head: true }),
    session.admin.from("funeral_family_update_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    session.admin.from("funeral_family_update_requests").select("id", { count: "exact", head: true }).eq("status", "in_review"),
  ]);
  if (error || totalError || newError || reviewError) return Response.json({ error: "No pudimos cargar las solicitudes." }, { status: 503 });
  const requests = (data || []).map((row) => ({ id: row.id, requestNumber: row.request_number, memberNumber: row.member_number, holderName: row.holder_full_name, dni: maskDni(row.holder_dni), phone: maskPhone(row.phone), status: row.status, createdAt: row.created_at }));
  return Response.json({ requests, metrics: { total: total || 0, new: newCount || 0, inReview: reviewCount || 0 } });
}

export async function PATCH(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Estado inválido." }, { status: 400 });
  const { data, error } = await session.admin.rpc("update_funeral_family_request_status", { p_request_id: parsed.data.id, p_new_status: parsed.data.status, p_actor_email: session.email });
  if (error) {
    if (error.code === "P0002") return Response.json({ error: "No encontramos la solicitud." }, { status: 404 });
    return Response.json({ error: "No pudimos actualizar la solicitud." }, { status: 503 });
  }
  const result = Array.isArray(data) ? data[0] : data;
  return Response.json({ status: result?.status || parsed.data.status, unchanged: result?.unchanged === true });
}
