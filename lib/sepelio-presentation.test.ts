import { describe, expect, it } from "vitest";
import { resolveFuneralGuard } from "./sepelio-presentation";

describe("Sepelio presentation", () => {
  it("prioritizes the published funeral emergency channel and creates a mobile tel action", () => {
    const guard = resolveFuneralGuard([{ id: "guard", service: "funeral", channelType: "guard_phone", label: "Guardia de Sepelio", value: "+54 9 297 000 0000", purpose: "emergency" }]);
    expect(guard.isPublished).toBe(true);
    expect(guard.href).toBe("tel:+5492970000000");
  });

  it("retains the existing fallback when the published channel is unavailable", () => {
    expect(resolveFuneralGuard([]).isPublished).toBe(false);
  });
});
