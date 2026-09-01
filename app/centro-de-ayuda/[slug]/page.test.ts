import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(process.cwd(), "app/centro-de-ayuda/[slug]/page.tsx"), "utf8");

describe("public help article route", () => {
  it("uses the published-only server data model and safe React paragraph rendering", () => {
    expect(page).toContain("getPublishedHelpArticleBySlug");
    expect(page).toContain("notFound()");
    expect(page).toContain("helpArticleParagraphs");
    expect(page).not.toContain("dangerouslySetInnerHTML");
  });

  it("keeps the canonical help namespace independent from the generic slug route", () => {
    expect(page).toContain('href="/centro-de-ayuda"');
    expect(page).toContain("generateMetadata");
  });
});
