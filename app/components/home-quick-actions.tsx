"use client";

import Link from "next/link";
import { useCallback } from "react";
import { homeQuickActions, quickActionAnalyticsMetadata, resolveHomeQuickActionHref, type HomeQuickAction } from "../../lib/home/quick-actions";
import type { PublicServiceStatus } from "../../lib/tools/service-status";
import { useNavigationContext } from "./navigation-context";
import { usePublicContacts } from "./public-contact-context";

type ServiceStatus = { name: string; status: PublicServiceStatus; detail: string };

function energyStatusCopy(services: readonly ServiceStatus[]) {
  const energy = services.find((service) => service.name === "Energía");
  if (!energy || energy.status === "unknown" || energy.status === "operational") return null;
  return energy.status === "maintenance" ? "Mantenimiento programado" : "Interrupción publicada";
}

function isExternal(href: string) {
  return href.startsWith("https://") || href.startsWith("http://");
}

export function HomeQuickActions({ services }: { services: readonly ServiceStatus[] }) {
  const contacts = usePublicContacts();
  const navigation = useNavigationContext();
  const energyStatus = energyStatusCopy(services);

  const track = useCallback((action: HomeQuickAction, href: string) => {
    if (!navigation.journeyId || !navigation.sessionId) return;
    void fetch("/api/journey/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        journeyId: navigation.journeyId,
        sessionId: navigation.sessionId,
        eventType: "quick_access_click",
        page: "/",
        metadata: quickActionAnalyticsMetadata(action, href),
      }),
    }).catch(() => undefined);
  }, [navigation.journeyId, navigation.sessionId]);

  return <section className="home-quick-actions section" aria-labelledby="home-quick-actions-title">
    <div className="section-heading home-quick-actions-heading">
      <div><span className="eyebrow">Accesos directos</span><h2 id="home-quick-actions-title">Resolvé lo que necesitás</h2></div>
      <p>Elegí una acción y llegá directamente al próximo paso.</p>
    </div>
    <div className="home-quick-actions-grid">
      {homeQuickActions.map((action) => {
        const href = resolveHomeQuickActionHref(action, contacts);
        const className = `home-quick-action public-action-card public-action-card--primary action-${action.id}${action.accent ? ` ${action.accent}` : ""}`;
        const content = <><span className="home-quick-action-icon" aria-hidden="true">{action.icon}</span><span className="home-quick-action-copy"><strong>{action.title}</strong><small>{action.description}</small>{action.id === "energy_outage" && energyStatus ? <em>{energyStatus}</em> : null}</span><span className="home-quick-action-arrow" aria-hidden="true">→</span></>;
        return isExternal(href)
          ? <a className={className} href={href} key={action.id} onClick={() => track(action, href)}>{content}</a>
          : <Link className={className} href={href} key={action.id} onClick={() => track(action, href)}>{content}</Link>;
      })}
    </div>
    <Link className="home-quick-actions-all" href="/tramites">Ver todos los trámites <span aria-hidden="true">→</span></Link>
  </section>;
}
