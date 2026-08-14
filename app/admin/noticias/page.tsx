"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
    const result = await response.json();
    setItems(result.articles || []);
    setMessage(response.ok ? "" : result.error || "No pudimos cargar las noticias.");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadArticles(), 0);
    return () => window.clearTimeout(timer);
  }, [loadArticles]);

  async function uploadImage(file: File) {
    const body = new FormData();
    body.set("image", file);
    const response = await fetch("/api/admin/news/image", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No pudimos subir la imagen.");
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
      const result = await response.json();
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
    if (!response.ok) { const result = await response.json(); setMessage(result.error || "No pudimos eliminarla."); return; }
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
