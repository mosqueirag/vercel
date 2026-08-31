"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTACT } from "../lib/coopsar-data";
import type { NewsArticle } from "../lib/news";
import { CoopOnlineDownloadLink } from "./components/coop-online-download-link";
import { usePublicContact } from "./components/public-contact-context";

const menuGroups = [
  { id: "servicios", label: "Servicios", description: "Servicios esenciales para hogares, comercios y empresas.", image: "/images/coopsar-energy.png", links: [["Energía eléctrica", "/energia"], ["Simulador de consumo", "/simulador-energia"], ["Internet", "/internet"], ["Telefonía", "/telefonia"], ["Sepelio", "/sepelio"]] },
  { id: "gestiones", label: "Trámites y ayuda", description: "Resolvé gestiones y encontrá información operativa.", image: "/images/coopsar-service-office.png", links: [["Todos los trámites", "/tramites"], ["Medios de pago", "/medios-de-pago"], ["Cortes programados", "/cortes-programados"], ["Centro de ayuda", "/centro-de-ayuda"]] },
  { id: "coopsar", label: "COOPSAR", description: "Conocé la cooperativa y nuestros canales de atención.", image: "/images/sarmiento-community.png", links: [["Institucional", "/institucional"], ["Contacto", "/contacto"], ["Privacidad", "/privacidad"]] },
] as const;

export function Brand() {
  return <Link className="brand" href="/" aria-label="COOPSAR, inicio"><Image className="brand-logo" src="/logo-coopsar.svg" alt="COOPSAR" width={337} height={60} priority /></Link>;
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const officialVirtualOffice = usePublicContact("billing", "virtual_office")?.value;
  const virtualOffice = officialVirtualOffice || CONTACT.virtualOffice;
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
          <button type="button" className="site-search-trigger" onClick={() => { setActiveMenu(null); setSearchOpen(true); }} aria-label="Buscar en todo el sitio"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg></button>
        </nav>
        <a className="button button-dark header-action" href={virtualOffice} target="_blank" rel="noreferrer">Oficina virtual <span>→</span></a>
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
      <button className="mobile-search-trigger" onClick={() => { setMobileOpen(false); setSearchOpen(true); }}>Buscar en el sitio <span>⌕</span></button>
      <a className="button button-dark" href={virtualOffice}>Oficina Virtual →</a>
    </nav>
    {searchOpen && <SiteSearch onClose={() => setSearchOpen(false)} />}
  </>;
}

type SearchResult = { title: string; description: string; href: string; type: string };

function SiteSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try { const response = await fetch(`/api/site-search?q=${encodeURIComponent(query)}`, { signal: controller.signal }); const data = await response.json() as { results: SearchResult[] }; setResults(data.results); }
      catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  return <div className="site-search-overlay" role="dialog" aria-modal="true" aria-labelledby="site-search-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="site-search-panel"><header><div><span className="eyebrow">Buscador integral</span><h2 id="site-search-title">¿Qué necesitás encontrar?</h2></div><button onClick={onClose} aria-label="Cerrar buscador">×</button></header><label><span aria-hidden="true">⌕</span><input ref={inputRef} value={query} onChange={(event) => { const value = event.target.value; setQuery(value); if (value.trim().length < 2) { setResults([]); setLoading(false); } }} placeholder="Buscá servicios, trámites, ayuda o noticias…" maxLength={80} /><kbd>ESC</kbd></label><div className="site-search-results" aria-live="polite">{query.trim().length < 2 ? <div className="site-search-empty"><strong>Buscá en todo COOPSAR</strong><p>Escribí al menos dos letras. Por ejemplo: factura, fibra, corte o titularidad.</p></div> : loading ? <div className="site-search-empty"><strong>Buscando…</strong></div> : results.length ? results.map((result) => <Link key={result.href} href={result.href} onClick={onClose}><small>{result.type}</small><strong>{result.title}</strong><p>{result.description}</p><span>→</span></Link>) : <div className="site-search-empty"><strong>No encontramos resultados</strong><p>Probá con otras palabras o consultale a COOPIA.</p><Link href="/#asistente" onClick={onClose}>Ir al asistente →</Link></div>}</div></section></div>;
}

export function NewsCards({ items }: { items: NewsArticle[] }) {
  return <div className="featured-news-grid">{items.map((item, index) => <article key={item.id}>{item.imageUrl ? <div className="news-card-image"><Image src={item.imageUrl} alt="" fill sizes="(max-width: 680px) 100vw, 33vw" priority={index === 0} /></div> : <div className="news-card-image news-card-fallback" aria-hidden="true"><span>COOPSAR</span><small>{item.category}</small></div>}<div className="featured-news-copy"><small>{item.date} · {item.category}</small><h3>{item.title}</h3><p>{item.excerpt}</p><Link href={`/noticias/${item.slug}`}>Leer noticia <span>↗</span></Link></div></article>)}</div>;
}

export function Contact() {
  const officialWhatsApp = usePublicContact("general", "general_contact")?.value;
  const officialEnergyGuard = usePublicContact("energy", "emergency")?.value;
  const whatsapp = officialWhatsApp || CONTACT.whatsapp;
  const energyGuard = officialEnergyGuard || CONTACT.energyGuard;
  return <section className="contact-band"><div><span className="eyebrow eyebrow-dark">Atención cercana</span><h2>Estamos para<br />acompañarte.</h2></div><a className="contact-item" href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}><span className="contact-icon">W</span><span><small>WhatsApp comercial</small><strong>{officialWhatsApp || CONTACT.whatsappDisplay}</strong></span><b>↗</b></a><a className="contact-item" href={`tel:${energyGuard.replace(/[^\d+]/g, "")}`}><span className="contact-icon">24</span><span><small>Guardia de energía</small><strong>{energyGuard}</strong></span><b>↗</b></a><CoopOnlineDownloadLink className="contact-item contact-app" source="contact_app"><span className="contact-icon" aria-hidden="true">▣</span><span><small>App COOPSAR</small><strong>COOP Online</strong></span><b aria-hidden="true">→</b></CoopOnlineDownloadLink></section>;
}

export function Footer() {
  const officeHours = usePublicContact("general", "office_hours")?.value;
  const officeAddress = usePublicContact("general", "office_address")?.value;
  return <footer className="site-footer"><div className="footer-lead"><Brand /><p>Cooperativa de Provisión de Servicios Públicos de Sarmiento Ltda.</p></div><div><b>Servicios</b><Link href="/energia">Energía</Link><Link href="/internet">Internet</Link><Link href="/telefonia">Telefonía</Link><Link href="/sepelio">Sepelio</Link></div><div><b>Ayuda</b><Link href="/centro-de-ayuda">Centro de ayuda</Link><Link href="/tramites">Trámites</Link><Link href="/cortes-programados">Estado de servicios</Link><Link href="/privacidad">Privacidad</Link></div><div><b>Atención</b><p>{officeHours || "Horario de atención no publicado."}</p><p>{officeAddress || CONTACT.office}</p></div><div className="footer-bottom"><small>© 2026 COOPSAR</small><small>Servicios esenciales, compromiso local.</small></div></footer>;
}
