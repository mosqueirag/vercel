"use client";

import { FormEvent, useEffect, useState } from "react";
import type { AssistantResult } from "../../lib/ai/results";
import { useNavigationContext } from "./navigation-context";
import { useCoopia } from "./coopia-context";
import { ServiceRequestForm } from "./service-request-form";
import { HumanHandoffCard } from "./human-handoff-card";
import { coveragePresentation } from "../../lib/coverage-presentation";
import { coopiaActionEventTypes } from "../../lib/coopia/action-events";
import { coverageActionIdsForStep, visibleActionIdsForResult, visibleAssistantActions } from "../../lib/coopia/result-tracking";
import { coopiaStepActions } from "../../lib/coopia/interaction-flow";
import { createInternetJourneyHandoff, internetJourneyCanonicalHref, saveInternetJourneyHandoff, showInternetPlansEvent, type PublicCoverageResult } from "../../lib/internet/coverage-handoff";

type Coverage = PublicCoverageResult;

function track(journeyId: string, sessionId: string, eventType: string, action?: string, result?: string, metadata?: { routingWindow: "office_hours" | "after_hours"; contactPurpose: string }, context?: Pick<AssistantResult, "intent" | "service">) { if (journeyId && sessionId) void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId, sessionId, eventType, action, result, metadata, intent: context?.intent, service: context?.service, page: `${location.pathname}${location.hash}` }) }); }
function ActionLink({ action, complaintRoute, resultContext, primary = false }: { action: AssistantResult["actions"][number]; complaintRoute?: AssistantResult["complaintRoute"]; resultContext?: Pick<AssistantResult, "intent" | "service">; primary?: boolean }) { const nav = useNavigationContext(); if (!action.href) return null; return <a className={`assistant-action ${primary ? "assistant-action-primary" : ""}`} href={action.href} onClick={() => { nav.recordAction(action.id); const complaint = action.id === "OPEN_COMPLAINT_WHATSAPP"; for (const eventType of coopiaActionEventTypes(action.id)) track(nav.journeyId, nav.sessionId, eventType, action.id, resultContext?.service, complaint && eventType === "complaint_whatsapp_opened" && complaintRoute ? { routingWindow: complaintRoute.routingWindow, contactPurpose: complaintRoute.contactPurpose } : undefined, resultContext); }}>{action.label} <span>→</span></a>; }

