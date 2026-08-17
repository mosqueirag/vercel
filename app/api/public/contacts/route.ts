import { NextRequest } from "next/server";
import { getPublicContacts } from "../../../../lib/data/public-content";

export async function GET(request: NextRequest) {
  const service = request.nextUrl.searchParams.get("service") || undefined;
  const contacts = await getPublicContacts(service);
  return Response.json({ contacts }, { headers: { "Cache-Control": "public, max-age=60" } });
}
