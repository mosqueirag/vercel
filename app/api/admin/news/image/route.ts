import { z } from "zod";
import { isSameOrigin, requireNewsAdmin } from "../../../../../lib/admin-auth";

const allowedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const requestSchema = z.object({ type: z.string(), size: z.number().int().positive().max(10 * 1024 * 1024) });

export async function POST(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  const extension = parsed.success ? allowedTypes.get(parsed.data.type) : null;
  if (!parsed.success || !extension) return Response.json({ error: "Usá JPG, PNG o WebP de hasta 10 MB." }, { status: 400 });

  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await session.admin.storage.from("news-images").createSignedUploadUrl(path);
  if (error) return Response.json({ error: "No pudimos preparar la carga de la imagen." }, { status: 503 });
  const { data: publicData } = session.admin.storage.from("news-images").getPublicUrl(path);
  return Response.json({ path, token: data.token, imageUrl: publicData.publicUrl });
}
