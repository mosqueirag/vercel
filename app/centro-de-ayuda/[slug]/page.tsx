import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedHelpArticleBySlug } from "../../../lib/data/help-articles";
import { helpArticleParagraphs } from "../../../lib/data/help-article-visibility";
import { Contact, Footer, Header } from "../../ui";
import { HelpArticleViewTracker } from "./help-article-view-tracker";

export const dynamic = "force-dynamic";

async function articleFor(slug: string) {
  return getPublishedHelpArticleBySlug(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await articleFor(slug);
  if (!article) notFound();
  return { title: article.title, description: article.summary ?? undefined };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await articleFor(slug);
  if (!article) notFound();
  const paragraphs = helpArticleParagraphs(article.content);

  return <main className="help-article-page"><Header /><HelpArticleViewTracker slug={article.slug} category={article.category} /><section className="help-article-hero"><div><Link className="page-back" href="/centro-de-ayuda">← Volver al Centro de ayuda</Link><span className="eyebrow">Centro de ayuda</span><h1>{article.title}</h1>{article.summary && <p>{article.summary}</p>}</div></section><article className="help-article-content" aria-labelledby="help-article-content-title"><h2 id="help-article-content-title" className="sr-only">Artículo</h2>{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</article><Contact /><Footer /></main>;
}
