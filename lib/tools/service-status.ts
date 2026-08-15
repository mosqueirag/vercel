import { createSupabaseAdmin } from "../supabase";
import { recordJourneyEvent } from "../journey/recorder";
import type { JourneyContext } from "../journey/types";
export type PublicServiceStatus = "outage" | "partial" | "maintenance" | "operational" | "unknown";
type Alert = { status: string; published?: boolean; published_at?: string | null; starts_at?: string | null; ends_at?: string | null };
const priority: Record<string, number> = { outage: 5, partial: 4, maintenance: 3, operational: 2, unknown: 1 };
export function selectActiveServiceStatus(alerts: Alert[], now = new Date()): PublicServiceStatus {
  const time = now.getTime();
  const active = alerts.filter((a) => a.published !== false && (!a.published_at || Date.parse(a.published_at) <= time) && (!a.starts_at || Date.parse(a.starts_at) <= time) && (!a.ends_at || Date.parse(a.ends_at) > time) && a.status in priority);
  return (active.sort((a, b) => priority[b.status] - priority[a.status])[0]?.status || "unknown") as PublicServiceStatus;
}
async function queryServiceStatus(service: string) {
  const supabase = createSupabaseAdmin(); if (!supabase) return { status: "unknown" as const, error: true };
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("service_alerts").select("status,published,published_at,starts_at,ends_at").eq("service", service).eq("published", true).lte("published_at", now).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gt.${now}`);
  return error ? { status: "unknown" as const, error: true } : { status: selectActiveServiceStatus(data ?? []), error: false };
}
export async function getPublicServiceStatuses() {
  const values = [["Energía", "energy"], ["Internet", "internet"], ["Fibra óptica", "fiber"], ["Telefonía", "phone"], ["Oficina Virtual", "virtual_office"]] as const;
  return Promise.all(values.map(async ([name, key]) => { const { status } = await queryServiceStatus(key); return { name, status, detail: status === "unknown" ? "Sin información operativa confirmada" : "Estado publicado por COOPSAR" }; }));
}
export async function getServiceStatus(service: "internet" | "energy", context: JourneyContext) {
  const started = Date.now(); await recordJourneyEvent({ ...context, eventType: "tool_started", tool: "getServiceStatus" });
  const result = await queryServiceStatus(service);
  await recordJourneyEvent({ ...context, eventType: result.error ? "tool_failed" : "tool_completed", tool: "getServiceStatus", result: result.status, durationMs: Date.now() - started });
  return result.status;
}
