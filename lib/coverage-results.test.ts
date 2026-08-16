import { describe, expect, it } from "vitest";
import { selectCoverage } from "./coverage-results";

const row = (number: number, status: "available" | "nearby" | "planned" | "unavailable" | "unknown") => ({ street_number: number, plan_name: "Plan", technology: "fiber", coverage_status: status });

describe("coverage selection", () => {
  it("keeps the exact record status", () => expect(selectCoverage([row(100, "planned")], 100).status).toBe("planned"));
  it("never upgrades a nearby record to available", () => expect(selectCoverage([row(100, "available")], 110).status).toBe("nearby"));
  it.each(["planned", "unavailable", "unknown"] as const)("keeps exact %s", (status) => expect(selectCoverage([row(100, status)], 100).status).toBe(status));
  it("is deterministic for equidistant rows", () => expect(selectCoverage([row(102, "available"), row(98, "unavailable")], 100).nearest[0].street_number).toBe(98));
});
