# INKWAVE: the Long Stages overhaul, every stage 50 % longer (read all of this before starting)

This is a scratch job folder. It is never merged into the PR.

INKWAVE is a Splatoon-style 4v4 shooter: three.js r186 ES modules, no build step, run in Electron. Your checkout is a
worktree of the `new-stages` branch. Read `README.md` and `tools/botlab/README.md` first, then
`tools/botlab/jobs/new-stages/BRIEF.md` (the previous round's brief: its quality bar, map rules, tools and addendum all
still apply; this brief only adds to it).

## What the user asked for (their words, 2026-09-30)

> "another map overhaul but this one is global. I think all the maps are a tad too small compared to Splatoon. On average
> it should take 6s to swim to the mid where it currently takes 4. You don't need to throw out anything, but I want you
> to extend each half of every map by 25%, thus adding 50% more land. Spawn and mid on every map is fine, so you need to
> add a slice of land in the middle. it can be as simple as just extending what we already have or adding in new stuff
> all together. this is for preparation of a fourth mode, Bazookarp, based on Rainmaker. … Essentially stages need to be
> physically long enough to support a push into the enemy's base. Do not work on the Bazookarp mode yet, just the stage
> reworks."

> (Tower Command, same day) "any stage with two tower checkpoints, make the checkpoint time 10 instead of 20, increase
> tower speed by 50% and extend the path making detour loops so it still takes 100 ticks to reach the current
> destination for the goal"

**Do not build anything for Bazookarp** (no mode code, no goal or checkpoint objects, no rules). You only make the
stages ready for it, and write down where its pieces would go (see "Bazookarp notes" below).

## The numbers

