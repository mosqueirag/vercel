import { z } from "zod";
import { isSameOrigin, requireNewsAdmin } from "../../../../../lib/admin-auth";

const schema = z.object({ id: z.string().uuid().optional(), service: z.enum(["general", "internet", "energy", "funeral", "billing", "phone"]), channelType: z.enum(["phone", "whatsapp", "url", "address", "hours"]), label: z.string().trim().min(2).max(120), value: z.string().trim().min(2).max(500), publicValue: z.string().trim().min(2).max(500), purpose: z.string().trim().min(2).max(80), status: z.enum(["draft", "published", "archived"]), sortOrder: z.number().int().nonnegative().default(0) });
const columns = "id,service,channel_type,label,value,public_value,purpose,status,sort_order,published_at,updated_at,updated_by_email";
const values = (data: z.infer<typeof schema>, email: string) => ({ service: data.service, channel_type: data.channelType, label: data.label, value: data.value, public_value: data.publicValue, purpose: data.purpose, status: data.status, sort_order: data.sortOrder, published_at: data.status === "published" ? new Date().toISOString() : null, updated_by_email: email });

export async function GET() {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const { data, error } = await session.admin.from("public_contact_channels").select(columns).order("service").order("sort_order");
  return error ? Response.json({ error: "No pudimos cargar los contactos." }, { status: 503 }) : Response.json({ contacts: data });
}

export async function POST(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisá los datos del contacto." }, { status: 400 });
  const { data, error } = await session.admin.from("public_contact_channels").insert(values(parsed.data, session.email)).select(columns).single();
  return error ? Response.json({ error: "No pudimos guardar el contacto." }, { status: 503 }) : Response.json({ contact: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.id) return Response.json({ error: "Revisá los datos del contacto." }, { status: 400 });
  const { data, error } = await session.admin.from("public_contact_channels").update(values(parsed.data, session.email)).eq("id", parsed.data.id).select(columns).single();
  return error ? Response.json({ error: "No pudimos actualizar el contacto." }, { status: 503 }) : Response.json({ contact: data });
}
