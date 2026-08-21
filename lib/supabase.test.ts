import { describe, expect, it } from "vitest";
import { serverSupabaseHeaders } from "./supabase";

describe("server Supabase request headers", () => {
  it("uses a new secret API key only through apikey", () => {
    const key = "sb_secret_test_key";
    const headers = serverSupabaseHeaders({ apikey: key, Authorization: `Bearer ${key}` }, key);

    expect(headers.get("apikey")).toBe(key);
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.get("User-Agent")).toBe("COOPSAR-Server-Supabase/1.0");
  });

  it("keeps authorization for a legacy JWT service key", () => {
    const key = "eyJhbGciOiJIUzI1NiJ9.legacy";
    const headers = serverSupabaseHeaders({ apikey: key, Authorization: `Bearer ${key}` }, key);

    expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
  });
});
