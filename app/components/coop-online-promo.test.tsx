import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PUBLIC_LINKS, coopOnlineDownloadMetadata } from "../../lib/public-links";

vi.mock("./navigation-context", () => ({ useNavigationContext: () => ({ journeyId: "JRN-2026-AB12CD34", sessionId: "SES-AB12CD34EF56AB78" }) }));

import { CoopOnlineQuickAction } from "./coop-online-promo";

describe("COOP Online public promotion", () => {
  it("uses one central official and secure Google Play URL", () => {
    expect(PUBLIC_LINKS.coopOnlineAndroid).toBe("https://play.google.com/store/apps/details?id=com.Procoop.CoopOnline&hl=es_AR");
    expect(PUBLIC_LINKS.coopOnlineAndroid).toMatch(/^https:\/\/play\.google\.com\//);
  });

  it("renders a safe Home call to action without invented app functions", () => {
    const html = renderToStaticMarkup(<CoopOnlineQuickAction />);
    expect(html).toContain(PUBLIC_LINKS.coopOnlineAndroid.replace("&", "&amp;"));
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("Gestioná tus servicios desde el celular.");
    expect(html).not.toMatch(/pagá|factura|reclamo|cobertura/i);
  });

  it("tracks only the approved aggregate download metadata", () => {
    const metadata = coopOnlineDownloadMetadata("quick_actions_app");
    expect(metadata).toEqual({ platform: "android", source: "quick_actions_app", destination: "google_play" });
    expect(JSON.stringify(metadata)).not.toMatch(/nombre|dni|email|teléfono|domicilio/i);
  });

  it("keeps the app promotion in Home quick actions and contact, not Footer", () => {
    const footerSource = readFileSync(new URL("../ui.tsx", import.meta.url), "utf8");
    const homeActionsSource = readFileSync(new URL("./home-quick-actions.tsx", import.meta.url), "utf8");
    expect(footerSource).not.toContain("footer_app");
    expect(footerSource).toContain('source="contact_app"');
    expect(homeActionsSource).toContain("<CoopOnlineQuickAction />");
    expect(homeActionsSource).not.toContain("Llegá directamente al próximo paso.");
    expect(homeActionsSource.match(/home-quick-actions-all/g)).toHaveLength(1);
    expect(homeActionsSource.indexOf("home-quick-actions-all")).toBeLessThan(homeActionsSource.indexOf("home-quick-actions-grid"));
    const styles = readFileSync(new URL("../globals.css", import.meta.url), "utf8");
    expect(styles).toMatch(/\.coop-online-quick-action\{[^}]*grid-column:span 2/);
  });
});
import { readFileSync } from "node:fs";
