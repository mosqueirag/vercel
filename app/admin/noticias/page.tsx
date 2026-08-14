"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Brand } from "../../ui";

type NewsItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
  content: string;
};

const initialItems: NewsItem[] = [
  { id: "1", title: "Mantenimiento y mejoras en la infraestructura eléctrica", category: "Energía", date: "2026-07-01", status: "Publicada", content: "Continúan los trabajos preventivos." },
  { id: "2", title: "La fibra óptica continúa llegando a nuevas zonas", category: "Fibra óptica", date: "2026-07-09", status: "Publicada", content: "La red FTTH sigue ampliándose." },
];

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem("coopsar-news");
      if (stored) {
        try { setItems(JSON.parse(stored) as NewsItem[]); } catch { /* Keep safe defaults. */ }
      }
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (storageReady) localStorage.setItem("coopsar-news", JSON.stringify(items));
  }, [items, storageReady]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item: NewsItem = {
      id: editing?.id || crypto.randomUUID(),
      title: String(form.get("title")),
      category: String(form.get("category")),
      date: String(form.get("date")),
      status: String(form.get("status")),
      content: String(form.get("content")),
    };
    setItems((current) => editing ? current.map((entry) => entry.id === item.id ? item : entry) : [item, ...current]);
    setEditing(null);
  }

  return (
    <main>
      <header className="site-header"><Brand /><nav className="desktop-nav"><Link href="/">Ver sitio</Link><Link href="/noticias">Ver noticias</Link></nav><b className="button button-dark">Panel editorial</b></header>
      <section className="inner"><span className="tag">Administración</span><h1>Noticias</h1><p>Creá, editá y organizá publicaciones institucionales.</p></section>
      <section className="admin">
        <div className="warning"><b>Panel local.</b> La interfaz funciona en este navegador; la persistencia compartida se activará al restablecer la conexión con Supabase.</div>
        {editing ? (
          <form onSubmit={save}>
            <h2>{editing.id ? "Editar" : "Nueva"} noticia</h2>
            <label>Título<input required name="title" defaultValue={editing.title} /></label>
            <label>Categoría<select name="category" defaultValue={editing.category}><option>Energía</option><option>Internet</option><option>Fibra óptica</option><option>Sepelio</option><option>Institucional</option></select></label>
            <label>Fecha<input required name="date" type="date" defaultValue={editing.date} /></label>
            <label>Estado<select name="status" defaultValue={editing.status}><option>Publicada</option><option>Borrador</option></select></label>
            <label>Contenido<textarea required name="content" defaultValue={editing.content} /></label>
            <div><button className="primary">Guardar</button> <button type="button" onClick={() => setEditing(null)}>Cancelar</button></div>
          </form>
        ) : (
          <>
            <div className="toolbar"><b>{items.length} publicaciones</b><button className="primary" onClick={() => setEditing({ id: "", title: "", category: "Institucional", date: new Date().toISOString().slice(0, 10), status: "Borrador", content: "" })}>＋ Nueva noticia</button></div>
            <table><thead><tr><th>Título</th><th>Categoría</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><b>{item.title}</b></td><td>{item.category}</td><td>{item.date}</td><td className="ok">{item.status}</td><td><button onClick={() => setEditing(item)}>Editar</button> <button onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>Eliminar</button></td></tr>)}</tbody></table>
          </>
        )}
      </section>
    </main>
  );
}
