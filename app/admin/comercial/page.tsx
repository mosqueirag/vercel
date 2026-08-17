import { redirect } from "next/navigation";
import { requireNewsAdmin } from "../../../lib/admin-auth";
import CommercialInbox from "../solicitudes-internet/commercial-inbox";

export const dynamic = "force-dynamic";

export default async function CommercialInboxPage() {
  if (!await requireNewsAdmin()) redirect("/admin");
  return <CommercialInbox />;
}
