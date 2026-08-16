import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin") return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishable || !secret) return NextResponse.redirect(new URL("/admin?error=configuration", request.url));

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, publishable, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => { cookies.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data, error } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email.toLowerCase() : null;
  if (error || !email) return NextResponse.redirect(new URL("/admin", request.url));

  const admin = createClient(url, secret, { auth: { persistSession: false } });
  const { data: allowed } = await admin.from("news_admins").select("email").eq("email", email).maybeSingle();
  if (!allowed) return NextResponse.redirect(new URL("/admin?error=unauthorized", request.url));
  return response;
}
export const config = { matcher: ["/admin/:path+"] };
