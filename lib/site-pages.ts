import { z } from "zod";

export const systemPageSlugs = ["energia", "internet", "fibra-optica", "telefonia", "sepelio", "tramites", "cortes-programados", "medios-de-pago", "centro-de-ayuda", "institucional", "contacto", "privacidad"] as const;
export type SystemPageSlug = (typeof systemPageSlugs)[number];
export const safePageHref = z.string().trim().max(500).refine((href) => {
  if (href.startsWith("/")) return !href.startsWith("//") && !href.includes("\\");
  try { const url = new URL(href); return ["http:", "https:", "tel:"].includes(url.protocol); } catch { return false; }
}, "El enlace debe ser una ruta interna o una URL http, https, tel o WhatsApp válida.");
export const safePageImageUrl = z.string().trim().max(2000).refine((url) => {
  if (url.startsWith("/images/")) return true;
  try { const parsed = new URL(url); return parsed.protocol === "https:" && ((parsed.hostname === "hfmasofcekigldbysryg.supabase.co" && parsed.pathname.startsWith("/storage/v1/object/public/news-images/")) || ((parsed.hostname === "www.coopsar.com.ar" || parsed.hostname === "coopsar.com.ar") && parsed.pathname.startsWith("/wp-content/uploads/"))); } catch { return false; }
}, "La imagen debe ser local o pertenecer a un host autorizado.");
export const sitePageItemSchema = z.object({ title: z.string().trim().min(2).max(120), text: z.string().trim().min(2).max(600), href: safePageHref });
export const sitePageInputSchema = z.object({ id: z.string().uuid().optional(), slug: z.enum(systemPageSlugs), eyebrow: z.string().trim().min(2).max(120), title: z.string().trim().min(2).max(180), intro: z.string().trim().min(2).max(1200), imageUrl: safePageImageUrl.nullable().optional(), items: z.array(sitePageItemSchema).max(12), status: z.enum(["draft", "published"]), sortOrder: z.number().int().nonnegative().default(0) });
export type SitePage = z.infer<typeof sitePageInputSchema> & { id: string; updatedAt?: string | null; createdAt?: string | null };
export const asItemTuples = (items: Array<z.infer<typeof sitePageItemSchema>>) => items.map((item) => [item.title, item.text, item.href] as [string, string, string]);
