import { isSameOrigin, requireNewsAdmin } from "../../../../lib/admin-auth";
import { getEditorialProposals, getHistoricalEditorialCandidate, getHistoricalEditorialCandidates } from "../../../../lib/data/editorial-content";
import { generateEditorialProposal } from "../../../../lib/editorial/generator";
import { contentSourceHash, editorialPromptVersion, extractProtectedFacts, proposalIsStale, proposalNeedsValidation, proposalRiskLevel, type EditorialEntityType } from "../../../../lib/editorial/proposals";
import { canPublishEditorialProposal, publicationUpdateValues } from "../../../../lib/editorial/publication";
import { selectProgressiveEditorialBatch } from "../../../../lib/editorial/batch-selection";
import { editorialRiskRecalculation } from "../../../../lib/editorial/risk-recalculation";

const entityTypes = new Set<EditorialEntityType>(["service", "help_article", "faq", "internet_plan", "contact_channel"]);
const isEntityType = (value: unknown): value is EditorialEntityType => typeof value === "string" && entityTypes.has(value as EditorialEntityType);
const reviewActions = new Set(["approved", "rejected", "needs_validation", "applied", "published"]);
const proposalText = (proposal: unknown, key: string) => proposal && typeof proposal === "object" && typeof (proposal as Record<string, unknown>)[key] === "string" ? (proposal as Record<string, string>)[key].trim() : "";

function draftUpdate(entityType: EditorialEntityType, proposal: unknown) {
  const title = proposalText(proposal, "rewritten_title"), summary = proposalText(proposal, "rewritten_summary"), content = proposalText(proposal, "rewritten_content");
  if (entityType === "service") return { ...(title ? { name: title } : {}), ...(content || summary ? { description: content || summary } : {}) };
  if (entityType === "help_article") return { ...(title ? { title } : {}), ...(summary ? { summary } : {}), ...(content ? { content } : {}) };
  if (entityType === "faq") return { ...(title ? { question: title } : {}), ...(content || summary ? { answer: content || summary } : {}) };
  if (entityType === "internet_plan") return { ...(title ? { name: title } : {}), ...(summary ? { description: summary } : {}), ...(content ? { conditions: content } : {}) };
  return title ? { label: title } : {};
}

const entityTable: Record<EditorialEntityType, string> = { service: "services", help_article: "help_articles", faq: "faqs", internet_plan: "internet_plans", contact_channel: "public_contact_channels" };

export async function GET() {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const [candidates, proposals] = await Promise.all([getHistoricalEditorialCandidates(), getEditorialProposals()]);
  return Response.json({ candidates: candidates.map((candidate) => ({ id: candidate.id, entityType: candidate.entityType, title: candidate.title, originalText: candidate.originalText, status: candidate.status, provenanceCount: candidate.provenanceCount, validationPending: candidate.validationPending, validationReason: candidate.validationReason, validationPriority: candidate.validationPriority, sourceSlugs: candidate.sourceSlugs, historicalCorpus: candidate.historicalCorpus })), proposals });
}

