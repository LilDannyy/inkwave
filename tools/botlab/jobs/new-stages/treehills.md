# Eco-Forest Treehills (`treehills`): design

**Name:** Eco-Forest Treehills. **Times:** day (the dome's simulated noon: bright, clean) / dusk (the dome screens play
a sunset; windows and path lights on).

Read `BRIEF.md` first (the rules, tools and report), including its **Addendum (2026-09-29)**: the user's newer rules.

## The place (the user's words)

"It is a massive, tiered biome engineered with lush greenery, cypress/thujopsis-style evergreen trees, and rolling
artificial hills mixed with eco friendly buildings and windmills. Like the rest of Alterna, it was built by humanity to
preserve and recreate natural terrestrial ecosystems beneath the mountain. The skybox is a simulation of the sky on
screens."

References, in this folder:
- `treehills-sky-ref.webp`: the Alterna sky. A normal blue sky with clouds, crossed by a geodesic grid of thin, pale
  blue glowing lines (triangles meeting at nodes): the seams between the dome's screens. Under it, a space-centre
  skyline (a rocket, gantries). That skyline is a different Alterna site: don't copy it, but distant Alterna structures
  on the horizon are welcome.
- `treehills-buildings-ref.webp`: Alterna architecture.
  - Modular container-like buildings in deep green with chequer-plate roofs and edges.
  - Half-cylinder glass greenhouse pods with plants inside.
  - A white satellite dish with a round blue logo.
  - Red valve fixtures, round hatches, landing-pad circles, painted floor labels, a pale-cyan float-balloon.
  - It's clean, engineered and slightly retro-futurist. Use this language for every building on the stage.

What the players should read from any camera:
- **The sky dome.** The geodesic grid over the sky (backdrop `objects`: a huge icosphere of thin, glowing, additive
  lines, fog off, drawn over the sky), and at the horizon the cavern's rock walls rising into the dome's rim. It is an
  indoor sky: no sea horizon.
- **Tiered tree-hills.** Artificial hills built in terraces, with retaining walls in green-grey panels, lawn tops and
  dense cypress / thujopsis evergreens (tall dark-green cones and layered sprays, instanced). Two big ones form the
  flanks.
- **Wind turbines.** One modern three-blade turbine on each flank hill (mirrored), blades turning slowly (a backdrop
  `objects` mesh, or a prop plus an animated part). More turbines on the far hills.
- **Eco buildings.** Each base is an Alterna research-station block: green modular units, a greenhouse pod or two, the
  satellite dish, solar panels, seed-bank crates. Each spawn is a roof deck on it.
- **Reservoir water.** The stage sits in a calm engineered reservoir (the death plane): `water: 'marina'` calm mode or a
  calm sea look, clean teal-green. Small sluices and a weir on the far walls.
- **Signage.** Alterna stencils ("ECO-FOREST TREEHILLS", biome numbers, "SEED BANK 05", arrows, pad circles) as
  murals.

## Layout (world metres; Alpha at −Z, Bravo at +Z)

A **diamond**: widest across the middle (x ≈ ±34) and narrowing toward each base (x ≈ ±12 at the spawn buildings). The
edges are terraced and faceted: straight segments at the geodesic 30° / 60° angles, stepped where the tiers meet the
water. This silhouette is different from the other four new stages (a jagged band, round, a band and an S) and puts the
most room at mid.

- **Mid, "the Commons Meadow": the priority.** A broad, open lawn across the widest part of the diamond (roughly
  30 × 22 m of floor at y 0). Its cover:
  - low planters and seed-bank crates;
  - a pollinator border;
  - a couple of young cypress clumps (tree colliders);
  - above all, the **sprout pods** (the gimmick, below), so the cover changes during the match.

  At least five ways in from each half: both hill ramps, the central path, and two terrace stairs. Never cramped.
