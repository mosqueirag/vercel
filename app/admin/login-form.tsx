export function LoginForm({ error }: { error?: string }) {
  const messages: Record<string, string> = {
    configuration: "Supabase Auth todavía no está configurado en este entorno.",
    oauth: "No fue posible iniciar sesión con Google. Intentá nuevamente.",
    callback: "La respuesta de Google no pudo validarse.",
    unauthorized: "Tu cuenta de Google no está autorizada para administrar COOPSAR.",
  };
  return <div className="admin-login">{error && <p className="form-error" role="alert">{messages[error] || "No fue posible iniciar sesión."}</p>}<Link className="google-button" href="/api/admin/google"><span aria-hidden="true">G</span> Continuar con Google</Link><small>Solo pueden ingresar cuentas incluidas en la lista privada de administradores.</small></div>;
}
import Link from "next/link";
