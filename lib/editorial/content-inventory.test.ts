import { describe, expect, it } from "vitest";

import {
  aggregateContentInventory,
  publicContentSourceMap,
} from "./content-inventory";

describe("aggregateContentInventory", () => {
  it("keeps publication, provenance and review states distinct", () => {
    expect(
      aggregateContentInventory([
        {
          contentType: "faq",
          status: "draft",
          hasProvenance: true,
          proposalStatus: "generated",
        },
        {
          contentType: "help_article",
          status: "draft",
          hasProvenance: true,
          validationPending: true,
          proposalStatus: "needs_validation",
        },
        { contentType: "service", status: "published" },
      ]),
    ).toEqual({
      total: 3,
      draft: 2,
      published: 1,
      archived: 0,
      withProvenance: 2,
      validationPending: 1,
      generated: 1,
      approved: 0,
      applied: 0,
      readyForHumanReview: 2,
    });
  });

  it("makes the site page editorial-pipeline gap explicit", () => {
    expect(publicContentSourceMap.site_pages).toEqual({
      web: "page body",
      coopia: false,
      editorialPipeline: false,
    });
  });
});
