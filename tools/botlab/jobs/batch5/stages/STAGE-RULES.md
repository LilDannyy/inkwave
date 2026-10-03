# Batch 5 stages: the rules every design must meet, and the lead's direction

Three new stages: `bluestone` (the city that travels through time), `aquarium` (clear pipes), `caldera` (the volcano).
The user's own words for each are in `../REQUEST.md` under "stages:". Read them first; they outrank everything here.

## Reading list (before you design anything)
- `tools/botlab/jobs/new-stages/BRIEF.md`: the standing stage brief. The quality bar (Halyard Marina), what "built for
  every mode on one layout" means, the file format a stage owns, the tools. Its addendum has the user's newer rules.
- `tools/botlab/jobs/new-stages/treehills.md` (and one more of `nantai.md`, `craters.md`, `calamari.md`,
  `spirhalite.md`): what a finished stage design document looks like. Yours must be at least that concrete.
- `tools/botlab/jobs/stretch/BRIEF.md`: the Long Stages standard every stage now meets, written as preparation for
  Bazookarp, and the per-stage Bazookarp notes next to it.
- Two built stages for calibration: `src/world/stages/terraces/layout.js` and `src/world/stages/calamari/` (it has a
  gimmick: timetabled trains, `src/game/movers.js`), plus `src/world/stages/treehills/` (sprout pods, `src/game/pods.js`).
- Pictures of what exists: `assets/stages/*-day.webp` (stage art) and `tools/botlab/jobs/new-stages/out/`.

## The user's standing rules for stages (their words where quoted)
1. **Halyard Marina is the bar.** A real, recognisable place with its own theme, props, surfaces and signage; every
   stage must feel different from the others.
2. **Never an empty stage.** "does the terrain not look... empty to you? besides some trees theres no environment, its
   just a bowl. no where to hide, no landmarks, nothing to fight over. this is not up to our standards and you should
   know that." Judge the playable space first. Mid needs a landmark structure to fight over. Cover every 6–10 m
   everywhere (measured with `tools/botlab/tests/cover-map.js`). Varied heights on the ground itself: mounds, beds, low
   walls. Every area has a purpose and dressing. Big bare floors fail.
3. **Mid matters most.** "regardless of the mode, mid is the most important part where most battles will be." Spacious:
   wide stairs and bridges, open floor, several ways in, never cramped corridors. Gimmicks are welcome there.
4. **No functionally rectangular maps, and vary the silhouette across a set.** "they're all glorified rectangles."
   Jagged edges on a north–south band still read as a rectangle. Each stage in this batch gets its own macro shape
   (below).
5. **Several real flank routes** on each side (2–4), meeting mid at different points.
6. **Off-limits tops.** Anything a player cannot reach without a special is not inkable and slides you off (`roof`).
   Railings and grates: `rail` / `grate`. Special-only lookouts: `perch` (walkable, never inkable, exposed).
7. **A kid climbs about 1.8 m** (hop plus ledge assist); a 1.9 m face is a wall. Roofs cannot be jumped from. Design
   barriers and ledges with that number, not 1.4 m.
8. **Mode-only changes are tagged** (`onlyIn` / `notIn` in `src/world/variants.js`); prefer one layout for every mode.
9. **Long Stages standard.** Spawn to mid is about 6 s of swimming (11.8 m/s): about 60 m in a straight line, more on
   foot. Measure with `tools/botlab/tests/spawn-mid.js`; budgets in `size-budget.js`. Deep spawns with room to re-form.
10. **Every mode from the start:** Turf War, Zone Control, Tower Command (straight-line track, square corners, 3.72 m
    headroom), the new Bazookarp (see `../bazookarp/SPEC.md` when it exists; until then use the user's rules in
    REQUEST.md and the research summary after them: distance to the goal matters most; at least two routes to each
    checkpoint and no hidden shortcuts into a base; no unreachable high ground to hide the carrier, or it becomes a
    free zone; the goal in front of the spawn or a level below it), and Boss Battle where the stage can host a 9 m boss.

## Rules for the gimmicks (the lead's)
- **Readable at a glance, warned in advance.** A player who has never seen the stage understands what is about to
  happen and what just happened: sound, a HUD line, something moving in the world. The user: "it should be very obvious
  when the lava is falling or rising."
- **Fair.** Nobody is splatted or trapped by the gimmick without a clear warning and a way out. Geometry that appears
  must never appear inside a player (define what happens to anyone standing there). Bots understand it: they path with
  it, avoid it, and use it.
- **The same on every screen online.** Driven by the host's stage clock (see `src/game/movers.js`, `src/game/pods.js`
  and `tools/botlab/tests/net-stageclock.cjs`), correct for a late joiner and after a host change.
