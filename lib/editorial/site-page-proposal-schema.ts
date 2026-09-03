import { z } from "zod";

export const sitePageEditorialProposalSchema = z.object({
  rewritten_eyebrow: z.string().trim().min(2).max(120),
  rewritten_title: z.string().trim().min(2).max(180),
  rewritten_intro: z.string().trim().min(2).max(1200),
  editorial_notes: z.string().trim().min(1).max(2000),
}).strict();

export type SitePageEditorialProposal = z.infer<typeof sitePageEditorialProposalSchema>;

export function parseSitePageEditorialProposal(value: unknown) {
  return sitePageEditorialProposalSchema.safeParse(value);
}
