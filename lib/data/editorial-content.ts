import "server-only";

import { createSupabaseAdmin } from "../supabase";
import type { EditorialEntityType } from "../editorial/proposals";
import { isHistoricalEditorialEntityType, validationForSourceSlugs } from "../editorial/historical-corpus";
import { isSitePageEditorialSlug, type SitePageCopyItem } from "../editorial/site-page-bridge";
export { historicalEditorialEntityTypes } from "../editorial/historical-corpus";

export type EditorialCandidate = {
  id: string;
  entityType: EditorialEntityType;
  title: string;
  originalText: string;
  status: "draft" | "published" | "archived";
  provenanceCount: number;
  validationPending: boolean;
  validationReason?: string;
  validationPriority?: "P0" | "P1" | "P2" | "P3";
  sourceSlugs: string[];
  historicalCorpus: boolean;
  editableDraft?: { title: string; summary: string; content: string };
  sitePageDraft?: { eyebrow: string; title: string; intro: string; items: SitePageCopyItem[]; imageUrl: string | null; slug: string; sortOrder: number };
};

type RawCandidate = { id: string; status: EditorialCandidate["status"] };
const asText = (value: unknown) => typeof value === "string" ? value : "";
const joinText = (...values: unknown[]) => values.map(asText).filter(Boolean).join("\n\n");
/** Private projection for the editorial console. Never use this from a client component. */
export async function getEditorialCandidates(): Promise<EditorialCandidate[]> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return [];
  const [services, articles, faqs, plans, contacts, provenance, queue] = await Promise.all([
    supabase.from("services").select("id,name,description,status"),
    supabase.from("help_articles").select("id,title,summary,content,status"),
    supabase.from("faqs").select("id,question,answer,status"),
    supabase.from("internet_plans").select("id,name,description,conditions,installation_notes,status").is("deleted_at", null),
    supabase.from("public_contact_channels").select("id,label,public_value,purpose,status"),
    supabase.from("content_import_provenance").select("entity_type,entity_id,source_slug"),
    supabase.from("content_import_validation_queue").select("status,source_slugs,reason,priority"),
  ]);
  if ([services, articles, faqs, plans, contacts, provenance, queue].some((result) => result.error)) return [];
  const provenanceById = new Map<string, { count: number; sourceSlugs: string[]; historical: boolean }>();
  for (const row of provenance.data ?? []) if (row.entity_id) {
    const previous = provenanceById.get(row.entity_id) ?? { count: 0, sourceSlugs: [], historical: false };
    provenanceById.set(row.entity_id, { count: previous.count + 1, sourceSlugs: row.source_slug ? [...previous.sourceSlugs, row.source_slug] : previous.sourceSlugs, historical: previous.historical || isHistoricalEditorialEntityType(row.entity_type) });
  }
  const map = (rows: RawCandidate[] | null, entityType: EditorialEntityType, values: (row: Record<string, unknown>) => { title: string; text: string; editableDraft?: EditorialCandidate["editableDraft"] }) =>
    (rows ?? []).map((row) => {
      const value = values(row as Record<string, unknown>);
      const provenanceEntry = provenanceById.get(row.id) ?? { count: 0, sourceSlugs: [], historical: false };
      const validation = validationForSourceSlugs(provenanceEntry.sourceSlugs, queue.data ?? []);
      return { id: row.id, entityType, title: value.title, originalText: value.text, status: row.status, provenanceCount: provenanceEntry.count, validationPending: validation.pending, validationReason: validation.reason, validationPriority: validation.priority, sourceSlugs: provenanceEntry.sourceSlugs, historicalCorpus: provenanceEntry.historical && isHistoricalEditorialEntityType(entityType), ...(value.editableDraft ? { editableDraft: value.editableDraft } : {}) };
    });
  return [
    ...map(services.data, "service", (row) => ({ title: asText(row.name), text: joinText(row.name, row.description) })),
    ...map(articles.data, "help_article", (row) => ({ title: asText(row.title), text: joinText(row.title, row.summary, row.content), editableDraft: { title: asText(row.title), summary: asText(row.summary), content: asText(row.content) } })),
    ...map(faqs.data, "faq", (row) => ({ title: asText(row.question), text: joinText(row.question, row.answer) })),
    ...map(plans.data, "internet_plan", (row) => ({ title: asText(row.name), text: joinText(row.name, row.description, row.conditions, row.installation_notes) })),
    ...map(contacts.data, "contact_channel", (row) => ({ title: asText(row.label), text: joinText(row.label, row.public_value, row.purpose) })),
  ].sort((a, b) => a.entityType.localeCompare(b.entityType) || a.title.localeCompare(b.title, "es-AR"));
}

