import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "../ui";
import { getPublishedEnergyAlerts } from "../../lib/data/service-alerts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cortes programados | COOPSAR", description: "Avisos publicados de mantenimiento programado del servicio de energía." };
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : null;

export default async function ScheduledCutsPage() {
  const alerts = await getPublishedEnergyAlerts();
  return <><Header /><main className="scheduled-cuts"><section className="scheduled-cuts-hero"><span className="eyebrow">Energía</span><h1>Cortes programados</h1><p>Los cortes programados se informan por separado de las interrupciones imprevistas.</p><Link className="public-action-button" href="/energia">Ver estado del servicio <span className="public-action-arrow" aria-hidden="true">→</span></Link></section><section className="scheduled-cuts-list" aria-labelledby="scheduled-cuts-title"><h2 id="scheduled-cuts-title">Avisos publicados</h2>{alerts.length === 0 ? <div className="scheduled-cuts-empty"><p>No hay cortes programados publicados en este momento.</p><small>Si estás sin energía, consultá el estado del servicio o la guardia.</small><Link href="/energia">Ir a Energía →</Link></div> : <div className="scheduled-cuts-grid">{alerts.map((alert) => <article key={`${alert.title}-${alert.startsAt}`}><span>Mantenimiento informado</span><h3>{alert.title}</h3>{alert.detail && <p>{alert.detail}</p>}{alert.startsAt && <small>Inicio: {formatDate(alert.startsAt)}</small>}{alert.endsAt && <small>Finalización: {formatDate(alert.endsAt)}</small>}</article>)}</div>}</section></main><Footer /></>;
}
