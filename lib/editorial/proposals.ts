import { createHash } from "node:crypto";

export const editorialPromptVersion = "coopsar-editorial-v1";
export type EditorialEntityType = "service" | "help_article" | "faq" | "internet_plan" | "contact_channel";
export const editorialBatchOrder: EditorialEntityType[] = ["help_article", "faq", "service"];
export type ProtectedFact = { type: "phone" | "email" | "url" | "address" | "hours" | "date" | "price" | "speed" | "percentage"; value: string };
export type EditorialProposal = {
  rewritten_title?: string;
  rewritten_summary?: string;
  rewritten_content?: string;
  suggested_ctas: string[];
  suggested_coopia_intents: string[];
  seo_title?: string;
  seo_description?: string;
  editorial_notes: string;
};

const patterns: Array<[ProtectedFact["type"], RegExp]> = [
  ["email", /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi],
  ["url", /https?:\/\/[^\s)]+/gi],
  ["phone", /(?:\+?54\s*)?(?:\(?0?\d{2,4}\)?[\s-]*)?\d{3,5}[\s-]?\d{3,5}/g],
  ["price", /(?:\$\s?\d[\d.,]*|\b(?:ARS|USD)\s?\d[\d.,]*)/gi],
  ["speed", /\b\d+(?:[.,]\d+)?\s*Mbps\b/gi],
  ["percentage", /\b\d+(?:[.,]\d+)?\s?%/g],
  ["hours", /\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)[^\n.]{0,70}\b\d{1,2}:\d{2}/gi],
  ["date", /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g],
];

export function contentSourceHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function isEditorialBatchCandidate(entityType: EditorialEntityType) {
  return editorialBatchOrder.includes(entityType);
}

export function proposalIsStale(currentSourceHash: string, proposalSourceHash: string) {
  return currentSourceHash !== proposalSourceHash;
}

export function extractProtectedFacts(content: string): ProtectedFact[] {
  const facts = patterns.flatMap(([type, pattern]) => [...content.matchAll(pattern)].map((match) => ({ type, value: match[0].trim() })));
  return [...new Map(facts.map((fact) => [`${fact.type}:${fact.value.toLocaleLowerCase("es-AR")}`, fact])).values()];
}

export function compareProtectedFacts(original: string, proposal: string) {
  const source = extractProtectedFacts(original);
  const next = extractProtectedFacts(proposal);
  const sourceKeys = new Set(source.map((fact) => `${fact.type}:${fact.value.toLocaleLowerCase("es-AR")}`));
  const nextKeys = new Set(next.map((fact) => `${fact.type}:${fact.value.toLocaleLowerCase("es-AR")}`));
  return [
    ...source.filter((fact) => !nextKeys.has(`${fact.type}:${fact.value.toLocaleLowerCase("es-AR")}`)).map((fact) => `protected_fact_removed:${fact.type}`),
    ...next.filter((fact) => !sourceKeys.has(`${fact.type}:${fact.value.toLocaleLowerCase("es-AR")}`)).map((fact) => `protected_fact_added:${fact.type}`),
  ];
}

export function isRestrictiveEditorialType(entityType: EditorialEntityType, text: string) {
  return entityType === "contact_channel" || entityType === "internet_plan" || /\b(estatuto|reglamento|ley|ordenanza|legal)\b/i.test(text);
}

export function proposalNeedsValidation(entityType: EditorialEntityType, original: string, proposal: EditorialProposal, fromValidationQueue: boolean) {
  const proposedText = [proposal.rewritten_title, proposal.rewritten_summary, proposal.rewritten_content].filter(Boolean).join("\n");
  const flags = compareProtectedFacts(original, proposedText);
  if (fromValidationQueue) flags.push("historical_validation_queue");
  if (isRestrictiveEditorialType(entityType, original)) flags.push("restricted_editorial_content");
  return [...new Set(flags)];
}

export function proposalRiskLevel(entityType: EditorialEntityType, flags: string[]) {
  if (isRestrictiveEditorialType(entityType, "") || flags.some((flag) => flag.startsWith("protected_fact_"))) return "high";
  return flags.length ? "medium" : "low";
}
