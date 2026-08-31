import { describe, expect, it } from "vitest";
import { procedures } from "./catalog";

describe("smart procedures catalog", () => {
  it("contains only the operational procedures that have a real resolution path", () => {
    expect(procedures.map((procedure) => procedure.id)).toEqual([
      "ownership_change",
      "new_supply",
      "digital_invoice",
      "payments",
      "update_data",
      "phone_service",
      "funeral_service",
      "funeral_family_update",
      "human_handoff",
    ]);
    expect(procedures.some((procedure) => procedure.id.includes("reconnection"))).toBe(false);

    for (const procedure of procedures) {
      const hasResolution = procedure.resolutionType === "coopia"
        ? Boolean(procedure.prompt)
        : ["payments", "update_data"].includes(procedure.id) || Boolean(procedure.href);
      expect(hasResolution).toBe(true);
      expect(JSON.stringify(procedure)).not.toMatch(/wa\.me|whatsapp:\/\//i);
    }
  });

  it("uses the existing global assistant only for assisted procedures", () => {
    const assisted = procedures.filter((procedure) => procedure.resolutionType === "coopia");
    expect(assisted.map((procedure) => procedure.id)).toEqual([
      "ownership_change",
      "new_supply",
      "digital_invoice",
      "phone_service",
      "human_handoff",
    ]);
    expect(assisted.every((procedure) => procedure.prompt && procedure.href === undefined)).toBe(true);
  });

  it("keeps direct funeral actions on their real internal routes", () => {
    expect(procedures.find((procedure) => procedure.id === "funeral_service")?.href).toBe("/sepelio");
    expect(procedures.find((procedure) => procedure.id === "funeral_family_update")?.href).toBe("/sepelio/actualizar-grupo-familiar");
  });

  it("does not hardcode a virtual-office destination", () => {
    const payments = procedures.find((procedure) => procedure.id === "payments");
    expect(payments?.resolutionType).toBe("official_link");
    expect(payments?.href).toBeUndefined();
  });
});
