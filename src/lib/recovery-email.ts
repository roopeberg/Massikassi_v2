import { createHash, createHmac, randomBytes } from "crypto";

/**
 * The privacy-critical primitives behind the recovery-email feature: an
 * email address is never stored anywhere (DB, logs, analytics) — only an
 * HMAC-SHA256 of it, keyed by a server-only secret. A plain (even salted)
 * hash would let anyone with just a DB dump test guesses against a list of
 * known addresses (email addresses aren't high-entropy secrets); HMAC also
 * needs EMAIL_HMAC_SECRET, which never leaves the server's environment.
 *
 * Confirmation/recovery tokens follow the same pattern: the plaintext token
 * exists only long enough to put it in an email, and only its SHA-256 is
 * stored (a keyed HMAC isn't needed here — the token itself is already
 * 256 bits of randomness, not a low-entropy value like an email address).
 */

function hmacSecret(): string {
  const secret = process.env.EMAIL_HMAC_SECRET;
  if (!secret) {
    throw new Error("EMAIL_HMAC_SECRET is not configured");
  }
  return secret;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** HMAC-SHA256(EMAIL_HMAC_SECRET, normalized_email), hex-encoded. */
export function emailKeyFor(email: string): string {
  return createHmac("sha256", hmacSecret()).update(normalizeEmail(email)).digest("hex");
}

/** A single-use confirmation/recovery token — 256 bits, URL-safe. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 of a token, hex-encoded — this is what gets stored, never the token itself. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
