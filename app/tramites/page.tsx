import Link from "next/link";
import { getPublishedSitePage } from "../../lib/data/site-pages";
import { servicePages } from "../../lib/service-pages";
import { Contact, Footer, Header } from "../ui";
import { ProcedureCenter } from "./procedure-center";

export const dynamic = "force-dynamic";

export default async function ProceduresPage() {
  const published = await getPublishedSitePage("tramites");
  const fallback = servicePages.tramites;
  const content = published ? { eyebrow: published.eyebrow, title: published.title, intro: published.intro } : fallback;
  return <main>
    <Header />
    <section className="procedures-hero"><div><Link className="page-back" href="/">← Volver al inicio</Link><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p></div></section>
    <section className="section procedures-main" aria-labelledby="procedures-title"><div className="section-heading"><div><span className="eyebrow">Gestiones principales</span><h2 id="procedures-title">¿Qué necesitás hacer?</h2></div><p>Elegí una gestión o contanos qué necesitás para llevarte directamente al próximo paso.</p></div><ProcedureCenter /></section>
    <Contact />
    <Footer />
  </main>;
}