- **The flank tree-hills** (the diamond's east and west corners, mirrored):
  - terraces at 1.3 / 2.6 / 3.9 m with broad ramps (≤ 24°) and wide stairs;
  - dense evergreens on the tiers as cover and shade;
  - the wind turbine on top, out of play (its base is a roof);
  - they look down on the meadow: the high ground over mid, reachable from both halves, so they are contested too.
- **Each half's approach:** from the base forecourt, three lanes fan out: left hill, centre path, right hill. A mid-tier
  terrace (1.3 m) crosses in front of the base, with a greenhouse pod on it as big cover.
- **Base:** the research-station block; the spawn deck at about 3.2 m on its roof, with wide stairs down both sides and
  a ramp.
- **Heights:** 0 meadow · 1.3 / 2.6 / 3.9 hill tiers · 1.3 base terrace · about 3.2 spawn deck.

## The gimmick: sprout pods (growable cover)

Pods are seed bulbs in low planters, placed around mid and along the lanes (6–8 per half, mirrored).
- **Growing:** ink a pod (either team; shots, rollers, bombs all count) until its meter fills, and a hedge bursts out
  of it: a dense boxwood / cypress hedge wall about 2.6–3.2 m wide, 0.9 m deep and 1.8 m tall.
- **Timing:** the hedge lasts about 20 s, wilts back into the pod, and the pod recharges for a few seconds.
- **Physics:** hedges block movement and shots and are not inkable; their tops are slide-off.
- **Shoving:** players standing where a hedge grows are shoved aside, never into walls or water.
- **Ownership:** the cover is team-neutral; whoever grows it, it shields anyone.

So cover appears where the fight is: shoot a pod to block a sightline, cut off a flank or wall in a zone. The engine
side of this is being built in parallel by another agent (see "Contract" below). You place and dress the pods.

Pod placement rules:
- Mirrored.
- Never inside a zone polygon (next to zones is good).
- Never on the tower track's footprint (2.5 m platform plus margin) or its headroom.
- Never on a spawn exit or narrow stair.
- A fully grown hedge must not seal a route completely: every area keeps another way round.

### Change from the user (2026-09-29): team-owned hedges you can climb

"Can you make it so the sprout pods are slightly hued to the colour of the team who shoots it and only they can ink the
sprout to climb up it to get more high ground or block off paths?"
- **Growing.** Each team fills its own meter on a pod; the first to fill it grows the hedge, and the hedge is that
  team's. While filling, the dormant pod blushes toward the team that's ahead on it.
- **Look.** The grown hedge is tinted in the owner's ink colour: leaves with a clear team-colour sheen or blossoms, not
  a flat recolour.
- **Ink.** The hedge takes ink from its owner's team only: the other team's shots don't stick (they still hit it as
  cover). Its walls in the owner's ink can be swum up, like any inked wall.
- **Top.** The top is standable (not slide-off) and takes the owner's ink: high ground for the team that grew it, and
  a wall that blocks a path for everyone.
- **Placement.** Place pods where a hedge top gives useful but fair high ground: over the meadow, at lane corners. A
  1.8 m top is higher than a jump, so kids get up only by swimming up the owner's ink. Mirror them as before.

## Modes

- **Zone Control.**
  - Centre: the meadow middle, one zone of about 12 × 11 m (or two zones either side of a central planter), with pods
    round it but not in it.
  - Side: the base terrace (1.3) in front of each spawn building, closer to its spawn than to the centre.
- **Tower Command.** "Across the meadow and up the hill." Straight lines and square corners:
  - from the centre across the meadow;
  - **climbs** up the first hill tier (1.3), then along the tier;
  - a **climb** to 2.6;
  - along the upper tier past the turbine base;
  - a **drop** back down to the base terrace;
  - the goal about 12 m short of the pad.
  - About 80–90 m, 2 checkpoints; clearance under any trees and structures (3.72 m).
- **Boss Battle.** The meadow suits HULLBREAKER; check it can roam and charge across it (pods and hedges: see the
  contract).

## The world round it (env)

- `bay: false`.
- Backdrop:
  - the geodesic sky grid;
  - cavern walls on every side, blending into the dome rim;
  - rolling artificial forest hills beyond the reservoir (terrain with dark-green forest; instanced cypress), turbines
    on them;
  - distant Alterna buildings;
  - maybe a lift shaft or pipe bundle running up a cavern wall.
