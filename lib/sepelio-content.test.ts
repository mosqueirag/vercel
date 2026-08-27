import { describe, expect, it } from "vitest";
import { getStagingFuneralCandidates, isStagingFuneralContentPreview } from "./sepelio-content";

describe("Sepelio candidate content", () => {
  it("is limited to staging previews and carries historical provenance", () => {
    expect(isStagingFuneralContentPreview("staging", "preview")).toBe(true);
    expect(isStagingFuneralContentPreview("production", "production")).toBe(false);
    expect(getStagingFuneralCandidates().every((candidate) => candidate.sourceStatus === "candidate" && candidate.sourceUrl.startsWith("https://www.coopsar.com.ar/"))).toBe(true);
  });
});
