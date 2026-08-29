import { NextRequest } from "next/server";
import { funeralDocumentsBucket, funeralUploadInitSchema, privateFuneralDocumentPath } from "../../../../lib/funeral-documents";
import { consumeRateLimit } from "../../../../lib/security/rate-limit";
import { createSupabaseAdmin } from "../../../../lib/supabase";

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit(request, "funeral-document-upload", 6, 600);
  if (!rate.allowed) return Response.json({ error: rate.available ? "Realizaste demasiados intentos. Esperá unos minutos." : "El servicio de protección no está disponible." }, { status: rate.available ? 429 : 503 });
  const parsed = funeralUploadInitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Elegí imágenes JPG, PNG o WebP de hasta 8 MB." }, { status: 400 });
  const supabase = createSupabaseAdmin();
  if (!supabase) return Response.json({ error: "El almacenamiento privado no está disponible." }, { status: 503 });

  const uploadId = crypto.randomUUID();
  const frontPath = privateFuneralDocumentPath(uploadId, "front", parsed.data.front.type);
  const backPath = privateFuneralDocumentPath(uploadId, "back", parsed.data.back.type);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { error: sessionError } = await supabase.from("funeral_document_upload_sessions").insert({
    id: uploadId,
    front_path: frontPath,
    back_path: backPath,
    front_mime_type: parsed.data.front.type,
    back_mime_type: parsed.data.back.type,
    front_file_size: parsed.data.front.size,
    back_file_size: parsed.data.back.size,
    expires_at: expiresAt,
  });
  if (sessionError) return Response.json({ error: "No pudimos preparar la documentación." }, { status: 503 });

  const [front, back] = await Promise.all([
    supabase.storage.from(funeralDocumentsBucket).createSignedUploadUrl(frontPath),
    supabase.storage.from(funeralDocumentsBucket).createSignedUploadUrl(backPath),
  ]);
  if (front.error || back.error || !front.data || !back.data) {
    await supabase.from("funeral_document_upload_sessions").update({ status: "discarded" }).eq("id", uploadId);
    return Response.json({ error: "No pudimos preparar la carga privada." }, { status: 503 });
  }

  return Response.json({
    uploadId,
    expiresAt,
    front: { path: frontPath, token: front.data.token },
    back: { path: backPath, token: back.data.token },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
