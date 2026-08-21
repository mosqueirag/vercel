import { describe, expect, it } from "vitest";
import { summarizeCoopiaAnalytics } from "./analytics-summary";

describe("summarizeCoopiaAnalytics", () => {
  it("uses aggregate metrics and not conversation content", () => {
    const result = summarizeCoopiaAnalytics({ available: true, period: "7d", totals: { sessions: 3, messages: 5, handoffs: 0, unresolved: 1, feedbackPositive: 0, feedbackNegative: 0, averageResponseMs: null }, intents: [{ label: "fiber_coverage", count: 3 }], services: [{ label: "fiber", count: 3 }], recent: [], commercialRequests: 1 });
    expect(result.summary).toContain("5 consultas");
    expect(JSON.stringify(result)).not.toContain("conversation");
  });
});
