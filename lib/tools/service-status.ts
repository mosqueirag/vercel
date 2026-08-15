import { createSupabaseAdmin } from "../supabase";
import { recordJourneyEvent } from "../journey/recorder";
import type { JourneyContext } from "../journey/types";

export async function getServiceStatus(service: "internet" | "energy", context: JourneyContext) {
  const started = Date.now();
  await recordJourneyEvent({ ...context, eventType: "tool_started", tool: "getServiceStatus" });
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    await recordJourneyEvent({ ...context, eventType: "tool_completed", tool: "getServiceStatus", result: "unknown", durationMs: Date.now() - started });
    return "unknown" as const;
  }
  const { data, error } = await supabase.from("service_alerts").select("status").eq("service", service).eq("published", true).or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`).limit(1).maybeSingle();
  const status = !error && data && ["maintenance", "partial", "outage"].includes(data.status) ? "incident" : "unknown";
  await recordJourneyEvent({ ...context, eventType: error ? "tool_failed" : "tool_completed", tool: "getServiceStatus", result: status, durationMs: Date.now() - started });
  return status;
}
