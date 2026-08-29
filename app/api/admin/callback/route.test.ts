import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSession, maybeSingle } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { exchangeCodeForSession, signOut: vi.fn() } }),
}));
vi.mock("../../../../lib/admin-auth", () => ({
  normalizeAdminEmail: (email: string | undefined) => email?.toLowerCase() || null,
  isVerifiedGoogleUser: () => true,
  matchesNewsAdmin: (email: string, allowed?: string) => email === allowed,
}));
vi.mock("../../../../lib/supabase", () => ({
  createSupabaseAdmin: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }) }),
}));

import { GET } from "./route";

describe("GET /api/admin/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
    exchangeCodeForSession.mockResolvedValue({ data: { user: { email: "admin@coopsar.test" } }, error: null });
    maybeSingle.mockResolvedValue({ data: { email: "admin@coopsar.test" } });
  });

  it("takes an authorized Google user to the management center", async () => {
    const response = await GET(new NextRequest("https://coopsar.test/api/admin/callback?code=valid-code"));
    expect(response.headers.get("location")).toBe("https://coopsar.test/admin/gestion");
  });
});
