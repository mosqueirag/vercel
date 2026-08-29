import { describe, expect, it } from "vitest";
import { funeralFamilyUpdateSchema, funeralRelationshipLabel, validateHolderStep, validateMembersStep } from "./funeral-family-update";

describe("funeral relationship presentation", () => {
  it("uses human Spanish labels without changing stored values", () => {
    expect(funeralRelationshipLabel("spouse")).toBe("Cónyuge");
    expect(funeralRelationshipLabel("cohabitant")).toBe("Conviviente");
    expect(funeralRelationshipLabel("child")).toBe("Hijo/a");
    expect(funeralRelationshipLabel("parent")).toBe("Padre/madre");
    expect(funeralRelationshipLabel("other")).toBe("Otro");
  });
});

describe("family update step validation", () => {
  const holder = { memberNumber: "TEST-0001", holderFullName: "Titular Sintético", holderDni: "12345678", phone: "0000000000", email: "titular@example.com" };

  it("requires a valid email before the holder step can continue", () => {
    expect(validateHolderStep({ ...holder, email: "" }).email).toBe("Ingresá un correo electrónico válido.");
    expect(validateHolderStep({ ...holder, email: "correo-invalido" }).email).toBe("Ingresá un correo electrónico válido.");
    expect(validateHolderStep(holder)).toEqual({});
  });

  it("keeps members on their step until each required field is valid", () => {
    expect(validateMembersStep([{ fullName: "", dni: "12", birthDate: "", relationship: "other" }])).toMatchObject({
      "member-0-fullName": "Ingresá nombre y apellido.",
      "member-0-dni": "El DNI debe tener 7 u 8 números.",
      "member-0-birthDate": "Ingresá la fecha de nacimiento.",
    });
    expect(validateMembersStep([{ fullName: "Integrante Sintético", dni: "1234567", birthDate: "2000-01-01", relationship: "other" }])).toEqual({});
  });

  it("rejects absent, empty, invalid email and a future birth date at the API schema boundary", () => {
    const value = { uploadId: "11111111-1111-4111-8111-111111111111", memberNumber: "TEST-0001", holderFullName: "Titular Sintético", holderDni: "12345678", phone: "0000000000", email: "titular@example.com", consent: true, members: [{ fullName: "Integrante Sintético", dni: "87654321", birthDate: "2000-01-01", relationship: "other" }], journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78" };
    expect(funeralFamilyUpdateSchema.safeParse({ ...value, email: undefined }).success).toBe(false);
    expect(funeralFamilyUpdateSchema.safeParse({ ...value, email: "" }).success).toBe(false);
    expect(funeralFamilyUpdateSchema.safeParse({ ...value, email: "invalido" }).success).toBe(false);
    expect(funeralFamilyUpdateSchema.safeParse({ ...value, members: [{ ...value.members[0], birthDate: "2999-01-01" }] }).success).toBe(false);
    expect(funeralFamilyUpdateSchema.safeParse(value).success).toBe(true);
  });
});
