"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { CONTACT, internetPlans } from "../../lib/coopsar-data";

type Answers = { type: "hogar" | "comercio" | "empresa"; people: number; devices: number; intensive: boolean; zone: string; street: string; streetNumber: string };
type CoverageResult = { status: "exact" | "probable" | "unknown" | "configuration_pending"; message: string; services?: { planName: string; technology: string; speedMbps: number | null }[] };

export function InternetCenter() {
  const [answers, setAnswers] = useState<Answers>({ type: "hogar", people: 2, devices: 4, intensive: false, zone: "", street: "", streetNumber: "" });
  const [selected, setSelected] = useState("hogar");
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<{ requestNumber: string; message: string; stored: boolean } | null>(null);
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [checkingCoverage, setCheckingCoverage] = useState(false);
  const [error, setError] = useState("");
  const recommended = useMemo(() => answers.type !== "hogar" ? "comercial" : answers.intensive || answers.devices > 6 || answers.people > 3 ? "intensivo" : "hogar", [answers]);

  async function checkCoverage() {
    setError("");
    if (answers.street.trim().length < 3 || !Number(answers.streetNumber)) { setError("Ingresá la calle y la altura para consultar datos reales."); return; }
    setCheckingCoverage(true);
    try {
      const response = await fetch("/api/coverage-check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ street: answers.street, number: answers.streetNumber }) });
      const data = await response.json() as CoverageResult & { error?: string };
      if (!response.ok && data.status !== "configuration_pending") throw new Error(data.error || "No pudimos consultar la cobertura.");
      setCoverage(data); setSelected(recommended); setStep(2);
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
    <div className="plan-grid">{internetPlans.map((plan) => <article className={selected === plan.id ? "plan-card selected" : "plan-card"} key={plan.id}><small>{plan.audience}</small><h3>{plan.name}</h3><strong>{plan.speed}</strong><p>{plan.technology}</p><ul>{plan.benefits.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul><div className="price-pending">Precio: pendiente de confirmación</div><button onClick={() => { setSelected(plan.id); setStep(2); }}>{selected === plan.id ? "Plan seleccionado" : "Quiero contratar"}</button></article>)}</div>
    <div className="recommender" id="contratar">
      <div className="recommender-copy"><span className="eyebrow eyebrow-light">Recomendador inteligente</span><h3>Consultá tu domicilio real</h3><p>Buscamos servicios activos en la dirección indicada o en alturas cercanas de la misma calle. La factibilidad final siempre requiere validación técnica.</p><div className="step-indicator"><span className={step >= 1 ? "active" : ""}>1</span><i /><span className={step >= 2 ? "active" : ""}>2</span><i /><span className={step >= 3 ? "active" : ""}>3</span></div></div>
      <div className="recommender-panel">
        {step === 1 && <div className="question-set"><h4>Contanos cómo usarían el servicio</h4><label>¿Para quién es?<select value={answers.type} onChange={(e) => setAnswers({ ...answers, type: e.target.value as Answers["type"] })}><option value="hogar">Hogar</option><option value="comercio">Comercio</option><option value="empresa">Empresa</option></select></label><div className="field-row"><label>Personas<input type="number" min="1" max="100" value={answers.people} onChange={(e) => setAnswers({ ...answers, people: Number(e.target.value) })} /></label><label>Dispositivos<input type="number" min="1" max="200" value={answers.devices} onChange={(e) => setAnswers({ ...answers, devices: Number(e.target.value) })} /></label></div><label className="check"><input type="checkbox" checked={answers.intensive} onChange={(e) => setAnswers({ ...answers, intensive: e.target.checked })} /> Usamos streaming, videojuegos o videollamadas con frecuencia</label><div className="field-row"><label>Calle<input required value={answers.street} onChange={(e) => setAnswers({ ...answers, street: e.target.value })} placeholder="Ej.: San Martín" /></label><label>Altura<input required inputMode="numeric" value={answers.streetNumber} onChange={(e) => setAnswers({ ...answers, streetNumber: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="Ej.: 1250" /></label></div><label>Zona o barrio <span>(opcional)</span><input value={answers.zone} onChange={(e) => setAnswers({ ...answers, zone: e.target.value })} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary" disabled={checkingCoverage} onClick={checkCoverage}>{checkingCoverage ? "Consultando datos…" : "Consultar y recomendar"}</button></div>}
        {step === 2 && <div className="recommendation"><small>{coverage?.status === "exact" ? "Registro exacto" : coverage?.status === "probable" ? "Cobertura probable" : "Resultado de cobertura"}</small><h4>{internetPlans.find((plan) => plan.id === recommended)?.name}</h4>{coverage && <section className={`coverage-result ${coverage.status}`} aria-live="polite"><strong>{coverage.message}</strong>{coverage.services && coverage.services.length > 0 && <ul>{coverage.services.map((service) => <li key={service.planName}>{service.planName} · {service.technology}{service.speedMbps ? ` · ${service.speedMbps} MB` : ""}</li>)}</ul>}</section>}<p>La recomendación de uso considera personas y dispositivos. Los registros cercanos orientan la consulta, pero no garantizan disponibilidad, velocidad, precio ni condiciones de instalación.</p><div><button onClick={() => setStep(1)}>Modificar respuestas</button><button className="primary" onClick={() => setStep(3)}>Solicitar validación</button></div></div>}
        {step === 3 && !result && <form className="lead-form" onSubmit={submit}><h4>Datos para contactarte</h4><div className="field-row"><label>Nombre y apellido<input required name="name" minLength={3} /></label><label>Teléfono<input required name="phone" type="tel" minLength={8} /></label></div><div className="field-row"><label>Correo electrónico<input required name="email" type="email" /></label><label>Domicilio<input required name="address" minLength={5} defaultValue={`${answers.street} ${answers.streetNumber}`.trim()} /></label></div>{!answers.zone && <label>Barrio o zona<input required name="zone" /></label>}<label>Horario preferido<select name="preferredTime"><option>Mañana</option><option>Mediodía</option><option>Tarde</option></select></label><label className="check"><input required name="consent" type="checkbox" /> Acepto que COOPSAR use estos datos para responder esta solicitud.</label>{error && <p className="form-error">{error}</p>}<button className="primary">Enviar solicitud</button></form>}
        {result && <div className={result.stored ? "success-card" : "pending-card"}><strong>{result.stored ? "Solicitud recibida" : "Configuración pendiente"}</strong><p>{result.message}</p><b>{result.requestNumber}</b><a href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hola, quiero consultar por internet. Solicitud ${result.requestNumber}. Zona: ${answers.zone}`)}`}>Continuar por WhatsApp ↗</a></div>}
      </div>
    </div>
  </section>;
}
