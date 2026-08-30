import { describe, expect, it } from "vitest";
import { homeQuickActions, quickActionAnalyticsMetadata, resolveHomeQuickActionHref } from "./quick-actions";

describe("home quick actions", () => {
  it("defines exactly six direct needs with canonical destinations", () => {
    expect(homeQuickActions).toHaveLength(6);
    expect(homeQuickActions.find((action) => action.id === "internet_interest")?.href).toBe("/internet#contratar");
    expect(homeQuickActions.find((action) => action.id === "fiber_coverage")?.href).toBe("/internet#contratar");
    expect(homeQuickActions.find((action) => action.id === "fiber_coverage")?.href).not.toBe("/fibra-optica");
    expect(homeQuickActions.find((action) => action.id === "change_holder")?.href).toBe("/tramites");
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
