import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("scheduled cuts page", () => {
  const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  it("reads only published energy maintenance through the data helper", () => {
    expect(page).toContain("getPublishedEnergyAlerts");
    expect(page).toContain("No hay cortes programados publicados en este momento.");
    expect(page).toContain("interrupciones imprevistas");
  });
});
