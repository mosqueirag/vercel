import type { IntentDetection } from "../ai/intents";
import type { JourneyContext } from "../journey/types";
import { getPaymentInformation } from "./read-only";
import { getPublicContacts, getPublishedInternetPlans } from "../data/public-content";
import { resolveComplaintRoute, type ComplaintService } from "../complaints/router";
import { getServiceStatus } from "./service-status";

export const assistantToolNames = [
  "checkFiberCoverage",
  "getInternetPlans",
  "createFiberWaitlist",
  "getInternetServiceStatus",
  "getEnergyServiceStatus",
  "getPaymentInformation",
  "createInternetRequest",
  "resolveComplaintChannel",
  "createOwnershipChangeRequest",
  "createNewSupplyRequest",
  "createDigitalInvoiceRequest",
  "createPhoneRequest",
  "requestHumanHandoff",
] as const;

export type AssistantToolName = (typeof assistantToolNames)[number];
export type ToolSelection = { name: AssistantToolName; kind: "read" | "write"; requiresConfirmation: boolean };
export type ToolResolution = ToolSelection & { status: "ready" | "completed" | "unavailable"; data?: Record<string, string | number | boolean | null> };

const selections: Partial<Record<IntentDetection["intent"], ToolSelection>> = {
  fiber_signup: { name: "checkFiberCoverage", kind: "read", requiresConfirmation: false },
  fiber_coverage: { name: "checkFiberCoverage", kind: "read", requiresConfirmation: false },
  internet_plans: { name: "getInternetPlans", kind: "read", requiresConfirmation: false },
  fiber_waitlist: { name: "createFiberWaitlist", kind: "write", requiresConfirmation: true },
  internet_problem: { name: "getInternetServiceStatus", kind: "read", requiresConfirmation: false },
  energy_problem: { name: "getEnergyServiceStatus", kind: "read", requiresConfirmation: false },
  pay_invoice: { name: "getPaymentInformation", kind: "read", requiresConfirmation: false },
  resolve_complaint: { name: "resolveComplaintChannel", kind: "read", requiresConfirmation: false },
  ownership_change: { name: "createOwnershipChangeRequest", kind: "write", requiresConfirmation: true },
  new_supply: { name: "createNewSupplyRequest", kind: "write", requiresConfirmation: true },
  phone_service: { name: "createPhoneRequest", kind: "write", requiresConfirmation: true },
  digital_invoice: { name: "createDigitalInvoiceRequest", kind: "write", requiresConfirmation: true },
  contact_operator: { name: "requestHumanHandoff", kind: "write", requiresConfirmation: true },
  internet_signup: { name: "createInternetRequest", kind: "write", requiresConfirmation: true },
};

export function selectAssistantTool(detection: IntentDetection): ToolSelection {
  return selections[detection.intent] ?? { name: "requestHumanHandoff", kind: "write", requiresConfirmation: true };
}

export async function resolveAssistantTool(detection: IntentDetection, context: JourneyContext): Promise<ToolResolution> {
  const selection = selectAssistantTool(detection);
  if (selection.kind === "write") return { ...selection, status: "ready" };
  if (selection.name === "resolveComplaintChannel") {
    if (detection.service === "general") return { ...selection, status: "ready", data: { serviceKnown: false } };
    const route = resolveComplaintRoute(detection.service as ComplaintService, new Date(), await getPublicContacts());
    return { ...selection, status: route.whatsappUrl ? "completed" : "unavailable", data: { serviceKnown: true, routingWindow: route.routingWindow, contactPurpose: route.contactPurpose, contactLabel: route.contactLabel, whatsappUrl: route.whatsappUrl, complaintMessage: route.message } };
  }
  if (selection.name === "getInternetServiceStatus") {
    const route = resolveComplaintRoute(detection.service as Extract<ComplaintService, "internet" | "fiber" | "phone">, new Date(), await getPublicContacts());
    return { ...selection, status: route.whatsappUrl ? "completed" : "unavailable", data: { status: await getServiceStatus("internet", context), routingWindow: route.routingWindow, contactPurpose: route.contactPurpose, contactLabel: route.contactLabel, whatsappUrl: route.whatsappUrl, complaintMessage: route.message } };
  }
  if (selection.name === "getEnergyServiceStatus") {
    const route = resolveComplaintRoute("energy", new Date(), await getPublicContacts());
    return { ...selection, status: route.whatsappUrl ? "completed" : "unavailable", data: { status: await getServiceStatus("energy", context), routingWindow: route.routingWindow, contactPurpose: route.contactPurpose, contactLabel: route.contactLabel, whatsappUrl: route.whatsappUrl, complaintMessage: route.message } };
  }
  if (selection.name === "getPaymentInformation") {
    const output = await getPaymentInformation.execute({}, context);
    return output.ok ? { ...selection, status: "completed", data: output.data } : { ...selection, status: "unavailable" };
  }
  if (selection.name === "getInternetPlans") {
    const plans = await getPublishedInternetPlans();
    return { ...selection, status: "completed", data: { publishedPlans: plans.length, pricePublished: plans.some((plan) => plan.price_amount !== null) } };
  }
  // Coverage needs validated address inputs. The approved UI gathers them and
  // invokes the existing server-side coverage endpoint.
  return { ...selection, status: "ready" };
}
