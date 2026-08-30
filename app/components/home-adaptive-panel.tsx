"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { AssistantIntent } from "../../lib/ai/intents";
import { useNavigationContext } from "./navigation-context";

type Panel = { eyebrow: string; title: string; description: string; links: { label: string; href: string; detail: string; icon: string }[] };

export const homeAdaptivePanels: Partial<Record<AssistantIntent, Panel>> = {
  fiber_signup: { eyebrow: "Tu recorrido de Internet", title: "Avanzá directamente hacia la instalación", description: "Priorizamos cobertura, información del servicio y contacto comercial para que no tengas que recorrer el sitio.", links: [{ label: "Consultar cobertura", href: "/internet#contratar", detail: "Verificá el servicio disponible en tu domicilio.", icon: "⌁" }, { label: "Conocer Internet", href: "/internet", detail: "Revisá tecnología y condiciones confirmadas.", icon: "◌" }, { label: "Solicitar instalación", href: "/internet#contratar", detail: "Continuá con la solicitud comercial.", icon: "+" }] },
  fiber_coverage: { eyebrow: "Cobertura", title: "Encontrá el servicio disponible en tu domicilio", description: "La consulta usa el padrón existente y mantiene la validación técnica como instancia final.", links: [{ label: "Consultar domicilio", href: "/internet#contratar", detail: "Ingresá calle y altura.", icon: "⌁" }, { label: "Ver Internet", href: "/internet", detail: "Conocé la tecnología disponible.", icon: "◌" }] },
  internet_problem: { eyebrow: "Soporte de Internet", title: "Revisemos primero el estado del servicio", description: "Si no existe una incidencia general confirmada, podés continuar con diagnóstico y soporte.", links: [{ label: "Estado de servicios", href: "/#estado", detail: "Consultá incidencias publicadas.", icon: "!" }, { label: "Centro de ayuda", href: "/centro-de-ayuda", detail: "Seguí pasos de diagnóstico.", icon: "?" }, { label: "Contactar soporte", href: "/contacto", detail: "Continuá con una persona.", icon: "◌" }] },
  energy_problem: { eyebrow: "Asistencia de energía", title: "Accedé al estado y los canales de guardia", description: "Mostramos únicamente información operativa confirmada por COOPSAR.", links: [{ label: "Estado de energía", href: "/#estado", detail: "Verificá el estado publicado.", icon: "⚡" }, { label: "Cortes programados", href: "/cortes-programados", detail: "Consultá avisos vigentes.", icon: "◌" }, { label: "Informar un problema", href: "/energia", detail: "Accedé a guardia y reclamos.", icon: "!" }] },
};

export function HomeAdaptivePanel() {
  const navigation = useNavigationContext();
  const panel = navigation.intent ? homeAdaptivePanels[navigation.intent] : undefined;

  useEffect(() => {
    if (!panel || !navigation.journeyId || !navigation.sessionId) return;
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId: navigation.journeyId, sessionId: navigation.sessionId, eventType: "contextual_component_rendered", page: "/", intent: navigation.intent, service: navigation.service, action: "home_adaptive_panel" }) });
  }, [navigation.intent, navigation.journeyId, navigation.service, navigation.sessionId, panel]);

  // COOPIA already presents the official payment actions. Rendering another
  // panel here would repeat the same decision and introduce a second source
  // for the Oficina Virtual destination.
  if (!panel) return null;
  function trackNavigation(action: string) {
    if (!navigation.journeyId || !navigation.sessionId) return;
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId: navigation.journeyId, sessionId: navigation.sessionId, eventType: "navigation_executed", page: "/", intent: navigation.intent, service: navigation.service, action }) });
  }
  return <section className="home-adaptive" aria-live="polite"><header><span className="eyebrow">{panel.eyebrow}</span><h2>{panel.title}</h2><p>{panel.description}</p></header><div>{panel.links.map((link) => <Link className="public-action-card public-action-card--primary" href={link.href} key={`${navigation.intent}-${link.label}`} onClick={() => trackNavigation(link.label)}><i className="public-action-icon" aria-hidden="true">{link.icon}</i><span className="public-action-copy"><strong>{link.label}</strong><span>{link.detail}</span></span><b className="public-action-arrow" aria-hidden="true">→</b></Link>)}</div></section>;
}
