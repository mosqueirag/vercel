"use client";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { funeralDocumentMaxBytes, funeralDocumentMimeTypes, type FuneralDocumentSide } from "../../../lib/funeral-documents";
import { createJourneyId, createSessionId } from "../../../lib/journey/ids";
import type { FuneralFamilyUpdateInput } from "../../../lib/funeral-family-update";
import styles from "./family-update.module.css";

type Member = FuneralFamilyUpdateInput["members"][number];
type Doc = { file: File | null; preview: string | null; status: "empty" | "selected" | "uploading" | "uploaded" | "error"; error: string };
const emptyMember = (): Member => ({ fullName: "", dni: "", birthDate: "", relationship: "other" });
const emptyDoc = (): Doc => ({ file: null, preview: null, status: "empty", error: "" });
const allowedTypes = new Set<string>(funeralDocumentMimeTypes);
function validate(file: File) { return !allowedTypes.has(file.type) ? "Elegí una imagen JPG, PNG o WebP." : file.size <= 0 ? "La imagen está vacía." : file.size > funeralDocumentMaxBytes ? "La imagen no puede superar los 8 MB." : ""; }

export function FamilyUpdateForm({ guardHref }: { guardHref: string }) {
  const [step, setStep] = useState(1), [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState<string | null>(null), [uploadId, setUploadId] = useState<string | null>(null);
  const [holder, setHolder] = useState({ memberNumber: "", holderFullName: "", holderDni: "", phone: "", email: "" });
  const [members, setMembers] = useState<Member[]>([emptyMember()]);
  const [docs, setDocs] = useState<Record<FuneralDocumentSide, Doc>>({ front: emptyDoc(), back: emptyDoc() });
  const docsRef = useRef(docs);
  const [consent, setConsent] = useState(false);
  const documentsReady = Boolean(uploadId && docs.front.status === "uploaded" && docs.back.status === "uploaded");
  const canContinue = useMemo(() => step === 1 ? Boolean(holder.memberNumber && holder.holderFullName && /^\d{7,8}$/.test(holder.holderDni) && holder.phone) : step === 2 ? members.every((member) => member.fullName && /^\d{7,8}$/.test(member.dni) && member.birthDate) : step === 3 ? documentsReady : consent, [consent, documentsReady, holder, members, step]);
  useEffect(() => { docsRef.current = docs; }, [docs]);
  useEffect(() => () => { Object.values(docsRef.current).forEach((doc) => doc.preview && URL.revokeObjectURL(doc.preview)); }, []);
  function setMember(index: number, patch: Partial<Member>) { setMembers((current) => current.map((member, memberIndex) => memberIndex === index ? { ...member, ...patch } : member)); }
  function choose(side: FuneralDocumentSide, file: File | null) {
    if (!file) return;
    const issue = validate(file); setUploadId(null);
    setDocs((current) => { if (current[side].preview) URL.revokeObjectURL(current[side].preview); return { ...current, [side]: { file, preview: issue ? null : URL.createObjectURL(file), status: issue ? "error" : "selected", error: issue } }; });
  }
  async function upload() {
    if (!docs.front.file || !docs.back.file) return;
    setBusy(true); setError(""); setDocs((current) => ({ front: { ...current.front, status: "uploading", error: "" }, back: { ...current.back, status: "uploading", error: "" } }));
    try {
      const init = await fetch("/api/funeral-family-updates/uploads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ front: { type: docs.front.file.type, size: docs.front.file.size }, back: { type: docs.back.file.type, size: docs.back.file.size } }) });
      const signed = await init.json().catch(() => ({})); if (!init.ok) throw new Error(signed.error || "No pudimos preparar la carga privada.");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error("El almacenamiento privado no está configurado.");
      const client = createClient(url, key, { auth: { persistSession: false } });
      const [front, back] = await Promise.all([client.storage.from("funeral-private-documents").uploadToSignedUrl(signed.front.path, signed.front.token, docs.front.file, { contentType: docs.front.file.type }), client.storage.from("funeral-private-documents").uploadToSignedUrl(signed.back.path, signed.back.token, docs.back.file, { contentType: docs.back.file.type })]);
      if (front.error || back.error) throw new Error("No pudimos completar la carga privada. Revisá la conexión e intentá nuevamente.");
      setUploadId(signed.uploadId); setDocs((current) => ({ front: { ...current.front, status: "uploaded" }, back: { ...current.back, status: "uploaded" } }));
    } catch (cause) { const message = cause instanceof Error ? cause.message : "No pudimos completar la carga privada."; setError(message); setDocs((current) => ({ front: { ...current.front, status: "error", error: message }, back: { ...current.back, status: "error", error: message } })); } finally { setBusy(false); }
  }
  async function submit() {
    if (!uploadId) return; setBusy(true); setError("");
    const journeyId = sessionStorage.getItem("coopsar-journey-id") || createJourneyId(), sessionId = sessionStorage.getItem("coopsar-session-id") || createSessionId(); sessionStorage.setItem("coopsar-journey-id", journeyId); sessionStorage.setItem("coopsar-session-id", sessionId);
    try { const response = await fetch("/api/funeral-family-updates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...holder, members, consent, uploadId, journeyId, sessionId }) }); const data = await response.json().catch(() => ({})) as { error?: string; requestNumber?: string }; if (!response.ok) throw new Error(data.error || "No pudimos registrar la solicitud."); setDone(data.requestNumber || "Solicitud recibida"); } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos registrar la solicitud."); } finally { setBusy(false); }
  }
  if (done) return <section className={styles.success} role="status"><p className={styles.eyebrow}>Solicitud recibida</p><h2>Guardá este número de seguimiento</h2><strong>{done}</strong><p>La actualización queda en revisión. No modifica automáticamente tu grupo familiar ni confirma condiciones del servicio.</p><Link className={styles.primaryAction} href="/sepelio">Volver a Sepelio</Link></section>;
  return <form className={styles.form} noValidate onSubmit={(event) => { event.preventDefault(); if (step < 4) { if (canContinue) setStep((current) => current + 1); return; } if (canContinue) void submit(); }}>
    <ol className={styles.steps} aria-label="Pasos del trámite"><li className={step >= 1 ? styles.active : ""}>1. Titular</li><li className={step >= 2 ? styles.active : ""}>2. Grupo familiar</li><li className={step >= 3 ? styles.active : ""}>3. Documentación</li><li className={step >= 4 ? styles.active : ""}>4. Confirmación</li></ol>
    {step === 1 && <fieldset><legend>Datos del titular</legend><p>Usaremos estos datos sólo para revisar esta solicitud.</p><div className={styles.grid}><label>Número de asociado o referencia<input required value={holder.memberNumber} onChange={(event) => setHolder({ ...holder, memberNumber: event.target.value })} /></label><label>Nombre y apellido<input required autoComplete="name" value={holder.holderFullName} onChange={(event) => setHolder({ ...holder, holderFullName: event.target.value })} /></label><label>DNI<input required inputMode="numeric" pattern="[0-9]{7,8}" value={holder.holderDni} onChange={(event) => setHolder({ ...holder, holderDni: event.target.value.replace(/\D/g, "") })} /></label><label>Teléfono<input required inputMode="tel" autoComplete="tel" value={holder.phone} onChange={(event) => setHolder({ ...holder, phone: event.target.value })} /></label><label className={styles.wide}>Correo electrónico <span>(opcional)</span><input type="email" autoComplete="email" value={holder.email} onChange={(event) => setHolder({ ...holder, email: event.target.value })} /></label></div></fieldset>}
    {step === 2 && <fieldset><legend>Integrantes a informar</legend><p>Informá los integrantes que necesitás que COOPSAR revise. La información quedará sujeta a validación humana.</p>{members.map((member, index) => <div className={styles.member} key={index}><div className={styles.memberHeading}><strong>Integrante {index + 1}</strong>{members.length > 1 && <button type="button" onClick={() => setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index))}>Quitar</button>}</div><div className={styles.grid}><label>Nombre y apellido<input required value={member.fullName} onChange={(event) => setMember(index, { fullName: event.target.value })} /></label><label>DNI<input required inputMode="numeric" pattern="[0-9]{7,8}" value={member.dni} onChange={(event) => setMember(index, { dni: event.target.value.replace(/\D/g, "") })} /></label><label>Fecha de nacimiento<input required type="date" value={member.birthDate} onChange={(event) => setMember(index, { birthDate: event.target.value })} /></label><label>Relación<select value={member.relationship} onChange={(event) => setMember(index, { relationship: event.target.value as Member["relationship"] })}><option value="spouse">Cónyuge</option><option value="cohabitant">Conviviente</option><option value="child">Hijo/a</option><option value="parent">Padre o madre</option><option value="other">Otra</option></select></label></div></div>)}{members.length < 10 && <button className={styles.addMember} type="button" onClick={() => setMembers((current) => [...current, emptyMember()])}>+ Agregar integrante</button>}</fieldset>}
    {step === 3 && <fieldset><legend>Documentación del titular</legend><p>Para completar la solicitud necesitamos una imagen legible del frente y dorso del DNI.</p><div className={styles.documents}>{(["front", "back"] as const).map((side) => <label className={styles.document} key={side}><strong>DNI — {side === "front" ? "Frente" : "Dorso"} *</strong><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => choose(side, event.currentTarget.files?.[0] || null)} disabled={busy} /><span>{docs[side].status === "uploaded" ? "Cargado ✓" : docs[side].status === "uploading" ? "Subiendo…" : docs[side].status === "selected" ? "Seleccionado" : docs[side].status === "error" ? docs[side].error : "Seleccionar foto o tomar foto"}</span>{docs[side].preview && <>
      {/* Local object URLs cannot be safely optimized by next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={docs[side].preview} alt={`Vista previa local del DNI, ${side === "front" ? "frente" : "dorso"}`} />
    </>}</label>)}</div><p className={styles.documentHint}>JPG, PNG o WebP. Máximo 8 MB por imagen. Las imágenes se cargan en un canal privado.</p><button className={styles.uploadButton} type="button" disabled={busy || !docs.front.file || !docs.back.file || documentsReady} onClick={() => void upload()}>{busy ? "Cargando documentación…" : documentsReady ? "Documentación cargada" : "Cargar documentación"}</button></fieldset>}
    {step === 4 && <fieldset><legend>Revisá antes de enviar</legend><div className={styles.summary}><p><strong>Titular:</strong> {holder.holderFullName}</p><p><strong>Integrantes informados:</strong> {members.length}</p><p><strong>Documentación:</strong> DNI frente y dorso recibidos.</p><p>La solicitud será revisada por el equipo de COOPSAR. No confirma modificaciones ni cobertura hasta completar la validación correspondiente.</p></div><label className={styles.consent}><input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Autorizo a COOPSAR a utilizar los datos y la documentación adjunta exclusivamente para gestionar esta solicitud.</label></fieldset>}
    {error && <p className={styles.error} role="alert">{error} <Link href="/contacto">Contactá a COOPSAR</Link> para recibir ayuda con este trámite.</p>}
    <div className={styles.actions}>{step > 1 && <button type="button" className={styles.back} onClick={() => setStep((current) => current - 1)} disabled={busy}>Volver</button>}<button className={styles.primaryAction} disabled={!canContinue || busy} type="submit">{busy ? "Enviando…" : step === 4 ? "Enviar solicitud" : "Continuar"}</button></div><p className={styles.help}>¿Es una situación urgente? <a href={guardHref}>Llamá a la guardia de sepelio</a>.</p>
  </form>;
}
