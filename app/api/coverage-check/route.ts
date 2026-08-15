import { NextRequest } from "next/server";
import { z } from "zod";
import { configuredCoverageMargin, normalizeStreet } from "../../../lib/coverage";
import { createSupabaseAdmin } from "../../../lib/supabase";

const schema = z.object({
  street: z.string().trim().min(3).max(120),
  number: z.coerce.number().int().min(1).max(999999),
});
const requests = new Map<string, { count: number; resetAt: number }>();

type CoverageRow = { street_number: number; plan_name: string; technology: string; speed_down_mbps: number | null };

function limited(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt < now) {
    requests.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 20;
}

export async function POST(request: NextRequest) {
  if (limited(request)) return Response.json({ error: "Realizaste demasiadas consultas. Esperá un minuto." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ingresá una calle y una altura válidas." }, { status: 400 });

  const streetNormalized = normalizeStreet(parsed.data.street);
  if (!streetNormalized) return Response.json({ error: "No pudimos reconocer la calle." }, { status: 400 });
  const supabase = createSupabaseAdmin();
  if (!supabase) return Response.json({ status: "configuration_pending", message: "La consulta de cobertura está pendiente de configuración." }, { status: 503 });

  const margin = configuredCoverageMargin();
  const { data, error } = await supabase
    .from("service_address_coverage")
    .select("street_number,plan_name,technology,speed_down_mbps")
    .eq("street_normalized", streetNormalized)
    .gte("street_number", parsed.data.number - margin)
    .lte("street_number", parsed.data.number + margin)
    .limit(100);

  if (error) {
    console.error("Coverage lookup failed", error.code);
    return Response.json({ status: "configuration_pending", message: "La base de cobertura todavía no está disponible." }, { status: 503 });
  }

  const rows = (data ?? []) as CoverageRow[];
  if (!rows.length) return Response.json({ status: "unknown", services: [], message: "No encontramos instalaciones registradas en esa calle dentro del margen consultado. Podemos solicitar una revisión técnica." });

  const nearestDistance = Math.min(...rows.map((row) => Math.abs(row.street_number - parsed.data.number)));
  const nearest = rows.filter((row) => Math.abs(row.street_number - parsed.data.number) === nearestDistance);
  const services = Array.from(new Map(nearest.map((row) => [row.plan_name, { planName: row.plan_name, technology: row.technology, speedMbps: row.speed_down_mbps }])).values());
  const exact = nearestDistance === 0;

  return Response.json({
    status: exact ? "exact" : "probable",
    services,
    distance: nearestDistance,
    margin,
    message: exact
      ? "Hay un servicio registrado en el domicilio indicado. La disponibilidad de una nueva conexión igualmente requiere validación técnica."
      : `Hay instalaciones registradas en la misma calle a una diferencia de ${nearestDistance} números. La cobertura es probable y debe confirmarse técnicamente.`,
  });
}
