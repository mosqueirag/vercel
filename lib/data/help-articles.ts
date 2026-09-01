import "server-only";

import { createSupabaseAdmin } from "../supabase";
import { isCanonicalHelpArticleSlug, isPublishedHelpArticle } from "./help-article-visibility";

export { helpArticleParagraphs, isCanonicalHelpArticleSlug, isPublishedHelpArticle } from "./help-article-visibility";

export type PublicHelpArticle = {
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: string | null;
  published_at: string;
};

function asPublicArticle(row: Record<string, unknown>): PublicHelpArticle | null {
  const slug = typeof row.slug === "string" ? row.slug : "";
  const title = typeof row.title === "string" ? row.title : "";
  const content = typeof row.content === "string" ? row.content : "";
  const published_at = typeof row.published_at === "string" ? row.published_at : "";
  if (!slug || !title || !content || !published_at) return null;
  return {
    slug,
    title,
    content,
    published_at,
    summary: typeof row.summary === "string" ? row.summary : null,
    category: typeof row.category === "string" ? row.category : null,
  };
}

const publicFields = "slug,title,summary,content,category,published_at";

export async function getPublishedHelpArticleBySlug(slug: string): Promise<PublicHelpArticle | null> {
  const supabase = createSupabaseAdmin();
  if (!supabase || !isCanonicalHelpArticleSlug(slug)) return null;
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("help_articles").select(publicFields).eq("slug", slug).eq("status", "published").lte("published_at", now).maybeSingle();
  if (error || !data || !isPublishedHelpArticle({ status: "published", published_at: data.published_at }, new Date(now))) return null;
  return asPublicArticle(data);
}

export async function getPublishedHelpArticles(): Promise<PublicHelpArticle[]> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return [];
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("help_articles").select(publicFields).eq("status", "published").lte("published_at", now).order("published_at", { ascending: false }).limit(30);
  if (error) return [];
  return (data ?? []).filter((row) => isPublishedHelpArticle({ status: "published", published_at: row.published_at }, new Date(now))).map((row) => asPublicArticle(row)).filter((row): row is PublicHelpArticle => Boolean(row));
}
