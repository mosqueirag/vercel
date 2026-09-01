export type HelpArticlePublication = { status: string | null; published_at: string | null };

export function isCanonicalHelpArticleSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

export function helpArticleParagraphs(content: string) {
  return content.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

/** Public web visibility is stricter than a raw service-role read. */
export function isPublishedHelpArticle(article: HelpArticlePublication, now = new Date()) {
  if (article.status !== "published" || !article.published_at) return false;
  const publishedAt = new Date(article.published_at);
  return !Number.isNaN(publishedAt.getTime()) && publishedAt <= now;
}
