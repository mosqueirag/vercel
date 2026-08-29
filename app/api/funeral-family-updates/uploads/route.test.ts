import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { consumeRateLimit, insert, update, createSignedUploadUrl } = vi.hoisted(() => ({
  consumeRateLimit: vi.fn().mockResolvedValue({ allowed: true, available: true }),
  insert: vi.fn().mockResolvedValue({ error: null }),
  update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
  createSignedUploadUrl: vi.fn(),
}));

vi.mock("../../../../lib/security/rate-limit", () => ({ consumeRateLimit }));
vi.mock("../../../../lib/supabase", () => ({
  createSupabaseAdmin: () => ({
    from: () => ({ insert, update }),
    storage: { from: () => ({ createSignedUploadUrl }) },
  }),
}));

import { POST } from "./route";

describe("POST /api/funeral-family-updates/uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimit.mockResolvedValue({ allowed: true, available: true });
    createSignedUploadUrl.mockResolvedValueOnce({ data: { token: "front-token" }, error: null }).mockResolvedValueOnce({ data: { token: "back-token" }, error: null });
  });

  it("creates two opaque, server-generated signed upload paths", async () => {
    const response = await POST(new NextRequest("https://coopsar.test/api/funeral-family-updates/uploads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ front: { type: "image/jpeg", size: 42 }, back: { type: "image/png", size: 43 } }) }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.front.path).toMatch(/holder-dni-front\.jpg$/);
    expect(body.back.path).toMatch(/holder-dni-back\.png$/);
    expect(JSON.stringify(body)).not.toMatch(/Titular|12345678|nombre/i);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ front_file_size: 42, back_file_size: 43 }));
  });

  it("rejects unsupported document metadata before creating a session", async () => {
    const response = await POST(new NextRequest("https://coopsar.test/api/funeral-family-updates/uploads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ front: { type: "application/pdf", size: 42 }, back: { type: "image/png", size: 43 } }) }));
    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
});
