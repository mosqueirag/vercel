import type { EditorialEntityType } from "./proposals";
import type { EditorialProposalStatus } from "./review-interaction";

export type ContentInventoryRecord = {
  contentType: EditorialEntityType | "site_page";
  status: "draft" | "published" | "archived";
  hasProvenance?: boolean;
  validationPending?: boolean;
  proposalStatus?: EditorialProposalStatus;
};

export type ContentInventorySummary = {
  total: number;
  draft: number;
  published: number;
  archived: number;
  withProvenance: number;
  validationPending: number;
  generated: number;
  approved: number;
  applied: number;
  readyForHumanReview: number;
};

export function aggregateContentInventory(
  records: readonly ContentInventoryRecord[],
): ContentInventorySummary {
  return records.reduce<ContentInventorySummary>(
    (summary, record) => ({
      total: summary.total + 1,
      draft: summary.draft + Number(record.status === "draft"),
      published: summary.published + Number(record.status === "published"),
      archived: summary.archived + Number(record.status === "archived"),
      withProvenance: summary.withProvenance + Number(record.hasProvenance === true),
      validationPending:
        summary.validationPending + Number(record.validationPending === true),
      generated: summary.generated + Number(record.proposalStatus === "generated"),
      approved: summary.approved + Number(record.proposalStatus === "approved"),
      applied: summary.applied + Number(record.proposalStatus === "applied"),
      readyForHumanReview:
        summary.readyForHumanReview +
        Number(
          record.proposalStatus === "generated" ||
            record.proposalStatus === "needs_validation",
        ),
    }),
    {
      total: 0,
      draft: 0,
      published: 0,
      archived: 0,
      withProvenance: 0,
      validationPending: 0,
      generated: 0,
      approved: 0,
      applied: 0,
      readyForHumanReview: 0,
    },
  );
}

export const publicContentSourceMap = {
  services: { web: "service pages", coopia: true, editorialPipeline: true },
  help_articles: { web: "help center", coopia: true, editorialPipeline: true },
  faqs: { web: "FAQ surfaces", coopia: true, editorialPipeline: true },
  internet_plans: { web: "/internet", coopia: true, editorialPipeline: false },
  public_contact_channels: { web: "public CTAs", coopia: true, editorialPipeline: false },
  site_pages: { web: "page body", coopia: false, editorialPipeline: false },
  news_articles: { web: "news", coopia: false, editorialPipeline: false },
} as const;
