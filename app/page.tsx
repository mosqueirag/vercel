"use client";

import Link from "next/link";
import { useState } from "react";
import { Contact, Footer, Header, NewsCards } from "./ui";

const quickActions = [
  { number: "01", icon: "$", title: "Pagar mi factura", description: "Consultá deuda y medios de pago disponibles.", href: "/facturas-pagos" },
  { number: "02", icon: "□", title: "Oficina virtual", description: "Gestioná tus servicios en cualquier momento.", href: "https://www.cooponlineweb.com.ar/SARMIENTO/Login" },
  { number: "03", icon: "!", title: "Falta de energía", description: "Accedé rápido al canal de guardia eléctrica.", href: "/energia" },
  { number: "04", icon: "~", title: "Internet y telefonía", description: "Planes, soporte y gestiones de conectividad.", href: "/internet-telefonia" },
  { number: "05", icon: "↻", title: "Débito automático", description: "Adherí tus facturas y simplificá los pagos.", href: "/facturas-pagos" },
  { number: "06", icon: "+", title: "Nuevo suministro", description: "Conocé los requisitos para iniciar el trámite.", href: "/tramites" },
];

const answers: Record<string, string> = {
  "Pagar una factura": "Podés consultar y pagar tus facturas desde la Oficina Virtual. También están disponibles Mercado Pago, Red Link, Pago Mis Cuentas, Pago Fácil y débito automático.",
  "Cambiar titularidad": "Necesitás acreditar identidad, domicilio y vínculo con el inmueble. Consultá la documentación exacta por WhatsApp antes de acercarte.",
  "Solicitar un servicio": "Reuní la documentación del titular y del inmueble. COOPSAR verificará la factibilidad técnica y te indicará los próximos pasos.",
  "Reportar un problema": "Energía: 297 436-4961. Internet y telefonía: 297 464-1110. Las guardias reciben reportes las 24 horas.",
};

export default function Home() {
  const [selected, setSelected] = useState("Pagar una factura");

  return (
    <main>
      <Header />
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-copy">
          <span className="eyebrow">Tu cooperativa, más cerca</span>
          <h1>Servicios simples.<br /><em>Comunidad conectada.</em></h1>
          <p>Todo lo que necesitás para gestionar tus servicios de COOPSAR, con información clara y atención local.</p>
          <div className="hero-actions">
            <a className="button button-lime" href="https://www.cooponlineweb.com.ar/SARMIENTO/Login" target="_blank" rel="noreferrer">Ingresar a Oficina Virtual <span>↗</span></a>
            <Link className="button button-ghost" href="/tramites">Ver todos los trámites</Link>
          </div>
          <div className="hero-metrics" aria-label="Información destacada">
            <div><strong>24 h</strong><small>Guardias activas</small></div>
            <div><strong>4</strong><small>Servicios esenciales</small></div>
            <div><strong>Local</strong><small>Atención en Sarmiento</small></div>
          </div>
        </div>
        <div className="assistant-card">
          <div className="assistant-head">
            <span className="assistant-avatar" aria-hidden="true">✦</span>
            <div><small>COOPIA · ASISTENTE DIGITAL</small><strong>¿En qué podemos ayudarte?</strong></div>
            <i aria-label="Disponible" title="Disponible" />
          </div>
          <div className="assistant-body">
            <p className="assistant-intro">Elegí una opción y te orientamos para que llegues al canal correcto.</p>
            <div className="assistant-options">
              {Object.keys(answers).map((question) => (
                <button className={selected === question ? "active" : ""} key={question} onClick={() => setSelected(question)}>
                  {question}<span aria-hidden="true">→</span>
                </button>
              ))}
            </div>
            <div className="assistant-answer" aria-live="polite"><span aria-hidden="true">✦</span><p>{answers[selected]}</p></div>
            <a className="assistant-contact" href="https://wa.me/5492975376656">Continuar por WhatsApp <span aria-hidden="true">↗</span></a>
            <small className="privacy">No compartas contraseñas ni datos bancarios.</small>
          </div>
        </div>
      </section>

      <section className="service-alert">
        <span><i aria-hidden="true" /> Estado de los servicios</span>
        <p>Consultá cortes programados, mantenimientos y novedades operativas.</p>
        <Link href="/estado-servicios">Ver información actualizada <span aria-hidden="true">→</span></Link>
      </section>

      <section className="section quick-section">
        <div className="section-heading"><div><span className="eyebrow">Gestiones online</span><h2>¿Qué necesitás hacer?</h2></div><p>Accesos directos para resolver las consultas y gestiones más frecuentes.</p></div>
        <div className="quick-grid">
          {quickActions.map((action) => (
            <Link className="quick-card" href={action.href} key={action.number}>
              <small>{action.number}</small><span className="quick-icon" aria-hidden="true">{action.icon}</span>
              <h3>{action.title}</h3><p>{action.description}</p><b>Comenzar <span aria-hidden="true">↗</span></b>
            </Link>
          ))}
        </div>
      </section>

      <section className="office-feature">
        <div className="office-copy">
          <span className="eyebrow eyebrow-light">Tu cooperativa digital</span>
          <h2>Tu oficina,<br />abierta las 24 horas.</h2>
          <p>Consultá facturas, descargá comprobantes y realizá gestiones de manera simple y segura, desde donde estés.</p>
          <a className="button button-lime" href="https://www.cooponlineweb.com.ar/SARMIENTO/Login" target="_blank" rel="noreferrer">Ingresar ahora <span>↗</span></a>
        </div>
        <div className="phone-shell" aria-label="Vista previa de la Oficina Virtual">
          <div className="phone-top"><span>9:41</span><i /></div>
          <div className="phone-brand">COOP<strong>SAR</strong></div>
          <small>Hola, te damos la bienvenida</small>
          <h3>Mis servicios</h3>
          <div className="phone-service"><span>⚡</span><div><small>ENERGÍA</small><b>Cuenta 001284</b></div><i>Al día</i></div>
          <div className="phone-service"><span>⌁</span><div><small>INTERNET</small><b>Plan Hogar</b></div><i>Activo</i></div>
          <button>Ver mis facturas</button>
        </div>
      </section>

      <section className="section news-section">
        <div className="section-heading"><div><span className="eyebrow">Actualidad</span><h2>Noticias de COOPSAR</h2></div><Link className="text-link" href="/noticias">Ver todas las noticias <span>→</span></Link></div>
        <NewsCards />
      </section>
      <Contact />
      <Footer />
    </main>
  );
}
