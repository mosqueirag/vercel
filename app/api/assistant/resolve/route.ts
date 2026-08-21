import { NextRequest } from "next/server";
import { z } from "zod";
import { detectIntent, intentNames } from "../../../../lib/ai/intents";
import { resolveAssistantResult } from "../../../../lib/ai/resolver";
import { isJourneyId, isSessionId } from "../../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../../lib/journey/recorder";
import { resolveAssistantTool } from "../../../../lib/tools/catalog";
import { coopiaContextMetadata, deriveCoopiaPageContext } from "../../../../lib/coopia/page-context";

const schema = z.object({ message: z.string().trim().min(1).max(1200), journeyId: z.string().refine(isJourneyId), sessionId: z.string().refine(isSessionId), page: z.string().max(160).default("/"), intent: z.enum(intentNames).optional(), service: z.enum(["billing", "internet", "fiber", "energy", "phone", "funeral", "general"]).optional() });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  const detection = detectIntent(parsed.data.message);
  const context = { journeyId: parsed.data.journeyId, sessionId: parsed.data.sessionId, page: parsed.data.page, intent: detection.intent, service: detection.service };
  const pageContext = coopiaContextMetadata(deriveCoopiaPageContext(parsed.data.page));
  const tool = await resolveAssistantTool(detection, context);
  const result = await resolveAssistantResult(detection, parsed.data.journeyId, tool);
  if (detection.intent === "resolve_complaint" || detection.intent === "internet_problem" || detection.intent === "energy_problem") {
    await recordJourneyEvent({ ...context, eventType: "complaint_intent_detected", agent: "coopia" });
    if (result.complaintRoute) await recordJourneyEvent({ ...context, eventType: "complaint_route_resolved", agent: "coopia", result: result.complaintRoute.routingWindow, metadata: { routingWindow: result.complaintRoute.routingWindow, contactPurpose: result.complaintRoute.contactPurpose } });
  }
  if (result.ui) await recordJourneyEvent({ ...context, eventType: "navigation_recommended", agent: "coopia", action: result.ui.type, result: detection.intent, metadata: pageContext });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
