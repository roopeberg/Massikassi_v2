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
- `src/lib/recovery-email.ts` / `src/lib/recovery-repo.ts` / `src/lib/mail.ts` —
  the recovery-email feature: an address is only ever stored as
  `HMAC-SHA256(EMAIL_HMAC_SECRET, normalized_email)`, never in plaintext.
  Mail sends through a self-hosted Postfix container (`mail` in
  docker-compose.yml), not a third-party API. See TODO.md for the full
  design and DEPLOY.md for the DNS records it needs.
- `src/lib/validation.ts` — Zod schemas for every API input.
- `src/lib/format.ts` — the only place dates/currency get formatted. Dates are
  pinned to `timeZone: "Europe/Helsinki"` deliberately — without that, the
  same Date renders different text server-side (Docker, usually UTC) vs.
  client-side (the visitor's own zone), which is a real React hydration
  mismatch, not just a cosmetic difference. See the file's own comment; this
  is exactly what silently broke `ThemeToggle` surviving a page reload before
  it was fixed (the hydration-mismatch recovery re-renders from scratch,
  wiping out what the pre-hydration theme script had just set on `<html>`).
- `src/lib/avatar.ts` — deterministic per-participant colour, keyed by
  position in the event's user list. Returns `var(--avatar-N-bg/fg)`
  references (globals.css), not hex — same avatar is correct in both themes
  with no light/dark branching in the component.
- `src/components/icons.tsx` — every icon used more than once, as a shared
  component (`currentColor` stroke). Don't inline a new one-off SVG for
  something already here.
- `src/components/ThemeToggle.tsx` + the inline pre-hydration script in
  `layout.tsx` — see Styling below.
- `src/app/api/**` — REST-ish route handlers, thin wrappers around `repo.ts`.
- `src/components/EventClient.tsx` — the interactive event page (add/edit/delete
  payment, add user, edit event name), hydrated from a server-rendered initial
  fetch in `src/app/event/[hash]/page.tsx`.

Both `divide.ts` and `resolve.ts` are tested against the same numeric cases as
the original project's `test/test.db.js` (golden-master values), e.g. two
payers + one sharer on 100 → balances `-10000 / 5000 / 5000`.

## Styling

Every colour in the app is a semantic token defined once in `src/app/globals.css`
(`canvas`, `surface`, `ink*`, `accent*`, `positive`/`negative`, `avatar-1..4`,
the fixed-both-themes `settle-card-*` and `--paper-*` set, ...), each a
`light-dark()` pair mapped to Tailwind utilities via `@theme inline`. The
default (`color-scheme: light dark`) follows the reader's OS preference with
no JS at all; `ThemeToggle` (in the nav, cycles auto → light → dark) overrides
it by setting `data-theme` on `<html>`, and the inline script in `layout.tsx`
re-applies a stored choice before first paint so it never flashes the wrong
theme.

Rules that keep this coherent:

- **Never write a raw colour in a component.** Use the tokens in `globals.css`.
  A hardcoded hex can't follow the theme.
- **Both themes, always.** Nothing needs a `dark:` variant; adding one is a
  sign a raw colour crept in.
- Two things stay one fixed colour in both themes on purpose: the settlement
  cards (`--settle-card-*`) and the cream "paper" surfaces — the landing/create
  form and a couple of matching inputs (`--paper-*`). Both are commented as
  such at their definition.
- Any date/time shown to the user goes through `lib/format.ts`, never a raw
  `toLocaleDateString`/`toLocaleString` call — see that file's comment for why
  (it's a real hydration-correctness issue, not just consistency).

## Feature status

Moved to [TODO.md](TODO.md) — per-feature status log (done/open, why, dates).
Keep that file updated as things change; this file stays architecture/setup.

## Node version / environment quirk (this machine)

Homebrew's `node` on this Mac is Gatekeeper-rejected (ad-hoc signed) — it
blocks `node`'s own filesystem operations (unlink, Turbopack's native
lockfile, `npm install`) under the real home directory. **Fixed** by installing
Node via asdf instead (nodejs.org's own build, signed by the Node.js
Foundation, passes real-world use even though `spctl` still prints
"rejected... does not seem to be an app" for it — that specific message is a
CLI-binary quirk of `spctl`, not actual Gatekeeper enforcement; what matters is
that `npm install`/`npm run build` actually work under the real home
directory, which is verified working):

```bash
brew install asdf              # arm64 Homebrew, not an Intel/Rosetta one — check `file $(which asdf)`
asdf plugin add nodejs
asdf install nodejs 24.19.0    # matches .tool-versions
```

Not yet wired into this shell's default `PATH` (that's a global
`~/.bash_profile` change affecting every project on this machine, including
ones pinned to a different Node version — left for you to do deliberately
rather than changed silently). Until then, prefix commands:

```bash
export PATH="$HOME/.asdf/installs/nodejs/24.19.0/bin:$PATH"
```

## Local development

```bash
cp .env.example .env   # defaults work as-is for local dev
npm run setup          # npm install + start Postgres in Docker + create tables
npm run dev            # http://localhost:3000
```

Postgres runs in Docker via `docker-compose.yml` plus a dev-only override
(`docker-compose.dev.yml`) that publishes it on **5433** (not the default
5432 — this machine already runs another Postgres there; recreating the `db`
container with 5432 published collides with it). `npm run db:up` is that
layered compose command; `npm run db:stop` stops it; `npm run db:psql` opens
a psql shell in it.

```bash
npm test          # domain logic (divide/resolve) unit tests
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```
