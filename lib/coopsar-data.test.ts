import { describe, expect, it } from "vitest";
import { internetPlans, knowledgeBase, quickActions, serviceStatuses } from "./coopsar-data";
describe("COOPSAR official-data safeguards", () => {
  it("does not publish unconfirmed plan prices", () => expect(internetPlans.every((plan) => plan.price === null)).toBe(true));
  it("marks status data as unconfirmed by default", () => expect(serviceStatuses.every((service) => service.status === "unknown")).toBe(true));
  it("includes the main self-service actions", () => expect(quickActions.length).toBeGreaterThanOrEqual(10));
  it("instructs the assistant not to invent coverage", () => expect(knowledgeBase).toContain("Nunca afirmar cobertura"));
});
