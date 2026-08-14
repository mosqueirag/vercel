import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "./supabase";

export async function requireNewsAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = createSupabaseAdmin();
  if (!url || !key || !admin) return null;

  const cookieStore = await cookies();
  const auth = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => undefined,
    },
  });
  const { data, error } = await auth.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return null;

  const { data: allowed } = await admin.from("news_admins").select("email").eq("email", email).maybeSingle();
  return allowed ? { email, admin } : null;
}
