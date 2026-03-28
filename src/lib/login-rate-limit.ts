type RateLimitEntry = {
  count: number;
  blockedUntil: number | null;
  lastAttemptAt: number;
};

const RATE_LIMIT_RESET_MS = 60 * 60 * 1000;
const RATE_LIMIT_START = 4;
const RATE_LIMIT_MAX_MINUTES = 60;

const rateLimitStore = new Map<string, RateLimitEntry>();

function getEntry(key: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return { count: 0, blockedUntil: null, lastAttemptAt: now } as RateLimitEntry;
  }
  if (now - entry.lastAttemptAt > RATE_LIMIT_RESET_MS) {
    return { count: 0, blockedUntil: null, lastAttemptAt: now } as RateLimitEntry;
  }
  return entry;
}

function getBlockedMinutes(entry: { blockedUntil: number | null }, now: number) {
  if (!entry.blockedUntil || entry.blockedUntil <= now) return 0;
  return Math.ceil((entry.blockedUntil - now) / 60000);
}

export function getBlockedMinutesForKey(key: string) {
  const now = Date.now();
  const entry = getEntry(key);
  return getBlockedMinutes(entry, now);
}

export function registerFailure(key: string) {
  const now = Date.now();
  const entry = getEntry(key);
  entry.count += 1;
  entry.lastAttemptAt = now;
  if (entry.count >= RATE_LIMIT_START) {
    const minutes = Math.min(entry.count - (RATE_LIMIT_START - 1), RATE_LIMIT_MAX_MINUTES);
    entry.blockedUntil = now + minutes * 60 * 1000;
  }
  rateLimitStore.set(key, entry);
  return getBlockedMinutes(entry, now);
}

export function clearRateLimit(key: string) {
  rateLimitStore.delete(key);
}

export function getBlockedMinutesForEmail(email: string) {
  return getBlockedMinutesForKey(`email:${email.toLowerCase()}`);
}

export function clearRateLimitForEmail(email: string) {
  clearRateLimit(`email:${email.toLowerCase()}`);
}
