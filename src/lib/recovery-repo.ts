import { and, eq, gt, isNotNull, isNull } from "drizzle-orm";
import { db } from "./db/client";
import { confirmationRequests, eventRecovery, events, recoveryRequests } from "./db/schema";
import { findEventByHash } from "./repo";
import { emailKeyFor, generateToken, hashToken } from "./recovery-email";

const CONFIRMATION_TTL_MS = 60 * 60 * 1000; // 1 hour
const RECOVERY_TTL_MS = 45 * 60 * 1000; // 45 minutes

/**
 * Attaches (or re-requests confirmation for) a recovery email on an event.
 * Never returns or stores the email itself — only whether it was already
 * verified, and (if not) a one-time confirmation token for the caller to
 * email out. See lib/recovery-email.ts for why HMAC, not a plain hash.
 */
export async function attachRecoveryEmail(
  hash: string,
  email: string,
): Promise<{ alreadyVerified: true } | { alreadyVerified: false; token: string }> {
  const event = await findEventByHash(hash);
  const emailKey = emailKeyFor(email);

  const [existing] = await db
    .select()
    .from(eventRecovery)
    .where(and(eq(eventRecovery.eventId, event.id), eq(eventRecovery.emailKey, emailKey)))
    .limit(1);

  if (existing?.verifiedAt) {
    return { alreadyVerified: true };
  }

  const recoveryRowId = existing
    ? existing.id
    : (
        await db.insert(eventRecovery).values({ eventId: event.id, emailKey }).returning({ id: eventRecovery.id })
      )[0].id;

  const token = generateToken();
  await db.insert(confirmationRequests).values({
    eventRecoveryId: recoveryRowId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + CONFIRMATION_TTL_MS),
  });

  return { alreadyVerified: false, token };
}

/**
 * Consumes a confirmation token (single-use). Returns the event it
 * verified an email for, or null if the token is invalid/expired/already
 * used — those three cases are deliberately indistinguishable to the
 * caller, same enumeration-safety reasoning as the recovery flow.
 */
export async function confirmRecoveryEmail(token: string): Promise<{ hash: string; name: string } | null> {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [request] = await db
    .select()
    .from(confirmationRequests)
    .where(
      and(
        eq(confirmationRequests.tokenHash, tokenHash),
        isNull(confirmationRequests.usedAt),
        gt(confirmationRequests.expiresAt, now),
      ),
    )
    .limit(1);
  if (!request) return null;

  await db.update(confirmationRequests).set({ usedAt: now }).where(eq(confirmationRequests.id, request.id));
  await db.update(eventRecovery).set({ verifiedAt: now }).where(eq(eventRecovery.id, request.eventRecoveryId));

  const [row] = await db
    .select({ hash: events.hash, name: events.name })
    .from(eventRecovery)
    .innerJoin(events, eq(events.id, eventRecovery.eventId))
    .where(eq(eventRecovery.id, request.eventRecoveryId))
    .limit(1);
  return row ?? null;
}

/**
 * Starts a recovery request for an email address. Always does the same
 * "does a verified event exist for this address" lookup regardless of the
 * outcome, and returns null (no token, caller sends no email) rather than
 * throwing when there's nothing to recover — the caller's HTTP response is
 * identical either way, so a lookup miss must never be observable from
 * response shape or (as best effort) timing. See resolveRecoveryToken for
 * where the token is redeemed.
 */
export async function requestRecovery(email: string): Promise<string | null> {
  const emailKey = emailKeyFor(email);

  const [match] = await db
    .select({ id: eventRecovery.id })
    .from(eventRecovery)
    .where(and(eq(eventRecovery.emailKey, emailKey), isNotNull(eventRecovery.verifiedAt)))
    .limit(1);

  if (!match) {
    // Symmetric-ish cost to the token-issuing path below (one extra async
    // tick + a small fixed delay approximating an insert's latency) so a
    // timing side-channel doesn't trivially reveal "no such address".
    await new Promise((resolve) => setTimeout(resolve, 20));
    return null;
  }

  const token = generateToken();
  await db.insert(recoveryRequests).values({
    emailKey,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RECOVERY_TTL_MS),
  });
  return token;
}

/**
 * Consumes a recovery token (single-use) and returns every event with a
 * verified recovery email matching the same address — this is the one
 * place a recovery email is used for anything other than "does this exist",
 * and it happens entirely server-side against the request's own token, not
 * anything the caller can pass in directly.
 */
export async function resolveRecoveryToken(token: string): Promise<{ hash: string; name: string }[] | null> {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [request] = await db
    .select()
    .from(recoveryRequests)
    .where(and(eq(recoveryRequests.tokenHash, tokenHash), isNull(recoveryRequests.usedAt), gt(recoveryRequests.expiresAt, now)))
    .limit(1);
  if (!request) return null;

  await db.update(recoveryRequests).set({ usedAt: now }).where(eq(recoveryRequests.id, request.id));

  return db
    .select({ hash: events.hash, name: events.name })
    .from(eventRecovery)
    .innerJoin(events, eq(events.id, eventRecovery.eventId))
    .where(and(eq(eventRecovery.emailKey, request.emailKey), isNotNull(eventRecovery.verifiedAt)));
}

/** For the event settings UI: is there at least one verified recovery email? No identity, just presence. */
export async function hasVerifiedRecoveryEmail(hash: string): Promise<boolean> {
  const event = await findEventByHash(hash);
  const [row] = await db
    .select({ id: eventRecovery.id })
    .from(eventRecovery)
    .where(and(eq(eventRecovery.eventId, event.id), isNotNull(eventRecovery.verifiedAt)))
    .limit(1);
  return !!row;
}
