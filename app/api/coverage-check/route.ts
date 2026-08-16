import { NextRequest } from "next/server";
import { z } from "zod";
import { configuredCoverageMargin, normalizeStreet } from "../../../lib/coverage";
import { createSupabaseAdmin } from "../../../lib/supabase";
import { isJourneyId, isSessionId } from "../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../lib/journey/recorder";
import { consumeRateLimit } from "../../../lib/security/rate-limit";
import { selectCoverage } from "../../../lib/coverage-results";

const schema = z.object({
  street: z.string().trim().min(3).max(120),
  number: z.coerce.number().int().min(1).max(999999),
  journeyId: z.string().refine(isJourneyId).optional(),
  sessionId: z.string().refine(isSessionId).optional(),
}).refine((value) => Boolean(value.journeyId) === Boolean(value.sessionId));

type CoverageRow = { street_number: number; plan_name: string | null; technology: string; speed_down_mbps: number | null; coverage_status: "available" | "nearby" | "planned" | "unavailable" | "unknown" };
type PlanRow = { id: string; name: string; slug: string; technology: string | null; speed_down_mbps: number | null; speed_up_mbps: number | null; price_amount: number | null; currency: string | null };

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
    .select("street_number,plan_name,technology,speed_down_mbps,coverage_status")
    .eq("street_normalized", streetNormalized)
    .gte("street_number", parsed.data.number - margin)
    .lte("street_number", parsed.data.number + margin)
    .limit(100);

  if (error) {
    console.error("Coverage lookup failed", error.code);
    return Response.json({ status: "configuration_pending", message: "La base de cobertura todavía no está disponible." }, { status: 503 });
  }

  const rows = (data ?? []) as CoverageRow[];
  if (!rows.length) { if (context) await recordJourneyEvent({ ...context, eventType: "fiber_coverage_result", service: "fiber", result: "unknown" }); return Response.json({ coverageStatus: "unknown", technology: null, commercialAvailability: false, plans: [], nextAction: "fiber_waitlist", message: "No encontramos cobertura confirmada para este domicilio. Podés solicitar que te avisemos cuando exista información oficial." }); }

  const selection = selectCoverage(rows, parsed.data.number);
  const nearestDistance = selection.distance!;
  const nearest = selection.nearest;
  const coverageStatus = selection.status;
  const technology = nearest[0]?.technology ?? null;
  const { data: publishedPlans } = await supabase.from("internet_plans").select("id,name,slug,technology,speed_down_mbps,speed_up_mbps,price_amount,currency").eq("status", "published").lte("published_at", new Date().toISOString());
  const plans = ((publishedPlans ?? []) as PlanRow[]).filter((plan) => plan.name === nearest[0]?.plan_name || (plan.technology && plan.technology === technology));
  const commercialAvailability = coverageStatus === "available" && plans.length > 0;
  if (context) await recordJourneyEvent({ ...context, eventType: "fiber_coverage_result", service: "fiber", result: coverageStatus, metadata: { distance: nearestDistance } });

  return Response.json({
    coverageStatus, technology, commercialAvailability, plans: plans.map((plan) => ({ ...plan, price_amount: plan.price_amount, speed_down_mbps: plan.speed_down_mbps, speed_up_mbps: plan.speed_up_mbps })), nextAction: commercialAvailability ? "show_plans" : coverageStatus === "nearby" ? "coverage_validation" : "fiber_waitlist",
    message: coverageStatus === "available" && commercialAvailability ? "Tenemos disponibilidad en tu domicilio. Podés revisar los planes compatibles." : coverageStatus === "nearby" ? "Tu domicilio requiere validación técnica. No podemos confirmar cobertura todavía." : "Actualmente no tenemos fibra confirmada para este domicilio. Podés pedir que te avisemos cuando haya información oficial.",
  });
}
