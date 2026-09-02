import { contentSourceHash } from "./proposals";

export type SitePageCopyItem = { title: string; text: string; href: string };
export type SitePageCopy = { eyebrow: string; title: string; intro: string; items: SitePageCopyItem[] };
export type SitePageProposalItem = { sourceIndex: number; originalHref: string; rewrittenTitle?: string; rewrittenText?: string };
export type SitePageProposal = { rewritten_eyebrow?: string; rewritten_title?: string; rewritten_intro?: string; items?: SitePageProposalItem[] };

export function sitePageEditorialSourceHash(page: SitePageCopy & { imageUrl?: string | null; slug?: string; status?: string; sortOrder?: number }) {
  return contentSourceHash({ eyebrow: page.eyebrow, title: page.title, intro: page.intro, items: page.items.map(({ title, text, href }) => ({ title, text, href })), imageUrl: page.imageUrl ?? null, slug: page.slug ?? "", status: page.status ?? "", sortOrder: page.sortOrder ?? 0 });
}

export function applySitePageCopyProposal(current: SitePageCopy, proposal: SitePageProposal): SitePageCopy | null {
  const next = { eyebrow: proposal.rewritten_eyebrow?.trim() || current.eyebrow, title: proposal.rewritten_title?.trim() || current.title, intro: proposal.rewritten_intro?.trim() || current.intro, items: current.items.map((item) => ({ ...item })) };
  for (const item of proposal.items ?? []) {
    if (!Number.isInteger(item.sourceIndex) || item.sourceIndex < 0 || item.sourceIndex >= next.items.length) return null;
    if (next.items[item.sourceIndex].href !== item.originalHref) return null;
    if (item.rewrittenTitle?.trim()) next.items[item.sourceIndex].title = item.rewrittenTitle.trim();
    if (item.rewrittenText?.trim()) next.items[item.sourceIndex].text = item.rewrittenText.trim();
  }
  return next;
}

export const sitePageEditorialSlugs = ["institucional", "telefonia", "contacto", "centro-de-ayuda"] as const;
export const isSitePageEditorialSlug = (slug: string) => (sitePageEditorialSlugs as readonly string[]).includes(slug);
