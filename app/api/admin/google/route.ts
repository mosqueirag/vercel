import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(new URL("/admin?error=configuration", request.url));

  const pending: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => { pending.push(...cookies); },
    },
  });
  const origin = new URL(request.url).origin;
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/api/admin/callback`, scopes: "openid email profile" } });
  if (error || !data.url) return NextResponse.redirect(new URL("/admin?error=oauth", request.url));
  const response = NextResponse.redirect(data.url);
  pending.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
