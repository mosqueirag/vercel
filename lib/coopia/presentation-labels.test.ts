import { describe, expect, it } from "vitest";
import { coopiaPresentationLabel, coopiaPulseLabel } from "./presentation-labels";

describe("COOPIA presentation labels", () => {
  it("translates internal identifiers without changing stored keys", () => {
    expect(coopiaPresentationLabel("internet_signup")).toBe("alta de Internet");
    expect(coopiaPresentationLabel("ownership_change")).toBe("cambio de titularidad");
  });

  it("starts every Pulse alert with the approved copy", () => {
    expect(coopiaPulseLabel("service", "internet")).toMatch(/^Posible incremento/);
  });
});
