"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./admin.module.css";

type NavigationItem = { label: string; href: string };
export const adminNavigationGroups: Array<{ title?: string; items: NavigationItem[] }> = [
  { title: "Inicio", items: [{ label: "Resumen", href: "/admin/gestion" }] },
  { title: "Contenidos", items: [{ label: "Páginas", href: "/admin/gestion/paginas" }, { label: "Noticias", href: "/admin/noticias" }, { label: "Curaduría IA", href: "/admin/contenidos" }, { label: "Alertas", href: "/admin/alertas" }] },
  { title: "Servicios", items: [{ label: "Internet", href: "/admin/internet/planes" }, { label: "Cobertura", href: "/admin/internet/cobertura" }, { label: "Sepelio", href: "/admin/sepelio/planillas" }, { label: "Contactos y guardias", href: "/admin/configuracion/contactos" }] },
  { title: "Comercial", items: [{ label: "Solicitudes", href: "/admin/comercial" }, { label: "Leads / interesados", href: "/admin/solicitudes-internet" }] },
  { title: "COOPIA", items: [{ label: "Resumen", href: "/admin/coopia" }, { label: "Consultas", href: "/admin/consultas" }] },
];

export function AdminNavigation({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  const isActive = (href: string) => pathname === href || (href !== "/admin/gestion" && pathname.startsWith(`${href}/`));
  return <>
    {open && <button className={styles.drawerBackdrop} type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
    <header className={styles.topbar}><button className={styles.menuButton} type="button" aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(true)}>Menú</button><span className={styles.topbarTitle}>Centro de Gestión</span><div className={styles.topbarMeta}><Link href="/" target="_blank">Ver sitio ↗</Link><span className={styles.user} title="Sesión administrativa">{email.trim().charAt(0).toUpperCase() || "A"}</span></div></header>
    <aside id="admin-navigation" className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`} aria-label="Navegación administrativa">
      <Link className={styles.brand} href="/admin/gestion" onClick={() => setOpen(false)}><strong>COOPSAR</strong><small>Centro de Gestión</small></Link>
      <nav className={styles.navScroll} aria-label="Secciones administrativas">{adminNavigationGroups.map((group) => <section key={group.title} className={styles.navGroup}><h2 className={styles.groupTitle}>{group.title}</h2>{group.items.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={isActive(item.href) ? "page" : undefined} className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`}>{item.label}</Link>)}</section>)}</nav>
      <div className={styles.sidebarFooter}><small title={email}>Sesión administrativa</small><Link href="/" target="_blank">Ver sitio ↗</Link><form action="/api/admin/logout" method="post"><button type="submit">Cerrar sesión</button></form></div>
    </aside>
  </>;
}
