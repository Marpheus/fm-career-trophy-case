# FM Trophy Case

A world map of every league won in a Football Manager save. Playable nations start
green and turn gold once their top division is won; everything outside the loaded leagues
stays grey. Two views: **Clubs** (the map plus continental cups) and **International**
(World Cup and the confederation trophies). Everything is stored in your browser — there is
no account and no server.

## Running it

```bash
npm install
npm run dev
```

## Deploying

Netlify picks up `netlify.toml` automatically: build `npm run build`, publish `dist`.

## Adding competitions

Each playable nation has exactly one league — its top division — and no cups. Winning it
colours the nation in on the map. Leagues and the continental club cups live in
`src/data/competitions.ts`, national team trophies in `src/data/international.ts`. Nation
codes must match those in `src/data/nations.json`.

League names are seeded from general knowledge, so sponsor names may not match your FM
version exactly. Rename freely; only the `nation` codes matter.

## Changing which leagues are playable

Edit `src/data/playable.ts` — the set of nations with loaded leagues. Everything outside it
renders inert grey and is excluded from the completion totals.

## Regenerating map data

```bash
npm run build:map
```

Downloads Natural Earth's 50m subunit boundaries, dissolves them to nations, simplifies the
geometry and writes `public/data/world.topo.json` plus the nation index. Subunits rather
than countries, so England, Scotland, Wales and Northern Ireland stay separate. Output is
committed; you only need this when the nation list changes.

## Back up your data

Everything lives in localStorage, which clearing your browser data will wipe. Use the
**Export** button regularly and keep the JSON somewhere safe; **Import** restores it.
