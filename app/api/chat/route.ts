import OpenAI from "openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { CONTACT, knowledgeBase } from "../../../lib/coopsar-data";
import { detectIntent } from "../../../lib/ai/intents";
import { isJourneyId, isSessionId } from "../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../lib/journey/recorder";
import { configuredAiSessionLimit, consumeRateLimit } from "../../../lib/security/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1200) })).min(1).max(8),
  journeyId: z.string().refine(isJourneyId),
  sessionId: z.string().refine(isSessionId),
  page: z.string().trim().max(160).default("/"),
});

function fallbackAnswer(message: string) {
  const value = message.toLowerCase();
  if (/luz|energ|corte/.test(value)) return `**Te ayudamos con el servicio de energía**\n\nPara informar una falta de energía, comunicate con la guardia: **${CONTACT.energyGuard}**.\n\nLos cortes programados se informan únicamente cuando existe información confirmada.`;
  if (/internet|fibra|cobertura|plan/.test(value)) return `**Consultemos el servicio disponible**\n\nPodés ingresar tu domicilio en la consulta de cobertura. El sistema buscará el plan registrado para esa dirección o una altura cercana.\n\nLa disponibilidad final siempre requiere validación técnica.`;
  if (/factura|pagar|deuda/.test(value)) return `**Consultá o pagá tu factura**\n\nIngresá a la Oficina Virtual para revisar tu deuda, descargar facturas o realizar un pago.\n\nPor seguridad, no compartas contraseñas ni datos bancarios en este chat.`;
  if (/sepelio|funeral/.test(value)) return `**Estamos para acompañarte**\n\nPara recibir información confirmada sobre el Servicio Solidario o comunicar una urgencia, llamá al **${CONTACT.funeralGuard}**.`;
  if (/persona|operador|whatsapp/.test(value)) return `**Podés hablar con nuestro equipo**\n\nContinuá la atención por WhatsApp al **${CONTACT.whatsappDisplay}**. Vamos a derivar tu consulta para que una persona pueda ayudarte.`;
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
  await Promise.all([
    recordJourneyEvent({ ...journey, eventType: "assistant_question_sent", agent: "coopia", metadata: { message_length: latest.length } }),
    recordJourneyEvent({ ...journey, eventType: "intent_detected", agent: "coopia", action: detection.suggestedAction, result: detection.intent, metadata: { confidence: detection.confidence } }),
  ]);
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  headers.set("X-COOPSAR-Journey-ID", parsed.data.journeyId);
  headers.set("X-COOPSAR-Session-ID", parsed.data.sessionId);

  if (!process.env.OPENAI_API_KEY) return new Response(fallbackAnswer(latest), { headers });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
      stream: true,
      max_output_tokens: 450,
      instructions: `Sos COOPIA, agente oficial de ayuda y asistencia digital de COOPSAR. Mantené siempre ese rol. Respondé en español argentino con un tono amable, sereno, formal y profesional. Tratá al usuario con cercanía, sin exagerar confianza ni usar humor. Empezá por reconocer brevemente su necesidad y ofrecé una orientación concreta. Usá frases claras, cortas y accionables. Cuando ayude a la lectura, organizá la respuesta con un título breve en negrita, párrafos separados y listas con guiones. Mostrá las URLs completas y nunca uses tablas. Cerrá con una sola pregunta de seguimiento únicamente si es necesaria para avanzar. Usá exclusivamente la base oficial incluida. No inventes precios, cobertura, cortes, requisitos ni datos. No solicites DNI, contraseñas ni datos bancarios. Si falta información, decilo con honestidad y ofrecé un canal real. La capa de navegación detectó internamente la intención "${detection.intent}" y el servicio "${detection.service}"; usalos solamente para orientar la respuesta, sin mostrar etiquetas técnicas ni JSON.\n\nBASE OFICIAL:\n${knowledgeBase}`,
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
  } catch (error) {
    console.error("COOPIA response failed", error instanceof Error ? error.message : "unknown_error");
    return Response.json({ error: "No pudimos responder ahora. Podés reintentar o continuar por WhatsApp." }, { status: 503 });
  }
}
