import { redirect } from "next/navigation";
import { requireNewsAdmin } from "../../lib/admin-auth";
import { AdminNavigation } from "./admin-navigation";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await requireNewsAdmin();
  if (!session) redirect("/admin");

  return <div className="admin-app"><AdminNavigation email={session.email} /><main className="admin-main">{children}</main></div>;
}
