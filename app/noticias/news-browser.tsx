"use client";

import { useMemo, useState } from "react";
import type { NewsArticle } from "../../lib/news";
import { NewsCards } from "../ui";

export function NewsBrowser({ items }: { items: NewsArticle[] }) {
  const [category, setCategory] = useState("Todas");
  const categories = useMemo(() => ["Todas", ...Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b, "es"))], [items]);
  const visible = category === "Todas" ? items : items.filter((item) => item.category === category);

  return <><div className="news-filters" role="group" aria-label="Filtrar noticias por categoría">{categories.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="news-results"><p>{visible.length} {visible.length === 1 ? "noticia" : "noticias"} en esta categoría</p><NewsCards items={visible} /></div></>;
}
