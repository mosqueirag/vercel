import { LoginForm } from "./login-form";
import { Brand } from "../ui";
export const dynamic = "force-dynamic";
export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) { const { error } = await searchParams; return <main className="admin-access"><Brand /><section><span className="eyebrow">Acceso privado</span><h1>Administración COOPSAR</h1><p>Ingresá con una cuenta de Google autorizada mediante Supabase Auth. No existe ninguna contraseña fija en el código.</p><LoginForm error={error} /></section></main>; }
