import type { AssistantIntent, AssistantService } from "../ai/intents";

export const procedureResolutionTypes = ["coopia", "official_link", "internal_route"] as const;
export type ProcedureResolutionType = (typeof procedureResolutionTypes)[number];

export type Procedure = {
  id: "ownership_change" | "new_supply" | "digital_invoice" | "payments" | "phone_service" | "funeral_service" | "funeral_family_update" | "human_handoff";
  title: string;
  description: string;
  icon: string;
  intent: AssistantIntent;
  service: AssistantService;
  resolutionType: ProcedureResolutionType;
  prompt?: string;
  href?: string;
};

/**
 * Operational capabilities, not a second CMS. Each entry points only to an
 * existing typed COOPIA journey, internal route, or published official link.
 */
export const procedures: readonly Procedure[] = [
  { id: "ownership_change", title: "Cambiar titularidad", description: "Orientación para continuar con el trámite.", icon: "↔", intent: "ownership_change", service: "general", resolutionType: "coopia", prompt: "Quiero cambiar titularidad" },
  { id: "new_supply", title: "Nuevo suministro", description: "Consultá cómo iniciar una nueva conexión.", icon: "+", intent: "new_supply", service: "energy", resolutionType: "coopia", prompt: "Quiero un nuevo suministro" },
  { id: "digital_invoice", title: "Factura digital", description: "Orientación para adherirte a la factura digital.", icon: "↓", intent: "digital_invoice", service: "billing", resolutionType: "coopia", prompt: "Quiero adherirme a la factura digital" },
  { id: "payments", title: "Facturas y pagos", description: "Accedé a tu canal oficial de facturación.", icon: "$", intent: "pay_invoice", service: "billing", resolutionType: "official_link" },
  { id: "phone_service", title: "Telefonía", description: "Información y orientación sobre el servicio.", icon: "☎", intent: "phone_service", service: "phone", resolutionType: "coopia", prompt: "Necesito información sobre telefonía" },
  { id: "funeral_service", title: "Servicio de Sepelio", description: "Información y atención prioritaria.", icon: "✦", intent: "funeral_service", service: "funeral", resolutionType: "internal_route", href: "/sepelio" },
  { id: "funeral_family_update", title: "Actualizar grupo familiar", description: "Iniciá la gestión privada de manera segura.", icon: "⌁", intent: "funeral_service", service: "funeral", resolutionType: "internal_route", href: "/sepelio/actualizar-grupo-familiar" },
  { id: "human_handoff", title: "Hablar con una persona", description: "Te orientamos hacia el canal oficial disponible.", icon: "◌", intent: "contact_operator", service: "general", resolutionType: "coopia", prompt: "Quiero hablar con una persona" },
] as const;

export function getProcedure(id: Procedure["id"]) {
  return procedures.find((procedure) => procedure.id === id);
}
