import { createSupabaseAdmin } from "../supabase";

export type PublicServiceStatus = "outage" | "partial" | "maintenance" | "operational" | "unknown";
export type PublicServiceAlert = {
  title: string;
  detail: string | null;
  status: PublicServiceStatus;
  publishedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
};
export type PublishedEnergyAlertsResult = { alerts: PublicServiceAlert[]; error: boolean };

type AlertRow = { status: string; title?: string | null; detail?: string | null; published?: boolean; published_at?: string | null; starts_at?: string | null; ends_at?: string | null };
const priority: Record<PublicServiceStatus, number> = { outage: 5, partial: 4, maintenance: 3, operational: 2, unknown: 1 };

function isStatus(value: string): value is PublicServiceStatus { return value in priority; }
function isActive(alert: AlertRow, now: Date) {
  const time = now.getTime();
  return alert.published !== false && (!alert.published_at || Date.parse(alert.published_at) <= time) && (!alert.starts_at || Date.parse(alert.starts_at) <= time) && (!alert.ends_at || Date.parse(alert.ends_at) > time) && isStatus(alert.status);
}
function mapAlert(alert: AlertRow): PublicServiceAlert {
  return { title: alert.title?.trim() || "Información operativa publicada", detail: alert.detail?.trim() || null, status: alert.status as PublicServiceStatus, publishedAt: alert.published_at ?? null, startsAt: alert.starts_at ?? null, endsAt: alert.ends_at ?? null };
}

export function toPublishedEnergyAlertsResult(data: AlertRow[] | null | undefined, error: unknown): PublishedEnergyAlertsResult {
  return error ? { alerts: [], error: true } : { alerts: (data ?? []).filter((alert) => isStatus(alert.status)).map(mapAlert), error: false };
}

export function selectActiveServiceAlert(alerts: AlertRow[], now = new Date()): PublicServiceAlert | null {
  const selected = alerts.filter((alert) => isActive(alert, now)).sort((a, b) => priority[b.status as PublicServiceStatus] - priority[a.status as PublicServiceStatus])[0];
  return selected ? mapAlert(selected) : null;
}

export function selectActiveServiceStatus(alerts: AlertRow[], now = new Date()): PublicServiceStatus {
  return selectActiveServiceAlert(alerts, now)?.status ?? "unknown";
}

/** Public read model. It deliberately performs no journey or tool analytics. */
export async function getPublicServiceStatus(service: string) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return { status: "unknown" as const, alert: null, error: true };
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("service_alerts")
    .select("title,detail,status,published,published_at,starts_at,ends_at")
    .eq("service", service).eq("published", true).lte("published_at", now)
    .or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gt.${now}`);
  if (error) return { status: "unknown" as const, alert: null, error: true };
  const alert = selectActiveServiceAlert(data ?? []);
  return { status: alert?.status ?? "unknown", alert, error: false };
}

/** Lists only published, non-expired maintenance notices; an outage is not a scheduled cut. */
export async function getPublishedEnergyAlerts() {
  const supabase = createSupabaseAdmin();
  if (!supabase) return { alerts: [], error: true } satisfies PublishedEnergyAlertsResult;
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("service_alerts")
    .select("title,detail,status,published,published_at,starts_at,ends_at")
    .eq("service", "energy").eq("published", true).lte("published_at", now)
    .eq("status", "maintenance").not("starts_at", "is", null)
    .or(`ends_at.is.null,ends_at.gt.${now}`).order("starts_at", { ascending: true });
  return toPublishedEnergyAlertsResult(data, error);
}
