import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, requireNewsAdmin, isSameOrigin } = vi.hoisted(() => ({
  from: vi.fn(),
  requireNewsAdmin: vi.fn(),
  isSameOrigin: vi.fn(),
}));

vi.mock("../../../../../lib/admin-auth", () => ({ requireNewsAdmin, isSameOrigin }));

import { DELETE, GET } from "./route";

const planId = "6b7db2a3-15dc-44d2-a639-0bf795fca7d6";

function planBuilder(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(), eq: vi.fn(), is: vi.fn(), update: vi.fn(), order: vi.fn(), maybeSingle: vi.fn(), single: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(result);
  chain.single.mockResolvedValue(result);
  return chain;
}

describe("Internet plan soft deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireNewsAdmin.mockResolvedValue({ email: "admin@example.com", admin: { from } });
    isSameOrigin.mockReturnValue(true);
  });

  it("rejects an unauthenticated deletion", async () => {
    requireNewsAdmin.mockResolvedValue(null);
    const response = await DELETE(new Request("https://coopsar.test/api/admin/internet/plans", { method: "DELETE", body: JSON.stringify({ id: planId }) }));
    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin deletion before reading a plan", async () => {
    isSameOrigin.mockReturnValue(false);
    const response = await DELETE(new Request("https://coopsar.test/api/admin/internet/plans", { method: "DELETE", body: JSON.stringify({ id: planId }) }));
    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("requires a published offer to be archived first", async () => {
    const current = planBuilder({ data: { id: planId, status: "published", deleted_at: null }, error: null });
    from.mockReturnValue(current);
    const response = await DELETE(new Request("https://coopsar.test/api/admin/internet/plans", { method: "DELETE", body: JSON.stringify({ id: planId }) }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Archivá el plan antes de eliminarlo." });
    expect(current.update).not.toHaveBeenCalled();
  });

  it("soft-deletes a draft and writes a deleted audit entry", async () => {
    const current = planBuilder({ data: { id: planId, status: "draft", deleted_at: null }, error: null });
    const updated = planBuilder({ data: { id: planId, status: "archived" }, error: null });
    const audit = { insert: vi.fn().mockResolvedValue({ error: null }) };
    from.mockImplementation((table: string) => table === "internet_plan_admin_audit" ? audit : from.mock.calls.filter(([called]) => called === "internet_plans").length === 1 ? current : updated);

    const response = await DELETE(new Request("https://coopsar.test/api/admin/internet/plans", { method: "DELETE", body: JSON.stringify({ id: planId }) }));
    expect(response.status).toBe(200);
    expect(updated.update).toHaveBeenCalledWith(expect.objectContaining({ status: "archived", published_at: null, deleted_by: "admin@example.com" }));
    expect(audit.insert).toHaveBeenCalledWith({ plan_id: planId, action: "deleted", actor_email: "admin@example.com" });
  });

  it("is idempotent when the plan was already soft-deleted", async () => {
    const current = planBuilder({ data: { id: planId, status: "archived", deleted_at: "2026-08-29T00:00:00.000Z" }, error: null });
    from.mockReturnValue(current);
    const response = await DELETE(new Request("https://coopsar.test/api/admin/internet/plans", { method: "DELETE", body: JSON.stringify({ id: planId }) }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ unchanged: true });
    expect(current.update).not.toHaveBeenCalled();
  });

  it("keeps soft-deleted plans out of the administrative list", async () => {
    const list = planBuilder({ data: [], error: null });
    list.order.mockReturnValueOnce(list).mockResolvedValueOnce({ data: [], error: null });
    from.mockReturnValue(list);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(list.is).toHaveBeenCalledWith("deleted_at", null);
  });
});
