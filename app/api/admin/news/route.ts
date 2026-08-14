import { z } from "zod";
import { requireNewsAdmin } from "../../../../lib/admin-auth";

const articleSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(5).max(180),
  category: z.string().trim().min(2).max(60),
  excerpt: z.string().trim().min(10).max(400),
  content: z.string().trim().min(20).max(30000),
  imageUrl: z.string().url().nullable().optional(),
  status: z.enum(["draft", "published"]),
});

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 100);
}

export async function GET() {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const { data, error } = await session.admin.from("news_articles").select("id,slug,title,category,excerpt,content,image_url,status,published_at,created_at,updated_at").order("updated_at", { ascending: false });
  if (error) return Response.json({ error: "No pudimos cargar las noticias." }, { status: 503 });
  return Response.json({ articles: data });
}

export async function POST(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const parsed = articleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisá los campos de la noticia." }, { status: 400 });
  const baseSlug = slugify(parsed.data.title) || `noticia-${crypto.randomUUID().slice(0, 8)}`;
  const { data: existing } = await session.admin.from("news_articles").select("id").eq("slug", baseSlug).maybeSingle();
  const slug = existing ? `${baseSlug}-${crypto.randomUUID().slice(0, 6)}` : baseSlug;
  const publishedAt = parsed.data.status === "published" ? new Date().toISOString() : null;
  const { data, error } = await session.admin.from("news_articles").insert({ slug, title: parsed.data.title, category: parsed.data.category, excerpt: parsed.data.excerpt, lead: parsed.data.excerpt, content: parsed.data.content, image_url: parsed.data.imageUrl || null, status: parsed.data.status, published_at: publishedAt, author_email: session.email }).select().single();
  if (error) return Response.json({ error: "No pudimos guardar la noticia." }, { status: 503 });
  return Response.json({ article: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const parsed = articleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.id) return Response.json({ error: "Revisá los campos de la noticia." }, { status: 400 });
  const { data: current } = await session.admin.from("news_articles").select("published_at").eq("id", parsed.data.id).maybeSingle();
  const publishedAt = parsed.data.status === "published" ? current?.published_at || new Date().toISOString() : null;
  const { data, error } = await session.admin.from("news_articles").update({ title: parsed.data.title, category: parsed.data.category, excerpt: parsed.data.excerpt, lead: parsed.data.excerpt, content: parsed.data.content, image_url: parsed.data.imageUrl || null, status: parsed.data.status, published_at: publishedAt, author_email: session.email }).eq("id", parsed.data.id).select().single();
  if (error) return Response.json({ error: "No pudimos actualizar la noticia." }, { status: 503 });
  return Response.json({ article: data });
}

export async function DELETE(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return Response.json({ error: "Identificador inválido." }, { status: 400 });
  const { error } = await session.admin.from("news_articles").delete().eq("id", id);
  if (error) return Response.json({ error: "No pudimos eliminar la noticia." }, { status: 503 });
  return new Response(null, { status: 204 });
}
