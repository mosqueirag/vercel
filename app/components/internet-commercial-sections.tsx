import Link from "next/link";
import type { PublicFaq, PublicInternetPlan } from "../../lib/data/public-content";
import { coverageTechnologyLabel } from "../../lib/coverage-presentation";
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
    <section className="internet-commercial-section internet-why">
      <div className="section-heading"><div><span className="eyebrow">Internet COOPSAR</span><h2>Primero, la opción real para tu domicilio.</h2></div><p>La consulta de cobertura define la tecnología disponible y el siguiente paso. Así evitamos prometer una oferta que todavía necesita confirmación.</p></div>
      <div className="internet-benefits" aria-label="Cómo funciona la consulta de Internet"><article><strong>1</strong><h3>Consultá tu domicilio</h3><p>Ingresá calle y altura para iniciar la evaluación con datos oficiales.</p></article><article><strong>2</strong><h3>Conocé la tecnología</h3><p>La alternativa se informa según la cobertura disponible en esa ubicación.</p></article><article><strong>3</strong><h3>Continuá con una persona</h3><p>La validación técnica y el contacto comercial siguen el canal correspondiente.</p></article></div>
    </section>

    <section className="internet-commercial-section internet-technology">
      <div className="internet-technology-copy"><span className="eyebrow">Tecnología según cobertura</span><h2>Internet es una sola experiencia.</h2><p>Fibra óptica e Internet inalámbrico son tecnologías posibles. La disponibilidad se confirma para cada domicilio desde el mismo recorrido.</p><Link href="#contratar" className="text-link">Consultar mi tecnología disponible →</Link></div>
      <div className="internet-technology-options"><article><span>FTTH</span><h3>Fibra óptica</h3><p>Se muestra únicamente cuando la cobertura oficial la confirma.</p></article><article><span>WIRELESS</span><h3>Internet inalámbrico</h3><p>Puede ser la alternativa disponible según el domicilio consultado.</p></article></div>
    </section>

    <section className="internet-commercial-section internet-offer" id="planes">
      <div className="section-heading"><div><span className="eyebrow">Oferta publicada</span><h2>Planes de Internet COOPSAR.</h2></div><p>Este es el catálogo general. La disponibilidad de cada plan se confirma al consultar tu domicilio.</p></div>
      {plans.length > 0 ? <div className="internet-commercial-plans">{plans.map((plan) => <PlanDetails key={plan.id} plan={plan} />)}</div> : <div className="internet-offer-empty"><div><span className="eyebrow">Catálogo en preparación</span><h3>Primero, consultá tu cobertura.</h3><p>Todavía no hay planes publicados en el catálogo general. Podemos mostrarte la alternativa disponible en tu domicilio.</p></div><Link href="#contratar" className="primary">Consultar cobertura</Link></div>}
    </section>

    <section className="internet-commercial-section internet-waitlist">
      <div><span className="eyebrow eyebrow-light">Cuando todavía no hay fibra</span><h2>Dejá tu interés para una futura disponibilidad.</h2><p>Si la consulta no confirma fibra óptica, el recorrido te permite solicitar un aviso. No abrimos un formulario paralelo ni inventamos cobertura.</p></div><Link href="#contratar" className="button-light">Consultar cobertura</Link>
    </section>

    <section className="internet-commercial-section internet-current-customer">
      <div><span className="eyebrow">Ya soy cliente</span><h2>¿Necesitás soporte o tenés una consulta?</h2><p>COOPIA te orienta con los canales oficiales y el próximo paso según tu necesidad.</p></div><InternetCoopiaAction className="primary">Abrir COOPIA para soporte</InternetCoopiaAction>
    </section>

    {faqs.length > 0 && <section className="internet-commercial-section internet-faqs"><div className="section-heading"><div><span className="eyebrow">Preguntas frecuentes</span><h2>Información publicada sobre Internet.</h2></div></div><div>{faqs.map((faq) => <details key={`${faq.category}-${faq.question}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>}

    <section className="internet-commercial-final"><span className="eyebrow eyebrow-light">Internet COOPSAR</span><h2>Empezá por saber qué alternativa existe en tu domicilio.</h2><Link href="#contratar" className="button-light">Consultar cobertura</Link></section>
  </>;
}
