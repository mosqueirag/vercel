import "server-only";

import OpenAI from "openai";
import type { EditorialCandidate } from "../data/editorial-content";
import { editorialPromptVersion, type EditorialProposal } from "./proposals";

function normalizeProposal(value: unknown): EditorialProposal | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const strings = (key: string) => Array.isArray(row[key]) ? row[key].filter((item): item is string => typeof item === "string").slice(0, 4) : [];
  const text = (key: string) => typeof row[key] === "string" ? row[key].trim().slice(0, 4000) : undefined;
  const proposal = { rewritten_title: text("rewritten_title"), rewritten_summary: text("rewritten_summary"), rewritten_content: text("rewritten_content"), suggested_ctas: strings("suggested_ctas"), suggested_coopia_intents: strings("suggested_coopia_intents"), seo_title: text("seo_title"), seo_description: text("seo_description"), editorial_notes: text("editorial_notes") ?? "" };
  return proposal.rewritten_title || proposal.rewritten_summary || proposal.rewritten_content ? proposal : null;
}

export async function generateEditorialProposal(candidate: EditorialCandidate) {
  if (!process.env.OPENAI_API_KEY) throw new Error("EDITORIAL_AI_NOT_CONFIGURED");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
    max_output_tokens: 1200,
    instructions: "Sos editor institucional de COOPSAR. Devolvé solamente JSON válido con rewritten_title, rewritten_summary, rewritten_content, suggested_ctas, suggested_coopia_intents, seo_title, seo_description y editorial_notes. No inventes precios, teléfonos, direcciones, horarios, coberturas, condiciones legales ni datos operativos. Si un dato no está en el texto fuente, no lo agregues. Esta respuesta es una propuesta interna y nunca publica contenido.",
    input: JSON.stringify({ prompt_version: editorialPromptVersion, entity_type: candidate.entityType, title: candidate.title, content: candidate.originalText }),
  });
  const proposal = normalizeProposal(JSON.parse(response.output_text));
  if (!proposal) throw new Error("EDITORIAL_AI_INVALID_RESPONSE");
  return proposal;
}
