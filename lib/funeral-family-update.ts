import { z } from "zod";

export const funeralRequestStatuses = ["new", "in_review", "waiting_customer", "approved", "rejected", "completed", "cancelled"] as const;
export type FuneralRequestStatus = (typeof funeralRequestStatuses)[number];
export const funeralRelationships = ["spouse", "cohabitant", "child", "parent", "other"] as const;
export type FuneralRelationship = (typeof funeralRelationships)[number];

const dni = z.string().trim().regex(/^\d{7,8}$/);
const phone = z.string().trim().min(8).max(30).regex(/^[+\d()\s-]+$/);
export const funeralMemberSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  dni,
  birthDate: z.string().date(),
  relationship: z.enum(funeralRelationships),
});

export const funeralFamilyUpdateSchema = z.object({
  memberNumber: z.string().trim().min(1).max(80),
  holderFullName: z.string().trim().min(3).max(120),
  holderDni: dni,
  phone,
  email: z.string().trim().email().max(150).optional().or(z.literal("")),
  consent: z.literal(true),
  members: z.array(funeralMemberSchema).min(1).max(10),
  journeyId: z.string().max(80).optional(),
  sessionId: z.string().max(80).optional(),
}).refine((value) => Boolean(value.journeyId) === Boolean(value.sessionId), { message: "El recorrido debe incluir sesión." });

export type FuneralFamilyUpdateInput = z.infer<typeof funeralFamilyUpdateSchema>;

export function maskDni(value: string) {
  return value.length < 4 ? "••••" : `••••${value.slice(-4)}`;
}

export function maskPhone(value: string) {
  const compact = value.replace(/\s/g, "");
  return compact.length < 4 ? "••••" : `••••${compact.slice(-4)}`;
}

export function funeralStatusLabel(status: FuneralRequestStatus) {
  return ({ new: "Nueva", in_review: "En revisión", waiting_customer: "Esperando información", approved: "Aprobada", rejected: "Rechazada", completed: "Completada", cancelled: "Cancelada" })[status];
}

export function funeralRelationshipLabel(relationship: FuneralRelationship) {
  return ({ spouse: "Cónyuge", cohabitant: "Conviviente", child: "Hijo/a", parent: "Padre/madre", other: "Otro" })[relationship];
}
