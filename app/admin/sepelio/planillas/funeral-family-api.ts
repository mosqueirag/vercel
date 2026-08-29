export type JsonRequestMethod = "PATCH" | "POST";

export async function requestJson(url: string, options: { method: JsonRequestMethod; body: unknown }) {
  const response = await fetch(url, {
    method: options.method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(options.body),
  });

  return { response, data: await response.json().catch(() => ({})) };
}

export const funeralPlanillasRequests = {
  updateStatus: (body: unknown) => requestJson("/api/admin/sepelio/planillas", { method: "PATCH", body }),
  viewDocument: (body: unknown) => requestJson("/api/admin/sepelio/planillas/documents", { method: "POST", body }),
} as const;
