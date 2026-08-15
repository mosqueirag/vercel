"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { CONTACT, internetPlans } from "../../lib/coopsar-data";

type Answers = { type: "hogar" | "comercio" | "empresa"; people: number; devices: number; intensive: boolean; zone: string; street: string; streetNumber: string };
type CoverageResult = { status: "exact" | "probable" | "unknown" | "configuration_pending"; message: string; service?: { planName: string; technology: string; speedMbps: number | null } | null };

export function InternetCenter() {
  const [answers, setAnswers] = useState<Answers>({ type: "hogar", people: 2, devices: 4, intensive: false, zone: "", street: "", streetNumber: "" });
  const [selected, setSelected] = useState("hogar");
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<{ requestNumber: string; message: string; stored: boolean } | null>(null);
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [checkingCoverage, setCheckingCoverage] = useState(false);
  const [error, setError] = useState("");
  async function checkCoverage() {
    setError("");
    if (answers.street.trim().length < 3 || !Number(answers.streetNumber)) { setError("Ingresá la calle y la altura para consultar datos reales."); return; }
    setCheckingCoverage(true);
    try {
      const response = await fetch("/api/coverage-check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ street: answers.street, number: answers.streetNumber }) });
      const data = await response.json() as CoverageResult & { error?: string };
      if (!response.ok && data.status !== "configuration_pending") throw new Error(data.error || "No pudimos consultar la cobertura.");
      setCoverage(data); setSelected(data.service?.planName ?? ""); setStep(2);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos consultar la cobertura."); }
    finally { setCheckingCoverage(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/internet-leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerType: answers.type, name: form.get("name"), phone: form.get("phone"), email: form.get("email"), address: form.get("address"), zone: answers.zone || form.get("zone"), plan: selected, preferredTime: form.get("preferredTime"), consent: form.get("consent") === "on", source: "internet_recommender" }) });
    const data = await response.json(); if (!response.ok) { setError(data.error); return; } setResult(data);
  }

  return <section className="internet-hub" id="internet">
    <div className="section-heading"><div><span className="eyebrow">Internet y fibra óptica</span><h2>Internet para estar<br />siempre conectado</h2></div><p>Conocé nuestros planes y encontrá la opción adecuada para tu hogar, comercio o empresa. La cobertura y las condiciones siempre se confirman antes de contratar.</p></div>
    <div className="internet-photo"><Image src="/images/coopsar-connectivity.png" alt="Técnico trabajando en infraestructura de conectividad en Sarmiento" fill sizes="(max-width: 900px) 100vw, 1200px" /></div>
    <div className="plan-grid">{internetPlans.map((plan) => <article className="plan-card" key={plan.id}><small>{plan.audience}</small><h3>{plan.name}</h3><strong>{plan.speed}</strong><p>{plan.technology}</p><ul>{plan.benefits.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul><div className="price-pending">Precio: pendiente de confirmación</div><button onClick={() => document.getElementById("contratar")?.scrollIntoView({ behavior: "smooth" })}>Consultar disponibilidad</button></article>)}</div>
    <div className="recommender" id="contratar">
      <div className="recommender-copy"><span className="eyebrow eyebrow-light">Recomendador inteligente</span><h3>Consultá tu domicilio real</h3><p>Buscamos servicios activos en la dirección indicada o en alturas cercanas de la misma calle. La factibilidad final siempre requiere validación técnica.</p><div className="step-indicator"><span className={step >= 1 ? "active" : ""}>1</span><i /><span className={step >= 2 ? "active" : ""}>2</span><i /><span className={step >= 3 ? "active" : ""}>3</span></div></div>
      <div className="recommender-panel">
        {step === 1 && <div className="question-set"><h4>Consultá el plan disponible en tu domicilio</h4><label>¿Para quién es?<select value={answers.type} onChange={(e) => setAnswers({ ...answers, type: e.target.value as Answers["type"] })}><option value="hogar">Hogar</option><option value="comercio">Comercio</option><option value="empresa">Empresa</option></select></label><div className="field-row"><label>Calle<input required value={answers.street} onChange={(e) => setAnswers({ ...answers, street: e.target.value })} placeholder="Ej.: San Martín" /></label><label>Altura<input required inputMode="numeric" value={answers.streetNumber} onChange={(e) => setAnswers({ ...answers, streetNumber: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="Ej.: 1250" /></label></div><label>Zona o barrio <span>(opcional)</span><input value={answers.zone} onChange={(e) => setAnswers({ ...answers, zone: e.target.value })} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary" disabled={checkingCoverage} onClick={checkCoverage}>{checkingCoverage ? "Consultando padrón…" : "Ver plan disponible"}</button></div>}
        {step === 2 && <div className="recommendation">{(coverage?.status === "exact" || coverage?.status === "probable") && <small>{coverage.status === "exact" ? "Domicilio encontrado" : "Coincidencia por cercanía"}</small>}<h4>{coverage?.service ? "Plan disponible" : "No pudimos identificar un plan"}</h4>{coverage && <section className={`coverage-result ${coverage.status}`} aria-live="polite">{coverage.service && <strong>{coverage.service.planName}</strong>}<p>{coverage.message}</p></section>}<p>La consulta utiliza la información de servicios cargada. La instalación nueva queda sujeta a validación técnica.</p><div><button onClick={() => setStep(1)}>Modificar domicilio</button><button className="primary" onClick={() => setStep(3)}>Solicitar validación</button></div></div>}
        {step === 3 && !result && <form className="lead-form" onSubmit={submit}><h4>Datos para contactarte</h4><div className="field-row"><label>Nombre y apellido<input required name="name" minLength={3} /></label><label>Teléfono<input required name="phone" type="tel" minLength={8} /></label></div><div className="field-row"><label>Correo electrónico<input required name="email" type="email" /></label><label>Domicilio<input required name="address" minLength={5} defaultValue={`${answers.street} ${answers.streetNumber}`.trim()} /></label></div>{!answers.zone && <label>Barrio o zona<input required name="zone" /></label>}<label>Horario preferido<select name="preferredTime"><option>Mañana</option><option>Mediodía</option><option>Tarde</option></select></label><label className="check"><input required name="consent" type="checkbox" /> Acepto que COOPSAR use estos datos para responder esta solicitud.</label>{error && <p className="form-error">{error}</p>}<button className="primary">Enviar solicitud</button></form>}
        {result && <div className={result.stored ? "success-card" : "pending-card"}><strong>{result.stored ? "Solicitud recibida" : "Configuración pendiente"}</strong><p>{result.message}</p><b>{result.requestNumber}</b><a href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hola, quiero consultar por internet. Solicitud ${result.requestNumber}. Zona: ${answers.zone}`)}`}>Continuar por WhatsApp ↗</a></div>}
      </div>
    </div>
  </section>;
}
