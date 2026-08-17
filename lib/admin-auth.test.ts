import { describe, expect, it } from "vitest";
import { expiredSessionCookieOptions, isVerifiedGoogleUser, matchesNewsAdmin, normalizeAdminEmail, sessionCookieNames } from "./admin-auth";

describe("admin authorization", () => {
  it("normalizes the only authorized administrator email", () => {
    expect(normalizeAdminEmail(" MosqueiraG@Gmail.com ")).toBe("mosqueirag@gmail.com");
    expect(matchesNewsAdmin("MosqueiraG@Gmail.com", "mosqueirag@gmail.com")).toBe(true);
    expect(matchesNewsAdmin("otro@email.com", "mosqueirag@gmail.com")).toBe(false);
    expect(matchesNewsAdmin(null, "mosqueirag@gmail.com")).toBe(false);
  });

  it("accepts a verified Google identity and rejects unverified or other providers", () => {
    expect(isVerifiedGoogleUser({ email: "mosqueirag@gmail.com", email_confirmed_at: "2026-01-01T00:00:00Z", app_metadata: { provider: "google" } })).toBe(true);
    expect(isVerifiedGoogleUser({ email: "otro@email.com", email_confirmed_at: null, app_metadata: { provider: "google" } })).toBe(false);
    expect(isVerifiedGoogleUser({ email: "otro@email.com", email_confirmed_at: "2026-01-01T00:00:00Z", app_metadata: { provider: "email" } })).toBe(false);
  });

  it("selects only Supabase session cookies for logout", () => {
    const cookies = [{ name: "sb-project-auth-token" }, { name: "other" }, { name: "sb-project-auth-token-code-verifier" }];
    expect(sessionCookieNames(cookies)).toEqual(["sb-project-auth-token", "sb-project-auth-token-code-verifier"]);
    expect(expiredSessionCookieOptions(cookies)).toEqual([
      { name: "sb-project-auth-token", value: "", options: { path: "/", maxAge: 0 } },
      { name: "sb-project-auth-token-code-verifier", value: "", options: { path: "/", maxAge: 0 } },
    ]);
  });
});
