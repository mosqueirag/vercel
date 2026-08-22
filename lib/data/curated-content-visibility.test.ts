import { describe, expect, it } from "vitest";
import { isVisibleToCoopia } from "./curated-content-visibility";

describe("COOPIA curated knowledge visibility", () => {
  const now = new Date("2026-08-22T12:00:00.000Z");

  it("excludes a draft before publication and includes the same record after explicit publication", () => {
    expect(isVisibleToCoopia({ status: "draft", published_at: null }, now)).toBe(false);
    expect(isVisibleToCoopia({ status: "published", published_at: "2026-08-22T11:59:00.000Z" }, now)).toBe(true);
  });

  it("does not include future or malformed publication timestamps", () => {
    expect(isVisibleToCoopia({ status: "published", published_at: "2026-08-22T12:01:00.000Z" }, now)).toBe(false);
    expect(isVisibleToCoopia({ status: "published", published_at: "not-a-date" }, now)).toBe(false);
  });
});
