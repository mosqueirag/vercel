"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { PublicInternetPlan } from "../../lib/data/public-content";
import { getInternetTechnologyPresentation, internetTechnologies, type InternetTechnologyId } from "../../lib/internet/technology-presentation";

function scrollToCoverage() {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.querySelector("#contratar")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

export function InternetTechnologyWidget({ plans }: { plans: PublicInternetPlan[] }) {
  const [selected, setSelected] = useState<InternetTechnologyId>("FTTH");
  const tabListId = useId();
  const detail = getInternetTechnologyPresentation(plans, selected);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, technology: InternetTechnologyId) {
    const currentIndex = internetTechnologies.findIndex((item) => item.id === technology);
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextIndex = event.key === "ArrowRight"
      ? (currentIndex + 1) % internetTechnologies.length
      : (currentIndex - 1 + internetTechnologies.length) % internetTechnologies.length;
    const next = internetTechnologies[nextIndex];
    setSelected(next.id);
    document.getElementById(`${tabListId}-${next.id}`)?.focus();
  }

  return <div className="internet-technology-widget">
    <div className="internet-technology-tabs" role="tablist" aria-label="Tecnologías de Internet">
      {internetTechnologies.map((technology) => <button
        id={`${tabListId}-${technology.id}`}
        key={technology.id}
        type="button"
        role="tab"
        aria-selected={selected === technology.id}
        aria-controls={`${tabListId}-panel`}
        tabIndex={selected === technology.id ? 0 : -1}
        onClick={() => setSelected(technology.id)}
        onKeyDown={(event) => onKeyDown(event, technology.id)}
      >{technology.label}</button>)}
    </div>
    <section id={`${tabListId}-panel`} role="tabpanel" aria-live="polite" className="internet-technology-detail">
      <div><span className="eyebrow">{detail.label}</span><h3>{detail.heading}</h3><p>{detail.description}</p></div>
      <div className="internet-technology-facts">
        <p><strong>Velocidades en catálogo</strong>{detail.speeds.length ? <span>{detail.speeds.map((speed) => `${speed} Mbps`).join(" · ")}</span> : <span>Disponibilidad a confirmar.</span>}</p>
        <p><strong>Disponibilidad</strong><span>Se confirma al consultar tu domicilio.</span></p>
      </div>
      <button type="button" className="primary" onClick={scrollToCoverage}>Consultar mi domicilio <span aria-hidden="true">→</span></button>
    </section>
  </div>;
}
