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
import { canPublishEditorialProposal, publicationGateMessage } from "../../../lib/editorial/publication";
import {
  canApplyEditorialProposal,
  canGenerateEditorialProposal,
  focusEditorialReviewPanel,
  isEditorialReviewDismissKey,
  proposalActionLabel,
  reviewActionMessage,
} from "../../../lib/editorial/review-interaction";

type Candidate = EditorialReviewCandidate & {
  title: string;
  originalText: string;
  provenanceCount: number;
  validationReason?: string;
  validationPriority?: string;
};
type ProposalData = { rewritten_title?: string; rewritten_summary?: string; rewritten_content?: string; suggested_ctas?: string[]; suggested_coopia_intents?: string[]; editorial_notes?: string };
type Proposal = EditorialReviewProposal & { entity_type: Candidate["entityType"]; detected_facts: Array<{ type: string; value: string }>; proposal: ProposalData; updated_at: string };
type BulkAction = "approved" | "applied";
type BulkResult = { approved: number; applied: number; stale: number; failed: number; skipped: number };

const labels: Record<Candidate["entityType"], string> = { service: "Servicio", help_article: "Artículo", faq: "FAQ", internet_plan: "Plan", contact_channel: "Contacto" };
const emptyBulkResult: BulkResult = { approved: 0, applied: 0, stale: 0, failed: 0, skipped: 0 };

