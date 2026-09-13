# CLAUDE.md — FM Trophy Case

A static hobby site tracking a Football Manager world-conquest save. No backend, no database:
all data lives in the browser's localStorage, deployed to Netlify as a static build.

## Stack

Vite + Vue 3 (Composition API) + TypeScript + Tailwind v4. `d3-geo` and `topojson-client`
render the map; `d3-zoom` handles pan and zoom. No UI framework, no router — it's one page.

## Architecture

- `src/data/` — nations, competitions, and generated map metadata.
- `src/composables/` — `use-career` is the single source of truth for trophies and owns
  localStorage; `use-world-map` loads and projects the geometry once.
- `src/components/` — presentational, they read state through `useCareer()`.
- `scripts/build-map.mjs` — regenerates map data from Natural Earth. Run it only when the
  nation list changes; its output is committed.

## Data rules

- A nation's canonical id is its Natural Earth subunit code (`ENG`, `SCT`, `CZE`).
  England, Scotland, Wales and Northern Ireland are deliberately separate nations.
- Nations are grouped by **confederation** (UEFA, CAF, AFC, CONCACAF, OFC, CONMEBOL),
  not geographic continent — Türkiye and Israel are UEFA, Australia is AFC, Russia is
  UEFA despite most of its landmass being in Asia.
- `src/data/playable.ts` is the 61 nations with loaded leagues. It drives both the grey
  "not playable" map fill and the denominator for every completion figure. Nations outside
  it cannot be selected.
- Domestic football is leagues only - exactly one top division per playable nation, no
  cups. A nation colours in on the map as soon as its league has a win.
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
