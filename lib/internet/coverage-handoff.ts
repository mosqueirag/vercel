export type PublicInternetPlan = {
  id: string;
  name: string;
  slug: string;
  technology: string | null;
  speed_down_mbps: number | null;
  speed_up_mbps?: number | null;
  price_amount: number | null;
  currency: string | null;
};

export type PublicCoverageResult = {
  coverageStatus: "available" | "nearby" | "planned" | "unavailable" | "unknown";
  coverageSource: "exact_address" | "geographic_zone" | "nearby_address" | "unknown";
  technology: string | null;
  technologies: string[];
  commercialAvailability: boolean;
  plans: PublicInternetPlan[];
  nextAction: "installation" | "coverage_validation" | "fiber_waitlist";
  message: string;
  zoneMatch: boolean;
};

export const showInternetPlansEvent = "coopsar:show-internet-plans";

export type ShowInternetPlansDetail = {
  street: string;
  number: string;
  coverage: PublicCoverageResult;
};
