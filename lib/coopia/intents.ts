/**
 * Public COOPIA intent contract.
 *
 * This is deliberately separate from the older assistant intent names.  It
 * describes the person's need and is the stable seam for future specialists;
 * operational data and action execution remain server-side in the existing
 * resolver and tool catalogue.
 */
export const coopiaIntentIds = [
  "payment",
  "energy_outage",
  "internet_issue",
  "internet_interest",
  "fiber_interest",
  "fiber_coverage",
  "funeral_service",
  "human_handoff",
  "unknown",
] as const;

export type CoopiaIntentId = (typeof coopiaIntentIds)[number];
export type CoopiaIntentService = "billing" | "energy" | "internet" | "fiber" | "funeral" | "general";

export type CoopiaIntentRoute = {
  id: CoopiaIntentId;
  service: CoopiaIntentService;
  confidence: number;
  source: "rule" | "unknown";
  analyticsKey: CoopiaIntentId;
  suggestedActions: readonly string[];
};

type Rule = Omit<CoopiaIntentRoute, "confidence" | "source"> & { patterns: readonly RegExp[]; confidence: number };

const rules: readonly Rule[] = [
  { id: "payment", service: "billing", analyticsKey: "payment", suggestedActions: ["OPEN_VIRTUAL_OFFICE", "SHOW_PAYMENT_METHODS", "DOWNLOAD_INVOICE"], confidence: 0.96, patterns: [/\b(quiero|necesito)?\s*(pagar|abonar)\b/i, /\b(factura|deuda)\b.*\b(pagar|abonar)\b/i] },
  { id: "energy_outage", service: "energy", analyticsKey: "energy_outage", suggestedActions: ["REPORT_ENERGY_PROBLEM", "OPEN_COMPLAINT_WHATSAPP"], confidence: 0.96, patterns: [/\b(no (tengo|hay)|sin|falta|corte|problema)\b.*\b(luz|energ[ií]a)\b/i, /\b(estoy sin)\s+(luz|energ[ií]a)\b/i] },
  { id: "internet_issue", service: "internet", analyticsKey: "internet_issue", suggestedActions: ["START_DIAGNOSIS", "OPEN_COMPLAINT_WHATSAPP"], confidence: 0.96, patterns: [/\b(no (tengo|anda|funciona)|sin|problemas?|falla|cort[óo])\b.*\b(internet|fibra|ftth)\b/i, /\b(internet|fibra|ftth)\b.*\b(no (anda|funciona)|sin|problemas?|falla|cort[óo])\b/i] },
  { id: "fiber_coverage", service: "fiber", analyticsKey: "fiber_coverage", suggestedActions: ["CHECK_COVERAGE", "SHOW_INTERNET_PLANS"], confidence: 0.97, patterns: [/\b(llega|hay|cobertura|disponible)\b.*\b(fibra|ftth)\b/i, /\b(fibra|ftth)\b.*\b(casa|domicilio|direcci[oó]n|calle|barrio)\b/i] },
  { id: "fiber_interest", service: "fiber", analyticsKey: "fiber_interest", suggestedActions: ["CHECK_COVERAGE", "SHOW_INTERNET_PLANS", "REQUEST_COVERAGE_VALIDATION"], confidence: 0.95, patterns: [/\b(quiero|contratar|solicitar|instalar|necesito)\b.*\b(fibra|ftth)\b/i, /\b(fibra|ftth)\b.*\b(quiero|contratar|solicitar|instalar)\b/i] },
  { id: "internet_interest", service: "internet", analyticsKey: "internet_interest", suggestedActions: ["CHECK_COVERAGE", "SHOW_INTERNET_PLANS", "REQUEST_COVERAGE_VALIDATION"], confidence: 0.95, patterns: [/\b(quiero|contratar|solicitar|instalar|necesito)\b.*\binternet\b/i, /\binternet\b.*\b(quiero|contratar|solicitar|instalar|necesito)\b/i] },
  { id: "funeral_service", service: "funeral", analyticsKey: "funeral_service", suggestedActions: ["SHOW_FUNERAL_SERVICE", "CALL_FUNERAL_GUARD"], confidence: 0.98, patterns: [/\b(sepelio|funeral)\b/i] },
  { id: "human_handoff", service: "general", analyticsKey: "human_handoff", suggestedActions: ["REQUEST_HUMAN_HANDOFF", "OPEN_WHATSAPP"], confidence: 0.95, patterns: [/\b(persona|operador|humano|asesor|hablar con alguien)\b/i] },
];

export function routeCoopiaIntent(message: string): CoopiaIntentRoute {
  const text = message.normalize("NFC").trim();
  const rule = rules.find((candidate) => candidate.patterns.some((pattern) => pattern.test(text)));
  return rule
    ? { ...rule, source: "rule" }
    : { id: "unknown", service: "general", confidence: 0.2, source: "unknown", analyticsKey: "unknown", suggestedActions: ["REQUEST_HUMAN_HANDOFF"] };
}
