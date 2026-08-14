import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "COOPSAR | Servicios para Sarmiento", template: "%s | COOPSAR" },
  description: "Gestioná tus servicios de COOPSAR de forma simple, rápida y segura.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
