import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isVerifiedGoogleUser, matchesNewsAdmin, normalizeAdminEmail } from "../../../../lib/admin-auth";
import { createSupabaseAdmin } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!code || !url || !key) return NextResponse.redirect(new URL("/admin?error=callback", request.url));

  const pending: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => { pending.push(...cookies); } } });
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const email = normalizeAdminEmail(data.user?.email);
  if (error || !isVerifiedGoogleUser(data.user) || !email) return NextResponse.redirect(new URL("/admin?error=oauth", request.url));

  const admin = createSupabaseAdmin();
  const allowed = admin ? await admin.from("news_admins").select("email").eq("email", email).maybeSingle() : null;
  if (!matchesNewsAdmin(email, allowed?.data?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin?error=unauthorized", request.url));
  }
  const response = NextResponse.redirect(new URL("/admin/noticias", request.url));
  pending.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