function proposalStatusLabel(proposal: Proposal | undefined) {
  if (!proposal) return "Pendiente";
  return `${proposal.status}${proposal.validation_flags.length ? " · validar" : ""}`;
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
  const reviewPanelRef = useRef<HTMLElement>(null);
  const reviewTriggerRef = useRef<HTMLButtonElement>(null);

  const load = async () => {
    const response = await fetch("/api/admin/editorial-proposals", { cache: "no-store" });
    const data = await response.json() as { candidates?: Candidate[]; proposals?: Proposal[]; error?: string };
    if (!response.ok) {
      setMessage(data.error || "No pudimos cargar el centro de contenidos.");
      return;
    }
    setCandidates(data.candidates || []);
    setProposals(data.proposals || []);
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
  const readyCandidateIds = useMemo(
    () => new Set(candidates.filter((candidate) => isReadyToPublishEditorialCandidate(candidate, proposalByCandidate.get(candidate.id))).map((candidate) => candidate.id)),
    [candidates, proposalByCandidate],
  );
  const filtered = useMemo(() => candidates.filter((candidate) => {
    const proposal = proposalByCandidate.get(candidate.id);
    if (filter === "all") return true;
    if (filter === "ready") return readyCandidateIds.has(candidate.id);
    return candidate.entityType === filter || proposal?.status === filter;
  }), [candidates, filter, proposalByCandidate, readyCandidateIds]);
  const metrics = useMemo(() => ({
    corpus: candidates.length,
    pendingReview: candidates.filter((candidate) => {
      const status = proposalByCandidate.get(candidate.id)?.status;
      return !status || status === "generated" || status === "needs_validation";
    }).length,
    needsValidation: proposals.filter((proposal) => proposal.status === "needs_validation").length,
    lowRisk: proposals.filter((proposal) => proposal.risk_level === "low").length,
    approved: proposals.filter((proposal) => proposal.status === "approved").length,
    applied: proposals.filter((proposal) => proposal.status === "applied").length,
    ready: readyCandidateIds.size,
    published: candidates.filter((candidate) => candidate.status === "published").length,
  }), [candidates, proposals, proposalByCandidate, readyCandidateIds]);

  const closeReview = () => {
    setSelectedProposal(null);
    window.setTimeout(() => reviewTriggerRef.current?.focus(), 0);
  };
  const selectProposal = (proposal: Proposal, trigger: HTMLButtonElement) => {
    reviewTriggerRef.current = trigger;
    setSelectedProposal(proposal);
  };
  const toggleCandidate = (candidateId: string) => setSelectedCandidateIds((current) => {
    const next = new Set(current);
    if (next.has(candidateId)) next.delete(candidateId); else next.add(candidateId);
    return next;
  });
  const selectVisible = () => setSelectedCandidateIds(new Set(filtered.filter((candidate) => proposalByCandidate.has(candidate.id)).map((candidate) => candidate.id)));
  const selectLowRisk = () => setSelectedCandidateIds(new Set(selectLowRiskEditorialCandidates(filtered, proposalByCandidate)));
  const deselectAll = () => setSelectedCandidateIds(new Set());

  const generate = async (candidate: Candidate) => {
    setBusy(candidate.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/editorial-proposals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entityType: candidate.entityType, entityId: candidate.id }) });
      const data = await response.json() as { error?: string; reused?: boolean };
      setMessage(response.ok ? data.reused ? "La propuesta ya está actualizada; se reutilizó la existente." : "Propuesta guardada para revisión humana." : data.error || "No pudimos generar la propuesta.");
      if (response.ok) await load();
    } finally {
      setBusy(null);
    }
  };
  const generateBatch = async () => {
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
  const review = async (action: "approved" | "rejected" | "needs_validation" | "applied" | "published") => {
    if (!selectedProposal) return;
    setBusy(selectedProposal.id);
    const response = await fetch("/api/admin/editorial-proposals", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ proposalId: selectedProposal.id, action }) });
    const data = await response.json() as { error?: string };
    setMessage(response.ok ? action === "published" ? "Contenido publicado en STAGING; ahora puede ser utilizado por COOPIA en este entorno." : reviewActionMessage(action) : data.error || "No pudimos registrar la revisión.");
    setBusy(null);
    if (response.ok) {
      closeReview();
      await load();
    }
  };
  const bulkReview = async (action: BulkAction) => {
    const selectedRows = candidates.filter((candidate) => selectedCandidateIds.has(candidate.id)).map((candidate) => proposalByCandidate.get(candidate.id));
    if (!selectedRows.length) return;
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
    await load();
  };

  const selectedCandidate = selectedProposal ? candidates.find((candidate) => candidate.id === selectedProposal.entity_id) : null;
  const publicationGate = selectedProposal && selectedCandidate ? canPublishEditorialProposal({ entityType: selectedProposal.entity_type, proposalStatus: selectedProposal.status, candidateStatus: selectedCandidate.status, riskLevel: selectedProposal.risk_level, validationFlags: selectedProposal.validation_flags, validationPending: selectedCandidate.validationPending }) : null;

  return <section className="admin-page">
    <header className="admin-page-header">
      <div><span className="eyebrow">Lote histórico Fase 4D</span><h1>Curaduría editorial IA</h1><p>La IA propone. Una persona aprueba, aplica al borrador y publica explícitamente en STAGING.</p></div>
      <div className="admin-form-actions"><label>Tamaño del lote<select value={batchLimit} disabled={busy === "batch"} onChange={(event) => setBatchLimit(Number(event.target.value) as 5 | 10)}><option value={5}>5</option><option value={10}>10</option></select></label><button className="primary" disabled={busy === "batch"} onClick={() => void generateBatch()}>{busy === "batch" ? "Procesando lote…" : `Generar lote editorial (${batchLimit})`}</button></div>
    </header>

    <section className="admin-card" aria-label="Resumen editorial"><div className="admin-item"><strong>Corpus: {metrics.corpus}</strong><span>Pendientes revisión: {metrics.pendingReview}</span><span>Needs validation: {metrics.needsValidation}</span><span>Low risk: {metrics.lowRisk}</span><span>Approved: {metrics.approved}</span><span>Applied: {metrics.applied}</span><span>Ready to publish: {metrics.ready}</span><span>Published: {metrics.published}</span></div></section>
    <div className="admin-card"><label>Filtrar contenido<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todo el lote histórico</option><option value="ready">Listos para publicar</option><option value="generated">Listos para revisión</option><option value="needs_validation">Requieren validación</option><option value="approved">Aprobados</option><option value="applied">Aplicados al draft</option><option value="rejected">Rechazados</option><option value="stale">Desactualizados</option>{Object.entries(labels).filter(([value]) => ["service", "help_article", "faq"].includes(value)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p>Planes, contactos y otros borradores quedan fuera. Publicar habilita este contenido para COOPIA y requiere una acción humana explícita.</p><div className="admin-form-actions"><button onClick={selectVisible}>Seleccionar visibles</button><button onClick={selectLowRisk}>Seleccionar sólo bajo riesgo</button><button onClick={deselectAll}>Deseleccionar todo</button><span>{selectedCandidateIds.size} seleccionados</span><button disabled={!selectedCandidateIds.size || busy === "bulk-approved"} onClick={() => void bulkReview("approved")}>Aprobar seleccionados</button><button className="primary" disabled={!selectedCandidateIds.size || busy === "bulk-applied"} onClick={() => void bulkReview("applied")}>Aplicar seleccionados al borrador</button></div></div>
    {bulkResult && <p className="admin-message" role="status">Resultado masivo: {bulkResult.approved} aprobadas · {bulkResult.applied} aplicadas · {bulkResult.stale} desactualizadas · {bulkResult.failed} fallidas · {bulkResult.skipped} omitidas.</p>}
    {message && <p className="admin-message" role="status">{message}</p>}

    {selectedProposal && <section className="admin-card editorial-review" ref={reviewPanelRef} aria-labelledby="editorial-review-title"><div className="admin-review-heading"><h2 id="editorial-review-title" data-editorial-review-title tabIndex={-1}>Revisión humana</h2><button onClick={closeReview}>Cerrar revisión</button></div><p><strong>{selectedCandidate?.title}</strong> · Riesgo: {selectedProposal.risk_level} · Estado: {selectedProposal.status}</p><div className="admin-item"><div><h3>Borrador actual</h3><p>{selectedCandidate?.originalText}</p></div><div><h3>Propuesta IA</h3><p>{selectedProposal.proposal.rewritten_title || "Sin cambio de título"}</p><p>{selectedProposal.proposal.rewritten_summary}</p><p>{selectedProposal.proposal.rewritten_content}</p></div></div><p><strong>Hechos protegidos:</strong> {selectedProposal.detected_facts.map((fact) => `${fact.type}: ${fact.value}`).join(" · ") || "No detectados"}</p><p><strong>Validaciones:</strong> {selectedProposal.validation_flags.join(", ") || selectedCandidate?.validationReason || "Sin alertas automáticas"}</p><p><strong>Publicación:</strong> {publicationGate ? publicationGateMessage(publicationGate) : "No disponible"}</p><div className="admin-form-actions"><button onClick={() => void review("approved")} disabled={busy === selectedProposal.id}>Aprobar propuesta</button><button onClick={() => void review("rejected")} disabled={busy === selectedProposal.id}>Rechazar</button><button onClick={() => void review("needs_validation")} disabled={busy === selectedProposal.id}>Marcar para validar</button><button className="primary" onClick={() => void review("applied")} disabled={busy === selectedProposal.id || !canApplyEditorialProposal(selectedProposal.status)}>Aplicar al borrador</button><button className="primary" onClick={() => void review("published")} disabled={busy === selectedProposal.id || !publicationGate?.allowed}>Publicar en STAGING</button></div></section>}

    <div className="admin-card admin-table-wrap"><table><thead><tr><th><span className="sr-only">Seleccionar</span></th><th>Contenido</th><th>Tipo</th><th>Estado</th><th>Provenance</th><th>Propuesta</th><th /></tr></thead><tbody>{filtered.map((candidate) => {
      const proposal = proposalByCandidate.get(candidate.id);
      const canGenerate = canGenerateEditorialProposal(candidate.status);
      const canSelect = proposal ? proposal.status !== "stale" : false;
      return <tr key={candidate.id}><td><input type="checkbox" aria-label={`Seleccionar ${candidate.title}`} checked={selectedCandidateIds.has(candidate.id)} disabled={!canSelect} onChange={() => toggleCandidate(candidate.id)} /></td><td>{candidate.title}</td><td>{labels[candidate.entityType]}</td><td><span className={`admin-status ${candidate.status}`}>{candidate.status}</span></td><td>{candidate.validationPending ? `${candidate.validationPriority ?? "P"}: ${candidate.validationReason ?? "pendiente"}` : `${candidate.provenanceCount} fuente(s)`}</td><td>{proposalStatusLabel(proposal)}</td><td>{proposal && <button onClick={(event) => selectProposal(proposal, event.currentTarget)}>Revisar</button>} <button className="primary editorial-generate" disabled={busy === candidate.id || !canGenerate} aria-disabled={busy === candidate.id || !canGenerate} title={canGenerate ? undefined : "Los contenidos publicados no admiten propuestas."} onClick={() => void generate(candidate)}>{busy === candidate.id ? "Generando…" : proposalActionLabel(Boolean(proposal))}</button></td></tr>;
    })}</tbody></table>{filtered.length === 0 && <p>No hay contenidos para este filtro.</p>}</div>
  </section>;
}
