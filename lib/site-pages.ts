import { z } from "zod";

export const systemPageSlugs = ["energia", "internet", "fibra-optica", "telefonia", "sepelio", "tramites", "cortes-programados", "medios-de-pago", "centro-de-ayuda", "institucional", "contacto", "privacidad"] as const;
export type SystemPageSlug = (typeof systemPageSlugs)[number];
export const safePageHref = z.string().trim().max(500).refine((href) => {
  if (href.startsWith("/")) return !href.startsWith("//") && !href.includes("\\");
  try { const url = new URL(href); return ["http:", "https:", "tel:"].includes(url.protocol); } catch { return false; }
}, "El enlace debe ser una ruta interna o una URL http, https, tel o WhatsApp válida.");
export const sitePageItemSchema = z.object({ title: z.string().trim().min(2).max(120), text: z.string().trim().min(2).max(600), href: safePageHref });
export const sitePageInputSchema = z.object({ id: z.string().uuid().optional(), slug: z.enum(systemPageSlugs), eyebrow: z.string().trim().min(2).max(120), title: z.string().trim().min(2).max(180), intro: z.string().trim().min(2).max(1200), imageUrl: z.string().trim().url().max(2000).nullable().optional(), items: z.array(sitePageItemSchema).max(12), status: z.enum(["draft", "published"]), sortOrder: z.number().int().nonnegative().default(0) });
export type SitePage = z.infer<typeof sitePageInputSchema> & { id: string; updatedAt?: string | null; createdAt?: string | null };
export const asItemTuples = (items: Array<z.infer<typeof sitePageItemSchema>>) => items.map((item) => [item.title, item.text, item.href] as [string, string, string]);
