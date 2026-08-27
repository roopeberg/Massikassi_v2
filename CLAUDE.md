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
- `src/app/globals.css` — the design system. Every colour in the app is a
  semantic token here (`canvas`, `surface`, `ink*`, `accent*`, `positive`,
  `negative`, `avatar-1..4`, ...), each a `light-dark()` pair mapped to Tailwind
  utilities via `@theme inline`. See [Styling](#styling) before touching colour.

Both `divide.ts` and `resolve.ts` are tested against the same numeric cases as
the original project's `test/test.db.js` (golden-master values), e.g. two
payers + one sharer on 100 → balances `-10000 / 5000 / 5000`.

## Styling

The UI follows a design canvas the original massikassi's developer produced
("Massikassi — kolme suuntaa"), direction **B · Reissukassa**: a dark frame with
a marigold accent, fat radii, Bricolage Grotesque for display and Space Grotesk
for body. It has a desktop and a 390px artboard per page plus a light variant
(`ReissuVaalea`), and the two are **different layouts, not one reflowed** — the
phone drops names from settlement rows, drops the balance bars, and hides
per-payment actions behind a tap. Match the relevant artboard rather than
inventing; where one is missing, extrapolate from its nearest sibling.

Rules that keep this coherent:

- **Never write a raw colour in a component.** Use the tokens in `globals.css`.
  A hardcoded hex can't follow the theme and won't have been contrast-checked.
- **Both themes, always.** Colour comes from `light-dark()` pairs resolved by
  `color-scheme`, so the default follows the reader's OS and `ThemeToggle` (in
  the nav) overrides it by setting `data-theme` on `<html>`. Nothing needs a
  `dark:` variant; adding one is a sign a raw colour crept in.
- **Check contrast when adding or changing a pair** — AA (4.5:1) for text, 3:1
  for icons, against both `canvas` and `surface` in both themes. Several tokens
  deliberately differ from the artboards because the artboard value failed;
  those carry a comment saying so, and the reasoning is in
  [TODO.md](TODO.md#event-page-reissukassa--lightdark-theming).
- Two things stay one fixed colour in both themes on purpose (settlement cards,
  the landing's cream form card) — they're commented as such.

## Feature status

Moved to [TODO.md](TODO.md) — per-feature status log (done/open, why, dates).
Keep that file updated as things change; this file stays architecture/setup.

## Node version

Pinned to **Node 24** via `.tool-versions` (asdf). The floor is Node 22 (also
declared in `package.json` `engines`): Vitest 4 bundles rolldown, which imports
`styleText` from `node:util` — absent before Node 22, so `npm test` dies with
`SyntaxError: ... does not provide an export named 'styleText'` on Node 21 or
older. Next 16 also wants ≥20.9.

The Homebrew `node` that used to be on this machine was Gatekeeper-rejected
(ad-hoc signed), which caused sporadic `EPERM` failures in `npm install` /
`npm run dev`. It's gone; the asdf-installed Node is properly signed by the
Node.js Foundation, so that quirk no longer applies. (`spctl -a -vv $(which
node)` reporting "rejected" for the *asdf shim* is a red herring — the shim is
a shell script, and scripts are never signed. Check the real binary under
`~/.asdf/installs/nodejs/<version>/bin/node` instead.)

## Local development

```bash
cp .env.example .env   # defaults work as-is for local dev
npm run setup          # npm install + start Postgres in Docker + create tables
npm run dev            # http://localhost:3000
```

Postgres runs in Docker, via the same `docker-compose.yml` as the deploy plus a
dev-only override (`docker-compose.dev.yml`) whose sole job is publishing port
5432 on the host — the deploy deliberately doesn't, since there only the app
container needs the database. `npm run db:up` is that layered compose command;
`npm run db:stop` stops it, `npm run db:psql` opens a psql shell in it.

`npm run setup` is safe to re-run. Two things that have bitten here:

- `npm install` must complete successfully — a partial install can silently
  omit platform-specific native packages (`@rolldown/binding-darwin-arm64` was
  the one missing here), and the resulting error (`Cannot find module
  './rolldown-binding.wasi.cjs'`) looks like a Node problem rather than a
  missing dependency. Re-running `npm install` fixes it.
- `db:push` prompts interactively when a schema change drops a column, which
  fails outright under a non-TTY shell. Drizzle's "about to delete X column
  with N items" counts *rows in the table*, not non-null values in that
  column — check the actual data before assuming the drop loses anything.

```bash
npm test           # domain logic (divide/resolve) unit tests
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
