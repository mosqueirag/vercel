"use client";

import type { PublicInternetPlan } from "../../lib/data/public-content";
import { createJourneyId, createSessionId } from "../../lib/journey/ids";
import { createPlanSelectedEvent, createPlanSelectionDetail, selectInternetPlanEvent } from "../../lib/internet/plan-selection";

export function InternetPlanSelectionAction({ plan, onSelected, label = "Quiero este plan" }: { plan: Pick<PublicInternetPlan, "id" | "slug" | "name" | "speed_down_mbps" | "speed_up_mbps" | "price_amount" | "currency">; onSelected?: () => void; label?: string }) {
  function selectPlan() {
    const journeyId = sessionStorage.getItem("coopsar-journey-id") || createJourneyId();
    const sessionId = sessionStorage.getItem("coopsar-session-id") || createSessionId();
    sessionStorage.setItem("coopsar-journey-id", journeyId);
    sessionStorage.setItem("coopsar-session-id", sessionId);
    void fetch("/api/journey/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(createPlanSelectedEvent(plan, journeyId, sessionId)) });
    window.dispatchEvent(new CustomEvent(selectInternetPlanEvent, { detail: createPlanSelectionDetail(plan) }));
    onSelected?.();
    if (onSelected) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.querySelector("#contratar")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return <button type="button" className="primary internet-plan-choice public-action-button" onClick={selectPlan}>{label} <span aria-hidden="true">→</span></button>;
}
