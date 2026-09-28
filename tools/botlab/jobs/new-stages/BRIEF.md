# INKWAVE: four new stages built for every mode (read all of this before starting)

This is a scratch job folder. It is never merged into the PR.

INKWAVE is a Splatoon-style 4v4 shooter: three.js r186 ES modules, no build step, run in Electron. The repo root is your
checkout (a worktree of the `new-stages` branch). Read `README.md` and `tools/botlab/README.md` first.

## What the user asked for (their words, 2026-09-28)

> "I want to see how well now you can make maps from the ground up with the intention of also having multiple modes for
> the map. You'll be in charge making maps that can host multiple modes, not just Turf War. I want to do regions that
> canonically exist inside of Splatoon but the player has never visited before in any game."

The four regions (the lore the user gave, the only reference besides one picture for Spirhalite):
- **Mount Nantai**: a mountain in Inkadia near Octo Valley. Secluded. Pearl practises her shockwave singing there, and
  it's where Pearl and Marina first met. Ryu Chang comes from its base (a mountain stream). There is an astronomical
  observatory that hosts Grizzco-sponsored night-sky viewing parties.
- **The Great Turf War Craters**: craters left by the Great Turf War about 100 years ago, an inter-species war over land
  after the sea levels rose. On the world map they sit near The Cape, north of Inkopolis Bay.
- **Calamari County**: hometown of Callie, Marie and Cap'n Cuttlefish. 3.5 hours by train from Inkopolis. Near the sea
  (it smells salty). Notably cold.
- **Spirhalite Islands**: a remote archipelago raised by a tectonic shift; you get there by helicopter; mysterious;
  investigated by Deep Cut. See `spirhalite-ref.webp` in this folder.

The user also gave the Splatoon 3 world map (`world-map.webp`): Mt Nantai (2,657 ft) stands between The Cape and
Inkopolis, south of Octo Valley, with the observatory drawn on its top; the Great Turf War Craters are a pocked plateau
on the north shore of Inkopolis Bay next to The Cape (and a Salmonid swim zone); Calamari County is far east, at the
end of the rail line out of Inkopolis.

