"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  canBulkApplyEditorialProposal,
  canBulkApproveEditorialProposal,
  isReadyToPublishEditorialCandidate,
  selectLowRiskEditorialCandidates,
  type EditorialReviewCandidate,
  type EditorialReviewProposal,
} from "../../../lib/editorial/bulk-review";
import { canPublishEditorialProposal } from "../../../lib/editorial/publication";
import {
  canApplyEditorialProposal,
  canGenerateEditorialProposal,
  canReviewEditorialProposal,
  canUseCanonicalEditorialInventory,
  focusEditorialReviewPanel,
  isEditorialReviewDismissKey,
  proposalActionLabel,
  reconciliationWarning,
  replaceCanonicalProposal,
  reviewActionMessage,
  reviewPendingLabel,
  type EditorialReviewAction,
} from "../../../lib/editorial/review-interaction";
import { resolveEditorialDisplayStatus } from "../../../lib/editorial/display-status";

type Candidate = EditorialReviewCandidate & {
  title: string;
  originalText: string;
  provenanceCount: number;
  validationReason?: string;
  validationPriority?: string;
  editableDraft?: { title: string; summary: string; content: string };
  sitePageDraft?: { eyebrow: string; title: string; intro: string; items: Array<{ title: string; text: string; href: string }>; imageUrl: string | null; slug: string; sortOrder: number };
};
type ProposalData = { rewritten_eyebrow?: string; rewritten_title?: string; rewritten_intro?: string; rewritten_summary?: string; rewritten_content?: string; suggested_ctas?: string[]; suggested_coopia_intents?: string[]; editorial_notes?: string };
type Proposal = EditorialReviewProposal & { entity_type: Candidate["entityType"]; detected_facts: Array<{ type: string; value: string }>; proposal: ProposalData; updated_at: string };
type BulkAction = "approved" | "applied";
type BulkResult = { approved: number; applied: number; stale: number; failed: number; skipped: number };
type ReviewOperation = { proposalId: string; action: EditorialReviewAction };

const labels: Record<Candidate["entityType"], string> = { service: "Servicio", help_article: "Artículo", faq: "FAQ", internet_plan: "Plan", contact_channel: "Contacto", site_page: "Página" };
const emptyBulkResult: BulkResult = { approved: 0, applied: 0, stale: 0, failed: 0, skipped: 0 };

function proposalStatusLabel(candidate: Candidate, proposal: Proposal | undefined) {
  const status = resolveEditorialDisplayStatus(candidate.status, proposal?.status);
  if (status === "pending") return "Pendiente";
  return `${status === "published" ? "Publicado" : status}${status !== "published" && proposal?.validation_flags.length ? " · validar" : ""}`;
}

