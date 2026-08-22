import { describe, expect, it } from "vitest";
import { publicContactQueryErrorDetails } from "./public-content";

describe("public contact query observability", () => {
  it("classifies an intermittent PostgREST claim failure without retaining provider details", () => {
    const details = publicContactQueryErrorDetails("PGRST303");
    expect(details).toEqual({ operation: "published_contact_read", code: "PGRST303", category: "auth_claims_rejected" });
    expect(JSON.stringify(details)).not.toContain("message");
  });

  it("uses a safe generic classification for other failures", () => {
    expect(publicContactQueryErrorDetails(null)).toEqual({ operation: "published_contact_read", code: "unknown", category: "query_failed" });
  });
});
