import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithOAuth } = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { signInWithOAuth } }),
}));

import { GET } from "./route";

describe("GET /api/admin/google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
    signInWithOAuth.mockResolvedValue({
      data: { url: "https://project.supabase.co/auth/v1/authorize" },
      error: null,
    });
  });

  it("uses the current request origin for the OAuth callback", async () => {
    const request = new NextRequest(
      "https://coopsar-servicios-git-phase-4g71-ai-curated-con-24d4a8-guille17.vercel.app/api/admin/google",
    );

    const response = await GET(request);

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "https://coopsar-servicios-git-phase-4g71-ai-curated-con-24d4a8-guille17.vercel.app/api/admin/callback",
        scopes: "openid email profile",
      },
    });
    expect(response.headers.get("location")).toBe(
      "https://project.supabase.co/auth/v1/authorize",
    );
  });
});
