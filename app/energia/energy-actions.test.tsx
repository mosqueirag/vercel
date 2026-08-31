import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const actions = readFileSync(new URL("./energy-actions.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("Energy Operations Center", () => {
  it("keeps the primary outage action deterministic through the global assistant", () => expect(actions).toContain('prompt="Estoy sin energía"'));
  it("offers its real routes and has no hardcoded guard number", () => {
    expect(actions).toContain('href="/cortes-programados"');
    expect(actions).toContain('href="/simulador-energia"');
    expect(actions).toContain('prompt="Quiero un nuevo suministro"');
    expect(actions).not.toMatch(/\+?54\d{8,}/);
  });
  it("uses its dedicated route and public read model", () => {
    expect(page).toContain('getPublicServiceStatus("energy")');
    expect(page).toContain("EnergyStatusPanel");
    expect(page).not.toContain("getServiceStatus(");
  });
});
