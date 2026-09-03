import type { EditorialEntityType } from "./proposals";

export type PublicationGate = {
  allowed: boolean;
  reason?: "not_supported_type" | "not_applied" | "not_draft" | "stale" | "risk" | "validation_flags" | "validation_pending";
};

export function publicationUpdateValues(entityType: EditorialEntityType, publishedAt: string) {
  if (entityType === "service" || entityType === "site_page") return { status: "published" as const };
  return { status: "published" as const, published_at: publishedAt };
}

export function canPublishEditorialProposal(input: {
  entityType: EditorialEntityType;
  proposalStatus: string;
  candidateStatus: string;
  riskLevel: string;
  validationFlags: string[];
  validationPending: boolean;
}): PublicationGate {
  if (!(["service", "help_article", "faq", "site_page"] as const).includes(input.entityType as "service" | "help_article" | "faq" | "site_page")) return { allowed: false, reason: "not_supported_type" };
  if (input.proposalStatus === "stale") return { allowed: false, reason: "stale" };
  if (input.proposalStatus !== "applied") return { allowed: false, reason: "not_applied" };
  if (input.candidateStatus !== "draft") return { allowed: false, reason: "not_draft" };
  if (input.riskLevel !== "low") return { allowed: false, reason: "risk" };
  if (input.validationFlags.length) return { allowed: false, reason: "validation_flags" };
  if (input.validationPending) return { allowed: false, reason: "validation_pending" };
  return { allowed: true };
}

export function publicationGateMessage(gate: PublicationGate) {
  if (gate.allowed) return "Listo para publicar en STAGING.";
  const messages: Record<NonNullable<PublicationGate["reason"]>, string> = {
    not_supported_type: "Sólo servicios, artículos y FAQ pueden publicarse desde este flujo.",
    not_applied: "La propuesta debe estar aplicada al borrador antes de publicar.",
    not_draft: "El contenido ya no es un borrador publicable.",
    stale: "La propuesta está desactualizada y requiere una nueva revisión.",
    risk: "El nivel de riesgo requiere validación humana adicional.",
    validation_flags: "Hay hechos protegidos o validaciones pendientes en la propuesta.",
    validation_pending: "La evidencia histórica vinculada todavía requiere validación.",
  };
  return messages[gate.reason ?? "not_applied"];
}
