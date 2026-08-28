import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, requireNewsAdmin, isSameOrigin } = vi.hoisted(() => ({
  rpc: vi.fn(),
  requireNewsAdmin: vi.fn(),
  isSameOrigin: vi.fn(),
}));

vi.mock("../../../../../lib/admin-auth", () => ({ requireNewsAdmin, isSameOrigin }));

import { PATCH } from "./route";

describe("PATCH /api/admin/sepelio/planillas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireNewsAdmin.mockResolvedValue({ email: "admin@example.com", admin: { rpc } });
    isSameOrigin.mockReturnValue(true);
  });

  it("uses the atomic RPC and takes actor identity from the authenticated session", async () => {
    rpc.mockResolvedValue({ data: [{ status: "waiting_customer", unchanged: false }], error: null });
    const response = await PATCH(new Request("https://coopsar.test/api/admin/sepelio/planillas", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "6b7db2a3-15dc-44d2-a639-0bf795fca7d6", status: "waiting_customer", actor_email: "attacker@example.com" }) }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("update_funeral_family_request_status", { p_request_id: "6b7db2a3-15dc-44d2-a639-0bf795fca7d6", p_new_status: "waiting_customer", p_actor_email: "admin@example.com" });
  });

  it("reports an unchanged transition without asking the browser for an actor", async () => {
    rpc.mockResolvedValue({ data: [{ status: "in_review", unchanged: true }], error: null });
    const response = await PATCH(new Request("https://coopsar.test/api/admin/sepelio/planillas", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "6b7db2a3-15dc-44d2-a639-0bf795fca7d6", status: "in_review" }) }));
    expect(await response.json()).toEqual({ status: "in_review", unchanged: true });
  });

  it("rejects unauthenticated callers before invoking the RPC", async () => {
    requireNewsAdmin.mockResolvedValue(null);
    const response = await PATCH(new Request("https://coopsar.test/api/admin/sepelio/planillas", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "6b7db2a3-15dc-44d2-a639-0bf795fca7d6", status: "in_review" }) }));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
});
