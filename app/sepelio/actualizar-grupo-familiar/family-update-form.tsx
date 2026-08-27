"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createJourneyId, createSessionId } from "../../../lib/journey/ids";
import type { FuneralFamilyUpdateInput } from "../../../lib/funeral-family-update";

type Member = FuneralFamilyUpdateInput["members"][number];
const emptyMember = (): Member => ({ fullName: "", dni: "", birthDate: "", relationship: "other" });

export function FamilyUpdateForm({ guardHref }: { guardHref: string }) {
  const [step, setStep] = useState(1), [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState<string | null>(null);
  const [holder, setHolder] = useState({ memberNumber: "", holderFullName: "", holderDni: "", phone: "", email: "" });
  const [members, setMembers] = useState<Member[]>([emptyMember()]); const [consent, setConsent] = useState(false);
  const canContinue = useMemo(() => step === 1 ? Boolean(holder.memberNumber && holder.holderFullName && /^\d{7,8}$/.test(holder.holderDni) && holder.phone) : step === 2 ? members.every((member) => member.fullName && /^\d{7,8}$/.test(member.dni) && member.birthDate) : consent, [consent, holder, members, step]);
  function setMember(index: number, patch: Partial<Member>) { setMembers((current) => current.map((member, memberIndex) => memberIndex === index ? { ...member, ...patch } : member)); }
  async function submit() {
    setBusy(true); setError("");
    const journeyId = sessionStorage.getItem("coopsar-journey-id") || createJourneyId(); const sessionId = sessionStorage.getItem("coopsar-session-id") || createSessionId();
    sessionStorage.setItem("coopsar-journey-id", journeyId); sessionStorage.setItem("coopsar-session-id", sessionId);
    try {
      const response = await fetch("/api/funeral-family-updates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...holder, members, consent, journeyId, sessionId }) });
      const data = await response.json().catch(() => ({})) as { error?: string; requestNumber?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos registrar la solicitud.");
      setDone(data.requestNumber || "Solicitud recibida");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos registrar la solicitud."); }
    finally { setBusy(false); }
  }
  if (done) return <section className="family-update-success" role="status"><p className="eyebrow">Solicitud recibida</p><h2>Guardá este número de seguimiento</h2><strong>{done}</strong><p>La actualización queda en revisión. No modifica automáticamente tu grupo familiar ni confirma condiciones del servicio.</p><Link className="button sepelio-primary-action" href="/sepelio">Volver a Sepelio</Link></section>;
  return <form className="family-update-form" noValidate onSubmit={(event) => { event.preventDefault(); if (step < 3) { if (canContinue) setStep((current) => current + 1); return; } if (canContinue) void submit(); }}>
    <ol className="family-update-steps" aria-label="Pasos del trámite"><li className={step >= 1 ? "active" : ""}>1. Titular</li><li className={step >= 2 ? "active" : ""}>2. Grupo familiar</li><li className={step >= 3 ? "active" : ""}>3. Confirmación</li></ol>
    {step === 1 && <fieldset><legend>Datos del titular</legend><p>Usaremos estos datos sólo para revisar esta solicitud.</p><div className="family-update-grid"><label>Número de asociado o referencia<input required value={holder.memberNumber} onChange={(event) => setHolder({ ...holder, memberNumber: event.target.value })} /></label><label>Nombre y apellido<input required autoComplete="name" value={holder.holderFullName} onChange={(event) => setHolder({ ...holder, holderFullName: event.target.value })} /></label><label>DNI<input required inputMode="numeric" pattern="[0-9]{7,8}" value={holder.holderDni} onChange={(event) => setHolder({ ...holder, holderDni: event.target.value.replace(/\D/g, "") })} /></label><label>Teléfono<input required inputMode="tel" autoComplete="tel" value={holder.phone} onChange={(event) => setHolder({ ...holder, phone: event.target.value })} /></label><label className="family-update-wide">Correo electrónico <span>(opcional)</span><input type="email" autoComplete="email" value={holder.email} onChange={(event) => setHolder({ ...holder, email: event.target.value })} /></label></div></fieldset>}
    {step === 2 && <fieldset><legend>Integrantes a informar</legend><p>Podés revisar hasta 10 integrantes en una misma solicitud. La información quedará sujeta a validación humana.</p>{members.map((member, index) => <div className="family-member" key={index}><div className="family-member-heading"><strong>Integrante {index + 1}</strong>{members.length > 1 && <button type="button" onClick={() => setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index))}>Quitar</button>}</div><div className="family-update-grid"><label>Nombre y apellido<input required value={member.fullName} onChange={(event) => setMember(index, { fullName: event.target.value })} /></label><label>DNI<input required inputMode="numeric" pattern="[0-9]{7,8}" value={member.dni} onChange={(event) => setMember(index, { dni: event.target.value.replace(/\D/g, "") })} /></label><label>Fecha de nacimiento<input required type="date" value={member.birthDate} onChange={(event) => setMember(index, { birthDate: event.target.value })} /></label><label>Relación<select value={member.relationship} onChange={(event) => setMember(index, { relationship: event.target.value as Member["relationship"] })}><option value="spouse">Cónyuge</option><option value="cohabitant">Conviviente</option><option value="child">Hijo/a</option><option value="parent">Padre o madre</option><option value="other">Otra</option></select></label></div></div>)}{members.length < 10 && <button className="family-add-member" type="button" onClick={() => setMembers((current) => [...current, emptyMember()])}>+ Agregar integrante</button>}</fieldset>}
    {step === 3 && <fieldset><legend>Revisá antes de enviar</legend><div className="family-update-summary"><p><strong>Titular:</strong> {holder.holderFullName}</p><p><strong>Integrantes informados:</strong> {members.length}</p><p>La solicitud será revisada por el equipo de COOPSAR. No confirma modificaciones ni cobertura hasta completar la validación correspondiente.</p></div><label className="family-consent"><input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Autorizo a COOPSAR a usar estos datos únicamente para gestionar esta solicitud.</label></fieldset>}
    {error && <p className="family-form-error" role="alert">{error}</p>}<div className="family-update-actions">{step > 1 && <button type="button" className="button family-back" onClick={() => setStep((current) => current - 1)}>Volver</button>}<button className="button sepelio-primary-action" disabled={!canContinue || busy} type="submit">{busy ? "Enviando…" : step === 3 ? "Enviar solicitud" : "Continuar"}</button></div><p className="family-update-help">¿Es una situación urgente? <a href={guardHref}>Llamá a la guardia de sepelio</a>.</p>
  </form>;
}
