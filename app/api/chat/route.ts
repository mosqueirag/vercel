import OpenAI from "openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getAssistantKnowledge } from "../../../lib/data/public-content";
import { detectIntent, intentNames } from "../../../lib/ai/intents";
import { isJourneyId, isSessionId } from "../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../lib/journey/recorder";
import { configuredAiSessionLimit, consumeRateLimit } from "../../../lib/security/rate-limit";
import { coopiaContextMetadata, deriveCoopiaPageContext } from "../../../lib/coopia/page-context";

export const runtime = "nodejs";

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1200) })).min(1).max(8),
  journeyId: z.string().refine(isJourneyId),
  sessionId: z.string().refine(isSessionId),
  page: z.string().trim().max(160).default("/"),
  intent: z.enum(intentNames).optional(),
  service: z.enum(["billing", "internet", "fiber", "energy", "phone", "funeral", "general"]).optional(),
});

function fallbackAnswer(message: string) {
  const value = message.toLowerCase();
  if (/luz|energ|corte/.test(value)) return `**Te ayudamos con el servicio de energía**\n\nNo puedo consultar la información oficial en este momento. Podés reintentar más tarde o usar un canal publicado por COOPSAR.`;
  if (/internet|fibra|cobertura|plan/.test(value)) return `**Consultemos el servicio disponible**\n\nPodés ingresar tu domicilio en la consulta de cobertura. El sistema buscará el plan registrado para esa dirección o una altura cercana.\n\nLa disponibilidad final siempre requiere validación técnica.`;
  if (/factura|pagar|deuda/.test(value)) return `**Consultá o pagá tu factura**\n\nNo puedo consultar el canal oficial en este momento. Reintentá más tarde y no compartas contraseñas ni datos bancarios en este chat.`;
  if (/sepelio|funeral/.test(value)) return `**Estamos para acompañarte**\n\nNo puedo consultar el canal oficial en este momento. Reintentá más tarde o contactá a COOPSAR por un canal verificado.`;
  if (/persona|operador|whatsapp/.test(value)) return `**Podés hablar con nuestro equipo**\n\nNo puedo consultar un canal oficial en este momento. Reintentá más tarde.`;
  return `**Quiero orientarte correctamente**\n\nNo tengo información oficial suficiente para responder esa consulta con certeza. Puedo ayudarte con energía, facturas, internet, fibra, telefonía, sepelio o derivarte a un operador.`;
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "La consulta no tiene un formato válido." }, { status: 400 });
  const globalRate = await consumeRateLimit(request, "chat-ip", 12, 600);
  if (!globalRate.allowed) return Response.json({ error: globalRate.available ? "Demasiadas solicitudes. Intentá nuevamente en unos minutos." : "El servicio de protección no está disponible." }, { status: globalRate.available ? 429 : 503 });
  const limit = configuredAiSessionLimit();
  const sessionRate = await consumeRateLimit(request, "chat-session", limit, 3600, parsed.data.sessionId);
  if (!sessionRate.allowed) return Response.json({ error: sessionRate.available ? "session_limit" : "El servicio de protección no está disponible.", limit }, { status: sessionRate.available ? 429 : 503 });

  const latest = parsed.data.messages.at(-1)?.content || "";
  const detection = detectIntent(latest);
  const journey = { journeyId: parsed.data.journeyId, sessionId: parsed.data.sessionId, page: parsed.data.page, intent: detection.intent, service: detection.service };
  const pageContext = coopiaContextMetadata(deriveCoopiaPageContext(parsed.data.page));
  await Promise.all([
    recordJourneyEvent({ ...journey, eventType: "assistant_question_sent", agent: "coopia", metadata: { message_length: latest.length } }),
    recordJourneyEvent({ ...journey, eventType: "coopia_intent_detected", agent: "coopia", action: detection.suggestedAction, result: detection.intent, metadata: { confidence: detection.confidence, ...pageContext } }),
    recordJourneyEvent({ ...journey, eventType: "coopia_service_detected", agent: "coopia", result: detection.service, metadata: pageContext }),
  ]);
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  headers.set("X-COOPSAR-Journey-ID", parsed.data.journeyId);
  headers.set("X-COOPSAR-Session-ID", parsed.data.sessionId);

  if (!process.env.OPENAI_API_KEY) return new Response(fallbackAnswer(latest), { headers });

  try {
    const officialKnowledge = await getAssistantKnowledge(latest, detection.intent, detection.service);
    if (!officialKnowledge) return new Response(fallbackAnswer(latest), { headers });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
      stream: true,
      max_output_tokens: 260,
      instructions: `Sos COOPIA, asistencia oficial de COOPSAR. Respondé en español argentino, con tono amable, serio y claro, en 2 a 4 oraciones. Usá solamente la información oficial incluida; no inventes precios, cobertura, requisitos ni promesas, ni pidas datos sensibles. No muestres URLs salvo que la persona las pida y no repitas una acción que la interfaz ya resolvió; hacé como máximo una pregunta de seguimiento cuando sea indispensable.\n\nCONTEXTO OFICIAL PUBLICADO:\n${officialKnowledge}`,
      input: parsed.data.messages.map((message) => ({ role: message.role, content: message.content })),
    });
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        for await (const event of stream) if (event.type === "response.output_text.delta") controller.enqueue(encoder.encode(event.delta));
        controller.close();
      },
    });
    return new Response(body, { headers });
  } catch {
    console.error("COOPIA response failed");
    return Response.json({ error: "No pudimos responder ahora. Podés reintentar o continuar por WhatsApp." }, { status: 503 });
  }
}
