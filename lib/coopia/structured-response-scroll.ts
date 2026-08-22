type StructuredResponseTarget = {
  scrollIntoView: (options: ScrollIntoViewOptions) => void;
};

/**
 * A structured result has its own immutable key. Only a new key may move the
 * conversation: feedback, layout changes, and other renders must remain idle.
 */
export function shouldAutoScrollStructuredResponse(input: {
  resultKey: string;
  hasStructuredResult: boolean;
  lastScrolledResultKey: string;
}) {
  return Boolean(input.hasStructuredResult && input.resultKey && input.resultKey !== input.lastScrolledResultKey);
}

/** Keep the scroll inside the nearest scrollable conversation container. */
export function scrollStructuredResponseIntoView(target: StructuredResponseTarget | null) {
  target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
