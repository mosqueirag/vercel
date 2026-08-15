"use client";

import Link from "next/link";
import { useState } from "react";
import { quickActions, serviceStatuses } from "../../lib/coopsar-data";

const actionGroups = [
  { id: "facturas", label: "Facturas y cuenta", titles: ["Pagar factura", "Descargar factura", "Consultar deuda"] },
  { id: "energia", label: "Energía", titles: ["Falta de energía", "Cortes programados", "Nueva conexión", "Solicitar reconexión"] },
  { id: "internet", label: "Internet y fibra", titles: ["Consultar cobertura", "Contratar internet"] },
  { id: "asociado", label: "Datos y atención", titles: ["Cambiar titularidad", "Actualizar datos", "WhatsApp"] },
] as const;

export function ServiceStatusPanel() {
  const labels = { operational: "Operativo", maintenance: "Mantenimiento programado", partial: "Interrupción parcial", outage: "Interrupción general", unknown: "Sin datos confirmados" };
  return <section className="status-section" id="estado"><div className="section-heading"><div><span className="eyebrow">Estado de servicios</span><h2>Información operativa</h2></div><p>Solo mostramos estados publicados por COOPSAR. Si no hay información confirmada, comunicate con la guardia correspondiente.</p></div><div className="status-grid">{serviceStatuses.map((service) => <article key={service.name}><span className={`status-dot ${service.status}`} /><div><h3>{service.name}</h3><p>{service.detail}</p></div><b className={service.status}>{labels[service.status]}</b></article>)}</div><Link className="text-link" href="/cortes-programados">Ver alertas y cortes programados →</Link></section>;
}

export function SelfService() {
  const [active, setActive] = useState<(typeof actionGroups)[number]["id"]>("facturas");
  const group = actionGroups.find((item) => item.id === active) ?? actionGroups[0];
  const actions = quickActions.filter(([title]) => group.titles.some((item) => item === title));
  const [featured, ...secondary] = actions;

  return <section className="self-service" id="tramites"><div className="section-heading"><div><span className="eyebrow">Accesos rápidos</span><h2>¿Qué necesitás hacer?</h2></div><p>Elegí una categoría y accedé directamente a la gestión o al canal de atención correspondiente.</p></div><div className="quick-access"><div className="quick-tabs" role="tablist" aria-label="Categorías de gestiones">{actionGroups.map((item) => <button type="button" role="tab" aria-selected={active === item.id} className={active === item.id ? "active" : ""} key={item.id} onClick={() => setActive(item.id)}><span>{item.label}</span><b>→</b></button>)}</div><div className="quick-panel" role="tabpanel" aria-live="polite"><div className="quick-panel-heading"><small>{group.label}</small><strong>Accesos disponibles</strong></div>{featured && <a className="quick-featured" href={featured[2]}><span>{featured[3]}</span><div><small>Acceso principal</small><h3>{featured[0]}</h3><p>{featured[1]}</p></div><b>↗</b></a>}<div className="quick-secondary">{secondary.map(([title, description, href, icon]) => <a href={href} key={title}><span>{icon}</span><div><h3>{title}</h3><p>{description}</p></div><b>→</b></a>)}</div></div></div></section>;
}
