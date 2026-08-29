import { afterEach, describe, expect, it, vi } from "vitest";
import { funeralPlanillasRequests } from "./funeral-family-api";

describe("funeral planillas client requests", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses PATCH for status changes instead of POST", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { headers: { "content-type": "application/json" } }));
    await funeralPlanillasRequests.updateStatus({ id: "case-id", status: "in_review" });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/sepelio/planillas", expect.objectContaining({ method: "PATCH" }));
  });

  it("uses the documents route's POST contract for secure viewing", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { headers: { "content-type": "application/json" } }));
    await funeralPlanillasRequests.viewDocument({ documentId: "document-id" });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/sepelio/planillas/documents", expect.objectContaining({ method: "POST" }));
  });
});
