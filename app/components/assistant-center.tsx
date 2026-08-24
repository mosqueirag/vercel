"use client";

import Link from "next/link";
import { CoopiaConversation } from "./coopia-conversation";
import { usePublicContact } from "./public-contact-context";

export function AssistantCenter() {
  const virtualOffice = usePublicContact("billing", "virtual_office")?.value;
  return <section className="ai-center ai-center-home" id="asistente" aria-label="Asistencia inteligente de COOPSAR">
    <div className="ai-home-shell">
      <div className="ai-home-intro">
        <span className="eyebrow">Servicios públicos para tu día a día</span>
        <h1><span>Todo COOPSAR,</span><span>más simple.</span></h1>
        <p>Resolvé trámites, consultá servicios y encontrá la atención que necesitás desde un mismo lugar.</p>
        <div className="ai-home-actions">
          <Link href="#tramites" className="ai-home-primary">Ver servicios <span>→</span></Link>
          {virtualOffice ? <a href={virtualOffice} className="ai-home-secondary" target="_blank" rel="noreferrer">Oficina Virtual <span>↗</span></a> : null}
        </div>
        <p className="ai-home-note">También podés escribirnos con tus propias palabras: COOPIA te guía al próximo paso.</p>
      </div>
      <div className="ai-console"><CoopiaConversation home /></div>
    </div>
  </section>;
}
