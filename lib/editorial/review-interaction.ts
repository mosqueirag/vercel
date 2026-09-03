import {
  resolveEditorialProposalTransition,
} from "./review-transition";

export type { EditorialProposalStatus } from "./review-transition";

export type EditorialReviewAction = "approved" | "rejected" | "needs_validation" | "applied" | "published";

type ReviewPanelTarget = {
  scrollIntoView: (options: ScrollIntoViewOptions) => void;
  querySelector: (selector: string) => HTMLElement | null;
};

export function canApplyEditorialProposal(status: string) {
  return status === "approved";
}

/** Client-side affordance only. The route remains the canonical transition gate. */
export function canReviewEditorialProposal(status: string, action: EditorialReviewAction) {
  if (action === "applied") return canApplyEditorialProposal(status);
  if (action === "published") return status === "applied";
  return resolveEditorialProposalTransition(status, action).kind === "transition";
}

export function reviewPendingLabel(action: EditorialReviewAction) {
  switch (action) {
    case "approved": return "Aprobando…";
    case "rejected": return "Rechazando…";
    case "needs_validation": return "Marcando para validar…";
    case "applied": return "Aplicando…";
    case "published": return "Publicando…";
  }
}

export function reconciliationWarning() {
  return "La operación fue confirmada. No pudimos actualizar el listado; podés actualizar el estado de forma segura.";
}

/** Mutations stay disabled until a failed inventory refresh is reconciled. */
export function canUseCanonicalEditorialInventory(reconciliationNeeded: boolean) {
  return !reconciliationNeeded;
}

export function replaceCanonicalProposal<T extends { id: string }>(proposals: T[], canonical: T) {
  return proposals.map((proposal) => proposal.id === canonical.id ? canonical : proposal);
}

export function canGenerateEditorialProposal(contentStatus: string) {
  return contentStatus === "draft";
}

export function proposalActionLabel(hasProposal: boolean) {
  return hasProposal ? "Ver propuesta actual" : "Generar propuesta";
}

export function reviewActionMessage(action: EditorialReviewAction) {
  switch (action) {
    case "approved":
      return "Propuesta aprobada para aplicar al borrador. Sigue sin publicar.";
    case "rejected":
      return "Propuesta rechazada. El borrador no fue modificado.";
    case "needs_validation":
      return "Propuesta marcada para validación humana.";
    case "applied":
      return "Propuesta aplicada al borrador; no fue publicada.";
    default:
      return "Revisión registrada.";
  }
}

export function isEditorialReviewDismissKey(key: string) {
  return key === "Escape";
}

export function focusEditorialReviewPanel(panel: ReviewPanelTarget | null) {
  if (!panel) return;

  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  panel.querySelector("[data-editorial-review-title]")?.focus();
}
