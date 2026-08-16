import { createSupabaseAdmin } from "../supabase";
import type { JourneyContext, JourneyEvent } from "./types";

export async function ensureJourney(context: JourneyContext) {
  try {
    const supabase = createSupabaseAdmin();
    if (!supabase) return false;
    const now = new Date().toISOString();
    const { error } = await supabase.from("user_journeys").upsert({
      journey_id: context.journeyId,
      session_id: context.sessionId,
      entry_page: context.page || "/",
      primary_intent: context.intent || null,
      last_activity_at: now,
      updated_at: now,
    }, { onConflict: "journey_id" });
    if (error) console.error("Journey storage failed", error.code);
    return !error;
  } catch {
    console.error("Journey storage unavailable");
    return false;
  }
}

export async function recordJourneyEvent(event: JourneyEvent) {
  try {
    const supabase = createSupabaseAdmin();
    if (!supabase) return false;
    await ensureJourney(event);
    const { error } = await supabase.from("journey_events").insert({
      journey_id: event.journeyId,
      session_id: event.sessionId,
      event_type: event.eventType,
      page: event.page || null,
      intent: event.intent || null,
      service: event.service || null,
      agent: event.agent || null,
      tool: event.tool || null,
      action: event.action || null,
      result: event.result || null,
      metadata: event.metadata || {},
      duration_ms: event.durationMs ?? null,
    });
    if (error) console.error("Journey event storage failed", error.code);
    return !error;
  } catch {
    // Analytics must never block a valid assisted or commercial operation.
    console.error("Journey event storage unavailable");
    return false;
  }
}
