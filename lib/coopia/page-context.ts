import type { AssistantService } from "../ai/intents";

export type CoopiaPageContext = {
  pathname: string;
  pageType: "home" | "service" | "news" | "article" | "help" | "tramite" | "contact" | "institutional" | "other";
  service?: AssistantService;
  pageTitle: string;
  entityId?: string;
  previousPage?: string;
};

const servicePages: Record<string, { title: string; service: AssistantService }> = {
  "/energia": { title: "Energía", service: "energy" },
  "/internet": { title: "Internet", service: "internet" },
  "/fibra-optica": { title: "Fibra óptica", service: "fiber" },
  "/telefonia": { title: "Telefonía", service: "phone" },
  "/sepelio": { title: "Sepelio", service: "funeral" },
  "/medios-de-pago": { title: "Medios de pago", service: "billing" },
};

function safePathname(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.split("#")[0]?.split("?")[0] || "/";
}

export function deriveCoopiaPageContext(pathnameInput?: string, previousPage?: string): CoopiaPageContext {
  const pathname = safePathname(pathnameInput);
  if (pathname === "/") return { pathname, pageType: "home", pageTitle: "Inicio", previousPage: safePathname(previousPage) };
  const service = servicePages[pathname];
  if (service) return { pathname, pageType: "service", pageTitle: service.title, service: service.service, previousPage: safePathname(previousPage) };
  if (pathname === "/noticias") return { pathname, pageType: "news", pageTitle: "Noticias", previousPage: safePathname(previousPage) };
  if (pathname.startsWith("/noticias/")) return { pathname, pageType: "article", pageTitle: "Noticia", entityId: pathname.slice("/noticias/".length).replace(/[^a-z0-9-]/gi, "").slice(0, 80) || undefined, previousPage: safePathname(previousPage) };
  if (pathname === "/centro-de-ayuda") return { pathname, pageType: "help", pageTitle: "Centro de ayuda", previousPage: safePathname(previousPage) };
  if (["/tramites", "/cortes-programados"].includes(pathname)) return { pathname, pageType: "tramite", pageTitle: pathname === "/tramites" ? "Trámites" : "Cortes programados", previousPage: safePathname(previousPage) };
  if (pathname === "/contacto") return { pathname, pageType: "contact", pageTitle: "Contacto", previousPage: safePathname(previousPage) };
  if (["/institucional", "/privacidad"].includes(pathname)) return { pathname, pageType: "institutional", pageTitle: pathname === "/institucional" ? "Institucional" : "Privacidad", previousPage: safePathname(previousPage) };
  return { pathname, pageType: "other", pageTitle: "COOPSAR", previousPage: safePathname(previousPage) };
}

export function coopiaContextMetadata(context: CoopiaPageContext) {
  return {
    page_type: context.pageType,
    page_title: context.pageTitle,
    entity_id: context.entityId || null,
    previous_page: context.previousPage || null,
  };
}
