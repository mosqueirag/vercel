import Link from "next/link";
import type { PublicFaq, PublicInternetPlan } from "../../lib/data/public-content";
import { coverageTechnologyLabel } from "../../lib/coverage-presentation";
import { shouldShowGeneralInternetCatalog } from "../../lib/internet/public-experience";
import { InternetCoopiaAction } from "./internet-coopia-action";

function PlanDetails({ plan }: { plan: PublicInternetPlan }) {
  return <article className="internet-commercial-plan">
    <div><span className="eyebrow">{plan.technology ? coverageTechnologyLabel(plan.technology) : "Tecnología publicada"}</span><h3>{plan.name}</h3></div>
    {plan.description && <p>{plan.description}</p>}
    <dl>
      {plan.speed_down_mbps !== null && <div><dt>Velocidad publicada</dt><dd>{plan.speed_down_mbps} Mbps</dd></div>}
      {plan.price_amount !== null && <div><dt>Precio oficial</dt><dd>{new Intl.NumberFormat("es-AR", { style: "currency", currency: plan.currency || "ARS", maximumFractionDigits: 0 }).format(plan.price_amount)}</dd></div>}
    </dl>
    {plan.benefits.length > 0 && <ul>{plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>}
    <Link href="#contratar" className="text-link">Consultar disponibilidad →</Link>
  </article>;
}

export function InternetCommercialSections({ plans, faqs }: { plans: PublicInternetPlan[]; faqs: PublicFaq[] }) {
  return <>
    <section className="internet-commercial-section internet-technology">
      <div className="internet-technology-copy"><span className="eyebrow">Tecnologías disponibles</span><h2>Elegí según lo que llegue a tu domicilio.</h2></div>
      <div className="internet-technology-options"><article><h3>Fibra óptica</h3><p>Disponible según cobertura en tu domicilio.</p></article><article><h3>Internet inalámbrico</h3><p>Alternativa según cobertura en tu zona.</p></article></div>
    </section>

    {shouldShowGeneralInternetCatalog(plans) && <section className="internet-commercial-section internet-offer" id="planes">
      <div className="section-heading"><div><h2>Planes de Internet</h2></div><p>La disponibilidad depende de tu domicilio.</p></div>
      <div className="internet-commercial-plans">{plans.map((plan) => <PlanDetails key={plan.id} plan={plan} />)}</div>
    </section>}

    <section className="internet-commercial-section internet-waitlist">
      <div><span className="eyebrow eyebrow-light">¿Todavía no llega fibra?</span><h2>Avisame cuando haya disponibilidad.</h2><p>Dejá tu interés y podremos contactarte si aparece una alternativa para tu zona.</p></div><Link href="#contratar" className="button-light">Consultar cobertura</Link>
    </section>

    <section className="internet-commercial-section internet-current-customer">
      <div><span className="eyebrow">Ya soy cliente</span><h2>¿Necesitás soporte?</h2><p>COOPIA te ayuda a encontrar el próximo paso.</p></div><InternetCoopiaAction className="primary">Abrir COOPIA</InternetCoopiaAction>
    </section>

    {faqs.length > 0 && <section className="internet-commercial-section internet-faqs"><div className="section-heading"><div><h2>Preguntas frecuentes</h2></div></div><div>{faqs.map((faq) => <details key={`${faq.category}-${faq.question}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>}

    <section className="internet-commercial-final"><h2>¿Querés saber qué Internet llega a tu casa?</h2><Link href="#contratar" className="button-light">Consultar cobertura</Link></section>
  </>;
}
