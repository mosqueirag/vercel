export const DEFAULT_COVERAGE_ADDRESS_MARGIN = 150;

const STREET_PREFIX = /^(?:CALLE|AVENIDA|AV|AV\.|BV|BV\.|BOULEVARD|PASAJE|PJE|RUTA)\s+/;

export function normalizeStreet(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(STREET_PREFIX, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseServiceAddress(value: string) {
  const clean = value.trim().replace(/\s+/g, " ");
  const marked = clean.match(/^(.*?)\s+N\s*[\u00b0\u00baO.]?\s*(\d{1,6})(?:\b|\s)/i);
  const trailing = clean.match(/^(.*?)\s+(\d{1,6})(?:\s*[A-Za-z])?\s*$/);
  const leading = clean.match(/^\s*(\d{1,6})(?:\s*[A-Za-z])?\s+(.+)$/);
  const match = marked
    ? { street: marked[1], number: Number(marked[2]) }
    : trailing
      ? { street: trailing[1], number: Number(trailing[2]) }
    : leading
      ? { street: leading[2], number: Number(leading[1]) }
      : null;

  if (!match || !match.street || !Number.isSafeInteger(match.number)) return null;
  const streetNormalized = normalizeStreet(match.street);
  return streetNormalized ? { streetNormalized, streetNumber: match.number } : null;
}

export function categoryDetails(category: string) {
  const normalized = category.toUpperCase();
  const speed = normalized.match(/(\d+)\s*MB/)?.[1];
  const technology = normalized.includes("ADSL")
    ? "ADSL"
    : normalized.includes("INALAMBRICO")
      ? "Internet inalámbrico"
      : normalized.includes("FTTH") || normalized.includes("FIBRA")
        ? "Fibra óptica"
        : "Internet";

  return { technology, speedMbps: speed ? Number(speed) : null };
}

export function configuredCoverageMargin() {
  const value = Number(process.env.COVERAGE_ADDRESS_MARGIN ?? DEFAULT_COVERAGE_ADDRESS_MARGIN);
  return Number.isInteger(value) && value >= 0 && value <= 1000 ? value : DEFAULT_COVERAGE_ADDRESS_MARGIN;
}
