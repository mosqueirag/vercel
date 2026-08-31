import { describe, expect, it } from "vitest";
import {
  consumeInternetJourneyHandoff,
  createInternetJourneyHandoff,
  getInternetJourneyDestination,
  internetJourneyCanonicalHref,
  internetJourneyHandoffKey,
  internetJourneyHandoffTtlMs,
  saveInternetJourneyHandoff,
  saveInternetPlansHandoff,
  type PublicCoverageResult,
} from "./coverage-handoff";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

function coverage(overrides: Partial<PublicCoverageResult> = {}): PublicCoverageResult {
  return {
    coverageStatus: "available",
    coverageSource: "exact_address",
    technology: "FTTH",
    technologies: ["FTTH"],
    commercialAvailability: true,
    plans: [{ id: "plan-1", name: "Fibra", slug: "fibra", technology: "FTTH", speed_down_mbps: 300, price_amount: null, currency: "ARS" }],
    nextAction: "installation",
    message: "Cobertura confirmada.",
    zoneMatch: false,
    ...overrides,
  };
}

describe("Internet coverage journey handoff", () => {
  it("preserves a plan result in session storage and consumes it once", () => {
    const session = storage();
    const now = 1_700_000_000_000;
    const handoff = createInternetJourneyHandoff({ street: "España", number: "451", coverage: coverage(), createdAt: now });

    expect(handoff.destination).toBe("plans");
    saveInternetJourneyHandoff(session, handoff);
    expect(internetJourneyCanonicalHref).not.toContain("España");
    expect(internetJourneyCanonicalHref).not.toContain("451");
    expect(consumeInternetJourneyHandoff(session, now)).toEqual(handoff);
    expect(session.getItem(internetJourneyHandoffKey)).toBeNull();
    expect(consumeInternetJourneyHandoff(session, now)).toBeNull();
  });

  it("saves a Home plans handoff without putting the address in the destination URL", () => {
    const session = storage();
    const now = 1_700_000_000_000;
    const handoff = saveInternetPlansHandoff(session, { street: "Calle de prueba", number: "123", coverage: coverage(), createdAt: now });

    expect(handoff.destination).toBe("plans");
    expect(internetJourneyCanonicalHref).toBe("/internet#contratar");
    expect(internetJourneyCanonicalHref).not.toContain(handoff.street);
    expect(internetJourneyCanonicalHref).not.toContain(handoff.number);
    expect(consumeInternetJourneyHandoff(session, now)).toEqual(handoff);
  });

  it("routes no-plan results to waitlist or validation without a second coverage request", () => {
    const waitlist = coverage({ plans: [], commercialAvailability: false, coverageStatus: "unavailable", nextAction: "fiber_waitlist" });
    const validation = coverage({ plans: [], commercialAvailability: false, coverageStatus: "nearby", coverageSource: "nearby_address", nextAction: "coverage_validation" });
    expect(getInternetJourneyDestination(waitlist)).toBe("waitlist");
    expect(getInternetJourneyDestination(validation)).toBe("validation");
  });

  it("rejects expired or malformed handoffs and removes them", () => {
    const session = storage();
    const now = 1_700_000_000_000;
    const expired = createInternetJourneyHandoff({ street: "España", number: "451", coverage: coverage(), createdAt: now - internetJourneyHandoffTtlMs - 1 });
    saveInternetJourneyHandoff(session, expired);
    expect(consumeInternetJourneyHandoff(session, now)).toBeNull();
    session.setItem(internetJourneyHandoffKey, "not-json");
    expect(consumeInternetJourneyHandoff(session, now)).toBeNull();
    expect(session.getItem(internetJourneyHandoffKey)).toBeNull();
    session.setItem(internetJourneyHandoffKey, JSON.stringify({ ...createInternetJourneyHandoff({ street: "España", number: "451", coverage: coverage(), createdAt: now }), version: 2 }));
    expect(consumeInternetJourneyHandoff(session, now)).toBeNull();
  });

  it("does not accept a destination inconsistent with the official result", () => {
    const session = storage();
    const handoff = createInternetJourneyHandoff({ street: "España", number: "451", coverage: coverage() });
    saveInternetJourneyHandoff(session, { ...handoff, destination: "waitlist" });
    expect(consumeInternetJourneyHandoff(session)).toBeNull();
  });
});
