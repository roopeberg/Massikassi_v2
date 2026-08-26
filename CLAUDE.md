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

### Core expense flow
- **Status:** ✅ Completed
- **Last updated:** 2026-08-26

Create event (name + first user + optional email, honeypot spam field) → link-only
access → add users → add/edit/delete payments → live balances + settlement
suggestions. Verified end-to-end in a real browser against a Dockerized Postgres.

### i18n
- **Status:** ⛔ Descoped from MVP
- **Last updated:** 2026-08-26

UI strings are hardcoded in Finnish. The original app's fi/en dictionaries were
themselves very sparsely translated, so this was cut to keep scope down.
Revisit only if English support is actually needed — strings aren't centralized
yet, so this would mean extracting them into a dictionary first.

### Feedback form / marketing pages (tutorial, examples, wtfaq)
- **Status:** ⛔ Not built
- **Last updated:** 2026-08-26

The original's feedback form was already broken (hardcoded placeholder
recipient) and these pages are inessential — cut from the MVP rewrite.

### Deployment
- **Status:** 🚧 Docker setup built and tested, not yet deployed anywhere
- **Last updated:** 2026-08-26

Decided against cloud hosting (Vercel/Neon, Azure) in favor of self-hosting on
an office machine with one of the org's static public IPs — genuinely the
cheapest option (no cloud bill at all) and, unlike any EU-region cloud option,
keeps the data fully in Finland with no third-party company involved at all.

`Dockerfile` + `docker-compose.yml` + `Caddyfile` implement this: three
containers (app, Postgres, Caddy for automatic HTTPS), fully tested locally
(build, migrate, containerized app ↔ Postgres round-trip all verified
working). Full setup instructions in [DEPLOY.md](DEPLOY.md). Still needed
before this goes live: pick the actual domain, point its DNS A record at the
office's static IP, forward ports 80/443 to the machine, and run the compose
stack there.

Tradeoffs accepted with this choice (see DEPLOY.md): no redundancy if the
office's power/internet drops, no managed backups (a cron `pg_dump` is
documented but not automated), and self-owned OS/security patching.

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