/** The bounded Fase 4D historical corpus. Plans, contacts and unrelated drafts stay out. */
export async function getHistoricalEditorialCandidates(): Promise<EditorialCandidate[]> {
  return (await getEditorialCandidates()).filter((candidate) => candidate.historicalCorpus);
}

/** Explicit 4G.7.2A inventory. These pages never enter the automatic editorial batch. */
export async function getSitePageEditorialCandidates(): Promise<EditorialCandidate[]> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase.from("site_pages").select("id,slug,eyebrow,title,intro,image_url,items,status,sort_order").in("slug", ["institucional", "telefonia", "contacto", "centro-de-ayuda"]);
  if (error) return [];
  return (data ?? []).flatMap((row) => {
    if (!isSitePageEditorialSlug(String(row.slug)) || !Array.isArray(row.items)) return [];
    const items = row.items.flatMap((value): SitePageCopyItem[] => value && typeof value === "object" && typeof (value as Record<string, unknown>).title === "string" && typeof (value as Record<string, unknown>).text === "string" && typeof (value as Record<string, unknown>).href === "string" ? [{ title: String((value as Record<string, unknown>).title), text: String((value as Record<string, unknown>).text), href: String((value as Record<string, unknown>).href) }] : []);
    const draft = { eyebrow: String(row.eyebrow), title: String(row.title), intro: String(row.intro), items, imageUrl: typeof row.image_url === "string" ? row.image_url : null, slug: String(row.slug), sortOrder: Number(row.sort_order ?? 0) };
    return [{ id: String(row.id), entityType: "site_page" as const, title: draft.title, originalText: JSON.stringify({ eyebrow: draft.eyebrow, title: draft.title, intro: draft.intro, items: draft.items }), status: row.status as EditorialCandidate["status"], provenanceCount: 0, validationPending: false, sourceSlugs: [], historicalCorpus: false, sitePageDraft: draft }];
  }).sort((a, b) => a.title.localeCompare(b.title, "es-AR"));
}

export async function getEditorialCandidate(entityType: EditorialEntityType, id: string) {
  return (await getEditorialCandidates()).find((candidate) => candidate.entityType === entityType && candidate.id === id) ?? null;
}

export async function getHistoricalEditorialCandidate(entityType: EditorialEntityType, id: string) {
  return (await getHistoricalEditorialCandidates()).find((candidate) => candidate.entityType === entityType && candidate.id === id) ?? null;
}

export type EditorialProposalRow = { id: string; entity_type: EditorialEntityType; entity_id: string; source_hash: string; prompt_version: string; proposal: unknown; detected_facts: unknown; validation_flags: string[]; risk_level: "low" | "medium" | "high" | "restricted"; status: string; created_at: string; updated_at: string };
export async function getEditorialProposals() {
  const supabase = createSupabaseAdmin();
  if (!supabase) return [] as EditorialProposalRow[];
  const { data, error } = await supabase.from("content_editorial_proposals").select("id,entity_type,entity_id,source_hash,prompt_version,proposal,detected_facts,validation_flags,risk_level,status,created_at,updated_at").order("updated_at", { ascending: false });
  return error ? [] as EditorialProposalRow[] : (data ?? []) as EditorialProposalRow[];
}
