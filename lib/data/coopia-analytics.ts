import { requireNewsAdmin } from "../admin-auth";

export type CoopiaPeriod = "today" | "7d" | "30d";
type EventRow = { created_at: string; session_id: string; event_type: string; intent: string | null; service: string | null; action: string | null; result: string | null; metadata: Record<string, unknown> | null; duration_ms: number | null };

export type CoopiaAnalytics = {
  available: boolean;
  period: CoopiaPeriod;
  totals: { sessions: number; messages: number; handoffs: number; unresolved: number; feedbackPositive: number; feedbackNegative: number; averageResponseMs: number | null };
  intents: Array<{ label: string; count: number }>;
  services: Array<{ label: string; count: number }>;
  recent: Array<{ event: string; at: string; result: string | null }>;
  commercialRequests: number | null;
};

export function coopiaPeriodStart(period: CoopiaPeriod, now = new Date()) {
  const start = new Date(now);
  if (period === "today") start.setHours(0, 0, 0, 0);
  else start.setDate(start.getDate() - (period === "7d" ? 7 : 30));
  return start.toISOString();
}

function countBy(values: Array<string | null | undefined>) {
  return Object.entries(values.filter((value): value is string => Boolean(value)).reduce<Record<string, number>>((acc, value) => ({ ...acc, [value]: (acc[value] || 0) + 1 }), {})).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 6);
}

export function aggregateCoopiaEvents(rows: EventRow[], period: CoopiaPeriod, commercialRequests: number | null): CoopiaAnalytics {
  const responseTimes = rows.filter((row) => row.event_type === "coopia_result" && typeof row.duration_ms === "number").map((row) => row.duration_ms as number);
  const feedback = rows.filter((row) => row.event_type === "coopia_feedback");
  const messages = rows.filter((row) => ["coopia_message_sent", "coopia_question", "assistant_question_sent"].includes(row.event_type));
  return {
    available: true, period,
    totals: {
      sessions: new Set(rows.map((row) => row.session_id)).size,
      messages: messages.length,
      handoffs: rows.filter((row) => ["coopia_handoff", "human_handoff_opened", "complaint_whatsapp_opened"].includes(row.event_type)).length,
      unresolved: rows.filter((row) => row.event_type === "coopia_unresolved").length,
      feedbackPositive: feedback.filter((row) => row.metadata?.helpful === true).length,
      feedbackNegative: feedback.filter((row) => row.metadata?.helpful === false).length,
      averageResponseMs: responseTimes.length ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length) : null,
    },
    intents: countBy(rows.filter((row) => ["coopia_intent_detected", "intent_detected"].includes(row.event_type)).map((row) => row.result || row.intent)),
    services: countBy(rows.filter((row) => row.event_type === "coopia_service_detected").map((row) => row.result || row.service)),
    recent: rows.filter((row) => row.event_type.startsWith("coopia_")).slice(0, 10).map((row) => ({ event: row.event_type.replace(/^coopia_/, "").replaceAll("_", " "), at: row.created_at, result: row.result })),
    commercialRequests,
  };
}

export async function getCoopiaAnalytics(period: CoopiaPeriod): Promise<CoopiaAnalytics> {
  const session = await requireNewsAdmin();
  if (!session) return { ...aggregateCoopiaEvents([], period, null), available: false };
  const from = coopiaPeriodStart(period);
  const [eventsResponse, requestsResponse] = await Promise.all([
    session.admin.from("journey_events").select("created_at,session_id,event_type,intent,service,action,result,metadata,duration_ms").gte("created_at", from).order("created_at", { ascending: false }).limit(500),
    session.admin.from("internet_requests").select("id", { count: "exact", head: true }).gte("created_at", from),
  ]);
  if (eventsResponse.error) return { ...aggregateCoopiaEvents([], period, null), available: false };
  return aggregateCoopiaEvents((eventsResponse.data || []) as EventRow[], period, requestsResponse.error ? null : requestsResponse.count || 0);
}
