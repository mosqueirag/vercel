import type { Metadata } from "next";
import Link from "next/link";
import { InternetCenter } from "../components/internet-center";
import { getPublishedSitePage } from "../../lib/data/site-pages";
import { getPublishedInternetFaqs, getPublishedInternetPlans } from "../../lib/data/public-content";
import { internetCanonicalPath } from "../../lib/internet/public-experience";
import { servicePages } from "../../lib/service-pages";
import { Contact, Footer, Header } from "../ui";
import { InternetCoopiaAction } from "../components/internet-coopia-action";
import { InternetCommercialSections } from "../components/internet-commercial-sections";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Internet | COOPSAR",
  description: "Consultá la cobertura de Internet en tu domicilio y continuá con la alternativa disponible.",
  alternates: { canonical: internetCanonicalPath },
};

export default async function InternetPage() {
  const [published, plans, faqs] = await Promise.all([getPublishedSitePage("internet"), getPublishedInternetPlans(), getPublishedInternetFaqs()]);
  const fallback = servicePages.internet;
  const title = published?.title || fallback.title;
  const intro = published?.intro || "Conocé qué alternativa de Internet puede llegar a tu domicilio y continuá con el próximo paso.";

  return <main>
    <Header />
    <section className="internet-page-hero">
      <Image src="/images/coopsar-connectivity.png" alt="Infraestructura de conectividad de COOPSAR en Sarmiento" fill priority sizes="100vw" />
      <div className="internet-page-hero-shade" />
      <div className="internet-page-hero-content"><span className="eyebrow eyebrow-light">Internet COOPSAR</span><h1>{title}</h1><p>{intro}</p><div className="internet-page-actions"><Link className="primary" href="#contratar">Consultar cobertura</Link><InternetCoopiaAction>Ya soy cliente</InternetCoopiaAction></div></div>
    </section>
    <InternetCenter variant="page" />
    <InternetCommercialSections plans={plans} faqs={faqs} />
    <Contact />
    <Footer />
  </main>;
}
