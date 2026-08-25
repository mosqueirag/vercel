import { z } from "zod";
import { isSameOrigin, requireNewsAdmin } from "../../../../../lib/admin-auth";
import { canEditPlan, canPublishInternetPlan, normalizePlanBenefits, type InternetPlanStatus } from "../../../../../lib/internet/plan-governance";

const planSchema = z.object({
  id: z.string().uuid().optional(), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120), name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).nullable().optional(), audience: z.enum(["home", "business", "enterprise", "all"]).nullable(), technology: z.string().trim().max(100).nullable().optional(),
  speedDownMbps: z.number().int().positive().nullable().optional(), speedUpMbps: z.number().int().positive().nullable().optional(), priceAmount: z.number().nonnegative().nullable().optional(), currency: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
  installationPrice: z.number().nonnegative().nullable().optional(), installationNotes: z.string().trim().max(1000).nullable().optional(), benefits: z.array(z.string().trim().min(1).max(160)).max(20), conditions: z.string().trim().max(2000).nullable().optional(), sortOrder: z.number().int().nonnegative().default(0),
}).refine((value) => (value.priceAmount === null) === (value.currency === null), { message: "currency" });

const actionSchema = z.object({ action: z.enum(["save", "publish", "archive"]), plan: planSchema });
const columns = "id,slug,name,description,audience,technology,speed_down_mbps,speed_up_mbps,price_amount,currency,installation_price,installation_notes,benefits,conditions,status,sort_order,published_at,updated_at";
const values = (data: z.infer<typeof planSchema>) => ({
  slug: data.slug, name: data.name, description: data.description || null, audience: data.audience, technology: data.technology || null,
  speed_down_mbps: data.speedDownMbps ?? null, speed_up_mbps: data.speedUpMbps ?? null, price_amount: data.priceAmount ?? null, currency: data.currency ?? null,
  installation_price: data.installationPrice ?? null, installation_notes: data.installationNotes || null, benefits: normalizePlanBenefits(data.benefits), conditions: data.conditions || null, sort_order: data.sortOrder,
});

async function audit(session: NonNullable<Awaited<ReturnType<typeof requireNewsAdmin>>>, planId: string, action: "created" | "updated" | "published" | "archived") {
  const { error } = await session.admin.from("internet_plan_admin_audit").insert({ plan_id: planId, action, actor_email: session.email });
  if (error) console.warn("Internet plan audit was not recorded", { action, code: error.code });
  return !error;
}

export async function GET() {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const { data, error } = await session.admin.from("internet_plans").select(columns).order("sort_order").order("updated_at", { ascending: false });
  return error ? Response.json({ error: "No pudimos cargar los planes." }, { status: 503 }) : Response.json({ plans: data });
}

export async function POST(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = planSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisá los datos del plan." }, { status: 400 });
  const { data, error } = await session.admin.from("internet_plans").insert({ ...values(parsed.data), status: "draft", published_at: null }).select(columns).single();
  if (error || !data) return Response.json({ error: "No pudimos guardar el borrador." }, { status: 503 });
  return Response.json({ plan: data, auditRecorded: await audit(session, data.id, "created") }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.plan.id) return Response.json({ error: "Revisá los datos del plan." }, { status: 400 });
  const { plan, action } = parsed.data;
  const { data: current, error: currentError } = await session.admin.from("internet_plans").select("id,status").eq("id", plan.id).maybeSingle();
  if (currentError || !current) return Response.json({ error: "No encontramos el plan." }, { status: 404 });
  const status = current.status as InternetPlanStatus;
  if (action === "save") {
    if (!canEditPlan(status)) return Response.json({ error: "Los planes publicados o archivados no se editan en vivo. Prepará un borrador para una nueva revisión." }, { status: 409 });
    const { data, error } = await session.admin.from("internet_plans").update(values(plan)).eq("id", plan.id).eq("status", "draft").select(columns).single();
    if (error || !data) return Response.json({ error: "No pudimos actualizar el borrador." }, { status: 503 });
    return Response.json({ plan: data, auditRecorded: await audit(session, data.id, "updated") });
  }
  if (action === "publish") {
    if (status !== "draft") return Response.json({ error: "Solo un borrador puede publicarse explícitamente." }, { status: 409 });
    if (!canPublishInternetPlan({ name: plan.name, audience: plan.audience, technology: plan.technology ?? null, priceAmount: plan.priceAmount ?? null, currency: plan.currency ?? null })) return Response.json({ error: "Completá nombre, segmento y una tecnología comercial válida (FTTH o Internet inalámbrico) antes de publicar. El precio puede quedar pendiente." }, { status: 400 });
    const { data, error } = await session.admin.from("internet_plans").update({ ...values(plan), status: "published", published_at: new Date().toISOString() }).eq("id", plan.id).eq("status", "draft").select(columns).single();
    if (error || !data) return Response.json({ error: "No pudimos publicar el plan." }, { status: 503 });
    return Response.json({ plan: data, auditRecorded: await audit(session, data.id, "published") });
  }
  if (status === "archived") return Response.json({ plan: current, unchanged: true });
  const { data, error } = await session.admin.from("internet_plans").update({ status: "archived", published_at: null }).eq("id", plan.id).neq("status", "archived").select(columns).single();
  if (error || !data) return Response.json({ error: "No pudimos archivar el plan." }, { status: 503 });
  return Response.json({ plan: data, auditRecorded: await audit(session, data.id, "archived") });
}
