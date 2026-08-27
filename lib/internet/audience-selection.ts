import type { JourneyEvent } from "../journey/types";

export const internetAudienceSelectedEvent = "coopsar:internet-audience-selected";
export const internetAudiences = ["hogar", "comercio", "empresa"] as const;
export type InternetAudience = (typeof internetAudiences)[number];

export function createInternetAudienceEvent(audience: InternetAudience, journeyId: string, sessionId: string): JourneyEvent {
  return { journeyId, sessionId, eventType: "internet_audience_selected", result: audience, page: "/internet", service: "internet" };
}
