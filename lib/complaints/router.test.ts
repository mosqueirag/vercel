import { describe, expect, it } from "vitest";
import { complaintRoutingWindow, resolveComplaintRoute } from "./router";

const contacts = [
  { id: "general", service: "general", channelType: "whatsapp", label: "WhatsApp", value: "5491111111111", purpose: "general_contact" },
  { id: "energy", service: "energy", channelType: "phone", label: "Guardia", value: "5492222222222", purpose: "emergency" },
  { id: "internet", service: "internet", channelType: "phone", label: "Soporte", value: "5493333333333", purpose: "support" },
  { id: "funeral", service: "funeral", channelType: "phone", label: "Guardia", value: "5494444444444", purpose: "emergency" },
];

describe("complaint routing", () => {
  it.each([
    ["Monday 07:59", "2026-08-17T10:59:00Z", "after_hours"],
    ["Monday 08:00", "2026-08-17T11:00:00Z", "office_hours"],
    ["Friday 13:59", "2026-08-21T16:59:00Z", "office_hours"],
    ["Friday 14:00", "2026-08-21T17:00:00Z", "after_hours"],
    ["Saturday", "2026-08-22T15:00:00Z", "after_hours"],
    ["Sunday", "2026-08-23T15:00:00Z", "after_hours"],
  ])("uses Argentina time for %s", (_label, timestamp, expected) => {
    expect(complaintRoutingWindow(new Date(timestamp))).toBe(expected);
  });

  it.each([
    ["energy", "energy", "emergency", "Guardia de Energía"],
    ["internet", "internet", "support", "Guardia de Comunicaciones"],
    ["fiber", "internet", "support", "Guardia de Comunicaciones"],
    ["phone", "internet", "support", "Guardia de Comunicaciones"],
    ["funeral", "funeral", "emergency", "Guardia de Sepelio"],
  ] as const)("routes %s after hours", (service, _contactService, purpose, label) => {
    const route = resolveComplaintRoute(service, new Date("2026-08-22T15:00:00Z"), contacts);
    expect(route).toMatchObject({ service, routingWindow: "after_hours", contactPurpose: purpose, contactLabel: label });
    expect(route.whatsappUrl).toContain("https://wa.me/");
    expect(route.message).not.toMatch(/DNI|domicilio|socio/i);
  });

  it("uses the general channel during reception hours", () => {
    expect(resolveComplaintRoute("energy", new Date("2026-08-17T11:00:00Z"), contacts)).toMatchObject({ routingWindow: "office_hours", contactPurpose: "general_contact", contactLabel: "Recepción de reclamos" });
  });

  it("does not fabricate a WhatsApp URL when the official contact is unavailable", () => {
    expect(resolveComplaintRoute("energy", new Date("2026-08-22T15:00:00Z"), [])).toMatchObject({ whatsappUrl: null });
  });
});
