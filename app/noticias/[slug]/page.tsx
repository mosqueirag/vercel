import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedNewsBySlug } from "../../../lib/news";
import { Contact, Footer, Header } from "../../ui";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedNewsBySlug(slug);
  if (!article) notFound();
  return <main><Header /><article className="post">{article.imageUrl && <div className="post-image"><Image src={article.imageUrl} alt={article.title} fill sizes="(max-width: 900px) 100vw, 900px" priority /></div>}<small>{article.category} · {article.date}</small><h1>{article.title}</h1><p className="lead">{article.excerpt}</p>{article.body.map((paragraph, index) => <p key={`${article.id}-${index}`}>{paragraph}</p>)}<blockquote>Información oficial de COOPSAR.</blockquote><Link href="/noticias">← Volver a noticias</Link></article><Contact /><Footer /></main>;
}
