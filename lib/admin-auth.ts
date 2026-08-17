import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "./supabase";

export function normalizeAdminEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase();
  return normalized || null;
}

export function isVerifiedGoogleUser(user: { email?: string | null; email_confirmed_at?: string | null; app_metadata?: { provider?: string } } | null | undefined) {
  return Boolean(normalizeAdminEmail(user?.email) && user?.email_confirmed_at && user?.app_metadata?.provider === "google");
}

export function matchesNewsAdmin(email: string | null | undefined, allowedEmail: string | null | undefined) {
  return normalizeAdminEmail(email) !== null && normalizeAdminEmail(email) === normalizeAdminEmail(allowedEmail);
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export function sessionCookieNames(cookies: Array<{ name: string }>) {
  return cookies.filter((cookie) => cookie.name.startsWith("sb-")).map((cookie) => cookie.name);
}

export function expiredSessionCookieOptions(cookies: Array<{ name: string }>) {
  return sessionCookieNames(cookies).map((name) => ({ name, value: "", options: { path: "/", maxAge: 0 } }));
}

export async function requireNewsAdmin() {
  // Read cookies before configuration checks so every protected route remains
  // request-bound and cannot be prerendered as a public administrative page.
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = createSupabaseAdmin();
  if (!url || !key || !admin) return null;

  const auth = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => undefined,
    },
  });
  const { data, error } = await auth.auth.getUser();
  const email = normalizeAdminEmail(data.user?.email);
  if (error || !email || !isVerifiedGoogleUser(data.user)) return null;

  const { data: allowed } = await admin.from("news_admins").select("email").eq("email", email).maybeSingle();
  return matchesNewsAdmin(email, allowed?.email) ? { email, admin } : null;
}
