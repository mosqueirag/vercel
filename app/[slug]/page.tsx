import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { servicePages } from "../../lib/service-pages";
import { Contact, Footer, Header } from "../ui";

export function generateStaticParams() { return Object.keys(servicePages).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = servicePages[slug]; return page ? { title: page.title, description: page.intro } : {}; }
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = servicePages[slug]; if (!page) notFound(); return <main><Header /><section className="inner"><span className="tag">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p></section><section className="section cards">{page.items.map(([title, text, href]) => <article key={title}><h3>{title}</h3><p>{text}</p><Link className="text-link" href={href}>Continuar →</Link></article>)}</section><Contact /><Footer /></main>; }
