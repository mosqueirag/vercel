import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/data/public-content", () => ({ getPublicContacts: vi.fn(async () => [{ service: "funeral", purpose: "emergency", label: "Guardia de Sepelio", value: "+54 9 297 000-0000" }]), getPublishedFuneralFaqs: vi.fn(async () => []) }));
vi.mock("../../lib/data/site-pages", () => ({ getPublishedSitePage: vi.fn(async () => null) }));
vi.mock("../../lib/service-pages", () => ({ servicePages: { sepelio: { eyebrow: "Servicio solidario", title: "Acompañamiento cuando más se necesita", intro: "Orientación y guardias del Servicio Solidario de Sepelios." } } }));
vi.mock("../ui", () => ({ Header: () => <header>Header</header>, Footer: () => <footer>Footer</footer> }));
vi.mock("../components/sepelio-coopia-action", () => ({ SepelioCoopiaAction: ({ children, className }: { children: React.ReactNode; className?: string }) => <button className={className}>{children}</button> }));
import SepelioPage from "./page";

describe("SepelioPage", () => { it("prioritizes urgent help and omits empty published FAQs without a sensitive form", async () => { const html = renderToStaticMarkup(await SepelioPage()); expect(html).toContain("Llamar a guardia"); expect(html).toContain("Mi grupo familiar"); expect(html).toContain('href="tel:+5492970000000"'); expect(html).not.toContain("Preguntas frecuentes"); expect(html).not.toContain("<form"); }); });
