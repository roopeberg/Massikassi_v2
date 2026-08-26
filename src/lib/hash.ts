import { randomBytes } from "crypto";

/**
 * Generates an unguessable, URL-safe capability token used as the event's
 * access hash. The original app used Math.random() for this, which is not
 * cryptographically secure — this is the one deliberate security fix that
 * carries over into the rewrite even though everything else about the
 * link-only access model is unchanged.
 */
export function generateHash(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}
