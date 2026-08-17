import { z } from "zod";
import { getPublicContact, searchPublishedKnowledge } from "../data/public-content";
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
  description: "Consulta contenido oficial publicado en Supabase.",
  inputSchema: knowledgeSchema,
  execute: async (input, context) => instrument("searchKnowledgeBase", context, async () => {
    const matches = await searchPublishedKnowledge(input.query);
    return matches.length ? { ok: true, data: { content: matches.join("\n\n") } } : { ok: false, error: "unavailable" };
  }),
};

export const getContactInformation: ReadOnlyTool<typeof contactSchema, { channel: string; value: string }> = {
  name: "getContactInformation",
  description: "Devuelve un contacto oficial configurado.",
  inputSchema: contactSchema,
  execute: async ({ service }, context) => instrument("getContactInformation", context, async () => {
    const contact = await getPublicContact(service);
    return contact ? { ok: true, data: { channel: contact.label, value: contact.value } } : { ok: false, error: "unavailable" };
  }),
};

export const getPaymentInformation: ReadOnlyTool<typeof paymentSchema, { virtualOffice: string; notice: string }> = {
  name: "getPaymentInformation",
  description: "Devuelve el acceso oficial de pagos y facturas.",
  inputSchema: paymentSchema,
  execute: async (_input, context) => instrument("getPaymentInformation", context, async () => {
    const contact = await getPublicContact("billing", "virtual_office");
    return contact ? { ok: true, data: { virtualOffice: contact.value, notice: "No compartas contraseñas ni datos bancarios." } } : { ok: false, error: "unavailable" };
  }),
};

export const readOnlyTools = { searchKnowledgeBase, getContactInformation, getPaymentInformation } as const;