One agent builds one stage. Your stage's design (identity, layout, modes) is in `<id>.md` next to this file. It is the
lead designer's plan: follow its intent and structure. Improve details freely; if something in it doesn't work in
practice (bots, sightlines, the tower's clearance), change it and say why in your report.

## The quality bar: Halyard Marina (the user's standard, "Halyard is the bar")

Every stage must stand next to Halyard Marina as an equal. Study it before you build (`src/world/maps.js` HALYARD,
`src/world/dressing.js` DRESSING.halyard, `src/world/props-marina-*.js`; `assets/stages/halyard-day.webp`), and also one
of the rebuilt stages (`src/world/stages/cargo/` or `terraces/`: that is the per-stage folder format you use).
1. **A real place with a story.** Every structure is something, recognisable at a glance: facades, roofs, windows,
   doors, railings, signage, lighting. Not abstract tiled boxes.
2. **The layout comes from that place.** Lanes, high ground, chokepoints and cover all come from the architecture and
   the landscape. A clear 3-lane read, several heights (≈ 0 / 1.3 / 2.4 / 3.8 m), stairs and ramps that look like real
   stairs and ramps, and a spawn built into something (not a generic box).
3. **Dense, purposeful detail.** Working-life clutter, small cover as set dressing with colliders, dressed edges (no bare
   slab drop-offs), layered silhouettes against the sky, a landmark visible from everywhere, signage naming the place.
4. **Its own materials and palette.** Up to 3 stage surfaces (texlib), muted enough that team ink stays the loudest
   thing on screen.
5. **Polish.** An intro fly-in, a stage-select hero shot, day and dusk both beautiful (lamps glow at dusk), no
   z-fighting, no floating or intersecting props, no see-through gaps.

Standing map rules from the user:
- **Not functionally rectangular.** The playable footprint seen from above must read as a distinct shape (curves,
  diagonals, stepped / jagged outlines, islands), and lanes should bend where the theme allows.
- **Unreachable tops** (roofs, anything you can't reach without a special) are not inkable and you slide off them:
  `roof: true` on layout pieces, `B.col(…, { roof: true })` on prop colliders.
- **Railings, fences, grilles, barbed wire, anything you can see or shoot through:** `rail: true` (blocks walking; shots,
  ink, squids and sight pass; never inkable). A visible railing with no rail collider, or a solid one, is a bug.
  Floor grates: `grate: true`. Vantage perches reached only by specials: `perch: true`.
- **Mirror symmetry.** `half` pieces and placements are turned 180° about Y ((x, z) → (−x, −z)); `single` pieces sit on
  the centre and must be self-symmetric. Alpha spawns at −Z, Bravo at +Z. A placement with `mirror: false` is a one-off
  (allowed for a unique landmark detail, never for anything that changes play).
- **Water** is the environment's surface at y = −1.6: falling below it splats you. The deck top is y = 0. Kids must
  reach every inkable area by walking, stairs or ramps (ramps ≤ 24°); squid-only routes are welcome extras.
- Spawn protected, elevated, ≥ 2 exits, ~4.2 m clear round the pad; contested mid; flanks; cover every ~6–10 m of open
  ground; no dead ends that trap bots; no unreachable-but-paintable areas.
- `bounds` in about ±22–30 × ±40–48; paintable turf comparable to Halyard.

## Built for every mode, on ONE layout

This is the new part. Design and test all of these from the start, not as an afterthought:
- **Turf War**: the base game (above).
- **Zone Control** (`src/game/zones.js`: read its top comment): a centre objective (one zone, or two that must both be
  held) plus one side zone per half; the live objective rotates between them. Your layout carries its own zones:
  `LAYOUT.zones = { center: [zone] | [zone, zone], side: zone }`, zone = `{ poly: [[x, z], …] | polys: [...], y0, y1 }`
  (side = Alpha's; Bravo's is mirrored). Zones sit on flat, inkable floor, have cover and at least three ways in, and can
  be attacked from high ground. The side zone is closer to its team's spawn than to the centre. Look at
  `src/world/zones-data.js` for the formats and sizes (typically 70–140 m² per centre zone).
- **Tower Command** (`src/game/tower.js`: read its top comment): a 2.5 m square, 1.6 m high tower platform rides a
  mirrored track from the centre to each goal. Your layout carries its own track: `LAYOUT.tower = { path: [[x, z] |
  [x, y, z], …], checkpoints: [[x, z], …], yaw? }`, drawn from the centre (0, 0) to Alpha's goal on Bravo's side (z > 0).
  The user's rules for tracks:
  - **Straight lines only, square corners.** "the path can go up and down to trace walls and drops the tower needs to
    go next to". The track follows the floor under the whole platform, climbs straight up a wall or box it meets, and
    drops straight down a ledge. The platform never turns.
  - Long flat runs with a few deliberate climbs and drops; no stutter over clutter (benches, kerbs, railings: keep them
    off the track). Headroom along the track: `TOWER_HEAD` = 3.72 m above the platform's floor (arches, canopies,
    footbridges it passes under must clear it). Floor under the whole 2.5 m platform everywhere (no holes over water).
  - About 70–95 m long, 2 or 3 checkpoints, the goal ~10–14 m short of Bravo's spawn pad (outside the spawn barrier),
    in a spot the attackers can reach and the defenders can see.
  - The track should be the stage's story too: it runs along the obvious route (a bridge, a railway, a causeway …).
  Check it with `tools/botlab/tower-check.cjs` (below) until: 0 holes, no clearance problems except the deliberate
  climbs, both ride tests end in a knockout with nobody knocked off, and the pictures show a clean rail.
- **Boss Battle** (HULLBREAKER, `docs/BOSS.md`): report whether the stage works for it (an open area the ~9 m boss can
  roam and charge across, nav that doesn't trap it). If it can't, the MAPS entry gets `noBoss: true` (the lead sets it;
  say so in your report).

Prefer one layout that serves every mode. If a piece truly must differ in a mode, tag it (`onlyIn: 'tower'` /
`notIn: 'zones'`, lists allowed, see `src/world/variants.js`) and bake that variant's lightmap too.

## What you own (and the hard rules)

You own ONLY:
- `src/world/stages/<id>/layout.js`: `export const LAYOUT` (geometry + `zones` + `tower` + `env` + intro/art/decor).
- `src/world/stages/<id>/props.js`: `register(D, H)` (your prop builders, every type prefixed `<id>_`) and `PLACEMENTS`.
- `src/world/stages/<id>/surfaces.js`: up to 3 surfaces on your reserved PATTERN slots (already set in
  `src/world/stages/surfaces.js`: nantai 49–51, craters 52–54, calamari 55–57, spirhalite 58–60).
- `src/world/stages/<id>/murals.js`: `drawMurals(g, R, kit)` for mural ids 4…11 (signage, ground markings).
- `src/world/stages/<id>/backdrop.js`: your far scenery (see "Environment" below).
- Any new files inside `src/world/stages/<id>/`.
- `assets/lightmaps/<id>*.png|json` (your bakes) and `assets/stages/<id>-{day,dusk}{,-sm}.webp` (your stage art).
- Scratch output under `.botlab/` or this job folder's `out/<id>/`.

Rules:
- **Never edit any other file.** Three other agents are building the other stages in parallel; the engine files are
  shared (maps.js, mapkit.js, props.js, dressing.js, texlib.js, levelMaterial.js, murals.js, environment.js, config.js,
  zones-data.js, tower-data.js …). If a shared change is essential, don't make it: design so the stage works without it
  and put the exact change (file, code, why) in your report. Reading everything is fine.
- Your files load behind try/catch per stage, but keep them valid: after edits run `node build/check-maps.mjs <id>`
  (must print `ok`) and `node -e "import('file://$PWD/src/world/stages/<id>/props.js').then(()=>console.log('ok'))"`.
  `layout.js` must stay importable in Node: it may import only `../../mapkit.js`, your own files and nothing that
  imports `three` (backdrop.js gets THREE from its kit, so it imports nothing).
- Launch Electron ONLY through `tools/botlab/run.sh` (offscreen, muted, isolated profiles, a slot lock). Never run
  `npm start`, never touch `dist/`, never kill processes you didn't start: the user may be playing INKWAVE right now.
  Give long runs a Bash timeout of 600000.
- Commit to your branch as you go (small commits are fine) with
  `git -c user.name=LilDannyy -c user.email=94884334+LilDannyy@users.noreply.github.com commit`, messages ending in
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never commit `.botlab/`, profiles or mp3s. Don't push unless
  your instructions say to.
- Look at your work often: detail and composition are judged visually. Save PNGs, downscale before viewing
  (`sips -Z 1000 in.png --out small.png`).

## Environment (new this round): your stage's own world around it

Until now every stage sat in Inkopolis Bay (the city across the water, the port, the lighthouse). These regions are
elsewhere, so a layout can now set `env` (documented at the top of `src/world/environment.js`):
```js
env: {
  backdrop: buildBackdrop,   // from ./backdrop.js: your far scenery (mountains, headlands, islands, a village beyond …)
  bay: false,                // hide the Inkopolis-bay scenery (keep it only if your region can see Inkopolis)
  theme: { all: { seaDeep: '#…', seaShallow: '#…', seaCrest: '#…', foam: '#…', fog: [near, far], haze: [...] },
           day: { … }, sunset: { … }, golden: { … } },   // per-stage overrides of the THEMES keys (sky, sun, grade …)
  snow: { line: 120, cover: 0 },           // snow on your backdrop terrain above `line` m, and a dusting (`cover`)
  weather: { snow: true | {count, fall, size}, mist: true | {count, height, size, color, opacity, reach} },
  stars: true,               // a star field at dusk
  edge: 'none',              // no generic pier pilings along the deck edges (you dress your own banks / cliffs)
  boats: false, gulls: false, buoys: false,
}
```
`buildBackdrop(kit)` gets `SCENERY_KIT` (box, cyl, sph, prep, xf, beam, tube, triGeo, hullGeo, makeIsland (terrain with
`heightAt`), fbm, polar, mulberry, DEG, WATER_Y …) plus `THREE`, `bounds`, `runs` (the deck's exposed edges, for cliffs
or banks under them), `rnd(seed)` and `sceneryMaterial(flags)`. It returns `{ static, plain, terrain, instances,
objects, animate }` (see the comment). Build the far world in the same stylised language as the bay scenery (read
`_buildScenery`, `_buildLighthouse`, `makeIsland` in environment.js). It should sell where we are from every camera, and
fill the horizon on all sides. Keep it cheap: merged geometry (a handful of draw calls), instancing for trees / rocks.
The theme and the backdrop also appear in the intro fly-in and the stage art, so frame them.

`env` is new: if something you need from it is missing or broken, report it (file, change, why) and work around it.

## Performance budget

At or under Halyard with the same tool in the same conditions. Halyard today (shoot.cjs at load, day): ≈ 334 calls /
3.0 M tris / 3.75 ms cpuRender, loadMs ≈ 6.8 s. Props merge into material buckets (no per-prop materials); tiny parts
through `H.noShadow`; share geometry via the kit; backdrop merged / instanced.

## Tools (all through the lock; each run ≈ 20–90 s)

```sh
node build/check-maps.mjs <id>                    # must print "ok" (bounds, overlaps / z-fighting, ramps, spawn pads)
node build/check-maps.mjs <id> --svg              # also writes build/preview/<id>.svg (a top-down plan)
MAP=<id> TIME=day MODE=turf OUT=out/<id> SHOTS='top,art,spawnA,mid,aerialA,sideL' tools/botlab/run.sh tools/botlab/shoot.cjs
    # presets: top art intro spawnA spawnB mid aerialA aerialB sideL sideR, or custom JSON cameras appended:
    # SHOTS='top,[{"name":"bridge","from":[4,3,-30],"look":[0,1,-20],"fov":75}]'   (fov = horizontal degrees)
    # MODE=zones shows the zone marks, MODE=tower the tower and its rail; TIME=dusk the evening look;
    # PLAY=20 lets bots play first (see what inks); ACTORS=1 keeps the characters. Prints REPORT {loadMs, perf …}.
MAP=<id> MODE=turf SECS=120 tools/botlab/run.sh tools/botlab/match.cjs     # bots: stuck %, splats, turf, errors
MAP=<id> MODE=zones tools/botlab/run.sh tools/botlab/match.cjs             # a full Zone Control match
MAP=<id> tools/botlab/run.sh tools/botlab/tower-check.cjs                  # the track: pieces, holes, clearance, rides, pictures
    # try a track without editing: TOWER_DEF='{"path":[[0,0],…],"checkpoints":[[x,z],…]}'; RIDE=0 SHOTS=0 = text only
MAP=<id> tools/botlab/run.sh tools/botlab/tower-match.cjs                  # an all-bot Tower Command match
MAP=<id> MODE=boss PAGE=<your boss check>.js tools/botlab/run.sh tools/botlab/page.cjs   # (write a small check)
tools/botlab/run.sh tools/botlab/bake.cjs <id> [<id>.zones <id>.tower]     # bake AO lightmaps (final step)
STAGES=<id> OUT=out/<id>/art tools/botlab/run.sh tools/botlab/stageart.cjs # stage-select art from layout.art
```
Stage art: `cwebp -q 86 -resize 1920 1080 <id>-day.png -o assets/stages/<id>-day.webp` and a 480 px `-sm` version
(`-resize 480 270`), same for dusk. Until you bake, the game logs "lightmap for <id> is stale / no lightmap": expected
while iterating. Bake once at the end (after the last geometry or collider change: the bake is hash-locked), then shoot
once more to confirm it applies.

## Suggested order

1. Read the references (Halyard; `cargo/` or `terraces/` for the file formats; zones.js and tower.js top comments;
   environment.js top comment).
2. Plan on paper first: a top-down sketch in metres (SVG or ASCII) with lanes, heights, zones and the tower track. Keep
   it in `out/<id>/plan.*`.
3. Block out the layout (plain boxes) + zones + tower; run check-maps, a top shot, a bot match, tower-check. Fix the
   flow before detailing. (Commit.)
4. The place: architecture, props, surfaces, murals, backdrop, env, lighting. Shoot often, day and dusk.
5. All the modes again: bots in turf and zones, tower-check + tower-match, a boss check. Perf vs Halyard.
6. intro, art, decor lamps; bake; stage art; final shots. (Commit.)

## Final report (your last message)

1. The design in a paragraph: identity, landmarks, lanes and heights, how it plays differently, each mode's
   objective (zones, track, boss).
2. Files (only yours) and rough line counts; commits.
3. check-maps output; bots (turf + zones) summary lines; tower-check RESULT_JSON; tower-match summary; the boss check;
   perf vs Halyard; loadMs.
4. Pictures in `tools/botlab/jobs/new-stages/out/<id>/` (JPG or WEBP, < 300 KB each, committed): top (turf), top
   (zones), top (tower), art day + dusk, spawnA, mid, 2–4 of your favourite spots.
5. A one-sentence stage-select blurb, the theme / times you want, and `noBoss` yes/no.
6. Shared-file changes you'd want, and known issues.
