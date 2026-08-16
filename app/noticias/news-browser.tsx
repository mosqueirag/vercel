"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { NewsArticle } from "../../lib/news";

const PAGE_SIZE = 6;
type AiResult = { answer: string; matches: Array<{ slug: string; title: string; category: string }> };

function NewsImage({ item, priority = false }: { item: NewsArticle; priority?: boolean }) {
  return <div className={item.imageUrl ? "news-card-image" : "news-card-image news-card-fallback"}>{item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="(max-width: 720px) 100vw, 33vw" priority={priority} /> : <><span>COOPSAR</span><small>{item.category}</small></>}</div>;
}

export function NewsBrowser({ items }: { items: NewsArticle[] }) {
  const [category, setCategory] = useState("Todas");
  const [page, setPage] = useState(1);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const featured = items.slice(0, 3);
  const categories = useMemo(() => ["Todas", ...Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b, "es"))], [items]);
  const filtered = useMemo(() => items.filter((item) => category === "Todas" || item.category === category), [category, items]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function askAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (aiQuery.trim().length < 3) return;
    setAiLoading(true); setAiError(""); setAiResult(null);
    try { const response = await fetch("/api/news-search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: aiQuery }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "No pudimos completar la búsqueda."); setAiResult(data); }
    catch (error) { setAiError(error instanceof Error ? error.message : "No pudimos completar la búsqueda."); }
    finally { setAiLoading(false); }
  }

  return <>
    <section className="featured-news" aria-labelledby="featured-title"><div className="news-section-title"><div><span className="eyebrow">Lo más reciente</span><h2 id="featured-title">Noticias destacadas</h2><p>Consultá nuestras novedades más importantes.</p></div><a href="#archivo-noticias">Ver todas ↓</a></div>{featured.length ? <div className="featured-news-grid">{featured.map((item, index) => <article key={item.id}><NewsImage item={item} priority={index === 0} /><div className="featured-news-copy"><small>{item.category}</small><h3>{item.title}</h3><p>{item.excerpt}</p><Link href={`/noticias/${item.slug}`}>Leer más <span>↗</span></Link></div></article>)}</div> : <div className="news-empty"><h3>Todavía no hay noticias publicadas</h3><p>Las novedades oficiales aparecerán en este espacio.</p></div>}</section>

    <section className="news-discovery" id="archivo-noticias"><div className="news-section-title"><div><span className="eyebrow">Archivo de noticias</span><h2>Encontrá la información que necesitás</h2><p>Buscá por tema, servicio, palabra clave o categoría.</p></div></div><section className="news-ai" aria-labelledby="news-ai-title"><div className="news-ai-copy"><span className="assistant-avatar" aria-hidden="true">✦</span><div><small>COOPIA · Buscador inteligente</small><h2 id="news-ai-title">Preguntá con tus palabras</h2><p>La respuesta utiliza únicamente las publicaciones oficiales disponibles.</p></div></div><form className="news-ai-form" onSubmit={askAi}><label className="sr-only" htmlFor="ai-news-query">Consulta para el buscador inteligente</label><input id="ai-news-query" value={aiQuery} onChange={(event) => setAiQuery(event.target.value)} maxLength={300} placeholder="Ej.: ¿Qué comunicados hay sobre fibra óptica?" /><button disabled={aiLoading || aiQuery.trim().length < 3}>{aiLoading ? "Buscando…" : "Buscar con IA →"}</button></form>{aiResult && <div className="news-ai-answer" aria-live="polite"><p>{aiResult.answer}</p>{aiResult.matches.length > 0 && <div>{aiResult.matches.map((match) => <Link key={match.slug} href={`/noticias/${match.slug}`}><small>{match.category}</small>{match.title}<span>→</span></Link>)}</div>}</div>}{aiError && <p className="news-ai-error" role="alert">{aiError}</p>}</section>

      <div className="news-tools"><div className="news-filters" role="group" aria-label="Filtrar noticias por categoría">{categories.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => { setCategory(item); setPage(1); }}>{item}</button>)}</div></div>
      <div className="news-results"><div className="news-results-heading"><h2>Últimas publicaciones</h2><p>{filtered.length} {filtered.length === 1 ? "noticia encontrada" : "noticias encontradas"}</p></div>{visible.length ? <div className="archive-news-grid">{visible.map((item) => <article key={item.id}><NewsImage item={item} /><div><small>{item.date} · {item.category}</small><h3>{item.title}</h3><p>{item.excerpt}</p><Link href={`/noticias/${item.slug}`}>Leer noticia <span>↗</span></Link></div></article>)}</div> : <div className="news-empty"><h3>No hay noticias en esta categoría</h3><p>Seleccioná otra categoría para continuar.</p><button onClick={() => setCategory("Todas")}>Ver todas las noticias</button></div>}</div>
      <nav className="news-pagination" aria-label="Paginación de noticias"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>← Anterior</button><div>{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button key={number} className={page === number ? "active" : ""} aria-current={page === number ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}</div><button disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Siguiente →</button></nav>
    </section>
  </>;
}
