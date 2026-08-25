"use client";

import Link from "next/link";
import { ContextualQuickActions } from "./assistant-ui";
import { useNavigationContext } from "./navigation-context";

export function GlobalJourneyNavigation() {
  const navigation = useNavigationContext();

  if (!navigation.intent || navigation.recommendedActions.length === 0) return null;
  return <aside className="global-contextual-shell" aria-label="Continuar gestión actual"><div><span>Gestión actual</span><strong>{navigation.service === "billing" ? "Facturas y pagos" : navigation.service === "energy" ? "Energía" : navigation.service === "internet" || navigation.service === "fiber" ? "Internet" : "COOPSAR"}</strong></div><ContextualQuickActions /><Link className="global-contextual-back" href="/#asistente">Volver a COOPIA ↑</Link></aside>;
}
