import type { Metadata } from "next";
import "./globals.css";
import "./contextual.css";
import { GlobalJourneyNavigation } from "./components/global-journey-navigation";
import { NavigationProvider } from "./components/navigation-context";

export const metadata: Metadata = {
  title: { default: "COOPSAR | Servicios para Sarmiento", template: "%s | COOPSAR" },
  description: "Gestioná tus servicios de COOPSAR de forma simple, rápida y segura.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><NavigationProvider>{children}<GlobalJourneyNavigation /></NavigationProvider></body></html>;
}
