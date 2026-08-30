"use client";

import { useEffect, useMemo, useState } from "react";
import { usePublicContacts, type PublicContact } from "./public-contact-context";
import { internetCoveragePlanEvent, type InternetCoveragePlanDetail } from "../../lib/internet/coverage-plan-highlight";

export function resolveEnterpriseSalesWhatsApp(contacts: PublicContact[]) {
  const dedicated = contacts.find((contact) => contact.service === "commercial" && contact.channelType === "whatsapp" && contact.purpose === "commercial_sales");
  if (dedicated) return { contact: dedicated, label: "Hablar con Comercial" };
  const general = contacts.find((contact) => contact.service === "general" && contact.channelType === "whatsapp" && contact.purpose === "general_contact");
  return general ? { contact: general, label: "Hablar con COOPSAR" } : null;
}

export function InternetEnterprisePanel() {
  const contacts = usePublicContacts();
  const [coverage, setCoverage] = useState<InternetCoveragePlanDetail | null>(null);
  const salesChannel = useMemo(() => resolveEnterpriseSalesWhatsApp(contacts), [contacts]);

  useEffect(() => {
    const listener = (event: Event) => setCoverage((event as CustomEvent<InternetCoveragePlanDetail>).detail ?? null);
    window.addEventListener(internetCoveragePlanEvent, listener);
    return () => window.removeEventListener(internetCoveragePlanEvent, listener);
  }, []);

  function track() {
    const journeyId = sessionStorage.getItem("coopsar-journey-id");
    const sessionId = sessionStorage.getItem("coopsar-session-id");
    if (!journeyId || !sessionId) return;
    const technology = coverage?.technologies.find((item) => item === "FTTH" || item === "ADSL" || item === "WIRELESS") ?? null;
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId, sessionId, eventType: "enterprise_whatsapp_click", page: "/internet", service: "internet", result: "empresa", metadata: { source: "enterprise_panel", coverage_status: coverage?.coverageStatus, technology } }) });
  }

  const href = salesChannel ? `https://wa.me/${salesChannel.contact.value.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, quiero consultar Internet para mi empresa.")}` : null;
  const detectedTechnology = coverage?.technologies[0] === "WIRELESS" ? "Internet inalámbrico" : coverage?.technologies[0] === "FTTH" ? "Fibra óptica" : coverage?.technologies[0] ?? null;

  return <section className="internet-enterprise-panel" aria-labelledby="internet-enterprise-title">
    <span className="eyebrow eyebrow-light">Soluciones para empresas</span><h3 id="internet-enterprise-title">Internet para empresas</h3>
    <p>Consultá alternativas y velocidades según las necesidades de conectividad de tu empresa.</p>
    {detectedTechnology && <p className="internet-enterprise-coverage"><strong>Tecnología detectada:</strong> {detectedTechnology}</p>}
    {salesChannel && href && <div className="internet-enterprise-actions"><a className="public-action-button" href={href} onClick={track}>{salesChannel.label} <span aria-hidden="true">→</span></a></div>}
  </section>;
}
