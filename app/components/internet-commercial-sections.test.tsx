import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InternetCommercialIntro } from "./internet-commercial-sections";

describe("Internet commercial product content", () => {
  it("keeps product, audience, and technology content visible with zero published plans", () => {
    const markup = renderToStaticMarkup(<InternetCommercialIntro plans={[]} />);

    expect(markup).toContain("Elegí la conexión que estás buscando.");
    expect(markup).toContain("Para mi hogar");
    expect(markup).toContain("Fibra óptica");
    expect(markup).toContain("Internet inalámbrico");
    expect(markup).not.toContain("Nuestros planes de Internet.");
  });
});
