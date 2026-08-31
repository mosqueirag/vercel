import type { PublicServiceAlert, PublicServiceStatus } from "../../lib/data/service-alerts";

const copy: Record<PublicServiceStatus, string> = { outage: "Interrupción informada", partial: "Afectación parcial informada", maintenance: "Mantenimiento informado", operational: "Servicio operativo informado", unknown: "Sin información operativa confirmada" };
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : null; }

export function EnergyStatusPanel({ status, alert }: { status: PublicServiceStatus; alert: PublicServiceAlert | null }) {
  const published = formatDate(alert?.publishedAt ?? null);
  return <section className={`energy-status energy-status--${status}`} aria-labelledby="energy-status-title"><div><span className="eyebrow">Estado del servicio</span><h2 id="energy-status-title">{copy[status]}</h2>{alert?.detail && <p>{alert.detail}</p>}{!alert?.detail && status === "unknown" && <p>Consultá los canales oficiales disponibles si necesitás asistencia.</p>}</div><aside><strong>{alert?.title ?? "Información operativa"}</strong><small>{published ? `Información publicada por COOPSAR · ${published}` : "Información publicada por COOPSAR"}</small></aside></section>;
}
