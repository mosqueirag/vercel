import { describe, expect, it } from "vitest";
import { applySitePageCopyProposal, applySitePageTopLevelProposal, isSitePageEditorialSlug, sitePageEditorialSourceHash } from "./site-page-bridge";

const page = { eyebrow: "Sección", title: "Título", intro: "Introducción", imageUrl: "/images/a.jpg", slug: "institucional", status: "draft", sortOrder: 10, items: [{ title: "Uno", text: "Texto", href: "/tramites" }] };
describe("site page editorial bridge", () => {
  it("preserves href and changes copy only", () => expect(applySitePageCopyProposal(page, { rewritten_title: "Nuevo", items: [{ sourceIndex: 0, originalHref: "/tramites", rewrittenTitle: "Dos", rewrittenText: "Nuevo texto" }] })).toEqual({ eyebrow: "Sección", title: "Nuevo", intro: "Introducción", items: [{ title: "Dos", text: "Nuevo texto", href: "/tramites" }] }));
  it("blocks a changed href or invalid source index", () => { expect(applySitePageCopyProposal(page, { items: [{ sourceIndex: 0, originalHref: "/otro", rewrittenTitle: "Dos" }] })).toBeNull(); expect(applySitePageCopyProposal(page, { items: [{ sourceIndex: 1, originalHref: "/tramites" }] })).toBeNull(); });
  it("hashes href and protected structural snapshot", () => expect(sitePageEditorialSourceHash(page)).not.toBe(sitePageEditorialSourceHash({ ...page, items: [{ ...page.items[0], href: "/otro" }] })));
  it("applies top-level copy without changing any item", () => {
    expect(applySitePageTopLevelProposal(page, { rewritten_eyebrow: "Ayuda", rewritten_title: "Centro", rewritten_intro: "Guías", editorial_notes: "Copy claro" })).toEqual({ eyebrow: "Ayuda", title: "Centro", intro: "Guías" });
    expect(page.items).toEqual([{ title: "Uno", text: "Texto", href: "/tramites" }]);
  });
  it("limits generation inventory to the four approved page slugs", () => {
    expect(isSitePageEditorialSlug("centro-de-ayuda")).toBe(true);
    expect(isSitePageEditorialSlug("energia")).toBe(false);
  });
});
