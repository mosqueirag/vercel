import { describe, expect, it } from "vitest";
import { parseServiceRequest } from "./schema";
import { createServiceRequestNumber } from "./request-number";
const base = { requestType: "digital_invoice", journeyId: "JRN-2026-ABCDEF12", sessionId: "SES-ABCDEF1234567890", fullName: "Persona Test", phone: "2974000000", email: "test@example.com", payload: { accountNumber: "123" }, consent: true, confirmed: true, source: "coopia" };
describe("service request contract", () => {
  it("accepts an allow-listed payload", () => expect(parseServiceRequest(base).success).toBe(true));
  it("requires explicit confirmation", () => expect(parseServiceRequest({ ...base, confirmed: false }).success).toBe(false));
  it("rejects extra payload fields", () => expect(parseServiceRequest({ ...base, payload: { accountNumber: "123", role: "admin" } }).success).toBe(false));
  it("creates a non-sequential public number", () => expect(createServiceRequestNumber(new Date("2026-01-01"), "abcdef12-0000-0000-0000-000000000000")).toBe("SRV-2026-ABCDEF12"));
});
