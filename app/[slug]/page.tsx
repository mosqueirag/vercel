import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { servicePages } from "../../lib/service-pages";
import { Contact, Footer, Header } from "../ui";

const serviceImages: Record<string, { src: string; alt: string }> = {
  energia: { src: "/images/coopsar-energy.png", alt: "Trabajo técnico sobre la red eléctrica en el entorno patagónico" },
  "cortes-programados": { src: "/images/coopsar-energy.png", alt: "Infraestructura eléctrica y equipo técnico" },
  internet: { src: "/images/coopsar-connectivity.png", alt: "Instalación de fibra óptica en un hogar" },
  "fibra-optica": { src: "/images/coopsar-connectivity.png", alt: "Técnico instalando conectividad de fibra óptica" },
  telefonia: { src: "/images/coopsar-connectivity.png", alt: "Conectividad para hogares de Sarmiento" },
  institucional: { src: "/images/sarmiento-community.png", alt: "Vista panorámica de la comunidad de Sarmiento" },
  contacto: { src: "/images/coopsar-service-office.png", alt: "Atención presencial cercana y accesible" },
  tramites: { src: "/images/coopsar-service-office.png", alt: "Atención y orientación para realizar trámites" },
  "centro-de-ayuda": { src: "/images/coopsar-service-office.png", alt: "Centro de atención a la comunidad" },
  "medios-de-pago": { src: "/images/coopsar-service-office.png", alt: "Orientación presencial para asociados" },
  sepelio: { src: "/images/sarmiento-community.png", alt: "Comunidad de Sarmiento en el paisaje patagónico" },
  privacidad: { src: "/images/sarmiento-community.png", alt: "Paisaje urbano de Sarmiento" },
};

export function generateStaticParams() { return Object.keys(servicePages).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = servicePages[slug]; return page ? { title: page.title, description: page.intro } : {}; }
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = servicePages[slug]; if (!page) notFound(); const visual = serviceImages[slug]; return <main><Header /><section className="page-hero-shell"><Link className="page-back" href="/">← Volver al inicio</Link><div className="visual-hero">{visual && <Image src={visual.src} alt={visual.alt} fill sizes="(max-width: 800px) 100vw, 1400px" priority />}<div className="visual-hero-shade" /><div className="visual-hero-title"><span className="tag">{page.eyebrow}</span><h1>{page.title}</h1></div><div className="visual-hero-summary"><p>{page.intro}</p></div></div></section><section className="section cards">{page.items.map(([title, text, href]) => <article key={title}><h3>{title}</h3><p>{text}</p><Link className="text-link" href={href}>Continuar →</Link></article>)}</section><Contact /><Footer /></main>; }
