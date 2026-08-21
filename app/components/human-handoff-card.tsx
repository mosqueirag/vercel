"use client";
import { CONTACT } from "../../lib/coopsar-data";
import { useNavigationContext } from "./navigation-context";
import { usePublicContact } from "./public-contact-context";
import { handoffSummary, officialWhatsAppHandoffUrl } from "../../lib/coopia/session";
function track(journeyId: string, sessionId: string, eventType: string) { if (journeyId && sessionId) void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId, sessionId, eventType, page: `${location.pathname}${location.hash}` }) }); }
export function HumanHandoffCard() { const nav = useNavigationContext(); const officialWhatsApp = usePublicContact("general", "general_contact")?.value; const handoffUrl = officialWhatsAppHandoffUrl(officialWhatsApp || CONTACT.whatsapp, handoffSummary({ intent: nav.intent, service: nav.service, lastStep: nav.currentStep })) || "#"; return <section className="assistant-card"><div><small>Atención personal</small><h3>Continuar con un operador</h3><p>Podés abrir WhatsApp y seguir la consulta con nuestro equipo.</p><a className="assistant-action" href={handoffUrl} onClick={() => { track(nav.journeyId, nav.sessionId, "human_handoff_requested"); track(nav.journeyId, nav.sessionId, "human_handoff_opened"); track(nav.journeyId, nav.sessionId, "coopia_handoff"); }}>Abrir WhatsApp →</a></div></section>; }
