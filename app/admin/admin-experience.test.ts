import { describe, expect, it } from "vitest";
import { adminNavigationGroups } from "./admin-navigation";
import { adminLoginCopy } from "./login-form";

describe("admin experience navigation", () => {
  it("keeps each visible destination unique", () => {
    const hrefs = adminNavigationGroups.flatMap((group) => group.items.map((item) => item.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("uses management as its only summary destination", () => {
    const labels = adminNavigationGroups.flatMap((group) => group.items).filter((item) => item.href === "/admin/gestion").map((item) => item.label);
    expect(labels).toEqual(["Resumen"]);
  });

  it("keeps login copy focused on authorization rather than implementation details", () => {
    expect(adminLoginCopy.authorizedOnly).toContain("administradores autorizados");
    expect(adminLoginCopy.authorizedOnly.toLowerCase()).not.toContain("supabase");
  });
});
