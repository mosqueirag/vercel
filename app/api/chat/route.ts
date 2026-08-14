import OpenAI from "openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { CONTACT, knowledgeBase } from "../../../lib/coopsar-data";

export const runtime = "nodejs";

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1200) })).min(1).max(8),
});
const attempts = new Map<string, { count: number; reset: number }>();

function fallbackAnswer(message: string) {
  const value = message.toLowerCase();
  if (/luz|energ|corte/.test(value)) return `Para informar una falta de energía llamá a la guardia ${CONTACT.energyGuard}. Los cortes programados solo se muestran cuando existe información confirmada.`;
  if (/internet|fibra|cobertura|plan/.test(value)) return `Podemos registrar tu interés y solicitar una evaluación de cobertura. Las velocidades, precios y disponibilidad están pendientes de confirmación. Usá el botón “Consultar cobertura” o WhatsApp.`;
  if (/factura|pagar|deuda/.test(value)) return `Podés consultar, descargar o pagar tu factura desde la Oficina Virtual. No compartas contraseñas ni datos bancarios por este chat.`;
  if (/sepelio|funeral/.test(value)) return `El Servicio Solidario acompaña a las familias. Para información confirmada o una urgencia, comunicate al ${CONTACT.funeralGuard}.`;
  if (/persona|operador|whatsapp/.test(value)) return `Podés continuar con una persona por WhatsApp al ${CONTACT.whatsappDisplay}.`;
  return `No tengo información oficial suficiente para responder con certeza. Puedo orientarte sobre energía, facturas, internet, fibra, telefonía, sepelio o derivarte a WhatsApp.`;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const rate = attempts.get(ip);
  if (rate && rate.reset > now && rate.count >= 12) return Response.json({ error: "Demasiadas solicitudes. Intentá nuevamente en unos minutos." }, { status: 429 });
  attempts.set(ip, { count: rate && rate.reset > now ? rate.count + 1 : 1, reset: now + 10 * 60_000 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "La consulta no tiene un formato válido." }, { status: 400 });

  const sessionCount = Number(request.cookies.get("coopsar_ai_count")?.value || "0");
  const limit = Math.max(0, Number(process.env.AI_SESSION_LIMIT || 2));
  if (sessionCount >= limit) return Response.json({ error: "session_limit", limit }, { status: 429 });

  const latest = parsed.data.messages.at(-1)?.content || "";
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  headers.append("Set-Cookie", `coopsar_ai_count=${sessionCount + 1}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);

  if (!process.env.OPENAI_API_KEY) return new Response(fallbackAnswer(latest), { headers });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
      stream: true,
      max_output_tokens: 450,
      instructions: `Sos COOPIA, asistente digital de COOPSAR. Respondé en español argentino, con claridad y frases cortas. Usá exclusivamente la base oficial incluida. Hacé una sola pregunta de seguimiento cuando sea necesaria. No inventes precios, cobertura, cortes, requisitos ni datos. No solicites DNI, contraseñas ni datos bancarios. Si falta información, decilo y ofrecé un canal real.\n\nBASE OFICIAL:\n${knowledgeBase}`,
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
