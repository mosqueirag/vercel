"use client";

import { createJourneyId, createSessionId } from "../../lib/journey/ids";
import { createInternetAudienceEvent, internetAudienceSelectedEvent, type InternetAudience } from "../../lib/internet/audience-selection";

const choices: Array<{ audience: InternetAudience; title: string; description: string }> = [
  { audience: "hogar", title: "Para mi hogar", description: "Uso residencial." },
  { audience: "comercio", title: "Para mi comercio", description: "Conectividad para mi actividad comercial." },
  { audience: "empresa", title: "Para mi empresa", description: "Una consulta orientada a mi organización." },
];

export function InternetAudienceSelection() {
  function choose(audience: InternetAudience) {
    const journeyId = sessionStorage.getItem("coopsar-journey-id") || createJourneyId();
    const sessionId = sessionStorage.getItem("coopsar-session-id") || createSessionId();
    sessionStorage.setItem("coopsar-journey-id", journeyId);
    sessionStorage.setItem("coopsar-session-id", sessionId);
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(createInternetAudienceEvent(audience, journeyId, sessionId)) });
    window.dispatchEvent(new CustomEvent(internetAudienceSelectedEvent, { detail: { audience } }));
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.querySelector("#contratar")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return <div className="internet-audience-grid" aria-label="Elegí el tipo de consulta">
    {choices.map((choice) => <button key={choice.audience} type="button" onClick={() => choose(choice.audience)}>
      <strong>{choice.title}</strong><span>{choice.description}</span><b aria-hidden="true">→</b>
    </button>)}
  </div>;
}
