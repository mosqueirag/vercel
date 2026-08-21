import { describe, expect, it } from "vitest";
import { aggregateCoopiaEvents, coopiaPeriodStart, coopiaPreviousPeriodStart, type EventRow } from "./coopia-analytics";

const row = (session_id: string, event_type: string, created_at: string, extra: Partial<EventRow> = {}): EventRow => ({ created_at, session_id, event_type, intent: null, service: null, action: null, result: null, metadata: null, duration_ms: null, ...extra });

describe("aggregateCoopiaEvents", () => {
  it("uses metadata.outcome rather than the historical result intent", () => {
    const result = aggregateCoopiaEvents([row("s-1", "coopia_message_sent", "2026-08-21T12:00:00Z"), row("s-1", "coopia_result", "2026-08-21T12:00:02Z", { result: "internet_signup", metadata: { outcome: "information_provided" }, duration_ms: 1200 }), row("s-2", "coopia_feedback", "2026-08-21T12:00:03Z", { metadata: { helpful: true } })], "7d", 2);
    expect(result.totals).toMatchObject({ sessions: 2, messages: 1, feedbackPositive: 1, averageResponseMs: 1200 });
    expect(result.outcomes.information_provided).toBe(1);
    expect(JSON.stringify(result)).not.toContain("content");
  });

  it("deduplicates the funnel by session and does not invent a legacy result", () => {
    const result = aggregateCoopiaEvents([row("s-1", "coopia_global_opened", "2026-08-21T12:00:00Z"), row("s-1", "coopia_global_opened", "2026-08-21T12:00:01Z"), row("s-1", "coopia_message_sent", "2026-08-21T12:00:02Z"), row("s-1", "coopia_intent_detected", "2026-08-21T12:00:03Z", { result: "billing" }), row("s-1", "coopia_result", "2026-08-21T12:00:04Z", { result: "billing" })], "7d", null);
    expect(result.funnel.find((item) => item.id === "opened")?.count).toBe(1);
    expect(result.resolution.rate).toBeNull();
    expect(result.funnel.find((item) => item.id === "result")?.rateFromOpened).toBe(100);
  });

  it("keeps legacy aliases and suppresses comparisons with no safe denominator", () => {
    const result = aggregateCoopiaEvents([row("s-1", "assistant_opened", "2026-08-21T12:00:00Z"), row("s-1", "intent_detected", "2026-08-21T12:00:01Z", { result: "billing" }), row("s-1", "human_handoff_opened", "2026-08-21T12:00:02Z")], "today", null, []);
    expect(result.funnel.find((item) => item.id === "opened")?.count).toBe(1);
    expect(result.outcomes.handoff).toBe(1);
    expect(result.trends.every((item) => item.changePercent === null)).toBe(true);
  });

  it("calculates current and immediately previous period boundaries", () => {
    const now = new Date("2026-08-21T15:30:00Z");
    expect(coopiaPeriodStart("7d", now)).toBe("2026-08-14T15:30:00.000Z");
    expect(coopiaPreviousPeriodStart("7d", now)).toBe("2026-08-07T15:30:00.000Z");
  });

  it("groups learnings, trends and pulse only from aggregate event fields", () => {
    const current: EventRow[] = []; const previous: EventRow[] = [];
    for (let index = 0; index < 6; index += 1) current.push(row(`c-${index}`, "coopia_message_sent", "2026-08-21T12:00:00Z"), row(`c-${index}`, "coopia_intent_detected", "2026-08-21T12:00:01Z", { result: "fiber_coverage" }), row(`c-${index}`, "coopia_service_detected", "2026-08-21T12:00:02Z", { result: "fiber" }), row(`c-${index}`, "coopia_unresolved", "2026-08-21T12:00:03Z"));
    for (let index = 0; index < 3; index += 1) previous.push(row(`p-${index}`, "coopia_message_sent", "2026-08-14T12:00:00Z"), row(`p-${index}`, "coopia_intent_detected", "2026-08-14T12:00:01Z", { result: "fiber_coverage" }));
    const result = aggregateCoopiaEvents(current, "7d", 0, previous);
    expect(result.needsLearning).toContainEqual({ kind: "intent", label: "fiber_coverage", count: 6 });
    expect(result.trends.find((item) => item.id === "messages")?.changePercent).toBe(100);
    expect(result.pulse[0]?.label).toBe("Posible incremento de consultas sobre el tema cobertura de fibra.");
    expect(result.pulse.every((item) => item.label.startsWith("Posible incremento"))).toBe(true);
    expect(JSON.stringify(result)).not.toContain("pregunta");
  });

  it("does not emit pulse alerts for a small sample", () => {
    const current = [row("c-1", "coopia_message_sent", "2026-08-21T12:00:00Z"), row("c-1", "coopia_intent_detected", "2026-08-21T12:00:01Z", { result: "internet_signup" })];
    const previous = [row("p-1", "coopia_message_sent", "2026-08-14T12:00:00Z"), row("p-1", "coopia_intent_detected", "2026-08-14T12:00:01Z", { result: "internet_signup" })];
    expect(aggregateCoopiaEvents(current, "7d", null, previous).pulse).toEqual([]);
  });
});
