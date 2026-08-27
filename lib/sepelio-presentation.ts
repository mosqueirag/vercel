import { CONTACT } from "./coopsar-data";
import type { PublicContact } from "./data/public-content";

export type FuneralGuard = { label: string; value: string; href: string; isPublished: boolean };

function firstTelephone(value: string) {
  return value.split("/")[0].trim().replace(/[^\d+]/g, "");
}

/** Published funeral emergency contacts take precedence; the existing local fallback keeps the route usable. */
export function resolveFuneralGuard(contacts: PublicContact[]): FuneralGuard {
  const published = contacts.find((contact) => contact.service === "funeral" && contact.purpose === "emergency");
  const value = published?.value || CONTACT.funeralGuard;
  return { label: published?.label || "Guardia de Sepelio", value, href: `tel:${firstTelephone(value)}`, isPublished: Boolean(published) };
}
