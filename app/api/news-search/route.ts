import OpenAI from "openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getPublishedNews } from "../../../lib/news";

export const runtime = "nodejs";

const schema = z.object({ query: z.string().trim().min(3).max(300) });
const attempts = new Map<string, { count: number; reset: number }>();

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function findMatches(query: string, articles: Awaited<ReturnType<typeof getPublishedNews>>) {
  const terms = normalize(query).split(/\W+/).filter((term) => term.length > 2);
  return articles.map((article) => {
    const title = normalize(article.title);
    const category = normalize(article.category);
    const content = normalize(`${article.excerpt} ${article.body.join(" ")}`);
    const score = terms.reduce((total, term) => total + (title.includes(term) ? 5 : 0) + (category.includes(term) ? 3 : 0) + (content.includes(term) ? 1 : 0), 0);
    return { article, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 4).map(({ article }) => article);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const rate = attempts.get(ip);
  if (rate && rate.reset > now && rate.count >= 15) return Response.json({ error: "Realizaste demasiadas búsquedas. Intentá nuevamente en unos minutos." }, { status: 429 });
  attempts.set(ip, { count: rate && rate.reset > now ? rate.count + 1 : 1, reset: now + 10 * 60_000 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Escribí una consulta de al menos tres caracteres." }, { status: 400 });
  const articles = await getPublishedNews();
  const matches = findMatches(parsed.data.query, articles);
  const resultLinks = matches.map(({ slug, title, category }) => ({ slug, title, category }));
  const fallback = matches.length ? `Encontré ${matches.length} ${matches.length === 1 ? "publicación relacionada" : "publicaciones relacionadas"} con tu consulta.` : "No encontré una publicación que coincida claramente. Probá describiendo el tema con otras palabras.";
  if (!process.env.OPENAI_API_KEY || matches.length === 0) return Response.json({ answer: fallback, matches: resultLinks });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const context = matches.map((article, index) => `${index + 1}. ${article.title} [${article.category}]: ${article.excerpt}`).join("\n");
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
      max_output_tokens: 180,
      instructions: "Sos el buscador de noticias oficiales de COOPSAR. Respondé en español argentino, en no más de tres oraciones. Explicá cuáles resultados sirven y por qué. Usá solamente el listado proporcionado. No agregues fechas, hechos ni datos que no estén allí.",
      input: `Consulta: ${parsed.data.query}\n\nResultados oficiales disponibles:\n${context}`,
    });
    return Response.json({ answer: response.output_text.trim() || fallback, matches: resultLinks });
  } catch (error) {
    console.error("News AI search failed", error instanceof Error ? error.message : "unknown_error");
    return Response.json({ answer: fallback, matches: resultLinks });
  }
}
