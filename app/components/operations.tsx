"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { quickActions } from "../../lib/coopsar-data";
import type { PublicServiceStatus } from "../../lib/tools/service-status";
import { usePublicContact } from "./public-contact-context";

const actionGroups = [
  { id: "facturas", label: "Facturas y cuenta", image: "/images/quick-access-billing.webp", imageAlt: "Atención personalizada para consultar una factura", titles: ["Pagar factura", "Descargar factura", "Consultar deuda"] },
  { id: "energia", label: "Energía", image: "/images/quick-access-energy.webp", imageAlt: "Técnico trabajando en la red eléctrica de una localidad patagónica", titles: ["Falta de energía", "Cortes programados", "Nueva conexión", "Solicitar reconexión"] },
  { id: "internet", label: "Internet", image: "/images/quick-access-internet.webp", imageAlt: "Técnico instalando conectividad en un hogar", titles: ["Consultar cobertura", "Contratar internet"] },
  { id: "asociado", label: "Datos y atención", image: "/images/quick-access-support.webp", imageAlt: "Atención de una consulta en una oficina de servicios", titles: ["Cambiar titularidad", "Actualizar datos", "WhatsApp"] },
] as const;

export function ServiceStatusPanel({ services }: { services: { name: string; status: PublicServiceStatus; detail: string }[] }) {
  const labels = { operational: "Operativo", maintenance: "Mantenimiento programado", partial: "Interrupción parcial", outage: "Interrupción general", unknown: "Sin datos confirmados" };
  return <section className="status-section" id="estado"><div className="section-heading"><div><span className="eyebrow">Estado de servicios</span><h2>Información operativa</h2></div><p>Solo mostramos estados publicados por COOPSAR. Si no hay información confirmada, comunicate con la guardia correspondiente.</p></div><div className="status-grid">{services.map((service) => <article key={service.name}><span className={`status-dot ${service.status}`} /><div><h3>{service.name}</h3><p>{service.detail}</p></div><b className={service.status}>{labels[service.status]}</b></article>)}</div><Link className="text-link" href="/cortes-programados">Ver alertas y cortes programados →</Link></section>;
}

export function SelfService() {
  const [active, setActive] = useState<(typeof actionGroups)[number]["id"]>("facturas");
  const group = actionGroups.find((item) => item.id === active) ?? actionGroups[0];
  const officialVirtualOffice = usePublicContact("billing", "virtual_office")?.value;
  const officialEnergyGuard = usePublicContact("energy", "emergency")?.value;
  const officialWhatsApp = usePublicContact("general", "general_contact")?.value;
  const actions = quickActions
    .map(([title, description, href, icon]) => {
      if (["Pagar factura", "Descargar factura", "Consultar deuda"].includes(title) && officialVirtualOffice) return [title, description, officialVirtualOffice, icon] as const;
      if (title === "Falta de energía" && officialEnergyGuard) return [title, `Guardia: ${officialEnergyGuard}.`, href, icon] as const;
      if (title === "WhatsApp" && officialWhatsApp) return [title, description, `https://wa.me/${officialWhatsApp.replace(/\D/g, "")}`, icon] as const;
      return [title, description, href, icon] as const;
    })
    .filter(([title]) => group.titles.some((item) => item === title));
  const [featured, ...secondary] = actions;

  return <section className="self-service" id="tramites"><div className="section-heading"><div><span className="eyebrow">Accesos rápidos</span><h2>¿Qué necesitás hacer?</h2></div><p>Elegí una categoría y accedé directamente a la gestión o al canal de atención correspondiente.</p></div><div className="quick-access"><div className="quick-tabs" role="tablist" aria-label="Categorías de gestiones">{actionGroups.map((item) => <button type="button" role="tab" aria-selected={active === item.id} className={active === item.id ? "active" : ""} key={item.id} onClick={() => setActive(item.id)}><span>{item.label}</span><b>→</b></button>)}</div><div className="quick-panel" role="tabpanel" aria-live="polite"><div className="quick-panel-heading"><small>{group.label}</small><strong>Accesos disponibles</strong></div>{featured && <a className="quick-featured" href={featured[2]}><Image className="quick-featured-image" src={group.image} alt={group.imageAlt} fill sizes="(max-width: 900px) 100vw, 48vw" /><span>{featured[3]}</span><div><small>Acceso principal</small><h3>{featured[0]}</h3><p>{featured[1]}</p></div><b>↗</b></a>}<div className="quick-secondary">{secondary.map(([title, description, href, icon]) => <a href={href} key={title}><span>{icon}</span><div><h3>{title}</h3><p>{description}</p></div><b>→</b></a>)}</div></div></div></section>;
}
