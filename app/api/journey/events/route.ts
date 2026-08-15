import { NextRequest } from "next/server";
import { z } from "zod";
import { isJourneyId, isSessionId } from "../../../../lib/journey/ids";
import { recordJourneyEvent } from "../../../../lib/journey/recorder";
import { journeyEventTypes } from "../../../../lib/journey/types";

const publicEvents = ["journey_started", "page_viewed", "assistant_opened", "human_handoff_requested", "whatsapp_opened", "journey_abandoned"] as const;
const schema = z.object({
  journeyId: z.string().refine(isJourneyId),
  sessionId: z.string().refine(isSessionId),
  eventType: z.enum(publicEvents),
  page: z.string().trim().max(160).default("/"),
});
const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const rate = attempts.get(ip);
  if (rate && rate.reset > now && rate.count >= 30) return Response.json({ error: "rate_limit" }, { status: 429 });
  attempts.set(ip, { count: rate && rate.reset > now ? rate.count + 1 : 1, reset: now + 60_000 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !journeyEventTypes.includes(parsed.data.eventType)) return Response.json({ error: "invalid_event" }, { status: 400 });
  await recordJourneyEvent({ ...parsed.data, agent: "coopia" });
  return new Response(null, { status: 204 });
}
