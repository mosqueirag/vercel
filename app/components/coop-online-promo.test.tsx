import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PUBLIC_LINKS, coopOnlineDownloadMetadata } from "../../lib/public-links";

vi.mock("./navigation-context", () => ({ useNavigationContext: () => ({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78" }) }));

import { CoopOnlinePromo } from "./coop-online-promo";

describe("COOP Online public promotion", () => {
  it("uses one central official and secure Google Play URL", () => {
    expect(PUBLIC_LINKS.coopOnlineAndroid).toBe("https://play.google.com/store/apps/details?id=com.Procoop.CoopOnline&hl=es_AR");
    expect(PUBLIC_LINKS.coopOnlineAndroid).toMatch(/^https:\/\/play\.google\.com\//);
  });

  it("renders a safe Home call to action without invented app functions", () => {
    const html = renderToStaticMarkup(<CoopOnlinePromo />);
    expect(html).toContain(PUBLIC_LINKS.coopOnlineAndroid.replace("&", "&amp;"));
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("Todo COOPSAR, también en tu celular.");
    expect(html).not.toMatch(/pagá|factura|reclamo|cobertura/i);
  });

  it("tracks only the approved aggregate download metadata", () => {
    const metadata = coopOnlineDownloadMetadata("home_app_promo");
    expect(metadata).toEqual({ platform: "android", source: "home_app_promo", destination: "google_play" });
    expect(JSON.stringify(metadata)).not.toMatch(/nombre|dni|email|teléfono|domicilio/i);
  });

  it("keeps the global Footer access public-only and renders it once", () => {
    const footerSource = readFileSync(new URL("../ui.tsx", import.meta.url), "utf8");
    const publicShellSource = readFileSync(new URL("./coopia-public-shell.tsx", import.meta.url), "utf8");
    expect((footerSource.match(/source="footer_app"/g) ?? [])).toHaveLength(1);
    expect(footerSource).toContain("CoopOnlineDownloadLink");
    expect(publicShellSource).toContain('pathname.startsWith("/admin")');
  });
});
import { readFileSync } from "node:fs";
