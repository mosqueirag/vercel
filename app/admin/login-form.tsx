import Link from "next/link";
import styles from "./admin.module.css";

export const adminLoginCopy = {
  authorizedOnly: "Acceso exclusivo para administradores autorizados.",
} as const;

export function LoginForm({ error }: { error?: string }) {
  const messages: Record<string, string> = {
    configuration: "Supabase Auth todavía no está configurado en este entorno.",
    oauth: "No fue posible iniciar sesión con Google. Intentá nuevamente.",
    callback: "La respuesta de Google no pudo validarse.",
    unauthorized: "Tu cuenta de Google no está autorizada para administrar COOPSAR.",
  };
  return <div className={styles.login}>{error && <p className="form-error" role="alert">{messages[error] || "No fue posible iniciar sesión."}</p>}<Link className="google-button" href="/api/admin/google"><span aria-hidden="true">G</span> Continuar con Google</Link><small>{adminLoginCopy.authorizedOnly}</small></div>;
}
