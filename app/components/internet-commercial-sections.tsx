import Link from "next/link";
import type { PublicFaq, PublicInternetPlan } from "../../lib/data/public-content";
import { InternetAudienceSelection } from "./internet-audience-selection";
import { InternetCoopiaAction } from "./internet-coopia-action";
import { InternetPlanCatalog } from "./internet-plan-catalog";
import { InternetTechnologyWidget } from "./internet-technology-widget";

export function InternetAudienceSection() {
  return <section className="internet-sales-section internet-sales-product" aria-labelledby="internet-product-title">
    <div className="internet-sales-heading"><div><span className="eyebrow">Elegí para quién es</span><h2 id="internet-product-title">¿Cómo vas a usar Internet?</h2></div><p>Usamos esta elección para ordenar las opciones que vas a ver.</p></div>
    <InternetAudienceSelection />
  </section>;
}

export function InternetPlansSection({ plans, isDemo = false }: { plans: PublicInternetPlan[]; isDemo?: boolean }) {
  return <section className="internet-sales-section internet-sales-offer" id="planes" aria-labelledby="internet-options-title">
    <div className="internet-sales-heading"><div><span className="eyebrow">Planes de referencia</span><h2 id="internet-options-title">Opciones para tu conexión.</h2></div></div>
    <InternetPlanCatalog plans={plans} isDemo={isDemo} />
  </section>;
}

export function InternetTechnologiesSection() {
  return <section className="internet-sales-section internet-sales-technologies" aria-labelledby="internet-technologies-title">
    <div className="internet-sales-heading"><div><span className="eyebrow">Formas de conectarte</span><h2 id="internet-technologies-title">Tecnologías que podemos evaluar.</h2></div><p>La disponibilidad final se confirma al consultar tu domicilio.</p></div>
    <InternetTechnologyWidget />
  </section>;
}

/** Preserves the legacy composed entry point for static consumers and tests. */
export function InternetCommercialIntro({ plans, isDemo = false }: { plans: PublicInternetPlan[]; isDemo?: boolean }) {
  return <>
    <InternetAudienceSection />
    <InternetPlansSection plans={plans} isDemo={isDemo} />
    <InternetTechnologiesSection />
  </>;
}

export function InternetCommercialAfterCoverage({ faqs }: { faqs: PublicFaq[] }) {
  return <>
    <section className="internet-sales-section internet-sales-customer"><div><span className="eyebrow">Ya soy cliente</span><h2>¿Necesitás ayuda con tu servicio?</h2></div><InternetCoopiaAction className="primary public-action-button">Abrir COOPIA</InternetCoopiaAction></section>
    {faqs.length > 0 && <section className="internet-sales-section internet-sales-faqs"><div className="internet-sales-heading"><div><span className="eyebrow">Preguntas frecuentes</span><h2>Preguntas sobre Internet</h2></div></div><div>{faqs.map((faq) => <details key={`${faq.category}-${faq.question}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>}
    <section className="internet-sales-final"><span className="eyebrow eyebrow-light">Internet COOPSAR</span><h2>Conocé qué opción podemos ofrecerte.</h2><Link href="#contratar" className="button-light public-action-button">Consultar mi domicilio <span aria-hidden="true">→</span></Link></section>
  </>;
}
