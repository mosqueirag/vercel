"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { AssistantIntent } from "../../lib/ai/intents";
import { useNavigationContext } from "./navigation-context";

type Panel = { eyebrow: string; title: string; description: string; links: { label: string; href: string; detail: string }[] };

const panels: Partial<Record<AssistantIntent, Panel>> = {
  fiber_signup: { eyebrow: "Tu recorrido de fibra", title: "Avanzá directamente hacia la instalación", description: "Priorizamos cobertura, información del servicio y contacto comercial para que no tengas que recorrer el sitio.", links: [{ label: "Consultar cobertura", href: "/#contratar", detail: "Verificá el servicio disponible en tu domicilio." }, { label: "Conocer Internet y fibra", href: "/internet", detail: "Revisá tecnología y condiciones confirmadas." }, { label: "Solicitar instalación", href: "/#contratar", detail: "Continuá con la solicitud comercial." }] },
  fiber_coverage: { eyebrow: "Cobertura", title: "Encontrá el servicio disponible en tu domicilio", description: "La consulta usa el padrón existente y mantiene la validación técnica como instancia final.", links: [{ label: "Consultar domicilio", href: "/#contratar", detail: "Ingresá calle y altura." }, { label: "Ver fibra óptica", href: "/fibra-optica", detail: "Conocé el servicio." }] },
  internet_problem: { eyebrow: "Soporte de Internet", title: "Revisemos primero el estado del servicio", description: "Si no existe una incidencia general confirmada, podés continuar con diagnóstico y soporte.", links: [{ label: "Estado de servicios", href: "/#estado", detail: "Consultá incidencias publicadas." }, { label: "Centro de ayuda", href: "/centro-de-ayuda", detail: "Seguí pasos de diagnóstico." }, { label: "Contactar soporte", href: "/contacto", detail: "Continuá con una persona." }] },
  energy_problem: { eyebrow: "Asistencia de energía", title: "Accedé al estado y los canales de guardia", description: "Mostramos únicamente información operativa confirmada por COOPSAR.", links: [{ label: "Estado de energía", href: "/#estado", detail: "Verificá el estado publicado." }, { label: "Cortes programados", href: "/cortes-programados", detail: "Consultá avisos vigentes." }, { label: "Informar un problema", href: "/energia", detail: "Accedé a guardia y reclamos." }] },
  pay_invoice: { eyebrow: "Facturas y pagos", title: "Resolvé tu factura desde los accesos oficiales", description: "Te llevamos directamente a la Oficina Virtual y a la información de medios de pago.", links: [{ label: "Oficina Virtual", href: "https://www.cooponlineweb.com.ar/SARMIENTO/Login", detail: "Consultá deuda, facturas y pagos." }, { label: "Medios de pago", href: "/medios-de-pago", detail: "Revisá las alternativas disponibles." }] },
};

export function HomeAdaptivePanel() {
  const navigation = useNavigationContext();
  const panel = navigation.intent ? panels[navigation.intent] : undefined;

  useEffect(() => {
    if (!panel || !navigation.journeyId || !navigation.sessionId) return;
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId: navigation.journeyId, sessionId: navigation.sessionId, eventType: "contextual_component_rendered", page: "/", intent: navigation.intent, service: navigation.service, action: "home_adaptive_panel" }) });
  }, [navigation.intent, navigation.journeyId, navigation.service, navigation.sessionId, panel]);

  if (!panel) return null;
  function trackNavigation(action: string) {
    if (!navigation.journeyId || !navigation.sessionId) return;
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId: navigation.journeyId, sessionId: navigation.sessionId, eventType: "navigation_executed", page: "/", intent: navigation.intent, service: navigation.service, action }) });
  }
  return <section className="home-adaptive" aria-live="polite"><header><span className="eyebrow">{panel.eyebrow}</span><h2>{panel.title}</h2><p>{panel.description}</p></header><div>{panel.links.map((link) => <Link href={link.href} key={`${navigation.intent}-${link.label}`} onClick={() => trackNavigation(link.label)}><strong>{link.label}</strong><span>{link.detail}</span><b>→</b></Link>)}</div></section>;
}
