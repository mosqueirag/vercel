"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavigationItem = { label: string; href: string };
const groups: Array<{ title?: string; items: NavigationItem[] }> = [
  { items: [{ label: "Inicio", href: "/admin/gestion" }] },
  { title: "Contenidos", items: [{ label: "Páginas", href: "/admin/gestion/paginas" }, { label: "Noticias", href: "/admin/noticias" }, { label: "Alertas de servicio", href: "/admin/alertas" }] },
  { title: "Servicios", items: [{ label: "Planes Internet/Fibra", href: "/admin/internet/planes" }, { label: "Cobertura", href: "/admin/internet/cobertura" }, { label: "Contactos y guardias", href: "/admin/configuracion/contactos" }] },
  { title: "Comercial", items: [{ label: "Solicitudes", href: "/admin/comercial" }, { label: "Leads / interesados", href: "/admin/solicitudes-internet" }] },
  { title: "COOPIA", items: [{ label: "Panel COOPIA", href: "/admin/coopia" }, { label: "Consultas", href: "/admin/consultas" }, { label: "Preguntas sin resolver", href: "/admin/consultas" }] },
  { title: "Configuración", items: [{ label: "Datos públicos", href: "/admin/configuracion/contactos" }, { label: "Administración", href: "/admin/gestion" }] },
];

export function AdminNavigation({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <>
    <button className="admin-menu-toggle" type="button" aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)}>Menú</button>
    <aside id="admin-navigation" className={`admin-sidebar ${open ? "is-open" : ""}`}>
      <Link className="admin-sidebar-brand" href="/admin/gestion"><span>COOPSAR</span><small>Centro de Gestión</small></Link>
      <nav aria-label="Administración">{groups.map((group) => <section key={group.title ?? "inicio"} className="admin-nav-group">{group.title && <h2>{group.title}</h2>}{group.items.map((item) => <Link key={`${item.label}-${item.href}`} href={item.href} onClick={() => setOpen(false)} className={pathname === item.href ? "active" : ""}>{item.label}</Link>)}</section>)}</nav>
      <div className="admin-sidebar-footer"><small>{email}</small><Link href="/" target="_blank">Ver sitio ↗</Link><form action="/api/admin/logout" method="post"><button type="submit">Cerrar sesión</button></form></div>
    </aside>
  </>;
}
