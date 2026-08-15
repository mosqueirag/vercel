"use client";
import { CONTACT } from "../../lib/coopsar-data";
import { useNavigationContext } from "./navigation-context";
function track(journeyId: string, sessionId: string, eventType: string) { if (journeyId && sessionId) void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId, sessionId, eventType, page: `${location.pathname}${location.hash}` }) }); }
export function HumanHandoffCard() { const nav = useNavigationContext(); return <section className="assistant-card"><div><small>Atención personal</small><h3>Continuar con un operador</h3><p>Podés abrir WhatsApp y seguir la consulta con nuestro equipo.</p><a className="assistant-action" href={`https://wa.me/${CONTACT.whatsapp}`} onClick={() => { track(nav.journeyId, nav.sessionId, "human_handoff_requested"); track(nav.journeyId, nav.sessionId, "human_handoff_opened"); }}>Abrir WhatsApp →</a></div></section>; }
