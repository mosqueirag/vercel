import { describe, expect, it } from "vitest";
import { coopiaActionEventTypes, humanHandoffActionEventTypes } from "./action-events";

describe("coopiaActionEventTypes", () => {
  it("records one generic click and one payment domain event", () => {
    expect(coopiaActionEventTypes("OPEN_VIRTUAL_OFFICE")).toEqual(["coopia_action_clicked", "payment_portal_opened"]);
  });

  it("does not duplicate the generic click event", () => {
    expect(coopiaActionEventTypes("SHOW_INTERNET_PLANS")).toEqual(["coopia_action_clicked"]);
  });

  it("uses one canonical click plus the functional handoff events", () => {
    const events = humanHandoffActionEventTypes();
    expect(events.filter((event) => event === "coopia_action_clicked")).toHaveLength(1);
    expect(events).toEqual(["coopia_action_clicked", "whatsapp_opened", "human_handoff_requested", "human_handoff_opened", "coopia_handoff"]);
  });
});
