import { describe, expect, it, vi } from "vitest";
import { uploadPrivateFuneralDocuments } from "./funeral-document-upload-client";

describe("private funeral document upload flow", () => {
  const front = { type: "image/jpeg", size: 42 } as File;
  const back = { type: "image/png", size: 43 } as File;
  const session = { uploadId: "11111111-1111-4111-8111-111111111111", front: { path: "private/front.jpg", token: "front-token" }, back: { path: "private/back.png", token: "back-token" } };

  it("creates one signed session and uploads both selected sides before returning the upload id", async () => {
    const createSession = vi.fn().mockResolvedValue(session);
    const upload = vi.fn().mockResolvedValue(undefined);
    await expect(uploadPrivateFuneralDocuments({ front, back, createSession, upload })).resolves.toBe(session.uploadId);
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload).toHaveBeenCalledWith("front", session.front, front);
    expect(upload).toHaveBeenCalledWith("back", session.back, back);
  });

  it("does not report success when either signed upload fails", async () => {
    const upload = vi.fn().mockRejectedValue(new Error("upload failed"));
    await expect(uploadPrivateFuneralDocuments({ front, back, createSession: vi.fn().mockResolvedValue(session), upload })).rejects.toThrow("upload failed");
  });
});
