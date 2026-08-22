import { requireNewsAdmin } from "../admin-auth";
import { coopiaPulseLabel } from "../coopia/presentation-labels";

export type CoopiaPeriod = "today" | "7d" | "30d";
export type CoopiaOutcome = "resolved" | "information_provided" | "action_completed" | "conversion" | "handoff" | "abandoned" | "unresolved" | "error";
export type EventRow = { created_at: string; session_id: string; event_type: string; intent: string | null; service: string | null; action: string | null; result: string | null; metadata: Record<string, unknown> | null; duration_ms: number | null };
export type CountItem = { label: string; count: number };
export type FunnelStep = { id: "opened" | "message_sent" | "intent_detected" | "action_shown" | "action_completed" | "result"; label: string; count: number; rateFromPrevious: number | null; rateFromOpened: number | null };
export type OutcomeBreakdown = Record<CoopiaOutcome, number>;
export type CoopiaAnalytics = {
  available: boolean; period: CoopiaPeriod; eventSourceComplete: boolean;
  totals: { sessions: number; messages: number; handoffs: number; unresolved: number; feedbackPositive: number; feedbackNegative: number; averageResponseMs: number | null };
  intents: CountItem[]; services: CountItem[]; recent: Array<{ event: string; at: string; result: string | null }>; commercialRequests: number | null;
  funnel: FunnelStep[]; outcomes: OutcomeBreakdown; resolution: { known: number; resolved: number; rate: number | null; label: string };
  needsLearning: Array<CountItem & { kind: "intent" | "service" }>;
  trends: Array<{ id: "messages" | "handoffs" | "unresolved"; label: string; current: number; previous: number; changePercent: number | null; status: "comparable" | "insufficient" }>;
  pulse: Array<{ label: string; detail: string }>;
};

const outcomeKeys: CoopiaOutcome[] = ["resolved", "information_provided", "action_completed", "conversion", "handoff", "abandoned", "unresolved", "error"];
const terminalOutcomes = new Set<CoopiaOutcome>(outcomeKeys);
const resolvedOutcomes = new Set<CoopiaOutcome>(["resolved", "information_provided", "action_completed", "conversion"]);
const minimumComparableBase = 3;
const minimumResolutionSample = 3;

