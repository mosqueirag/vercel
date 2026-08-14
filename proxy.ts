import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin") return NextResponse.next();
  const token = request.cookies.get("coopsar_admin_token")?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !publishable || !secret) return NextResponse.redirect(new URL("/admin", request.url));
  const auth = createClient(url, publishable, { auth: { persistSession: false } }); const { data } = await auth.auth.getUser(token);
  if (!data.user?.email) return NextResponse.redirect(new URL("/admin", request.url));
  const admin = createClient(url, secret, { auth: { persistSession: false } }); const { data: allowed } = await admin.from("news_admins").select("email").eq("email", data.user.email).maybeSingle();
  if (!allowed) return NextResponse.redirect(new URL("/admin", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path+"] };
