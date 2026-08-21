import { createClient } from "@supabase/supabase-js";

const serverUserAgent = "COOPSAR-Server-Supabase/1.0";

export function serverSupabaseHeaders(headers: HeadersInit | undefined, key: string) {
  const next = new Headers(headers);
  next.set("User-Agent", serverUserAgent);

  // New Supabase sb_secret_* keys are server-only API keys, not JWTs. The
  // client already sends the key in `apikey`; forwarding it as a Bearer token
  // makes Supabase reject the request as browser-like key usage.
  if (key.startsWith("sb_secret_") && next.get("Authorization") === `Bearer ${key}`) {
    next.delete("Authorization");
  }

  return next;
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url?.startsWith("https://") && key && !key.includes("[SENSITIVE]"));
}

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.startsWith("https://") || !key || key.includes("[SENSITIVE]")) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, headers: serverSupabaseHeaders(init?.headers, key) }),
    },
  });
}
