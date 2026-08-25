import { canonicalTechnology } from "../coverage-resolver";

export type InternetPlanStatus = "draft" | "published" | "archived";

export type InternetPlanCommercialFields = {
  name: string;
  audience: "home" | "business" | "enterprise" | "all" | null;
  technology: string | null;
  priceAmount: number | null;
  currency: string | null;
};

/**
 * Commercial publication uses the same technology normalizer as coverage.
 * ADSL remains a legacy technical label until a human confirms it is part of
 * the current public offer; only FTTH and WIRELESS are currently publishable.
 */
export function canonicalCommercialTechnology(value: string | null | undefined) {
  const technology = canonicalTechnology(value);
  return technology === "FTTH" || technology === "WIRELESS" ? technology : null;
}

/** Keeps publication rules server-side and independent from the admin form. */
export function publicationIssues(plan: InternetPlanCommercialFields) {
  const issues: string[] = [];
  if (!plan.name.trim()) issues.push("name");
  if (!plan.audience) issues.push("audience");
  if (!canonicalCommercialTechnology(plan.technology)) issues.push("technology");
  if ((plan.priceAmount === null) !== (plan.currency === null)) issues.push("price_currency");
  return issues;
}

export function canPublishInternetPlan(plan: InternetPlanCommercialFields) {
  return publicationIssues(plan).length === 0;
}

export function normalizePlanBenefits(benefits: string[]) {
  return benefits.map((benefit) => benefit.trim()).filter(Boolean).slice(0, 20);
}

/** Draft-only edits prevent an accidental live edit to a published commercial offer. */
export function canEditPlan(status: InternetPlanStatus) {
  return status === "draft";
}
