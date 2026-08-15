"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CONTACT } from "../lib/coopsar-data";
import type { NewsArticle } from "../lib/news";

const menuGroups = [
  { id: "servicios", label: "Servicios", description: "Servicios esenciales para hogares, comercios y empresas.", image: "/images/coopsar-energy.png", links: [["Energía eléctrica", "/energia"], ["Simulador de consumo", "/simulador-energia"], ["Internet", "/internet"], ["Fibra óptica", "/fibra-optica"], ["Telefonía", "/telefonia"], ["Sepelio", "/sepelio"]] },
  { id: "gestiones", label: "Trámites y ayuda", description: "Resolvé gestiones y encontrá información operativa.", image: "/images/coopsar-service-office.png", links: [["Todos los trámites", "/tramites"], ["Medios de pago", "/medios-de-pago"], ["Cortes programados", "/cortes-programados"], ["Centro de ayuda", "/centro-de-ayuda"]] },
  { id: "coopsar", label: "COOPSAR", description: "Conocé la cooperativa y nuestros canales de atención.", image: "/images/sarmiento-community.png", links: [["Institucional", "/institucional"], ["Contacto", "/contacto"], ["Privacidad", "/privacidad"]] },
] as const;

export function Brand() {
  return <Link className="brand" href="/" aria-label="COOPSAR, inicio"><Image className="brand-logo" src="/logo-coopsar.svg" alt="COOPSAR" width={337} height={60} priority /></Link>;
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const selectedGroup = menuGroups.find((group) => group.id === activeMenu);
  const groupIsActive = (group: (typeof menuGroups)[number]) => group.links.some(([, href]) => pathname.startsWith(href));

  return <>
    <aside className="institutional-strip"><strong>COOPSAR INFORMA</strong><span>Gestioná tus servicios, facturas y consultas desde nuestros canales digitales.</span><Link href="/#asistente">Consultar ahora →</Link></aside>
    <div className="header-shell" onMouseLeave={() => setActiveMenu(null)} onKeyDown={(event) => { if (event.key === "Escape") setActiveMenu(null); }}>
      <header className="site-header">
        <Brand />
        <nav className="desktop-nav" aria-label="Navegación principal">
          <Link href="/#asistente">Asistente</Link>
          {menuGroups.slice(0, 2).map((group) => <button type="button" key={group.id} className={activeMenu === group.id || groupIsActive(group) ? "active" : ""} aria-expanded={activeMenu === group.id} aria-controls={`submenu-${group.id}`} onMouseEnter={() => setActiveMenu(group.id)} onClick={() => setActiveMenu(group.id)}>{group.label}<span>⌄</span></button>)}
          <Link className={pathname.startsWith("/noticias") ? "active" : ""} href="/noticias">Noticias</Link>
          {menuGroups.slice(2).map((group) => <button type="button" key={group.id} className={activeMenu === group.id || groupIsActive(group) ? "active" : ""} aria-expanded={activeMenu === group.id} aria-controls={`submenu-${group.id}`} onMouseEnter={() => setActiveMenu(group.id)} onClick={() => setActiveMenu(group.id)}>{group.label}<span>⌄</span></button>)}
        </nav>
        <a className="button button-dark header-action" href={CONTACT.virtualOffice} target="_blank" rel="noreferrer">Oficina virtual <span>→</span></a>
        <button className="menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label="Abrir menú"><i /><i /><i /></button>
      </header>
      {selectedGroup && <>
        <div className="mega-backdrop" onClick={() => setActiveMenu(null)} />
        <section className="mega-menu" id={`submenu-${selectedGroup.id}`} aria-label={selectedGroup.label}>
          <div className="mega-intro"><span className="mega-icon">{selectedGroup.label.charAt(0)}</span><h2>{selectedGroup.label}</h2><p>{selectedGroup.description}</p><Link href={selectedGroup.links[0][1]} onClick={() => setActiveMenu(null)}>Ver sección →</Link></div>
          <nav aria-label={`Opciones de ${selectedGroup.label}`}>{selectedGroup.links.map(([label, href]) => <Link key={href} href={href} onClick={() => setActiveMenu(null)}>{label}<span>↗</span></Link>)}</nav>
          <Link className="mega-promo" href={selectedGroup.links[0][1]} onClick={() => setActiveMenu(null)}><Image src={selectedGroup.image} alt="" fill sizes="260px" /><span><small>Acceso destacado</small><strong>{selectedGroup.links[0][0]}</strong><b>Explorar →</b></span></Link>
        </section>
      </>}
    </div>
    {mobileOpen && <div className="menu-backdrop" onClick={() => setMobileOpen(false)} />}
    <nav id="mobile-menu" className={mobileOpen ? "mobile-nav open" : "mobile-nav"} aria-label="Navegación móvil">
      <div><Brand /><button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">×</button></div>
      <Link href="/" onClick={() => setMobileOpen(false)}>Inicio <span>→</span></Link>
      <Link href="/#asistente" onClick={() => setMobileOpen(false)}>Asistente <span>→</span></Link>
      {menuGroups.map((group) => <details key={group.id}><summary>{group.label}<span>＋</span></summary>{group.links.map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)}>{label}<span>→</span></Link>)}</details>)}
      <Link href="/noticias" onClick={() => setMobileOpen(false)}>Noticias <span>→</span></Link>
      <a className="button button-dark" href={CONTACT.virtualOffice}>Oficina Virtual →</a>
    </nav>
  </>;
}

export function NewsCards({ items }: { items: NewsArticle[] }) {
  return <div className="news-grid">{items.map((item, index) => <article className={`news-card news-card-${index + 1}`} key={item.id}>{item.imageUrl ? <div className="news-art news-photo"><Image src={item.imageUrl} alt="" fill sizes="(max-width: 800px) 100vw, 33vw" /></div> : <div className="news-art" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></div>}<div className="news-copy"><small>{item.date} · {item.category}</small><h3>{item.title}</h3><p>{item.excerpt}</p><Link className="text-link" href={`/noticias/${item.slug}`}>Leer noticia ↗</Link></div></article>)}</div>;
}

export function Contact() {
  return <section className="contact-band"><div><span className="eyebrow eyebrow-dark">Atención cercana</span><h2>Estamos para<br />acompañarte.</h2></div><a className="contact-item" href={`https://wa.me/${CONTACT.whatsapp}`}><span className="contact-icon">W</span><span><small>WhatsApp comercial</small><strong>{CONTACT.whatsappDisplay}</strong></span><b>↗</b></a><a className="contact-item" href="tel:+542974364961"><span className="contact-icon">24</span><span><small>Guardia de energía</small><strong>{CONTACT.energyGuard}</strong></span><b>↗</b></a></section>;
}

export function Footer() {
  return <footer className="site-footer"><div className="footer-lead"><Brand /><p>Cooperativa de Provisión de Servicios Públicos de Sarmiento Ltda.</p></div><div><b>Servicios</b><Link href="/energia">Energía</Link><Link href="/internet">Internet y fibra</Link><Link href="/telefonia">Telefonía</Link><Link href="/sepelio">Sepelio</Link></div><div><b>Ayuda</b><Link href="/centro-de-ayuda">Centro de ayuda</Link><Link href="/tramites">Trámites</Link><Link href="/cortes-programados">Estado de servicios</Link><Link href="/privacidad">Privacidad</Link></div><div><b>Atención</b><p>{CONTACT.hours}</p><p>{CONTACT.office}</p></div><div className="footer-bottom"><small>© 2026 COOPSAR</small><small>Servicios esenciales, compromiso local.</small></div></footer>;
}
