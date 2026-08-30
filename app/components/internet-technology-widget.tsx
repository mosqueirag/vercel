"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { getInternetTechnologyPresentation, internetTechnologies, type InternetTechnologyId } from "../../lib/internet/technology-presentation";

export function InternetTechnologyWidget() {
  const [selected, setSelected] = useState<InternetTechnologyId>("FTTH");
  const tabListId = useId();
  const detail = getInternetTechnologyPresentation(selected);

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
    <section id={`${tabListId}-panel`} role="tabpanel" aria-live="polite" className={`internet-technology-detail is-${detail.visual}`}>
      <div className="internet-technology-visual" aria-hidden="true"><span /><i /><b /></div>
      <div><span className="eyebrow">{detail.label}</span><h3>{detail.heading}</h3><p>{detail.description}</p></div>
      <ul className="internet-technology-facts">{detail.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
    </section>
  </div>;
}
