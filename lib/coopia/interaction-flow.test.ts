import { describe, expect, it } from "vitest";
import { coopiaInitialNeeds, coopiaJourneyLabel, coopiaLoadingCopy, coopiaStepActions } from "./interaction-flow";

describe("COOPIA guided interaction", () => {
  it("starts with user needs rather than internal services", () => {
    const needs = coopiaInitialNeeds({ pageType: "other", service: "general", pathname: "/", pageTitle: "Inicio" });
    expect(needs.map((item) => item.label)).toEqual(["Estoy sin energía", "Tengo problemas con Internet", "Pagar una factura", "Quiero Internet"]);
  });
  it("uses a human-readable active context", () => expect(coopiaJourneyLabel({ service: "internet", ui: { type: "fiber_coverage", data: {} } } as never)).toBe("Internet › Cobertura"));
  it("uses contextual, non-technical loading copy", () => expect(coopiaLoadingCopy("No tengo luz")).toBe("Verificando el estado del servicio…"));
  it("keeps one primary action and at most one secondary action", () => expect(coopiaStepActions([{ id: "OPEN_WHATSAPP", label: "WhatsApp", href: "/wa" }, { id: "OPEN_VIRTUAL_OFFICE", label: "Pagar", href: "/pagar" }, { id: "SHOW_PAYMENT_METHODS", label: "Ayuda", href: "/ayuda" }]).map((action) => action.id)).toEqual(["OPEN_VIRTUAL_OFFICE", "OPEN_WHATSAPP"]));
});
