import { createSupabaseAdmin } from "../supabase";
import { isVisibleToCoopia } from "./curated-content-visibility";

export type CuratedKnowledge = {
  services: Array<{ slug: string; name: string; description: string }>;
  articles: Array<{ slug: string; title: string; summary: string | null; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

const emptyKnowledge: CuratedKnowledge = { services: [], articles: [], faqs: [] };

/**
 * Server-only knowledge projection. Explicit publication checks are required
 * because the server client bypasses RLS and WordPress imports are drafts.
 */
export async function getPublishedCuratedKnowledge(): Promise<CuratedKnowledge> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return emptyKnowledge;

  const now = new Date().toISOString();
  const [services, articles, faqs] = await Promise.all([
    supabase.from("services").select("slug,name,description").eq("status", "published").order("sort_order"),
    supabase.from("help_articles").select("slug,title,summary,content,published_at").eq("status", "published").lte("published_at", now).order("published_at", { ascending: false }).limit(30),
    supabase.from("faqs").select("question,answer,published_at").eq("status", "published").lte("published_at", now).order("sort_order").limit(40),
  ]);

  if (services.error || articles.error || faqs.error) {
    console.error("Published curated content unavailable");
    return emptyKnowledge;
  }

  const nowDate = new Date(now);
  return {
    services: services.data ?? [],
    articles: (articles.data ?? []).filter((article) => isVisibleToCoopia({ status: "published", published_at: article.published_at }, nowDate)).map((article) => ({ slug: article.slug, title: article.title, summary: article.summary, content: article.content })),
    faqs: (faqs.data ?? []).filter((faq) => isVisibleToCoopia({ status: "published", published_at: faq.published_at }, nowDate)).map((faq) => ({ question: faq.question, answer: faq.answer })),
  };
}

export function formatCuratedKnowledge(knowledge: CuratedKnowledge) {
  return [
    ...knowledge.services.map((service) => `SERVICIO: ${service.name}\n${service.description}`),
    ...knowledge.articles.map((article) => `ARTÍCULO: ${article.title}\n${article.summary ?? ""}\n${article.content}`),
    ...knowledge.faqs.map((faq) => `PREGUNTA: ${faq.question}\nRESPUESTA: ${faq.answer}`),
  ].join("\n\n");
}
