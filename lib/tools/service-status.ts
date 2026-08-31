import { recordJourneyEvent } from "../journey/recorder";
import type { JourneyContext } from "../journey/types";
import { getPublicServiceStatus } from "../data/service-alerts";
export { selectActiveServiceStatus, type PublicServiceStatus } from "../data/service-alerts";
export async function getPublicServiceStatuses() {
  const values = [["Energía", "energy"], ["Internet", "internet"], ["Fibra óptica", "fiber"], ["Telefonía", "phone"], ["Oficina Virtual", "virtual_office"]] as const;
  return Promise.all(values.map(async ([name, key]) => { const { status } = await getPublicServiceStatus(key); return { name, status, detail: status === "unknown" ? "Sin información operativa confirmada" : "Estado publicado por COOPSAR" }; }));
}
export async function getServiceStatus(service: "internet" | "energy", context: JourneyContext) {
  const started = Date.now(); await recordJourneyEvent({ ...context, eventType: "tool_started", tool: "getServiceStatus" });
  const result = await getPublicServiceStatus(service);
  await recordJourneyEvent({ ...context, eventType: result.error ? "tool_failed" : "tool_completed", tool: "getServiceStatus", result: result.status, durationMs: Date.now() - started });
  return result.status;
}
