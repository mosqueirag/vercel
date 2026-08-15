import { getPublishedNews } from "../../lib/news";
import { Contact, Footer, Header } from "../ui";
import { NewsBrowser } from "./news-browser";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const news = await getPublishedNews();
  return <main><Header /><section className="page-hero-shell"><Link className="page-back" href="/">← Volver al inicio</Link><div className="visual-hero"><Image src="/images/sarmiento-community.png" alt="Comunidad de Sarmiento y su entorno patagónico" fill sizes="(max-width: 800px) 100vw, 1400px" priority /><div className="visual-hero-shade" /><div className="visual-hero-title"><span className="tag">ACTUALIDAD</span><h1>Noticias de COOPSAR</h1></div><div className="visual-hero-summary"><p>Información oficial sobre energía, conectividad y servicios.</p></div></div></section><section className="section"><NewsBrowser items={news} /></section><Contact /><Footer /></main>;
}
