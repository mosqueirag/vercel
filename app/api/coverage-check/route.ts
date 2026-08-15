import { NextRequest } from "next/server";
import { z } from "zod";
import { configuredCoverageMargin, normalizeStreet } from "../../../lib/coverage";
import { createSupabaseAdmin } from "../../../lib/supabase";
import { isJourneyId, isSessionId } from "../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../lib/journey/recorder";
import { consumeRateLimit } from "../../../lib/security/rate-limit";

const schema = z.object({
  street: z.string().trim().min(3).max(120),
  number: z.coerce.number().int().min(1).max(999999),
  journeyId: z.string().refine(isJourneyId).optional(),
  sessionId: z.string().refine(isSessionId).optional(),
}).refine((value) => Boolean(value.journeyId) === Boolean(value.sessionId));

type CoverageRow = { street_number: number; plan_name: string; technology: string; speed_down_mbps: number | null };

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit(request, "coverage", 20, 60);
  if (!rate.allowed) return Response.json({ error: rate.available ? "Realizaste demasiadas consultas. Esperá un minuto." : "El servicio de protección no está disponible." }, { status: rate.available ? 429 : 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ingresá una calle y una altura válidas." }, { status: 400 });

  const streetNormalized = normalizeStreet(parsed.data.street);
  if (!streetNormalized) return Response.json({ error: "No pudimos reconocer la calle." }, { status: 400 });
  const context = parsed.data.journeyId && parsed.data.sessionId ? { journeyId: parsed.data.journeyId, sessionId: parsed.data.sessionId, page: "/#contratar" } : null;
  if (context) await recordJourneyEvent({ ...context, eventType: "fiber_coverage_check", service: "fiber" });
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
  if (!rows.length) { if (context) await recordJourneyEvent({ ...context, eventType: "fiber_coverage_result", service: "fiber", result: "unknown" }); return Response.json({ status: "unknown", service: null, message: "No encontramos un plan disponible para ese domicilio. Podemos solicitar una revisión técnica." }); }

  const nearestDistance = Math.min(...rows.map((row) => Math.abs(row.street_number - parsed.data.number)));
  const nearest = rows.filter((row) => Math.abs(row.street_number - parsed.data.number) === nearestDistance);
  const service = Array.from(new Map(nearest.map((row) => [row.plan_name, { planName: row.plan_name, technology: row.technology, speedMbps: row.speed_down_mbps }])).values())[0] ?? null;
  const exact = nearestDistance === 0;
  if (context) await recordJourneyEvent({ ...context, eventType: "fiber_coverage_result", service: "fiber", result: exact ? "exact" : "probable", metadata: { distance: nearestDistance } });

  return Response.json({
    status: exact ? "exact" : "probable",
    service,
    distance: nearestDistance,
    margin,
    message: exact
      ? "Plan disponible según el padrón actualizado para este domicilio. La nueva conexión requiere validación técnica."
      : `Plan identificado en una instalación cercana, a ${nearestDistance} números de diferencia. Requiere validación técnica para este domicilio.`,
  });
}
