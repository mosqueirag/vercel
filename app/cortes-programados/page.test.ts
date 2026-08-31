import { describe, expect, it } from "vitest";
import { scheduledAlertsPresentation } from "./page";

describe("scheduled cuts page", () => {
  it("distinguishes alerts, a confirmed empty state, and a failed read", () => {
    expect(scheduledAlertsPresentation({ alerts: [], error: false })).toMatchObject({ kind: "empty", message: "No hay avisos programados publicados en este momento." });
    expect(scheduledAlertsPresentation({ alerts: [], error: true })).toMatchObject({ kind: "error", message: "No pudimos confirmar los avisos programados en este momento." });
    expect(scheduledAlertsPresentation({ alerts: [{ title: "Mantenimiento", detail: null, status: "maintenance", publishedAt: null, startsAt: "2026-09-01T10:00:00Z", endsAt: null }], error: false })).toMatchObject({ kind: "alerts" });
  });
});
