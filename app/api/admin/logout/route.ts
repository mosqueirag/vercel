import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { expiredSessionCookieOptions, isSameOrigin } from "../../../../lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
  if (!url || !key) return response;

  const pending: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(url, key, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => { pending.push(...items); } },
  });
  await supabase.auth.signOut();
  pending.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  expiredSessionCookieOptions(request.cookies.getAll()).forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
