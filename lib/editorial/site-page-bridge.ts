import { contentSourceHash } from "./proposals";

export type SitePageCopyItem = { title: string; text: string; href: string };
export type SitePageCopy = { eyebrow: string; title: string; intro: string; items: SitePageCopyItem[] };
export type SitePageEditorialStatus = "draft" | "published" | "archived";
/** Complete protected snapshot used for generation and Apply stale checks. */
export type SitePageEditorialSnapshot = SitePageCopy & {
  imageUrl: string | null;
  slug: string;
  status: SitePageEditorialStatus;
  sortOrder: number;
};
export type SitePageProposalItem = { sourceIndex: number; originalHref: string; rewrittenTitle?: string; rewrittenText?: string };
export type SitePageProposal = { rewritten_eyebrow?: string; rewritten_title?: string; rewritten_intro?: string; items?: SitePageProposalItem[] };
export type SitePageTopLevelProposal = { rewritten_eyebrow: string; rewritten_title: string; rewritten_intro: string; editorial_notes: string };

export function sitePageEditorialSourceHash(page: SitePageEditorialSnapshot) {
  return contentSourceHash({ eyebrow: page.eyebrow, title: page.title, intro: page.intro, items: page.items.map(({ title, text, href }) => ({ title, text, href })), imageUrl: page.imageUrl, slug: page.slug, status: page.status, sortOrder: page.sortOrder });
}

/** Must be evaluated before deriving values or issuing an update to site_pages. */
export function canApplySitePageEditorialProposal(page: SitePageEditorialSnapshot, proposalSourceHash: string) {
  return sitePageEditorialSourceHash(page) === proposalSourceHash;
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

/** The 4G.7.2B smoke explicitly excludes operational cards from editorial output. */
export function applySitePageTopLevelProposal(current: SitePageCopy, proposal: SitePageTopLevelProposal): Pick<SitePageCopy, "eyebrow" | "title" | "intro"> {
  return { eyebrow: proposal.rewritten_eyebrow.trim(), title: proposal.rewritten_title.trim(), intro: proposal.rewritten_intro.trim() };
}

export function sitePageTopLevelText(page: Pick<SitePageCopy, "eyebrow" | "title" | "intro">) {
  return [page.eyebrow, page.title, page.intro].join("\n");
}

export const sitePageEditorialSlugs = ["institucional", "telefonia", "contacto", "centro-de-ayuda"] as const;
export const isSitePageEditorialSlug = (slug: string) => (sitePageEditorialSlugs as readonly string[]).includes(slug);

/** Keeps a successful empty inventory distinct from a failed Supabase read. */
export function sitePageEditorialQueryOutcome(data: unknown, error: unknown):
  | { ok: true; rows: unknown[] }
  | { ok: false; reason: "query" | "invalid_response" } {
  if (error) return { ok: false, reason: "query" };
  if (!Array.isArray(data)) return { ok: false, reason: "invalid_response" };
  return { ok: true, rows: data };
}
