import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireNewsAdmin, maybeSingle, insert, createSignedUrl } = vi.hoisted(() => ({
  requireNewsAdmin: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  createSignedUrl: vi.fn(),
}));

vi.mock("../../../../../../lib/admin-auth", () => ({ requireNewsAdmin, isSameOrigin: () => true }));

import { POST } from "./route";

describe("POST /api/admin/sepelio/planillas/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingle.mockResolvedValue({ data: { id: "11111111-1111-4111-8111-111111111111", request_id: "22222222-2222-4222-8222-222222222222", document_type: "holder_dni_front", storage_bucket: "funeral-private-documents", storage_path: "opaque-path" }, error: null });
    insert.mockResolvedValue({ error: null });
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed.example/document" }, error: null });
    requireNewsAdmin.mockResolvedValue({ email: "admin@coopsar.test", admin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }), insert }), storage: { from: () => ({ createSignedUrl }) } } });
  });

  it("requires an authorized administrator and records a document_viewed audit", async () => {
    const request = new NextRequest("https://coopsar.test/api/admin/sepelio/planillas/documents", { method: "POST", headers: { origin: "https://coopsar.test", "content-type": "application/json" }, body: JSON.stringify({ documentId: "11111111-1111-4111-8111-111111111111" }) });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedUrl: "https://signed.example/document", expiresIn: 90 });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ action: "document_viewed" }));
  });

  it("does not reveal whether a document exists to an unauthenticated caller", async () => {
    requireNewsAdmin.mockResolvedValue(null);
    const response = await POST(new NextRequest("https://coopsar.test/api/admin/sepelio/planillas/documents", { method: "POST", headers: { origin: "https://coopsar.test", "content-type": "application/json" }, body: JSON.stringify({ documentId: "11111111-1111-4111-8111-111111111111" }) }));
    expect(response.status).toBe(401);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
