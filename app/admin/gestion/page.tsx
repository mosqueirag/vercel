import Link from "next/link";
import { requireNewsAdmin } from "../../../lib/admin-auth";
import { getAdminSitePages } from "../../../lib/data/site-pages";

export const dynamic = "force-dynamic";
type CountQuery = { eq: (column: string, value: string | boolean) => CountQuery; then: PromiseLike<{ count: number | null; error: { code?: string } | null }>["then"] };
async function count(table: string, filters: Array<[string, string | boolean]> = []) {
  const session = await requireNewsAdmin(); if (!session) return null;
  let query = session.admin.from(table).select("id", { count: "exact", head: true }) as unknown as CountQuery;
  for (const [column, value] of filters) query = query.eq(column, value);
  const { count: result, error } = await query; return error ? null : result ?? 0;
}
export default async function ManagementHome() {
  const [pages, publishedNews, draftNews, publishedPlans, draftPlans, requests, fiberLeads, contacts, alerts] = await Promise.all([
    getAdminSitePages(), count("news_articles", [["status", "published"]]), count("news_articles", [["status", "draft"]]), count("internet_plans", [["status", "published"]]), count("internet_plans", [["status", "draft"]]), count("internet_requests"), count("internet_requests", [["request_type", "fiber_waitlist"]]), count("public_contact_channels", [["status", "published"]]), count("service_alerts", [["published", true]]),
  ]);
  const metrics = [{ label: "Páginas administrables", value: pages.length, href: "/admin/gestion/paginas" }, { label: "Noticias publicadas", value: publishedNews, href: "/admin/noticias" }, { label: "Noticias borrador", value: draftNews, href: "/admin/noticias" }, { label: "Planes publicados", value: publishedPlans, href: "/admin/internet/planes" }, { label: "Planes borrador", value: draftPlans, href: "/admin/internet/planes" }, { label: "Solicitudes comerciales", value: requests, href: "/admin/comercial" }, { label: "Interesados en fibra", value: fiberLeads, href: "/admin/comercial" }, { label: "Contactos publicados", value: contacts, href: "/admin/configuracion/contactos" }, { label: "Alertas activas", value: alerts, href: "/admin/alertas" }];
  return <section className="admin-page"><header className="admin-page-header"><div><span className="eyebrow">Administración</span><h1>Centro de Gestión COOPSAR</h1><p>Contenido, servicios, atención y solicitudes en un único lugar.</p></div></header><div className="admin-quick-actions"><Link className="primary" href="/admin/noticias">Nueva noticia</Link><Link href="/admin/internet/planes">Nuevo plan</Link><Link href="/admin/gestion/paginas">Editar página</Link><Link href="/admin/comercial">Ver solicitudes</Link><Link href="/admin/configuracion/contactos">Editar contactos</Link></div><section className="admin-metrics">{metrics.map((metric) => <Link href={metric.href} key={metric.label}><small>{metric.label}</small><strong>{metric.value === null ? "Sin datos" : metric.value}</strong></Link>)}</section><section className="admin-card"><h2>Actividad reciente</h2><p>No se muestra actividad artificial. Usá los módulos para ver información actualizada desde las fuentes oficiales.</p></section></section>;
}
