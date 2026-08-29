import { z } from "zod";

export const funeralRequestStatuses = ["new", "in_review", "waiting_customer", "approved", "rejected", "completed", "cancelled"] as const;
export type FuneralRequestStatus = (typeof funeralRequestStatuses)[number];
export const funeralRelationships = ["spouse", "cohabitant", "child", "parent", "other"] as const;
export type FuneralRelationship = (typeof funeralRelationships)[number];

const dni = z.string().trim().regex(/^\d{7,8}$/);
const phone = z.string().trim().min(8).max(30).regex(/^[+\d()\s-]+$/);
const birthDate = z.string().date().refine((value) => new Date(`${value}T00:00:00.000Z`) <= new Date(), {
  message: "La fecha de nacimiento no puede ser futura.",
});
export const funeralMemberSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  dni,
  birthDate,
  relationship: z.enum(funeralRelationships),
});

export const funeralFamilyUpdateSchema = z.object({
  uploadId: z.string().uuid(),
  memberNumber: z.string().trim().min(1).max(80),
  holderFullName: z.string().trim().min(3).max(120),
  holderDni: dni,
  phone,
  email: z.string().trim().min(1, "Ingresá un correo electrónico válido.").email("Ingresá un correo electrónico válido.").max(150),
  consent: z.literal(true),
  members: z.array(funeralMemberSchema).min(1).max(10),
  journeyId: z.string().max(80).optional(),
  sessionId: z.string().max(80).optional(),
}).refine((value) => Boolean(value.journeyId) === Boolean(value.sessionId), { message: "El recorrido debe incluir sesión." });

export type FuneralFamilyUpdateInput = z.infer<typeof funeralFamilyUpdateSchema>;

export type FuneralStepErrors = Record<string, string>;

type HolderFields = Pick<FuneralFamilyUpdateInput, "memberNumber" | "holderFullName" | "holderDni" | "phone" | "email">;
type MemberFields = FuneralFamilyUpdateInput["members"][number];

export function validateHolderStep(holder: HolderFields): FuneralStepErrors {
  const errors: FuneralStepErrors = {};
  if (!holder.memberNumber.trim()) errors.memberNumber = "Ingresá el número de asociado o referencia.";
  if (holder.holderFullName.trim().length < 3) errors.holderFullName = "Ingresá nombre y apellido.";
  if (!/^\d{7,8}$/.test(holder.holderDni.trim())) errors.holderDni = "El DNI debe tener 7 u 8 números.";
  if (!phone.safeParse(holder.phone).success) errors.phone = "Ingresá un teléfono.";
  if (!z.string().trim().min(1).email().max(150).safeParse(holder.email).success) errors.email = "Ingresá un correo electrónico válido.";
  return errors;
}

export function validateMembersStep(members: MemberFields[]): FuneralStepErrors {
  const errors: FuneralStepErrors = {};
  members.forEach((member, index) => {
    const prefix = `member-${index}`;
    if (member.fullName.trim().length < 3) errors[`${prefix}-fullName`] = "Ingresá nombre y apellido.";
    if (!/^\d{7,8}$/.test(member.dni.trim())) errors[`${prefix}-dni`] = "El DNI debe tener 7 u 8 números.";
    if (!member.birthDate) errors[`${prefix}-birthDate`] = "Ingresá la fecha de nacimiento.";
    else if (!birthDate.safeParse(member.birthDate).success) errors[`${prefix}-birthDate`] = "La fecha de nacimiento no puede ser futura.";
    if (!funeralRelationships.includes(member.relationship)) errors[`${prefix}-relationship`] = "Elegí una relación válida.";
  });
  return errors;
}

export function validateDocumentsStep(frontUploaded: boolean, backUploaded: boolean, selected: boolean): FuneralStepErrors {
  const errors: FuneralStepErrors = {};
  if (!frontUploaded) errors.front = "Cargá el frente del DNI.";
  if (!backUploaded) errors.back = "Cargá el dorso del DNI.";
  if (selected && (!frontUploaded || !backUploaded)) errors.documents = "Cargá la documentación antes de continuar.";
  return errors;
}

export function validateConfirmationStep(consent: boolean): FuneralStepErrors {
  return consent ? {} : { consent: "Necesitamos tu autorización para gestionar los datos y la documentación de esta solicitud." };
}

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
