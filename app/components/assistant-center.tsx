"use client";

import { CoopiaConversation } from "./coopia-conversation";

export function AssistantCenter() {
  return <section className="ai-center" id="asistente" aria-labelledby="assistant-title">
    <div className="ai-heading"><span className="eyebrow">COOPIA · Asistente COOPSAR</span><h1 id="assistant-title">Resolvé lo que necesitás en un solo lugar.</h1><p>Consultá, realizá trámites o conocé nuestros servicios sin tener que buscar en el menú.</p></div>
    <div className="ai-console"><div className="ai-status"><span className="assistant-avatar">✦</span><div><strong>COOPIA</strong><small>Asistente digital de COOPSAR</small></div><i /> <small>Orientación inmediata</small></div><CoopiaConversation /></div>
  </section>;
}
