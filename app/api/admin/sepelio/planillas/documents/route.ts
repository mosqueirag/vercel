import { z } from "zod";
import { isSameOrigin, requireNewsAdmin } from "../../../../../../lib/admin-auth";
import { funeralDocumentsBucket } from "../../../../../../lib/funeral-documents";

const schema = z.object({ documentId: z.string().uuid() });

export async function POST(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Documento inválido." }, { status: 400 });
  const { data: document, error } = await session.admin.from("funeral_family_update_documents").select("id,request_id,document_type,storage_bucket,storage_path").eq("id", parsed.data.documentId).maybeSingle();
  if (error || !document || document.storage_bucket !== funeralDocumentsBucket) return Response.json({ error: "No encontramos el documento." }, { status: 404 });
  const { data: signed, error: signError } = await session.admin.storage.from(funeralDocumentsBucket).createSignedUrl(document.storage_path, 90);
  if (signError || !signed) return Response.json({ error: "No pudimos preparar la visualización segura." }, { status: 503 });
  const { error: auditError } = await session.admin.from("funeral_family_update_audit").insert({ request_id: document.request_id, action: "document_viewed", document_id: document.id, document_type: document.document_type, actor_email: session.email });
  if (auditError) return Response.json({ error: "No pudimos registrar la visualización." }, { status: 503 });
  return Response.json({ signedUrl: signed.signedUrl, expiresIn: 90 }, { headers: { "Cache-Control": "private, no-store" } });
}
