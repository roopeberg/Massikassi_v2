# Importing data from the original massikassi

`scripts/migrate-legacy-data.ts` copies the original app's data
(`api_event`/`api_user`/`api_payment`/`api_due`) into this rewrite's schema
(`events`/`users`/`payments`/`dues`). The two schemas map almost 1:1 — this
just renames columns and drops two that the original never actually used
(`api_event.timeline_hash`, `api_user.deleted`).

Every id is preserved as-is. That's what makes this safe: payments/dues
reference other rows by id (including a payment's own `original` link to the
payment it replaced), so keeping ids identical means every reference is
still correct with zero remapping.

## Usage

```bash
LEGACY_DATABASE_URL=postgres://... DATABASE_URL=postgres://... \
  npx tsx scripts/migrate-legacy-data.ts            # dry run: prints counts only

LEGACY_DATABASE_URL=postgres://... DATABASE_URL=postgres://... \
  npx tsx scripts/migrate-legacy-data.ts --apply    # actually writes
```

Run this against an **empty** target database (`npm run db:push` first) —
it inserts with explicit ids and will fail on a collision rather than
silently overwrite anything.

## What it does with the tricky bits

- **Old event hashes** (originally `Math.random()`-based, see
  [`src/lib/hash.ts`](src/lib/hash.ts)) are kept as-is, not regenerated —
  that preserves every link anyone already bookmarked. It doesn't
  retroactively weaken anything: the point of the `crypto.randomBytes`
  change was to stop generating new guessable hashes, not to invalidate old
  ones.
- **Soft-deleted payments** (`deleted`, `original`) carry straight over —
  edit history stays intact.
- Sequences for `events`/`users`/`payments` are reset after import (`setval`
  on each table's owning sequence) so the app's own future inserts don't
  collide with imported ids. `dues` has no incoming references from
  anywhere, so its ids are left to regenerate rather than preserved.

## Verified

Tested end-to-end against a throwaway Postgres seeded with the *original*
`db/schema.js`'s exact table definitions and a couple of realistic rows —
import ran clean, referential integrity held, and a manual insert
afterward confirmed the reset sequences don't collide with imported ids.
No real production data has gone through this yet; spot-check a migrated
event's balances against the old app before relying on it for real.
