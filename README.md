# massikassi

Ilmainen ja anonyymi kulujenjakosovellus. Uudelleenkirjoitus vanhasta
[massikassi](https://github.com/mkirvela/massikassi) -projektista nykyaikaisilla
työkaluilla, samalla jako- ja tasauslogiikalla.

## Stack

- Next.js (App Router) + TypeScript
- Postgres + Drizzle ORM
- Tailwind CSS
- Vitest

## Kehitys

Tarvitset **Node 22+** (projekti on pinnattu Node 24:ään, ks. `.tool-versions`)
ja **Dockerin** (tietokanta pyörii kontissa).

```bash
cp .env.example .env   # oletusarvot toimivat sellaisenaan paikallisesti
npm run setup          # npm install + Postgres käyntiin + taulut
npm run dev            # → http://localhost:3000
```

Siinä kaikki: avaa selaimessa <http://localhost:3000>, luo tapahtuma etusivun
lomakkeella, ja päädyt sen omaan linkkiin (`/event/[hash]`) — sama linkki on
ainoa pääsy tapahtumaan, joten talleta se.

Muut komennot:

```bash
npm run db:up      # käynnistä pelkkä Postgres-kontti
npm run db:stop    # pysäytä se
npm run db:psql    # psql-kehote kontin tietokantaan
npm run db:push    # vie schema.ts:n muutokset tietokantaan
```

Tietokanta pyörii samasta `docker-compose.yml`:stä kuin tuotanto, plus
`docker-compose.dev.yml`, joka julkaisee portin 5432 hostille — tuotannossa
sitä ei julkaista, koska siellä vain sovelluskontti tarvitsee tietokannan.

Jos jotain menee rikki, ks. CLAUDE.md:n "Local development" -osio.

## Testit

```bash
npm test           # jako- ja tasauslogiikan yksikkötestit
npm run typecheck
npm run lint
npm run build
```

Ydinlogiikka (`src/lib/domain/divide.ts` ja `src/lib/domain/resolve.ts`) on portattu
alkuperäisestä sovelluksesta 1:1, ja testattu samoilla arvoilla kuin alkuperäisen
projektin `test/test.db.js`.

## Pääsymalli

Ei tunnuksia. Tapahtumaan pääsee vain sen linkin kautta, joka luodaan tapahtumaa
perustettaessa (`/event/[hash]`). Hash generoidaan kryptografisesti turvallisesti
(`crypto.randomBytes`), toisin kuin alkuperäisessä sovelluksessa.
