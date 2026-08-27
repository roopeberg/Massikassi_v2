/**
 * One-off import of the original massikassi's data (api_event / api_user /
 * api_payment / api_due) into this rewrite's schema (events / users /
 * payments / dues).
 *
 * The two schemas map almost 1:1 — this just renames columns and drops two
 * columns the original app never actually used (`api_event.timeline_hash`,
 * `api_user.deleted` — no route ever set or read either). Every id is
 * preserved as-is (events/users/payments are referenced by other tables via
 * their id, including a payment's own `original` self-reference for its
 * edit history — preserving ids means those references stay correct with
 * zero remapping). `dues` has no incoming references from anywhere, so its
 * ids are left to regenerate.
 *
 * Usage:
 *   LEGACY_DATABASE_URL=postgres://... DATABASE_URL=postgres://... \
 *     npx tsx scripts/migrate-legacy-data.ts            # dry run: prints counts only
 *   LEGACY_DATABASE_URL=postgres://... DATABASE_URL=postgres://... \
 *     npx tsx scripts/migrate-legacy-data.ts --apply    # actually writes
 *
 * Old event hashes (originally generated with Math.random(), see
 * lib/hash.ts) are kept as-is on import rather than regenerated — that
 * preserves every already-bookmarked event link instead of silently
 * breaking them. It doesn't retroactively weaken anything: the point of the
 * crypto.randomBytes change was to stop generating *new* guessable hashes,
 * not to invalidate old ones.
 *
 * Imported events get expires_at = null (kept forever, not the 3-month
 * default new events get) — see scripts/flush-expired-events.ts. Importing
 * old data on purpose and then having it silently auto-delete a few months
 * later would defeat the point of importing it.
 */

import postgres from "postgres";

const legacyUrl = process.env.LEGACY_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
const apply = process.argv.includes("--apply");

if (!legacyUrl || !targetUrl) {
  console.error("Set both LEGACY_DATABASE_URL and DATABASE_URL.");
  process.exit(1);
}

interface LegacyEvent {
  id: number;
  name: string;
  hash: string;
  created: Date;
  created_by: string;
}
interface LegacyUser {
  id: number;
  name: string;
  event_id: number;
  email: string | null;
}
interface LegacyPayment {
  id: number;
  event_id: number;
  description: string;
  amount: string;
  created: Date;
  modified: Date | null;
  deleted: boolean;
  original: number | null;
}
interface LegacyDue {
  user_id: number;
  amount: string;
  payer: boolean;
  payment_id: number;
}

async function main() {
  const legacy = postgres(legacyUrl!);
  const target = postgres(targetUrl!);

  try {
    const [events, users, payments, dues] = await Promise.all([
      legacy<LegacyEvent[]>`SELECT id, name, hash, created, created_by FROM api_event ORDER BY id`,
      legacy<LegacyUser[]>`SELECT id, name, event_id, email FROM api_user ORDER BY id`,
      legacy<LegacyPayment[]>`SELECT id, event_id, description, amount, created, modified, deleted, original FROM api_payment ORDER BY id`,
      legacy<LegacyDue[]>`SELECT user_id, amount, payer, payment_id FROM api_due ORDER BY payment_id`,
    ]);

    console.log(
      `Found: ${events.length} events, ${users.length} users, ${payments.length} payments, ${dues.length} dues.`,
    );

    if (!apply) {
      console.log("Dry run only — pass --apply to actually write these into the target database.");
      return;
    }

    await target.begin(async (tx) => {
      for (const e of events) {
        await tx`INSERT INTO events (id, name, hash, created_by, created) VALUES (${e.id}, ${e.name}, ${e.hash}, ${e.created_by}, ${e.created})`;
      }
      for (const u of users) {
        await tx`INSERT INTO users (id, event_id, name, email) VALUES (${u.id}, ${u.event_id}, ${u.name}, ${u.email})`;
      }
      for (const p of payments) {
        await tx`INSERT INTO payments (id, event_id, description, amount, created, modified, deleted, original_id)
                 VALUES (${p.id}, ${p.event_id}, ${p.description}, ${p.amount}, ${p.created}, ${p.modified ?? p.created}, ${p.deleted}, ${p.original})`;
      }
      for (const d of dues) {
        await tx`INSERT INTO dues (user_id, amount, payer, payment_id) VALUES (${d.user_id}, ${d.amount}, ${d.payer}, ${d.payment_id})`;
      }

      // Explicit ids don't advance the owning sequences — fix that up so
      // the app's own future inserts don't collide with imported ids.
      for (const table of ["events", "users", "payments"]) {
        await tx`SELECT setval(pg_get_serial_sequence(${table}, 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${tx(table)}))`;
      }
    });

    console.log("Import complete. Spot-check a migrated event's balances against the old app before relying on it.");
  } finally {
    await legacy.end();
    await target.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
