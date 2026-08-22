import { describe, expect, it } from "vitest";
import { getCoopiaQuickActions } from "./quick-actions";

describe("getCoopiaQuickActions", () => {
  it("keeps the initial actions focused on the four primary paths", () => {
    const actions = getCoopiaQuickActions({ pathname: "/", pageType: "home", pageTitle: "Inicio" });
    expect(actions.map((action) => action.label)).toEqual(["Pagar factura", "Informar un problema", "Contratar internet", "Otra consulta"]);
  });
  it("prioritizes contextual internet help without duplicating actions", () => {
    const actions = getCoopiaQuickActions({ pathname: "/internet", pageType: "service", pageTitle: "Internet", service: "internet" });
    expect(actions[0]?.label).toBe("Consultar cobertura");
    expect(actions.filter((action) => action.label === "Consultar cobertura")).toHaveLength(1);
    expect(actions.length).toBeLessThanOrEqual(4);
  });
  it("uses the active journey to replace generic shortcuts", () => {
    const actions = getCoopiaQuickActions({ pathname: "/internet", pageType: "service", pageTitle: "Internet", service: "internet" }, { intent: "internet_signup", service: "internet", currentStep: "check_coverage" });
    expect(actions.map((action) => action.label)).toEqual(["Consultar cobertura", "Ver planes", "Hablar con un asesor"]);
  });
});
