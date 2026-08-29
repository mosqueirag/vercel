import { LoginForm } from "./login-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireNewsAdmin } from "../../lib/admin-auth";
import styles from "./admin.module.css";
export const dynamic = "force-dynamic";
export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await requireNewsAdmin()) redirect("/admin/gestion");
  const { error } = await searchParams;
  return <main className={styles.access}>
    <section className={styles.accessIntro}><Link className={styles.accessBrand} href="/">COOPSAR</Link><div className={styles.accessIntroContent}><p className={styles.eyebrow}>Centro de Gestión</p><h2>Gestión simple de servicios, contenidos y atención.</h2><p>Una herramienta interna para acompañar el trabajo diario de COOPSAR.</p></div></section>
    <section className={styles.accessPanel}><div className={styles.accessCard}><p className={styles.eyebrow}>Centro de Gestión</p><h1>Administración COOPSAR</h1><p>Gestioná contenidos, servicios y solicitudes desde una cuenta autorizada.</p><LoginForm error={error} /></div></section>
  </main>;
}
