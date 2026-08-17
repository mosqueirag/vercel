import { z } from "zod";
import { isSameOrigin, requireNewsAdmin } from "../../../../lib/admin-auth";

const patchSchema = z.object({ id: z.number().int().positive(), coverageStatus: z.enum(["available", "nearby", "planned", "unavailable", "unknown"]), technology: z.string().trim().min(1).max(100), source: z.enum(["manual_admin", "csv_import", "network_export", "verified_internal"]), verifiedAt: z.string().datetime().nullable() });

export async function GET(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("street")?.trim().toUpperCase();
  let builder = session.admin.from("service_address_coverage").select("id,street_normalized,street_number,plan_name,technology,coverage_status,source,verified_at,updated_at").order("street_normalized").order("street_number").limit(100);
  if (query) builder = builder.ilike("street_normalized", `%${query}%`);
  const { data, error } = await builder;
  return error ? Response.json({ error: "No pudimos cargar cobertura." }, { status: 503 }) : Response.json({ coverage: data });
}

export async function PATCH(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisá los datos de cobertura." }, { status: 400 });
  const { id, coverageStatus, technology, source, verifiedAt } = parsed.data;
  const { data, error } = await session.admin.from("service_address_coverage").update({ coverage_status: coverageStatus, technology, source, verified_at: verifiedAt }).eq("id", id).select("id,street_normalized,street_number,plan_name,technology,coverage_status,source,verified_at").single();
  return error ? Response.json({ error: "No pudimos actualizar cobertura." }, { status: 503 }) : Response.json({ coverage: data });
}
