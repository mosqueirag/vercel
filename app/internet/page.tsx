import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InternetCommercialAfterCoverage, InternetCommercialIntro } from "../components/internet-commercial-sections";
import { InternetCoopiaAction } from "../components/internet-coopia-action";
import { InternetCenter } from "../components/internet-center";
import { Contact, Footer, Header } from "../ui";
import { getPublishedSitePage } from "../../lib/data/site-pages";
import { getPublishedInternetFaqs, getPublishedInternetPlans } from "../../lib/data/public-content";
import { internetCanonicalPath, internetSalesHeroAction } from "../../lib/internet/public-experience";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Internet | COOPSAR",
  description: "Conocé las opciones de Internet de COOPSAR y consultá disponibilidad en tu domicilio.",
  alternates: { canonical: internetCanonicalPath },
};

export default async function InternetPage() {
  const [published, plans, faqs] = await Promise.all([getPublishedSitePage("internet"), getPublishedInternetPlans(), getPublishedInternetFaqs()]);
  const title = published?.title || "Internet para tu casa, trabajo y todos los días.";
  const intro = published?.intro || "Conocé las opciones publicadas y consultá qué alternativa podemos ofrecerte en tu domicilio.";
  const heroAction = internetSalesHeroAction(plans.length > 0);

  return <main>
    <Header />
    <section className="internet-page-hero internet-sales-hero">
      <Image src="/images/coopsar-connectivity.png" alt="Infraestructura de conectividad de COOPSAR en Sarmiento" fill priority sizes="100vw" />
      <div className="internet-page-hero-shade" />
      <div className="internet-page-hero-content">
        <span className="eyebrow eyebrow-light">Conectividad para tu día a día</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <div className="internet-page-actions">
          <Link className="primary" href={heroAction.href}>{heroAction.label} <span aria-hidden="true">→</span></Link>
          <InternetCoopiaAction>Ya soy cliente</InternetCoopiaAction>
        </div>
      </div>
    </section>
    <InternetCommercialIntro plans={plans} />
    <InternetCenter variant="page" />
    <InternetCommercialAfterCoverage faqs={faqs} />
    <Contact />
    <Footer />
  </main>;
}
