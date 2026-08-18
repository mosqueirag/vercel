import { describe, expect, it } from "vitest";
import { requestTypeFromCoverage } from "./coverage-request-type";

describe("coverage request type", () => {
  it("uses the backend nextAction for a geographic zone instead of inferring installation", () => {
    expect(requestTypeFromCoverage({ nextAction: "coverage_validation" })).toBe("coverage_validation");
  });
});