export async function POST(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const body = await request.json().catch(() => null) as { entityType?: unknown; entityId?: unknown; batchLimit?: unknown; recalculateRisk?: unknown } | null;
  if (!body) return Response.json({ error: "Solicitud editorial inválida." }, { status: 400 });
  const create = async (candidate: NonNullable<Awaited<ReturnType<typeof getHistoricalEditorialCandidate>>>) => {
    if (candidate.status !== "draft") return { skipped: true as const, reason: "not_draft" };
    const sourceHash = contentSourceHash({ title: candidate.title, content: candidate.originalText, entityType: candidate.entityType });
    const { data: existing, error: existingError } = await session.admin.from("content_editorial_proposals").select("*").eq("entity_type", candidate.entityType).eq("entity_id", candidate.id).eq("source_hash", sourceHash).eq("prompt_version", editorialPromptVersion).maybeSingle();
    if (existingError) throw new Error("EDITORIAL_PROPOSAL_LOOKUP_FAILED");
    if (existing) return { proposal: existing, reused: true as const };
    const proposal = await generateEditorialProposal(candidate);
    const validationFlags = proposalNeedsValidation(candidate.entityType, candidate.originalText, proposal, candidate.validationPending);
    const row = { entity_type: candidate.entityType, entity_id: candidate.id, source_hash: sourceHash, prompt_version: editorialPromptVersion, proposal, detected_facts: extractProtectedFacts(candidate.originalText), validation_flags: validationFlags, risk_level: proposalRiskLevel(candidate.entityType, validationFlags), status: validationFlags.length ? "needs_validation" : "generated" };
    const { data, error } = await session.admin.from("content_editorial_proposals").insert(row).select("*").single();
    if (error) throw new Error("EDITORIAL_PROPOSAL_SAVE_FAILED");
    return { proposal: data, reused: false as const };
  };
  try {
    if (body.recalculateRisk === true) {
      const historicalCandidates = await getHistoricalEditorialCandidates();
      const historicalKeys = new Set(historicalCandidates.map((candidate) => `${candidate.entityType}:${candidate.id}`));
      const proposals = await getEditorialProposals();
      const recalculation = editorialRiskRecalculation(proposals, historicalKeys);
      for (const change of recalculation.changes) {
        const { error } = await session.admin.from("content_editorial_proposals").update({ risk_level: change.riskLevel }).eq("id", change.id);
        if (error) throw new Error("EDITORIAL_RISK_RECALCULATION_FAILED");
      }
      return Response.json({ scanned: recalculation.scanned, changed: recalculation.changed, unchanged: recalculation.unchanged });
    }
    if (typeof body.batchLimit === "number") {
      const limit = Math.max(1, Math.min(10, Math.floor(body.batchLimit)));
      const [historicalCandidates, proposals] = await Promise.all([getHistoricalEditorialCandidates(), getEditorialProposals()]);
      const batch = selectProgressiveEditorialBatch(historicalCandidates, proposals, limit);
      const results = [];
      for (const candidate of batch.selected) results.push(await create(candidate));
      return Response.json({ processed: results.length, created: results.filter((result) => "reused" in result && !result.reused).length, reused: results.filter((result) => "reused" in result && result.reused).length, remaining: batch.remaining, totalCorpus: batch.totalCorpus, alreadyProcessed: batch.alreadyProcessed });
    }
    if (!isEntityType(body.entityType) || typeof body.entityId !== "string") return Response.json({ error: "Solicitud editorial inválida." }, { status: 400 });
    const candidate = await getHistoricalEditorialCandidate(body.entityType, body.entityId);
    if (!candidate) return Response.json({ error: "Contenido no encontrado." }, { status: 404 });
    const result = await create(candidate);
    if ("skipped" in result) return Response.json({ error: "Sólo se pueden generar propuestas sobre borradores." }, { status: 409 });
    return Response.json({ proposal: result.proposal, reused: result.reused }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "EDITORIAL_AI_ERROR";
    return Response.json({ error: code === "EDITORIAL_AI_NOT_CONFIGURED" ? "La IA editorial no está configurada en este entorno." : "No pudimos generar una propuesta segura." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const body = await request.json().catch(() => null) as { proposalId?: unknown; action?: unknown } | null;
  if (!body || typeof body.proposalId !== "string" || typeof body.action !== "string" || !reviewActions.has(body.action)) return Response.json({ error: "Acción editorial inválida." }, { status: 400 });
  const { data: proposal, error } = await session.admin.from("content_editorial_proposals").select("*").eq("id", body.proposalId).maybeSingle();
  if (error || !proposal) return Response.json({ error: "Propuesta no encontrada." }, { status: 404 });
  const audit = async (action: string, metadata: Record<string, unknown> = {}) => session.admin.from("content_editorial_proposal_audit").insert({ proposal_id: proposal.id, action, actor_email: session.email, metadata });
  if (body.action === "published") {
    const candidate = await getHistoricalEditorialCandidate(proposal.entity_type as EditorialEntityType, proposal.entity_id);
    const validationFlags = Array.isArray(proposal.validation_flags) ? proposal.validation_flags.filter((value: unknown): value is string => typeof value === "string") : [];
    const gate = candidate && canPublishEditorialProposal({ entityType: proposal.entity_type as EditorialEntityType, proposalStatus: proposal.status, candidateStatus: candidate.status, riskLevel: proposal.risk_level, validationFlags, validationPending: candidate.validationPending });
    if (!candidate || !gate?.allowed) {
      await audit("publication_blocked", { reason: gate?.reason ?? "historical_candidate_required", risk: proposal.risk_level, validation_pending: candidate?.validationPending ?? true });
      return Response.json({ error: "La publicación fue bloqueada por los controles de seguridad." }, { status: 409 });
    }
    const { data: published, error: publishError } = await session.admin.from(entityTable[candidate.entityType]).update(publicationUpdateValues(candidate.entityType, new Date().toISOString())).eq("id", candidate.id).eq("status", "draft").select("id").maybeSingle();
    if (publishError || !published) {
      await audit("publication_blocked", { reason: "target_not_draft" });
      return Response.json({ error: "El contenido ya no es un borrador publicable." }, { status: 409 });
    }
    if ((await audit("published", { entity_type: candidate.entityType, previous_status: "draft", new_status: "published", risk: proposal.risk_level })).error) return Response.json({ error: "El contenido fue publicado, pero no pudimos registrar la auditoría." }, { status: 503 });
    return Response.json({ published: true });
  }
  if (body.action !== "applied") {
    const { data, error: updateError } = await session.admin.from("content_editorial_proposals").update({ status: body.action, reviewed_at: new Date().toISOString(), reviewed_by: session.email }).eq("id", proposal.id).select("*").single();
    const { error: auditError } = await audit(body.action);
    if (updateError || auditError) return Response.json({ error: "No pudimos registrar la revisión." }, { status: 503 });
    return Response.json({ proposal: data });
  }
  if (proposal.status !== "approved") return Response.json({ error: "La propuesta debe aprobarse antes de aplicarla al borrador." }, { status: 409 });
  const candidate = await getHistoricalEditorialCandidate(proposal.entity_type as EditorialEntityType, proposal.entity_id);
  if (!candidate || candidate.status !== "draft") return Response.json({ error: "El contenido original ya no es un borrador aplicable." }, { status: 409 });
  const currentHash = contentSourceHash({ title: candidate.title, content: candidate.originalText, entityType: candidate.entityType });
  if (proposalIsStale(currentHash, proposal.source_hash)) {
    await session.admin.from("content_editorial_proposals").update({ status: "stale" }).eq("id", proposal.id);
    await audit("stale", { reason: "source_hash_changed" });
    return Response.json({ error: "El borrador cambió desde la generación; la propuesta quedó desactualizada." }, { status: 409 });
  }
  const values = draftUpdate(candidate.entityType, proposal.proposal);
  if (!Object.keys(values).length) return Response.json({ error: "La propuesta no contiene cambios aplicables." }, { status: 409 });
  const { data: appliedDraft, error: applyError } = await session.admin.from(entityTable[candidate.entityType]).update(values).eq("id", candidate.id).eq("status", "draft").select("id").maybeSingle();
  if (applyError || !appliedDraft) return Response.json({ error: "El contenido ya no es un borrador aplicable." }, { status: 409 });
  const { data, error: finalError } = await session.admin.from("content_editorial_proposals").update({ status: "applied", reviewed_at: new Date().toISOString(), reviewed_by: session.email }).eq("id", proposal.id).select("*").single();
  if (finalError || (await audit("applied", { target_status: "draft" })).error) return Response.json({ error: "El borrador se actualizó, pero no pudimos registrar la auditoría." }, { status: 503 });
  return Response.json({ proposal: data, appliedToDraft: true });
}
