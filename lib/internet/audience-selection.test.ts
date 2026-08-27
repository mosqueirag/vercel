import { describe, expect, it } from "vitest";
import { createInternetAudienceEvent, internetAudiences } from "./audience-selection";

describe("Internet audience selection", () => {
  it("keeps supported audiences explicit", () => {
    expect(internetAudiences).toEqual(["hogar", "comercio", "empresa"]);
  });

  it("creates a safe journey event without address or contact data", () => {
    expect(createInternetAudienceEvent("comercio", "journey-test", "session-test")).toEqual({
      journeyId: "journey-test", sessionId: "session-test", eventType: "internet_audience_selected", result: "comercio", page: "/internet", service: "internet",
    });
  });
});
