import { describe, expect, it } from "vitest";
import { homeQuickActions, quickActionAnalyticsMetadata, resolveHomeQuickActionHref } from "./quick-actions";

describe("home quick actions", () => {
  it("defines exactly four primary needs with canonical destinations", () => {
    expect(homeQuickActions).toHaveLength(4);
    expect(homeQuickActions.find((action) => action.id === "internet_interest")?.href).toBe("/internet#contratar");
    const actionIds = homeQuickActions.map((action) => action.id) as readonly string[];
    expect(actionIds).not.toContain("fiber_coverage");
    expect(actionIds).not.toContain("change_holder");
    expect(homeQuickActions.find((action) => action.id === "funeral_service")?.href).toBe("/sepelio");
  });

  it("uses the published billing virtual-office contact and otherwise keeps a safe payment fallback", () => {
    const payment = homeQuickActions.find((action) => action.id === "pay_bill");
    if (!payment) throw new Error("Missing payment action");
    expect(resolveHomeQuickActionHref(payment, [{ service: "billing", purpose: "virtual_office", value: "https://official.example/pay" }])).toBe("https://official.example/pay");
    expect(resolveHomeQuickActionHref(payment, [])).toBe("/medios-de-pago");
    expect(resolveHomeQuickActionHref(payment, [{ service: "billing", purpose: "virtual_office", value: "javascript:alert('x')" }])).toBe("/medios-de-pago");
  });

  it("keeps tracking aggregate and free of personal data", () => {
    const metadata = quickActionAnalyticsMetadata(homeQuickActions[0]);
    expect(metadata).toEqual({ action_id: "pay_bill", source: "home_quick_actions", destination_type: "internal" });
    expect(Object.keys(metadata)).not.toEqual(expect.arrayContaining(["name", "dni", "email", "phone", "address", "message"]));
    expect(quickActionAnalyticsMetadata(homeQuickActions[0], "https://official.example/pay").destination_type).toBe("external");
    expect(quickActionAnalyticsMetadata(homeQuickActions[0], "/medios-de-pago").destination_type).toBe("internal");
  });
});
