"use client";

import Link from "next/link";
import { useCoopia } from "../components/coopia-context";
import { usePublicContact } from "../components/public-contact-context";
import { procedures, type Procedure } from "../../lib/procedures/catalog";
import { isExternalProcedureHref, resolveProcedureHref } from "./procedure-links";

function ProcedureCard({ procedure }: { procedure: Procedure }) {
  const coopia = useCoopia();
  const virtualOffice = usePublicContact("billing", "virtual_office")?.value;
  const href = resolveProcedureHref(procedure, virtualOffice);
  const external = isExternalProcedureHref(href);

  const trackSelection = () => {
    if (!coopia.journeyId || !coopia.sessionId) return;
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId: coopia.journeyId, sessionId: coopia.sessionId, eventType: "procedure_selected", page: "/tramites", intent: procedure.intent, service: procedure.service, metadata: { procedure_id: procedure.id, resolution_type: procedure.resolutionType, source: "procedures_center" } }) }).catch(() => undefined);
  };
  const beginWithCoopia = () => {
    if (!procedure.prompt) return;
    trackSelection();
    // An explicit click opens the one global assistant and keeps its session.
    coopia.setOpen(true);
    void coopia.ask(procedure.prompt);
  };

  const content = <><i className="public-action-icon" aria-hidden="true">{procedure.icon}</i><span className="procedure-card-copy"><strong>{procedure.title}</strong><small>{procedure.description}</small></span><b className="public-action-arrow" aria-hidden="true">→</b></>;
  if (procedure.resolutionType === "coopia") return <button type="button" className="procedure-card public-action-card public-action-card--primary" onClick={beginWithCoopia}>{content}</button>;
  if (!href) return null;
  return external
    ? <a className="procedure-card public-action-card public-action-card--primary" href={href} target="_blank" rel="noopener noreferrer" onClick={trackSelection}>{content}</a>
    : <Link className="procedure-card public-action-card public-action-card--primary" href={href} onClick={trackSelection}>{content}</Link>;
}

export function ProcedureCenter() {
  const coopia = useCoopia();
  return <>
    <section className="procedures-grid" aria-label="Gestiones principales">{procedures.map((procedure) => <ProcedureCard procedure={procedure} key={procedure.id} />)}</section>
    <section className="procedures-help" aria-labelledby="procedures-help-title"><div><span className="eyebrow">Orientación</span><h2 id="procedures-help-title">¿No encontrás lo que necesitás?</h2><p>Contanos tu consulta y te llevamos al próximo paso con información y canales oficiales.</p></div><button type="button" className="public-action-button" onClick={() => { coopia.setOpen(true); void coopia.ask("Necesito orientación sobre un trámite"); }}>Preguntarle a COOPIA <span className="public-action-arrow" aria-hidden="true">→</span></button></section>
  </>;
}
