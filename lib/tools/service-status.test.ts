import { describe, expect, it } from "vitest";
import { selectActiveServiceStatus } from "./service-status";
const now = new Date("2026-08-15T12:00:00Z");
describe("service alert selection", () => {
  it("ignores future alerts", () => expect(selectActiveServiceStatus([{ status: "outage", starts_at: "2026-08-16T00:00:00Z" }], now)).toBe("unknown"));
  it("ignores expired alerts", () => expect(selectActiveServiceStatus([{ status: "outage", ends_at: "2026-08-15T11:00:00Z" }], now)).toBe("unknown"));
  it("returns active alerts", () => expect(selectActiveServiceStatus([{ status: "maintenance", starts_at: "2026-08-15T10:00:00Z" }], now)).toBe("maintenance"));
  it("uses priority", () => expect(selectActiveServiceStatus([{ status: "operational" }, { status: "partial" }, { status: "outage" }], now)).toBe("outage"));
  it("returns unknown without data", () => expect(selectActiveServiceStatus([], now)).toBe("unknown"));
  it("ignores unpublished alerts", () => expect(selectActiveServiceStatus([{ status: "outage", published: false }], now)).toBe("unknown"));
});
