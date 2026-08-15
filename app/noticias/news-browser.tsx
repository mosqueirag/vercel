"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { NewsArticle } from "../../lib/news";
import { NewsCards } from "../ui";

const PAGE_SIZE = 3;

type AiResult = { answer: string; matches: Array<{ slug: string; title: string; category: string }> };

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function NewsBrowser({ items }: { items: NewsArticle[] }) {
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const categories = useMemo(() => ["Todas", ...Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b, "es"))], [items]);
  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return items.filter((item) => {
      const inCategory = category === "Todas" || item.category === category;
      const searchable = normalize(`${item.title} ${item.excerpt} ${item.category} ${item.body.join(" ")}`);
      return inCategory && (!needle || searchable.includes(needle));
    });
  }, [category, items, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function askAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (aiQuery.trim().length < 3) return;
    setAiLoading(true); setAiError(""); setAiResult(null);
    try {
      const response = await fetch("/api/news-search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: aiQuery }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pudimos completar la búsqueda.");
      setAiResult(data);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "No pudimos completar la búsqueda.");
    } finally { setAiLoading(false); }
  }

  return <>
    <section className="news-ai" aria-labelledby="news-ai-title">
      <div className="news-ai-copy"><span className="assistant-avatar" aria-hidden="true">✦</span><div><small>COOPIA · Archivo inteligente</small><h2 id="news-ai-title">¿Qué noticia necesitás encontrar?</h2><p>Describí el tema con tus palabras. Voy a buscar únicamente en las publicaciones oficiales de COOPSAR.</p></div></div>
      <form className="news-ai-form" onSubmit={askAi}><label className="sr-only" htmlFor="ai-news-query">Consulta para el buscador inteligente</label><input id="ai-news-query" value={aiQuery} onChange={(event) => setAiQuery(event.target.value)} maxLength={300} placeholder="Ej.: información sobre cortes o ampliación de fibra" /><button disabled={aiLoading || aiQuery.trim().length < 3}>{aiLoading ? "Buscando…" : "Buscar con IA →"}</button></form>
      {aiResult && <div className="news-ai-answer" aria-live="polite"><p>{aiResult.answer}</p>{aiResult.matches.length > 0 && <div>{aiResult.matches.map((match) => <Link key={match.slug} href={`/noticias/${match.slug}`}><small>{match.category}</small>{match.title}<span>→</span></Link>)}</div>}</div>}
      {aiError && <p className="news-ai-error" role="alert">{aiError}</p>}
    </section>

    <div className="news-tools"><label className="news-search"><span aria-hidden="true">⌕</span><span className="sr-only">Buscar noticias</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por título, tema o palabra clave…" /></label><div className="news-filters" role="group" aria-label="Filtrar noticias por categoría">{categories.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => { setCategory(item); setPage(1); }}>{item}</button>)}</div></div>
    <div className="news-results"><p>{filtered.length} {filtered.length === 1 ? "noticia encontrada" : "noticias encontradas"}</p>{visible.length > 0 ? <NewsCards items={visible} /> : <div className="news-empty"><h3>No encontramos noticias</h3><p>Probá con otra palabra o seleccioná todas las categorías.</p><button onClick={() => { setQuery(""); setCategory("Todas"); }}>Limpiar búsqueda</button></div>}</div>
    <nav className="news-pagination" aria-label="Paginación de noticias"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>← Anterior</button><div>{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button key={number} className={page === number ? "active" : ""} aria-current={page === number ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}</div><button disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Siguiente →</button></nav>
  </>;
}
