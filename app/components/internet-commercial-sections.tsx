import Link from "next/link";
import type { PublicFaq, PublicInternetPlan } from "../../lib/data/public-content";
import { coverageTechnologyLabel } from "../../lib/coverage-presentation";
import { shouldShowGeneralInternetCatalog } from "../../lib/internet/public-experience";
import { InternetCoopiaAction } from "./internet-coopia-action";
import { InternetPlanSelectionAction } from "./internet-plan-selection-action";
import { InternetAudienceSelection } from "./internet-audience-selection";

function formatPrice(plan: PublicInternetPlan) {
  if (plan.price_amount === null) return null;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: plan.currency || "ARS", maximumFractionDigits: 0 }).format(plan.price_amount);
}

function PlanCard({ plan }: { plan: PublicInternetPlan }) {
  const price = formatPrice(plan);
  return <article className="internet-sales-plan">
    <div className="internet-sales-plan-heading"><span className="eyebrow">{plan.technology ? coverageTechnologyLabel(plan.technology) : "Internet"}</span><h3>{plan.name}</h3></div>
    {plan.description && <p>{plan.description}</p>}
    <dl>
      {plan.speed_down_mbps !== null && <div><dt>Velocidad</dt><dd>{plan.speed_down_mbps} Mbps</dd></div>}
      {price && <div><dt>Precio</dt><dd>{price}</dd></div>}
      {plan.installation_price !== null && <div><dt>Instalación</dt><dd>{plan.installation_price === 0 ? "Sin costo" : new Intl.NumberFormat("es-AR", { style: "currency", currency: plan.currency || "ARS", maximumFractionDigits: 0 }).format(plan.installation_price)}</dd></div>}
    </dl>
    {plan.benefits.length > 0 && <ul>{plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>}
    {plan.conditions && <p className="internet-sales-conditions">{plan.conditions}</p>}
    <InternetPlanSelectionAction plan={plan} />
  </article>;
}

export function InternetCommercialIntro({ plans }: { plans: PublicInternetPlan[] }) {
  const hasPlans = shouldShowGeneralInternetCatalog(plans);
  return <>
    <section className="internet-sales-section internet-sales-product" aria-labelledby="internet-product-title">
      <div className="internet-sales-heading"><div><span className="eyebrow">Internet COOPSAR</span><h2 id="internet-product-title">Una consulta clara para elegir cómo conectarte.</h2></div><p>Empezá por el uso que querés resolver y continuá con la alternativa que corresponda.</p></div>
      <InternetAudienceSelection />
    </section>
    <section className="internet-sales-section internet-sales-technologies" aria-labelledby="internet-technologies-title">
      <div className="internet-sales-heading"><div><span className="eyebrow">Dos formas de conectarte</span><h2 id="internet-technologies-title">La alternativa se define con información real.</h2></div><p>La consulta de tu domicilio permite orientar el siguiente paso.</p></div>
      <div className="internet-technology-options internet-sales-technology-options">
        <article><span>Fibra óptica</span><h3>Una alternativa basada en la red de fibra óptica de COOPSAR.</h3><p>La disponibilidad se confirma para cada domicilio.</p></article>
        <article><span>Internet inalámbrico</span><h3>Una alternativa de conectividad para los lugares donde corresponda.</h3><p>Consultá tu domicilio para conocer la opción aplicable.</p></article>
      </div>
    </section>
    <section className="internet-sales-story" aria-labelledby="internet-story-title"><div><span className="eyebrow eyebrow-light">Tu próximo paso</span><h2 id="internet-story-title">Una decisión más simple empieza por tu domicilio.</h2></div><p>COOPSAR combina la información disponible con una consulta guiada para que puedas avanzar sin adivinar.</p><a className="button-light" href="#contratar">Consultar mi domicilio <span aria-hidden="true">→</span></a></section>
    {hasPlans && <section className="internet-sales-section internet-sales-offer" id="opciones" aria-labelledby="internet-options-title">
      <div className="internet-sales-heading"><div><span className="eyebrow">Planes de Internet</span><h2 id="internet-options-title">Nuestros planes de Internet.</h2></div><p>La disponibilidad se confirma al consultar tu domicilio.</p></div>
      <div className="internet-sales-plans">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}</div>
    </section>}
  </>;
}

export function InternetCommercialAfterCoverage({ faqs }: { faqs: PublicFaq[] }) {
  return <>
    <section className="internet-sales-section internet-sales-customer"><div><span className="eyebrow">Ya soy cliente</span><h2>¿Necesitás ayuda con tu servicio?</h2><p>Abrí COOPIA y encontrá el próximo paso sin salir de esta página.</p></div><InternetCoopiaAction className="primary">Abrir COOPIA</InternetCoopiaAction></section>
    {faqs.length > 0 && <section className="internet-sales-section internet-sales-faqs"><div className="internet-sales-heading"><div><span className="eyebrow">Preguntas frecuentes</span><h2>Respuestas para seguir.</h2></div></div><div>{faqs.map((faq) => <details key={`${faq.category}-${faq.question}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>}
    <section className="internet-sales-final"><span className="eyebrow eyebrow-light">Internet COOPSAR</span><h2>Conocé qué opción podemos ofrecerte.</h2><Link href="#contratar" className="button-light">Consultar mi domicilio <span aria-hidden="true">→</span></Link></section>
  </>;
}
