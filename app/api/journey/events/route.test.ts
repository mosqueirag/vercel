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

  it("records a help article view with only its public slug and category", async () => {
    const request = new NextRequest("https://coopsar.test/api/journey/events", {
      method: "POST",
      body: JSON.stringify({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78", eventType: "help_article_view", page: "/centro-de-ayuda/energia-estimar-consumo", metadata: { slug: "energia-estimar-consumo", category: "Energía", email: "persona@example.com", address: "Dato privado" } }),
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(204);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "help_article_view", metadata: { slug: "energia-estimar-consumo", category: "Energía" } }));
    expect(JSON.stringify(recordJourneyEvent.mock.calls[0][0])).not.toMatch(/persona@example.com|Dato privado|email|address/i);
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

  it("records a coverage recommendation with only safe plan metadata", async () => {
    const request = new NextRequest("https://coopsar.test/api/journey/events", {
      method: "POST",
      body: JSON.stringify({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78", eventType: "internet_plan_recommended", page: "/internet", service: "internet", result: "0c4b8c7a-1234-4bcd-8f90-123456789012", metadata: { plan_id: "0c4b8c7a-1234-4bcd-8f90-123456789012", technology: "ADSL", coverage_status: "available", commercial_availability: false } }),
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(204);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "internet_plan_recommended", metadata: { plan_id: "0c4b8c7a-1234-4bcd-8f90-123456789012", technology: "ADSL", coverage_status: "available", commercial_availability: false } }));
    expect(JSON.stringify(recordJourneyEvent.mock.calls[0][0])).not.toMatch(/calle|altura|email|phone/i);
  });

  it("records enterprise interest with aggregate context only", async () => {
    const request = new NextRequest("https://coopsar.test/api/journey/events", {
      method: "POST",
      body: JSON.stringify({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78", eventType: "enterprise_internet_interest", page: "/internet", service: "internet", result: "empresa", metadata: { source: "enterprise_panel", technology: "FTTH", coverage_status: "available", street: "España", number: "451" } }),
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(204);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "enterprise_internet_interest", metadata: { source: "enterprise_panel", technology: "FTTH", coverage_status: "available" } }));
    expect(JSON.stringify(recordJourneyEvent.mock.calls[0][0])).not.toMatch(/España|451|street|number/i);
  });

  it("records a quick access click without accepting personal data", async () => {
    const request = new NextRequest("https://coopsar.test/api/journey/events", {
      method: "POST",
      body: JSON.stringify({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78", eventType: "quick_access_click", page: "/", metadata: { action_id: "fiber_coverage", source: "home_quick_actions", destination_type: "internal", address: "Dato privado", phone: "0000000000", email: "persona@example.com" } }),
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(204);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "quick_access_click", metadata: { action_id: "fiber_coverage", source: "home_quick_actions", destination_type: "internal" } }));
    expect(JSON.stringify(recordJourneyEvent.mock.calls[0][0])).not.toMatch(/Dato privado|0000000000|persona@example.com|address|phone|email/i);
  });

  it("records a procedure selection with only its aggregate identifier and resolution path", async () => {
    const request = new NextRequest("https://coopsar.test/api/journey/events", {
      method: "POST",
      body: JSON.stringify({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78", eventType: "procedure_selected", page: "/tramites", intent: "ownership_change", service: "general", metadata: { procedure_id: "ownership_change", resolution_type: "coopia", source: "procedures_center", email: "persona@example.com", address: "Dato privado" } }),
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(204);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "procedure_selected",
      metadata: { procedure_id: "ownership_change", resolution_type: "coopia", source: "procedures_center" },
    }));
    expect(JSON.stringify(recordJourneyEvent.mock.calls[0][0])).not.toMatch(/persona@example.com|Dato privado|email|address/i);
  });

  it("records a COOP Online download with safe aggregate metadata only", async () => {
    const request = new NextRequest("https://coopsar.test/api/journey/events", {
      method: "POST",
      body: JSON.stringify({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78", eventType: "app_download_click", page: "/", metadata: { platform: "android", source: "quick_actions_app", destination: "google_play", email: "persona@example.com", street: "España 451" } }),
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(204);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "app_download_click", metadata: { platform: "android", source: "quick_actions_app", destination: "google_play" } }));
    expect(JSON.stringify(recordJourneyEvent.mock.calls[0][0])).not.toMatch(/persona@example.com|España|451|email|street/i);
  });

  it("records a Home priority once with aggregate navigation context only", async () => {
    const request = new NextRequest("https://coopsar.test/api/journey/events", {
      method: "POST",
      body: JSON.stringify({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78", eventType: "home_priority_applied", page: "/", intent: "internet_signup", service: "internet", metadata: { priority_action: "internet_interest", source: "navigation_context", message: "Quiero Internet", address: "España 451" } }),
      headers: { "content-type": "application/json" },
    });
    expect((await POST(request)).status).toBe(204);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "home_priority_applied", intent: "internet_signup", service: "internet", metadata: { priority_action: "internet_interest", source: "navigation_context" } }));
    expect(JSON.stringify(recordJourneyEvent.mock.calls[0][0])).not.toMatch(/Quiero Internet|España|451|message|address/i);
  });
});
