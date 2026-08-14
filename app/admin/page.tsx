import { LoginForm } from "./login-form";
import { Brand } from "../ui";
export const dynamic = "force-dynamic";
export default function AdminLogin() { return <main className="admin-access"><Brand /><section><span className="eyebrow">Acceso privado</span><h1>Administración COOPSAR</h1><p>Ingresá con una cuenta autorizada mediante Supabase Auth. No existe ninguna contraseña fija en el código.</p><LoginForm /></section></main>; }
