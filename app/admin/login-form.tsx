import Link from "next/link";
import styles from "./admin.module.css";

export const adminLoginCopy = {
  authorizedOnly: "Acceso exclusivo para administradores autorizados.",
} as const;

export const adminLoginMessages: Record<string, string> = {
  configuration: "La autenticación administrativa no está disponible en este entorno.",
  oauth: "No fue posible iniciar sesión con Google. Intentá nuevamente.",
  callback: "La respuesta de Google no pudo validarse.",
  unauthorized: "Tu cuenta de Google no está autorizada para administrar COOPSAR.",
};

export function LoginForm({ error }: { error?: string }) {
  return <div className={styles.login}>{error && <p className="form-error" role="alert">{adminLoginMessages[error] || "No fue posible iniciar sesión."}</p>}<Link className="google-button" href="/api/admin/google"><span aria-hidden="true">G</span> Continuar con Google</Link><small>{adminLoginCopy.authorizedOnly}</small></div>;
}