export default function EditorialContentPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState("all");
  const [batchLimit, setBatchLimit] = useState<5 | 10>(5);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [humanEdit, setHumanEdit] = useState({ title: "", summary: "", content: "" });
  const [humanEditInitial, setHumanEditInitial] = useState({ title: "", summary: "", content: "" });
  const [humanEditMessage, setHumanEditMessage] = useState("");
  const [reviewOperation, setReviewOperation] = useState<ReviewOperation | null>(null);
  const [reconciliationNeeded, setReconciliationNeeded] = useState(false);
  const reviewPanelRef = useRef<HTMLElement>(null);
  const reviewTriggerRef = useRef<HTMLButtonElement>(null);

  const load = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      const response = await fetch("/api/admin/editorial-proposals", { cache: "no-store" });
      const data = await response.json() as { candidates?: Candidate[]; proposals?: Proposal[]; error?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos cargar el centro de contenidos.");
      if (!Array.isArray(data.candidates) || !Array.isArray(data.proposals)) throw new Error("No pudimos verificar el estado del centro de contenidos.");
      const nextProposals = data.proposals || [];
      setCandidates(data.candidates);
      setProposals(nextProposals);
      setSelectedProposal((current) => current ? nextProposals.find((proposal) => proposal.id === current.id) ?? current : null);
      setReconciliationNeeded(false);
      return true;
    } catch (error) {
      setReconciliationNeeded(true);
      if (!silent) setMessage(error instanceof Error ? error.message : "No pudimos cargar el centro de contenidos.");
      return false;
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedProposal) return;
    const timer = window.setTimeout(() => focusEditorialReviewPanel(reviewPanelRef.current), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEditorialReviewDismissKey(event.key)) return;
      event.preventDefault();
      setSelectedProposal(null);
      window.setTimeout(() => reviewTriggerRef.current?.focus(), 0);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedProposal]);

  const proposalByCandidate = useMemo(() => new Map(proposals.map((proposal) => [proposal.entity_id, proposal])), [proposals]);
  const activeProposals = useMemo(() => proposals.filter((proposal) => candidates.some((candidate) => candidate.id === proposal.entity_id && candidate.status !== "published")), [candidates, proposals]);
  const readyCandidateIds = useMemo(
    () => new Set(candidates.filter((candidate) => isReadyToPublishEditorialCandidate(candidate, proposalByCandidate.get(candidate.id))).map((candidate) => candidate.id)),
    [candidates, proposalByCandidate],
  );
  const filtered = useMemo(() => candidates.filter((candidate) => {
    const proposal = proposalByCandidate.get(candidate.id);
    if (filter === "all") return true;
    if (filter === "ready") return readyCandidateIds.has(candidate.id);
    return candidate.entityType === filter || resolveEditorialDisplayStatus(candidate.status, proposal?.status) === filter;
  }), [candidates, filter, proposalByCandidate, readyCandidateIds]);
  const metrics = useMemo(() => ({
    corpus: candidates.length,
    pendingReview: candidates.filter((candidate) => {
      const status = proposalByCandidate.get(candidate.id)?.status;
      return candidate.status !== "published" && (!status || status === "generated" || status === "needs_validation");
    }).length,
    needsValidation: activeProposals.filter((proposal) => proposal.status === "needs_validation").length,
    lowRisk: activeProposals.filter((proposal) => proposal.risk_level === "low").length,
    approved: activeProposals.filter((proposal) => proposal.status === "approved").length,
    applied: candidates.filter((candidate) => resolveEditorialDisplayStatus(candidate.status, proposalByCandidate.get(candidate.id)?.status) === "applied").length,
    ready: readyCandidateIds.size,
    published: candidates.filter((candidate) => candidate.status === "published").length,
  }), [activeProposals, candidates, proposalByCandidate, readyCandidateIds]);

  const closeReview = () => {
    setSelectedProposal(null);
    window.setTimeout(() => reviewTriggerRef.current?.focus(), 0);
  };
  const selectProposal = (proposal: Proposal, trigger: HTMLButtonElement) => {
    reviewTriggerRef.current = trigger;
    const candidate = candidates.find((row) => row.id === proposal.entity_id);
    const draft = candidate?.editableDraft ?? { title: "", summary: "", content: "" };
    setHumanEdit(draft);
    setHumanEditInitial(draft);
    setHumanEditMessage("");
    setSelectedProposal(proposal);
  };
  const humanEditDirty = humanEdit.title !== humanEditInitial.title || humanEdit.summary !== humanEditInitial.summary || humanEdit.content !== humanEditInitial.content;
  const saveHumanEdit = async () => { if (!selectedProposal || !humanEditDirty || reconciliationNeeded) return; setBusy(selectedProposal.id); setHumanEditMessage(""); try { const response=await fetch("/api/admin/editorial-proposals",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({proposalId:selectedProposal.id,action:"human_edit",...humanEdit})}); const data=await response.json() as {error?:string; unchanged?:boolean; draft?: {title:string;summary:string;content:string}; proposal?: Proposal}; if(response.ok && data.draft) { setHumanEdit(data.draft); setHumanEditInitial(data.draft); if (data.proposal) setSelectedProposal(data.proposal); setHumanEditMessage(data.unchanged ? "No hay cambios para guardar." : "Corrección guardada. El contenido continúa en borrador."); await load(); } else setHumanEditMessage(data.error || "No pudimos guardar la corrección."); } catch { setHumanEditMessage("No pudimos guardar la corrección."); } finally { setBusy(null); } };
  const toggleCandidate = (candidateId: string) => setSelectedCandidateIds((current) => {
    const next = new Set(current);
    if (next.has(candidateId)) next.delete(candidateId); else next.add(candidateId);
    return next;
  });
  const selectVisible = () => setSelectedCandidateIds(new Set(filtered.filter((candidate) => candidate.status !== "published" && proposalByCandidate.has(candidate.id)).map((candidate) => candidate.id)));
  const selectLowRisk = () => setSelectedCandidateIds(new Set(selectLowRiskEditorialCandidates(filtered, proposalByCandidate)));
  const deselectAll = () => setSelectedCandidateIds(new Set());

  const generate = async (candidate: Candidate) => {
    if (!canUseCanonicalEditorialInventory(reconciliationNeeded)) return;
    setBusy(candidate.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/editorial-proposals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entityType: candidate.entityType, entityId: candidate.id }) });
      const data = await response.json() as { error?: string; reused?: boolean; skipped?: boolean };
      setMessage(response.ok ? data.reused ? "La propuesta ya está actualizada; se reutilizó la existente." : "Propuesta guardada para revisión humana." : data.error || "No pudimos generar la propuesta.");
      if (response.ok) await load();
    } finally {
      setBusy(null);
    }
  };
  const generateBatch = async () => {
    if (!canUseCanonicalEditorialInventory(reconciliationNeeded)) return;
    setBusy("batch");
    setMessage("");
    try {
      const response = await fetch("/api/admin/editorial-proposals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ batchLimit }) });
      const data = await response.json() as { error?: string; created?: number; reused?: number; remaining?: number };
      setMessage(response.ok ? `${data.created || 0} nueva(s) · ${data.reused || 0} existente(s) · ${data.remaining || 0} pendiente(s).` : data.error || "No pudimos generar el lote.");
      if (response.ok) await load();
    } finally {
      setBusy(null);
    }
  };
  const recalculateRisk = async () => {
    if (!canUseCanonicalEditorialInventory(reconciliationNeeded)) return;
    if (!window.confirm("Vas a recalcular únicamente el nivel de riesgo de las propuestas históricas. Esto no genera, aprueba, aplica ni publica contenido.")) return;
    setBusy("risk-recalculation");
    setMessage("");
    try {
      const response = await fetch("/api/admin/editorial-proposals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recalculateRisk: true }) });
      const data = await response.json() as { error?: string; scanned?: number; changed?: number; unchanged?: number };
      setMessage(response.ok ? `Riesgo recalculado: ${data.changed || 0} actualizado(s) · ${data.unchanged || 0} sin cambios · ${data.scanned || 0} analizado(s).` : data.error || "No pudimos recalcular el riesgo editorial.");
      if (response.ok) await load();
    } finally {
      setBusy(null);
    }
  };
  const review = async (action: EditorialReviewAction) => {
    const proposal = selectedProposal;
    if (!proposal || reviewOperation || !canUseCanonicalEditorialInventory(reconciliationNeeded)) return;
    setReviewOperation({ proposalId: proposal.id, action });
    setMessage("");
    try {
      const response = await fetch("/api/admin/editorial-proposals", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ proposalId: proposal.id, action }) });
      const data = await response.json() as { error?: string; reused?: boolean; unchanged?: boolean; proposal?: Proposal; published?: boolean };
      const published = action === "published" && data.published === true;
      if (!response.ok || (!data.proposal && !published)) {
        setMessage(data.error || "No pudimos registrar la revisión.");
        return;
      }
      if (data.proposal) {
        setProposals((current) => replaceCanonicalProposal(current, data.proposal!));
        setSelectedProposal(data.proposal);
      }
      if (published) {
        setCandidates((current) => current.map((candidate) => candidate.id === proposal.entity_id ? { ...candidate, status: "published" } : candidate));
      }
      setReconciliationNeeded(false);
      setMessage(action === "published" ? "Contenido publicado en STAGING; ahora puede ser utilizado por COOPIA en este entorno." : data.reused || data.unchanged ? "La propuesta ya tenía ese estado; no se duplicó la auditoría." : reviewActionMessage(action));
      if (action === "published") setSelectedCandidateIds((current) => {
        const next = new Set(current);
        next.delete(proposal.entity_id);
        return next;
      });
      if (!await load({ silent: true })) {
        setReconciliationNeeded(true);
        setMessage(reconciliationWarning());
      }
    } catch {
      setMessage("No pudimos registrar la revisión. Podés reintentar cuando estés listo.");
    } finally {
      setReviewOperation(null);
    }
  };
  const bulkReview = async (action: BulkAction) => {
    const selectedRows = candidates.filter((candidate) => selectedCandidateIds.has(candidate.id)).map((candidate) => proposalByCandidate.get(candidate.id));
    if (!selectedRows.length || bulkPending || reviewPending || !canUseCanonicalEditorialInventory(reconciliationNeeded)) return;
    if (action === "approved" && !window.confirm(`Vas a aprobar ${selectedRows.length} propuestas.\nEsto NO publica contenido.`)) return;
    setBusy(`bulk-${action}`);
    setMessage("");
    const result = { ...emptyBulkResult };
    for (const proposal of selectedRows) {
      const eligible = action === "approved" ? canBulkApproveEditorialProposal(proposal) : canBulkApplyEditorialProposal(proposal);
      if (!proposal || !eligible) {
        result.skipped += 1;
        continue;
      }
      try {
        const response = await fetch("/api/admin/editorial-proposals", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ proposalId: proposal.id, action }) });
        const data = await response.json() as { error?: string };
        if (response.ok) {
          if (action === "approved") result.approved += 1; else result.applied += 1;
        } else if ((data.error || "").toLocaleLowerCase("es-AR").includes("desactual")) {
          result.stale += 1;
        } else {
          result.failed += 1;
        }
      } catch {
        result.failed += 1;
      }
    }
    setBulkResult(result);
    setMessage(action === "approved" ? "La aprobación masiva terminó. Ningún contenido fue publicado." : "La aplicación masiva terminó. Cada borrador conserva su estado draft.");
    setBusy(null);
    if (!await load({ silent: true })) {
      setReconciliationNeeded(true);
      setMessage(reconciliationWarning());
    }
  };

  const selectedCandidate = selectedProposal ? candidates.find((candidate) => candidate.id === selectedProposal.entity_id) : null;
  const publicationGate = selectedProposal && selectedCandidate ? canPublishEditorialProposal({ entityType: selectedProposal.entity_type, proposalStatus: selectedProposal.status, candidateStatus: selectedCandidate.status, riskLevel: selectedProposal.risk_level, validationFlags: selectedProposal.validation_flags, validationPending: selectedCandidate.validationPending }) : null;
  const reviewPending = Boolean(selectedProposal && reviewOperation?.proposalId === selectedProposal.id);
  const bulkPending = busy === "bulk-approved" || busy === "bulk-applied";

  return <section className="admin-page">
    <header className="admin-page-header">
      <div><span className="eyebrow">Lote histórico Fase 4D</span><h1>Curaduría editorial IA</h1><p>La IA propone. Una persona aprueba, aplica al borrador y publica explícitamente en STAGING.</p></div>
      <div className="admin-form-actions"><label>Tamaño del lote<select value={batchLimit} disabled={busy === "batch" || reconciliationNeeded} onChange={(event) => setBatchLimit(Number(event.target.value) as 5 | 10)}><option value={5}>5</option><option value={10}>10</option></select></label><button className="primary" disabled={busy === "batch" || reconciliationNeeded} onClick={() => void generateBatch()}>{busy === "batch" ? "Procesando lote…" : `Generar lote editorial (${batchLimit})`}</button><button disabled={busy === "risk-recalculation" || reconciliationNeeded} onClick={() => void recalculateRisk()}>{busy === "risk-recalculation" ? "Recalculando…" : "Recalcular riesgos existentes"}</button></div>
    </header>

    <section className="admin-card" aria-label="Resumen editorial"><div className="admin-item"><strong>Corpus: {metrics.corpus}</strong><span>Pendientes revisión: {metrics.pendingReview}</span><span>Needs validation: {metrics.needsValidation}</span><span>Low risk: {metrics.lowRisk}</span><span>Approved: {metrics.approved}</span><span>Applied: {metrics.applied}</span><span>Ready to publish: {metrics.ready}</span><span>Published: {metrics.published}</span></div></section>
    <div className="admin-card"><label>Filtrar contenido<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todo el lote histórico</option><option value="ready">Listos para publicar</option><option value="generated">Listos para revisión</option><option value="needs_validation">Requieren validación</option><option value="approved">Aprobados</option><option value="applied">Aplicados al draft</option><option value="published">Publicados</option><option value="rejected">Rechazados</option><option value="stale">Desactualizados</option>{Object.entries(labels).filter(([value]) => ["service", "help_article", "faq", "site_page"].includes(value)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p>Planes, contactos y otros borradores quedan fuera. Publicar habilita este contenido para COOPIA y requiere una acción humana explícita.</p><div className="admin-form-actions" aria-busy={bulkPending}><button onClick={selectVisible} disabled={bulkPending || reconciliationNeeded}>Seleccionar visibles</button><button onClick={selectLowRisk} disabled={bulkPending || reconciliationNeeded}>Seleccionar sólo bajo riesgo</button><button onClick={deselectAll} disabled={bulkPending || reconciliationNeeded}>Deseleccionar todo</button><span>{selectedCandidateIds.size} seleccionados</span><button disabled={!selectedCandidateIds.size || bulkPending || reviewPending || reconciliationNeeded} onClick={() => void bulkReview("approved")}>{busy === "bulk-approved" ? "Aprobando seleccionados…" : "Aprobar seleccionados"}</button><button className="primary" disabled={!selectedCandidateIds.size || bulkPending || reviewPending || reconciliationNeeded} onClick={() => void bulkReview("applied")}>{busy === "bulk-applied" ? "Aplicando seleccionados…" : "Aplicar seleccionados al borrador"}</button></div></div>
    {bulkResult && <p className="admin-message" role="status">Resultado masivo: {bulkResult.approved} aprobadas · {bulkResult.applied} aplicadas · {bulkResult.stale} desactualizadas · {bulkResult.failed} fallidas · {bulkResult.skipped} omitidas.</p>}
    {message && <p className="admin-message" role="status">{message}</p>}
    {reconciliationNeeded && <button onClick={() => void load()} disabled={reviewPending || bulkPending}>Actualizar estado</button>}

    {selectedProposal && <section className="admin-card editorial-review" ref={reviewPanelRef} aria-labelledby="editorial-review-title" aria-busy={reviewPending}><div className="admin-review-heading"><h2 id="editorial-review-title" data-editorial-review-title tabIndex={-1}>Revisión humana</h2><button onClick={closeReview} disabled={reviewPending}>Cerrar revisión</button></div><p><strong>{selectedCandidate?.title}</strong> · Riesgo: {selectedProposal.risk_level} · Estado: {selectedCandidate ? proposalStatusLabel(selectedCandidate, selectedProposal) : selectedProposal.status}</p>{reviewPending && <p role="status">{reviewPendingLabel(reviewOperation!.action)}</p>}{selectedProposal.status === "applied" && selectedCandidate?.entityType === "help_article" && selectedCandidate.status === "draft" && <fieldset disabled={reviewPending || reconciliationNeeded}><legend>Corrección humana antes de publicar</legend><label>Título<input value={humanEdit.title} onChange={e=>setHumanEdit(current => ({...current,title:e.target.value}))}/></label><label>Resumen<textarea value={humanEdit.summary} onChange={e=>setHumanEdit(current => ({...current,summary:e.target.value}))}/></label><label>Contenido<textarea value={humanEdit.content} onChange={e=>setHumanEdit(current => ({...current,content:e.target.value}))}/></label><p role="status">{humanEditDirty ? "Cambios pendientes" : "Sin cambios"}</p>{humanEditMessage && <p className="admin-message" role="status">{humanEditMessage}</p>}<button className="primary" onClick={()=>void saveHumanEdit()} disabled={reviewPending || reconciliationNeeded || busy===selectedProposal.id || !humanEditDirty}>{busy===selectedProposal.id ? "Guardando…" : "Guardar corrección humana"}</button></fieldset>}<div className="admin-form-actions"><button onClick={() => void review("approved")} disabled={reconciliationNeeded || reviewPending || selectedCandidate?.status === "published" || !canReviewEditorialProposal(selectedProposal.status, "approved")}>{reviewPending && reviewOperation?.action === "approved" ? reviewPendingLabel("approved") : "Aprobar propuesta"}</button><button onClick={() => void review("rejected")} disabled={reconciliationNeeded || reviewPending || selectedCandidate?.status === "published" || !canReviewEditorialProposal(selectedProposal.status, "rejected")}>{reviewPending && reviewOperation?.action === "rejected" ? reviewPendingLabel("rejected") : "Rechazar"}</button><button onClick={() => void review("needs_validation")} disabled={reconciliationNeeded || reviewPending || selectedCandidate?.status === "published" || !canReviewEditorialProposal(selectedProposal.status, "needs_validation")}>{reviewPending && reviewOperation?.action === "needs_validation" ? reviewPendingLabel("needs_validation") : "Marcar para validar"}</button><button className="primary" onClick={() => void review("applied")} disabled={reconciliationNeeded || reviewPending || selectedCandidate?.status === "published" || !canApplyEditorialProposal(selectedProposal.status)}>{reviewPending && reviewOperation?.action === "applied" ? reviewPendingLabel("applied") : "Aplicar al borrador"}</button><button className="primary" onClick={() => void review("published")} disabled={reconciliationNeeded || reviewPending || !publicationGate?.allowed}>{reviewPending && reviewOperation?.action === "published" ? reviewPendingLabel("published") : "Publicar en STAGING"}</button></div></section>}

    <div className="admin-card admin-table-wrap"><table><thead><tr><th><span className="sr-only">Seleccionar</span></th><th>Contenido</th><th>Tipo</th><th>Estado</th><th>Provenance</th><th>Propuesta</th><th /></tr></thead><tbody>{filtered.map((candidate) => {
      const proposal = proposalByCandidate.get(candidate.id);
      const canGenerate = canGenerateEditorialProposal(candidate.status);
      const canSelect = candidate.status !== "published" && proposal ? proposal.status !== "stale" : false;
      return <tr key={candidate.id}><td><input type="checkbox" aria-label={`Seleccionar ${candidate.title}`} checked={selectedCandidateIds.has(candidate.id)} disabled={reconciliationNeeded || !canSelect} onChange={() => toggleCandidate(candidate.id)} /></td><td>{candidate.title}</td><td>{labels[candidate.entityType]}</td><td><span className={`admin-status ${candidate.status}`}>{candidate.status}</span></td><td>{candidate.validationPending ? `${candidate.validationPriority ?? "P"}: ${candidate.validationReason ?? "pendiente"}` : candidate.entityType === "site_page" ? "Copy top-level" : `${candidate.provenanceCount} fuente(s)`}</td><td>{proposalStatusLabel(candidate, proposal)}</td><td>{proposal && <button disabled={reconciliationNeeded} onClick={(event) => selectProposal(proposal, event.currentTarget)}>Revisar</button>} <button className="primary editorial-generate" disabled={reconciliationNeeded || busy === candidate.id || !canGenerate} aria-disabled={reconciliationNeeded || busy === candidate.id || !canGenerate} title={canGenerate ? candidate.entityType === "site_page" ? "Genera sólo eyebrow, título e introducción; los items quedan protegidos." : undefined : "Los contenidos publicados no admiten propuestas."} onClick={() => void generate(candidate)}>{busy === candidate.id ? "Generando…" : proposalActionLabel(Boolean(proposal))}</button></td></tr>;
    })}</tbody></table>{filtered.length === 0 && <p>No hay contenidos para este filtro.</p>}</div>
  </section>;
}
