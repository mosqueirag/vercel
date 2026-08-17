"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { createJourneyId, createSessionId } from "../../lib/journey/ids";

type Answers = { type: "hogar" | "comercio" | "empresa"; zone: string; street: string; streetNumber: string };
type Plan = { id: string; name: string; slug: string; technology: string | null; speed_down_mbps: number | null; speed_up_mbps: number | null; price_amount: number | null; currency: string | null };
type CoverageResult = { coverageStatus: "available" | "nearby" | "planned" | "unavailable" | "unknown"; coverageSource: "exact_address" | "geographic_zone" | "unknown"; technology: string | null; technologies: string[]; commercialAvailability: boolean; plans: Plan[]; nextAction: "show_plans" | "coverage_validation" | "fiber_waitlist"; message: string };

export function InternetCenter() {
  const [answers, setAnswers] = useState<Answers>({ type: "hogar", zone: "", street: "", streetNumber: "" });
  const [selected, setSelected] = useState<Plan | null>(null);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<{ requestNumber: string; message: string; stored: boolean } | null>(null);
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [checkingCoverage, setCheckingCoverage] = useState(false);
  const [error, setError] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | null>(null);

  useEffect(() => { const controller = new AbortController(); void fetch("/api/public/contacts?service=internet", { signal: controller.signal }).then((response) => response.json()).then((data) => { const contact = (data.contacts || []).find((item: { channelType: string; purpose: string }) => item.channelType === "whatsapp" && item.purpose === "commercial"); if (contact?.value) setWhatsapp(String(contact.value)); }).catch(() => undefined); return () => controller.abort(); }, []);

  function journey() { const journeyId = sessionStorage.getItem("coopsar-journey-id") || createJourneyId(); const sessionId = sessionStorage.getItem("coopsar-session-id") || createSessionId(); sessionStorage.setItem("coopsar-journey-id", journeyId); sessionStorage.setItem("coopsar-session-id", sessionId); return { journeyId, sessionId }; }
  function track(eventType: string, result?: string) { const ids = journey(); void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...ids, eventType, result, page: "/#contratar", service: "fiber" }) }); }
  function requestType() { return coverage?.coverageStatus === "available" ? "installation" : coverage?.coverageStatus === "nearby" ? "coverage_validation" : "fiber_waitlist"; }

  async function checkCoverage() {
    setError("");
    if (answers.street.trim().length < 3 || !Number(answers.streetNumber)) { setError("Ingresá la calle y la altura para consultar datos reales."); return; }
    setCheckingCoverage(true);
    try {
      const response = await fetch("/api/coverage-check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ street: answers.street, number: answers.streetNumber, ...journey() }) });
      const data = await response.json() as CoverageResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos consultar la cobertura.");
      setCoverage(data); setSelected(data.plans[0] ?? null); if (data.plans.length) track("internet_plans_viewed", data.coverageStatus); setStep(2);
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
  return <section className="internet-hub" id="internet">
    <div className="section-heading"><div><span className="eyebrow">Internet y fibra óptica</span><h2>Internet para estar<br />siempre conectado</h2></div><p>Consultá únicamente servicios y planes publicados por COOPSAR. La cobertura final siempre se confirma antes de contratar.</p></div>
    <div className="internet-photo"><Image src="/images/coopsar-connectivity.png" alt="Técnico trabajando en infraestructura de conectividad en Sarmiento" fill sizes="(max-width: 900px) 100vw, 1200px" /></div>
    <div className="recommender" id="contratar">
      <div className="recommender-copy"><span className="eyebrow eyebrow-light">Recomendador inteligente</span><h3>Consultá el plan disponible en tu domicilio</h3><p>Buscamos servicios activos en la dirección indicada o en alturas cercanas de la misma calle. La factibilidad final requiere validación técnica.</p><div className="step-indicator"><span className={step >= 1 ? "active" : ""}>1</span><i /><span className={step >= 2 ? "active" : ""}>2</span><i /><span className={step >= 3 ? "active" : ""}>3</span></div></div>
      <div className="recommender-panel">
        {step === 1 && <div className="question-set"><label>¿Para quién es?<select value={answers.type} onChange={(e) => setAnswers({ ...answers, type: e.target.value as Answers["type"] })}><option value="hogar">Hogar</option><option value="comercio">Comercio</option><option value="empresa">Empresa</option></select></label><div className="field-row"><label>Calle<input required value={answers.street} onChange={(e) => setAnswers({ ...answers, street: e.target.value })} placeholder="Ej.: San Martín" /></label><label>Altura<input required inputMode="numeric" value={answers.streetNumber} onChange={(e) => setAnswers({ ...answers, streetNumber: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="Ej.: 1250" /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary" disabled={checkingCoverage} onClick={checkCoverage}>{checkingCoverage ? "Consultando disponibilidad…" : "Ver plan disponible"}</button></div>}
        {step === 2 && <div className="recommendation"><small>{coverage?.coverageSource === "geographic_zone" ? "Disponible en la zona — sujeto a validación técnica" : coverage?.coverageStatus === "available" ? "Información de cobertura" : "Validación requerida"}</small><h4>{coverage?.commercialAvailability ? "Planes compatibles" : coverage?.coverageSource === "geographic_zone" ? "Disponibilidad por zona" : coverage?.coverageStatus === "nearby" ? "Validación técnica requerida" : "Sin cobertura confirmada"}</h4>{coverage && <section className={`coverage-result ${coverage.coverageStatus}`} aria-live="polite"><p>{coverage.message}</p>{coverage.plans.map((plan) => <button type="button" className={selected?.id === plan.id ? "selected-plan" : ""} key={plan.id} onClick={() => { setSelected(plan); track("plan_selected", plan.slug); }}><strong>{plan.name}</strong>{plan.technology && <span>{plan.technology}</span>}{plan.speed_down_mbps && <span>{plan.speed_down_mbps} Mbps</span>}{plan.price_amount !== null && <span>{new Intl.NumberFormat("es-AR", { style: "currency", currency: plan.currency || "ARS", maximumFractionDigits: 0 }).format(plan.price_amount)}</span>}</button>)}</section>}<p>La instalación nueva queda sujeta a validación técnica. No informamos precios ni velocidades que no estén publicados.</p><div><button onClick={() => setStep(1)}>Modificar domicilio</button><button className="primary" onClick={() => { if (requestType() === "fiber_waitlist") track("fiber_waitlist_started"); setStep(3); }}>{operationLabel}</button></div></div>}
        {step === 3 && !result && <form className="lead-form" onSubmit={submit}><h4>{requestType() === "fiber_waitlist" ? "Datos para avisarte" : "Datos para contactarte"}</h4><div className="field-row"><label>Nombre y apellido<input required name="name" minLength={3} /></label><label>Teléfono<input required name="phone" type="tel" minLength={8} /></label></div><div className="field-row"><label>Correo electrónico (opcional)<input name="email" type="email" /></label><label>Domicilio<input required name="address" minLength={5} defaultValue={`${answers.street} ${answers.streetNumber}`.trim()} /></label></div><label>Barrio o zona (opcional)<input name="zone" /></label><label className="check"><input required name="consent" type="checkbox" /> Autorizo a COOPSAR a contactarme por esta solicitud.</label><label className="check"><input name="marketingOptIn" type="checkbox" /> Quiero recibir novedades de Internet/Fibra.</label>{error && <p className="form-error">{error}</p>}<button className="primary">Revisar y confirmar solicitud</button></form>}
        {result && <div className={result.stored ? "success-card" : "pending-card"}><strong>{result.stored ? "Solicitud recibida" : "Configuración pendiente"}</strong><p>{result.message}</p><b>{result.requestNumber}</b>{whatsapp ? <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, quiero consultar por internet. Solicitud ${result.requestNumber}.`)}`}>Continuar por WhatsApp →</a> : <p>El canal de contacto se publicará cuando COOPSAR lo confirme.</p>}</div>}
      </div>
    </div>
  </section>;
}
