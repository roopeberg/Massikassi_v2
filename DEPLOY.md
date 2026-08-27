# Self-hosted deploy (office machine)

Runs the whole stack — app, Postgres, and a Caddy reverse proxy with automatic
HTTPS — as three Docker containers on one machine. No cloud provider, no
monthly bill beyond electricity and the internet connection you already have.

## Prerequisites

- Docker + Docker Compose on the machine.
- One of your static public IPs routed to this machine (port forward **80**
  and **443** on your router/firewall to it — Caddy needs both: 80 for the
  Let's Encrypt HTTP challenge, 443 for the actual site).
- A domain (or subdomain) with an **A record** pointing at that static IP.
  Caddy won't get a certificate until DNS actually resolves to this machine,
  so set the DNS record first and let it propagate before starting Caddy.

## First-time setup

```bash
git clone https://github.com/roopeberg/Massikassi_v2.git
cd Massikassi_v2
cp .env.example .env
# edit .env: set a real POSTGRES_PASSWORD and your actual DOMAIN
```

```bash
docker compose build
docker compose up -d db
docker compose run --rm migrate   # creates the tables
docker compose up -d              # starts app + caddy too
```

Visit `https://<your-domain>` — first load may take a few seconds while Caddy
requests the certificate.

## Updating after a code change

```bash
git pull
docker compose build app
docker compose up -d app
```

If the change includes a schema change, run the migrate step again first:

```bash
docker compose run --rm migrate
```

## Backups

Nothing here backs up the database automatically — the original app didn't
have this either, but it's cheap to add. A daily cron entry on the host:

```bash
docker compose exec -T db pg_dump -U massikassi massikassi | gzip > /path/to/backups/massikassi-$(date +%F).sql.gz
```

Keep a few days of these somewhere off the machine (e.g. synced to another
disk) — a single-machine setup has no redundancy if the disk fails.

Back up the `uploads_data` volume (attached payment GIFs) alongside the
database dump — the two are only consistent together:

```bash
docker run --rm -v massikassi-v2_uploads_data:/uploads -v /path/to/backups:/backup alpine \
  tar czf /backup/massikassi-uploads-$(date +%F).tar.gz -C /uploads .
```

## Expired events

Events default to a 3-month lifetime (the creator can pick "keep forever"
instead, or flip either way later from the event page). Nothing deletes
them on its own — `scripts/flush-expired-events.ts` has to actually be run.
A daily cron entry alongside the backup one above:

```bash
docker compose run --rm -e DATABASE_URL=postgres://massikassi:<password>@db:5432/massikassi --entrypoint sh migrate -c "node_modules/.bin/tsx scripts/flush-expired-events.ts"
```

Run the backup cron *before* this one in the day's schedule — you want a
copy of an event's final state before it's gone, in case someone asks about
it after the fact.

## Things this setup does NOT give you

- **No redundancy.** If the machine, its disk, or the office internet/power
  goes down, the app is down. Fine for a demo people look at when you tell
  them to; not something to point production traffic at unattended.
- **No managed backups or patching.** You update the host OS and Docker
  images yourself.
- **DOMAIN must be a real, resolvable domain** for Caddy's automatic HTTPS to
  work — it won't issue a certificate for a bare IP address.
