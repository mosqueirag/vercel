import "server-only";

import OpenAI from "openai";

import type { EditorialCandidate } from "../data/editorial-content";
import { parseSitePageEditorialProposal } from "./site-page-proposal-schema";

export { parseSitePageEditorialProposal, sitePageEditorialProposalSchema, type SitePageEditorialProposal } from "./site-page-proposal-schema";

export const sitePageEditorialPromptVersion = "coopsar-site-page-top-level-v1";

export async function generateSitePageEditorialProposal(candidate: EditorialCandidate) {
  if (candidate.entityType !== "site_page" || !candidate.sitePageDraft) throw new Error("EDITORIAL_SITE_PAGE_INVALID_CANDIDATE");
  if (!process.env.OPENAI_API_KEY) throw new Error("EDITORIAL_AI_NOT_CONFIGURED");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
    max_output_tokens: 800,
    instructions: "Sos editor institucional de COOPSAR. Devolvé solamente JSON válido con rewritten_eyebrow, rewritten_title, rewritten_intro y editorial_notes. Reescribí únicamente eyebrow, título e introducción. No inventes hechos. No agregues teléfonos, direcciones, horarios, autoridades, precios, requisitos, beneficios, fechas, datos legales ni operativos que no estén explícitamente respaldados. No escribas CTAs ni enlaces. No incluyas items, href, image, slug, status ni sortOrder. Esta respuesta es una propuesta interna y nunca publica contenido.",
    input: JSON.stringify({ prompt_version: sitePageEditorialPromptVersion, entity_type: candidate.entityType, slug: candidate.sitePageDraft.slug, eyebrow: candidate.sitePageDraft.eyebrow, title: candidate.sitePageDraft.title, intro: candidate.sitePageDraft.intro }),
  });
  const parsed = parseSitePageEditorialProposal(JSON.parse(response.output_text));
  if (!parsed.success) throw new Error("EDITORIAL_AI_INVALID_RESPONSE");
  return parsed.data;
}
