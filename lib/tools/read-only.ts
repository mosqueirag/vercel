import { z } from "zod";
import { CONTACT, knowledgeBase } from "../coopsar-data";
import { recordJourneyEvent } from "../journey/recorder";
import type { JourneyContext } from "../journey/types";
import type { ReadOnlyTool, ToolResult } from "./types";

async function instrument<T>(name: string, context: JourneyContext, run: () => Promise<ToolResult<T>>) {
  const started = Date.now();
  await recordJourneyEvent({ ...context, eventType: "tool_started", tool: name });
  try {
    const result = await run();
    await recordJourneyEvent({ ...context, eventType: result.ok ? "tool_completed" : "tool_failed", tool: name, result: result.ok ? "success" : result.error, durationMs: Date.now() - started });
    return result;
  } catch {
    await recordJourneyEvent({ ...context, eventType: "tool_failed", tool: name, result: "unavailable", durationMs: Date.now() - started });
    return { ok: false, error: "unavailable" } as const;
  }
}

const knowledgeSchema = z.object({ query: z.string().trim().min(2).max(120) });
const contactSchema = z.object({ service: z.enum(["general", "energy", "internet", "funeral"]) });
const paymentSchema = z.object({});

export const searchKnowledgeBase: ReadOnlyTool<typeof knowledgeSchema, { content: string }> = {
  name: "searchKnowledgeBase",
  description: "Consulta la base oficial local sin acceso SQL.",
  inputSchema: knowledgeSchema,
  execute: async (input, context) => instrument("searchKnowledgeBase", context, async () => ({ ok: true, data: { content: knowledgeBase.includes(input.query) ? knowledgeBase : knowledgeBase } })),
};

export const getContactInformation: ReadOnlyTool<typeof contactSchema, { channel: string; value: string }> = {
  name: "getContactInformation",
  description: "Devuelve un contacto oficial configurado.",
  inputSchema: contactSchema,
  execute: async ({ service }, context) => instrument("getContactInformation", context, async () => {
    const values = { general: CONTACT.whatsappDisplay, energy: CONTACT.energyGuard, internet: CONTACT.internetSupport, funeral: CONTACT.funeralGuard };
    return { ok: true, data: { channel: service === "general" ? "WhatsApp" : "Teléfono", value: values[service] } };
  }),
};

export const getPaymentInformation: ReadOnlyTool<typeof paymentSchema, { virtualOffice: string; notice: string }> = {
  name: "getPaymentInformation",
  description: "Devuelve el acceso oficial de pagos y facturas.",
  inputSchema: paymentSchema,
  execute: async (_input, context) => instrument("getPaymentInformation", context, async () => ({ ok: true, data: { virtualOffice: CONTACT.virtualOffice, notice: "No compartas contraseñas ni datos bancarios." } })),
};

export const readOnlyTools = { searchKnowledgeBase, getContactInformation, getPaymentInformation } as const;
