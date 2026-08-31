import { describe, expect, it } from "vitest";
import { selectActiveServiceStatus } from "./service-alerts";

const now = new Date("2026-08-31T12:00:00Z");
describe("public service-alert read model", () => {
  it.each([
    ["outage", "outage"], ["partial", "partial"], ["maintenance", "maintenance"], ["operational", "operational"],
  ] as const)("keeps the official %s status", (input, expected) => expect(selectActiveServiceStatus([{ status: input }], now)).toBe(expected));
  it("uses unknown when there are no official alerts", () => expect(selectActiveServiceStatus([], now)).toBe("unknown"));
  it("does not treat a future maintenance notice as active", () => expect(selectActiveServiceStatus([{ status: "maintenance", starts_at: "2026-09-01T12:00:00Z" }], now)).toBe("unknown"));
});
