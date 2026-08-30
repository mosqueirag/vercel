import Image from "next/image";
import Link from "next/link";
import { Footer, Header } from "../ui";
import { getPublicContacts, getPublishedFuneralFaqs } from "../../lib/data/public-content";
import { getPublishedSitePage } from "../../lib/data/site-pages";
import { servicePages } from "../../lib/service-pages";
import { resolveFuneralGuard } from "../../lib/sepelio-presentation";
import { SepelioCoopiaAction } from "../components/sepelio-coopia-action";
import { getStagingFuneralCandidates, isStagingFuneralContentPreview } from "../../lib/sepelio-content";
import styles from "./sepelio.module.css";

export const dynamic = "force-dynamic";

export default async function SepelioPage() {
  const [publishedPage, contacts, faqs] = await Promise.all([getPublishedSitePage("sepelio"), getPublicContacts("funeral"), getPublishedFuneralFaqs()]);
  const content = publishedPage ?? servicePages.sepelio;
  const guard = resolveFuneralGuard(contacts);
  const candidates = isStagingFuneralContentPreview() ? getStagingFuneralCandidates() : [];

  return <><Header /><main className={styles.page}>
    <section className={styles.hero} aria-labelledby="sepelio-title">
      <Image className={styles.heroImage} src="/images/sarmiento-community.png" alt="Comunidad de Sarmiento" fill priority sizes="100vw" />
      <div className={styles.heroShade} />
      <div className={`${styles.heroInner} ${styles.container}`}>
        <div className={styles.heroContent}><p className={styles.eyebrow}>{content.eyebrow}</p><h1 id="sepelio-title">{content.title}</h1><p>{content.intro}</p><div className={styles.heroActions}><a className={`${styles.primaryAction} public-action-button`} href={guard.href}>{guard.isPublished ? "Llamar a guardia" : "Ver canales de atención"} <span className="public-action-arrow" aria-hidden="true">→</span></a><a className={`${styles.secondaryAction} public-action-button`} href="#informacion">Conocer el servicio <span className="public-action-arrow" aria-hidden="true">→</span></a></div></div>
        <aside className={styles.emergencyCard} aria-label="Atención urgente"><span className={styles.emergencyIcon} aria-hidden="true">✦</span><p>Si necesitás el servicio ahora</p><strong>{guard.label}</strong><span>{guard.isPublished ? "Canal publicado de atención." : "Canal pendiente de confirmación."}</span></aside>
      </div>
    </section>
    <section id="informacion" className={`${styles.section} ${styles.container}`} aria-labelledby="sepelio-needs-title"><div className={styles.heading}><p className={styles.eyebrow}>Servicio de sepelio</p><h2 id="sepelio-needs-title">Atención y gestiones en un solo lugar</h2></div><div className={styles.needsGrid}>
      <a className={`${styles.need} ${styles.urgentNeed} public-action-card public-action-card--primary`} href={guard.href}><span className={styles.needIcon} aria-hidden="true">☎</span><strong>Necesito el servicio ahora</strong><small>Accedé al canal de guardia publicado.</small><b className={styles.needArrow} aria-hidden="true">→</b></a>
      <Link className={`${styles.need} public-action-card public-action-card--primary`} href="/sepelio/actualizar-grupo-familiar"><span className={styles.needIcon} aria-hidden="true">◌</span><strong>Actualizar grupo familiar</strong><small>Iniciá una solicitud privada para revisión.</small><b className={styles.needArrow} aria-hidden="true">→</b></Link>
      <SepelioCoopiaAction className={`${styles.need} public-action-card public-action-card--primary`} prompt="Quiero información sobre el servicio de sepelio."><span className={styles.needIcon} aria-hidden="true">?</span>Consultar el servicio<span className={styles.needDescription}>COOPIA te guía con información oficial publicada.</span><span className={styles.needArrow} aria-hidden="true">→</span></SepelioCoopiaAction>
    </div></section>
    {candidates.length > 0 && <section className={`${styles.review} ${styles.container}`} aria-labelledby="sepelio-review-title"><div className={styles.heading}><p className={styles.eyebrow}>Información en revisión</p><h2 id="sepelio-review-title">El servicio, en una mirada</h2><p>Estamos actualizando esta información antes de su publicación definitiva.</p></div><div className={styles.reviewCards}>{candidates.map((candidate) => <article key={candidate.title}><h3>{candidate.title}</h3><p>{candidate.body}</p></article>)}</div></section>}
    <section className={`${styles.familyCallout} ${styles.container}`} aria-labelledby="sepelio-family-title"><div><p className={styles.eyebrow}>Grupo familiar</p><h2 id="sepelio-family-title">Mantené tus datos al día</h2><p>Informá los integrantes que necesitás que COOPSAR revise. El equipo valida la solicitud antes de realizar cualquier modificación.</p></div><Link className={`${styles.primaryAction} public-action-button`} href="/sepelio/actualizar-grupo-familiar">Actualizar grupo familiar <span className="public-action-arrow" aria-hidden="true">→</span></Link></section>
    {faqs.length > 0 && <section className={`${styles.faq} ${styles.container}`} aria-labelledby="sepelio-faq-title"><div className={styles.heading}><p className={styles.eyebrow}>Preguntas frecuentes</p><h2 id="sepelio-faq-title">Información para acompañarte</h2></div><div className={styles.faqList}>{faqs.map((faq) => <details key={`${faq.category}-${faq.question}`}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></section>}
    <section className={`${styles.closing} ${styles.container}`} aria-label="Canales de atención"><div><h2>¿Necesitás orientación?</h2><p>Para una urgencia, usá la guardia. Para una consulta, abrí COOPIA.</p></div><div className={styles.closingActions}><a className={`${styles.primaryAction} public-action-button`} href={guard.href}>Llamar a guardia <span className="public-action-arrow" aria-hidden="true">→</span></a><SepelioCoopiaAction className={`${styles.secondaryAction} public-action-button`} prompt="Necesito orientación sobre el servicio de sepelio.">Abrir COOPIA</SepelioCoopiaAction></div></section>
  </main><Footer /></>;
}
