/**
 * Deletes every event whose expires_at has passed (and, via cascade,
 * everything under it — users, payments, dues). Events with expires_at =
 * null ("keep forever") are never touched.
 *
 * Meant to run on a schedule (e.g. a daily cron entry on the host, see
 * DEPLOY.md) — this script does not schedule itself.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/flush-expired-events.ts
 *   DATABASE_URL=postgres://... npx tsx scripts/flush-expired-events.ts --dry-run
 */

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const dryRun = process.argv.includes("--dry-run");

if (!databaseUrl) {
  console.error("Set DATABASE_URL.");
  process.exit(1);
}

async function main() {
  const sql = postgres(databaseUrl!);
  try {
    const expired = await sql<{ id: number; name: string; expires_at: Date }[]>`
      SELECT id, name, expires_at FROM events WHERE expires_at IS NOT NULL AND expires_at < now()
    `;

    if (expired.length === 0) {
      console.log("Nothing expired.");
      return;
    }

    for (const e of expired) {
      console.log(`${dryRun ? "[dry run] would delete" : "deleting"} event ${e.id} "${e.name}" (expired ${e.expires_at.toISOString()})`);
    }

    if (dryRun) return;

    await sql`DELETE FROM events WHERE expires_at IS NOT NULL AND expires_at < now()`;
    console.log(`Deleted ${expired.length} expired event(s).`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
