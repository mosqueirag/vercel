"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicInternetPlan } from "../../lib/data/public-content";
import { coverageTechnologyLabel } from "../../lib/coverage-presentation";
import { internetAudienceSelectedEvent, type InternetAudience } from "../../lib/internet/audience-selection";
import { prioritizeInternetCatalogPlans } from "../../lib/internet/demo-catalog";
import { InternetPlanSelectionAction } from "./internet-plan-selection-action";

type CatalogAudience = InternetAudience | null;

function formatPrice(plan: PublicInternetPlan) {
  if (plan.price_amount === null) return null;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: plan.currency || "ARS", maximumFractionDigits: 0 }).format(plan.price_amount);
}

function productDescription(plan: PublicInternetPlan) {
  const speed = plan.speed_down_mbps ? `${plan.speed_down_mbps} Mbps` : "Internet";
  if (plan.technology === "FTTH") return `Plan de ${speed} por fibra óptica.`;
  if (/inal[aá]mbric/i.test(plan.technology || "")) return `Alternativa de Internet inalámbrico de ${speed}.`;
  if (plan.speed_up_mbps) return `Plan con ${speed} de bajada y ${plan.speed_up_mbps} Mbps de subida.`;
  return `Plan de Internet de ${speed}.`;
}

function scrollToCoverage() {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.querySelector("#contratar")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

export function InternetPlanCatalog({ plans, isDemo = false }: { plans: PublicInternetPlan[]; isDemo?: boolean }) {
  const [audience, setAudience] = useState<CatalogAudience>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const listener = (event: Event) => {
      const value = (event as CustomEvent<{ audience?: InternetAudience }>).detail?.audience;
      if (value) setAudience(value);
    };
    window.addEventListener(internetAudienceSelectedEvent, listener);
    return () => window.removeEventListener(internetAudienceSelectedEvent, listener);
  }, []);

  const { preferred, alternatives } = useMemo(() => prioritizeInternetCatalogPlans(plans, audience), [plans, audience]);
  const selected = plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const heading = audience ? "Planes para tu selección" : "Planes de referencia";

  function card(plan: PublicInternetPlan) {
    const price = formatPrice(plan);
    const isSelected = selectedPlanId === plan.id;
    return <article className={`internet-sales-plan ${isSelected ? "is-selected" : ""}`} key={plan.id}>
      <div className="internet-sales-plan-heading"><span className="eyebrow">{plan.technology ? coverageTechnologyLabel(plan.technology) : "Internet"}</span><h3>{plan.name}</h3></div>
      {plan.audience === "home" && <span className="internet-sales-plan-segment">Hogar</span>}
      {plan.audience === "business" && <span className="internet-sales-plan-segment">Comercial</span>}
      <div className="internet-sales-plan-highlights">
        {plan.speed_down_mbps !== null && <p><strong>{plan.speed_down_mbps}</strong><span>Mbps{plan.speed_up_mbps ? ` de subida: ${plan.speed_up_mbps} Mbps` : ""}</span></p>}
        {price && <p><strong>{price}</strong><span>por mes</span></p>}
      </div>
      <p>{productDescription(plan)}</p>
      {plan.installation_price === 0 && <p className="internet-sales-installation">Instalación sin costo</p>}
      {isSelected && <p className="internet-sales-plan-selected" aria-live="polite">✓ Tu opción de interés</p>}
      <InternetPlanSelectionAction plan={plan} onSelected={() => setSelectedPlanId(plan.id)} />
    </article>;
  }

  return <div className="internet-plan-catalog">
    {isDemo && <div className="internet-demo-notice"><strong>Simulación comercial</strong><span>Valores y condiciones en proceso de validación.</span></div>}
    <h3 className="internet-catalog-heading">{heading}</h3>
    <div className="internet-sales-plans">{preferred.map(card)}</div>
    {alternatives.length > 0 && <><h3 className="internet-catalog-heading internet-catalog-alternatives">Otras alternativas en validación</h3><div className="internet-sales-plans">{alternatives.map(card)}</div></>}
    {selected && <div className="internet-selected-plan-next" aria-live="polite"><div><strong>Tu opción de interés</strong><span>{selected.name}</span></div><button type="button" className="primary" onClick={scrollToCoverage}>Consultar si llega a mi domicilio <span aria-hidden="true">→</span></button></div>}
  </div>;
}
