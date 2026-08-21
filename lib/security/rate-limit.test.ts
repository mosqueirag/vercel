import { describe, expect, it, vi } from "vitest";
import { configuredAiSessionLimit, consumeRateLimit } from "./rate-limit";

describe("COOPIA session limit", () => {
  it("uses two interactions when the setting is absent", () => expect(configuredAiSessionLimit(undefined)).toBe(2));
  it("allows the first and second interactions by default", () => { expect(1 <= configuredAiSessionLimit(undefined)).toBe(true); expect(2 <= configuredAiSessionLimit(undefined)).toBe(true); });
  it("blocks from the third interaction by default", () => expect(3 > configuredAiSessionLimit(undefined)).toBe(true));
  it("supports custom configuration", () => expect(configuredAiSessionLimit("4")).toBe(4));
  it("uses the safe default for invalid configuration", () => expect(configuredAiSessionLimit("invalid")).toBe(2));
});

describe("distributed rate limiting", () => {
  it("uses a new server key as apikey only when calling the RPC", async () => {
    const previous = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SECRET_KEY };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test_key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("true", { status: 200 }));
    try {
      const result = await consumeRateLimit(new Request("https://coopsar.test") as never, "coverage", 20, 60, "test-ip");
      const [, init] = fetchMock.mock.calls[0] ?? [];
      const headers = new Headers(init?.headers);

      expect(result).toEqual({ allowed: true, available: true });
      expect(headers.get("apikey")).toBe("sb_secret_test_key");
      expect(headers.has("Authorization")).toBe(false);
      expect(headers.get("User-Agent")).toBe("COOPSAR-Server-Supabase/1.0");
    } finally {
      fetchMock.mockRestore();
      process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
      process.env.SUPABASE_SECRET_KEY = previous.key;
    }
  });
});
