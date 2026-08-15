"use client";
import { FormEvent, useState } from "react";
import { isServiceRequestType, serviceRequestConfigs } from "../../lib/service-requests/config";
import { useNavigationContext } from "./navigation-context";

type Created = { requestNumber: string; requestType: string; createdAt: string; status: "new"; nextStep: string };
function track(journeyId: string, sessionId: string, eventType: string, result?: string) { if (journeyId && sessionId) void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId, sessionId, eventType, result, page: `${location.pathname}${location.hash}` }) }); }

export function ServiceRequestForm({ requestType }: { requestType: string }) {
  const nav = useNavigationContext();
  const [confirmation, setConfirmation] = useState(false), [created, setCreated] = useState<Created | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(false);
  if (!isServiceRequestType(requestType)) return null;
  const config = serviceRequestConfigs[requestType];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!confirmation) { setConfirmation(true); track(nav.journeyId, nav.sessionId, "service_request_started", requestType); return; }
    setLoading(true); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(config.fields.map((field) => [field.name, String(form.get(field.name) || "")]));
    try {
      const response = await fetch("/api/service-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestType, journeyId: nav.journeyId, sessionId: nav.sessionId, fullName: form.get("fullName"), phone: form.get("phone"), email: form.get("email"), payload, consent: form.get("consent") === "on", confirmed: true, source: "coopia" }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error === "invalid_payload" ? "Revisá los datos del trámite." : "No pudimos registrar la solicitud."); setCreated(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos registrar la solicitud."); }
    finally { setLoading(false); }
  }
  if (created) return <section className="assistant-card success-card" aria-live="polite"><div><small>Solicitud registrada</small><h3>{config.title}</h3><strong>{created.requestNumber}</strong><p>Estado inicial: Nueva · {new Date(created.createdAt).toLocaleDateString("es-AR")}</p><p>{created.nextStep}</p></div></section>;
  return <section className="assistant-card service-request-card"><div><small>Trámite asistido</small><h3>{config.title}</h3><p>Completá solo los datos necesarios. Nada se registra hasta que confirmes.</p><form onSubmit={submit}>
    <label>Nombre y apellido<input name="fullName" required minLength={3} maxLength={120} /></label>
    <label>Teléfono<input name="phone" type="tel" required minLength={8} maxLength={30} /></label>
    <label>Correo electrónico<input name="email" type="email" required maxLength={160} /></label>
    {config.fields.map((field) => <label key={field.name}>{field.label}{field.type === "textarea" ? <textarea name={field.name} required={field.required} maxLength={field.maxLength} /> : <input name={field.name} required={field.required} maxLength={field.maxLength} />}</label>)}
    <label className="check"><input name="consent" type="checkbox" required /> Acepto el uso de estos datos para gestionar esta solicitud.</label>
    {confirmation && <p className="confirmation-note" role="status">Revisá los datos. Al confirmar se generará una solicitud para COOPSAR.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <button disabled={loading}>{loading ? "Registrando…" : confirmation ? "Confirmar solicitud" : "Continuar"}</button>
  </form></div></section>;
}
