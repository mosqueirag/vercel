"use client";

import { useCallback, type ReactNode } from "react";
import { coopOnlineDownloadMetadata, PUBLIC_LINKS, type CoopOnlineDownloadSource } from "../../lib/public-links";
import { useNavigationContext } from "./navigation-context";

type CoopOnlineDownloadLinkProps = {
  source: CoopOnlineDownloadSource;
  className?: string;
  children: ReactNode;
};

export function CoopOnlineDownloadLink({ source, className, children }: CoopOnlineDownloadLinkProps) {
  const navigation = useNavigationContext();
  const trackDownload = useCallback(() => {
    if (!navigation.journeyId || !navigation.sessionId) return;
    void fetch("/api/journey/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        journeyId: navigation.journeyId,
        sessionId: navigation.sessionId,
        eventType: "app_download_click",
        page: location.pathname,
        metadata: coopOnlineDownloadMetadata(source),
      }),
    }).catch(() => undefined);
  }, [navigation.journeyId, navigation.sessionId, source]);

  return <a className={className} href={PUBLIC_LINKS.coopOnlineAndroid} target="_blank" rel="noopener noreferrer" onClick={trackDownload} aria-label="Descargar COOP Online en Google Play">{children}</a>;
}
