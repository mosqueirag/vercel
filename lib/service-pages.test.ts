import { describe, expect, it } from "vitest";
import { servicePages, withPublicContacts } from "./service-pages";

describe("withPublicContacts", () => {
  it("prefers published official contact values on service pages", () => {
    const page = withPublicContacts(servicePages.contacto, [
      { id: "1", service: "general", channelType: "whatsapp", label: "WhatsApp", value: "5491111111111", purpose: "general_contact" },
      { id: "2", service: "energy", channelType: "phone", label: "Guardia", value: "011 2222-2222", purpose: "emergency" },
      { id: "3", service: "internet", channelType: "phone", label: "Soporte", value: "011 3333-3333", purpose: "support" },
      { id: "4", service: "funeral", channelType: "phone", label: "Sepelio", value: "011 4444-4444", purpose: "emergency" },
    ]);
    expect(page.items.map((item) => item[1])).toEqual(["5491111111111", "Guardia: 011 2222-2222.", "Canal técnico: 011 3333-3333.", "011 4444-4444"]);
    expect(page.items.map((item) => item[2])).toEqual(["https://wa.me/5491111111111", "tel:01122222222", "tel:01133333333", "tel:01144444444"]);
  });
});
