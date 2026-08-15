import { CONTACT } from "../coopsar-data";
import type { ToolResolution } from "../tools/catalog";
import type { IntentDetection } from "./intents";
import type { AssistantRecommendedAction, AssistantResult } from "./results";
import { serviceRequestConfigs, type ServiceRequestType } from "../service-requests/config";

type ResultConfig = Pick<AssistantResult, "message"> & {
  ui?: AssistantResult["ui"];
  actions: AssistantRecommendedAction[];
  requiresHuman?: boolean;
};

function createResult(detection: IntentDetection, journeyId: string, tool: ToolResolution, config: ResultConfig): AssistantResult {
  return {
    message: config.message,
    intent: detection.intent,
    service: detection.service,
    confidence: detection.confidence,
    ui: config.ui,
    recommendedActions: config.actions,
    actions: config.actions,
    nextStep: detection.suggestedAction,
    requiresConfirmation: tool.requiresConfirmation,
    requiresHuman: config.requiresHuman ?? false,
    tool: { name: tool.name, kind: tool.kind, status: tool.status },
    journey: { journeyId, currentStep: detection.suggestedAction },
  };
}

export function resolveAssistantResult(detection: IntentDetection, journeyId: string, tool: ToolResolution): AssistantResult {
  const status = typeof tool.data?.status === "string" ? tool.data.status : undefined;
  switch (detection.intent) {
    case "fiber_signup":
    case "fiber_coverage":
      return createResult(detection, journeyId, tool, {
        message: "Perfecto. Primero veamos qué servicio está disponible en tu domicilio.",
        ui: { type: "fiber_coverage", data: {} },
        actions: [
          { id: "CHECK_COVERAGE", label: "Consultar cobertura" },
          { id: "OPEN_WHATSAPP", label: "Hablar con un asesor", href: `https://wa.me/${CONTACT.whatsapp}` },
        ],
      });
    case "internet_problem":
      return createResult(detection, journeyId, tool, {
        message: ["outage", "partial", "maintenance"].includes(String(status)) ? "Detectamos una incidencia informada." : "No encontramos una incidencia general informada. Podemos revisar tu caso.",
        ui: { type: "service_status", data: { service: "Internet", status: status || "unknown" } },
        actions: [
          { id: "START_DIAGNOSIS", label: "Comenzar diagnóstico", href: "/tramites" },
          { id: "OPEN_WHATSAPP", label: "Contactar soporte", href: `tel:${CONTACT.internetSupport.replace(/\s/g, "")}` },
        ],
        requiresHuman: !["outage", "partial", "maintenance"].includes(String(status)),
      });
    case "energy_problem":
      return createResult(detection, journeyId, tool, {
        message: ["outage", "partial", "maintenance"].includes(String(status)) ? "Hay una incidencia informada para el servicio." : "No encontramos una interrupción general informada.",
        ui: { type: "service_status", data: { service: "Energía", status: status || "unknown" } },
        actions: [
          { id: "REPORT_ENERGY_PROBLEM", label: "Informar falta de energía", href: "/energia" },
          { id: "OPEN_WHATSAPP", label: "Contactar guardia", href: `tel:${CONTACT.energyGuard.replace(/\s/g, "")}` },
        ],
        requiresHuman: !["outage", "partial", "maintenance"].includes(String(status)),
      });
    case "pay_invoice":
      return createResult(detection, journeyId, tool, {
        message: "Podés pagar o consultar tu factura directamente desde la Oficina Virtual.",
        ui: { type: "payment", data: { virtualOffice: String(tool.data?.virtualOffice || CONTACT.virtualOffice) } },
        actions: [
          { id: "OPEN_VIRTUAL_OFFICE", label: "Ingresar a Oficina Virtual", href: CONTACT.virtualOffice },
          { id: "SHOW_PAYMENT_METHODS", label: "Ver medios de pago", href: "/medios-de-pago" },
          { id: "DOWNLOAD_INVOICE", label: "Descargar factura", href: CONTACT.virtualOffice },
        ],
      });
    case "create_complaint":
      return serviceRequestResult("complaint", detection, journeyId, tool);
    case "ownership_change":
      return serviceRequestResult("ownership_change", detection, journeyId, tool);
    case "new_supply":
      return serviceRequestResult("new_supply", detection, journeyId, tool);
    case "digital_invoice":
      return serviceRequestResult("digital_invoice", detection, journeyId, tool);
    case "phone_service":
      return serviceRequestResult("phone_request", detection, journeyId, tool);
    case "contact_operator":
      return createResult(detection, journeyId, tool, { message: "Podés continuar con una persona de nuestro equipo.", ui: { type: "human_handoff", data: {} }, actions: [{ id: "REQUEST_HUMAN_HANDOFF", label: "Solicitar atención" }, { id: "OPEN_WHATSAPP", label: "Abrir WhatsApp", href: `https://wa.me/${CONTACT.whatsapp}` }], requiresHuman: true });
    case "funeral_service":
      return createResult(detection, journeyId, tool, { message: "Te mostramos los canales oficiales del servicio solidario.", actions: [{ id: "SHOW_FUNERAL_SERVICE", label: "Ver información", href: "/sepelio" }, { id: "CALL_FUNERAL_GUARD", label: "Llamar a la guardia", href: `tel:${CONTACT.funeralGuard.replace(/\s/g, "")}` }], requiresHuman: true });
    default:
      return createResult(detection, journeyId, tool, { message: "Voy a orientarte con la información oficial disponible.", actions: [], requiresHuman: true });
  }
}

function serviceRequestResult(type: ServiceRequestType, detection: IntentDetection, journeyId: string, tool: ToolResolution) {
  const config = serviceRequestConfigs[type];
  return createResult(detection, journeyId, tool, { message: `Podés iniciar ${config.title.toLowerCase()} desde acá. La solicitud se registra únicamente después de tu confirmación.`, ui: { type: "service_request_form", data: { requestType: type, title: config.title } }, actions: [{ id: config.startAction, label: config.title }] });
}
