import type { PublicContact } from "./data/public-content";

export type FuneralGuard = { label: string; value: string; href: string; isPublished: boolean };

function firstTelephone(value: string) {
  return value.split("/")[0].trim().replace(/[^\d+]/g, "");
}

/** Emergency contact details are administrable and must never fall back to historical hardcoded data. */
export function resolveFuneralGuard(contacts: PublicContact[]): FuneralGuard {
  const published = contacts.find((contact) => contact.service === "funeral" && contact.purpose === "emergency");
  if (!published) return { label: "Guardia de Sepelio", value: "Canal pendiente de confirmación", href: "/contacto", isPublished: false };
  return { label: published.label || "Guardia de Sepelio", value: published.value, href: `tel:${firstTelephone(published.value)}`, isPublished: true };
}
