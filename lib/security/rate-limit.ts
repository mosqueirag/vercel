import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createSupabaseAdmin } from "../supabase";

export function configuredAiSessionLimit(value = process.env.AI_SESSION_LIMIT) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 20 ? parsed : 2;
}

function digest(scope: string, value: string) {
  const salt = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return salt ? createHash("sha256").update(`${salt}:${scope}:${value}`).digest("hex") : null;
}

export async function consumeRateLimit(request: NextRequest, scope: string, limit: number, windowSeconds: number, identifier?: string) {
  const raw = identifier || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const keyHash = digest(scope, raw);
  const supabase = createSupabaseAdmin();
  if (!keyHash || !supabase) return { allowed: process.env.NODE_ENV !== "production", available: false };
  const { data, error } = await supabase.rpc("consume_rate_limit", { p_scope: scope, p_key_hash: keyHash, p_limit: limit, p_window_seconds: windowSeconds });
  if (error) { console.error("Distributed rate limit unavailable", error.code); return { allowed: false, available: false }; }
  return { allowed: data === true, available: true };
}

export function secureFingerprint(scope: string, value: string) { return digest(scope, value); }