- Water: calm, clean reservoir colours (theme overrides). No gulls (it's indoors); `boats: false`, `buoys: false`.
  Mist: none, or very light.
- Theme overrides: a slightly too-perfect sky (the dome's rendering): clean blue, soft sun. At dusk the dome plays a warm
  sunset with the grid lines glowing a little brighter.

## Surfaces (your 3 slots: 61–63)

Suggestions:
- manicured artificial turf / meadow lawn;
- green-grey engineered retaining panels (hex / triangle panel seams, bolts);
- Alterna chequer-plate deck (green-tinted steel with worn chequer, for roofs, decks and stairs).

## Contract with the pods engine (src/game/pods.js, being built now)

The layout carries the pods; the engine reads them. Until the engine is merged into your branch, the pods simply do
nothing (keep them as placed props so the stage looks right). The format:

```js
LAYOUT.pods = {
  mirror: true,                                   // each listed pod gets its 180° twin
  timing: { last: 20, wilt: 1.0, recharge: 6 },   // optional overrides (s)
  modes: { boss: 'on' },                          // per mode 'on' (default) / 'off'
  list: [
    { id: 'meadow-w', pos: [x, y, z], rotY: 0,     // the pod on the floor at pos (y = floor height); rotY turns the hedge
      size: [3.0, 1.8, 0.9],                       // the hedge it grows: width (across rotY), height, depth
      pod: { type: 'treehills_pod' },              // PropKit types for the looks (the engine falls back to a default)
      hedge: { type: 'treehills_hedge' } },
  ],
};
```

You register the two prop types in `props.js`:
- `treehills_pod`: the dormant seed bulb in its planter (about 0.9 × 0.7 × 0.9 m), with a swelling part the engine can
  scale as the meter fills.
- `treehills_hedge`: the grown hedge, built at the size it's given (w × h × d, origin at its base centre); leafy,
  flowered, no colliders (the engine makes the collision block). It is tinted to the owner's team colour by the engine
  (a `team` / `tint` option, or a colour the engine multiplies in: agree the mechanism in the engine's report). Leave
  the leaf material light enough that a tint reads, and give it a flat-ish top the engine's ink overlay can sit on.

The engine side:
- the meter and growth;
- collision, shoving and nav blocking;
- sounds;
- online sync;
- bots using pods.

When it lands, the lead merges it into your branch (or tells you to merge a branch); then test pods on the stage.

## REWORK (the user, 2026-09-29): the stage is empty. This is the priority now.

The user looked at the finished pictures: "does the terrain not look... empty to you? besides some trees theres no
environment, its just a bowl. no where to hide, no landmarks, nothing to fight over. this is not up to our standards".
They are right. The meadow is a flat lawn with scattered small trees, and the hill terraces are bare lawns. Keep the
shape, the heights, the stations, the sky, the turbines and the pods, and fill the playable space with a real
environment. Concretely:

1. **Mid gets a landmark to fight over: the Seed Vault Plaza.**
   - A raised hexagonal plaza at the centre: top at 1.3, about 13–14 m across.
   - Engineered stone and green-grey panel sides, a chequer-plate rim.
   - Four or more ways up: two broad ramps (≤ 24°) and two wide stair flights, plus a squid-climbable inked wall face or
     two.
   - Cover on it: planter boxes with cypress at its corners (tree colliders), a couple of low seed-bank consoles
     (1.0–1.2 m).
   - The centre zone moves onto the plaza top.
   - The tower starts on the plaza: path `[0, 1.3, 0]` first, then a drop off its east edge onto the meadow.
   - Its middle stays clear for the tower.
2. **A landmark over mid: the Solar Canopy.**
   - A big hexagonal solar-leaf shade roof hovering over the plaza on four to six slim pylons at its edge, underside at
     about 7 m.
   - Clear of the tower's headroom: 1.3 + 3.72 = 5.02, keep a margin.
   - Panels with light glinting through, maybe vines.
   - The roof is off-limits (roof, slide-off); the pylons are cover.
   - Visible from both spawns: the meadow's icon.
3. **Two Alterna greenhouse pods flanking the plaza.**
   - Mirrored, e.g. about 8–10 m long along x at z ≈ ±9, offset from the tower's lane at z 0.
   - Half-cylinder glass tubes like the reference: 2.4–2.6 m tall, plants inside, glass roofs off-limits.
   - Hard cover that splits the meadow into lanes round the plaza. They're walls, not perches: their glass roofs are
     off-limits.
4. **The meadow floor rolls.**
   - Grass mounds 0.6–1.2 m with ramped sides (the "artificial hills" in miniature) where the open lawn is.
   - Granite boulders (1.2–1.8 m).
   - A fallen log or two (0.8 m).
   - Raised flower and pollinator beds with 0.5–0.7 m edges.
   - Shrub clumps (1.0–1.4 m) under the young cypress, and a shallow decorative rill (floor −0.3, not water death) with
     stepping stones or a little footbridge.
   - Pods stay where they are, or move to spots where a hedge matters most.
5. **The hills are forests, not lawns.**
   - Every terrace gets groves: clusters of 3–5 cypress / thujopsis with shrub underplanting (colliders at trunks and
     shrubs), boulders, and gravel trails winding between them.
   - Also on the terraces:
     - solar-panel arrays (tilted panel rows about 1.2 m, great line cover);
     - a small ranger shelter / weather station on the upper tier;
     - beehive boxes, compost bays, irrigation tanks and pipes;
     - on the crowns, a maintenance hut and railings round the turbine base.
   - The tower's route (band → upper tier → strip) keeps its 2.5 m floor and headroom; groves sit beside it.
6. **The gardens and the base terrace are working spaces.**
   - Raised beds (0.6 m), a polytunnel or two (greenhouse tunnels as cover), a tool shed, water tanks.
   - Seed-bank crate stacks, a drone landing pad, Alterna cargo modules, an antenna mast.
   - A reason for every corner.
7. **Density check (required, include the picture).**
   - Make a top-down cover map: for every 1 m floor cell, the distance to the nearest cover at least 0.9 m tall (solid
     colliders, trees, hedges not counted).
   - Targets:
     - at least 90 % of the floor is within 5 m of cover;
     - no open circle larger than about 6 m radius anywhere except the plaza top and the zone.
   - Show the map before and after.
   - Also measure Halyard with the same script and include its numbers.

Keep all the modes working: zones (the centre zone on the plaza), the tower (re-check the track with the plaza start, the
drop, groves beside the route), boss (the plaza is a wall to it, and its ground is the meadow ring round the plaza,
still large; re-check), bots (stuck ≤ 3 %, no long episodes), the climb audit, the `play` spawn view, perf vs Halyard,
rebake, stage art, and pictures:
- the meadow from both spawns;
- the plaza with the canopy;
- a hill grove;
- the garden;
- the cover maps.
