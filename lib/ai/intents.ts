export const intentNames = [
  "pay_invoice", "download_invoice", "internet_problem", "energy_problem",
  "fiber_signup", "internet_signup", "fiber_coverage", "create_complaint",
  "service_status", "ownership_change", "new_supply", "contact_operator",
  "news_search", "payment_methods", "office_virtual", "funeral_service",
  "phone_service", "general_question",
] as const;

export type AssistantIntent = (typeof intentNames)[number];
export type AssistantService = "billing" | "internet" | "fiber" | "energy" | "phone" | "funeral" | "general";

export type IntentDetection = {
  intent: AssistantIntent;
  confidence: number;
  service: AssistantService;
  suggestedAction: string;
};

type Rule = Omit<IntentDetection, "confidence"> & { patterns: RegExp[]; confidence?: number };

const rules: Rule[] = [
  { intent: "fiber_signup", service: "fiber", suggestedAction: "start_fiber_signup", patterns: [/\b(contratar|quiero|solicitar|instalar)\b.*\bfibra\b/i, /\bfibra\b.*\b(contratar|quiero|solicitar|instalar)\b/i], confidence: 0.98 },
  { intent: "fiber_coverage", service: "fiber", suggestedAction: "check_fiber_coverage", patterns: [/\b(fibra|ftth)\b.*\b(hay|llega|cobertura|disponible|domicilio|direcci[oó]n|calle|barrio)\b/i, /\b(hay|cobertura|llega)\b.*\bfibra\b/i], confidence: 0.96 },
  { intent: "internet_problem", service: "internet", suggestedAction: "diagnose_internet", patterns: [/\b(no (tengo|anda|funciona)|sin|problema|falla|cort[óo])\b.*\binternet\b/i, /\binternet\b.*\b(no (anda|funciona)|sin|problema|falla|cort[óo])\b/i], confidence: 0.95 },
  { intent: "energy_problem", service: "energy", suggestedAction: "report_energy_problem", patterns: [/\b(no (tengo|hay)|sin|falta|problema|corte)\b.*\b(luz|energ[ií]a)\b/i, /\b(luz|energ[ií]a)\b.*\b(corte|problema|falta)\b/i], confidence: 0.95 },
  { intent: "download_invoice", service: "billing", suggestedAction: "open_virtual_office", patterns: [/\b(descargar|bajar|imprimir)\b.*\bfactura\b/i], confidence: 0.97 },
  { intent: "pay_invoice", service: "billing", suggestedAction: "open_payment", patterns: [/\b(pagar|abonar)\b.*\b(factura|internet|deuda|servicio)\b/i, /\b(factura|deuda)\b.*\b(pagar|abonar)\b/i], confidence: 0.96 },
  { intent: "payment_methods", service: "billing", suggestedAction: "show_payment_information", patterns: [/\b(medio|forma|c[oó]mo)\b.*\bpago/i], confidence: 0.91 },
  { intent: "internet_signup", service: "internet", suggestedAction: "start_internet_signup", patterns: [/\b(contratar|quiero|solicitar|instalar)\b.*\binternet\b/i], confidence: 0.95 },
  { intent: "create_complaint", service: "general", suggestedAction: "start_complaint", patterns: [/\b(reclamo|reclamar|queja)\b/i], confidence: 0.94 },
  { intent: "service_status", service: "general", suggestedAction: "get_service_status", patterns: [/\b(estado|incidencia|corte programado)\b.*\b(servicio|internet|luz|energ[ií]a|fibra)?/i], confidence: 0.88 },
  { intent: "ownership_change", service: "general", suggestedAction: "show_ownership_change", patterns: [/\b(cambio|cambiar)\b.*\btitular/i, /\btitularidad\b/i], confidence: 0.96 },
  { intent: "new_supply", service: "energy", suggestedAction: "show_new_supply", patterns: [/\b(nuevo|nueva)\b.*\b(suministro|conexi[oó]n|medidor)\b/i], confidence: 0.91 },
  { intent: "contact_operator", service: "general", suggestedAction: "human_handoff", patterns: [/\b(persona|operador|humano|whatsapp|asesor)\b/i], confidence: 0.94 },
  { intent: "news_search", service: "general", suggestedAction: "search_news", patterns: [/\b(noticia|comunicado|publicaci[oó]n)\b/i], confidence: 0.9 },
  { intent: "office_virtual", service: "billing", suggestedAction: "open_virtual_office", patterns: [/\boficina virtual\b/i], confidence: 0.98 },
  { intent: "funeral_service", service: "funeral", suggestedAction: "show_funeral_information", patterns: [/\b(sepelio|funeral)\b/i], confidence: 0.98 },
  { intent: "phone_service", service: "phone", suggestedAction: "show_phone_information", patterns: [/\b(telefon[ií]a|tel[eé]fono fijo)\b/i], confidence: 0.93 },
];

export function detectIntent(message: string): IntentDetection {
  const normalized = message.normalize("NFC").trim();
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return { intent: rule.intent, service: rule.service, confidence: rule.confidence ?? 0.9, suggestedAction: rule.suggestedAction };
    }
  }
  return { intent: "general_question", service: "general", confidence: 0.35, suggestedAction: "answer_from_knowledge_base" };
}
