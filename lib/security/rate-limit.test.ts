import { describe, expect, it } from "vitest";
import { configuredAiSessionLimit } from "./rate-limit";

describe("COOPIA session limit", () => {
  it("uses two interactions when the setting is absent", () => expect(configuredAiSessionLimit(undefined)).toBe(2));
  it("allows the first and second interactions by default", () => { expect(1 <= configuredAiSessionLimit(undefined)).toBe(true); expect(2 <= configuredAiSessionLimit(undefined)).toBe(true); });
  it("blocks from the third interaction by default", () => expect(3 > configuredAiSessionLimit(undefined)).toBe(true));
  it("supports custom configuration", () => expect(configuredAiSessionLimit("4")).toBe(4));
  it("uses the safe default for invalid configuration", () => expect(configuredAiSessionLimit("invalid")).toBe(2));
});
