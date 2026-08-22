"use client";
import { CONTACT } from "../../lib/coopsar-data";
import type { AssistantResult } from "../../lib/ai/results";
import { humanHandoffActionEventTypes } from "../../lib/coopia/action-events";
import { useNavigationContext } from "./navigation-context";
import { usePublicContact } from "./public-contact-context";
import { handoffSummary, officialWhatsAppHandoffUrl } from "../../lib/coopia/session";
import { useCoopia } from "./coopia-context";

export function HumanHandoffCard({ result }: { result: AssistantResult }) {
  const nav = useNavigationContext();
  const coopia = useCoopia();
  const officialWhatsApp = usePublicContact("general", "general_contact")?.value;
  const handoffUrl = officialWhatsAppHandoffUrl(officialWhatsApp || CONTACT.whatsapp, handoffSummary({ intent: result.intent, service: result.service, lastStep: result.nextStep })) || "#";
  const context = { intent: result.intent, service: result.service };
  return <section className="assistant-card"><div><small>Atención personal</small><h3>Continuar con un operador</h3><p>Podés abrir WhatsApp y seguir la consulta con nuestro equipo.</p><a className="assistant-action" href={handoffUrl} onClick={() => { nav.recordAction("OPEN_WHATSAPP"); for (const eventType of humanHandoffActionEventTypes()) coopia.track(eventType, eventType === "coopia_action_clicked" ? { orchestration_intent: result.orchestration.intent } : undefined, "OPEN_WHATSAPP", undefined, undefined, context); }}>Abrir WhatsApp →</a></div></section>;
}