export function coopiaPeriodStart(period: CoopiaPeriod, now = new Date()) {
  const start = new Date(now);
  if (period === "today") start.setHours(0, 0, 0, 0); else start.setDate(start.getDate() - (period === "7d" ? 7 : 30));
  return start.toISOString();
}
export function coopiaPreviousPeriodStart(period: CoopiaPeriod, now = new Date()) {
  const current = new Date(coopiaPeriodStart(period, now));
  current.setDate(current.getDate() - (period === "today" ? 1 : period === "7d" ? 7 : 30));
  return current.toISOString();
}
function countBy(values: Array<string | null | undefined>, limit = 6): CountItem[] {
  const counts = new Map<string, number>(); for (const value of values) if (value) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, limit);
}
function uniqueSessionCount(rows: EventRow[], eventTypes: string[]) { return new Set(rows.filter((row) => eventTypes.includes(row.event_type)).map((row) => row.session_id)).size; }
function outcomeFromRow(row: EventRow): CoopiaOutcome | null {
  const outcome = row.metadata?.outcome;
  if (typeof outcome === "string" && terminalOutcomes.has(outcome as CoopiaOutcome)) return outcome as CoopiaOutcome;
  if (outcome === "human_handoff") return "handoff";
  if (row.event_type === "coopia_unresolved") return "unresolved";
  if (row.event_type === "coopia_error") return "error";
  if (["coopia_handoff", "human_handoff_opened", "complaint_whatsapp_opened"].includes(row.event_type)) return "handoff";
  if (row.event_type === "journey_abandoned") return "abandoned";
  return null;
}
function sessionOutcomes(rows: EventRow[]) {
  const latest = new Map<string, { at: string; outcome: CoopiaOutcome }>();
  for (const row of rows) { const outcome = outcomeFromRow(row); const previous = latest.get(row.session_id); if (outcome && (!previous || row.created_at >= previous.at)) latest.set(row.session_id, { at: row.created_at, outcome }); }
  return latest;
}
function emptyOutcomes(): OutcomeBreakdown { return { resolved: 0, information_provided: 0, action_completed: 0, conversion: 0, handoff: 0, abandoned: 0, unresolved: 0, error: 0 }; }
function outcomeData(rows: EventRow[]) {
  const outcomes = emptyOutcomes(); const bySession = sessionOutcomes(rows); for (const { outcome } of bySession.values()) outcomes[outcome] += 1;
  const known = bySession.size; const resolved = [...resolvedOutcomes].reduce((sum, outcome) => sum + outcomes[outcome], 0);
  return { outcomes, bySession, resolution: { known, resolved, rate: known >= minimumResolutionSample ? Math.round((resolved / known) * 100) : null, label: known >= minimumResolutionSample ? "Resolución sobre desenlaces registrados" : "Datos insuficientes para calcular resolución" } };
}
function funnel(rows: EventRow[]): FunnelStep[] {
  const definitions: Array<{ id: FunnelStep["id"]; label: string; eventTypes: string[] }> = [
    { id: "opened", label: "Abrió COOPIA", eventTypes: ["coopia_global_opened", "assistant_opened"] }, { id: "message_sent", label: "Envió consulta", eventTypes: ["coopia_message_sent", "coopia_question", "assistant_question_sent"] }, { id: "intent_detected", label: "Intent detectado", eventTypes: ["coopia_intent_detected", "intent_detected"] }, { id: "action_shown", label: "Acción mostrada", eventTypes: ["coopia_action_shown", "navigation_recommended"] }, { id: "action_completed", label: "Acción iniciada", eventTypes: ["coopia_action_clicked"] }, { id: "result", label: "Resultado registrado", eventTypes: ["coopia_result"] },
  ];
  let previous: number | null = null; let opened: number | null = null;
  return definitions.map((definition) => { const count = uniqueSessionCount(rows, definition.eventTypes); if (definition.id === "opened") opened = count; const rateFromPrevious = previous && previous > 0 ? Math.round((count / previous) * 100) : null; const rateFromOpened = opened && opened > 0 ? Math.round((count / opened) * 100) : null; previous = count; return { id: definition.id, label: definition.label, count, rateFromPrevious, rateFromOpened }; });
}
function learningTopics(rows: EventRow[], bySession: Map<string, { at: string; outcome: CoopiaOutcome }>) {
  const sessions = new Set([...bySession.entries()].filter(([, value]) => ["unresolved", "handoff", "error"].includes(value.outcome)).map(([sessionId]) => sessionId)); const relevant = rows.filter((row) => sessions.has(row.session_id));
  const intents = countBy(relevant.filter((row) => ["coopia_intent_detected", "intent_detected"].includes(row.event_type)).map((row) => row.result || row.intent), 4).map((item) => ({ ...item, kind: "intent" as const }));
  const services = countBy(relevant.filter((row) => row.event_type === "coopia_service_detected").map((row) => row.result || row.service), 4).map((item) => ({ ...item, kind: "service" as const }));
  return [...intents, ...services].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 6);
}
function trend(current: number, previous: number, id: "messages" | "handoffs" | "unresolved", label: string) { return previous < minimumComparableBase ? { id, label, current, previous, changePercent: null, status: "insufficient" as const } : { id, label, current, previous, changePercent: Math.round(((current - previous) / previous) * 100), status: "comparable" as const }; }
function pulse(current: { intents: CountItem[]; services: CountItem[]; unresolved: number; handoffs: number }, previous: { intents: CountItem[]; services: CountItem[]; unresolved: number; handoffs: number }) {
  const alerts: Array<{ label: string; detail: string }> = [];
  const compareLabels = (kind: "topic" | "service", values: CountItem[], baseline: CountItem[]) => { const baselineCounts = new Map(baseline.map((item) => [item.label, item.count])); for (const item of values) { const prior = baselineCounts.get(item.label) || 0; if (item.count >= 6 && prior >= minimumComparableBase && item.count - prior >= 3 && (item.count - prior) / prior >= 0.5) alerts.push({ label: coopiaPulseLabel(kind, item.label), detail: `Consultas agregadas: ${item.count} frente a ${prior} en el período comparable.` }); } };
  compareLabels("topic", current.intents, previous.intents); compareLabels("service", current.services, previous.services);
  for (const [label, currentValue, previousValue] of [["consultas sin resolver", current.unresolved, previous.unresolved], ["derivaciones humanas", current.handoffs, previous.handoffs]] as const) if (currentValue >= 6 && previousValue >= minimumComparableBase && currentValue - previousValue >= 3 && (currentValue - previousValue) / previousValue >= 0.5) alerts.push({ label: `Posible incremento de ${label}.`, detail: `${currentValue} frente a ${previousValue} en el período comparable.` });
  return alerts.slice(0, 4);
}
function aggregatePeriod(rows: EventRow[]) {
  const responseTimes = rows.filter((row) => row.event_type === "coopia_result" && typeof row.duration_ms === "number").map((row) => row.duration_ms as number); const feedback = rows.filter((row) => row.event_type === "coopia_feedback"); const messages = rows.filter((row) => ["coopia_message_sent", "coopia_question", "assistant_question_sent"].includes(row.event_type)); const outcomes = outcomeData(rows);
  return { totals: { sessions: new Set(rows.map((row) => row.session_id)).size, messages: messages.length, handoffs: rows.filter((row) => ["coopia_handoff", "human_handoff_opened", "complaint_whatsapp_opened"].includes(row.event_type)).length, unresolved: rows.filter((row) => row.event_type === "coopia_unresolved").length, feedbackPositive: feedback.filter((row) => row.metadata?.helpful === true).length, feedbackNegative: feedback.filter((row) => row.metadata?.helpful === false).length, averageResponseMs: responseTimes.length ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length) : null }, intents: countBy(rows.filter((row) => ["coopia_intent_detected", "intent_detected"].includes(row.event_type)).map((row) => row.result || row.intent)), services: countBy(rows.filter((row) => row.event_type === "coopia_service_detected").map((row) => row.result || row.service)), outcomes };
}
export function aggregateCoopiaEvents(rows: EventRow[], period: CoopiaPeriod, commercialRequests: number | null, previousRows: EventRow[] = [], eventSourceComplete = true): CoopiaAnalytics {
  const current = aggregatePeriod(rows); const previous = aggregatePeriod(previousRows);
  return { available: true, period, eventSourceComplete, totals: current.totals, intents: current.intents, services: current.services, recent: rows.filter((row) => row.event_type.startsWith("coopia_")).slice(0, 10).map((row) => ({ event: row.event_type.replace(/^coopia_/, "").replaceAll("_", " "), at: row.created_at, result: row.result })), commercialRequests, funnel: funnel(rows), outcomes: current.outcomes.outcomes, resolution: current.outcomes.resolution, needsLearning: learningTopics(rows, current.outcomes.bySession), trends: [trend(current.totals.messages, previous.totals.messages, "messages", "Consultas"), trend(current.totals.handoffs, previous.totals.handoffs, "handoffs", "Derivaciones"), trend(current.totals.unresolved, previous.totals.unresolved, "unresolved", "Sin resolver")], pulse: pulse({ intents: current.intents, services: current.services, unresolved: current.totals.unresolved, handoffs: current.totals.handoffs }, { intents: previous.intents, services: previous.services, unresolved: previous.totals.unresolved, handoffs: previous.totals.handoffs }) };
}
export async function getCoopiaAnalytics(period: CoopiaPeriod): Promise<CoopiaAnalytics> {
  const session = await requireNewsAdmin(); if (!session) return { ...aggregateCoopiaEvents([], period, null), available: false };
  const now = new Date(); const currentStart = coopiaPeriodStart(period, now); const previousStart = coopiaPreviousPeriodStart(period, now);
  const [eventsResponse, requestsResponse] = await Promise.all([session.admin.from("journey_events").select("created_at,session_id,event_type,intent,service,action,result,metadata,duration_ms", { count: "exact" }).gte("created_at", previousStart).order("created_at", { ascending: false }).range(0, 999), session.admin.from("internet_requests").select("id", { count: "exact", head: true }).gte("created_at", currentStart)]);
  if (eventsResponse.error) return { ...aggregateCoopiaEvents([], period, null), available: false };
  const events = (eventsResponse.data || []) as EventRow[]; const currentRows = events.filter((row) => row.created_at >= currentStart); const previousRows = events.filter((row) => row.created_at < currentStart);
  return aggregateCoopiaEvents(currentRows, period, requestsResponse.error ? null : requestsResponse.count || 0, previousRows, (eventsResponse.count || 0) <= 1000);
}
