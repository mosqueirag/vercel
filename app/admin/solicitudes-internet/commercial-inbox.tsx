"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { commercialStatuses, commercialTypeLabel, commercialWhatsAppUrl, type CommercialLead, type CommercialStatus, type FiberDemand } from "../../../lib/commercial-inbox";

type ResponseData = { leads: CommercialLead[]; demand: FiberDemand[]; summary: { total: number; new: number; contacted: number; waitingCoverage: number } };
type Filter = "all" | CommercialLead["requestType"];

function statusLabel(status: CommercialStatus) {
  return ({ new: "Nueva", contacted: "Contactada", qualified: "Calificada", installation_pending: "Instalación pendiente", completed: "Completada", lost: "Descartada", waiting_coverage: "En espera de cobertura", notified: "Notificada", converted: "Convertida", closed: "Cerrada", cancelled: "Cancelada" } satisfies Record<CommercialStatus, string>)[status];
}

export default function CommercialInbox() {
  const [data, setData] = useState<ResponseData | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<CommercialLead | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const endpoint = useMemo(() => `/api/admin/comercial${filter === "all" ? "" : `?type=${filter}`}`, [filter]);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(endpoint, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "No pudimos cargar las oportunidades."); setLoading(false); return; }
    setData(result); setMessage(""); setLoading(false);
  }, [endpoint]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function track(id: string, action: "view" | "contact_opened") {
    await fetch("/api/admin/comercial", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action }) });
  }
  async function changeStatus(lead: CommercialLead, status: CommercialStatus) {
    const response = await fetch("/api/admin/comercial", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: lead.id, status }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "No pudimos actualizar el estado."); return; }
    setData((current) => current ? { ...current, leads: current.leads.map((item) => item.id === result.lead.id ? result.lead : item) } : current);
    setSelected((current) => current?.id === result.lead.id ? result.lead : current);
    setMessage("Estado operativo actualizado.");
  }

  return <main className="admin commercial-inbox">
    <Link href="/admin">← Administración</Link>
    <div className="commercial-heading"><div><span className="eyebrow">Gestión comercial</span><h1>Oportunidades de Internet y Fibra</h1><p>Gestioná solicitudes recibidas y demanda futura. Los mensajes se abren manualmente; no se envía nada desde COOPSAR.</p></div><button className="primary" onClick={() => void load()} disabled={loading}>Actualizar</button></div>
    {message && <p className="admin-message" role="status">{message}</p>}
    <div className="commercial-summary" aria-label="Resumen comercial"><article><small>Nuevas</small><strong>{data?.summary.new ?? "—"}</strong></article><article><small>Contactadas</small><strong>{data?.summary.contacted ?? "—"}</strong></article><article><small>Espera de fibra</small><strong>{data?.summary.waitingCoverage ?? "—"}</strong></article><article><small>Total</small><strong>{data?.summary.total ?? "—"}</strong></article></div>
    <div className="commercial-filters" role="tablist" aria-label="Filtrar oportunidades">{([ ["all", "Todas"], ["installation", "Internet"], ["fiber_waitlist", "Fibra / espera"] ] as const).map(([value, label]) => <button key={value} role="tab" aria-selected={filter === value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
    <section className="commercial-demand" aria-labelledby="fiber-demand-title"><div><span className="eyebrow">Demanda agregada</span><h2 id="fiber-demand-title">Interés futuro en fibra</h2><p>Se muestran únicamente grupos de dos o más registros; esta vista no confirma cobertura.</p></div><div>{data?.demand.length ? data.demand.map((item) => <span key={`${item.dimension}-${item.label}`}>{item.dimension === "zone" ? "Zona" : "Calle"}: {item.label} <b>{item.count}</b></span>) : <p>No hay grupos suficientes para mostrar.</p>}</div></section>
    <section className="admin-table-wrap"><h2>{loading ? "Cargando oportunidades…" : `${data?.leads.length || 0} oportunidades visibles`}</h2><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Contacto</th><th>Plan / cobertura</th><th>Consentimiento</th><th>Estado</th><th /></tr></thead><tbody>{data?.leads.map((lead) => <tr key={lead.id}><td>{new Date(lead.createdAt).toLocaleDateString("es-AR")}</td><td>{commercialTypeLabel(lead.requestType)}</td><td><b>{lead.fullName}</b><br /><small>{lead.phone}{lead.email ? " · email disponible" : ""}</small></td><td>{lead.selectedPlan || "Sin plan confirmado"}<br /><small>{lead.coverageStatus || "Cobertura pendiente"}</small></td><td>{lead.contactConsent ? "Contacto autorizado" : "Sin consentimiento"}{lead.marketingOptIn ? " · marketing" : ""}</td><td><select aria-label={`Estado de ${lead.fullName}`} value={lead.status} onChange={(event) => void changeStatus(lead, event.target.value as CommercialStatus)}>{commercialStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></td><td><button onClick={() => { setSelected(lead); void track(lead.id, "view"); }}>Ver solicitud</button></td></tr>)}</tbody></table></section>
    {selected && <section className="commercial-detail" aria-labelledby="lead-detail-title"><div><div><span className="eyebrow">Solicitud</span><h2 id="lead-detail-title">{commercialTypeLabel(selected.requestType)}</h2></div><button onClick={() => setSelected(null)} aria-label="Cerrar detalle">×</button></div><dl><div><dt>Nombre</dt><dd>{selected.fullName}</dd></div><div><dt>Teléfono</dt><dd>{selected.phone}</dd></div>{selected.email && <div><dt>Email</dt><dd>{selected.email}</dd></div>}<div><dt>Domicilio informado</dt><dd>{selected.address}</dd></div><div><dt>Origen</dt><dd>{selected.journeyId || "Sin journey"}</dd></div></dl><div className="commercial-actions">{commercialWhatsAppUrl(selected.phone) && <a className="primary" href={commercialWhatsAppUrl(selected.phone) || undefined} target="_blank" rel="noreferrer" onClick={() => void track(selected.id, "contact_opened")}>Contactar por WhatsApp</a>}{selected.email && <a href={`mailto:${selected.email}`} onClick={() => void track(selected.id, "contact_opened")}>Enviar email</a>}</div></section>}
  </main>;
}
