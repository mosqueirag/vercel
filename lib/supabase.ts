import { createClient } from "@supabase/supabase-js";

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url?.startsWith("https://") && key && !key.includes("[SENSITIVE]"));
}

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.startsWith("https://") || !key || key.includes("[SENSITIVE]")) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
