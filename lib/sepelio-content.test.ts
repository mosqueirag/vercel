import { describe, expect, it } from "vitest";
import { getStagingFuneralCandidates, isStagingFuneralContentPreview } from "./sepelio-content";

describe("Sepelio candidate content", () => {
  it("is limited to staging previews without exposing historical URLs in public content", () => {
    expect(isStagingFuneralContentPreview("staging", "preview")).toBe(true);
    expect(isStagingFuneralContentPreview("production", "production")).toBe(false);
    expect(getStagingFuneralCandidates().every((candidate) => candidate.sourceStatus === "candidate" && !Object.values(candidate).some((value) => typeof value === "string" && value.includes("coopsar.com.ar")))).toBe(true);
  });
});
