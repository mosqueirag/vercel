"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Brand } from "../../ui";

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
};

const emptyArticle: Article = { id: "", slug: "", title: "", category: "Institucional", excerpt: "", content: "", image_url: null, status: "draft", published_at: null, created_at: "" };

async function readResult(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return { error: response.status === 413 ? "La imagen es demasiado pesada." : "El servidor no pudo procesar la solicitud." };
}

export default function AdminNewsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadArticles = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/news", { cache: "no-store" });
    if (response.status === 401) { router.push("/admin"); return; }
    const result = await readResult(response);
    setItems(result.articles || []);
    setMessage(response.ok ? "" : result.error || "No pudimos cargar las noticias.");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadArticles(), 0);
    return () => window.clearTimeout(timer);
  }, [loadArticles]);

  async function uploadImage(file: File) {
    if (file.size > 10 * 1024 * 1024) throw new Error("La imagen supera el máximo de 10 MB.");
    const response = await fetch("/api/admin/news/image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: file.type, size: file.size }) });
    const result = await readResult(response);
    if (!response.ok) throw new Error(result.error || "No pudimos subir la imagen.");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("El almacenamiento no está configurado.");
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from("news-images").uploadToSignedUrl(result.path, result.token, file, { contentType: file.type, cacheControl: "31536000" });
    if (error) throw new Error("No pudimos completar la carga de la imagen.");
    return String(result.imageUrl);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const file = form.get("image");
      const imageUrl = file instanceof File && file.size > 0 ? await uploadImage(file) : editing.image_url;
      const payload = { id: editing.id || undefined, title: String(form.get("title")), category: String(form.get("category")), excerpt: String(form.get("excerpt")), content: String(form.get("content")), status: String(form.get("status")), imageUrl };
      const response = await fetch("/api/admin/news", { method: editing.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await readResult(response);
      if (!response.ok) throw new Error(result.error || "No pudimos guardar la noticia.");
      setEditing(null);
      setMessage(payload.status === "published" ? "Noticia publicada correctamente." : "Borrador guardado correctamente.");
      await loadArticles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos guardar la noticia.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(article: Article) {
    if (!window.confirm(`¿Eliminar “${article.title}”?`)) return;
    const response = await fetch(`/api/admin/news?id=${article.id}`, { method: "DELETE" });
    if (!response.ok) { const result = await readResult(response); setMessage(result.error || "No pudimos eliminarla."); return; }
    setMessage("Noticia eliminada.");
    await loadArticles();
  }

  return (
    <main>
      <header className="site-header"><Brand /><nav className="desktop-nav"><Link href="/">Ver sitio</Link><Link href="/noticias">Ver noticias</Link></nav><b className="button button-dark">Panel editorial</b></header>
      <section className="inner"><span className="tag">Administración</span><h1>Noticias</h1><p>Creá borradores, publicá información oficial y cargá imágenes.</p></section>
      <section className="admin">
        {message && <div className="admin-message" role="status">{message}</div>}
        {editing ? (
          <form className="news-editor" onSubmit={save}>
            <h2>{editing.id ? "Editar noticia" : "Nueva noticia"}</h2>
            <label>Título<input required name="title" minLength={5} maxLength={180} defaultValue={editing.title} /></label>
            <label>Categoría<select name="category" defaultValue={editing.category}><option>Energía</option><option>Internet</option><option>Fibra óptica</option><option>Telefonía</option><option>Sepelio</option><option>Institucional</option></select></label>
            <label>Resumen<textarea required name="excerpt" minLength={10} maxLength={400} defaultValue={editing.excerpt} /></label>
            <label>Contenido<textarea required name="content" minLength={20} defaultValue={editing.content} /></label>
            <label>Imagen destacada<input name="image" type="file" accept="image/jpeg,image/png,image/webp" /><small>JPG, PNG o WebP. Máximo 10 MB.</small></label>
            {editing.image_url && <p><a href={editing.image_url} target="_blank" rel="noreferrer">Ver imagen actual ↗</a></p>}
            <label>Estado<select name="status" defaultValue={editing.status}><option value="draft">Borrador</option><option value="published">Publicada</option></select></label>
            <div className="editor-actions"><button className="primary" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button><button type="button" onClick={() => setEditing(null)}>Cancelar</button></div>
          </form>
        ) : (
          <>
            <div className="toolbar"><b>{loading ? "Cargando…" : `${items.length} publicaciones`}</b><button className="primary" onClick={() => setEditing(emptyArticle)}>＋ Nueva noticia</button></div>
            <div className="admin-table-wrap"><table><thead><tr><th>Título</th><th>Categoría</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><b>{item.title}</b></td><td>{item.category}</td><td>{new Date(item.published_at || item.created_at).toLocaleDateString("es-AR")}</td><td className={item.status === "published" ? "ok" : ""}>{item.status === "published" ? "Publicada" : "Borrador"}</td><td><button onClick={() => setEditing(item)}>Editar</button> <button onClick={() => void remove(item)}>Eliminar</button></td></tr>)}</tbody></table></div>
          </>
        )}
      </section>
    </main>
  );
}
