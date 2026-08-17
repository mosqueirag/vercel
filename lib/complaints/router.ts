import type { AssistantService } from "../ai/intents";
import type { PublicContact } from "../data/public-content";

export type ComplaintService = Extract<AssistantService, "energy" | "internet" | "fiber" | "phone" | "funeral">;
export type ComplaintRoutingWindow = "office_hours" | "after_hours";

export type ComplaintRoute = {
  service: ComplaintService;
  routingWindow: ComplaintRoutingWindow;
  contactPurpose: string;
  contactLabel: string;
  whatsappUrl: string | null;
  message: string;
};

const argentinaTimeZone = "America/Argentina/Buenos_Aires";
const serviceLabels: Record<ComplaintService, string> = {
  energy: "Energía",
  internet: "Internet",
  fiber: "Fibra óptica",
  phone: "Telefonía",
  funeral: "Sepelio",
};

function argentinaClock(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: argentinaTimeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return { weekday: value("weekday"), minutes: Number(value("hour")) * 60 + Number(value("minute")) };
}

export function complaintRoutingWindow(date: Date): ComplaintRoutingWindow {
  const { weekday, minutes } = argentinaClock(date);
  const businessDay = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
  return businessDay && minutes >= 8 * 60 && minutes < 14 * 60 ? "office_hours" : "after_hours";
}

function contactFor(service: ComplaintService, routingWindow: ComplaintRoutingWindow) {
  if (routingWindow === "office_hours") return { service: "general", purpose: "general_contact", label: "Recepción de reclamos" };
  if (service === "energy") return { service: "energy", purpose: "emergency", label: "Guardia de Energía" };
  if (service === "funeral") return { service: "funeral", purpose: "emergency", label: "Guardia de Sepelio" };
  return { service: "internet", purpose: "support", label: "Guardia de Comunicaciones" };
}

function whatsappUrl(value: string, message: string) {
  const number = value.replace(/\D/g, "");
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}

export function resolveComplaintRoute(service: ComplaintService, date: Date, contacts: PublicContact[]): ComplaintRoute {
  const routingWindow = complaintRoutingWindow(date);
  const target = contactFor(service, routingWindow);
  const contact = contacts.find((item) => item.service === target.service && item.purpose === target.purpose);
  const message = `Hola, quiero realizar un reclamo por el servicio de ${serviceLabels[service]}.`;
  // Guard contacts can be stored as phone channels. Their official purpose,
  // not the channel type, determines that they can receive this WhatsApp handoff.
  const url = contact ? whatsappUrl(contact.value, message) : null;
  return { service, routingWindow, contactPurpose: target.purpose, contactLabel: target.label, whatsappUrl: url, message };
}
