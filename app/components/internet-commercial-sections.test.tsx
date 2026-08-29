import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InternetCommercialIntro } from "./internet-commercial-sections";
import { InternetPlanCatalog } from "./internet-plan-catalog";
import { resolveEnterpriseSalesWhatsApp } from "./internet-enterprise-panel";

describe("Internet commercial product content", () => {
  it("keeps product, audience, and technology content visible with zero published plans", () => {
    const markup = renderToStaticMarkup(<InternetCommercialIntro plans={[]} />);

    expect(markup).toContain("¿Cómo vas a usar Internet?");
    expect(markup).toContain("Para mi hogar");
    expect(markup).toContain("Fibra óptica");
    expect(markup).toContain("ADSL");
    expect(markup).toContain("Internet inalámbrico");
    expect(markup).toContain("Formas de conectarte");
    expect((markup.match(/role="tab"/g) ?? []).length).toBe(3);
    expect(markup).not.toContain("Nuestros planes de Internet.");
  });

  it("marks draft catalog content as a staging simulation without claiming public availability", () => {
    const markup = renderToStaticMarkup(<InternetCommercialIntro isDemo plans={[{ id: "demo", slug: "plan-hogar-50-mb", name: "PLAN HOGAR 50 MB", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 50, speed_up_mbps: null, price_amount: 32279.41, currency: "ARS", installation_price: 0, installation_notes: null, benefits: [], conditions: null }]} />);

    expect(markup).toContain("Simulación comercial");
    expect(markup).toContain("Valores y condiciones en proceso de validación.");
    expect(markup).not.toContain("Plan disponible");
  });

  it("keeps the catalog quiet until the visitor selects an audience", () => {
    const markup = renderToStaticMarkup(<InternetPlanCatalog isDemo plans={[{ id: "demo", slug: "plan-hogar-50-mb", name: "PLAN HOGAR 50 MB", description: null, audience: "home", technology: "FTTH", speed_down_mbps: 50, speed_up_mbps: null, price_amount: 32279.41, currency: "ARS", installation_price: 0, installation_notes: null, benefits: [], conditions: null }]} />);

    expect(markup).toContain("Elegí cómo vas a usar Internet");
    expect(markup).not.toContain("Plan Hogar");
    expect(markup).not.toContain("Oferta de referencia");
  });

  it("does not render the redundant selected plan summary before an audience selection", () => {
    const markup = renderToStaticMarkup(<InternetPlanCatalog isDemo plans={[]} />);
    expect(markup).not.toContain("Oferta de referencia");
    expect(markup).toContain("Elegí cómo vas a usar Internet para ver las opciones correspondientes.");
  });

  it("uses a dedicated published sales WhatsApp when present, otherwise only general contact", () => {
    const general = { id: "general", service: "general", channelType: "whatsapp", purpose: "general_contact", label: "General", value: "5490000000000" };
    const guard = { id: "guard", service: "internet", channelType: "whatsapp", purpose: "support", label: "Guardia", value: "5491111111111" };
    expect(resolveEnterpriseSalesWhatsApp([guard, general])).toEqual({ contact: general, label: "Hablar con COOPSAR" });
    const commercial = { id: "commercial", service: "commercial", channelType: "whatsapp", purpose: "commercial_sales", label: "Ventas", value: "5492222222222" };
    expect(resolveEnterpriseSalesWhatsApp([general, commercial])?.label).toBe("Hablar con Comercial");
  });
});
