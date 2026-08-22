export type EditorialProposalStatus =
  | "generated"
  | "needs_validation"
  | "approved"
  | "rejected"
  | "applied"
  | "stale";

type ReviewPanelTarget = {
  scrollIntoView: (options: ScrollIntoViewOptions) => void;
  querySelector: (selector: string) => HTMLElement | null;
};

export function canApplyEditorialProposal(status: string) {
  return status === "approved";
}

export function canGenerateEditorialProposal(contentStatus: string) {
  return contentStatus === "draft";
}

export function proposalActionLabel(hasProposal: boolean) {
  return hasProposal ? "Ver propuesta actual" : "Generar propuesta";
}

export function reviewActionMessage(action: EditorialProposalStatus) {
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
