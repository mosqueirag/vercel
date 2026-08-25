import type { Metadata } from "next";
import Link from "next/link";
import { InternetCenter } from "../components/internet-center";
import { getPublishedSitePage } from "../../lib/data/site-pages";
import { internetCanonicalPath } from "../../lib/internet/public-experience";
import { servicePages } from "../../lib/service-pages";
import { Contact, Footer, Header } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Internet | COOPSAR",
  description: "Consultá la cobertura de Internet en tu domicilio y continuá con la alternativa disponible.",
  alternates: { canonical: internetCanonicalPath },
};

export default async function InternetPage() {
  const published = await getPublishedSitePage("internet");
  const fallback = servicePages.internet;
  const title = published?.title || fallback.title;
  const intro = published?.intro || "Consultá la cobertura en tu domicilio. COOPSAR te muestra la tecnología disponible y el próximo paso real.";

  return <main>
    <Header />
    <section className="internet-page-hero">
      <div><span className="eyebrow">Internet COOPSAR</span><h1>{title}</h1><p>{intro}</p><div className="internet-page-actions"><Link className="primary" href="#contratar">Consultar cobertura</Link><Link href="/#asistente">Ya soy cliente / necesito soporte</Link></div></div>
      <aside><span>¿Necesitás ayuda?</span><p>COOPIA puede orientarte sobre Internet, cobertura o soporte.</p><Link href="/#asistente">Abrir COOPIA →</Link></aside>
    </section>
    <InternetCenter variant="page" />
    <Contact />
    <Footer />
  </main>;
}
