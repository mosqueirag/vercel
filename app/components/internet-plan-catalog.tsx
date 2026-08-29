"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicInternetPlan } from "../../lib/data/public-content";
import { internetAudienceSelectedEvent, type InternetAudience } from "../../lib/internet/audience-selection";
import { prioritizeInternetCatalogPlans } from "../../lib/internet/demo-catalog";
import { getInternetPlanPresentation } from "../../lib/internet/plan-presentation";
import { internetCoveragePlanEvent, pickReferencePlanForCoverage, type InternetCoveragePlanDetail } from "../../lib/internet/coverage-plan-highlight";
import { InternetPlanSelectionAction } from "./internet-plan-selection-action";

type CatalogAudience = InternetAudience | null;

function formatPrice(plan: PublicInternetPlan) {
  if (plan.price_amount === null) return null;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: plan.currency || "ARS", maximumFractionDigits: 0 }).format(plan.price_amount);
}

function scrollToCoverage() {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.querySelector("#contratar")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

export function InternetPlanCatalog({ plans, isDemo = false }: { plans: PublicInternetPlan[]; isDemo?: boolean }) {
  const [audience, setAudience] = useState<CatalogAudience>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [coverageHighlight, setCoverageHighlight] = useState<{ planId: string; kind: "available" | "reference"; availablePlanIds: string[]; coverageStatus: string } | null>(null);

  useEffect(() => {
    const listener = (event: Event) => {
      const value = (event as CustomEvent<{ audience?: InternetAudience }>).detail?.audience;
      if (value) setAudience(value);
    };
    window.addEventListener(internetAudienceSelectedEvent, listener);
    return () => window.removeEventListener(internetAudienceSelectedEvent, listener);
  }, []);

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<InternetCoveragePlanDetail>).detail;
      if (!detail) return;
      const publishedPlan = detail.commercialAvailability && detail.preferredPlanId && plans.some((plan) => plan.id === detail.preferredPlanId)
        ? detail.preferredPlanId
        : null;
      const referencePlan = !publishedPlan && isDemo ? pickReferencePlanForCoverage(plans, detail.technologies, audience) : null;
      const planId = publishedPlan ?? referencePlan?.id ?? null;
      if (!planId) { setCoverageHighlight(null); return; }
      const kind = publishedPlan ? "available" : "reference" as const;
      setSelectedPlanId(planId);
      setCoverageHighlight({ planId, kind, availablePlanIds: detail.availablePlanIds, coverageStatus: detail.coverageStatus });
      const journeyId = sessionStorage.getItem("coopsar-journey-id");
      const sessionId = sessionStorage.getItem("coopsar-session-id");
      const selectedTechnology = referencePlan?.technology ?? plans.find((plan) => plan.id === planId)?.technology ?? null;
      const technology = selectedTechnology === "FTTH" || selectedTechnology === "ADSL" || selectedTechnology === "WIRELESS" ? selectedTechnology : null;

      if (journeyId && sessionId) void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId, sessionId, eventType: "internet_plan_recommended", page: "/internet", service: "internet", result: planId, metadata: { plan_id: planId, technology, coverage_status: detail.coverageStatus, commercial_availability: detail.commercialAvailability } }) });
    };
    window.addEventListener(internetCoveragePlanEvent, listener);
    return () => window.removeEventListener(internetCoveragePlanEvent, listener);
  }, [audience, isDemo, plans]);

  const { heading, detail, preferred, alternatives } = useMemo(() => prioritizeInternetCatalogPlans(plans, audience), [plans, audience]);
  const selected = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  function card(plan: PublicInternetPlan) {
    const price = formatPrice(plan);
    const isSelected = selectedPlanId === plan.id;
    const isHighlighted = coverageHighlight?.planId === plan.id;
    const isAvailable = coverageHighlight?.kind === "available" && coverageHighlight.availablePlanIds.includes(plan.id);
    const presentation = getInternetPlanPresentation(plan);
    return <article className={`internet-sales-plan ${isSelected ? "is-selected" : ""} ${isHighlighted ? "is-coverage-available" : ""}`} key={plan.id}>
      <div className="internet-sales-plan-heading"><span className="eyebrow">{presentation.technologyLabel}</span><h3>{presentation.displayName}</h3></div>
      {presentation.audienceLabel && <span className="internet-sales-plan-segment">{presentation.audienceLabel}</span>}
      <div className="internet-sales-plan-highlights">
        {plan.speed_down_mbps !== null && <p><strong>{plan.speed_down_mbps}</strong><span>Mbps</span></p>}
        {price && <p><strong>{price}</strong><span>por mes</span></p>}
      </div>
      {presentation.secondaryLabel && <p className="internet-sales-installation">{presentation.secondaryLabel}</p>}
      {isAvailable && <p className="internet-sales-plan-selected" aria-live="polite">✓ Disponible para tu domicilio</p>}
      {isHighlighted && !isAvailable && <p className="internet-sales-plan-reference" aria-live="polite">Opción de referencia para tu cobertura<br /><span>Oferta comercial a validar.</span></p>}
      {isSelected && !isHighlighted && <p className="internet-sales-plan-selected" aria-live="polite">✓ Tu opción de interés</p>}
      <InternetPlanSelectionAction plan={plan} onSelected={() => { setSelectedPlanId(plan.id); setCoverageHighlight(null); }} label={isAvailable ? "Elegir este plan" : undefined} />
    </article>;
  }

  return <div className="internet-plan-catalog">
    {isDemo && <div className="internet-demo-notice"><strong>Simulación comercial</strong><span>Valores y condiciones en proceso de validación.</span></div>}
    <div className="internet-catalog-heading"><h3>{heading}</h3>{detail && <p>{detail}</p>}</div>
    <div className="internet-sales-plans">{preferred.map(card)}</div>
    {alternatives.length > 0 && <><h3 className="internet-catalog-heading internet-catalog-alternatives">Otras alternativas en validación</h3><div className="internet-sales-plans">{alternatives.map(card)}</div></>}
    {selected && <div className="internet-selected-plan-next" aria-live="polite"><div><small>Oferta de referencia</small><strong>{getInternetPlanPresentation(selected).displayName}</strong><span>{getInternetPlanPresentation(selected).speedLabel}{formatPrice(selected) ? ` · ${formatPrice(selected)} por mes` : ""}</span></div><button type="button" className="primary" onClick={scrollToCoverage}>Consultar disponibilidad en mi domicilio <span aria-hidden="true">→</span></button></div>}
  </div>;
}
