import { createSupabaseAdmin } from "../supabase";
import { formatCuratedKnowledge, getPublishedCuratedKnowledge } from "./curated-content";

export type PublicInternetPlan = {
  id: string; slug: string; name: string; description: string | null; audience: string;
  technology: string | null; speed_down_mbps: number | null; speed_up_mbps: number | null;
  price_amount: number | null; currency: string | null; installation_price: number | null;
  installation_notes: string | null; benefits: string[]; conditions: string | null;
};

export type PublicContact = { id: string; service: string; channelType: string; label: string; value: string; purpose: string };
export type PublicFaq = { question: string; answer: string; category: string };

export const stagingInternetDemoPlanSlugs = [
  "plan-hogar-50-mb",
  "plan-hogar-100-mb",
  "inalambrico-20-mb",
  "ftth-comercial-y-educacional-50-mb",
  "plan-comercial-100-mb-simetrico",
] as const;

type RuntimeEnvironment = { appEnv?: string; vercelEnv?: string };

/**
 * Draft catalog records are deliberately available only in a staging runtime.
 * Production always remains on the published-only data path.
 */
export function isStagingInternetCommercialDemo({ appEnv = process.env.NEXT_PUBLIC_APP_ENV, vercelEnv = process.env.VERCEL_ENV }: RuntimeEnvironment = {}) {
  return appEnv === "staging" && vercelEnv !== "production";
}

/**
 * Keeps contact-read telemetry useful without ever serializing a provider
 * message, contact value, request headers, or credentials into runtime logs.
 */
export function publicContactQueryErrorDetails(code: string | null | undefined) {
  return {
    operation: "published_contact_read",
    code: code || "unknown",
    category: code === "PGRST303" ? "auth_claims_rejected" : "query_failed",
  };
}

const now = () => new Date().toISOString();

export async function getPublishedInternetPlans(): Promise<PublicInternetPlan[]> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase.from("internet_plans")
    .select("id,slug,name,description,audience,technology,speed_down_mbps,speed_up_mbps,price_amount,currency,installation_price,installation_notes,benefits,conditions")
    .eq("status", "published").lte("published_at", now()).order("sort_order");
  if (error) { console.error("Published plans query failed", error.code); return []; }
  return (data ?? []).map((plan) => ({ ...plan, benefits: Array.isArray(plan.benefits) ? plan.benefits.filter((item): item is string => typeof item === "string") : [] }));
}

export async function getPublicContacts(service?: string): Promise<PublicContact[]> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return [];
  let query = supabase.from("public_contact_channels").select("id,service,channel_type,label,public_value,purpose").eq("status", "published").lte("published_at", now()).order("sort_order");
  if (service) query = query.eq("service", service);
  const { data, error } = await query;
  if (error) { console.warn("Public contacts query failed", publicContactQueryErrorDetails(error.code)); return []; }
  return (data ?? []).map((contact) => ({ id: contact.id, service: contact.service, channelType: contact.channel_type, label: contact.label, value: contact.public_value, purpose: contact.purpose }));
}

export async function getPublicContact(service: string, purpose?: string) {
  const contacts = await getPublicContacts(service);
  return contacts.find((contact) => !purpose || contact.purpose === purpose) ?? null;
}

export async function searchPublishedKnowledge(query: string) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return [];
  const term = `%${query.replace(/[%_]/g, "")} %`.replace(" %", "%");
  const [faqs, articles, services] = await Promise.all([
    supabase.from("faqs").select("question,answer,category").eq("status", "published").lte("published_at", now()).or(`question.ilike.${term},answer.ilike.${term}`).limit(5),
    supabase.from("help_articles").select("title,summary,content,category").eq("status", "published").lte("published_at", now()).or(`title.ilike.${term},summary.ilike.${term},content.ilike.${term}`).limit(5),
    supabase.from("services").select("name,description").eq("status", "published").or(`name.ilike.${term},description.ilike.${term}`).limit(5),
  ]);
  if (faqs.error || articles.error || services.error) { console.error("Published knowledge query failed"); return []; }
  return [
    ...(faqs.data ?? []).map((item) => `${item.question}\n${item.answer}`),
    ...(articles.data ?? []).map((item) => `${item.title}\n${item.summary ?? item.content}`),
    ...(services.data ?? []).map((item) => `${item.name}\n${item.description}`),
  ];
}

export async function getAssistantKnowledge() {
  const [plans, contacts, curated] = await Promise.all([getPublishedInternetPlans(), getPublicContacts(), getPublishedCuratedKnowledge()]);
  const planLines = plans.map((plan) => `Plan publicado: ${plan.name}. Tecnología: ${plan.technology ?? "no publicada"}. Velocidad: ${plan.speed_down_mbps ?? "no publicada"}. Precio: ${plan.price_amount === null ? "no publicado" : `${plan.currency ?? ""} ${plan.price_amount}`}.`).join("\n");
  const contactLines = contacts.map((contact) => `${contact.label}: ${contact.value}.`).join("\n");
  return ["Usá solo los datos publicados a continuación. Si no hay información, indicá que no está publicada y ofrecé reintentar.", contactLines, planLines, formatCuratedKnowledge(curated)].filter(Boolean).join("\n");
}

/** A read-only, allowlisted catalog used exclusively to validate the staging sales UX. */
export async function getStagingInternetDemoPlans(): Promise<PublicInternetPlan[]> {
  if (!isStagingInternetCommercialDemo()) return [];
  const supabase = createSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase.from("internet_plans")
    .select("id,slug,name,description,audience,technology,speed_down_mbps,speed_up_mbps,price_amount,currency,installation_price,installation_notes,benefits,conditions")
    .eq("status", "draft")
    .in("slug", [...stagingInternetDemoPlanSlugs])
    .order("sort_order");
  if (error) { console.error("Staging demo plans query failed", error.code); return []; }
  return (data ?? []).map((plan) => ({ ...plan, benefits: Array.isArray(plan.benefits) ? plan.benefits.filter((item): item is string => typeof item === "string") : [] }));
}

/** Keeps the Internet surface limited to published, relevant answers. */
export function isInternetRelatedFaq(faq: PublicFaq) {
  return /\b(internet|fibra|ftth|inal[aá]mbric|wifi|wi-fi|conectividad|cobertura)\b/i.test(`${faq.category} ${faq.question} ${faq.answer}`);
}

export async function getPublishedInternetFaqs(): Promise<PublicFaq[]> {
  const supabase = createSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase.from("faqs")
    .select("question,answer,category")
    .eq("status", "published")
    .lte("published_at", now())
    .order("sort_order")
    .limit(40);
  if (error) { console.error("Published Internet FAQ query failed", error.code); return []; }
  return (data ?? []).filter(isInternetRelatedFaq).slice(0, 6);
}

/** Draft FAQs are only a staging aid; they never become public knowledge by being read here. */
export async function getStagingInternetDemoFaqs(): Promise<PublicFaq[]> {
  if (!isStagingInternetCommercialDemo()) return [];
  const supabase = createSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase.from("faqs")
    .select("question,answer,category")
    .eq("status", "draft")
    .order("sort_order")
    .limit(40);
  if (error) { console.error("Staging demo FAQ query failed", error.code); return []; }
  return (data ?? []).filter((faq) => {
    const category = String(faq.category ?? "");
    return /cobertura|planes?|contrataci[oó]n/i.test(category) && isInternetRelatedFaq(faq as PublicFaq);
  }).slice(0, 8) as PublicFaq[];
}
