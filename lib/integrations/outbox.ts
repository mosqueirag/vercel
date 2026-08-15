import { createSupabaseAdmin } from "../supabase";
type ClaimedEvent = { id: number; payload: Record<string, unknown>; attempts: number };

export async function deliverPendingOutbox(limit = 5) {
  const url = process.env.N8N_WEBHOOK_URL, secret = process.env.N8N_WEBHOOK_SECRET, supabase = createSupabaseAdmin();
  if (!url || !secret || !supabase) return { delivered: 0, attempted: 0 };
  const { data, error } = await supabase.rpc("claim_integration_outbox", { p_limit: limit });
  if (error) { console.error("Outbox claim failed", error.code); return { delivered: 0, attempted: 0 }; }
  const events = (data ?? []) as ClaimedEvent[];
  let delivered = 0;
  for (const event of events) try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-coopsar-secret": secret }, body: JSON.stringify(event.payload), signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`http_${response.status}`);
    await supabase.from("integration_outbox").update({ status: "delivered", delivered_at: new Date().toISOString(), last_error: null }).eq("id", event.id); delivered += 1;
  } catch (cause) {
    const seconds = Math.min(3600, 30 * 2 ** Math.min(event.attempts, 7));
    await supabase.from("integration_outbox").update({ status: "error", last_error: cause instanceof Error ? cause.message.slice(0, 120) : "delivery_failed", next_attempt_at: new Date(Date.now() + seconds * 1000).toISOString() }).eq("id", event.id);
  }
  return { delivered, attempted: events.length };
}
