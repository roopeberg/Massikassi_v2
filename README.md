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

```bash
npm install
cp .env.example .env.local   # ja täytä DATABASE_URL
npm run db:push              # luo taulut paikalliseen tietokantaan
npm run dev
```

## Testit

```bash
npm test
```

Ydinlogiikka (`src/lib/domain/divide.ts` ja `src/lib/domain/resolve.ts`) on portattu
alkuperäisestä sovelluksesta 1:1, ja testattu samoilla arvoilla kuin alkuperäisen
projektin `test/test.db.js`.

## Pääsymalli

Ei tunnuksia. Tapahtumaan pääsee vain sen linkin kautta, joka luodaan tapahtumaa
perustettaessa (`/event/[hash]`). Hash generoidaan kryptografisesti turvallisesti
(`crypto.randomBytes`), toisin kuin alkuperäisessä sovelluksessa.
