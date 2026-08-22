import { CONTACT } from "../coopsar-data";
import { getPublicContact } from "../data/public-content";
import type { ToolResolution } from "../tools/catalog";
import type { IntentDetection } from "./intents";
import type { AssistantRecommendedAction, AssistantResult } from "./results";
import { serviceRequestConfigs, type ServiceRequestType } from "../service-requests/config";

type ResultConfig = Pick<AssistantResult, "message"> & {
  ui?: AssistantResult["ui"];
  actions: AssistantRecommendedAction[];
  requiresHuman?: boolean;
  complaintRoute?: AssistantResult["complaintRoute"];
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
    complaintRoute: config.complaintRoute,
  };
}

function telephoneHref(value: string) {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

function whatsappHref(value: string) {
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}

async function officialContactValue(service: string, purpose: string, fallback: string) {
  return (await getPublicContact(service, purpose))?.value || fallback;
}

function complaintRoute(tool: ToolResolution): AssistantResult["complaintRoute"] | undefined {
  const routingWindow = tool.data?.routingWindow;
  const contactPurpose = tool.data?.contactPurpose;
  const contactLabel = tool.data?.contactLabel;
  return routingWindow === "office_hours" || routingWindow === "after_hours"
    ? typeof contactPurpose === "string" && typeof contactLabel === "string"
      ? { routingWindow, contactPurpose, contactLabel }
      : undefined
    : undefined;
}

function complaintWhatsappAction(tool: ToolResolution): AssistantRecommendedAction[] {
  const href = tool.data?.whatsappUrl;
  return typeof href === "string" && href.startsWith("https://wa.me/")
    ? [{ id: "OPEN_COMPLAINT_WHATSAPP", label: "Continuar tu reclamo por WhatsApp", href }]
    : [];
}

export async function resolveAssistantResult(detection: IntentDetection, journeyId: string, tool: ToolResolution): Promise<AssistantResult> {
  const status = typeof tool.data?.status === "string" ? tool.data.status : undefined;
  switch (detection.intent) {
    case "fiber_signup":
    case "fiber_coverage":
    case "internet_signup":
      {
        const whatsapp = await officialContactValue("general", "general_contact", CONTACT.whatsapp);
      return createResult(detection, journeyId, tool, {
        message: "Perfecto. Primero veamos qué servicio está disponible en tu domicilio.",
        ui: { type: "fiber_coverage", data: {} },
        actions: [
          { id: "CHECK_COVERAGE", label: "Consultar cobertura" },
          { id: "OPEN_WHATSAPP", label: "Hablar con un asesor", href: whatsappHref(whatsapp) },
        ],
      });
      }
    case "internet_plans":
      return createResult(detection, journeyId, tool, { message: detection.suggestedAction === "select_internet_plan" ? "Para elegir una alternativa primero confirmemos qué servicio llega a tu domicilio." : "La disponibilidad y las alternativas dependen de tu domicilio.", ui: { type: "internet_plans", data: {} }, actions: [{ id: "CHECK_COVERAGE", label: "Consultar cobertura" }] });
    case "fiber_waitlist":
      return createResult(detection, journeyId, tool, { message: "Podés dejar una solicitud para que el equipo evalúe y te avise cuando exista información oficial para tu zona.", ui: { type: "fiber_coverage", data: { waitlist: true } }, actions: [{ id: "START_FIBER_WAITLIST", label: "Quiero que me avisen" }], requiresHuman: true });
    case "internet_problem":
      {
      return createResult(detection, journeyId, tool, {
        message: ["outage", "partial", "maintenance"].includes(String(status)) ? "Detectamos una incidencia informada." : "No encontramos una incidencia general informada. Podemos revisar tu caso.",
        ui: { type: "service_status", data: { service: "Internet", status: status || "unknown" } },
        actions: [
          { id: "START_DIAGNOSIS", label: "Comenzar diagnóstico", href: "/tramites" },
          ...complaintWhatsappAction(tool),
        ],
        complaintRoute: complaintRoute(tool),
        requiresHuman: !["outage", "partial", "maintenance"].includes(String(status)),
      });
      }
    case "energy_problem":
      {
      return createResult(detection, journeyId, tool, {
        message: ["outage", "partial", "maintenance"].includes(String(status)) ? "Hay una incidencia informada para el servicio." : "No encontramos una interrupción general informada.",
        ui: { type: "service_status", data: { service: "Energía", status: status || "unknown" } },
        actions: [
          { id: "REPORT_ENERGY_PROBLEM", label: "Informar falta de energía", href: "/energia" },
          ...complaintWhatsappAction(tool),
        ],
        complaintRoute: complaintRoute(tool),
        requiresHuman: !["outage", "partial", "maintenance"].includes(String(status)),
      });
      }
    case "pay_invoice":
      {
        const virtualOffice = String(tool.data?.virtualOffice || await officialContactValue("billing", "virtual_office", CONTACT.virtualOffice));
      return createResult(detection, journeyId, tool, {
        message: "Podés hacerlo online desde la Oficina Virtual.",
        ui: { type: "payment", data: { virtualOffice } },
        actions: [
          { id: "OPEN_VIRTUAL_OFFICE", label: "Pagar factura", href: virtualOffice },
        ],
      });
      }
    case "resolve_complaint": {
      if (detection.service === "general") return createResult(detection, journeyId, tool, {
        message: "¿Por qué servicio necesitás hacer el reclamo? Elegí una opción para derivarte al canal oficial.",
        ui: { type: "complaint_service_picker", data: {} },
        actions: [],
        requiresHuman: true,
      });
      const route = complaintRoute(tool);
      const actions = complaintWhatsappAction(tool);
      return createResult(detection, journeyId, tool, {
        message: actions.length ? `Podés continuar por ${route?.contactLabel || "el canal oficial"}.` : "No encontramos un canal oficial disponible para este reclamo. Comunicate con COOPSAR por los canales publicados.",
        actions,
        requiresHuman: true,
        complaintRoute: route,
      });
    }
    case "ownership_change":
      return serviceRequestResult("ownership_change", detection, journeyId, tool);
    case "new_supply":
      return serviceRequestResult("new_supply", detection, journeyId, tool);
    case "digital_invoice":
      return serviceRequestResult("digital_invoice", detection, journeyId, tool);
    case "phone_service":
      return serviceRequestResult("phone_request", detection, journeyId, tool);
    case "contact_operator":
      {
        const whatsapp = await officialContactValue("general", "general_contact", CONTACT.whatsapp);
        return createResult(detection, journeyId, tool, { message: "Podés continuar con una persona de nuestro equipo.", ui: { type: "human_handoff", data: {} }, actions: [{ id: "REQUEST_HUMAN_HANDOFF", label: "Solicitar atención" }, { id: "OPEN_WHATSAPP", label: "Abrir WhatsApp", href: whatsappHref(whatsapp) }], requiresHuman: true });
      }
    case "funeral_service":
      {
        const guard = await officialContactValue("funeral", "emergency", CONTACT.funeralGuard);
        return createResult(detection, journeyId, tool, { message: "Te mostramos los canales oficiales del servicio solidario.", actions: [{ id: "SHOW_FUNERAL_SERVICE", label: "Ver información", href: "/sepelio" }, { id: "CALL_FUNERAL_GUARD", label: "Llamar a la guardia", href: telephoneHref(guard) }], requiresHuman: true });
      }
    default:
      return createResult(detection, journeyId, tool, { message: "Voy a orientarte con la información oficial disponible.", actions: [], requiresHuman: true });
  }
}

function serviceRequestResult(type: ServiceRequestType, detection: IntentDetection, journeyId: string, tool: ToolResolution) {
  const config = serviceRequestConfigs[type];
  return createResult(detection, journeyId, tool, { message: `Podés iniciar ${config.title.toLowerCase()} desde acá. La solicitud se registra únicamente después de tu confirmación.`, ui: { type: "service_request_form", data: { requestType: type, title: config.title } }, actions: [{ id: config.startAction, label: config.title }] });
}
