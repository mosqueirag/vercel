import { z } from "zod";
import { serviceRequestConfigs, type ServiceRequestType } from "../service-requests/config";
import type { AssistantToolName } from "./catalog";

export type WriteToolDefinition = {
  name: AssistantToolName;
  requestType: ServiceRequestType | "human_handoff";
  kind: "write";
  requiresConfirmation: true;
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
  errors: readonly ["invalid_input", "confirmation_required", "rate_limit", "unavailable"];
};
const outputSchema = z.object({ requestNumber: z.string().regex(/^SRV-\d{4}-[A-F0-9]{8}$/), status: z.literal("new"), nextStep: z.string() });
const errors = ["invalid_input", "confirmation_required", "rate_limit", "unavailable"] as const;
function requestTool(name: AssistantToolName, requestType: ServiceRequestType): WriteToolDefinition { return { name, requestType, kind: "write", requiresConfirmation: true, inputSchema: serviceRequestConfigs[requestType].payloadSchema, outputSchema, errors }; }

export const writeToolDefinitions = {
  createComplaint: requestTool("createComplaint", "complaint"),
  createOwnershipChangeRequest: requestTool("createOwnershipChangeRequest", "ownership_change"),
  createNewSupplyRequest: requestTool("createNewSupplyRequest", "new_supply"),
  createDigitalInvoiceRequest: requestTool("createDigitalInvoiceRequest", "digital_invoice"),
  createPhoneRequest: requestTool("createPhoneRequest", "phone_request"),
  requestHumanHandoff: { name: "requestHumanHandoff", requestType: "human_handoff", kind: "write", requiresConfirmation: true, inputSchema: z.object({ channel: z.enum(["whatsapp", "phone"]) }), outputSchema: z.object({ channel: z.string(), ready: z.literal(true) }), errors },
} as const satisfies Record<string, WriteToolDefinition>;
