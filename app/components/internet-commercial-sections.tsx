import Link from "next/link";
import type { PublicFaq, PublicInternetPlan } from "../../lib/data/public-content";
import { shouldShowGeneralInternetCatalog } from "../../lib/internet/public-experience";
import { InternetAudienceSelection } from "./internet-audience-selection";
import { InternetCoopiaAction } from "./internet-coopia-action";
import { InternetPlanCatalog } from "./internet-plan-catalog";

export function InternetCommercialIntro({ plans, isDemo = false }: { plans: PublicInternetPlan[]; isDemo?: boolean }) {
  const hasPlans = shouldShowGeneralInternetCatalog(plans);
  return <>
    <section className="internet-sales-section internet-sales-product" aria-labelledby="internet-product-title">
      <div className="internet-sales-heading"><div><span className="eyebrow">Internet COOPSAR</span><h2 id="internet-product-title">Elegí la conexión que estás buscando.</h2></div><p>Seleccioná la opción que describe tu necesidad.</p></div>
      <InternetAudienceSelection />
    </section>
    {hasPlans && <section className="internet-sales-section internet-sales-offer" id="planes" aria-labelledby="internet-options-title">
      <div className="internet-sales-heading"><div><span className="eyebrow">Planes de Internet</span><h2 id="internet-options-title">Nuestros planes de Internet.</h2></div></div>
      <InternetPlanCatalog plans={plans} isDemo={isDemo} />
    </section>}
    <section className="internet-sales-section internet-sales-technologies" aria-labelledby="internet-technologies-title">
      <div className="internet-sales-heading"><div><span className="eyebrow">Dos formas de conectarte</span><h2 id="internet-technologies-title">Conocé las alternativas de Internet COOPSAR.</h2></div><p>Elegí la forma de conectarte que querés conocer.</p></div>
      <div className="internet-technology-options internet-sales-technology-options">
        <article><span>Fibra óptica</span><h3>Conectividad a través de la red de fibra óptica de COOPSAR.</h3><p>Una de las alternativas de Internet COOPSAR.</p></article>
        <article><span>Internet inalámbrico</span><h3>Conectividad mediante tecnología inalámbrica.</h3><p>Una de las alternativas de Internet COOPSAR.</p></article>
      </div>
      <p className="internet-technology-disclaimer">La disponibilidad de cada tecnología se confirma al consultar tu dirección.</p>
    </section>
  </>;
}

export function InternetCommercialAfterCoverage({ faqs }: { faqs: PublicFaq[] }) {
  return <>
    <section className="internet-sales-section internet-sales-customer"><div><span className="eyebrow">Ya soy cliente</span><h2>¿Necesitás ayuda con tu servicio?</h2><p>Abrí COOPIA y encontrá el próximo paso sin salir de esta página.</p></div><InternetCoopiaAction className="primary">Abrir COOPIA</InternetCoopiaAction></section>
    {faqs.length > 0 && <section className="internet-sales-section internet-sales-faqs"><div className="internet-sales-heading"><div><span className="eyebrow">Preguntas frecuentes</span><h2>Preguntas sobre Internet</h2></div></div><div>{faqs.map((faq) => <details key={`${faq.category}-${faq.question}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>}
    <section className="internet-sales-final"><span className="eyebrow eyebrow-light">Internet COOPSAR</span><h2>Conocé qué opción podemos ofrecerte.</h2><Link href="#contratar" className="button-light">Consultar mi domicilio <span aria-hidden="true">→</span></Link></section>
  </>;
}
