import { describe, expect, it } from "vitest";
import { helpArticleParagraphs, isCanonicalHelpArticleSlug, isPublishedHelpArticle } from "./help-article-visibility";

describe("public help article visibility", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");

  it("includes only a published article whose timestamp is current", () => {
    expect(isPublishedHelpArticle({ status: "published", published_at: "2026-09-01T11:59:00.000Z" }, now)).toBe(true);
    expect(isPublishedHelpArticle({ status: "draft", published_at: null }, now)).toBe(false);
    expect(isPublishedHelpArticle({ status: "published", published_at: "2026-09-01T12:01:00.000Z" }, now)).toBe(false);
    expect(isPublishedHelpArticle({ status: "published", published_at: null }, now)).toBe(false);
  });

  it("accepts only canonical public slugs and keeps content as escaped text paragraphs", () => {
    expect(isCanonicalHelpArticleSlug("energia-estimar-consumo")).toBe(true);
    expect(isCanonicalHelpArticleSlug("energia/estimar")).toBe(false);
    expect(helpArticleParagraphs("Primer párrafo\n\n<script>alert('x')</script>")).toEqual(["Primer párrafo", "<script>alert('x')</script>"]);
  });
});
