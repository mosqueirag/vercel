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
    expect(homeSource).not.toContain("CoopOnlinePromo");
  });

  it("does not mount the legacy self-service taxonomy or a second chat on Home", () => {
    expect(homeSource).not.toContain("<SelfService");
    expect(homeSource).not.toContain("CoopiaProvider");
    expect(homeSource).not.toContain("Facturas y cuenta");
  });

  it("does not reserve a news section when there are no published articles", () => {
    expect(homeSource).toContain("news.length > 0 && <section className=\"section news-section\">");
  });

  it("keeps a direct commercial entry to Internet while preserving the coverage tool", () => {
    const internetSource = readFileSync(new URL("./components/internet-center.tsx", import.meta.url), "utf8");

    expect(internetSource).toContain('href="/internet"');
    expect(internetSource).toContain('href="#contratar"');
    expect(internetSource).toContain('id="contratar"');
  });

  it("continues Home coverage in the Internet catalogue without a second coverage check", () => {
    const internetSource = readFileSync(new URL("./components/internet-center.tsx", import.meta.url), "utf8");

    expect(internetSource).toContain("saveInternetPlansHandoff(sessionStorage");
    expect(internetSource).toContain('router.push("/internet#planes")');
    expect(internetSource).toContain('document.querySelector("#planes")?.scrollIntoView');
  });
});
