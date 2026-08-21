import { createHash } from "node:crypto";
import OpenAI from "openai";
import type { CoopiaAnalytics } from "../data/coopia-analytics";

export type CoopiaAnalyticsSummary = { source: "ai" | "deterministic"; summary: string; insights: string[]; recommendations: string[] };
const ttlMs = 10 * 60 * 1000;
export function createCoopiaSummaryCache<T>(ttl = ttlMs) {
  const values = new Map<string, { expiresAt: number; value: T }>();
  return {
    get(key: string, now = Date.now()) { const cached = values.get(key); return cached && cached.expiresAt > now ? cached.value : null; },
    set(key: string, value: T, now = Date.now()) { values.set(key, { expiresAt: now + ttl, value }); return value; },
    clear() { values.clear(); },
  };
}
const cache = createCoopiaSummaryCache<CoopiaAnalyticsSummary>();

export function coopiaAggregatePayload(data: CoopiaAnalytics) {
  return { period: data.period, totals: data.totals, resolution: data.resolution, funnel: data.funnel.map(({ id, count }) => ({ id, count })), intents: data.intents, services: data.services, needsLearning: data.needsLearning, trends: data.trends, pulse: data.pulse, commercialRequests: data.commercialRequests };
}
export function summarizeCoopiaAnalytics(data: CoopiaAnalytics): CoopiaAnalyticsSummary {
  if (!data.totals.messages) return { source: "deterministic", summary: "Todavía no hay consultas suficientes para generar un resumen operativo.", insights: [], recommendations: ["Verificar que la telemetría de COOPIA esté disponible en staging."] };
  const topic = data.intents[0]?.label?.replaceAll("_", " ") || "orientación general"; const service = data.services[0]?.label || "los servicios";
  const resolution = data.resolution.rate === null ? "Aún no hay desenlaces registrados suficientes para calcular una tasa de resolución." : `La tasa de resolución sobre desenlaces registrados es ${data.resolution.rate}%.`;
  return { source: "deterministic", summary: `En el período seleccionado hubo ${data.totals.messages} consultas. El tema principal fue ${topic} y el servicio más consultado fue ${service}. ${resolution}`, insights: data.pulse.map((item) => item.label), recommendations: [data.needsLearning.length ? "Priorizar contenidos oficiales para los temas con derivación, error o falta de resolución." : "Mantener actualizada la base de conocimiento oficial.", data.commercialRequests ? "Revisar las solicitudes comerciales recientes desde la bandeja correspondiente." : "No hay oportunidades comerciales registradas para este período."] };
}
function cleanSummary(input: unknown): CoopiaAnalyticsSummary | null {
  if (!input || typeof input !== "object") return null; const value = input as { summary?: unknown; insights?: unknown; recommendations?: unknown };
  if (typeof value.summary !== "string" || !Array.isArray(value.insights) || !Array.isArray(value.recommendations)) return null;
  const strings = (items: unknown[]) => items.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 3);
  return { source: "ai", summary: value.summary.trim().slice(0, 800), insights: strings(value.insights), recommendations: strings(value.recommendations) };
}
export async function getCoopiaAnalyticsSummary(data: CoopiaAnalytics): Promise<CoopiaAnalyticsSummary> {
  const fallback = summarizeCoopiaAnalytics(data); if (!process.env.OPENAI_API_KEY || !data.totals.messages) return fallback;
  const payload = coopiaAggregatePayload(data); const key = createHash("sha256").update(JSON.stringify(payload)).digest("hex"); const cached = cache.get(key);
  if (cached) return cached;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({ model: process.env.OPENAI_MODEL || "gpt-5.4-nano", max_output_tokens: 450, instructions: "Sos analista operativo de COOPSAR. Analizá únicamente métricas agregadas, sin inventar causas ni incidentes. Respondé JSON válido: {summary:string,insights:string[],recommendations:string[]}. Máximo 3 insights y 3 recomendaciones. Si no hay muestra suficiente, indicá datos insuficientes.", input: JSON.stringify(payload) });
    const summary = cleanSummary(JSON.parse(response.output_text)); if (!summary) return fallback;
    return cache.set(key, summary);
  } catch { console.error("COOPIA aggregate analytics summary unavailable"); return fallback; }
}
export function resetCoopiaAnalyticsSummaryCacheForTest() { cache.clear(); }
