/**
 * Generates a deterministic idempotency key from email + amount + sessionUUID.
 *
 * Same inputs within the same browser session → same key.
 * The server (or in-memory map) deduplicates on this key, so retries never
 * create a second record even if the first request silently succeeded.
 */
export function generateIdempotencyKey(email: string, amount: number): string {
  const raw = `${email.trim().toLowerCase()}::${amount.toFixed(2)}::${getSessionKey()}`;
  return toBase62(djb2Hash(raw));
}

/** One UUID per browser session — survives retries, reset on page reload. */
function getSessionKey(): string {
  const KEY = "_eck_session";
  if (!sessionStorage.getItem(KEY)) {
    sessionStorage.setItem(KEY, crypto.randomUUID());
  }
  return sessionStorage.getItem(KEY)!;
}

/** Fast non-crypto djb2 hash. */
function djb2Hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 33) ^ str.charCodeAt(i)) >>> 0;
  }
  return h;
}

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function toBase62(num: number): string {
  if (num === 0) return "000000";
  let result = "";
  let n = num;
  while (n > 0) {
    result = CHARS[n % 62] + result;
    n = Math.floor(n / 62);
  }
  return result.padStart(6, "0");
}
