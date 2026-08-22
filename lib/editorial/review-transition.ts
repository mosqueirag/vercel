export const simpleEditorialReviewActions = new Set(["approved", "rejected", "needs_validation"]);

export function isIdempotentEditorialReviewTransition(currentStatus: string, requestedAction: string) {
  return simpleEditorialReviewActions.has(requestedAction) && currentStatus === requestedAction;
}
