"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createJourneyId, createSessionId } from "../../lib/journey/ids";
import { requestTypeFromCoverage } from "../../lib/coverage-request-type";
import { coveragePresentation } from "../../lib/coverage-presentation";
import { consumeInternetJourneyHandoff, showInternetPlansEvent, type InternetJourneyHandoff, type PublicCoverageResult, type ShowInternetPlansDetail } from "../../lib/internet/coverage-handoff";
import { hasPublishedCompatiblePlans } from "../../lib/internet/public-experience";

type Answers = { type: "hogar" | "comercio" | "empresa"; zone: string; street: string; streetNumber: string };
type Plan = PublicCoverageResult["plans"][number];
type CoverageResult = PublicCoverageResult;

export function InternetCenter({ variant = "home" }: { variant?: "home" | "page" }) {
  const [answers, setAnswers] = useState<Answers>({ type: "hogar", zone: "", street: "", streetNumber: "" });
  const [selected, setSelected] = useState<Plan | null>(null);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<{ requestNumber: string; message: string; stored: boolean } | null>(null);
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [checkingCoverage, setCheckingCoverage] = useState(false);
  const [error, setError] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const displayedPlanCoverage = useRef<string | null>(null);

  useEffect(() => { const controller = new AbortController(); void fetch("/api/public/contacts?service=internet", { signal: controller.signal }).then((response) => response.json()).then((data) => { const contact = (data.contacts || []).find((item: { channelType: string; purpose: string }) => item.channelType === "whatsapp" && item.purpose === "commercial"); if (contact?.value) setWhatsapp(String(contact.value)); }).catch(() => undefined); return () => controller.abort(); }, []);

  const journey = useCallback(() => { const journeyId = sessionStorage.getItem("coopsar-journey-id") || createJourneyId(); const sessionId = sessionStorage.getItem("coopsar-session-id") || createSessionId(); sessionStorage.setItem("coopsar-journey-id", journeyId); sessionStorage.setItem("coopsar-session-id", sessionId); return { journeyId, sessionId }; }, []);
  const track = useCallback((eventType: string, result?: string) => { const ids = journey(); void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...ids, eventType, result, page: variant === "page" ? "/internet" : "/#contratar", service: "internet" }) }); }, [journey, variant]);
  function requestType() { return requestTypeFromCoverage(coverage); }
  const showCoverage = useCallback((data: CoverageResult, street: string, streetNumber: string, destination: InternetJourneyHandoff["destination"] = "plans") => {
    setAnswers((current) => ({ ...current, street, streetNumber }));
    setCoverage(data);
    setSelected(data.plans[0] ?? null);
    setResult(null);
    setStep(destination === "plans" ? 2 : 3);
  }, []);

  useEffect(() => {
    const onShowPlans = (event: Event) => {
      const detail = (event as CustomEvent<ShowInternetPlansDetail>).detail;
      const handoff = detail?.handoff;
      if (!handoff) return;
      event.preventDefault();
      showCoverage(handoff.coverage, handoff.street, handoff.number, handoff.destination);
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      document.querySelector("#contratar")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    };
    window.addEventListener(showInternetPlansEvent, onShowPlans);
    return () => window.removeEventListener(showInternetPlansEvent, onShowPlans);
  }, [showCoverage]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const handoff = consumeInternetJourneyHandoff(sessionStorage);
      if (handoff) showCoverage(handoff.coverage, handoff.street, handoff.number, handoff.destination);
    });
    return () => { active = false; };
  }, [showCoverage]);

  useEffect(() => {
    if (step !== 2 || !coverage?.plans.length) return;
    const key = `${coverage.coverageSource}:${coverage.coverageStatus}:${coverage.plans.map((plan) => plan.id).join(",")}`;
    if (displayedPlanCoverage.current === key) return;
    displayedPlanCoverage.current = key;
    track("internet_plans_viewed", coverage.coverageStatus);
  }, [coverage, step, track]);

  async function checkCoverage() {
    setError("");
    if (answers.street.trim().length < 3 || !Number(answers.streetNumber)) { setError("Ingresá la calle y la altura para consultar datos reales."); return; }
    setCheckingCoverage(true);
    try {
      const response = await fetch("/api/coverage-check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ street: answers.street, number: answers.streetNumber, ...journey() }) });
      const data = await response.json() as CoverageResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos consultar la cobertura.");
      showCoverage(data, answers.street, answers.streetNumber, "plans");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos consultar la cobertura."); }
    finally { setCheckingCoverage(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget);
    if (!window.confirm("Confirmá que COOPSAR use estos datos para gestionar tu solicitud.")) return;
    const response = await fetch("/api/internet-leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerType: answers.type, name: form.get("name"), phone: form.get("phone"), email: form.get("email"), address: form.get("address"), street: answers.street, streetNumber: Number(answers.streetNumber), zone: form.get("zone") || "", plan: selected?.name || "", planId: selected?.id || null, coverageStatus: coverage?.coverageStatus || "unknown", requestType: requestType(), consent: form.get("consent") === "on", marketingOptIn: form.get("marketingOptIn") === "on", confirmed: true, source: "internet_recommender", ...journey() }) });
    const data = await response.json(); if (!response.ok) { setError(data.error || "No pudimos registrar la solicitud."); return; } setResult(data); track(requestType() === "fiber_waitlist" ? "fiber_waitlist_created" : "lead_created", requestType());
  }

  const operationLabel = requestType() === "fiber_waitlist" ? "Solicitar aviso de cobertura" : requestType() === "coverage_validation" ? "Solicitar validación técnica" : "Continuar con la solicitud";
  return <section className={`internet-hub ${variant === "page" ? "internet-hub-page" : ""}`} id="contratar">
    <div className="section-heading"><div><span className="eyebrow">Internet</span><h2>{variant === "page" ? "Decinos dónde querés instalarlo." : <>Internet para estar<br />siempre conectado</>}</h2></div><p>{variant === "page" ? "La disponibilidad se resuelve con datos oficiales y siempre requiere validación técnica final." : "Consultá únicamente servicios y planes publicados por COOPSAR. La cobertura final siempre se confirma antes de contratar."}</p></div>
    {variant === "home" && <div className="internet-photo"><Image src="/images/coopsar-connectivity.png" alt="Técnico trabajando en infraestructura de conectividad en Sarmiento" fill sizes="(max-width: 900px) 100vw, 1200px" /></div>}
    <div className="recommender" id="contratar">
      <div className="recommender-copy"><span className="eyebrow eyebrow-light">Recomendador inteligente</span><h3>Consultá el plan disponible en tu domicilio</h3><p>Buscamos servicios activos en la dirección indicada o en alturas cercanas de la misma calle. La factibilidad final requiere validación técnica.</p><div className="step-indicator"><span className={step >= 1 ? "active" : ""}>1</span><i /><span className={step >= 2 ? "active" : ""}>2</span><i /><span className={step >= 3 ? "active" : ""}>3</span></div></div>
      <div className="recommender-panel">
        {step === 1 && <div className="question-set"><label>¿Para quién es?<select value={answers.type} onChange={(e) => setAnswers({ ...answers, type: e.target.value as Answers["type"] })}><option value="hogar">Hogar</option><option value="comercio">Comercio</option><option value="empresa">Empresa</option></select></label><div className="field-row"><label>Calle<input required value={answers.street} onChange={(e) => setAnswers({ ...answers, street: e.target.value })} placeholder="Ej.: San Martín" /></label><label>Altura<input required inputMode="numeric" value={answers.streetNumber} onChange={(e) => setAnswers({ ...answers, streetNumber: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="Ej.: 1250" /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary" disabled={checkingCoverage} onClick={checkCoverage}>{checkingCoverage ? "Consultando disponibilidad…" : "Ver plan disponible"}</button></div>}
        {step === 2 && <div className="recommendation">{(() => { const presentation = coveragePresentation(coverage); const hasPlans = hasPublishedCompatiblePlans(coverage); return <><small>{presentation.eyebrow}</small><h4>{presentation.title}</h4>{coverage && <section className={`coverage-result ${coverage.coverageStatus}`} aria-live="polite"><p>{coverage.message}</p>{presentation.showTechnologies && <div className="coverage-technologies" aria-label="Tecnologías disponibles">{coverage.technologies.map((technology) => <span key={technology}>{technology === "WIRELESS" ? "Internet inalámbrico" : technology}</span>)}</div>}{hasPlans ? coverage.plans.map((plan) => <button type="button" className={selected?.id === plan.id ? "selected-plan" : ""} key={plan.id} onClick={() => { setSelected(plan); track("plan_selected", plan.slug); }}><strong>{plan.name}</strong>{plan.technology && <span>{plan.technology}</span>}{plan.speed_down_mbps && <span>{plan.speed_down_mbps} Mbps</span>}{plan.price_amount !== null && <span>{new Intl.NumberFormat("es-AR", { style: "currency", currency: plan.currency || "ARS", maximumFractionDigits: 0 }).format(plan.price_amount)}</span>}</button>) : <p>No hay planes publicados compatibles para mostrar. Podemos ayudarte con la validación técnica o el contacto comercial.</p>}</section>}<p>La instalación nueva queda sujeta a validación técnica. No informamos precios ni velocidades que no estén publicados.</p><div><button onClick={() => setStep(1)}>Modificar domicilio</button><button className="primary" onClick={() => { if (requestType() === "fiber_waitlist") track("fiber_waitlist_started"); setStep(3); }}>{operationLabel}</button></div></>; })()}</div>}
        {step === 3 && !result && <form className="lead-form" onSubmit={submit}><h4>{requestType() === "fiber_waitlist" ? "Datos para avisarte" : "Datos para contactarte"}</h4><div className="field-row"><label>Nombre y apellido<input required name="name" minLength={3} /></label><label>Teléfono<input required name="phone" type="tel" minLength={8} /></label></div><div className="field-row"><label>Correo electrónico (opcional)<input name="email" type="email" /></label><label>Domicilio<input required name="address" minLength={5} defaultValue={`${answers.street} ${answers.streetNumber}`.trim()} /></label></div><label>Barrio o zona (opcional)<input name="zone" /></label><label className="check"><input required name="consent" type="checkbox" /> Autorizo a COOPSAR a contactarme por esta solicitud.</label><label className="check"><input name="marketingOptIn" type="checkbox" /> Quiero recibir novedades de Internet.</label>{error && <p className="form-error">{error}</p>}<button className="primary">Revisar y confirmar solicitud</button></form>}
        {result && <div className={result.stored ? "success-card" : "pending-card"}><strong>{result.stored ? "Solicitud recibida" : "Configuración pendiente"}</strong><p>{result.message}</p><b>{result.requestNumber}</b>{whatsapp ? <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, quiero consultar por internet. Solicitud ${result.requestNumber}.`)}`}>Continuar por WhatsApp →</a> : <p>El canal de contacto se publicará cuando COOPSAR lo confirme.</p>}</div>}
      </div>
    </div>
  </section>;
}
