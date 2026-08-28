import { redirect } from "next/navigation";
import { requireNewsAdmin } from "../../../../lib/admin-auth";
import { FuneralFamilyInbox } from "./funeral-family-inbox";

export const dynamic = "force-dynamic";
export default async function FuneralFamilyUpdateInboxPage() {
  if (!await requireNewsAdmin()) redirect("/admin");
  return <FuneralFamilyInbox />;
}
