export type HomeQuickActionId = "pay_bill" | "energy_outage" | "internet_interest" | "funeral_service";

export type HomeQuickAction = {
  id: HomeQuickActionId;
  title: string;
  description: string;
  icon: string;
  destinationType: "internal" | "external" | "contact";
  href: string;
  accent?: "commercial";
};

export type PublishedQuickActionContact = {
  service: string;
  purpose: string;
  value: string;
};

export const homeQuickActions: readonly HomeQuickAction[] = [
  { id: "pay_bill", title: "Pagar mi factura", description: "Accedé a tu cuenta y facturas.", icon: "$", destinationType: "external", href: "/medios-de-pago" },
  { id: "energy_outage", title: "Estoy sin energía", description: "Consultá el estado y la atención disponible.", icon: "!", destinationType: "internal", href: "/energia" },
  { id: "internet_interest", title: "Quiero Internet", description: "Consultá cobertura y opciones para tu conexión.", icon: "⌁", destinationType: "internal", href: "/internet#contratar", accent: "commercial" },
  { id: "funeral_service", title: "Servicio de Sepelio", description: "Accedé a información y atención prioritaria.", icon: "✦", destinationType: "internal", href: "/sepelio" },
] as const;

function isSafeExternalHref(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveHomeQuickActionHref(action: HomeQuickAction, contacts: readonly PublishedQuickActionContact[]) {
  if (action.id !== "pay_bill") return action.href;
  const virtualOffice = contacts.find((contact) => contact.service === "billing" && contact.purpose === "virtual_office");
  return virtualOffice && isSafeExternalHref(virtualOffice.value) ? virtualOffice.value : action.href;
}

export function quickActionAnalyticsMetadata(action: HomeQuickAction, href = action.href) {
  return {
    action_id: action.id,
    source: "home_quick_actions" as const,
    destination_type: href.startsWith("/") ? ("internal" as const) : action.destinationType,
  };
}
