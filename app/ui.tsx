import Link from "next/link";

export const news = [
  {
    slug: "mantenimiento-infraestructura-electrica",
    category: "ENERGÍA",
    date: "1 JUL 2026",
    title: "Mantenimiento y mejoras en la infraestructura eléctrica",
    excerpt: "Continúan los trabajos preventivos y las mejoras de capacidad en distintos sectores de Sarmiento.",
    body: [
      "COOPSAR continúa ejecutando tareas preventivas y mejoras sobre la red de distribución eléctrica.",
      "Los trabajos permiten renovar componentes, mejorar la capacidad de transformación y reforzar la calidad del servicio.",
      "Cuando una intervención requiera interrumpir el suministro, la información oficial indicará fecha, horario y zonas alcanzadas.",
    ],
  },
  {
    slug: "fibra-optica-nuevas-zonas",
    category: "FIBRA ÓPTICA",
    date: "9 JUL 2026",
    title: "La fibra óptica continúa llegando a nuevas zonas",
    excerpt: "La red FTTH de COOPSAR sigue ampliándose para ofrecer mayor velocidad, estabilidad y capacidad.",
    body: [
      "La expansión de la fibra óptica representa una inversión estratégica para Sarmiento.",
      "La tecnología FTTH lleva la fibra directamente hasta el hogar o comercio.",
      "La contratación está sujeta a disponibilidad técnica.",
    ],
  },
  {
    slug: "servicio-solidario-sepelios",
    category: "SERVICIO SOLIDARIO",
    date: "13 JUN 2026",
    title: "El Servicio Solidario acompaña a las familias",
    excerpt: "Un servicio cooperativo creado para brindar asistencia y contención cuando más se necesita.",
    body: [
      "El Servicio Solidario forma parte del acompañamiento comunitario de COOPSAR.",
      "Es importante mantener actualizada la planilla del grupo familiar.",
      "Guardia: 297 624-1614 / 297 624-1615.",
    ],
  },
];

const navigation = [
  ["Energía", "/energia"],
  ["Internet y telefonía", "/internet-telefonia"],
  ["Fibra óptica", "/fibra-optica"],
  ["Servicio solidario", "/sepelio"],
  ["Noticias", "/noticias"],
];

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="COOPSAR, inicio">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      <span className="brand-name">COOP<strong>SAR</strong><small>Servicios públicos</small></span>
    </Link>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <Brand />
      <nav className="desktop-nav" aria-label="Navegación principal">
        {navigation.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <a className="button button-dark header-action" href="https://www.cooponlineweb.com.ar/SARMIENTO/Login" target="_blank" rel="noreferrer">
        Oficina virtual <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}

export function NewsCards() {
  return (
    <div className="news-grid">
      {news.map((item, index) => (
        <article className={`news-card news-card-${index + 1}`} key={item.slug}>
          <div className="news-art" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></div>
          <div className="news-copy">
            <small>{item.date} · {item.category}</small>
            <h3>{item.title}</h3>
            <p>{item.excerpt}</p>
            <Link className="text-link" href={`/noticias/${item.slug}`}>Leer noticia <span aria-hidden="true">↗</span></Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function Contact() {
  return (
    <section className="contact-band" aria-labelledby="contact-title">
      <div>
        <span className="eyebrow eyebrow-dark">Atención cercana</span>
        <h2 id="contact-title">Estamos para<br />acompañarte.</h2>
      </div>
      <a className="contact-item" href="https://wa.me/5492975376656">
        <span className="contact-icon" aria-hidden="true">W</span>
        <span><small>WhatsApp comercial</small><strong>+54 9 2975 37-6656</strong></span>
        <b aria-hidden="true">↗</b>
      </a>
      <a className="contact-item" href="tel:+542974364961">
        <span className="contact-icon" aria-hidden="true">24</span>
        <span><small>Guardia de energía</small><strong>297 436-4961</strong></span>
        <b aria-hidden="true">↗</b>
      </a>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-lead"><Brand /><p>Cooperativa de Provisión de Servicios Públicos de Sarmiento Ltda.</p></div>
      <div><b>Servicios</b><Link href="/energia">Energía</Link><Link href="/internet-telefonia">Internet y telefonía</Link><Link href="/fibra-optica">Fibra óptica</Link><Link href="/sepelio">Servicio solidario</Link></div>
      <div><b>COOPSAR</b><Link href="/institucional">Institucional</Link><Link href="/estado-servicios">Estado de servicios</Link><Link href="/noticias">Noticias</Link><Link href="/contacto">Contacto</Link></div>
      <div><b>Atención</b><p>Lunes a viernes<br />8:00 a 15:00</p><p>Roca 663<br />Sarmiento, Chubut</p></div>
      <div className="footer-bottom"><small>© 2026 COOPSAR</small><small>Servicios esenciales, compromiso local.</small></div>
    </footer>
  );
}