- **Works in every mode.** Objectives (zones, the tower's track, Bazookarp checkpoints and goals) sit where the gimmick
  cannot make them unfair, or the gimmick's schedule is tied to the mode sensibly.
- **Ink.** Say what happens to ink on ground the gimmick covers, removes, reveals or replaces, and how turf is counted.
- **One new engine module per gimmick**, with small tagged hook-ins in shared engine files. Reuse what exists first.

## Macro shapes for this batch (each different from the others and from the twelve stages we have)
- `bluestone`: a city grid cut on the diagonal. Two streets cross at an angle and the laneways between them do the
  flanking; the footprint is a skewed X or a kinked Z, not a band.
- `aquarium`: round. A ring or figure-of-eight of galleries around great tanks, with the spawns in wings off the ring.
- `caldera`: a crescent. A horseshoe of rim and terraces around a lava lake, with islands in the lake as mid.
Designers may bend these if they make the case, as long as the three stay unlike each other.

## Direction per stage

### `bluestone`: the city through time
The user: a map based on Melbourne ("dont call it melbourne"). It starts in the past, the 1800s, "with old trams and
buildings and design". As the match goes on "a full map effect plays that simulates going forward to the current time,
which changes how the map looks and opens up new routes". Later "we again time travel but into 3000s melbourne. super
futuristic, and this adds new areas of the map that didnt exist before." Lore: Commander Tartar, "an AI created 12,000
years ago which is represented as an old telephone", is fast-forwarding the clock to see how the Earth is destroyed, to
go back and tell his creator, The Professor, how to do it and start the world anew.
- The place, never named: bluestone laneways and kerbs, a grand domed railway station with a row of clocks over its
  steps, cable trams becoming electric trams becoming something that floats, iron-lace verandas, a shopping arcade with
  a glass roof, a river bend with a bridge, street art down the lanes, coffee carts. Three eras of the SAME streets:
  about 1880 (gaslight, cable trams, horse carts, hoardings, timber and bluestone), today (trams, cafe laneways, murals,
  glass towers behind the old facades), the 3000s (very futuristic: light, glass, greenery, floating trams, sky-bridges,
  and whole new upper areas).
- Tartar must be in it. He is the cause: an old telephone that rings before each jump. Design the full-map effect
  around him. The user loved the clear-ink wave built for online Practice (`src/fx/inkWipeFx.js`, the level shader's
  world-space front) and its reuse as the Drainbow's grey wave: a sweeping front that rewrites the city as it passes is
  the obvious way to do the jump. Make it a showpiece.
- Era 2 opens routes that era 1 has closed (hoardings, a boarded arcade, a lane full of crates, a level crossing).
  Era 3 adds areas that did not exist (elevated walkways, a rooftop garden level, a platform over the river).
  Nothing a team relies on is taken away without warning.
- When the jumps happen in each mode, what happens to ink and to players and devices standing where something appears,
  and how each mode's objective lives through the jumps, are yours to design and justify.

### `aquarium`: clear pipes
The user was deliberately brief: "an aquarium. there's a gimmick on this map too, there's clear pipes that can suck you
in one end and pop you out the other, similar to Super Mario 3D World. Some pipes are bi-directional, and some are one
way only."
- Give it an identity as strong as the others: a real public aquarium with great tanks (a cylinder you fight around, a
  tunnel you fight through, a kelp forest, jellyfish, a touch pool, the back-of-house pump hall), light through water,
  and the clear pipes as part of the building.
- The pipes are the design problem. Decide and justify: who can enter (kid, squid, a Bazookarp carrier, thrown bombs,
  shots?), what the rider and everyone else sees (in Super Mario 3D World you watch the rider travel the whole pipe),
  whether a rider can be hurt, how fast it is, how a one-way pipe reads differently from a two-way one, what stops exit
  camping and pipe spam, how bots use them, how they look on the map. The network of pipes should create routes a
  normal stage cannot have, without making the walking routes pointless.

### `caldera`: the lava that rises and falls
The user: "an active volcano, where the lava level falls and rises. areas that the lava can rise to should have an
indicator at the top of the lava level similar to how water can stain into rocks. the lava rises up and covers flank
routes, brings floating rocks with it, rises platforms in the middle that are used as lookouts, adds or removes new
routes temporarily etc. and it should be very obvious when the lava is falling or rising."
- Every one of those clauses is a requirement: the stain line at the high mark on everything the lava can reach; flank
  routes that drown; rocks that float up and become stepping stones; middle platforms that rise into lookouts; routes
  that exist only at high or only at low lava; an unmistakable rising and falling.
- Decide and justify: the cycle and how it is announced, what touching lava does, what happens to ink and devices the
  lava covers, how each mode's objective stays fair at both levels, how bots plan around a route about to drown.
- It should look spectacular and still leave team ink the loudest colour on screen: lava is orange and so are inks.
  Solve that (the palette of the lava, its glow, how ink reads next to it).
