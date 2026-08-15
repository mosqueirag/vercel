const JOURNEY_PATTERN = /^JRN-\d{4}-[A-F0-9]{8}$/;
const SESSION_PATTERN = /^SES-[A-F0-9]{16}$/;

function token(length: number) {
  return crypto.randomUUID().replaceAll("-", "").slice(0, length).toUpperCase();
}

export function createJourneyId(date = new Date()) { return `JRN-${date.getUTCFullYear()}-${token(8)}`; }
export function createSessionId() { return `SES-${token(16)}`; }
export function isJourneyId(value: string) { return JOURNEY_PATTERN.test(value); }
export function isSessionId(value: string) { return SESSION_PATTERN.test(value); }
