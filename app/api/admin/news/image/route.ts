import { requireNewsAdmin } from "../../../../../lib/admin-auth";

const allowedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function POST(request: Request) {
  const session = await requireNewsAdmin();
  if (!session) return Response.json({ error: "No autorizado." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) return Response.json({ error: "Seleccioná una imagen." }, { status: 400 });
  const extension = allowedTypes.get(file.type);
  if (!extension || file.size > 10 * 1024 * 1024) return Response.json({ error: "Usá JPG, PNG o WebP de hasta 10 MB." }, { status: 400 });
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;
  const { error } = await session.admin.storage.from("news-images").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return Response.json({ error: "No pudimos subir la imagen." }, { status: 503 });
  const { data } = session.admin.storage.from("news-images").getPublicUrl(path);
  return Response.json({ imageUrl: data.publicUrl }, { status: 201 });
}
