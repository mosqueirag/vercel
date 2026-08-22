import "server-only";

import { createSupabaseAdmin } from "../supabase";
import type { EditorialEntityType } from "../editorial/proposals";

export type EditorialCandidate = {
  id: string;
  entityType: EditorialEntityType;
  title: string;
  originalText: string;
  status: "draft" | "published" | "archived";
  provenanceCount: number;
  validationPending: boolean;
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
    supabase.from("internet_plans").select("id,name,description,conditions,installation_notes,status"),
    supabase.from("public_contact_channels").select("id,label,public_value,purpose,status"),
    supabase.from("content_import_provenance").select("entity_type,entity_id"),
    supabase.from("content_import_validation_queue").select("status"),
  ]);
  if ([services, articles, faqs, plans, contacts, provenance, queue].some((result) => result.error)) return [];
  const provenanceById = new Map<string, number>();
  for (const row of provenance.data ?? []) if (row.entity_id) provenanceById.set(row.entity_id, (provenanceById.get(row.entity_id) ?? 0) + 1);
  const hasValidation = (queue.data ?? []).some((row) => row.status === "open");
  const map = (rows: RawCandidate[] | null, entityType: EditorialEntityType, values: (row: Record<string, unknown>) => { title: string; text: string }) =>
    (rows ?? []).map((row) => {
      const value = values(row as Record<string, unknown>);
      return { id: row.id, entityType, title: value.title, originalText: value.text, status: row.status, provenanceCount: provenanceById.get(row.id) ?? 0, validationPending: hasValidation && (provenanceById.get(row.id) ?? 0) > 0 };
    });
  return [
    ...map(services.data, "service", (row) => ({ title: asText(row.name), text: joinText(row.name, row.description) })),
    ...map(articles.data, "help_article", (row) => ({ title: asText(row.title), text: joinText(row.title, row.summary, row.content) })),
    ...map(faqs.data, "faq", (row) => ({ title: asText(row.question), text: joinText(row.question, row.answer) })),
    ...map(plans.data, "internet_plan", (row) => ({ title: asText(row.name), text: joinText(row.name, row.description, row.conditions, row.installation_notes) })),
    ...map(contacts.data, "contact_channel", (row) => ({ title: asText(row.label), text: joinText(row.label, row.public_value, row.purpose) })),
  ].sort((a, b) => a.entityType.localeCompare(b.entityType) || a.title.localeCompare(b.title, "es-AR"));
}

export async function getEditorialCandidate(entityType: EditorialEntityType, id: string) {
  return (await getEditorialCandidates()).find((candidate) => candidate.entityType === entityType && candidate.id === id) ?? null;
}

export type EditorialProposalRow = { id: string; entity_type: EditorialEntityType; entity_id: string; source_hash: string; prompt_version: string; proposal: unknown; detected_facts: unknown; validation_flags: string[]; risk_level: "low" | "medium" | "high" | "restricted"; status: string; created_at: string; updated_at: string };
export async function getEditorialProposals() {
  const supabase = createSupabaseAdmin();
  if (!supabase) return [] as EditorialProposalRow[];
  const { data, error } = await supabase.from("content_editorial_proposals").select("id,entity_type,entity_id,source_hash,prompt_version,proposal,detected_facts,validation_flags,risk_level,status,created_at,updated_at").order("updated_at", { ascending: false });
  return error ? [] as EditorialProposalRow[] : (data ?? []) as EditorialProposalRow[];
}
