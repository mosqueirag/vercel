import { describe, expect, it } from "vitest";
import { homeQuickActions } from "./quick-actions";
import { homePriorityAnalyticsMetadata, homePriorityEventKey, prioritizeHomeQuickActions, resolveHomePriority } from "./home-priority";

describe("Home priority", () => {
  const ids = (intent?: Parameters<typeof resolveHomePriority>[0], service?: Parameters<typeof resolveHomePriority>[1]) => prioritizeHomeQuickActions(homeQuickActions, resolveHomePriority(intent, service).quickAction).map((action) => action.id);

  it("keeps the approved order without a current intent or for a general question", () => {
    expect(ids()).toEqual(["pay_bill", "energy_outage", "internet_interest", "funeral_service"]);
    expect(ids("general_question", "general")).toEqual(["pay_bill", "energy_outage", "internet_interest", "funeral_service"]);
  });

  it("prioritizes payment, energy, commercial Internet, coverage and Sepelio deterministically", () => {
    expect(ids("pay_invoice", "billing")[0]).toBe("pay_bill");
    expect(ids("energy_problem", "energy")[0]).toBe("energy_outage");
    for (const intent of ["internet_signup", "fiber_signup", "fiber_coverage", "internet_plans", "fiber_waitlist"] as const) expect(ids(intent, intent.startsWith("fiber") ? "fiber" : "internet")[0]).toBe("internet_interest");
    expect(ids("funeral_service", "funeral")[0]).toBe("funeral_service");
  });

  it("uses the right continuation for Internet interest, fiber interest and coverage", () => {
    expect(resolveHomePriority("internet_signup", "internet").contextualPanel).toBe("internet_signup");
    expect(resolveHomePriority("fiber_signup", "fiber").contextualPanel).toBe("fiber_signup");
    expect(resolveHomePriority("fiber_coverage", "fiber").contextualPanel).toBe("fiber_coverage");
  });

  it("keeps Internet support out of the commercial priority and preserves its support continuation", () => {
    const priority = resolveHomePriority("internet_problem", "internet");
    expect(priority.quickAction).toBeUndefined();
    expect(priority.contextualPanel).toBe("internet_problem");
    expect(ids("internet_problem", "internet")).toEqual(["pay_bill", "energy_outage", "internet_interest", "funeral_service"]);
  });

  it("does not reintroduce ownership change and switches immediately to the current intent", () => {
    expect(resolveHomePriority("ownership_change", "general").quickAction).toBeUndefined();
    expect(ids("energy_problem", "energy")[0]).toBe("energy_outage");
    expect(ids("internet_signup", "internet")[0]).toBe("internet_interest");
    expect(resolveHomePriority("internet_problem", "internet").quickAction).toBeUndefined();
    expect(resolveHomePriority("new_supply", "energy").contextualPanel).toBeUndefined();
  });

  it("does not retain a stale priority after an intent changes in the same journey", () => {
    expect(resolveHomePriority("energy_problem", "energy").quickAction).toBe("energy_outage");
    expect(resolveHomePriority("internet_signup", "internet").quickAction).toBe("internet_interest");
    const support = resolveHomePriority("internet_problem", "internet");
    expect(support.quickAction).toBeUndefined();
    expect(support.contextualPanel).toBe("internet_problem");
  });

  it("keeps analytics aggregate and free of personal data", () => {
    const metadata = homePriorityAnalyticsMetadata("internet_interest");
    expect(metadata).toEqual({ priority_action: "internet_interest", source: "navigation_context" });
    expect(Object.keys(metadata)).not.toEqual(expect.arrayContaining(["name", "dni", "email", "phone", "address", "message"]));
    expect(homePriorityEventKey("JRN-2026-AB12CD34", "internet_signup", "internet_interest")).toBe("JRN-2026-AB12CD34:internet_signup:internet_interest");
  });
});
