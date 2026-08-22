import { isSameOrigin, requireNewsAdmin } from "../../../../lib/admin-auth";
import { getEditorialCandidate, getEditorialCandidates, getEditorialProposals } from "../../../../lib/data/editorial-content";
import { generateEditorialProposal } from "../../../../lib/editorial/generator";
import { contentSourceHash, editorialPromptVersion, extractProtectedFacts, proposalNeedsValidation, proposalRiskLevel, type EditorialEntityType } from "../../../../lib/editorial/proposals";

const entityTypes = new Set<EditorialEntityType>(["service", "help_article", "faq", "internet_plan", "contact_channel"]);
const isEntityType = (value: unknown): value is EditorialEntityType => typeof value === "string" && entityTypes.has(value as EditorialEntityType);

export async function GET() {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const [candidates, proposals] = await Promise.all([getEditorialCandidates(), getEditorialProposals()]);
  return Response.json({ candidates: candidates.map((candidate) => ({ id: candidate.id, entityType: candidate.entityType, title: candidate.title, status: candidate.status, provenanceCount: candidate.provenanceCount, validationPending: candidate.validationPending })), proposals });
}

export async function POST(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const body = await request.json().catch(() => null) as { entityType?: unknown; entityId?: unknown; batchLimit?: unknown } | null;
  if (!body) return Response.json({ error: "Solicitud editorial inválida." }, { status: 400 });
  const create = async (candidate: NonNullable<Awaited<ReturnType<typeof getEditorialCandidate>>>) => {
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
    if (typeof body.batchLimit === "number") {
      const limit = Math.max(1, Math.min(10, Math.floor(body.batchLimit)));
      const candidates = (await getEditorialCandidates()).filter((candidate) => candidate.status === "draft").slice(0, limit);
      const results = [];
      for (const candidate of candidates) results.push(await create(candidate));
      return Response.json({ processed: results.length, created: results.filter((result) => "reused" in result && !result.reused).length, reused: results.filter((result) => "reused" in result && result.reused).length });
    }
    if (!isEntityType(body.entityType) || typeof body.entityId !== "string") return Response.json({ error: "Solicitud editorial inválida." }, { status: 400 });
    const candidate = await getEditorialCandidate(body.entityType, body.entityId);
    if (!candidate) return Response.json({ error: "Contenido no encontrado." }, { status: 404 });
    const result = await create(candidate);
    if ("skipped" in result) return Response.json({ error: "Sólo se pueden generar propuestas sobre borradores." }, { status: 409 });
    return Response.json({ proposal: result.proposal, reused: result.reused }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "EDITORIAL_AI_ERROR";
    return Response.json({ error: code === "EDITORIAL_AI_NOT_CONFIGURED" ? "La IA editorial no está configurada en este entorno." : "No pudimos generar una propuesta segura." }, { status: 503 });
  }
}
