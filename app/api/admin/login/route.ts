import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createSupabaseAdmin } from "../../../../lib/supabase";

const schema = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Credenciales inválidas." }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishable) return Response.json({ error: "Supabase Auth todavía no está configurado." }, { status: 503 });
  const auth = createClient(url, publishable, { auth: { persistSession: false } });
  const { data, error } = await auth.auth.signInWithPassword(parsed.data);
  if (error || !data.session || !data.user.email) return Response.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  const admin = createSupabaseAdmin(); const allowed = admin ? await admin.from("news_admins").select("email").eq("email", data.user.email).maybeSingle() : null;
  if (!allowed?.data) return Response.json({ error: "Esta cuenta no tiene permisos de administración." }, { status: 403 });
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": `coopsar_admin_token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600` } });
}
