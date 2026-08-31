"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicInternetPlan } from "../../lib/data/public-content";
import { internetAudienceSelectedEvent, type InternetAudience } from "../../lib/internet/audience-selection";
import { prioritizeInternetCatalogPlans } from "../../lib/internet/demo-catalog";
import { getInternetPlanPresentation } from "../../lib/internet/plan-presentation";
import { internetCoveragePlanEvent, pickPlanForCoverageAudience, type InternetCoveragePlanDetail } from "../../lib/internet/coverage-plan-highlight";
import { InternetEnterprisePanel } from "./internet-enterprise-panel";
import { InternetPlanSelectionAction } from "./internet-plan-selection-action";

type CatalogAudience = InternetAudience | null;

function formatPrice(plan: PublicInternetPlan) {
  if (plan.price_amount === null) return null;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: plan.currency || "ARS", maximumFractionDigits: 0 }).format(plan.price_amount);
}

export function InternetPlanCatalog({ plans, isDemo = false }: { plans: PublicInternetPlan[]; isDemo?: boolean }) {
  const [audience, setAudience] = useState<CatalogAudience>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [coverageDetail, setCoverageDetail] = useState<InternetCoveragePlanDetail | null>(null);
  const trackedRecommendation = useRef<string | null>(null);

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
      if (detail) setCoverageDetail(detail);
    };
    window.addEventListener(internetCoveragePlanEvent, listener);
    return () => window.removeEventListener(internetCoveragePlanEvent, listener);
  }, []);

  const { heading, detail, preferred } = useMemo(() => prioritizeInternetCatalogPlans(plans, audience, coverageDetail), [plans, audience, coverageDetail]);
  const coverageMatch = useMemo(() => coverageDetail ? pickPlanForCoverageAudience(plans, coverageDetail, audience, isDemo) : null, [audience, coverageDetail, isDemo, plans]);
  const effectiveSelectedPlanId = preferred.some((plan) => plan.id === selectedPlanId) ? selectedPlanId : null;

  useEffect(() => {
    if (!coverageDetail || !coverageMatch) return;
    const { plan } = coverageMatch;
    const journeyId = sessionStorage.getItem("coopsar-journey-id");
    const sessionId = sessionStorage.getItem("coopsar-session-id");
    const technology = plan.technology === "FTTH" || plan.technology === "ADSL" || plan.technology === "WIRELESS" ? plan.technology : null;
    const recommendationKey = `${plan.id}:${audience}:${coverageDetail.coverageStatus}:${coverageDetail.commercialAvailability}`;

    if (journeyId && sessionId && trackedRecommendation.current !== recommendationKey) {
      trackedRecommendation.current = recommendationKey;
      void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ journeyId, sessionId, eventType: "internet_plan_recommended", page: "/internet", service: "internet", result: plan.id, metadata: { plan_id: plan.id, technology, coverage_status: coverageDetail.coverageStatus, commercial_availability: coverageDetail.commercialAvailability } }) });
    }
  }, [audience, coverageDetail, coverageMatch]);

  function card(plan: PublicInternetPlan) {
    const price = formatPrice(plan);
    const isHighlighted = coverageMatch?.plan.id === plan.id;
    const isSelected = isHighlighted || effectiveSelectedPlanId === plan.id;
    const isAvailable = coverageMatch?.kind === "available" && coverageDetail?.availablePlanIds.includes(plan.id);
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
      <InternetPlanSelectionAction plan={plan} onSelected={() => { setSelectedPlanId(plan.id); setCoverageDetail(null); }} label={isAvailable ? "Elegir este plan" : undefined} />
    </article>;
  }

  const isEnterprise = audience === "empresa";
  const planCount = Math.min(preferred.length, 3);

  return <div className="internet-plan-catalog">
    {isDemo && <div className="internet-demo-notice"><strong>Simulación comercial</strong><span>Valores y condiciones en proceso de validación.</span></div>}
    {!isEnterprise && <div className="internet-catalog-heading"><h3>{heading}</h3>{detail && <p>{detail}</p>}</div>}
    {isEnterprise ? <InternetEnterprisePanel /> : preferred.length > 0 ? <div className={`internet-sales-plans plan-count-${planCount}`}>{preferred.map(card)}</div> : <div className="internet-catalog-empty" role="status"><p>{coverageDetail && (coverageDetail.coverageStatus === "unavailable" || coverageDetail.coverageStatus === "unknown" || coverageDetail.technologies.length === 0) ? "No tenemos una tecnología confirmada para este domicilio." : audience ? "Todavía no hay una oferta publicada para esta categoría." : "Elegí cómo vas a usar Internet para ver las opciones correspondientes."}</p></div>}
  </div>;
}
