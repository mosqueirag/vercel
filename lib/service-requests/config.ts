import { z } from "zod";
import type { AssistantAction } from "../ai/results";
import type { AssistantService } from "../ai/intents";

export const serviceRequestTypes = ["complaint", "ownership_change", "new_supply", "digital_invoice", "phone_request"] as const;
export type ServiceRequestType = (typeof serviceRequestTypes)[number];
export type RequestField = { name: string; label: string; type: "text" | "textarea"; required: boolean; maxLength: number };
type Config = { title: string; service: AssistantService; startAction: AssistantAction; submitAction: AssistantAction; fields: readonly RequestField[]; payloadSchema: z.ZodType<Record<string, string>>; nextStep: string };
const field = (name: string, label: string, type: RequestField["type"] = "text", maxLength = 160): RequestField => ({ name, label, type, required: true, maxLength });
const strictObject = (shape: Record<string, z.ZodString>) => z.strictObject(shape);

export const serviceRequestConfigs: Record<ServiceRequestType, Config> = {
  complaint: { title: "Iniciar un reclamo", service: "general", startAction: "START_COMPLAINT", submitAction: "SUBMIT_COMPLAINT", fields: [field("category", "Motivo"), field("description", "Contanos brevemente qué ocurrió", "textarea", 600)], payloadSchema: strictObject({ category: z.string().trim().min(2).max(80), description: z.string().trim().min(10).max(600) }), nextStep: "COOPSAR revisará el reclamo y se comunicará por los datos informados." },
  ownership_change: { title: "Cambio de titularidad", service: "general", startAction: "START_OWNERSHIP_CHANGE", submitAction: "SUBMIT_OWNERSHIP_CHANGE", fields: [field("accountNumber", "Número de asociado o cuenta"), field("currentHolder", "Titular actual"), field("newHolder", "Nuevo titular")], payloadSchema: strictObject({ accountNumber: z.string().trim().min(2).max(60), currentHolder: z.string().trim().min(3).max(120), newHolder: z.string().trim().min(3).max(120) }), nextStep: "El equipo verificará la cuenta y te informará la documentación necesaria." },
  new_supply: { title: "Nueva conexión de energía", service: "energy", startAction: "START_NEW_SUPPLY", submitAction: "SUBMIT_NEW_SUPPLY", fields: [field("address", "Domicilio de la conexión"), field("propertyType", "Tipo de inmueble")], payloadSchema: strictObject({ address: z.string().trim().min(5).max(200), propertyType: z.string().trim().min(2).max(80) }), nextStep: "COOPSAR evaluará la factibilidad y te indicará requisitos y próximos pasos." },
  digital_invoice: { title: "Adhesión a factura digital", service: "billing", startAction: "START_DIGITAL_INVOICE", submitAction: "SUBMIT_DIGITAL_INVOICE", fields: [field("accountNumber", "Número de asociado o cuenta")], payloadSchema: strictObject({ accountNumber: z.string().trim().min(2).max(60) }), nextStep: "El equipo validará la cuenta y confirmará la adhesión por correo electrónico." },
  phone_request: { title: "Solicitud de telefonía", service: "phone", startAction: "START_PHONE_REQUEST", submitAction: "SUBMIT_PHONE_REQUEST", fields: [field("address", "Domicilio"), field("requestReason", "Tipo de consulta")], payloadSchema: strictObject({ address: z.string().trim().min(5).max(200), requestReason: z.string().trim().min(3).max(120) }), nextStep: "El área de telefonía revisará la solicitud y se comunicará con vos." },
};

export function isServiceRequestType(value: string): value is ServiceRequestType { return serviceRequestTypes.includes(value as ServiceRequestType); }
