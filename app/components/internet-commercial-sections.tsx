import Link from "next/link";
import type { PublicFaq, PublicInternetPlan } from "../../lib/data/public-content";
import { shouldShowGeneralInternetCatalog } from "../../lib/internet/public-experience";
import { InternetAudienceSelection } from "./internet-audience-selection";
import { InternetCoopiaAction } from "./internet-coopia-action";
import { InternetPlanCatalog } from "./internet-plan-catalog";

export function InternetCommercialIntro({ plans, isDemo = false }: { plans: PublicInternetPlan[]; isDemo?: boolean }) {
  const hasPlans = shouldShowGeneralInternetCatalog(plans);
  const technologies = [
    { key: "fiber", label: "Fibra óptica", matches: (technology: string | null) => technology === "FTTH" },
    { key: "adsl", label: "ADSL", matches: (technology: string | null) => technology === "ADSL" },
    { key: "wireless", label: "Internet inalámbrico", matches: (technology: string | null) => /inal[aá]mbric|wireless/i.test(technology || "") },
  ].map((technology) => {
    const speeds = plans.filter((plan) => technology.matches(plan.technology)).map((plan) => plan.speed_down_mbps).filter((speed): speed is number => speed !== null);
    const highestSpeed = speeds.length ? Math.max(...speeds) : null;
    return { ...technology, description: highestSpeed ? `Opciones de hasta ${highestSpeed} Mbps para consultar según tu domicilio.` : "La disponibilidad se confirma al consultar tu dirección." };
  });
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
      <div className="internet-sales-heading"><div><span className="eyebrow">Formas de conectarte</span><h2 id="internet-technologies-title">Conocé las alternativas de Internet COOPSAR.</h2></div><p>Elegí la forma de conectarte que querés conocer.</p></div>
      <div className="internet-technology-options internet-sales-technology-options">
        {technologies.map((technology) => <article key={technology.key}><span>{technology.label}</span><h3>{technology.label}</h3><p>{technology.description}</p></article>)}
      </div>
      <p className="internet-technology-disclaimer">La disponibilidad de cada tecnología se confirma al consultar tu dirección.</p>
    </section>
  </>;
}

export function InternetCommercialAfterCoverage({ faqs }: { faqs: PublicFaq[] }) {
  return <>
    <section className="internet-sales-section internet-sales-customer"><div><span className="eyebrow">Ya soy cliente</span><h2>¿Necesitás ayuda con tu servicio?</h2></div><InternetCoopiaAction className="primary">Abrir COOPIA</InternetCoopiaAction></section>
    {faqs.length > 0 && <section className="internet-sales-section internet-sales-faqs"><div className="internet-sales-heading"><div><span className="eyebrow">Preguntas frecuentes</span><h2>Preguntas sobre Internet</h2></div></div><div>{faqs.map((faq) => <details key={`${faq.category}-${faq.question}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>}
    <section className="internet-sales-final"><span className="eyebrow eyebrow-light">Internet COOPSAR</span><h2>Conocé qué opción podemos ofrecerte.</h2><Link href="#contratar" className="button-light">Consultar mi domicilio <span aria-hidden="true">→</span></Link></section>
  </>;
}
