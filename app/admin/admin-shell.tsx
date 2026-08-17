import Link from "next/link";
import { redirect } from "next/navigation";
import { requireNewsAdmin } from "../../lib/admin-auth";

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await requireNewsAdmin();
  if (!session) redirect("/admin");

  return <>
    <header className="admin-session-bar">
      <Link href="/admin/comercial">Administración COOPSAR</Link>
      <div><small>Sesión: {session.email}</small><form action="/api/admin/logout" method="post"><button type="submit">Cerrar sesión</button></form></div>
    </header>
    {children}
  </>;
}
