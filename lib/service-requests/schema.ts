import { z } from "zod";
import { isJourneyId, isSessionId } from "../journey/ids";
import { isServiceRequestType, serviceRequestConfigs } from "./config";

export const serviceRequestEnvelopeSchema = z.object({
  requestType: z.string().refine(isServiceRequestType), journeyId: z.string().refine(isJourneyId), sessionId: z.string().refine(isSessionId),
  fullName: z.string().trim().min(3).max(120), phone: z.string().trim().min(8).max(30), email: z.string().trim().email().max(160),
  payload: z.record(z.string(), z.string()), consent: z.literal(true), confirmed: z.literal(true), source: z.literal("coopia").default("coopia"),
});

export function parseServiceRequest(input: unknown) {
  const envelope = serviceRequestEnvelopeSchema.safeParse(input);
  if (!envelope.success) return { success: false as const, error: "invalid_request" as const };
  const config = serviceRequestConfigs[envelope.data.requestType];
  const payload = config.payloadSchema.safeParse(envelope.data.payload);
  if (!payload.success) return { success: false as const, error: "invalid_payload" as const };
  return { success: true as const, data: { ...envelope.data, requestType: envelope.data.requestType, payload: payload.data, service: config.service, nextStep: config.nextStep } };
}
