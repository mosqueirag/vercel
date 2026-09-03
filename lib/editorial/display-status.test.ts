import { describe, expect, it } from "vitest";
import { resolveEditorialDisplayStatus } from "./display-status";

describe("editorial display status", () => {
  it("derives published from the target without rewriting the proposal lifecycle", () => {
    expect(resolveEditorialDisplayStatus("published", "applied")).toBe("published");
    expect(resolveEditorialDisplayStatus("draft", "applied")).toBe("applied");
    expect(resolveEditorialDisplayStatus("draft", "needs_validation")).toBe("needs_validation");
  });
});
