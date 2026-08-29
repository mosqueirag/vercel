import Link from "next/link";
import { requireNewsAdmin } from "../../../lib/admin-auth";
import { getAdminSitePages } from "../../../lib/data/site-pages";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";
type CountQuery = { eq: (column: string, value: string | boolean) => CountQuery; then: PromiseLike<{ count: number | null; error: { code?: string } | null }>["then"] };
async function count(table: string, filters: Array<[string, string | boolean]> = []) {
  const session = await requireNewsAdmin(); if (!session) return null;
  let query = session.admin.from(table).select("id", { count: "exact", head: true }) as unknown as CountQuery;
  for (const [column, value] of filters) query = query.eq(column, value);
  const { count: result, error } = await query; return error ? null : result ?? 0;
}
export default async function ManagementHome() {
  const [pages, publishedNews, draftNews, publishedPlans, draftPlans, requests, fiberLeads, contacts, alerts, funeralNew, funeralReview] = await Promise.all([
    getAdminSitePages(), count("news_articles", [["status", "published"]]), count("news_articles", [["status", "draft"]]), count("internet_plans", [["status", "published"]]), count("internet_plans", [["status", "draft"]]), count("internet_requests"), count("internet_requests", [["request_type", "fiber_waitlist"]]), count("public_contact_channels", [["status", "published"]]), count("service_alerts", [["published", true]]), count("funeral_family_update_requests", [["status", "new"]]), count("funeral_family_update_requests", [["status", "in_review"]]),
  ]);
  const attention = [
    { value: funeralNew, label: "solicitudes nuevas de Sepelio", href: "/admin/sepelio/planillas" },
    { value: requests, label: "solicitudes comerciales", href: "/admin/comercial" },
    { value: draftPlans, label: "planes en borrador", href: "/admin/internet/planes" },
    { value: draftNews, label: "noticias en borrador", href: "/admin/noticias" },
  ].filter((item) => item.value !== null && item.value > 0);
  const value = (item: number | null) => item === null ? "Sin datos" : item;
  return <section className={styles.page}><header className={styles.pageHeader}><div><p className={styles.eyebrow}>Centro de Gestión</p><h1>Lo importante del portal, en un solo lugar.</h1><p>Priorizá tareas, contenidos y solicitudes desde fuentes operativas reales.</p></div></header>
    {attention.length > 0 && <section className={styles.attention} aria-labelledby="attention-title"><div className={styles.attentionHeader}><h2 id="attention-title">Atención requerida</h2></div><div className={styles.attentionList}>{attention.map((item) => <Link className={styles.attentionItem} href={item.href} key={item.label}><div><strong>{item.value} {item.label}</strong><small>Requiere revisión operativa.</small></div><span>→</span></Link>)}</div></section>}
    <h2 className={styles.sectionTitle}>Accesos principales</h2><nav className={styles.quickActions} aria-label="Accesos principales"><Link className={styles.quickAction} href="/admin/noticias">Nueva noticia <span>→</span></Link><Link className={styles.quickAction} href="/admin/internet/planes">Gestionar Internet <span>→</span></Link><Link className={styles.quickAction} href="/admin/sepelio/planillas">Solicitudes de Sepelio <span>→</span></Link><Link className={styles.quickAction} href="/admin/comercial">Ver solicitudes <span>→</span></Link><Link className={styles.quickAction} href="/admin/coopia">Resumen COOPIA <span>→</span></Link></nav>
    <h2 className={styles.sectionTitle}>Resumen por módulo</h2><section className={styles.moduleGrid}>
      <article className={styles.module}><h2>Sepelio</h2><p>Solicitudes privadas y documentación bajo acceso administrativo.</p><div className={styles.moduleStats}><span><strong>{value(funeralNew)}</strong>Nuevas</span><span><strong>{value(funeralReview)}</strong>En revisión</span></div><Link className={styles.moduleLink} href="/admin/sepelio/planillas">Gestionar solicitudes →</Link></article>
      <article className={styles.module}><h2>Internet</h2><p>Oferta comercial y solicitudes recibidas.</p><div className={styles.moduleStats}><span><strong>{value(draftPlans)}</strong>Planes borrador</span><span><strong>{value(publishedPlans)}</strong>Publicados</span></div><Link className={styles.moduleLink} href="/admin/internet/planes">Gestionar planes →</Link></article>
      <article className={styles.module}><h2>Noticias</h2><p>Información institucional administrable.</p><div className={styles.moduleStats}><span><strong>{value(draftNews)}</strong>Borradores</span><span><strong>{value(publishedNews)}</strong>Publicadas</span></div><Link className={styles.moduleLink} href="/admin/noticias">Gestionar noticias →</Link></article>
      <article className={styles.module}><h2>Comercial y canales</h2><p>Solicitudes, interesados y contactos publicados.</p><div className={styles.moduleStats}><span><strong>{value(requests)}</strong>Solicitudes</span><span><strong>{value(fiberLeads)}</strong>Interesados fibra</span><span><strong>{value(contacts)}</strong>Canales publicados</span><span><strong>{value(alerts)}</strong>Alertas activas</span><span><strong>{pages.length}</strong>Páginas</span></div><Link className={styles.moduleLink} href="/admin/comercial">Ver gestión comercial →</Link></article>
    </section>
  </section>;
}
