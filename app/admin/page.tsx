import { LoginForm } from "./login-form";
import { Brand } from "../ui";
import { redirect } from "next/navigation";
import { requireNewsAdmin } from "../../lib/admin-auth";
export const dynamic = "force-dynamic";
export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) { if (await requireNewsAdmin()) redirect("/admin/gestion"); const { error } = await searchParams; return <main className="admin-access"><Brand /><section><span className="eyebrow">Acceso privado</span><h1>Administración COOPSAR</h1><p>Ingresá con una cuenta de Google autorizada mediante Supabase Auth. No existe ninguna contraseña fija en el código.</p><LoginForm error={error} /></section></main>; }
