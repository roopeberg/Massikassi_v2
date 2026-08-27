# Claude Code Development Guide

## Project Structure

This file documents ongoing AI-assisted development for massikassi-v2. It's the
spec/status file to keep up to date as the project evolves, same convention as
the other projects in this workspace (e.g. `beacon/CLAUDE.md`).

## What this is

A full rewrite of [mkirvela/massikassi](https://github.com/mkirvela/massikassi),
a free, anonymous, link-only expense-sharing app (Finnish "mökkikassi"-style:
split shared costs for a trip/event and settle up at the end). The original was
built in 2015 on a now-dead toolchain (Node 0.10, Express 3, React 0.10,
Bower/Grunt/Browserify) — this is a from-scratch rewrite with the same feature
set and identical splitting/settlement math, on a current stack.

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Database:** Postgres + Drizzle ORM (`src/lib/db/schema.ts`, `drizzle.config.ts`)
- **Styling:** Tailwind CSS
- **Tests:** Vitest (`src/lib/domain/*.test.ts`)
- **Access model:** no accounts — a cryptographically random link (`/event/[hash]`)
  is the only credential, same philosophy as the original app, just with
  `crypto.randomBytes` instead of `Math.random()` for the hash.

## Architecture

- `src/lib/domain/divide.ts` — fair cent-splitting of a payment among payers/sharers.
  Ported 1:1 from the original `server/db.js` (`divideFairly`/`dividePayment`).
- `src/lib/domain/resolve.ts` — net balances + greedy debt-settlement ("who pays
  whom"). Ported 1:1 from the original `public/js/utils.js` (`resolve()`), but
  returns structured `{from, to, amountCents}` data instead of pre-formatted
  English sentences, so the UI can render it in any language.
- `src/lib/repo.ts` — all DB access (events/users/payments/dues), transactional
  where it matters (creating an event + first user, adding/editing a payment +
  its dues).
- `src/lib/validation.ts` — Zod schemas for every API input.
- `src/app/api/**` — REST-ish route handlers, thin wrappers around `repo.ts`.
- `src/components/EventClient.tsx` — the interactive event page (add/edit/delete
  payment, add user, edit event name), hydrated from a server-rendered initial
  fetch in `src/app/event/[hash]/page.tsx`.

Both `divide.ts` and `resolve.ts` are tested against the same numeric cases as
the original project's `test/test.db.js` (golden-master values), e.g. two
payers + one sharer on 100 → balances `-10000 / 5000 / 5000`.

## Feature status

Moved to [TODO.md](TODO.md) — per-feature status log (done/open, why, dates).
Keep that file updated as things change; this file stays architecture/setup.

## Known environment quirk (this machine)

The Homebrew `node` binary on this Mac is Gatekeeper-rejected (ad-hoc signed),
which blocks `node`'s own filesystem operations (unlink, Turbopack's native
lockfile) under the real home directory in at least some execution contexts —
`npm install`/`npm run build`/`npm run dev` may fail with `EPERM` depending on
how they're invoked. If that happens, check `spctl -a -vv $(which node)`. This
is unrelated to the app itself.

## Local development

```bash
npm install                 # already done if node_modules is present
cp .env.example .env.local  # set DATABASE_URL
npm run db:push             # create tables
npm run dev
```

```bash
npm test          # domain logic (divide/resolve) unit tests
npx tsc --noEmit  # typecheck
npm run lint
npm run build
```
