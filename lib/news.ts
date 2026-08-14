import "server-only";
import { createSupabaseAdmin } from "./supabase";

export type NewsArticle = {
  id: string;
  slug: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  body: string[];
  imageUrl: string | null;
};

export const fallbackNews: NewsArticle[] = [
  { id: "fallback-1", slug: "mantenimiento-infraestructura-electrica", category: "ENERGÍA", date: "1 JUL 2026", title: "Mantenimiento y mejoras en la infraestructura eléctrica", excerpt: "Continúan los trabajos preventivos y las mejoras de capacidad en distintos sectores de Sarmiento.", body: ["COOPSAR continúa ejecutando tareas preventivas y mejoras sobre la red de distribución eléctrica."], imageUrl: null },
  { id: "fallback-2", slug: "fibra-optica-nuevas-zonas", category: "FIBRA ÓPTICA", date: "9 JUL 2026", title: "La fibra óptica continúa llegando a nuevas zonas", excerpt: "La red FTTH de COOPSAR sigue ampliándose para ofrecer mayor velocidad, estabilidad y capacidad.", body: ["La contratación está sujeta a disponibilidad técnica."], imageUrl: null },
  { id: "fallback-3", slug: "servicio-solidario-sepelios", category: "SERVICIO SOLIDARIO", date: "13 JUN 2026", title: "El Servicio Solidario acompaña a las familias", excerpt: "Un servicio cooperativo creado para brindar asistencia y contención cuando más se necesita.", body: ["El Servicio Solidario forma parte del acompañamiento comunitario de COOPSAR."], imageUrl: null },
];

function mapArticle(row: Record<string, unknown>): NewsArticle {
  const published = String(row.published_at || row.created_at || new Date().toISOString());
  return {
    id: String(row.id),
    slug: String(row.slug),
    category: String(row.category),
    date: new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(published)).toUpperCase(),
    title: String(row.title),
    excerpt: String(row.excerpt),
    body: String(row.content).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean),
    imageUrl: typeof row.image_url === "string" && row.image_url ? row.image_url : null,
  };
}

export async function getPublishedNews(limit?: number) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return fallbackNews.slice(0, limit);
  let query = supabase.from("news_articles").select("id,slug,category,title,excerpt,content,image_url,published_at,created_at").eq("status", "published").lte("published_at", new Date().toISOString()).order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) {
    console.error("Published news query failed", error.code);
    return fallbackNews.slice(0, limit);
  }
  return data.map((row) => mapArticle(row));
}

export async function getPublishedNewsBySlug(slug: string) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return fallbackNews.find((item) => item.slug === slug) || null;
  const { data, error } = await supabase.from("news_articles").select("id,slug,category,title,excerpt,content,image_url,published_at,created_at").eq("slug", slug).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle();
  if (error) console.error("Published article query failed", error.code);
  return data ? mapArticle(data) : fallbackNews.find((item) => item.slug === slug) || null;
}
