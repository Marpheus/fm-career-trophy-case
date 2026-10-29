# CLAUDE.md — FM Trophy Case

A hobby site tracking a Football Manager world-conquest save, deployed to Netlify. Signed out,
a trophy case lives in the browser's localStorage. Anyone can register (username + password);
signed in, it lives in a Neon Postgres database behind Netlify Functions.

## Stack

Vite + Vue 3 (Composition API) + TypeScript + Tailwind v4. `d3-geo` and `topojson-client`
render the map; `d3-zoom` handles pan and zoom. No UI framework, no router — it's one page.
Server: Netlify Functions (TypeScript) with `@neondatabase/serverless`. No auth library —
scrypt passwords, opaque session tokens in an HttpOnly cookie, rate limits in Postgres.

## Architecture

- `src/data/` — nations, competitions, and generated map metadata.
- `src/composables/` — `use-career` is the single source of truth for trophies and owns
  persistence (localStorage signed out, `/api/state` signed in); `use-account` holds the
  signed-in user; `use-world-map` loads and projects the geometry once.
- `src/api.ts` — typed fetch wrappers for `/api/*`. `src/persisted-state.ts` is the shape
  check shared by browser and server.
- `netlify/functions/` — one file per endpoint, routed by `config.path` under `/api`.
  `netlify/lib/` — db, sessions, passwords, rate limiting.
- `db/schema.sql` — idempotent schema; `npm run db:migrate` applies it to `DATABASE_URL`.
- `src/components/` — presentational, they read state through `useCareer()`.
- `scripts/build-map.mjs` — regenerates map data from Natural Earth. Run it only when the
  nation list changes; its output is committed.

## Data rules

- A nation's canonical id is its Natural Earth subunit code (`ENG`, `SCT`, `CZE`).
  England, Scotland, Wales and Northern Ireland are deliberately separate nations.
- Nations are grouped by **confederation** (UEFA, CAF, AFC, CONCACAF, OFC, CONMEBOL),
  not geographic continent — Türkiye and Israel are UEFA, Australia is AFC, Russia is
  UEFA despite most of its landmass being in Asia.
- `src/data/playable.ts` is the 60 nations with loaded leagues. It drives both the grey
  "not playable" map fill and the denominator for every completion figure. Nations outside
  it cannot be selected.
- Domestic football is leagues only - exactly one top division per playable nation, no
  cups. A nation colours in on the map as soon as its league has a win.
- A league that crowns several champions a season (Liga MX's Apertura and Clausura) stays
  one competition and lists them in `stages`; each win then records its `stage`.
- Leagues live in `src/data/competitions.ts`, club competitions above national level in the
  same file, national team ones in `src/data/international.ts`. Nation codes must match
  `src/data/nations.json`.
- OFC appears only in the international view: no Oceanian league is playable, so the OFC
  Champions League cannot be won with a club.

## Conventions

- Files and directories kebab-case; components PascalCase in templates.
- Always declare types. No `any`.
- Tailwind classes only — no `<style>` blocks.
- Event handlers use the `handle` prefix; booleans use `is`/`has`.
- Short, single-purpose functions; early returns over nesting.
- Keep interactive elements keyboard-reachable and labelled.

## Verification

`npm run build` is the real check — it runs `vue-tsc -b`. Note `vue-tsc --noEmit` without
`-b` checks nothing, because the root tsconfig uses project references.

## Git

Commit only when asked. One logical change per commit; the message says why.

## Server rules

- A save sends the whole `PersistedState` with the revision it was based on; the server
  rejects stale revisions with 409 and the client adopts the stored copy.
- Register, login and save go through `checkRateLimit`. Login errors never reveal
  whether a username exists.
- Secrets come from env vars only (`DATABASE_URL`); never commit `.env`.
- Every account's trophy case is public and read-only at `/u/<username>`. On that path
  `use-career` loads the profile instead of the viewer's own data and never saves; components
  hide every editing control behind `isReadOnly`.
