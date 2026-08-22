export const historicalEditorialEntityTypes = ["help_article", "faq", "service"] as const;
export const isHistoricalEditorialEntityType = (value: string): value is typeof historicalEditorialEntityTypes[number] => historicalEditorialEntityTypes.includes(value as typeof historicalEditorialEntityTypes[number]);
const asStringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export function validationForSourceSlugs(sourceSlugs: string[], queue: Array<{ status: string; source_slugs: unknown; reason?: string | null; priority?: string | null }>) {
  const sources = new Set(sourceSlugs);
  const matching = queue.find((item) => item.status === "open" && asStringArray(item.source_slugs).some((source) => sources.has(source)));
  return matching ? { pending: true, reason: matching.reason ?? undefined, priority: matching.priority as "P0" | "P1" | "P2" | "P3" | undefined } : { pending: false };
}
