export type CuratedPublicationState = { status: string | null; published_at?: string | null };

/**
 * Defensive second gate for the server-side COOPIA knowledge projection.
 * RLS does not protect the service client, so draft records must never be
 * included even if a future query is accidentally widened.
 */
export function isVisibleToCoopia(record: CuratedPublicationState, now = new Date()) {
  if (record.status !== "published") return false;
  if (!record.published_at) return true;
  const publishedAt = new Date(record.published_at);
  return !Number.isNaN(publishedAt.getTime()) && publishedAt <= now;
}
