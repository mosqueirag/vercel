"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ContextualQuickActions } from "./assistant-ui";
import { useNavigationContext } from "./navigation-context";

export function GlobalJourneyNavigation() {
  const navigation = useNavigationContext();
  const pathname = usePathname();

  useEffect(() => {
    if (!navigation.journeyId || !navigation.sessionId) return;
    void fetch("/api/journey/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ journeyId: navigation.journeyId, sessionId: navigation.sessionId, eventType: "page_viewed", page: pathname, intent: navigation.intent, service: navigation.service }),
    });
  }, [navigation.intent, navigation.journeyId, navigation.service, navigation.sessionId, pathname]);

  if (!navigation.intent || navigation.recommendedActions.length === 0) return null;
  return <aside className="global-contextual-shell" aria-label="Continuar gestión actual"><div><span>Gestión actual</span><strong>{navigation.service === "billing" ? "Facturas y pagos" : navigation.service === "energy" ? "Energía" : navigation.service === "internet" ? "Internet" : "Internet y fibra"}</strong></div><ContextualQuickActions /><Link className="global-contextual-back" href="/#asistente">Volver a COOPIA ↑</Link></aside>;
}
