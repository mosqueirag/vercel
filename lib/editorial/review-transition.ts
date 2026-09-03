export const editorialProposalStatuses = [
  "generated",
  "needs_validation",
  "approved",
  "rejected",
  "applied",
  "stale",
  "published",
] as const;

export type EditorialProposalStatus = (typeof editorialProposalStatuses)[number];
export type SimpleEditorialReviewAction = "approved" | "rejected" | "needs_validation";

export type EditorialTransitionDecision =
  | { kind: "transition"; nextStatus: SimpleEditorialReviewAction }
  | { kind: "idempotent_noop" }
  | { kind: "invalid_transition" };

export type EditorialSimpleTransitionStore<TProposal> = {
  compareAndSet: (input: { expectedStatus: string; nextStatus: SimpleEditorialReviewAction }) => Promise<{ proposal: TProposal | null; error: unknown | null }>;
  insertAudit: (input: { action: SimpleEditorialReviewAction }) => Promise<{ error: unknown | null }>;
};

export type EditorialSimpleTransitionResult<TProposal> =
  | { kind: "transition"; proposal: TProposal }
  | { kind: "idempotent_noop" }
  | { kind: "invalid_transition" }
  | { kind: "concurrency_conflict" }
  | { kind: "persistence_error" }
  | { kind: "audit_error" };

export const simpleEditorialReviewActions = new Set<SimpleEditorialReviewAction>([
  "approved",
  "rejected",
  "needs_validation",
]);

const allowedSimpleTransitions: Readonly<Record<EditorialProposalStatus, readonly SimpleEditorialReviewAction[]>> = {
  generated: ["approved", "rejected", "needs_validation"],
  needs_validation: ["approved", "rejected"],
  approved: ["rejected"],
  rejected: [],
  applied: [],
  stale: [],
  published: [],
};

export function isEditorialProposalStatus(value: unknown): value is EditorialProposalStatus {
  return typeof value === "string" && editorialProposalStatuses.includes(value as EditorialProposalStatus);
}

export function isSimpleEditorialReviewAction(value: unknown): value is SimpleEditorialReviewAction {
  return typeof value === "string" && simpleEditorialReviewActions.has(value as SimpleEditorialReviewAction);
}

/** Canonical server-side matrix for non-publishing editorial review actions. */
export function resolveEditorialProposalTransition(
  currentStatus: string,
  requestedAction: string,
): EditorialTransitionDecision {
  if (!isEditorialProposalStatus(currentStatus) || !isSimpleEditorialReviewAction(requestedAction)) {
    return { kind: "invalid_transition" };
  }
  if (currentStatus === requestedAction) return { kind: "idempotent_noop" };
  if (allowedSimpleTransitions[currentStatus].includes(requestedAction)) {
    return { kind: "transition", nextStatus: requestedAction };
  }
  return { kind: "invalid_transition" };
}

export function isIdempotentEditorialReviewTransition(currentStatus: string, requestedAction: string) {
  return resolveEditorialProposalTransition(currentStatus, requestedAction).kind === "idempotent_noop";
}

/**
 * Server/DAL transition executor. The conditional update prevents a stale client
 * from changing a proposal whose persisted state changed after it was read.
 */
export async function applySimpleEditorialProposalTransition<TProposal>(
  currentStatus: string,
  requestedAction: string,
  store: EditorialSimpleTransitionStore<TProposal>,
): Promise<EditorialSimpleTransitionResult<TProposal>> {
  const decision = resolveEditorialProposalTransition(currentStatus, requestedAction);
  if (decision.kind !== "transition") return decision;

  const updated = await store.compareAndSet({ expectedStatus: currentStatus, nextStatus: decision.nextStatus });
  if (updated.error) return { kind: "persistence_error" };
  if (!updated.proposal) return { kind: "concurrency_conflict" };

  const audit = await store.insertAudit({ action: decision.nextStatus });
  if (audit.error) return { kind: "audit_error" };
  return { kind: "transition", proposal: updated.proposal };
}
