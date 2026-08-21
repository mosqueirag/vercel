import { describe, expect, it } from "vitest";
import { compactMessages, coopiaEventMetadata, coopiaRequestContext, handoffSummary, isPublicCoopiaPath, parseCoopiaSession, shouldRecordPageView } from "./session";

describe("COOPIA session state", () => {
  it("keeps one bounded temporal conversation", () => expect(compactMessages(Array.from({ length: 10 }, (_, index) => ({ role: index % 2 ? "assistant" as const : "user" as const, content: String(index) })))).toHaveLength(8));
  it("rejects malformed persisted state", () => expect(parseCoopiaSession('{"messages":[]}')).toBeNull());
  it("does not duplicate page views", () => { expect(shouldRecordPageView(["/internet"], "/internet")).toBe(false); expect(shouldRecordPageView(["/internet"], "/energia")).toBe(true); });
  it("keeps feedback metadata free of conversation text", () => expect(coopiaEventMetadata({ helpful: false, uiType: "fiber_coverage", lastStep: "coverage_validation" })).toEqual({ helpful: false, ui_type: "fiber_coverage", last_step: "coverage_validation" }));
  it("keeps global COOPIA out of admin routes", () => { expect(isPublicCoopiaPath("/internet")).toBe(true); expect(isPublicCoopiaPath("/admin/comercial")).toBe(false); });
  it("keeps journey context through navigation", () => expect(coopiaRequestContext({ journeyId: "JRN-2026-ABCDEF12", sessionId: "SES-ABCDEF1234567890", page: "/internet", intent: "fiber_coverage", service: "fiber" })).toMatchObject({ page: "/internet", intent: "fiber_coverage", service: "fiber" }));
  it("creates a human handoff without chat text", () => { const summary = handoffSummary({ intent: "internet_problem", service: "internet", lastStep: "human_handoff" }); expect(summary).toContain("internet_problem"); expect(summary).not.toContain("domicilio"); });
});
