import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer, Header } from "../ui";
import { getPublicContacts, getPublishedFuneralFaqs } from "../../lib/data/public-content";
import { getPublishedSitePage } from "../../lib/data/site-pages";
import { servicePages } from "../../lib/service-pages";
import { resolveFuneralGuard } from "../../lib/sepelio-presentation";
import { SepelioCoopiaAction } from "../components/sepelio-coopia-action";
import { getStagingFuneralCandidates, isStagingFuneralContentPreview } from "../../lib/sepelio-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Servicio de Sepelio", description: "Orientación y acceso directo a la guardia del Servicio Solidario de Sepelios de COOPSAR." };

export default async function SepelioPage() {
  const [publishedPage, contacts, faqs] = await Promise.all([getPublishedSitePage("sepelio"), getPublicContacts("funeral"), getPublishedFuneralFaqs()]);
  const content = publishedPage ?? servicePages.sepelio;
  const guard = resolveFuneralGuard(contacts);
  const candidates = isStagingFuneralContentPreview() ? getStagingFuneralCandidates() : [];
  return <><Header /><main className="sepelio-page">
    <section className="sepelio-hero" aria-labelledby="sepelio-title"><Image src="/images/sarmiento-community.png" alt="Comunidad de Sarmiento" fill priority sizes="100vw" /><div className="sepelio-hero-shade" /><div className="sepelio-hero-content"><p className="eyebrow">{content.eyebrow}</p><h1 id="sepelio-title">{content.title}</h1><p>{content.intro}</p><div className="sepelio-hero-actions"><a className="button sepelio-primary-action" href={guard.href}>{guard.isPublished ? "Llamar a guardia" : "Ver canales de atención"} <span>→</span></a><a className="button sepelio-secondary-action" href="#informacion">Conocer el servicio</a></div></div><aside className="sepelio-emergency-card" aria-label="Atención urgente"><span className="sepelio-emergency-icon" aria-hidden="true">✦</span><p>Si necesitás el servicio ahora</p><strong>{guard.label}</strong><span>{guard.isPublished ? "Canal publicado de atención." : "Canal pendiente de confirmación."}</span></aside></section>
    <section id="informacion" className="sepelio-needs section-shell" aria-labelledby="sepelio-needs-title"><div className="section-heading"><p className="eyebrow">Servicio de sepelio</p><h2 id="sepelio-needs-title">Atención y gestiones en un solo lugar</h2></div><div className="sepelio-needs-grid"><a className="sepelio-need sepelio-need-urgent" href={guard.href}><span className="sepelio-need-icon" aria-hidden="true">☎</span><strong>Necesito el servicio ahora</strong><small>Accedé al canal de guardia publicado.</small><b aria-hidden="true">→</b></a><Link className="sepelio-need" href="/sepelio/actualizar-grupo-familiar"><span className="sepelio-need-icon" aria-hidden="true">◌</span><strong>Actualizar grupo familiar</strong><small>Iniciá una solicitud privada para revisión.</small><b aria-hidden="true">→</b></Link><SepelioCoopiaAction className="sepelio-need" prompt="Quiero información sobre el servicio de sepelio."><span className="sepelio-need-icon" aria-hidden="true">?</span>Consultar el servicio<span className="sepelio-need-description">COOPIA te guía con información oficial publicada.</span></SepelioCoopiaAction></div></section>
    {candidates.length > 0 && <section id="informacion" className="sepelio-review section-shell" aria-labelledby="sepelio-review-title"><div className="section-heading"><p className="eyebrow">Información en revisión</p><h2 id="sepelio-review-title">El servicio, en una mirada</h2><p>Estamos actualizando esta información antes de su publicación definitiva.</p></div><div>{candidates.map((candidate) => <article key={candidate.title}><h3>{candidate.title}</h3><p>{candidate.body}</p></article>)}</div></section>}
    <section className="sepelio-family-callout section-shell" aria-labelledby="sepelio-family-title"><div><p className="eyebrow">Grupo familiar</p><h2 id="sepelio-family-title">Mantené tus datos al día</h2><p>Informá los integrantes que necesitás que COOPSAR revise. El equipo valida la solicitud antes de realizar cualquier modificación.</p></div><Link className="button sepelio-primary-action" href="/sepelio/actualizar-grupo-familiar">Actualizar grupo familiar <span>→</span></Link></section>
    {faqs.length > 0 && <section className="sepelio-faq section-shell" aria-labelledby="sepelio-faq-title"><div className="section-heading"><p className="eyebrow">Preguntas frecuentes</p><h2 id="sepelio-faq-title">Información para acompañarte</h2></div><div>{faqs.map((faq) => <details key={`${faq.category}-${faq.question}`}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></section>}
    <section className="sepelio-closing section-shell" aria-label="Canales de atención"><div><h2>¿Necesitás orientación?</h2><p>Para una urgencia, usá la guardia. Para una consulta, abrí COOPIA.</p></div><div><a className="button sepelio-primary-action" href={guard.href}>Llamar a guardia <span>→</span></a><SepelioCoopiaAction className="button sepelio-secondary-action" prompt="Necesito orientación sobre el servicio de sepelio.">Abrir COOPIA</SepelioCoopiaAction></div></section>
  </main><Footer /></>;
}