Swim speed is 11.8 m/s (`PLAYER.swimSpeed`). Measured on `new-stages` 84a57c0 with `tools/botlab/tests/spawn-mid.js`
(nav path from each team's spawn pads to mid, in metres and seconds; `t0` / `t1` = Alpha / Bravo):

| stage | straight spawn→mid | nav t0 / t1 (s) | avg s | target avg s (× 1.5) |
|---|---|---|---|---|
| tidewater | 41.8 | 3.66 / 4.32 | 3.99 | 6.0 |
| kelpline (diagonal) | 43.6 | 4.04 / 4.28 | 4.16 | 6.2 |
| halyard | 42.0 | 3.99 / 4.37 | 4.18 | 6.3 |
| saltpan | 42.0 | 3.80 / 4.60 | 4.20 | 6.3 |
| crossmarket | 40.2 | 4.14 / 4.35 | 4.25 | 6.4 |
| lockgate | 42.1 | 4.43 / 4.70 | 4.57 | 6.8 (or the straight × 1.5) |
| terraces | 40.2 | 3.44 / 4.77 | 4.11 | 6.2 |
| nantai | 41.0 | 3.44 / 3.78 | 3.61 | 5.4 → aim 6.0 |
| craters | 40.5 | 3.63 / 3.88 | 3.76 | 5.6 → aim 6.0 |
| calamari | 41.3 | 5.99 / 6.09 | 6.04 | see its note |
| spirhalite | 37.0 | 3.88 / 4.55 | 4.22 | 6.3 |
| treehills | 42.5 | 3.59 / 3.84 | 3.72 | 5.6 → aim 6.0 |
| cargo (online only) | — | — | — | straight × 1.5 |

**Insert Δ ≈ half the straight spawn→mid distance on each half: 18.5–22 m.** The spawn side moves out by Δ along the
spawn axis (the line from mid to the spawn centre; diagonal on Kelpline / Cargo / Spirhalite / Terraces / Lockgate),
and the gap is new land. Acceptance: the `spawn-mid.js` average lands at 1.45–1.6 × the "avg s" above (the user's "6 s
on average"; the ones marked "aim 6.0" may go up to 6.3 s). Calamari's 6 s today is a detour: its one-way overpass drop
keeps the nav off the island, so measure it to a node just off the island and judge by the straight distance (× 1.5).

Budgets checked on 84a57c0 (`tools/botlab/tests/size-budget.js`): the baked lightmap (8 ppm in 2048²) uses 481–1183
rows today; after the stretch it must still fit (the test fails if it doesn't; tell the lead, don't change bake.cjs).
The paint atlas density drops a little on its own (it packs to fit). A*'s search cap now grows with the stage (commit
84a57c0), so bots can plan across the longer stages.

## Where the new land goes: the cut

Mid is untouched and the spawn is untouched: you **translate** the spawn side as a unit and fill the gap.
- **Pick a cut on each half** between everything that belongs to mid (the centre, both side zones, the mid ends of the
  lanes) and everything that belongs to the base (the spawn building, its exits, its forecourt). On most stages it
  falls around 26–32 m from mid along the spawn axis. It may be a straight line or follow the seams between buildings /
  terraces (a polyline), so that no building is cut in half.
- **Everything beyond the cut moves out by Δ**: layout pieces, props and their colliders, murals / decals, lamps,
  spawn pads and barrier, the tower goal, Tower-only and Zone-only variant pieces, intro / art cameras, backdrop pieces
  anchored to the base. A piece that crosses the cut (a long lane floor, a quay edge, a seawall, a railing run) gets
  longer, or is split and rejoined in the new land. Prefer one clear transform in code (e.g. a per-stage
  `STRETCH = { axis, cut, d }` and a helper that shifts a piece / placement whose centre lies beyond the cut) over
  hand-editing hundreds of numbers, but keep the files readable: whoever reads the layout next should still see why a
  number is what it is.
- The **side zone stays where it is** (same distance from mid; the user wants side zones close to mid). If a stage's
  side zone sits beyond your cut (Treehills: on the base terrace), redraw it at the same distance from mid.
- `bounds`, the deck / sea / cliff edges, the environment footprint and the backdrop grow with the stage: no void, no
  missing sea, no floating backdrop pieces, no pier pilings in the wrong place (shoot top + aerial + side shots).
- Mirror symmetry as always (the half list turns 180° about Y).

## What the new land must be (the design rules, from the Rainmaker research the user attached)

The user attached a research paper on how Nintendo reworked Splatoon stages for Rainmaker. Its findings, as rules for
the slice you add on each half:
1. **Distance to the goal is what matters most.** A slow, visible carrier needs a push that is long enough that one
   good push doesn't win in seconds. That's the Δ. Don't claw it back with shortcuts.
2. **At least two workable routes through the slice into each base, ideally three** (the stage's lanes carried
   through, plus a link across the slice). No single corridor (a good defence makes it unbeatable), but also **no
   hidden shortcut that skips the slice into the enemy base** (Nintendo kept closing inkrail / ledge / drop routes into
   bases). Every main route must be walkable by a slow carrier: stairs and ramps, not only climbs; squid-climb
   shortcuts are welcome extras.
3. **A strategic point in each slice.** Something both teams fight over on the way in: a raised platform, a gatehouse,
   a plaza with a landmark, a bridge. A Bazookarp checkpoint (and, if it fits, a Tower Command checkpoint) will sit on
   it. Reachable from both sides by at least two ways, with cover round it and a view toward mid.
4. **Spawn depth and a safe back area.** The base side of the slice gives the defenders room to re-form in front of
   the spawn (an apron with cover), and the spawn keeps ≥ 3 ways out. Nintendo's reworks deepened and widened spawns
   and added routes from spawn to the flanks.
5. **No unreachable high ground.** A carrier must not be able to hide up high out of reach. Every high spot in the slice
   is reachable from the ground (ramps, stairs, climbable walls); anything else is `roof: true` (slide off, no ink).
6. **Goal-ready base front.** In front of each spawn there must be a spot where a goal pedestal could stand (often a
   level below the spawn, or its forecourt), reached by ≥ 2 routes and visible to the defenders. Don't build it. Just
   make sure the space exists and note it.
7. **The previous rounds' rules all apply**: a real place (it continues the stage's story; look at the concept for your
   stage below), cover every 6–10 m (cover map ≥ 90 % of floor within 5 m of cover, `tools/botlab/tests/cover-map.js`
   + `tools/botlab/cover-map.py`), varied ground heights, purpose and dressing everywhere, flank routes, mid most
   important, no empty strip ("Never pass an empty stage": a stretched bare lane fails review). "it can be as simple as
   just extending what we already have or adding in new stuff all together": both are fine, but the added 20 m must be
   as good as the rest of the stage.
