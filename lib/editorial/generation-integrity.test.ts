import { describe, expect, it } from "vitest";

import { canPersistGeneratedProposal, editorialGenerationSourceHash } from "./generation-integrity";

const draft = { entityType: "faq" as const, title: "¿Qué es ADECOOP?", originalText: "Respuesta histórica", status: "draft" };

describe("editorial generation integrity", () => {
  it("blocks persistence when the target was published while generation was in progress", () => {
    const sourceHash = editorialGenerationSourceHash(draft);
    expect(canPersistGeneratedProposal(sourceHash, { ...draft, status: "published" })).toEqual({ allowed: false, reason: "stale_candidate" });
  });

  it("blocks persistence when the draft changes while generation was in progress", () => {
    const sourceHash = editorialGenerationSourceHash(draft);
    expect(canPersistGeneratedProposal(sourceHash, { ...draft, originalText: "Respuesta modificada" })).toEqual({ allowed: false, reason: "stale_candidate" });
  });

  it("allows the unchanged draft snapshot to persist", () => {
    expect(canPersistGeneratedProposal(editorialGenerationSourceHash(draft), draft)).toEqual({ allowed: true });
  });
});
