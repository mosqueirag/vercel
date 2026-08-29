import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InternetCommercialIntro } from "./internet-commercial-sections";
import { InternetPlanCatalog } from "./internet-plan-catalog";

describe("Internet commercial product content", () => {
  it("keeps product, audience, and technology content visible with zero published plans", () => {
    const markup = renderToStaticMarkup(<InternetCommercialIntro plans={[]} />);

    expect(markup).toContain("Elegí la conexión que estás buscando.");
    expect(markup).toContain("Para mi hogar");
    expect(markup).toContain("Fibra óptica");
    expect(markup).toContain("ADSL");
    expect(markup).toContain("Internet inalámbrico");
    expect(markup).toContain("Formas de conectarte");
    expect(markup).not.toContain("Nuestros planes de Internet.");
  });

  it("marks draft catalog content as a staging simulation without claiming public availability", () => {
    const markup = renderToStaticMarkup(<InternetCommercialIntro isDemo plans={[{ id: "demo", slug: "plan-hogar-50-mb", name: "PLAN HOGAR 50 MB", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 50, speed_up_mbps: null, price_amount: 32279.41, currency: "ARS", installation_price: 0, installation_notes: null, benefits: [], conditions: null }]} />);

    expect(markup).toContain("Simulación comercial");
    expect(markup).toContain("Valores y condiciones en proceso de validación.");
    expect(markup).not.toContain("Plan disponible");
  });

  it("uses the friendly display name and keeps the plan selection as a reference", () => {
    const markup = renderToStaticMarkup(<InternetPlanCatalog isDemo plans={[{ id: "demo", slug: "plan-hogar-50-mb", name: "PLAN HOGAR 50 MB", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 50, speed_up_mbps: null, price_amount: 32279.41, currency: "ARS", installation_price: 0, installation_notes: null, benefits: [], conditions: null }]} />);

    expect(markup).toContain("Hogar 50");
    expect(markup).toContain("32.279");
    expect(markup).toContain("Quiero este plan");
    expect(markup).not.toContain("Plan de 50 Mbps por fibra óptica.");
  });
});
