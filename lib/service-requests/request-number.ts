export function createServiceRequestNumber(date = new Date(), uuid = crypto.randomUUID()) {
  return `SRV-${date.getUTCFullYear()}-${uuid.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}
