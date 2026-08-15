import { describe, expect, it } from "vitest";
import { createJourneyId, createSessionId, isJourneyId, isSessionId } from "./ids";

describe("journey identifiers", () => {
  it("creates public opaque identifiers", () => {
    expect(isJourneyId(createJourneyId(new Date("2026-08-15T00:00:00Z")))).toBe(true);
    expect(isSessionId(createSessionId())).toBe(true);
  });
  it("rejects arbitrary identifiers", () => {
    expect(isJourneyId("journey-1")).toBe(false);
    expect(isSessionId("session-1")).toBe(false);
  });
});
