import { describe, expect, it } from "vitest";
import { safePageHref, sitePageInputSchema } from "./site-pages";
import { servicePages, withPublicContacts } from "./service-pages";

describe("site page link validation", () => {
  it("accepts safe internal and supported external links", () => {
    expect(safePageHref.safeParse("/internet").success).toBe(true);
    expect(safePageHref.safeParse("https://wa.me/542974000000").success).toBe(true);
    expect(safePageHref.safeParse("tel:+542974000000").success).toBe(true);
    expect(safePageHref.safeParse("http://untrusted.example").success).toBe(false);
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
  it("allows only image sources supported by Next Image", () => {
    expect(sitePageInputSchema.safeParse({ slug: "internet", eyebrow: "Conectividad", title: "Internet", intro: "Información oficial", imageUrl: "/images/coopsar-connectivity.png", items: [], status: "draft", sortOrder: 0 }).success).toBe(true);
    expect(sitePageInputSchema.safeParse({ slug: "internet", eyebrow: "Conectividad", title: "Internet", intro: "Información oficial", imageUrl: "https://untrusted.example/image.jpg", items: [], status: "draft", sortOrder: 0 }).success).toBe(false);
  });
  it("uses only the configured Supabase host for Storage images", () => {
    const prior = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://wwvqlbycwzxvjnexklwg.supabase.co";
    const base = { slug: "internet", eyebrow: "Conectividad", title: "Internet", intro: "Información oficial", items: [], status: "draft", sortOrder: 0 };
    try {
      expect(sitePageInputSchema.safeParse({ ...base, imageUrl: "https://wwvqlbycwzxvjnexklwg.supabase.co/storage/v1/object/public/news-images/a.jpg" }).success).toBe(true);
      expect(sitePageInputSchema.safeParse({ ...base, imageUrl: "https://hfmasofcekigldbysryg.supabase.co/storage/v1/object/public/news-images/a.jpg" }).success).toBe(false);
      expect(sitePageInputSchema.safeParse({ ...base, imageUrl: "https://www.coopsar.com.ar/wp-content/uploads/a.jpg" }).success).toBe(true);
      expect(sitePageInputSchema.safeParse({ ...base, imageUrl: "javascript:alert(1)" }).success).toBe(false);
      expect(sitePageInputSchema.safeParse({ ...base, imageUrl: "data:image/png;base64,AAAA" }).success).toBe(false);
    } finally {
      if (prior === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = prior;
    }
  });
  it("keeps published CMS contact cards dynamic", () => {
    const cmsPage = { ...servicePages.contacto, items: [...servicePages.contacto.items] };
    const resolved = withPublicContacts(cmsPage, [{ id: "test", service: "general", channelType: "whatsapp", label: "WhatsApp", value: "+54 9 299 000 0000", purpose: "general_contact" }]);
    expect(resolved.items.find(([title]) => title === "WhatsApp comercial")?.[1]).toBe("+54 9 299 000 0000");
  });
});
