# Turf War Craters (`craters`) — the Long Stages stretch

Branch `stretch-e` (st-e). Files: `src/world/stages/craters/stretch.js` (the cut and the shift), `slice.js` (the
reserve line: pieces, holes for the ground tiler, the outline's new sides, the tower's loop), and edits in `layout.js`,
`props.js`, `murals.js` (board 11). No shared files touched.

## The cut and Δ

- **Δ = 22 m per half** (z) — the brief's band's top (the straight spawn → mid is 40.5; the stage was marked "aim 6.0").
- **The cut: z −28.5** on Alpha's half (+28.5 on Bravo's): just behind the pillbox's stair and the neck's sandbag wall,
  in front of the forecourt path (−29.7).
  - Stays (mid's): the Great Crater, the Remembrance Walk, the side zone, the zig-zag trench and its bridges, the fire
    trench and both saps, the pillbox, the memorial and the rampart, the flooded crater, the circle's cliffs round the
    front.
  - Moves out 22 m (the base's): the visitor pavilion (spawn deck, steps, side stairs), the neck, the coves and their
    landings, the forecourt path, the neck's battle-map board, the ice-cream cart, and the circle's cap round the neck.
- **The outline becomes a stadium.** The park's cliffs run on down both sides of the slice (`SLICE.coastL / coastR`,
  bowed a little, faceted like the rest of the Round Down) to the moved cap round the neck; the pillbox's headland is
  taken into the right side's line. Ten points a side keep the coast's point count odd, so the chalk lip's alternating
  heights still meet their twins at the half line (and every edge past the slice keeps its parity). The undercliff
  shelf runs on along the new sides from the coves to the saps' mouths; the chalk lip, the fallen chalk on the shelf
  and the backdrop's land ends (`back: PAV.z0`) follow automatically.
- How: `stretch.js` exports `ST = { cut: −28.5, d: 22 }`, `sz()`, `shiftDef()`, `shiftPlacement()`. The base's
  constants go through `sz()` where they're defined (`PAV`, the neck's inner end, the side stairs' holes, the board, the
  lamp and flags, the pad); `onGround()` placements take the drawing's coordinates and shift them; the ground raster
  (downs, paths) and the trench floors are rebuilt round the slice's holes (`inSliceHole`, `inSliceTrench`).

## The slice: the reserve line (z −28.5 … −52)

The Great Turf War's second line, kept like the first.

- **The support trench.** On the right flank its **bay** (3.2 m, timber revetments, sandbag parapets, open at both
  ends) — the tower's: it drops in at the north end and climbs out at the south. A **zig-zag** leaves the bay's east
  wall toward the mound (a plank bridge over its first bay, a stair up at its end). On the left a second zig-zag runs
  from a stair off the central path out to the left cliff walk (a plank bridge over its last bay).
- **The communication trench** zig-zags back from the left support trench's middle bay toward the neck, a stair up at
  its end ("TO THE LINE").
