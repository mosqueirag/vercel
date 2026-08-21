import { describe, expect, it } from "vitest";
import { safePageHref, sitePageInputSchema } from "./site-pages";

describe("site page link validation", () => {
  it("accepts safe internal and supported external links", () => {
    expect(safePageHref.safeParse("/internet").success).toBe(true);
    expect(safePageHref.safeParse("https://wa.me/542974000000").success).toBe(true);
    expect(safePageHref.safeParse("tel:+542974000000").success).toBe(true);
  });
  it("rejects dangerous URLs", () => {
    expect(safePageHref.safeParse("javascript:alert(1)").success).toBe(false);
    expect(safePageHref.safeParse("data:text/html,test").success).toBe(false);
    expect(safePageHref.safeParse("//untrusted.example").success).toBe(false);
  });
  it("requires system pages and typed items", () => {
    const result = sitePageInputSchema.safeParse({ slug: "internet", eyebrow: "Conectividad", title: "Internet", intro: "Información oficial", imageUrl: null, items: [{ title: "Cobertura", text: "Consultá disponibilidad", href: "/#contratar" }], status: "draft", sortOrder: 0 });
    expect(result.success).toBe(true);
  });
});
