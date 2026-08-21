"use client";

import { usePathname } from "next/navigation";
import { NavigationProvider } from "./navigation-context";
import { CoopiaProvider } from "./coopia-context";
import { GlobalCoopiaAssistant } from "./global-coopia-assistant";

export function CoopiaPublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return <NavigationProvider><CoopiaProvider>{children}<GlobalCoopiaAssistant /></CoopiaProvider></NavigationProvider>;
}