8. **Keep the stage's silhouette** (the user wanted varied macro shapes: Craters round, Spirhalite an S, Treehills a
   diamond, Kelpline a skewed pier …). The stage gets longer; its shape language stays.

## Every mode

- **Turf War**: the base game. More land, more to ink: fine.
- **Zone Control**: centre zones unchanged; side zones keep their distance from mid (above). Zone-only pieces beyond
  the cut move with it. A full zones match must still be sane.
- **Tower Command**: the goal moves out with the spawn (still ~10–14 m short of the pad, outside the barrier).
  - **Stages with two checkpoints** (tidewater, saltpan, crossmarket, lockgate, nantai, craters, calamari, spirhalite,
    treehills): the engine rule is already in (84a57c0: `TOWER.twoCheckpoints`, 10 s checkpoints, the track worth 80
    of the 100 points, speed = length / 80 s). **Your track must be twice its current length (± 4 %)**, so that the
    tower runs 1.5 × as fast as today and still takes 100 s from the centre to the goal. The stretch gives you ~Δ of it;
    the rest comes from **detour loops**: square-cornered U-turns and jogs through the new slice and the base side
    (round a block and back, along a quay and back up a parallel street …). Straight lines, square corners, up / down
    walls and drops as before (`tools/botlab/jobs/new-stages/BRIEF.md` and `src/world/tower-data.js`'s header). Keep
    every jog the user drew in the existing section. The two sides' tracks never overlap or cross. Keep two
    checkpoints; the second one belongs on the slice's strategic point if it fits.

    | stage | length now (m / side) | target (± 4 %) |
    |---|---|---|
    | tidewater | 112.8 (its checkpoints were already 10 s: 80 s to the goal today) | 225.6 |
    | saltpan | 88.3 | 176.6 |
    | crossmarket | 99.9 | 199.8 |
    | lockgate | 72.7 | 145.4 |
    | nantai | 72.1 | 144.2 |
    | craters | 79.2 | 158.4 |
    | calamari | 82.0 | 164.0 |
    | spirhalite | 88.1 | 176.2 |
    | treehills | 78.2 | 156.4 |

    Measure with `MODE=tower PAGE=tools/botlab/tests/tower-len.js` (length, speed, checkpoints, seconds to the goal:
    must read 100).
  - **Stages with three checkpoints** (kelpline, halyard, terraces): not in the user's rule. Just carry the track
    through the new land to the moved goal (it gets ~Δ longer; the engine keeps it at 100 s, so it runs a little
    faster), three checkpoints.
  - Tower-only changes stay Tower-only (`onlyIn: 'tower'` / `notIn`), and they need their own lightmap (`<id>.tower`).
  - `tools/botlab/tower-check.cjs` clean: 0 holes, no clearance problems but the deliberate climbs, both ride tests end
    in a knockout with nobody knocked off; `tower-match.cjs` sane.
- **Boss Battle**: the stage must still work (a copy of `tools/botlab/jobs/new-stages/out/craters/boss-check.js`
  adapted to your stage: home ground ≥ 150 m², no long stuck). Cargo is `noBoss`.

## Bazookarp notes (write them, don't build them)

In your stage's note (`tools/botlab/jobs/stretch/<id>.md`), list for Alpha's half (Bravo's is the mirror):
- the checkpoint spot in the slice (x, z, y), and why it's contested;
- the goal spot in front of the spawn (x, z, y) and its routes;
- the routes from mid to the goal (≥ 2), with lengths;
- any high ground a carrier could hide on (there should be none; if there is, why it's fine or what would need a
  "no-carrier" zone later).

## Your stage's concept (the lead designer's pick; improve it freely, say why in your report)

Each half's slice sits between the side zone and the spawn. The concepts below name a strategic point and the routes.

- **tidewater** (Tidewater Plaza, Victorian seaside square): *the Winter Gardens*. The promenade crescent runs on
  (a longer sweep, or a straight esplanade section with a shelter and the pier's toll booth), the Crescent terrace
  gains a fourth house (the Assembly Rooms, its colonnade and 3.7 m terrace walk carried on), and between them in the
  square's widening a public garden round a cast-iron glasshouse: the conservatory's raised terrace with steps from
  both sides is the strategic point; beds, a drinking fountain, a band of topiary for cover. Keep the lens outline.
- **halyard** (Halyard Marina, the bar): *the visitor pontoons and the travel lift*. The Long Pier and the boatyard
  continue; a second finger pontoon row with berthed yachts (hulls as cover) on the pier side; the boatyard grows a
  travel-lift dock (the big portal hoist straddling a slip with a boat hanging in its slings: the boat is cover, the
  slip is water with a plank crossing) and a chandlery with a loading deck (the strategic point, reachable from the
  hardstanding and the fuel-dock side). More squid-gap choices, never a squid-only main route.
- **kelpline** (container terminal, diagonal pier): *Block 4B and the RTG lane*. A second row of stack blocks and a
  cross aisle; a rubber-tyred gantry crane parked across the truck lane (legs + sill beam as cover, its top `roof`), a
  weighbridge and lashing store; the ships alongside get longer (or a second vessel / a barge on each flank). The
  strategic point: the transfer platform (a raised lashing deck) at the cross aisle. Keep the skewed-pier silhouette.
- **cargo** (Cargo Terminal, PR #8's rebuilt Kelpline, online only, humans only): the same concept as Kelpline in its
  own kit. It can't run bots (`noBots`) and doesn't boot offline: add a `DEVSTAGE=1` option to the botlab harnesses you
  need (`?autopilot&devstage`, see `DEV_STAGE` in `src/main.js`) and verify with page tests, shots and tower-check.
- **saltpan** (the salt works, the open map): *the evaporation terraces and the pump house*. A flight of stepped
  evaporation ponds (low, open, long sightlines kept: it's the open map), the narrow-gauge line carried across on a low
  trestle with tipper wagons as cover, a second conveyor or a row of salt cones; the brine pump house with its loading
  platform is the strategic point.
- **crossmarket** (the market town, close quarters): *the Butter Cross*. A new block of Market Street between the Corn
  Exchange and the fountain: a small square with an open-sided market cross on columns (its raised floor is the
  strategic point, stairs on two sides), the fish-lane and flank-street sides continued as a passage and a covered
  arcade; short sightlines and corners stay the stage's character.
- **lockgate** (the canals, the chokepoint map): *the dry dock*. Between the wharf and the lock: a drained dry dock
  with a narrowboat on stands (walk the dock floor under it, or the dockside), a boat-builder's shed with a loading
  bay, a hand crane on a timber staging; the dock's gate walkway / crane staging is the strategic point. Keep the
  crossings as the chokepoints they are, but give each at least two approaches.
- **terraces** (hill village, S of two round hills): *the olive terraces and the lavatoio*. A contour band between
  the hilltop and the Largo: olive terraces with dry-stone walls, the village wash house (lavatoio) with its open loggia
  as the strategic point, the funicular's incline and the Limonaia shoulder carried on. The spawn keeps its height; the
  levels spread out.
- **nantai** (the observatory grounds): *the solar observatory and the radio dish*. Between the control building and
  the brook: the old solar telescope hut, a small radio dish on a concrete plinth (the strategic point; the dish itself
  `roof`), a rock garden and switchback paths; the ridge and the shore trail carried on.
- **craters** (the round memorial park): *the reserve line*. A second trench line (the support trench) with a concrete
  observation post, a communication trench zig-zagging back to the neck, a mound with the regimental memorial obelisk
  (the strategic point). The round silhouette becomes an oval / stadium (or a peanut): keep it rounded.
- **calamari** (the snowy village): *the village high street*. Between the square and the co-op: the post office, the
  onsen's garden, snowy allotments, the shrine steps; the harbour quay and the hillside terraces carried on. The
  strategic point: the shrine's stone terrace or the fire-watch tower's base. (The user may want the island stairs back
  later: don't change mid.)
- **spirhalite** (the S of islets): *the tide-pool islet*. Another islet in each bend of the S between the camp and the
  arch sandbar: rock pools, a ruined watch-post on a rock shelf (the strategic point), a rope bridge and a sandbar ford
  as the two ways across. Keep the S.
- **treehills** (the diamond in the biome): *the nursery terraces*. Between the eco-station and the meadow: the
  research nursery (seedbeds on terraces, a potting shed, a row of glass cloches, an irrigation channel with a
  footbridge), a wind turbine's foot as a landmark; the nursery's raised potting deck is the strategic point. The side
  zone stays near mid (redraw it). Pods: keep them working (`tools/botlab/tests/pods.js` on `MAP=podbox`, and on your
  stage).

## Who does what

- Local agents (this Mac), one worktree + branch each, from `new-stages`:
  - `st-a`: tidewater, halyard (Halyard's data is `src/world/maps.js` HALYARD, `src/world/dressing.js`,
    `src/world/props-marina-*.js`, the halyard parts of `src/world/murals.js`: you own those parts).
  - `st-b`: kelpline, cargo.
  - `st-c`: saltpan, crossmarket.
  - `st-d`: lockgate, terraces.
  - `st-e`: nantai, craters.
- The Mac mini helper: calamari, spirhalite, treehills (it built them), branches `stretch-<id>` pushed to the fork.

You own your stages' folders, their entries in `src/world/tower-data.js` / `zones-data.js` (old stages), their
lightmaps (`assets/lightmaps/<id>*`), stage art (`assets/stages/<id>-*`), and your job notes. The shared engine is not
yours: if you need a shared change (environment.js, level.js, nav.js, mapkit.js, the harnesses …), make it only if it's
small and safe for every stage, in its own commit, and name it in your report (the harness `DEVSTAGE=1` option for
Cargo is fine). Never touch another agent's stage.

## Hard rules (unchanged)

- Electron only through `tools/botlab/run.sh` with `BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab
  SLOTS=4` (the shared lock: five agents share four slots). Never `npm start`, never touch `/Users/danielosling/Desktop/1/inkwave`
  (the user's app tree) or any `dist/`, never kill a process you didn't start: the user may be playing INKWAVE.
  Long runs: Bash timeout 600000.
- Commit as you go: `git -c user.name=LilDannyy -c user.email=94884334+LilDannyy@users.noreply.github.com commit`,
  messages ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never commit `.botlab/`, profiles or
  mp3s. Don't push (local agents); the lead merges.
- Look at your work (shots, downscaled with `sips -Z 1000`). Judge the new land in play first: from the spawn (`play`),
  from mid looking back, from the strategic point, from a flank.

## Done means (per stage)

1. `node build/check-maps.mjs <id>` ok; climb-audit clean; size-budget passes.
2. `spawn-mid.js` in the target band (both teams).
3. Cover map ≥ 90 % (report before and after).
4. Bots: turf (stuck % ≤ 1, no episode > 10 s in one spot), zones, tower-match; boss check.
5. Tower: tower-len reads the target length and 100 s to the goal (two-checkpoint stages); tower-check clean.
6. Perf at load (shoot.cjs REPORT) ≤ 1.35 × the stage's own numbers before (measure them first).
7. Every lightmap the stage had rebaked (`assets/lightmaps/<id>*.json` lists them), stage art re-rendered, intro
   fly-in and art cameras reframed, day and dusk checked.
8. Your note `tools/botlab/jobs/stretch/<id>.md`: the cut, Δ, the slice's design, routes, the Bazookarp notes, all the
   numbers before / after, pictures in `tools/botlab/jobs/stretch/out/<id>/` (top before / after, the slice from three
   angles, spawn `play`, tower top; JPG/WEBP < 300 KB each), committed.

## Final report (your last message)

Per stage: the slice in a paragraph (what it is, the strategic point, the routes); Δ and the cut; the numbers (spawn-mid
before → after, tower length / time, cover, stuck %, zones and tower matches, boss, perf, loadMs); shared-file changes;
known issues; the commits.
