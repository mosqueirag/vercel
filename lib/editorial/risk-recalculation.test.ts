import { describe, expect, it } from "vitest";
import { editorialRiskRecalculation } from "./risk-recalculation";

describe("explicit editorial risk recalculation", () => {
  it("changes only legacy restricted historical proposals and is idempotent", () => {
    const proposals = [
      { id: "one", entity_type: "faq" as const, entity_id: "faq-1", risk_level: "medium", validation_flags: ["restricted_editorial_content"] },
      { id: "two", entity_type: "faq" as const, entity_id: "faq-2", risk_level: "medium", validation_flags: ["historical_validation_queue"] },
      { id: "three", entity_type: "contact_channel" as const, entity_id: "contact-1", risk_level: "medium", validation_flags: ["restricted_editorial_content"] },
    ];
    const historicalKeys = new Set(["faq:faq-1", "faq:faq-2"]);
    const first = editorialRiskRecalculation(proposals, historicalKeys);
    expect(first).toMatchObject({ scanned: 2, changed: 1, unchanged: 1, changes: [{ id: "one", riskLevel: "restricted" }] });
    const second = editorialRiskRecalculation(proposals.map((proposal) => proposal.id === "one" ? { ...proposal, risk_level: "restricted" } : proposal), historicalKeys);
    expect(second).toMatchObject({ scanned: 2, changed: 0, unchanged: 2, changes: [] });
  });
});
