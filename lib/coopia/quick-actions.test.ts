import { describe, expect, it } from "vitest";
import { getCoopiaQuickActions } from "./quick-actions";

describe("getCoopiaQuickActions", () => {
  it("prioritizes contextual internet help without duplicating actions", () => {
    const actions = getCoopiaQuickActions({ pathname: "/internet", pageType: "service", pageTitle: "Internet", service: "internet" });
    expect(actions[0]?.label).toBe("Consultar cobertura");
    expect(actions.filter((action) => action.label === "Consultar cobertura")).toHaveLength(1);
    expect(actions.length).toBeLessThanOrEqual(6);
  });
});
