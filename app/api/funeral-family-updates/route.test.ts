import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { consumeRateLimit, secureFingerprint, recordJourneyEvent, rpc } = vi.hoisted(() => ({
  consumeRateLimit: vi.fn().mockResolvedValue({ allowed: true, available: true }),
  secureFingerprint: vi.fn().mockReturnValue("safe-fingerprint"),
  recordJourneyEvent: vi.fn().mockResolvedValue(true),
  rpc: vi.fn(),
}));

vi.mock("../../../lib/security/rate-limit", () => ({ consumeRateLimit, secureFingerprint }));
vi.mock("../../../lib/journey/recorder", () => ({ recordJourneyEvent }));
vi.mock("../../../lib/supabase", () => ({ createSupabaseAdmin: () => ({ rpc }) }));

import { POST } from "./route";

const payload = {
  memberNumber: "TEST-0001", holderFullName: "Titular Sintético", holderDni: "12345678", phone: "0000000000", email: "",
  consent: true, journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78",
  members: [{ fullName: "Integrante Sintético", dni: "87654321", birthDate: "2000-01-01", relationship: "other" }],
};

describe("POST /api/funeral-family-updates", () => {
  beforeEach(() => { vi.clearAllMocks(); consumeRateLimit.mockResolvedValue({ allowed: true, available: true }); secureFingerprint.mockReturnValue("safe-fingerprint"); });

  it("records a duplicate submission as completed, without PII in analytics", async () => {
    rpc.mockResolvedValue({ data: [{ created: false, request_number: "SEP-2026-TEST0001" }], error: null });
    const response = await POST(new NextRequest("https://coopsar.test/api/funeral-family-updates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }));
    expect(response.status).toBe(200);
    expect(recordJourneyEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "form_completed", action: "funeral_family_update", result: "duplicate", metadata: { member_count: 1, source: "sepelio_web" } }));
    expect(JSON.stringify(recordJourneyEvent.mock.calls[0][0])).not.toMatch(/Titular|12345678|0000000000|Sintético/i);
  });

  it("does not route a non-urgent storage failure to the funeral guard", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PGRST999" } });
    const response = await POST(new NextRequest("https://coopsar.test/api/funeral-family-updates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }));
    expect(response.status).toBe(503);
    expect((await response.json()).error).not.toMatch(/guardia/i);
  });
});
