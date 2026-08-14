import Link from "next/link";
import { quickActions, serviceStatuses } from "../../lib/coopsar-data";

export function ServiceStatusPanel() {
  const labels = { operational: "Operativo", maintenance: "Mantenimiento programado", partial: "Interrupción parcial", outage: "Interrupción general", unknown: "Sin datos confirmados" };
  return <section className="status-section" id="estado"><div className="section-heading"><div><span className="eyebrow">Estado de servicios</span><h2>Información operativa</h2></div><p>Solo mostramos estados publicados por COOPSAR. Si no hay información confirmada, comunicate con la guardia correspondiente.</p></div><div className="status-grid">{serviceStatuses.map((service) => <article key={service.name}><span className={`status-dot ${service.status}`} /><div><h3>{service.name}</h3><p>{service.detail}</p></div><b className={service.status}>{labels[service.status]}</b></article>)}</div><Link className="text-link" href="/cortes-programados">Ver alertas y cortes programados →</Link></section>;
}

export function SelfService() {
  return <section className="self-service" id="tramites"><div className="section-heading"><div><span className="eyebrow">Autoservicio</span><h2>Resolvé gestiones frecuentes</h2></div><p>No necesitás conocer la estructura del sitio: elegí qué querés hacer y te llevamos al canal correspondiente.</p></div><div className="self-grid">{quickActions.map(([title, description, href, icon]) => <a href={href} key={title}><span>{icon}</span><div><h3>{title}</h3><p>{description}</p></div><b>→</b></a>)}</div></section>;
}
