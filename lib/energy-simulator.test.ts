import { describe, expect, it } from "vitest";
import { consumptionLevel, monthlyConsumption } from "./energy-simulator";

describe("energy simulator", () => {
  it("calculates monthly kWh from power and usage", () => {
    expect(monthlyConsumption({ id: "x", name: "Prueba", category: "Cocina", watts: 1000, defaultHours: 1 }, { quantity: 2, hoursPerDay: 1.5, daysPerMonth: 30 })).toBe(90);
  });

  it("classifies estimated consumption", () => {
    expect(consumptionLevel(149).tone).toBe("low");
    expect(consumptionLevel(200).tone).toBe("medium");
    expect(consumptionLevel(350).tone).toBe("high");
  });
});
