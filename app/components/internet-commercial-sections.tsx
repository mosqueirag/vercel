import Link from "next/link";
import type { PublicFaq, PublicInternetPlan } from "../../lib/data/public-content";
import { coverageTechnologyLabel } from "../../lib/coverage-presentation";
import { shouldShowGeneralInternetCatalog } from "../../lib/internet/public-experience";
import { InternetCoopiaAction } from "./internet-coopia-action";
import { InternetPlanSelectionAction } from "./internet-plan-selection-action";

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
    {hasPlans && <section className="internet-sales-section internet-sales-offer" id="opciones" aria-labelledby="internet-options-title">
      <div className="internet-sales-heading"><div><span className="eyebrow">Opciones de Internet</span><h2 id="internet-options-title">Conocé las opciones disponibles.</h2></div><p>Elegí una opción y después confirmamos qué podemos instalar en tu domicilio.</p></div>
      <div className="internet-sales-plans">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}</div>
    </section>}
    <section className="internet-sales-section internet-sales-needs" aria-labelledby="internet-needs-title">
      <div className="internet-sales-heading"><div><span className="eyebrow">Empezá por lo que necesitás</span><h2 id="internet-needs-title">Internet para tu día a día.</h2></div><p>Contanos dónde lo vas a usar y consultá las alternativas para tu domicilio.</p></div>
      <div className="internet-sales-needs-grid">
        <Link href="#contratar"><strong>Para tu casa</strong><span>Consultar opciones <b aria-hidden="true">→</b></span></Link>
        <Link href="#contratar"><strong>Para trabajar y estudiar</strong><span>Consultar opciones <b aria-hidden="true">→</b></span></Link>
        <Link href="#contratar"><strong>Para tu comercio</strong><span>Consultar opciones <b aria-hidden="true">→</b></span></Link>
        <Link href="#contratar"><strong>Para varios dispositivos</strong><span>Consultar opciones <b aria-hidden="true">→</b></span></Link>
      </div>
    </section>
    <section className="internet-sales-section internet-sales-value" aria-label="Cómo continuamos">
      <article><span>01</span><h3>Elegís cómo querés usar Internet</h3><p>Empezá por una necesidad concreta.</p></article>
      <article><span>02</span><h3>Consultás tu domicilio</h3><p>Revisamos la alternativa disponible.</p></article>
      <article><span>03</span><h3>Continuamos tu solicitud</h3><p>El próximo paso queda claro desde el resultado.</p></article>
    </section>
  </>;
}

export function InternetCommercialAfterCoverage({ faqs }: { faqs: PublicFaq[] }) {
  return <>
    <section className="internet-sales-section internet-sales-customer"><div><span className="eyebrow">Ya soy cliente</span><h2>¿Necesitás ayuda con tu servicio?</h2><p>Abrí COOPIA y encontrá el próximo paso sin salir de esta página.</p></div><InternetCoopiaAction className="primary">Abrir COOPIA</InternetCoopiaAction></section>
    {faqs.length > 0 && <section className="internet-sales-section internet-sales-faqs"><div className="internet-sales-heading"><div><span className="eyebrow">Preguntas frecuentes</span><h2>Respuestas para seguir.</h2></div></div><div>{faqs.map((faq) => <details key={`${faq.category}-${faq.question}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>}
    <section className="internet-sales-final"><span className="eyebrow eyebrow-light">Internet COOPSAR</span><h2>Conocé qué opción podemos ofrecerte.</h2><Link href="#contratar" className="button-light">Consultar mi domicilio <span aria-hidden="true">→</span></Link></section>
  </>;
}
