import type { PublicServiceAlert, PublicServiceStatus } from "../../lib/data/service-alerts";

const copy: Record<PublicServiceStatus, string> = { outage: "Interrupción informada", partial: "Afectación parcial informada", maintenance: "Mantenimiento informado", operational: "Servicio operativo informado", unknown: "Sin información operativa confirmada" };
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : null; }

export function energyStatusPresentation({ status, alert, error }: { status: PublicServiceStatus; alert: PublicServiceAlert | null; error: boolean }) {
  if (error) return { title: "No pudimos consultar el estado del servicio en este momento.", message: "Consultá los canales oficiales disponibles si necesitás asistencia.", source: null };
  if (!alert && status === "unknown") return { title: copy.unknown, message: "No hay un aviso operativo vigente para mostrar.", source: null };
  return { title: copy[status], message: alert?.detail ?? null, source: alert ? (formatDate(alert.publishedAt) ? `Información publicada por COOPSAR · ${formatDate(alert.publishedAt)}` : "Información publicada por COOPSAR") : null };
}

export function EnergyStatusPanel({ status, alert, error }: { status: PublicServiceStatus; alert: PublicServiceAlert | null; error: boolean }) {
  const presentation = energyStatusPresentation({ status, alert, error });
  return <section className={`energy-status energy-status--${status}`} aria-labelledby="energy-status-title"><div><span className="eyebrow">Estado del servicio</span><h2 id="energy-status-title">{presentation.title}</h2>{presentation.message && <p>{presentation.message}</p>}</div>{presentation.source && <aside><strong>{alert?.title}</strong><small>{presentation.source}</small></aside>}</section>;
}
