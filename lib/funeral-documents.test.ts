import { describe, expect, it } from "vitest";
import { funeralDocumentMaxBytes, funeralUploadInitSchema, isPrivateFuneralDocumentPath, privateFuneralDocumentPath } from "./funeral-documents";

describe("private Sepelio DNI document helpers", () => {
  const uploadId = "11111111-1111-4111-8111-111111111111";

  it("creates opaque holder-only storage paths without applicant data", () => {
    const path = privateFuneralDocumentPath(uploadId, "front", "image/jpeg");
    expect(path).toBe(`${uploadId}/holder-dni-front.jpg`);
    expect(isPrivateFuneralDocumentPath(path)).toBe(true);
    expect(path).not.toMatch(/nombre|dni-\d/i);
  });

  it("accepts only the two supported document descriptors", () => {
    expect(funeralUploadInitSchema.safeParse({ front: { type: "image/png", size: 1 }, back: { type: "image/webp", size: funeralDocumentMaxBytes } }).success).toBe(true);
    expect(funeralUploadInitSchema.safeParse({ front: { type: "application/pdf", size: 1 }, back: { type: "image/jpeg", size: 1 } }).success).toBe(false);
  });
});
