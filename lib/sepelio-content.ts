/** Historical COOPSAR material is provenance, never a runtime source of truth.
 * These short, non-commercial summaries are visible only in STAGING while the
 * published content workflow is completed. Source URLs remain in internal docs. */
export type FuneralCandidate = { title: string; body: string; sourceStatus: "candidate" };

export function isStagingFuneralContentPreview(env = process.env.NEXT_PUBLIC_APP_ENV, vercelEnv = process.env.VERCEL_ENV) {
  return env === "staging" && vercelEnv !== "production";
}

export function getStagingFuneralCandidates(): FuneralCandidate[] {
  return [
    { title: "Qué es el servicio", body: "El Servicio Solidario de Sepelio brinda orientación y acompañamiento cuando una familia necesita atención.", sourceStatus: "candidate" },
    { title: "Atención ante una necesidad", body: "Si necesitás el servicio ahora, priorizá el canal de guardia. Para consultas no urgentes, COOPIA puede orientarte al próximo paso.", sourceStatus: "candidate" },
    { title: "Grupo familiar", body: "Podés informar una actualización para que el equipo revise los integrantes declarados. La solicitud no modifica datos automáticamente.", sourceStatus: "candidate" },
  ];
}
