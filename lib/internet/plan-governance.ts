export type InternetPlanStatus = "draft" | "published" | "archived";

export type InternetPlanCommercialFields = {
  name: string;
  audience: "home" | "business" | "enterprise" | "all" | null;
  technology: string | null;
  priceAmount: number | null;
  currency: string | null;
};

/** Keeps publication rules server-side and independent from the admin form. */
export function publicationIssues(plan: InternetPlanCommercialFields) {
  const issues: string[] = [];
  if (!plan.name.trim()) issues.push("name");
  if (!plan.audience) issues.push("audience");
  if (!plan.technology?.trim()) issues.push("technology");
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
