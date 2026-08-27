import { z } from "zod";
import { isSameOrigin, requireNewsAdmin } from "../../../../../lib/admin-auth";
import { funeralRequestStatuses, maskDni, maskPhone } from "../../../../../lib/funeral-family-update";

const statusSchema = z.object({ id: z.string().uuid(), status: z.enum(funeralRequestStatuses) });
const listColumns = "id,request_number,member_number,holder_full_name,holder_dni,phone,status,created_at";
const detailColumns = "id,request_number,member_number,holder_full_name,holder_dni,phone,email,status,consent,source,created_at,updated_at";

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
  const { data, error } = await session.admin.from("funeral_family_update_requests").select(listColumns).order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: "No pudimos cargar las solicitudes." }, { status: 503 });
  const requests = (data || []).map((row) => ({ id: row.id, requestNumber: row.request_number, memberNumber: row.member_number, holderName: row.holder_full_name, dni: maskDni(row.holder_dni), phone: maskPhone(row.phone), status: row.status, createdAt: row.created_at }));
  return Response.json({ requests });
}

export async function PATCH(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Estado inválido." }, { status: 400 });
  const { data: previous, error: previousError } = await session.admin.from("funeral_family_update_requests").select("status").eq("id", parsed.data.id).maybeSingle();
  if (previousError || !previous) return Response.json({ error: "No encontramos la solicitud." }, { status: 404 });
  if (previous.status === parsed.data.status) return Response.json({ unchanged: true, status: previous.status });
  const { error } = await session.admin.from("funeral_family_update_requests").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) return Response.json({ error: "No pudimos actualizar la solicitud." }, { status: 503 });
  const audit = await session.admin.from("funeral_family_update_audit").insert({ request_id: parsed.data.id, action: "status_changed", old_status: previous.status, new_status: parsed.data.status, actor_email: session.email });
  if (audit.error) return Response.json({ error: "La solicitud fue actualizada, pero no pudimos registrar la auditoría." }, { status: 503 });
  return Response.json({ status: parsed.data.status });
}
