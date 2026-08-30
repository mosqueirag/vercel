import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InternetAudienceSection, InternetCommercialAfterCoverage, InternetPlansSection, InternetTechnologiesSection } from "../components/internet-commercial-sections";
import { InternetCenter } from "../components/internet-center";
import { Contact, Footer, Header } from "../ui";
import { getPublishedSitePage } from "../../lib/data/site-pages";
import { getPublishedInternetFaqs, getPublishedInternetPlans, getStagingInternetDemoFaqs, getStagingInternetDemoPlans } from "../../lib/data/public-content";
import { internetCanonicalPath } from "../../lib/internet/public-experience";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Internet | COOPSAR",
  description: "Conocé las opciones de Internet de COOPSAR y consultá disponibilidad en tu domicilio.",
  alternates: { canonical: internetCanonicalPath },
};

export default async function InternetPage() {
  const [published, plans, faqs, demoPlans, demoFaqs] = await Promise.all([getPublishedSitePage("internet"), getPublishedInternetPlans(), getPublishedInternetFaqs(), getStagingInternetDemoPlans(), getStagingInternetDemoFaqs()]);
  const catalogPlans = plans.length > 0 ? plans : demoPlans;
  const catalogIsDemo = plans.length === 0 && demoPlans.length > 0;
  const visibleFaqs = faqs.length > 0 ? faqs : demoFaqs;
  const title = published?.title || "Conectate a lo que importa.";
  const intro = plans.length > 0 ? "Conocé nuestras opciones de Internet y elegí cómo querés continuar." : "Alternativas de conectividad para tu hogar, comercio o empresa.";

  return <main>
    <Header />
    <section className="internet-page-hero internet-sales-hero">
      <Image src="/images/coopsar-connectivity.png" alt="Infraestructura de conectividad de COOPSAR en Sarmiento" fill priority sizes="100vw" />
      <div className="internet-page-hero-shade" />
      <div className="internet-page-hero-content">
        <span className="eyebrow eyebrow-light">Internet COOPSAR</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <div className="internet-page-actions">
          <Link className="primary" href="#contratar">Consultar disponibilidad <span aria-hidden="true">→</span></Link>
          {catalogPlans.length > 0 && <Link href="#planes">Ver planes</Link>}
        </div>
      </div>
    </section>
    <InternetCenter variant="page" />
    <InternetAudienceSection />
    <InternetPlansSection plans={catalogPlans} isDemo={catalogIsDemo} />
    <InternetTechnologiesSection />
    <InternetCommercialAfterCoverage faqs={visibleFaqs} />
    <Contact />
    <Footer />
  </main>;
}
