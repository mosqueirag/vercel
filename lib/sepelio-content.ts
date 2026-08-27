/** Historical COOPSAR pages are migration material, never a runtime source of truth.
 * Candidate wording is intentionally available only in STAGING while human review
 * publishes curated records through the existing content workflow. */
export type FuneralCandidate = { title: string; body: string; sourceUrl: string; sourceStatus: "candidate" };

export function isStagingFuneralContentPreview(env = process.env.NEXT_PUBLIC_APP_ENV, vercelEnv = process.env.VERCEL_ENV) {
  return env === "staging" && vercelEnv !== "production";
}

export function getStagingFuneralCandidates(): FuneralCandidate[] {
  return [
    { title: "Orientación para el servicio", body: "Contenido histórico de COOPSAR recuperado para revisión humana. Consultá al equipo antes de tomar una decisión sobre el servicio.", sourceUrl: "https://www.coopsar.com.ar/portfolio-items/sepelio/", sourceStatus: "candidate" },
    { title: "Actualización de grupo familiar", body: "Podés iniciar una solicitud privada para que el equipo revise los integrantes informados. La actualización no se confirma automáticamente.", sourceUrl: "https://www.coopsar.com.ar/actualiza-planilla-de-sepelio/", sourceStatus: "candidate" },
  ];
}
