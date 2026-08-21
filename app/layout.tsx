import type { Metadata } from "next";
import "./globals.css";
import "./contextual.css";
import { PublicContactProvider } from "./components/public-contact-context";
import { CoopiaPublicShell } from "./components/coopia-public-shell";

export const metadata: Metadata = {
  title: { default: "COOPSAR | Servicios para Sarmiento", template: "%s | COOPSAR" },
  description: "Gestioná tus servicios de COOPSAR de forma simple, rápida y segura.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const appEnvironment = process.env.NEXT_PUBLIC_APP_ENV;
  const isStaging = appEnvironment === "staging";

  return <html lang="es"><body>{isStaging ? <div className="environment-banner" role="status">Entorno de prueba · STAGING</div> : null}<PublicContactProvider><CoopiaPublicShell>{children}</CoopiaPublicShell></PublicContactProvider></body></html>;
}