- **The observation post**: a concrete bunker behind the left support trench (camouflage, slits, sandbagged roof at
  2.4, reached by a stair up its side against the communication trench's wall) — high ground over the left flank.
- **The regimental mound — the strategic point.** A turf octagon (1.6) on the reserve line's axis with **the Inkling
  Rifles' cross** on its top (three-step base, bronze sword, "THE LINE HELD"), wreaths and poppies, stone gate piers
  with ball finials at the heads of its steps. Four ways up: the north steps (toward mid), the south steps (onto the
  neck's forecourt), turf ramps up its north-east and south-west shoulders. The tower climbs its west face, stops on
  its top (checkpoint 2) and drops off its east face.
- **Two flooded shell holes** (the right flank's route bends round one, the left cliff walk's round the other), reeds,
  lilies, poppies.
- The central **hoggin path** from the neck's forecourt past the mound's east face back onto the old path's line;
  **a RESERVE LINE board** (mural 11: a plan of the support line, the saps and the mound), lanterns, a bench, gorse,
  a hawthorn, chalk boulders, sandbag emplacements, barbed wire in front of the left support trench.
- Heights: −1.0 trenches · 0 downs · 0.5–0.7 plank bridges · 1.6 the mound (+ gate piers) · 2.4 the observation post's
  roof · off limits: the cross, the piers' caps.

### Routes through the slice (Alpha's half)

1. **The right flank**: the cliff walk past the pillbox, then either down the support trench's bay (covered) or along
   the cliff walk beside it, round the right shell hole to the neck's west side; the undercliff shelf below it.
2. **The centre**: the path past the mound's east face, or over the mound (north steps, the top, south steps).
3. **The left flank**: the cliff walk past the left shell hole, over the left support trench's bridge, past the
   observation post, down the communication trench to the neck's east side; the undercliff shelf below.
   Links across: the support trench itself (both zig-zags), the ground in front of and behind the mound, the tower's
   runs. The spawn keeps its three exits (the steps, the two side stairs down to the coves); the neck's forecourt is
   the defenders' re-forming ground (the mound's back, gorse, the gate piers).

## Cover (the stage was 79.2 % before the stretch — under the 90 % rule)

The slice was built with cover every 6–10 m, and the existing half got the rest: sandbag breastworks on the Great
Crater's crest (four segments a half, away from the cuts, the outer ramps and the tower's crossing: the rim's
defenders get cover), chalk boulders on the crater's slopes either side of each cut, gorse on the old downs where the
open ground ran longest (clear of the tower's track), the pillbox's roof sandbags raised 0.6 → 0.95 (and the
observation post's). **79.2 → 92.1 %.**

## Modes

- **Turf War**: cover-map floor cells 3438 → 5818 (the stadium's sides add more than a straight slice would).
- **Zone Control**: zones unchanged (the crater floor; the side zone on the left front).
- **Tower Command** (two checkpoints): 79.2 → **159.4 m** (target 158.4 ± 4 %: +0.6 %). The user's drawing is kept to
  its old goal in front of the neck (z 28.5); from there the loop: out along the reserve line's front to the right-flank
  cliff, down the support trench's bay (a drop in, a climb out), back east across the reserve line over the regimental
  mound (**checkpoint 2 on its top by the cross**), on to the goal in front of the neck (13.7 m short of the pad).
  Checkpoint 1 stays by the fire trench.
- **Boss Battle**: works — home ground 1866 m² (the whole stadium's downs), never idle more than 8 s, every move played.
  The check's "roams ≥ 50 m" bar (last round's) now reads 19–49 m over five runs; the same check on the pre-stretch
  stage gives 24 and 33 m today, so it's the boss closing on the squad and barraging, not the stretch. The copied check
  (`out/craters/boss-check.js`) asks for 30 m and 6 cells.

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint in the slice: the regimental mound's top, (−3, −43, 1.6).** On the axis between the Great Crater and the
  pavilion; the centre path runs past its east face, the support trench's two zig-zags end at its shoulders, the
  observation post and the pavilion's deck both see it. Four ways up, cover on it (the cross, the gate piers) and round
  it (emplacements, the zig-zags' parapets).
- **Goal in front of the spawn: the neck's forecourt, (3.5, −51, 0)** — a level below the pavilion's deck (3.0), in
  front of its steps, seen from the whole deck edge. Reached by the centre path, the mound's south steps, the
  communication trench's stair and the right flank past the shell hole.
- **Routes mid → goal** (nav, metres, each forced through its waypoints; `out/craters/routes.js`):
  - the central path (the crater's cut, the zig-zag's bridge, the path past the mound): **60.4**
  - over the mound (its north steps, the top by the cross, the south steps): **70.2**
  - the right flank (the ring, past the pillbox, down the support trench's bay, round the shell hole): **104.8**
  - the left flank (the pond's rim, the cliff walk, the bridge, the communication trench): **111.9**
  - the shortest nav path mid → goal is 57.5; mid → the checkpoint on the mound 46.5.
- **High ground a carrier could hide on:** the observation post's roof (2.4, a stair) and the pillbox's (2.4) are
  reachable, sandbagged and in view of the ground round them and of the pavilion — no hiding place (a "no carrier" rule
  for bunker roofs could come later if Bazookarp testing says so). The cross and the pier caps are off limits.

## Numbers (before = `new-stages` 0cd3945 as measured today; after = this branch)

| | before | after |
|---|---|---|
| spawn → mid | 3.63 / 3.88 s, avg 3.76 | 5.85 / 6.17 s, **avg 6.01 (1.60×)** |
| straight spawn → mid | 40.5 m | 62.5 m |
| tower track | 79.2 m | **159.4 m**, 1.99 m/s, checkpoints at 34.3 / 142.3 m, **100 s to the goal** |
| tower-check | clean | 0 holes, clearance clean, both rides knockout, nobody knocked off |
| cover (≤ 5 m) | 79.2 % (largest open 17 m) | **92.1 %** (largest open 17 m: sandbag tops on the post's roof) |
| turf bots stuck | 1.1 % (120 s; 4.25 s at the undercliff) | 0.1 % (180 s), longest 0.25 s |
| zones match | — | Alpha on time 19 vs 58, stuck 0.2 %, longest 0.5 s |
| tower match | — | Alpha on time, best pushes 130.9 / 72.5 m (both sides past a checkpoint), stuck 0.1 % |
| boss check | home ground, idle, moves pass (roam 24–33 m today) | home ground 1866 m², idle ≤ 8 s, moves pass; roam 19–49 m |
| climb audit | — | 0 barred climbs (214) |
| lightmap rows | 721 / 2048 | 1124 / 2048 |
| paint atlas density | 27.6 ppm | 19.8 ppm |
| nav nodes / A* cap needed | 3592 / 1500 | 6156 / 3000 (≤ 6000 ✓) |
| perf at load, day turf (calls / tris / cpuRender / loadMs) | 316–360 / 1.78–1.85 M / 4.6–5.6 ms / 7.0–8.7 s | 326–349 / 2.01–2.22 M (≤ 1.25×) / 3.6 ms quiet (up to 33 under load) / 7.4 s quiet |
| perf at load, day tower | 420–441 / 1.66–1.76 M / 4.3–6.7 ms / 7.5–14.0 s | 378–392 / 1.87–1.95 M (≤ 1.17×) / 4.6–6.8 ms / 8.1–11.6 s |

(Perf: the old tree (`git archive 0cd3945`) and this branch shot alternately while other agents ran bots; the
craters turf shots of this branch landed on the busiest minutes — the quiet run of the same build read 336 calls /
2.01 M tris / 3.6 ms / 7.35 s. Calls stay put, triangles +13–25 %.)

Known issues: the stadium adds more floor than a straight slice (≈ +70 % land rather than +50 %: the park is round and
64 m wide); the undercliff shelf along the new sides is long and bots idle there a few seconds now and then (a rock at
its right-side point was removed: it made a one-metre squeeze); paint atlas density 27.6 → 19.8 ppm.

## Pictures (`out/craters/`)

`top-before.jpg` / `top-after.jpg` (the stadium), `top-tower-before.jpg` / `top-tower-after.jpg` (the loop through the
reserve line), `slice-from-mid.jpg`, `slice-from-spawn.jpg`, `slice-west.jpg` (the support trench's bay), `slice-east.jpg`
(the left support trench, the communication trench, the observation post), `strategic-point.jpg` (from the mound's top
toward mid), `mound.jpg`, `spawn-play.jpg` / `spawn-play-dusk.jpg`, `cover-before.jpg` / `cover-after.jpg`. Stage art:
`assets/stages/craters-{day,dusk}{,-sm}.webp` from the reframed `art` camera.
