"use client";

import Link from "next/link";
import { useCoopia } from "../components/coopia-context";
import type { PublicContact } from "../../lib/data/public-content";

export function EnergyCoopiaAction({ prompt, children, className }: { prompt: string; children: React.ReactNode; className?: string }) {
  const coopia = useCoopia();
  return <button type="button" className={className} onClick={() => { coopia.setOpen(true); void coopia.ask(prompt); }}>{children}</button>;
}

export function EnergyActions({ guard }: { guard: PublicContact | null }) {
  const guardHref = guard?.value ? `tel:${guard.value.replace(/[^\d+]/g, "")}` : null;
  return <section className="energy-actions" aria-labelledby="energy-actions-title"><div className="energy-section-heading"><span className="eyebrow">Gestiones de energía</span><h2 id="energy-actions-title">¿Qué necesitás resolver?</h2></div><div className="energy-actions-grid">
    <EnergyCoopiaAction prompt="Estoy sin energía" className="energy-action energy-action--urgent public-action-card public-action-card--primary"><i className="public-action-icon" aria-hidden="true">!</i><span><strong>Estoy sin energía</strong><small>Revisá el estado y los canales oficiales.</small></span><b className="public-action-arrow" aria-hidden="true">→</b></EnergyCoopiaAction>
    <Link className="energy-action public-action-card public-action-card--primary" href="/cortes-programados"><i className="public-action-icon" aria-hidden="true">◌</i><span><strong>Cortes programados</strong><small>Consultá avisos publicados de mantenimiento.</small></span><b className="public-action-arrow" aria-hidden="true">→</b></Link>
    {guardHref ? <a className="energy-action public-action-card public-action-card--primary" href={guardHref}><i className="public-action-icon" aria-hidden="true">☎</i><span><strong>Llamar a guardia</strong><small>{guard?.label}</small></span><b className="public-action-arrow" aria-hidden="true">→</b></a> : <Link className="energy-action public-action-card public-action-card--primary" href="/contacto"><i className="public-action-icon" aria-hidden="true">☎</i><span><strong>Canales oficiales</strong><small>Consultá la atención disponible.</small></span><b className="public-action-arrow" aria-hidden="true">→</b></Link>}
    <Link className="energy-action public-action-card public-action-card--primary" href="/simulador-energia"><i className="public-action-icon" aria-hidden="true">◒</i><span><strong>Simulador de consumo</strong><small>Estimá el consumo mensual de tus artefactos.</small></span><b className="public-action-arrow" aria-hidden="true">→</b></Link>
    <EnergyCoopiaAction prompt="Quiero un nuevo suministro" className="energy-action public-action-card public-action-card--primary"><i className="public-action-icon" aria-hidden="true">+</i><span><strong>Nuevo suministro</strong><small>Consultá cómo iniciar una nueva conexión.</small></span><b className="public-action-arrow" aria-hidden="true">→</b></EnergyCoopiaAction>
    <Link className="energy-action public-action-card public-action-card--primary" href="/medios-de-pago"><i className="public-action-icon" aria-hidden="true">$</i><span><strong>Facturas y pagos</strong><small>Accedé a los canales digitales disponibles.</small></span><b className="public-action-arrow" aria-hidden="true">→</b></Link>
  </div></section>;
}
