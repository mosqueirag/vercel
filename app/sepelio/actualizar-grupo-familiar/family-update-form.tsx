"use client";
/* eslint-disable @next/next/no-img-element -- previews use local object URLs only */

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { funeralDocumentMaxBytes, funeralDocumentMimeTypes, type FuneralDocumentSide } from "../../../lib/funeral-documents";
import { uploadPrivateFuneralDocuments } from "../../../lib/funeral-document-upload-client";
import { validateConfirmationStep, validateDocumentsStep, validateHolderStep, validateMembersStep, type FuneralFamilyUpdateInput, type FuneralStepErrors } from "../../../lib/funeral-family-update";
import { createJourneyId, createSessionId } from "../../../lib/journey/ids";
import styles from "./family-update.module.css";

type Member = FuneralFamilyUpdateInput["members"][number];
type Doc = { file: File | null; preview: string | null; status: "empty" | "selected" | "uploading" | "uploaded" | "error"; error: string };

const emptyMember = (): Member => ({ fullName: "", dni: "", birthDate: "", relationship: "other" });
const emptyDoc = (): Doc => ({ file: null, preview: null, status: "empty", error: "" });
const allowedTypes = new Set<string>(funeralDocumentMimeTypes);

function validateFile(file: File) {
  if (!allowedTypes.has(file.type)) return "Elegí una imagen JPG, PNG o WebP.";
  if (file.size <= 0) return "La imagen está vacía.";
  return file.size > funeralDocumentMaxBytes ? "La imagen no puede superar los 8 MB." : "";
}

