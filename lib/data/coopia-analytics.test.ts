import { describe, expect, it } from "vitest";
import { aggregateCoopiaEvents } from "./coopia-analytics";

describe("aggregateCoopiaEvents", () => {
  it("aggregates anonymous event data without conversation content", () => {
    const result = aggregateCoopiaEvents([
      { created_at: "2026-08-21T12:00:00Z", session_id: "s-1", event_type: "coopia_message_sent", intent: null, service: null, action: null, result: null, metadata: null, duration_ms: null },
      { created_at: "2026-08-21T12:00:02Z", session_id: "s-1", event_type: "coopia_result", intent: null, service: null, action: null, result: "internet_signup", metadata: { outcome: "action_recommended" }, duration_ms: 1200 },
      { created_at: "2026-08-21T12:00:03Z", session_id: "s-2", event_type: "coopia_feedback", intent: null, service: null, action: null, result: null, metadata: { helpful: true }, duration_ms: null },
    ], "7d", 2);
    expect(result.totals).toMatchObject({ sessions: 2, messages: 1, feedbackPositive: 1, averageResponseMs: 1200 });
    expect(JSON.stringify(result)).not.toContain("content");
  });
});
