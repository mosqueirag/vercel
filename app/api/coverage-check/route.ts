import { NextRequest } from "next/server";
import { z } from "zod";
import { configuredCoverageMargin, normalizeStreet } from "../../../lib/coverage";
import { coverageAnalytics, hasExactCoverage, resolveCoverageFromRecords, resolveCoverageWithPriority, type PublishedPlan, type ZoneMatch } from "../../../lib/coverage-resolver";
import type { CoverageRecord } from "../../../lib/coverage-results";
import { geocodeSarmientoAddressWithSource } from "../../../lib/georef";
import { isJourneyId, isSessionId } from "../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../lib/journey/recorder";
import { consumeRateLimit } from "../../../lib/security/rate-limit";
import { createSupabaseAdmin } from "../../../lib/supabase";

const schema = z.object({
  street: z.string().trim().min(3).max(120),
  number: z.coerce.number().int().min(1).max(999999),
  journeyId: z.string().refine(isJourneyId).optional(),
  sessionId: z.string().refine(isSessionId).optional(),
}).refine((value) => Boolean(value.journeyId) === Boolean(value.sessionId));

const unknown = { coverageStatus: "unknown" as const, coverageSource: "unknown" as const, confidence: "unknown" as const, technologies: [], commercialAvailability: false, plans: [], nextAction: "fiber_waitlist" as const, zoneMatch: false, message: "No encontramos cobertura confirmada para este domicilio. Podés solicitar que te avisemos cuando exista información oficial." };

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
  const [{ data: addressRows, error: addressError }, { data: planRows, error: planError }] = await Promise.all([
    supabase.from("service_address_coverage").select("street_number,plan_name,technology,coverage_status").eq("street_normalized", streetNormalized).gte("street_number", parsed.data.number - margin).lte("street_number", parsed.data.number + margin).limit(100),
    supabase.from("internet_plans").select("id,name,slug,technology,speed_down_mbps,speed_up_mbps,price_amount,currency,status,published_at").eq("status", "published").is("deleted_at", null).lte("published_at", new Date().toISOString()),
  ]);
  if (addressError || planError) {
    console.error("Coverage lookup failed", addressError?.code ?? planError?.code);
    return Response.json({ status: "configuration_pending", message: "La base de cobertura todavía no está disponible." }, { status: 503 });
  }

  const plans = (planRows ?? []) as PublishedPlan[];
  const records = (addressRows ?? []) as CoverageRecord[];
  let resolution = hasExactCoverage(records, parsed.data.number)
    ? resolveCoverageFromRecords(records, parsed.data.number, plans)
    : null;

  // Exact address data is authoritative. Nearby records are held until after
  // zone resolution, so a close-by row cannot mask official geographic coverage.
  let geocoderSource: "georef" | "geoapify" | "none" = "none";
  if (!resolution) {
    const geocoded = await geocodeSarmientoAddressWithSource(parsed.data.street, parsed.data.number);
    if (geocoded) {
      geocoderSource = geocoded.source;
      const { data: zones, error: zoneError } = await supabase.rpc("resolve_coverage_zones", { p_longitude: geocoded.longitude, p_latitude: geocoded.latitude });
      if (zoneError) console.error("Coverage zone lookup failed", zoneError.code);
      else resolution = resolveCoverageWithPriority(records, parsed.data.number, plans, (zones ?? []) as ZoneMatch[]);
    }
  }
  resolution ??= resolveCoverageFromRecords(records, parsed.data.number, plans);
  resolution ??= unknown;
  if (context) await recordJourneyEvent({ ...context, eventType: "fiber_coverage_result", service: "fiber", result: resolution.coverageStatus, metadata: { ...coverageAnalytics(resolution), geocoder_source: geocoderSource } });

  return Response.json({ ...resolution, technology: resolution.technologies[0] ?? null });
}