function FiberCoverageCard({ result, resultKey }: { result: AssistantResult; resultKey: string }) {
  const nav = useNavigationContext();
  const { recordShownActions, setOpen } = useCoopia();
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const coverageStep = !coverage ? "address" : coverage.plans.length > 0 ? "plans" : coverage.nextAction === "fiber_waitlist" ? "waitlist" : "validation";
  const visibleCoverageActionIds = coverageActionIdsForStep(result, coverageStep);

  useEffect(() => {
    if (coverage) recordShownActions(result, resultKey, visibleCoverageActionIds);
  }, [coverage, recordShownActions, result, resultKey, visibleCoverageActionIds]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    track(nav.journeyId, nav.sessionId, "form_started", "CHECK_COVERAGE");
    try {
      const response = await fetch("/api/coverage-check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ street, number, journeyId: nav.journeyId, sessionId: nav.sessionId }) });
      const data = await response.json() as Coverage & { error?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos consultar la cobertura.");
      setCoverage(data);
      track(nav.journeyId, nav.sessionId, "form_completed", "CHECK_COVERAGE", data.coverageStatus);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos consultar la cobertura.");
    } finally {
      setLoading(false);
    }
  }

  const hasCompatiblePlans = Boolean(coverage?.plans.length);
  const action = hasCompatiblePlans ? "Ver planes" : coverage?.nextAction === "fiber_waitlist" ? "Solicitar aviso de cobertura" : coverage?.nextAction === "coverage_validation" ? "Solicitar validación técnica" : "Continuar con la solicitud";
  const target = internetJourneyCanonicalHref;
  const actionId = hasCompatiblePlans ? "SHOW_INTERNET_PLANS" : coverage?.nextAction === "fiber_waitlist" ? "START_FIBER_WAITLIST" : "REQUEST_COVERAGE_VALIDATION";
  const presentation = coveragePresentation(coverage);
  return <section className="assistant-card coverage-card">
    <header><h3>¿Dónde querés instalar Internet?</h3></header>
    {!coverage ? <form onSubmit={submit}>
      <label>Calle<input value={street} minLength={3} required onChange={(event) => setStreet(event.target.value)} placeholder="Ej.: San Martín" /></label>
      <label>Altura<input value={number} required inputMode="numeric" onChange={(event) => setNumber(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Ej.: 1250" /></label>
      <button disabled={loading}>{loading ? "Consultando…" : "Consultar cobertura"}</button>
      {error && <p role="alert" className="form-error">{error}</p>}
    </form> : <div className={`assistant-result ${coverage.coverageStatus}`}>
      <h4>{presentation.title}</h4>
      <p>{coverage.message}</p>
      <div className="assistant-card-actions">
        <a className="assistant-action assistant-action-primary" href={target} onClick={(event) => {
          if (!coverage) return;
          const handoff = createInternetJourneyHandoff({ street, number, coverage });
          const samePageHandoff = new CustomEvent(showInternetPlansEvent, { detail: { handoff }, cancelable: true });
          nav.recordAction(actionId);
          const handledOnThisPage = !window.dispatchEvent(samePageHandoff);
          if (handledOnThisPage) {
            event.preventDefault();
          } else {
            saveInternetJourneyHandoff(sessionStorage, handoff);
            setOpen(false);
          }
          track(nav.journeyId, nav.sessionId, coverage.nextAction === "fiber_waitlist" ? "fiber_waitlist_started" : "navigation_executed", actionId, undefined, undefined, result);
        }}>{action} <span>→</span></a>
        <button type="button" className="assistant-action" onClick={() => setCoverage(null)}>Modificar domicilio</button>
      </div>
    </div>}
  </section>;
}

function SimpleCard({ result }: { result: AssistantResult }) { const incident = ["outage", "partial", "maintenance"].includes(String(result.ui?.data.status)); const payment = result.ui?.type === "payment"; const actions = coopiaStepActions(result.actions); return <section className={`assistant-card ${payment ? "payment-card" : "status-card"}`}><div className="assistant-status-icon">{payment ? "$" : incident ? "!" : "i"}</div><div><small>{payment ? "Facturas y pagos" : `Estado de ${String(result.ui?.data.service || "servicio")}`}</small><h3>{payment ? "Pagá o consultá tu factura" : incident ? "Incidencia informada" : "Sin incidencia general confirmada"}</h3><p>{result.message}</p><div className="assistant-card-actions">{actions.map((action, index) => <ActionLink action={action} primary={index === 0} complaintRoute={result.complaintRoute} resultContext={result} key={action.id} />)}</div></div></section>; }
function ComplaintServicePicker({ onSelect }: { onSelect: (service: string) => void }) { return <section className="assistant-card"><small>Reclamos</small><h3>Elegí el servicio</h3><div className="assistant-card-actions">{["Energía", "Internet/Fibra", "Telefonía", "Sepelio"].map((service) => <button type="button" className="assistant-action" key={service} onClick={() => onSelect(service)}>{service}</button>)}</div></section>; }
const serviceTitles: Record<AssistantResult["service"], string> = { billing: "Facturas y pagos", energy: "Servicio de energía", internet: "Servicio de Internet", fiber: "Fibra óptica", phone: "Telefonía", funeral: "Servicio de sepelio", general: "Información de COOPSAR" };

function GenericActionsCard({ result }: { result: AssistantResult }) {
  const actions = coopiaStepActions(visibleAssistantActions(result.actions));
  if (actions.length === 0) return null;
  return <section className="assistant-card generic-actions-card"><h3>{serviceTitles[result.service]}</h3>{result.message !== serviceTitles[result.service] && <p>{result.message}</p>}<div className="assistant-card-actions">{actions.map((action, index) => <ActionLink action={action} primary={index === 0} complaintRoute={result.complaintRoute} resultContext={result} key={action.id} />)}</div></section>;
}

export function AssistantUIRenderer({ result, resultKey, onComplaintServiceSelect }: { result: AssistantResult; resultKey: string; onComplaintServiceSelect?: (service: string) => void }) {
  const nav = useNavigationContext();
  const { recordShownActions } = useCoopia();
  const actionIds = visibleActionIdsForResult(result);
  useEffect(() => { track(nav.journeyId, nav.sessionId, "contextual_component_rendered", result.ui?.type, result.intent, undefined, result); }, [nav.journeyId, nav.sessionId, result]);
  useEffect(() => { recordShownActions(result, resultKey, actionIds); }, [actionIds, recordShownActions, result, resultKey]);
  if (result.ui?.type === "fiber_coverage" || result.ui?.type === "internet_plans") return <FiberCoverageCard result={result} resultKey={resultKey} />;
  if (result.ui?.type === "service_request_form") return <ServiceRequestForm requestType={String(result.ui.data.requestType || "")} />;
  if (result.ui?.type === "human_handoff") return <HumanHandoffCard result={result} />;
  if (result.ui?.type === "complaint_service_picker" && onComplaintServiceSelect) return <ComplaintServicePicker onSelect={onComplaintServiceSelect} />;
  if (result.ui?.type === "service_status" || result.ui?.type === "payment") return <SimpleCard result={result} />;
  return <GenericActionsCard result={result} />;
}
export function ContextualQuickActions() { const nav = useNavigationContext(); const intent = nav.intent; if (!intent || nav.recommendedActions.length === 0) return null; return <nav className="contextual-actions" aria-label="Acciones recomendadas"><strong>Acciones para tu consulta</strong><div>{nav.recommendedActions.map((action) => <ActionLink action={action} resultContext={{ intent, service: nav.service || "general" }} key={action.id} />)}</div></nav>; }
