import { describe, expect, it } from "vitest";
import { isStagingInternetCommercialDemo, publicContactQueryErrorDetails, stagingInternetDemoPlanSlugs } from "./public-content";

describe("public contact query observability", () => {
  it("classifies an intermittent PostgREST claim failure without retaining provider details", () => {
    const details = publicContactQueryErrorDetails("PGRST303");
    expect(details).toEqual({ operation: "published_contact_read", code: "PGRST303", category: "auth_claims_rejected" });
    expect(JSON.stringify(details)).not.toContain("message");
  });

  it("uses a safe generic classification for other failures", () => {
    expect(publicContactQueryErrorDetails(null)).toEqual({ operation: "published_contact_read", code: "unknown", category: "query_failed" });
  });

  it("allows the curated draft catalog only in staging and never in production", () => {
    expect(isStagingInternetCommercialDemo({ appEnv: "staging", vercelEnv: "preview" })).toBe(true);
    expect(isStagingInternetCommercialDemo({ appEnv: "production", vercelEnv: "production" })).toBe(false);
    expect(isStagingInternetCommercialDemo({ appEnv: "staging", vercelEnv: "production" })).toBe(false);
  });

  it("keeps the staging demo catalog explicitly allowlisted", () => {
    expect(stagingInternetDemoPlanSlugs).toEqual([
      "plan-hogar-50-mb",
      "plan-hogar-100-mb",
      "inalambrico-20-mb",
      "ftth-comercial-y-educacional-50-mb",
      "plan-comercial-100-mb-simetrico",
    ]);
    expect(stagingInternetDemoPlanSlugs).not.toContain("adsl");
    expect(stagingInternetDemoPlanSlugs).not.toContain("plan-test-sin-precio");
  });
});
