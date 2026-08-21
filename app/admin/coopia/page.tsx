import Link from "next/link";
import { getCoopiaAnalytics, type CoopiaPeriod } from "../../../lib/data/coopia-analytics";
import { summarizeCoopiaAnalytics } from "../../../lib/coopia/analytics-summary";

export const dynamic = "force-dynamic";
const periods: Array<{ value: CoopiaPeriod; label: string }> = [{ value: "today", label: "Hoy" }, { value: "7d", label: "7 días" }, { value: "30d", label: "30 días" }];
function metric(value: number | null) { return value === null ? "Dato todavía no disponible" : value; }

export default async function CoopiaAdminPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const params = await searchParams;
  const period = periods.some((item) => item.value === params.period) ? params.period as CoopiaPeriod : "7d";
  const data = await getCoopiaAnalytics(period);
  const summary = summarizeCoopiaAnalytics(data);
  const cards = [
    ["Sesiones aproximadas", data.totals.sessions], ["Consultas", data.totals.messages], ["Derivaciones humanas", data.totals.handoffs], ["Consultas sin resolver", data.totals.unresolved], ["Feedback positivo", data.totals.feedbackPositive], ["Solicitudes comerciales", data.commercialRequests],
  ] as const;
  return <section className="admin-page coopia-admin-page"><header className="admin-page-header"><div><span className="eyebrow">Analítica privada</span><h1>COOPIA</h1><p>Indicadores agregados y anónimos de atención. No se guardan conversaciones completas ni datos personales.</p></div></header>
    <nav className="admin-periods" aria-label="Período de analítica">{periods.map((item) => <Link key={item.value} className={item.value === period ? "active" : ""} href={`/admin/coopia?period=${item.value}`}>{item.label}</Link>)}</nav>
    {!data.available ? <div className="admin-empty-state"><strong>Fuente no disponible</strong><p>No pudimos consultar la analítica de COOPIA. Reintentá más tarde; no se muestran ceros como si fueran datos reales.</p></div> : <>
      <section className="coopia-summary admin-card"><span className="eyebrow">Resumen COOPIA</span><h2>Lectura automática de métricas agregadas</h2><p>{summary.summary}</p><ul>{summary.recommendations.map((item) => <li key={item}>{item}</li>)}</ul><small>Generado sin enviar conversaciones ni datos personales.</small></section>
      <section className="admin-metrics">{cards.map(([label, value]) => <article key={label}><small>{label}</small><strong>{metric(value)}</strong></article>)}</section>
      <section className="coopia-admin-grid"><article className="admin-card"><h2>Temas principales</h2>{data.intents.length ? <ol>{data.intents.map((item) => <li key={item.label}><span>{item.label.replaceAll("_", " ")}</span><b>{item.count}</b></li>)}</ol> : <p>Dato todavía no disponible para este período.</p>}</article><article className="admin-card"><h2>Servicios consultados</h2>{data.services.length ? <ol>{data.services.map((item) => <li key={item.label}><span>{item.label}</span><b>{item.count}</b></li>)}</ol> : <p>Dato todavía no disponible para este período.</p>}</article><article className="admin-card"><h2>Resultado operativo</h2><p>{data.totals.averageResponseMs === null ? "Aún no hay respuestas suficientes para calcular un tiempo medio." : `Tiempo medio de respuesta: ${Math.round(data.totals.averageResponseMs / 100) / 10}s.`}</p><p>El detalle de resolución se incorpora de forma agregada y sin contenido de las conversaciones.</p></article></section>
      <section className="admin-card"><h2>Actividad reciente</h2>{data.recent.length ? <ul className="coopia-recent">{data.recent.map((item, index) => <li key={`${item.at}-${index}`}><span>{item.event}</span><small>{new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.at))}</small></li>)}</ul> : <p>No hay actividad registrada para el período seleccionado.</p>}</section>
    </>}
  </section>;
}
