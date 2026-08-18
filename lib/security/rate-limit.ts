import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { serverSupabaseHeaders } from "../supabase";

export function configuredAiSessionLimit(value = process.env.AI_SESSION_LIMIT) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 20 ? parsed : 2;
}

function digest(scope: string, value: string) {
  const salt = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return salt ? createHash("sha256").update(`${salt}:${scope}:${value}`).digest("hex") : null;
}

export function supabaseCredentialDiagnostic(url: string | undefined, secret: string | undefined) {
  return {
    supabaseUrlMatchesStaging: url === "https://wwvqlbycwzxvjnexklwg.supabase.co",
    secretPresent: Boolean(secret),
    secretLength: secret?.length ?? 0,
    startsWithSbSecret: secret?.startsWith("sb_secret_") ?? false,
    secretFingerprint: secret ? createHash("sha256").update(secret).digest("hex").slice(0, 12) : null,
  };
}

export async function consumeRateLimit(request: NextRequest, scope: string, limit: number, windowSeconds: number, identifier?: string) {
  const raw = identifier || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const keyHash = digest(scope, raw);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keyHash || !url?.startsWith("https://") || !key || key.includes("[SENSITIVE]")) return { allowed: process.env.NODE_ENV !== "production", available: false };

  try {
    // Call the server-only RPC directly so new sb_secret_* keys remain API-key
    // credentials and are never transformed into browser-style Bearer tokens.
    const response = await fetch(`${url}/rest/v1/rpc/consume_rate_limit`, {
      method: "POST",
      headers: serverSupabaseHeaders({ apikey: key, "Content-Type": "application/json" }, key),
      body: JSON.stringify({ p_scope: scope, p_key_hash: keyHash, p_limit: limit, p_window_seconds: windowSeconds }),
    });
    if (!response.ok) {
      if (response.status === 401) console.error("Supabase credential diagnostic", supabaseCredentialDiagnostic(url, key));
      console.error("Distributed rate limit unavailable", response.status);
      return { allowed: false, available: false };
    }
    return { allowed: (await response.json()) === true, available: true };
  } catch {
    console.error("Distributed rate limit unavailable", "network_error");
    return { allowed: false, available: false };
  }
}

export function secureFingerprint(scope: string, value: string) { return digest(scope, value); }
