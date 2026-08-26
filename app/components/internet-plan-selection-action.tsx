"use client";

import type { PublicInternetPlan } from "../../lib/data/public-content";
import { createPlanSelectionDetail, selectInternetPlanEvent } from "../../lib/internet/plan-selection";

export function InternetPlanSelectionAction({ plan }: { plan: Pick<PublicInternetPlan, "id" | "slug"> }) {
  function selectPlan() {
    window.dispatchEvent(new CustomEvent(selectInternetPlanEvent, { detail: createPlanSelectionDetail(plan) }));
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.querySelector("#contratar")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return <button type="button" className="primary internet-plan-choice" onClick={selectPlan}>Quiero este plan <span aria-hidden="true">→</span></button>;
}
