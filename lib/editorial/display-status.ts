export type EditorialDisplayStatus = "pending" | "generated" | "needs_validation" | "approved" | "rejected" | "applied" | "stale" | "published";

/** The candidate owns public publication; a proposal remains applied to the draft. */
export function resolveEditorialDisplayStatus(candidateStatus: string, proposalStatus?: string): EditorialDisplayStatus {
  if (candidateStatus === "published") return "published";
  if (["generated", "needs_validation", "approved", "rejected", "applied", "stale"].includes(proposalStatus ?? "")) return proposalStatus as EditorialDisplayStatus;
  return "pending";
}
