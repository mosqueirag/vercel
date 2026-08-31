"use client";

import { useState } from "react";
import { createJourneyId, createSessionId } from "../../lib/journey/ids";
import { createInternetAudienceEvent, internetAudienceSelectedEvent, type InternetAudience } from "../../lib/internet/audience-selection";

const choices: Array<{ audience: InternetAudience; title: string; description: string }> = [
  { audience: "hogar", title: "Para mi hogar", description: "Ver planes para tu casa." },
  { audience: "comercio", title: "Para mi comercio", description: "Ver opciones para tu actividad." },
  { audience: "empresa", title: "Para mi empresa", description: "Consultar una alternativa comercial." },
];

export function InternetAudienceSelection() {
  const [selected, setSelected] = useState<InternetAudience | null>(null);
  function choose(audience: InternetAudience) {
    const journeyId = sessionStorage.getItem("coopsar-journey-id") || createJourneyId();
    const sessionId = sessionStorage.getItem("coopsar-session-id") || createSessionId();
    sessionStorage.setItem("coopsar-journey-id", journeyId);
    sessionStorage.setItem("coopsar-session-id", sessionId);
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(createInternetAudienceEvent(audience, journeyId, sessionId)) });
    setSelected(audience);
    window.dispatchEvent(new CustomEvent(internetAudienceSelectedEvent, { detail: { audience } }));
  }

  return <div className="internet-audience-grid" role="group" aria-label="Elegí el tipo de consulta">
    {choices.map((choice) => <button key={choice.audience} type="button" className={`public-action-card public-action-card--primary${selected === choice.audience ? " selected" : ""}`} aria-pressed={selected === choice.audience} onClick={() => choose(choice.audience)}>
      <strong>{choice.title}</strong><span>{choice.description}</span><i className="internet-audience-arrow" aria-hidden="true">→</i>
    </button>)}
  </div>;
}
