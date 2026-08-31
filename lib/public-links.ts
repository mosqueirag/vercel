export const PUBLIC_LINKS = {
  coopOnlineAndroid: "https://play.google.com/store/apps/details?id=com.Procoop.CoopOnline&hl=es_AR",
} as const;

export type CoopOnlineDownloadSource = "quick_actions_app" | "contact_app";

export function coopOnlineDownloadMetadata(source: CoopOnlineDownloadSource) {
  return {
    platform: "android" as const,
    source,
    destination: "google_play" as const,
  };
}
