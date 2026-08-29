import { redirect } from "next/navigation";
import { requireNewsAdmin } from "../../lib/admin-auth";
import { AdminNavigation } from "./admin-navigation";
import styles from "./admin.module.css";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await requireNewsAdmin();
  if (!session) redirect("/admin");

  return <div className={styles.app}><AdminNavigation email={session.email} /><main className={styles.main}>{children}</main></div>;
}
