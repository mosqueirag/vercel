import { createSupabaseAdmin } from "../supabase";

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
    supabase.from("help_articles").select("slug,title,summary,content").eq("status", "published").lte("published_at", now).order("published_at", { ascending: false }).limit(30),
    supabase.from("faqs").select("question,answer").eq("status", "published").lte("published_at", now).order("sort_order").limit(40),
  ]);

  if (services.error || articles.error || faqs.error) {
    console.error("Published curated content unavailable");
    return emptyKnowledge;
  }

  return { services: services.data ?? [], articles: articles.data ?? [], faqs: faqs.data ?? [] };
}

export function formatCuratedKnowledge(knowledge: CuratedKnowledge) {
  return [
    ...knowledge.services.map((service) => `SERVICIO: ${service.name}\n${service.description}`),
    ...knowledge.articles.map((article) => `ARTÍCULO: ${article.title}\n${article.summary ?? ""}\n${article.content}`),
    ...knowledge.faqs.map((faq) => `PREGUNTA: ${faq.question}\nRESPUESTA: ${faq.answer}`),
  ].join("\n\n");
}
