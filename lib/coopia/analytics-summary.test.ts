import { describe, expect, it } from "vitest";
import { coopiaAggregatePayload, createCoopiaSummaryCache, summarizeCoopiaAnalytics } from "./analytics-summary";
import type { CoopiaAnalytics } from "../data/coopia-analytics";

const data: CoopiaAnalytics = { available: true, eventSourceComplete: true, period: "7d", totals: { sessions: 3, messages: 5, handoffs: 0, unresolved: 1, feedbackPositive: 0, feedbackNegative: 0, averageResponseMs: null }, intents: [{ label: "fiber_coverage", count: 3 }], services: [{ label: "fiber", count: 3 }], recent: [], commercialRequests: 1, funnel: [], outcomes: { resolved: 0, information_provided: 0, action_completed: 0, conversion: 0, handoff: 0, abandoned: 0, unresolved: 1, error: 0 }, resolution: { known: 1, resolved: 0, rate: null, label: "Datos insuficientes para calcular resolución" }, needsLearning: [{ kind: "intent", label: "fiber_coverage", count: 1 }], trends: [], pulse: [] };
describe("summarizeCoopiaAnalytics", () => {
  it("uses aggregate metrics and not conversation content", () => { const result = summarizeCoopiaAnalytics(data); expect(result.summary).toContain("5 consultas"); expect(JSON.stringify(result)).not.toContain("conversation"); });
  it("builds an AI payload without recent records or text fields", () => { const payload = coopiaAggregatePayload(data); expect(JSON.stringify(payload)).not.toContain("recent"); expect(JSON.stringify(payload)).not.toContain("message_content"); });
  it("caches summaries only during its bounded TTL", () => { const cache = createCoopiaSummaryCache<string>(100); cache.set("aggregate", "summary", 1000); expect(cache.get("aggregate", 1050)).toBe("summary"); expect(cache.get("aggregate", 1100)).toBeNull(); });
});
