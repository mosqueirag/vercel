export type CoverageStatus = "available" | "nearby" | "planned" | "unavailable" | "unknown";
export type CoverageRecord = { street_number: number; plan_name: string | null; technology: string; coverage_status: CoverageStatus };

export function selectCoverage(records: CoverageRecord[], requestedNumber: number) {
  if (!records.length) return { status: "unknown" as const, nearest: [], distance: null };
  const distance = Math.min(...records.map((record) => Math.abs(record.street_number - requestedNumber)));
  const nearest = records.filter((record) => Math.abs(record.street_number - requestedNumber) === distance)
    .sort((a, b) => a.street_number - b.street_number || (a.plan_name ?? "").localeCompare(b.plan_name ?? "") || a.technology.localeCompare(b.technology));
  // A non-exact address is never commercially confirmed, regardless of the nearby row status.
  return { status: distance === 0 ? nearest[0].coverage_status : "nearby" as const, nearest, distance };
}
