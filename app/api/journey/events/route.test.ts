import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { recordJourneyEvent } = vi.hoisted(() => ({ recordJourneyEvent: vi.fn().mockResolvedValue(true) }));
vi.mock("../../../../lib/journey/recorder", () => ({ recordJourneyEvent }));
vi.mock("../../../../lib/security/rate-limit", () => ({ consumeRateLimit: vi.fn().mockResolvedValue({ allowed: true, available: true }) }));

import { POST, sanitizePublicCoopiaMetadata } from "./route";

describe("sanitizePublicCoopiaMetadata", () => {
  beforeEach(() => recordJourneyEvent.mockClear());
  it("keeps aggregate fields and drops free-text page context", () => {
    const metadata = sanitizePublicCoopiaMetadata({ page_type: "article", page_title: "Consulta privada", entity_id: "private-id", previous_page: "/noticias/private", outcome: "information_provided", message_length: 42 });
    expect(metadata).toEqual({ page_type: "article", outcome: "information_provided", message_length: 42 });
    expect(JSON.stringify(metadata)).not.toContain("Consulta privada");
  });

  it("allows the canonical intent label but never arbitrary user data", () => {
    const metadata = sanitizePublicCoopiaMetadata({ orchestration_intent: "fiber_interest", confidence: 0.95, message_length: 24, page_title: "España 451" });
    expect(metadata).toEqual({ confidence: 0.95, orchestration_intent: "fiber_interest", message_length: 24 });
    expect(JSON.stringify(metadata)).not.toContain("España");
  });

  it("accepts a pre-classification message with no intent or service", async () => {
    const request = new NextRequest("https://coopsar.test/api/journey/events", {
      method: "POST",
      body: JSON.stringify({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78", eventType: "coopia_message_sent", page: "/", metadata: { message_length: 12 } }),
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(204);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "coopia_message_sent", metadata: { message_length: 12 } }));
    expect(recordJourneyEvent.mock.calls[0][0]).not.toHaveProperty("intent");
    expect(recordJourneyEvent.mock.calls[0][0]).not.toHaveProperty("service");
  });

  it("accepts an audience choice without address or contact metadata", async () => {
    const request = new NextRequest("https://coopsar.test/api/journey/events", {
      method: "POST",
      body: JSON.stringify({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78", eventType: "internet_audience_selected", page: "/internet", result: "empresa", service: "internet" }),
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(204);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "internet_audience_selected", result: "empresa", service: "internet" }));
    expect(JSON.stringify(recordJourneyEvent.mock.calls[0][0])).not.toMatch(/calle|altura|phone|email/i);
  });
});
