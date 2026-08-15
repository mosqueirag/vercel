"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { CONTACT, internetPlans } from "../../lib/coopsar-data";

type Answers = { type: "hogar" | "comercio" | "empresa"; people: number; devices: number; intensive: boolean; zone: string };

export function InternetCenter() {
  const [answers, setAnswers] = useState<Answers>({ type: "hogar", people: 2, devices: 4, intensive: false, zone: "" });
  const [selected, setSelected] = useState("hogar");
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<{ requestNumber: string; message: string; stored: boolean } | null>(null);
  const [error, setError] = useState("");
  const recommended = useMemo(() => answers.type !== "hogar" ? "comercial" : answers.intensive || answers.devices > 6 || answers.people > 3 ? "intensivo" : "hogar", [answers]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/internet-leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerType: answers.type, name: form.get("name"), phone: form.get("phone"), email: form.get("email"), address: form.get("address"), zone: answers.zone || form.get("zone"), plan: selected, preferredTime: form.get("preferredTime"), consent: form.get("consent") === "on", source: "internet_recommender" }) });
    const data = await response.json(); if (!response.ok) { setError(data.error); return; } setResult(data);
  }

  return (
    <section className="internet-hub" id="internet">
      <div className="section-heading"><div><span className="eyebrow">Internet y fibra óptica</span><h2>Internet para estar<br />siempre conectado</h2></div><p>Conocé nuestros planes y encontrá la opción adecuada para tu hogar, comercio o empresa. La cobertura y las condiciones siempre se confirman antes de contratar.</p></div>
      <div className="internet-photo"><Image src="/images/coopsar-connectivity.png" alt="Técnico trabajando en infraestructura de conectividad en Sarmiento" fill sizes="(max-width: 900px) 100vw, 1200px" /></div>
      <div className="plan-grid">{internetPlans.map((plan) => <article className={selected === plan.id ? "plan-card selected" : "plan-card"} key={plan.id}><small>{plan.audience}</small><h3>{plan.name}</h3><strong>{plan.speed}</strong><p>{plan.technology}</p><ul>{plan.benefits.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul><div className="price-pending">Precio: pendiente de confirmación</div><button onClick={() => { setSelected(plan.id); setStep(2); }}>{selected === plan.id ? "Plan seleccionado" : "Quiero contratar"}</button></article>)}</div>
      <div className="recommender" id="contratar">
        <div className="recommender-copy"><span className="eyebrow eyebrow-light">Recomendador inteligente</span><h3>Encontrá un punto de partida</h3><p>Respondé unas preguntas. La recomendación es orientativa y no confirma cobertura, velocidad ni precio.</p><div className="step-indicator"><span className={step >= 1 ? "active" : ""}>1</span><i /><span className={step >= 2 ? "active" : ""}>2</span><i /><span className={step >= 3 ? "active" : ""}>3</span></div></div>
        <div className="recommender-panel">
          {step === 1 && <div className="question-set"><h4>Contanos cómo usarían el servicio</h4><label>¿Para quién es?<select value={answers.type} onChange={(e) => setAnswers({ ...answers, type: e.target.value as Answers["type"] })}><option value="hogar">Hogar</option><option value="comercio">Comercio</option><option value="empresa">Empresa</option></select></label><div className="field-row"><label>Personas<input type="number" min="1" max="100" value={answers.people} onChange={(e) => setAnswers({ ...answers, people: Number(e.target.value) })} /></label><label>Dispositivos<input type="number" min="1" max="200" value={answers.devices} onChange={(e) => setAnswers({ ...answers, devices: Number(e.target.value) })} /></label></div><label className="check"><input type="checkbox" checked={answers.intensive} onChange={(e) => setAnswers({ ...answers, intensive: e.target.checked })} /> Usamos streaming, videojuegos o videollamadas con frecuencia</label><label>Zona o barrio<input value={answers.zone} onChange={(e) => setAnswers({ ...answers, zone: e.target.value })} placeholder="No confirma cobertura" /></label><button className="primary" onClick={() => { setSelected(recommended); setStep(2); }}>Ver recomendación</button></div>}
          {step === 2 && <div className="recommendation"><small>Recomendación orientativa</small><h4>{internetPlans.find((plan) => plan.id === recommended)?.name}</h4><p>Es el mejor punto de partida según la cantidad de personas, dispositivos y tipo de uso que indicaste. Un asesor debe confirmar factibilidad, condiciones y alternativas.</p><div><button onClick={() => setStep(1)}>Modificar respuestas</button><button className="primary" onClick={() => setStep(3)}>Solicitar contacto</button></div></div>}
          {step === 3 && !result && <form className="lead-form" onSubmit={submit}><h4>Datos para contactarte</h4><div className="field-row"><label>Nombre y apellido<input required name="name" minLength={3} /></label><label>Teléfono<input required name="phone" type="tel" minLength={8} /></label></div><div className="field-row"><label>Correo electrónico<input required name="email" type="email" /></label><label>Domicilio<input required name="address" minLength={5} /></label></div>{!answers.zone && <label>Barrio o zona<input required name="zone" /></label>}<label>Horario preferido<select name="preferredTime"><option>Mañana</option><option>Mediodía</option><option>Tarde</option></select></label><label className="check"><input required name="consent" type="checkbox" /> Acepto que COOPSAR use estos datos para responder esta solicitud.</label>{error && <p className="form-error">{error}</p>}<button className="primary">Enviar solicitud</button></form>}
          {result && <div className={result.stored ? "success-card" : "pending-card"}><strong>{result.stored ? "Solicitud recibida" : "Configuración pendiente"}</strong><p>{result.message}</p><b>{result.requestNumber}</b><a href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hola, quiero consultar por internet. Solicitud ${result.requestNumber}. Zona: ${answers.zone}`)}`}>Continuar por WhatsApp ↗</a></div>}
        </div>
      </div>
    </section>
  );
}
