import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedNews } from "../../lib/news";
import { Contact, Footer, Header } from "../ui";
import { NewsBrowser } from "./news-browser";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Noticias y comunicados", description: "Información oficial de COOPSAR sobre energía, conectividad, servicios y comunidad." };

export default async function Page() {
  const news = await getPublishedNews();
  return <main className="news-page"><Header /><section className="news-page-hero"><Link href="/">← Volver al inicio</Link><span className="eyebrow">Noticias y comunicados</span><h1>Información oficial<br />de COOPSAR</h1><p>Novedades sobre energía, conectividad, servicios y acciones para nuestra comunidad.</p></section><NewsBrowser items={news} /><Contact /><Footer /></main>;
}
