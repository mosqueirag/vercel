import { CONTACT } from "../coopsar-data";
import type { IntentDetection } from "./intents";
import type { AssistantResult } from "./results";

export function resolveAssistantResult(detection: IntentDetection, journeyId: string, status?: string): AssistantResult {
  const base = { intent: detection.intent, service: detection.service, journey: { journeyId, currentStep: detection.suggestedAction } };
  switch (detection.intent) {
    case "fiber_signup":
    case "fiber_coverage":
      return { ...base, message: "Perfecto. Primero veamos qué servicio está disponible en tu domicilio.", ui: { type: "fiber_coverage", data: {} }, actions: [{ id: "CHECK_COVERAGE", label: "Consultar cobertura" }, { id: "OPEN_WHATSAPP", label: "Hablar con un asesor", href: `https://wa.me/${CONTACT.whatsapp}` }] };
    case "internet_problem":
      return { ...base, message: status === "incident" ? "Detectamos una incidencia general informada." : "No encontramos una incidencia general informada. Podemos revisar tu caso.", ui: { type: "service_status", data: { service: "Internet", status: status || "unknown" } }, actions: [{ id: "START_DIAGNOSIS", label: "Comenzar diagnóstico", href: "/tramites" }, { id: "OPEN_WHATSAPP", label: "Contactar soporte", href: `tel:${CONTACT.internetSupport.replace(/\s/g, "")}` }] };
    case "energy_problem":
      return { ...base, message: status === "incident" ? "Hay una interrupción informada para el servicio." : "No encontramos una interrupción general informada.", ui: { type: "service_status", data: { service: "Energía", status: status || "unknown" } }, actions: [{ id: "REPORT_ENERGY_PROBLEM", label: "Informar falta de energía", href: "/energia" }, { id: "OPEN_WHATSAPP", label: "Contactar guardia", href: `tel:${CONTACT.energyGuard.replace(/\s/g, "")}` }] };
    case "pay_invoice":
      return { ...base, message: "Podés pagar o consultar tu factura directamente desde la Oficina Virtual.", ui: { type: "payment", data: { virtualOffice: CONTACT.virtualOffice } }, actions: [{ id: "OPEN_VIRTUAL_OFFICE", label: "Ingresar a Oficina Virtual", href: CONTACT.virtualOffice }, { id: "SHOW_PAYMENT_METHODS", label: "Ver medios de pago", href: "/medios-de-pago" }, { id: "DOWNLOAD_INVOICE", label: "Descargar factura", href: CONTACT.virtualOffice }] };
    default:
      return { ...base, message: "Voy a orientarte con la información oficial disponible.", actions: [] };
  }
}
