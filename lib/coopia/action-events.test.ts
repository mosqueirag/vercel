import { describe, expect, it } from "vitest";
import { coopiaActionEventTypes } from "./action-events";

describe("coopiaActionEventTypes", () => {
  it("records one generic click and one payment domain event", () => {
    expect(coopiaActionEventTypes("OPEN_VIRTUAL_OFFICE")).toEqual(["coopia_action_clicked", "payment_portal_opened"]);
  });

  it("does not duplicate the generic click event", () => {
    expect(coopiaActionEventTypes("SHOW_INTERNET_PLANS")).toEqual(["coopia_action_clicked"]);
  });
});
