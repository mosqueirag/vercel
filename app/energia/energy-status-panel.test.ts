import { describe, expect, it } from "vitest";
import { energyStatusPresentation } from "./energy-status-panel";

describe("EnergyStatusPanel presentation", () => {
  it("does not claim a published source when unknown has no alert", () => {
    expect(energyStatusPresentation({ status: "unknown", alert: null, error: false })).toEqual({ title: "Sin información operativa confirmada", message: "No hay un aviso operativo vigente para mostrar.", source: null });
  });
  it("makes a data failure explicit without inferring operation", () => {
    expect(energyStatusPresentation({ status: "unknown", alert: null, error: true })).toEqual({ title: "No pudimos consultar el estado del servicio en este momento.", message: "Consultá los canales oficiales disponibles si necesitás asistencia.", source: null });
  });
});