export function FamilyUpdateForm({ guardHref }: { guardHref: string }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FuneralStepErrors>({});
  const [done, setDone] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [holder, setHolder] = useState({ memberNumber: "", holderFullName: "", holderDni: "", phone: "", email: "" });
  const [members, setMembers] = useState<Member[]>([emptyMember()]);
  const [docs, setDocs] = useState<Record<FuneralDocumentSide, Doc>>({ front: emptyDoc(), back: emptyDoc() });
  const [consent, setConsent] = useState(false);
  const docsRef = useRef(docs);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const documentsReady = Boolean(uploadId && docs.front.status === "uploaded" && docs.back.status === "uploaded");

  useEffect(() => { docsRef.current = docs; }, [docs]);
  useEffect(() => () => { Object.values(docsRef.current).forEach((doc) => doc.preview && URL.revokeObjectURL(doc.preview)); }, []);

  function registerField(key: string) { return (element: HTMLInputElement | HTMLSelectElement | null) => { fieldRefs.current[key] = element; }; }
  function clearFieldError(key: string) { setFieldErrors((current) => { if (!current[key]) return current; const next = { ...current }; delete next[key]; return next; }); }
  function fieldError(name: string) { return fieldErrors[name] ? <span className={styles.fieldError} id={`${name}-error`} role="alert">{fieldErrors[name]}</span> : null; }
  function showErrors(errors: FuneralStepErrors) {
    setFieldErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) requestAnimationFrame(() => { const field = fieldRefs.current[first]; field?.focus({ preventScroll: true }); field?.scrollIntoView({ behavior: "smooth", block: "center" }); });
    return Object.keys(errors).length === 0;
  }
  function inputProps(key: string) { return { ref: registerField(key), "aria-invalid": Boolean(fieldErrors[key]), "aria-describedby": fieldErrors[key] ? `${key}-error` : undefined }; }

  function setMember(index: number, patch: Partial<Member>) {
    setMembers((current) => current.map((member, memberIndex) => memberIndex === index ? { ...member, ...patch } : member));
    Object.keys(patch).forEach((key) => clearFieldError(`member-${index}-${key}`));
  }
  function choose(side: FuneralDocumentSide, file: File | null) {
    if (!file) return;
    const issue = validateFile(file);
    setUploadId(null);
    clearFieldError(side);
    setDocs((current) => {
      if (current[side].preview) URL.revokeObjectURL(current[side].preview);
      return { ...current, [side]: { file, preview: issue ? null : URL.createObjectURL(file), status: issue ? "error" : "selected", error: issue } };
    });
  }

  async function uploadDocuments(): Promise<{ ok: true; uploadId: string } | { ok: false }> {
    if (!docs.front.file || !docs.back.file) return { ok: false };
    setBusy(true); setError("");
    setDocs((current) => ({ front: { ...current.front, status: "uploading", error: "" }, back: { ...current.back, status: "uploading", error: "" } }));
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error("missing_config");
      const client = createClient(url, key, { auth: { persistSession: false } });
      const nextUploadId = await uploadPrivateFuneralDocuments({
        front: docs.front.file,
        back: docs.back.file,
        createSession: async () => {
          const response = await fetch("/api/funeral-family-updates/uploads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ front: { type: docs.front.file?.type, size: docs.front.file?.size }, back: { type: docs.back.file?.type, size: docs.back.file?.size } }) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.uploadId || !data.front || !data.back) throw new Error("upload_init_failed");
          return data;
        },
        upload: async (_side, signed, file) => {
          const { error: uploadError } = await client.storage.from("funeral-private-documents").uploadToSignedUrl(signed.path, signed.token, file as File, { contentType: file.type });
          if (uploadError) throw new Error("upload_failed");
        },
      });
      setUploadId(nextUploadId);
      setDocs((current) => ({ front: { ...current.front, status: "uploaded" }, back: { ...current.back, status: "uploaded" } }));
      setFieldErrors({});
      return { ok: true, uploadId: nextUploadId };
    } catch {
      const message = "No pudimos cargar la documentación. Revisá tu conexión e intentá nuevamente.";
      setError(message);
      setDocs((current) => ({ front: { ...current.front, status: "error", error: message }, back: { ...current.back, status: "error", error: message } }));
      return { ok: false };
    } finally { setBusy(false); }
  }

  async function continueFromDocuments() {
    if (documentsReady) { setStep(4); return; }
    const errors = validateDocumentsStep(Boolean(docs.front.file), Boolean(docs.back.file));
    if (!showErrors(errors)) return;
    const result = await uploadDocuments();
    if (result.ok) setStep(4);
  }
  function continueFromStep() {
    if (step === 3) { void continueFromDocuments(); return; }
    const errors = step === 1 ? validateHolderStep(holder) : step === 2 ? validateMembersStep(members) : validateConfirmationStep(consent);
    if (!showErrors(errors)) return;
    if (step < 4) setStep((current) => current + 1); else void submit();
  }
  async function submit() {
    if (!uploadId) return;
    setBusy(true); setError("");
    const journeyId = sessionStorage.getItem("coopsar-journey-id") || createJourneyId();
    const sessionId = sessionStorage.getItem("coopsar-session-id") || createSessionId();
    sessionStorage.setItem("coopsar-journey-id", journeyId); sessionStorage.setItem("coopsar-session-id", sessionId);
    try {
      const response = await fetch("/api/funeral-family-updates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...holder, members, consent, uploadId, journeyId, sessionId }) });
      const data = await response.json().catch(() => ({})) as { error?: string; requestNumber?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos registrar la solicitud.");
      setDone(data.requestNumber || "Solicitud recibida");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos registrar la solicitud."); }
    finally { setBusy(false); }
  }

  if (done) return <section className={styles.success} role="status"><p className={styles.eyebrow}>Solicitud recibida</p><h2>Guardá este número de seguimiento</h2><strong>{done}</strong><p>La actualización queda en revisión. No modifica automáticamente tu grupo familiar ni confirma condiciones del servicio.</p><Link className={styles.primaryAction} href="/sepelio">Volver a Sepelio</Link></section>;
  return <form className={styles.form} noValidate onSubmit={(event) => { event.preventDefault(); if (!busy) continueFromStep(); }}>
    <ol className={styles.steps} aria-label="Pasos del trámite"><li className={step >= 1 ? styles.active : ""}><span aria-hidden="true">1</span><span className={styles.stepLabel}>Titular</span></li><li className={step >= 2 ? styles.active : ""}><span aria-hidden="true">2</span><span className={styles.stepLabel}>Grupo familiar</span></li><li className={step >= 3 ? styles.active : ""}><span aria-hidden="true">3</span><span className={styles.stepLabel}>Documentación</span></li><li className={step >= 4 ? styles.active : ""}><span aria-hidden="true">4</span><span className={styles.stepLabel}>Confirmación</span></li></ol>
    {step === 1 && <fieldset><legend>Datos del titular</legend><p>Usaremos estos datos sólo para revisar esta solicitud.</p><div className={styles.grid}>
      <label>Número de asociado o referencia<input required {...inputProps("memberNumber")} value={holder.memberNumber} onChange={(event) => { setHolder({ ...holder, memberNumber: event.target.value }); clearFieldError("memberNumber"); }} />{fieldError("memberNumber")}</label>
      <label>Nombre y apellido<input required autoComplete="name" {...inputProps("holderFullName")} value={holder.holderFullName} onChange={(event) => { setHolder({ ...holder, holderFullName: event.target.value }); clearFieldError("holderFullName"); }} />{fieldError("holderFullName")}</label>
      <label>DNI<input required inputMode="numeric" pattern="[0-9]{7,8}" {...inputProps("holderDni")} value={holder.holderDni} onChange={(event) => { setHolder({ ...holder, holderDni: event.target.value.replace(/\D/g, "") }); clearFieldError("holderDni"); }} />{fieldError("holderDni")}</label>
      <label>Teléfono<input required inputMode="tel" autoComplete="tel" {...inputProps("phone")} value={holder.phone} onChange={(event) => { setHolder({ ...holder, phone: event.target.value }); clearFieldError("phone"); }} />{fieldError("phone")}</label>
      <label className={styles.wide}>Correo electrónico *<input required type="email" autoComplete="email" {...inputProps("email")} value={holder.email} onChange={(event) => { setHolder({ ...holder, email: event.target.value }); clearFieldError("email"); }} />{fieldError("email")}</label>
    </div></fieldset>}
    {step === 2 && <fieldset><legend>Integrantes a informar</legend><p>Informá los integrantes que necesitás que COOPSAR revise. La información quedará sujeta a validación humana.</p>{members.map((member, index) => <div className={styles.member} key={index}><div className={styles.memberHeading}><strong>Integrante {index + 1}</strong>{members.length > 1 && <button type="button" onClick={() => setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index))}>Quitar</button>}</div><div className={styles.grid}>
      <label>Nombre y apellido<input required {...inputProps(`member-${index}-fullName`)} value={member.fullName} onChange={(event) => setMember(index, { fullName: event.target.value })} />{fieldError(`member-${index}-fullName`)}</label>
      <label>DNI<input required inputMode="numeric" pattern="[0-9]{7,8}" {...inputProps(`member-${index}-dni`)} value={member.dni} onChange={(event) => setMember(index, { dni: event.target.value.replace(/\D/g, "") })} />{fieldError(`member-${index}-dni`)}</label>
      <label>Fecha de nacimiento<input required type="date" max={new Date().toISOString().slice(0, 10)} {...inputProps(`member-${index}-birthDate`)} value={member.birthDate} onChange={(event) => setMember(index, { birthDate: event.target.value })} />{fieldError(`member-${index}-birthDate`)}</label>
      <label>Relación<select {...inputProps(`member-${index}-relationship`)} value={member.relationship} onChange={(event) => setMember(index, { relationship: event.target.value as Member["relationship"] })}><option value="spouse">Cónyuge</option><option value="cohabitant">Conviviente</option><option value="child">Hijo/a</option><option value="parent">Padre o madre</option><option value="other">Otra</option></select>{fieldError(`member-${index}-relationship`)}</label>
    </div></div>)}{members.length < 10 && <button className={styles.addMember} type="button" onClick={() => setMembers((current) => [...current, emptyMember()])}>+ Agregar integrante</button>}</fieldset>}
    {step === 3 && <fieldset><legend>Documentación del titular</legend><p>Elegí una imagen legible del frente y dorso del DNI. La carga privada se completa al continuar.</p><div className={styles.documents}>{(["front", "back"] as const).map((side) => { const doc = docs[side]; const title = `DNI — ${side === "front" ? "Frente" : "Dorso"}`; return <section className={styles.documentCard} key={side} aria-label={title}><strong>{title} *</strong><input className={styles.visuallyHidden} {...inputProps(side)} id={`dni-${side}`} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => choose(side, event.currentTarget.files?.[0] || null)} disabled={busy} />{doc.preview ? <img className={styles.documentPreview} src={doc.preview} alt={`Vista previa local del ${title.toLowerCase()}`} /> : <div className={styles.documentEmpty}>Subí una foto legible</div>}<span className={styles.documentStatus}>{doc.status === "uploaded" ? "Lista ✓" : doc.status === "uploading" ? "Cargando…" : doc.status === "selected" ? "Imagen seleccionada ✓" : doc.status === "error" ? "No pudimos cargar la imagen" : "Sin imagen"}</span>{fieldError(side)}<label className={styles.documentPicker} htmlFor={`dni-${side}`}>{doc.preview ? "Cambiar imagen" : "Elegir imagen"}</label></section>; })}</div><p className={styles.documentHint}>JPG, PNG o WebP. Máximo 8 MB por imagen. Las imágenes se cargan en un canal privado.</p></fieldset>}
    {step === 4 && <fieldset><legend>Revisá antes de enviar</legend><div className={styles.summary}><p><strong>Titular:</strong> {holder.holderFullName}</p><p><strong>Integrantes informados:</strong> {members.length}</p><p><strong>Documentación:</strong> DNI frente y dorso recibidos.</p><p>La solicitud será revisada por el equipo de COOPSAR. No confirma modificaciones ni cobertura hasta completar la validación correspondiente.</p></div><label className={styles.consent}><input required type="checkbox" {...inputProps("consent")} checked={consent} onChange={(event) => { setConsent(event.target.checked); clearFieldError("consent"); }} /> Autorizo a COOPSAR a utilizar los datos y la documentación adjunta exclusivamente para gestionar esta solicitud.</label>{fieldError("consent")}</fieldset>}
    {error && <p className={styles.error} role="alert">{error} <Link href="/contacto">Contactá a COOPSAR</Link> para recibir ayuda con este trámite.</p>}
    <div className={styles.actions}>{step > 1 && <button type="button" className={styles.back} onClick={() => { setStep((current) => current - 1); setFieldErrors({}); }} disabled={busy}>Volver</button>}<button className={styles.primaryAction} disabled={busy} type="submit">{busy ? step === 3 ? "Cargando documentación…" : "Enviando…" : step === 4 ? "Enviar solicitud" : "Continuar"}</button></div><p className={styles.help}>¿Es una situación urgente? <a href={guardHref}>Llamá a la guardia de sepelio</a>.</p>
  </form>;
}
