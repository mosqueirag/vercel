import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("home composition", () => {
  it("keeps the adaptive panel and puts the need-based actions before Internet", () => {
    const adaptivePanel = homeSource.indexOf("<HomeAdaptivePanel />");
    const quickActions = homeSource.indexOf("<HomeQuickActions");
    const internetCenter = homeSource.indexOf("<InternetCenter />");

    expect(adaptivePanel).toBeGreaterThan(-1);
    expect(quickActions).toBeGreaterThan(adaptivePanel);
    expect(internetCenter).toBeGreaterThan(quickActions);
  });

  it("does not mount the legacy self-service taxonomy or a second chat on Home", () => {
    expect(homeSource).not.toContain("<SelfService");
    expect(homeSource).not.toContain("CoopiaProvider");
    expect(homeSource).not.toContain("Facturas y cuenta");
  });
});
