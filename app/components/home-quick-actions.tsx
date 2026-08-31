"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { homeQuickActions, quickActionAnalyticsMetadata, resolveHomeQuickActionHref, type HomeQuickAction } from "../../lib/home/quick-actions";
import { homePriorityAnalyticsMetadata, homePriorityEventKey, prioritizeHomeQuickActions, resolveHomePriority } from "../../lib/home/home-priority";
import type { PublicServiceStatus } from "../../lib/tools/service-status";
import { useNavigationContext } from "./navigation-context";
import { usePublicContacts } from "./public-contact-context";
import { CoopOnlineQuickAction } from "./coop-online-promo";

type ServiceStatus = { name: string; status: PublicServiceStatus; detail: string };
const homePriorityStorageKey = "coopsar-home-priority-events-v1";

function energyStatusCopy(services: readonly ServiceStatus[]) {
  const energy = services.find((service) => service.name === "Energía");
  if (!energy || energy.status === "unknown" || energy.status === "operational") return null;
  return energy.status === "maintenance" ? "Mantenimiento programado" : "Interrupción publicada";
}

function isExternal(href: string) {
  return href.startsWith("https://");
}

export function HomeQuickActions({ services }: { services: readonly ServiceStatus[] }) {
  const contacts = usePublicContacts();
  const navigation = useNavigationContext();
  const energyStatus = energyStatusCopy(services);
  const priority = useMemo(() => resolveHomePriority(navigation.intent, navigation.service), [navigation.intent, navigation.service]);
  const orderedActions = useMemo(() => prioritizeHomeQuickActions(homeQuickActions, priority.quickAction), [priority.quickAction]);

  useEffect(() => {
    if (!priority.quickAction || !navigation.journeyId || !navigation.sessionId) return;
    const key = homePriorityEventKey(navigation.journeyId, navigation.intent, priority.quickAction);
    const seen = new Set<string>();
    try {
      for (const value of JSON.parse(sessionStorage.getItem(homePriorityStorageKey) ?? "[]") as unknown[]) if (typeof value === "string") seen.add(value);
    } catch { sessionStorage.removeItem(homePriorityStorageKey); }
    if (seen.has(key)) return;
    seen.add(key);
    sessionStorage.setItem(homePriorityStorageKey, JSON.stringify([...seen].slice(-20)));
    void fetch("/api/journey/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        journeyId: navigation.journeyId,
        sessionId: navigation.sessionId,
        eventType: "home_priority_applied",
        page: "/",
        intent: navigation.intent,
        service: navigation.service,
        metadata: homePriorityAnalyticsMetadata(priority.quickAction),
      }),
    }).catch(() => undefined);
  }, [navigation.intent, navigation.journeyId, navigation.service, navigation.sessionId, priority.quickAction]);

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

  return <section className="home-quick-actions section" id="tramites" aria-labelledby="home-quick-actions-title">
    <div className="section-heading home-quick-actions-heading">
      <div><span className="eyebrow">Accesos directos</span><h2 id="home-quick-actions-title">Elegí qué necesitás hacer</h2></div>
      <Link className="home-quick-actions-all public-action-button" href="/tramites">Ver todos los trámites <span className="public-action-arrow" aria-hidden="true">→</span></Link>
    </div>
    <div className="home-quick-actions-grid">
      {orderedActions.map((action) => {
        const href = resolveHomeQuickActionHref(action, contacts);
        const className = `home-quick-action public-action-card public-action-card--primary action-${action.id}${action.accent ? ` ${action.accent}` : ""}`;
        const content = <><span className="home-quick-action-icon" aria-hidden="true">{action.icon}</span><span className="home-quick-action-copy"><strong>{action.title}</strong><small>{action.description}</small>{action.id === "energy_outage" && energyStatus ? <em>{energyStatus}</em> : null}</span><span className="home-quick-action-arrow" aria-hidden="true">→</span></>;
        const priorityProps = action.id === priority.quickAction ? { "data-priority": "true" } : {};
        return isExternal(href)
          ? <a className={className} href={href} key={action.id} onClick={() => track(action, href)} {...priorityProps}>{content}</a>
          : <Link className={className} href={href} key={action.id} onClick={() => track(action, href)} {...priorityProps}>{content}</Link>;
      })}
      <CoopOnlineQuickAction />
    </div>
  </section>;
}
