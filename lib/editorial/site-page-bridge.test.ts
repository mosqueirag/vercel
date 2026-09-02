import { describe, expect, it } from "vitest";
import { applySitePageCopyProposal, sitePageEditorialSourceHash } from "./site-page-bridge";

const page = { eyebrow: "Sección", title: "Título", intro: "Introducción", imageUrl: "/images/a.jpg", slug: "institucional", status: "draft", sortOrder: 10, items: [{ title: "Uno", text: "Texto", href: "/tramites" }] };
describe("site page editorial bridge", () => {
  it("preserves href and changes copy only", () => expect(applySitePageCopyProposal(page, { rewritten_title: "Nuevo", items: [{ sourceIndex: 0, originalHref: "/tramites", rewrittenTitle: "Dos", rewrittenText: "Nuevo texto" }] })).toEqual({ eyebrow: "Sección", title: "Nuevo", intro: "Introducción", items: [{ title: "Dos", text: "Nuevo texto", href: "/tramites" }] }));
  it("blocks a changed href or invalid source index", () => { expect(applySitePageCopyProposal(page, { items: [{ sourceIndex: 0, originalHref: "/otro", rewrittenTitle: "Dos" }] })).toBeNull(); expect(applySitePageCopyProposal(page, { items: [{ sourceIndex: 1, originalHref: "/tramites" }] })).toBeNull(); });
  it("hashes href and protected structural snapshot", () => expect(sitePageEditorialSourceHash(page)).not.toBe(sitePageEditorialSourceHash({ ...page, items: [{ ...page.items[0], href: "/otro" }] })));
});
