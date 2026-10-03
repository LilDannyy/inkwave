# `caldera`: Highmark Foundry — the design the builder builds (revision 2)

The lead's design for batch 5's volcano stage. Read it with `ENGINE.md` next to this file (the lava engine's contract
for exactly this design), `../STAGE-RULES.md`, `../../REQUEST.md` (the user's words) and `../../bazookarp/SPEC.md` §9.
Where this file and the user's words disagree, the user's words win.

**Revision 2 (2026-10-04), after the user's advocate and the build / modes engineer reviewed revision 1.** The plan is
redrawn in curves; the old box plan is gone. "Review log" at the end lists every issue and what was done. In short:
- **The plan is a tomoe, not a box.** The lake, every shore and every tier front are arcs round the island; the island is
  an irregular basalt mass; each half's outline is lopsided (a fat rim root on the owner's side, a diagonal Spillway
  breach and a narrow enemy horn on the other). Bounds ±36 × ±74, 5,514 m² of floor (revision 1: ±40 × ±77, 7,800 m²).
- **A flank really drowns and the rocks replace it in the same place:** each rim is broken at **the Slump**, where at
  LOW the only way along the shore is a shelf at the cliff's foot, and at HIGH the shelf drowns and the Pumice Race
  surfaces beside it as a zig-zag of five irregular stones.
- **LOW lava is −0.6**, just under the ledges, with a continuous moat round the island; the lava at rest is warm
  charcoal-maroon with lit seams, not black; the works get a strong non-warm identity (works green, verdigris, whitewash).
- **The lookouts rise 2.35 m**, and the tallest one stands in the lake: 2.3 → 4.65, 3.45 m over the island at HIGH.
- **Natural volcanic ground** on the rims and horn tips (spatter cones, hummocks, scree ramps, outcrops, a columnar
  basalt pavement round the Organs), plus a sunken weighbridge pit in the yard and a raised casting bed on the terrace.
- Every engineering blocker is fixed: no stair ends in the air, the outer edge is in the piece table, the Surge Gauge
  is solid to 22 m and its piers clear the Pond's sightlines, no crane beam crosses the spawn view, the lava region
  lies 0.5 m inside every bank, bots climb the lookouts by explicit step links.

Conventions:
- World metres and seconds. x right (east), +z toward Bravo. Alpha spawns at −z, Bravo at +z. Alpha faces +z, so
  **Alpha's left is +x (east), its right is −x (west)**.
- Angles θ are in degrees, measured from +x toward +z (0 = east, 90 = north, −90 = south, 180 = west). `P(r, θ)` is the
  point at radius r and angle θ from the centre (0, 0).
- Every table lists **Alpha's half**: everything Alpha owns (its base and its own crescent, which reaches into z > 0 as
  far as its horn tip) and the **single** centre pieces. Bravo's half is every Alpha piece turned 180° about the origin
  ((x, z) → (−x, −z)). So Bravo's horn tip, which sits in z < 0 beyond Alpha's Spillway, is the turn of Alpha's.
- Heights are floor tops. Tiers: **0** ledges (drown) · **1.2** quays, island, causeways, Slump heads · **1.8** Pour
  Floor and Moorings · **2.4** terrace, Ladle Road, horn tips · **3.0** the weighbridge pit and the casting bed ·
  **3.6** yard, Rim Head, Rim Ridge, bastion, Gauge Posts · **4.8** spawn gallery. Every step between tiers is 1.2 m
  (bots hop it: nav.js jump edges reach 1.25 m) or 0.6 m (a walk-up for kids, a hop for bots).
- The lava: **LOW −0.6**, **HIGH +0.8** (the high mark: the stain line).
- **Paper numbers** come from a 0.25 m raster of this exact plan in both lava states (`plan-r2-low.png`,
  `plan-r2-high.png` beside this file are its pictures; the model itself is `paper-model/`, Python with numpy, scipy and
  PIL: `python3 analyse.py`, `karp.py`, `tower.py`, `flanks.py`, `ascii.py`): bot moves walk ≤ 0.5 m, hop ≤ 1.25 m, drop ≤ 3.4 m; cover by
  `cover-map.js`'s rule. They are the builder's targets, not measurements: `spawn-mid.js`, `cover-map.js`,
  `tower-check.cjs`, `bazookarp-check.cjs` and `lava-audit.js` decide.

---

## 0. The judgement (revision 1, kept for the record)

Revision 1 chose **concept-gimmick** (Tidefire Caldera, 40/50: the pinwheel of two crescents, drowning ledges as
flanks, Organ Pipes, stones on seams, the quiet finish) as the base, dressed it in **concept-place**'s identity
(Highmark Foundry, the Surge Gauge, the Pumice Race, the Casting Floor, the terraces and yard) and took
**concept-play**'s lava range, guaranteed final LOW and cue pairs. It rejected the derrick, gondola spawns, Wellfield
and observatory (identities that repeat), leap-gap stones, rider-only lookouts, the hot-foot, a surge at time-up.

Revision 2 keeps all of that and changes what the reviews showed was wrong: the plan was drawn as rectangles, the
flanks never closed, LOW hid the volcano, the lookouts barely rose, and a dozen build details were missing (Review log).

---

## 1. Name, identity, story, landmark

**Name: Highmark Foundry.** Stage-select blurb: *"A foundry inside a breathing volcano. Every surge drowns the low
roads, floats the Pumice Race across the Slump and heaves the Organ Pipes out of the lake. Mind the high mark."*

**Identity.** Highmark Foundry stands inside Bellows Caldera on Cinder Isle, two hours by ferry from Inkopolis. The
caldera's lava lake breathes: about every ninety seconds it swells up its walls to the same pale line, holds there,
and sinks back. The old hands call it the Bellows breathing, and the foundry has lived by that breath since 1931 the
way a harbour lives by the tide. Even at the ebb the lake is molten, a ring of glowing lava half a metre under the low
roads. At every ebb the crews work the low ground: the Casting Floor, the Spillways and the shelf under **the Slump**,
where a stretch of each rim fell into the lake in 1977 and the only way along the shore is the cliff-foot path. At every
surge the lava drowns that path, pours out of the Spillways as lavafalls, fills the Casting Floor's moulds, floats the
chained pumice raft of **the Pumice Race** across the Slump, and heaves the loose basalt columns on Gauge Island,
**the Organ Pipes**, up into lookouts; the tallest stands in the lake itself. Everything Inkopolis stands on was cast
here: bollards, lamp posts, manhole covers, bench ends, drain grates. The yards are stacked with them, waiting for the
ferry.

Two works face each other across the lake: the South Works (Alpha) and the North Works (Bravo). Each has its Casting
Hall on the caldera rim and a theatre of curved terraces stepping down to its Lakefront. Each works also owns one long
side of the caldera: a rim of raw basalt that sweeps from its base round the lake to a horn tip deep in the other works'
half. Where a horn tip falls short of the other base the rim is breached: the **Spillway**, a glazed lava channel cut
diagonally through the rim, where the lake pours out over a lip at every surge and runs down the mountain as a
lavafall.

**The landmark: the Surge Gauge.** A 22 m iron tower on the Pour Floor at the centre of Gauge Island: four basalt
piers to 7 m, then a riveted lattice in works green. On its south and north faces, a 7 m gauge board (8–15 m up) with
a car-sized float needle that climbs as the lake rises; above it a clock house, the bell cage with the 1.6 m Surge
Bell, two siren trumpets and four beacons; a pyramid roof with a weathervane of a ladle pouring a flame. It is visible
from both spawns, every lane and the stage-select shot, and it is the works' clock, bell and tide gauge in one. Every
wall the lava can reach carries its bathtub ring: glossy, darkened stone below, a crisp ash-white crust line at 0.8 m,
dry stone above. The works paint their own white HIGH MARK line on every post they own, so you read the line twice.

**Why this place is right for the user's clauses.**

| the user asked for | at Highmark Foundry |
|---|---|
| the lava level falls and rises | the Bellows' breath on a fixed timetable the works post on boards; even at the ebb the moat round the island glows 0.6 m under the low roads |
| an indicator at the top of the lava level, like water staining rock | the ash-white rind at 0.8 m on every face the lava reaches (the region lies 0.5 m inside every bank, so every shore wall carries the whole ring), plus the works' painted HIGH MARK lines |
| covers flank routes | **the Slump**: on each rim the cliff-foot shelf is the only way along the shore at LOW, and it drowns at every surge; the Spillway floors and the Casting Floors drown too |
| brings floating rocks with it | **the Pumice Race**: five irregular pumice stones per Slump surface with the lava in a zig-zag beside the drowned shelf, the same crossing in a new form; loose pumice drifts on the whole lake and rises and falls with it |
| rises platforms in the middle that are used as lookouts | **the Organ Pipes**: three columns per cluster; the lookout column stands in the lake and climbs 2.35 m, from 2.3 to 4.65, 3.45 m over the island at HIGH |
| adds or removes routes temporarily | LOW only: the Slump shelf, the Spillway floor, the Casting Floor; HIGH only: the Pumice Race |
| very obvious when rising or falling | the Surge Gauge's needle, the bell versus the whistle, a siren that winds up or down, red versus white beacons, embers versus steam, the lavafalls, the Organs grinding and shedding rubble, the HUD gauge, the map |

---

## 2. The plan

### 2.1 Macro shape: a tomoe of two crescents round a lake

A single horseshoe cannot survive the 180° turn, so each works owns one crescent and the two interlock like a tomoe:
**Alpha's** comma has its head at the south (the South Works) and its tail sweeping clockwise up the **west** side of the
lake to a horn tip at θ 142–158 (north-west, deep in Bravo's half). **Bravo's** is its turn: head at the north, tail
down the east side to a horn tip in the south-east. Between each horn tip and the other base the rim is breached by a
diagonal Spillway (Alpha's runs out along θ −48 to the south-east, Bravo's along θ 132 to the north-west). Half-way
along each tail the rim is bitten by **the Slump** (Alpha's at θ −145…−177, Bravo's at θ 35…3), where the lake reaches
the cliff.

Everything that faces the lake is an arc round the island:
- the lake's shore is the arc r 23 along both Lakefronts and r 21 along the rims, broken by the Spillway mouths and the
  Slump bays; the region is a 96-vertex outline plus four bays (§3.2);
- the tier fronts of each base are concentric arcs (Lakefront r 23 → 30, Moulding Terrace r 30 → 39, yard front r 39),
  so each base reads as a theatre facing the island;
- Gauge Island is an irregular basalt mass of 70 vertices, about r 11.5–15, with the Organ clusters set into notches;
- the outer edge follows the tiers: a fat rim root on the owner's side (the Rim Head bulges to x −34), the Slump's bite
  (the cliff at r 31.5), the tail tapering to a 9 m-wide horn, the diagonal breach, and on the breach's far side the
  enemy horn, narrower than the base it faces.

**From above:** each half is lopsided. In Alpha's half (z < 0) the west edge bulges to x −34 (the Rim Head) and is
then bitten by the Slump; the east edge is cut diagonally by the Spillway, and the land beyond it is Bravo's horn tip,
a 9 m spit. The north half is the same turned. At LOW the read is two commas of pale works and dark rock round a
glowing ring; at HIGH the Slump bays and both Spillways flood, the Race and the lookouts rise, and the commas stand
apart in the lava.

**Unlike the twelve and the batch.** Craters is a round island with a ring road round a centre: here there is no ring
of land (the Spillways cut it twice and the Slumps bite it twice), the centre is an island in a lake, and the two halves
are not mirror images left to right. Halyard's basin grammar (straight quays, a central pier, bridges over water) is
gone: the shores are arcs, the island is rock, and the main gimmick lives on the flanks. Spirhalite is an S of land
round two coves with a ridge between; Highmark is a closed caldera with a central lake and island, and its curl is
round one centre. Bluestone is a skewed X of streets and the aquarium a chain of round galleries.

- **Playable extents:** x −33.9…33.9, z −68.9…68.9 (the gallery's back). The Casting Halls run on to z ±73 (roof).
- **`bounds`:** `{ minX: -36, maxX: 36, minZ: -74, maxZ: 74 }`.
- **Floor (paper):** 5,514 m² at LOW, 5,064 m² at HIGH (Craters 5,800). Drownable floor about 575 m² (about 10 % of the
  floor, under the engine's 15 % line, so Turf War's final LOW needs ≥ 25 s; it gets 30). Each half's is equal by
  construction.
- **Open lava** (paper): 668 m² at LOW (revision 1: 521 m², in two pits 2.8 m down), 1,153 m² at HIGH.

### 2.2 The plans (generated from the piece model)

True top-down: **+x right, +z DOWN the page** (Alpha's base at the top). One character = 1 m of x, one row = 2 m of z
(the row is labelled with its northern z and sampled at its middle, z + 1). The plans were generated from the same
paper model as the numbers; pieces less than 2 m deep can fall between rows (the piers are added as `P`). **Where a
plan and the piece table differ, the table wins.**

Legend: `S` 4.8 gallery · `#` 3.6 paved (yard) · `R` 3.6 natural rock (Rim Head, Rim Ridge) · `^` a mound or spatter
cone (walkable) · `v` 3.0 weighbridge pit · `c` 3.0 casting bed · `=` 2.4 paved (terrace) · `r` 2.4 natural rock (Ladle
Road, horn tip) · `:` 1.8 Pour Floor · `m` 1.8 Moorings · `.` 1.2 · `,` **0, drowns** · `~` lava (always; at HIGH also
every `,`) · `/` stairs and ramps · `b` bridge deck · `L` Organ Pipes (riders) · `s` Pumice Race stones (HIGH only) · `o`
cover (roof) · `B` buildings and big structures (roof) · `n` solid parapet · `|` railing (`rail`) · `P` Surge Gauge pier ·
`X` spawn pad · blank: out of play (caldera wall, cliff, the outside).

**At LOW** (the Slump shelves, the Spillways and the Casting Floors open; no stones):
```
             -30       -20       -10       0         10        20        30
  -74                      BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  -72                      BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  -70                            SSSSSSSSSSSSSSSSSSSS
  -68                            SSSSSSSSSSSSSSSSSSSS
  -66                      ######SSSSSSSSSXXSSSSSSSSS######
  -64                      ###///SSSSSSSSSSSSSSSSSSSS///###
  -62                      ######SSSSSSSSSSSSSSSSSSSS######
  -60                   ######o##SSSSSSSSSSSSSSSSSSSSBBBB##
  -58                ############ooooo#////////#o####BBBB#B#
  -56               ###################////////#############
  -54             ##BBBBBBB#############################o###
  -52            ###BBBBBBB#################oo###############
  -50           ####BBBBBBB##################################
  -48          ##################ooo#####oo############BBBB##
  -46          ###oo######oo###########################BBBB##
  -44         R##############################################
  -42      RooR#########o###########################oo#######
  -40     RRRRRR########################===||||##############
  -38     RRRRRRRo###o########==oo==////=oo=========o==/#####
  -36    RR^RRRRRR########=======================cccc=///===|
  -34     RRRRRRRRR########======================ccc=====BBBB
  -32      RRRRoRRRR===##===oo==========oo============o=BBBBB
  -30      RRRRRRRoRRR==/==========////////......./=======BB=|
  -28     RRRRRRRRRRRRR///====mmmmm.//...........///....n===,,,,
  -26     RRRRRRRRRRRRRRR=mmmmmommmm.................ooo..bb,,,,,,
  -24      RRRRRRRRRR.mmmmmmmmmmmmmm....................,,bbbb,,,o,,
  -22      RRRRRRRRR.B.mmmmmmmmm.~~~~~~........,,,,,,.,,,o,,bbob|,,,,~
  -20       nRRRRR..BBB..mmmm.~~~~~~~~~........,,,,,,,,,,,,,,,bbbbbrr
  -18           ,,.........~~~~~~~~~~~~........,,,oo,,,,,,,,,,,,|rrrr
  -16          ,,,,,~~....~~~~~~LL~~~~~o......o,,,,,,,,oo~~~,,,,...rr
  -14         ,,,,,~~~~~~~~~~~LLLLL~~~~........,,,,,,,,,,~~~~~^^####r
  -12        ,,,,,~~~~~~~~~~~~.LLL.................,,,,,~~~~~rrrr##r
  -10       ~,,,,~~~~~~~~~~~~~.~LL..o..oo....o........,,~~~~~~rrrrrRRR
   -8       ,,,,,~~~~~~~~~~~~~..LL...............oo.....bbbbbbbrrrrrR^^R
   -6      ~,,,,~~~~~~~~~~~~~.........::::::::::........bbbbbbbrrrrrRooRR
   -4      ~,,,,~~~~~~~~~~~~~.o....o..::::::::::........~~~~~~~~r^^rrRRRR
   -2       .......~~~~~~~~~~..o......P::::::::P.........~~~~~~~rrrr.....
    0       RRRRRrrrrr~~~~~~~.........P::::::::P.....oo..~~~~~~~~~~~......
    2       RRRRRrr^rrbbbbbbb.........::::::::::.oo....o.~~~~~~~~~~~~~,,,,~
    4        RooRrroorrbbbbbb.......................LL..~~~~~~~~~~~~~,,,,,
    6         R^RRrrror~~~~~~.....oo................LL..~~~~~~~~~~~~~,,,,,
    8           RRRrrrrr~~~~~~,,.......oo....o...o.LLL~.~~~~~~~~~~~~,,,,,~
   10             ###rrr.~~~~~,,,,,,...............LLL~.~~~~~~~~~~~,,,,,~
   12            r####..~~~~~,,,,,,,,,,........~~~~LLLL~~~~~~~~~~~,,o,,,
   14            rr...,,,,~~,o,,,,,,,,,........~~~~~~~~~~~~~....~,,,,,~
```

**At HIGH**, the middle band (every `,` is lava; the Pumice Race `s` is up in each Slump bay; the Organs `L` stand
0.95–2.35 m taller):
```
             -30       -20       -10       0         10        20        30
  -34     RRRRRRRRR########======================ccc=====BBBB
  -32      RRRRoRRRR===##===oo==========oo============o=BBBBB
  -30      RRRRRRRoRRR==/==========////////......./=======BB=|
  -28     RRRRRRRRRRRRR///====mmmmm.//...........///....n===~~~~
  -26     RRRRRRRRRRRRRRR=mmmmmommmm.................ooo..bb~~~~~~
  -24      RRRRRRRRRR.mmmmmmmmmmmmmm....................~~bbbb~~~o~~
  -22      RRRRRRRRR.B.mmmmmmmmm.~~~~~~........~~~~~~.~~~o~~bbob|~~~~~
  -20       nRRRRR..BBB..mmmm.~~~~~~~~~........~~~~~~~~~~~~~~~bbbbbrr
  -18           ~~.........~~~~~~~~~~~~........~~~oo~~~~~~~~~~~~|rrrr
  -16          ~~~~~~~....~~~~~~LL~~~~~o......o~~~~~~~~oo~~~~~~~...rr
  -14         ~~~~~~~~~ss~~~~~LLLLL~~~~........~~~~~~~~~~~~~~~^^####r
  -12        ~~~~~~~~sss~~~~~~.LLL.................~~~~~~~~~~rrrr##r
  -10       ~~~~~~~~~~s~~~~~~~.~LL..o..oo....o........~~~~~~~~rrrrrRRR
   -8       ~~~~~~~~sss~~~~~~~..LL...............oo.....bbbbbbbrrrrrR^^R
   -6      ~~~~~~~~sss~~~~~~~.........::::::::::........bbbbbbbrrrrrRooRR
   -4      ~~~~~~~~ss~~~~~~~~.o....o..::::::::::........~~~~~~~~r^^rrRRRR
   -2       .......ss~~~~~~~~..o......P::::::::P.........~~~~~~~rrrr.....
    0       RRRRRrrrrr~~~~~~~.........P::::::::P.....oo..~~~~~~~sss~......
    2       RRRRRrr^rrbbbbbbb.........::::::::::.oo....o.~~~~~~~~s~~~~~~~~~
    4        RooRrroorrbbbbbb.......................LL..~~~~~~~~sss~~~~~~~
    6         R^RRrrror~~~~~~.....oo................LL..~~~~~~sss~~~~~~~~~
    8           RRRrrrrr~~~~~~~~.......oo....o...o.LLL~.~~~~~~~ss~~~~~~~~~
   10             ###rrr.~~~~~~~~~~~...............LLL~.~~~~~sss~~~~~~~~~
   12            r####..~~~~~~~~~~~~~~~........~~~~LLLL~~~~~sss~~~~~o~~~
   14            rr...~~~~~~~o~~~~~~~~~........~~~~~~~~~~~~~....~~~~~~~
```

**Objectives on the LOW plan** (`Z` centre zone, `z` Alpha's side zone, `W` / `G` the Bazookarp weir and Gate **of
Bravo's attack on this half** (the data in §4 is Alpha's attack on Bravo's half: negate), `c` the tower checkpoints of
Bravo's track on this half, `f` Alpha's Carp-Free Zone):
```
             -30       -20       -10       0         10        20        30
  -70                            ffffffffSSSSffffffff
  -66                      ######fffffSSSSXXSSSSfffff######
  -62                      ######fffffffSSSSSSfffffff######
  -60                   ######o##ffffffffffffffffffffBBBB##
  -52            ###BBBBBBB#################oo#####GGG#######
  -44         R########################c#####################
  -34     RRRRRRRRR########========c=============ccc=====BBBB
  -28     RRRRRRRRRRRRR///====zzzzz.//...........///....n===,,,,
  -26     RRRRRRRRRRRRRRR=zzzzzzzzzz....W..W.W.......ooo..bb,,,,,,
  -24      RRRRRRRRRR.zzzzzzzzzzzzzz.......c............,,bbbb,,,o,,
  -22      RRRRRRRRR.B.zzzzzzzzz.~~~~~~........,,,,,,.,,,o,,bbob|,,,,~
  -20       nRRRRR..BBB..zzzz.~~~~~~~~~........,,,,,,,,,,,,,,,bbbbbrr
   -6      ~,,,,~~~~~~~~~~~~~.........ZZZZZZZZZZ........bbbbbbbrrrrrRooRR
   -2       .......~~~~~~~~~~..o......PZZZZZZZZP.........~~~~~~~rrrr.....
    2       RRRRRrr^rrbbbbbbb.........ZZZZZZZZZZ.oo....o.~~~~~~~~~~~~~,,,,~
```
(rows not shown are as in the LOW plan). The tower track is given as coordinates in §4.3.

### 2.3 The geometry kit and the piece table

**Curves are data, not freehand.** `layout.js` stays plain data plus these plain helpers (importable in Node), and every
curved piece below is written with them so the builder reproduces the paper model exactly:

```js
const D = Math.PI / 180;
const P = (r, a) => [r * Math.cos(a * D), r * Math.sin(a * D)];             // a in degrees: 0 = +x, 90 = +z
const arc = (r, a0, a1, step = 2.5) => {                                    // points from a0 to a1 inclusive
  const n = Math.max(2, Math.floor(Math.abs(a1 - a0) / step) + 1);
  return Array.from({ length: n }, (_, i) => P(r, a0 + ((a1 - a0) * i) / (n - 1)));
};
const rot = ([x, z]) => [-x, -z];
// Alpha's Spillway: s along the channel (outward, θ −48), t across it (+t toward Bravo's horn tip, θ 42)
const SD = [Math.cos(-48 * D), Math.sin(-48 * D)], SN = [Math.cos(42 * D), Math.sin(42 * D)];
const ch = (s, t) => [s * SD[0] + t * SN[0], s * SD[1] + t * SN[1]];
const HW = 5.5, S_MOUTH = 22.3, S_LIP = 34.0;                                // half width, mouth, lip
// Alpha's Slump stone line: from the south head (S0) to the north head (S1)
const S0 = P(23.5, -143.5), S1 = P(23.5, -178.5);                           // (−18.89, −13.98), (−23.49, −0.62)
const U = [-0.32555, 0.94552], V = [0.94552, 0.32555];                       // along S0 → S1; across, toward the island
const sp = (b, a, c) => [b[0] + U[0] * a + V[0] * c, b[1] + U[1] * a + V[1] * c];
const FACE = 1.9;                                                            // half width of each Slump head's tip face
```

**How the curved floors are built** (the island, the Lakefronts, the terraces, the yard, the rims): with the polygon
fill of `src/world/stages/nantai/ground.js` (`fill(P, o)`), ported into `caldera/ground.js`. Each polygon becomes
axis-aligned columns inset 0.18 m from slanted edges, and an edge ledge (an oriented box) along every slanted edge that
covers the columns' stepped edge. The ledges stand 0.06 / 0.12 / 0.18 m proud (a basalt coping, alternating so no two
overlapping ledges share a top: no z-fighting); a coping under 0.35 m is walked over (`PLAYER.stepUp`). Two rules
remove revision 1's coplanar overlaps:
- **Pieces that meet share an edge exactly and never overlap at the same height.** Where two floors of the same height
  join (the yard and the Rim Head, the Ladle Road and the horn tip), the shared edge is one line in both polygons and
  the builder fills it once (one polygon, two surfaces by `noPaint` / material zones), or gives one of them a 0.06 m
  lip. check-maps reports any overlap.
- **Stairs and ramps sit on the lower tier**, in front of the face they climb, their top edge on the upper tier's edge.
  No stair is cut into the tier above it.

Every bank and island face that meets the lava reaches down to **−1.1** (LOW − 0.5, ENGINE rule 9); below −0.6 it is
`paint: false` (split the block at −0.6, rule 11).

**Single (centre, self-symmetric):**

| piece | where | size / shape | top | flags | purpose |
|---|---|---|---|---|---|
| **Gauge Island** | centre | `ISLAND = HALF.concat(HALF.map(rot))`, `HALF` = (0, −11.5) (5, −11.5) (7.8, −10.9) (10.4, −9.2) (12.3, −7.4) (13.5, −7.9) (13.5, −2.0) (14.1, 1.0) (13.7, 4.4) (12.7, 7.6), then the notch round Bravo's Organ cluster (below), then (5, 11.5). 70 vertices, 556 m² | 1.2 | sides to −1.1 | Mid: an irregular basalt mass. Faces: S (Alpha's causeway, x −5…5), SE shoulder (the Casting Floor at LOW), E (x 13.5, z −7.9…−2: Bravo's East Bridge), NNE notch (Bravo's Organs), and their turns. Built by `fill` with a basalt coping; its top is a pavement of columnar basalt slabs (texture), flat for the hop and tower rules except the stumps below. |
| Organ notch (Bravo's; Alpha's is its turn) | round L (10, 12.8), B (10, 9.14), A (10, 6.34) | 24 points, every one 0.15 m off a column flat: (12.63, 12.73) (11.38, 10.56) (11.25, 10.48) (10.88, 10.51) (11.63, 9.21) (11.63, 9.06) (10.88, 7.76) (10.88, 7.71) (11.63, 6.41) (11.63, 6.26) (10.88, 4.96) (10.75, 4.89) (9.25, 4.89) (9.12, 4.96) (8.37, 6.26) (8.37, 6.41) (9.12, 7.71) (9.12, 7.76) (8.37, 9.06) (8.37, 9.21) (9.12, 10.51) (8.75, 10.48) (8.62, 10.56) (7.37, 12.73) | — | — | A notch in the island's edge, not a hole: A and B sit inside it, L's south half (Bravo's: its north half) stands in the lake. **Socket build:** every notch edge is a socket collar, an oriented box 0.6 m thick laid outward from the edge, from −1.1 to 1.35 (0.15 m proud of the island: an iron-bound basalt kerb), turned to the edge's angle (0°, ±60°); the island's columns stop 0.18 m behind the collars. The 0.15 m seams between collars and columns and the 0.20 m seams between columns stay open: the lava glows through them. |
| **Pour Floor** | 0 / 0 | 10 × 10 | 1.8 | — | Cast-iron plates with the foundry mark. Centre zone, the Pond, the tower's start. 0.6 m step on all sides. |
| Surge Gauge piers ×4 | (±4.2, ±1.75) | 1.2 × 1.2, 1.8 → 7.0 | 7.0 | roof | Off the diagonals (the Pond is seen from all 8 checker directions, §4.4). Cover in the zone; ≥ 2.35 m from the tower lane. |
| Tie girders ×2 | z ±1.75, x −4.8…4.8 | 0.4 thick, 6.0 → 7.0 | 7.0 | roof | Cut the spawn-to-spawn sightline. 4.2 m over the Pour Floor (tower headroom 3.72 ✓). |
| **Surge Gauge upper works** (colliders) | centre | lower lattice x ±4.8, z ±2.35, 7.0 → 12.0; shaft 3.6 × 3.6, 12.0 → 17.0; clock house 3.0 × 3.0, 17.0 → 18.5; bell cage 3.0 × 3.0, 18.5 → 20.5; cap 2.4 × 2.4, 20.5 → 22.0; gauge boards 2.4 × 0.3 at z −2.35…−2.65 and +2.35…+2.65, x ±1.2, 8.0 → 15.0 | 22.0 | all roof | Bombs, the Carp Shot, Tempest clouds, charger rays and super-jump arcs meet a solid tower. The lattice mesh is see-through; its collider is the box (it stops shots as the tower looks it should). Only the needle, the bell, the beacons and the weathervane are backdrop animation. |
| The lake | — | the region (§3.2) minus everything standing in it | void | — | No floor: the lava is drawn over void (engine rule 9). |

**Alpha's half — the South Works (spawn and base):**

| piece | where | size / shape | top | flags | purpose |
|---|---|---|---|---|---|
| **Spawn gallery** | x −10…10, z −69…−57.5 | 20 × 11.5 | 4.8 | — | The Casting Hall's gable gallery, open to the sky. Pad (0, 4.8, −64.5), barrier 4.2. |
| Casting Hall | x −16…16, z −73…−69 | 12 m tall | 12 | roof | Whitewashed basalt hall, verdigris sawtooth roof running back out of play, round furnace window. |
| Hall wings ×2 | x ±10…±16, z −69…−66 | 8 m tall | 8 | roof | Close the side yards' backs. |
| Gallery Stair | x −4…4, z −57.5 → −54.8 | 8 × 2.7 | 4.8 → 3.6 | — | Spawn exit 1 (forward), on the yard. |
| Gallery side stairs ×2 | x ±10 → ±12.7, z −64.5…−61.5 | 2.7 × 3 | 4.8 → 3.6 | — | Spawn exits 2 and 3, onto the side yards. |
| Gallery balustrades | front z −57.5 for x ±(4…10); sides x ±10 for z −69…−64.5 and −61.5…−57.5 | 0.25 thick, 1.0 | — | rail | The gallery is entered only by its three stairs. |
| Gallery urns ×4 | (±8.4, −59.4), (±8.4, −67.4) | 1.2 × 1.2 × 1.1 | — | roof | Cover outside the barrier. |
| **The Yard** | — | `arc(39, -63, -126)` then (−27.5, −40) (−27.5, −47) (−24, −54) (−20.5, −58) (−16, −60.5) (−16, −66) (−10, −66) (−10, −57.5) (10, −57.5) (10, −66) (16, −66) (16, −60) (17.5, −54) (18, −47) (18, −40); 1,012 m² (with the side yards x ±10…±16) | 3.6 | — | The dispatch yard, paved: the defenders' apron, the Bazookarp Gate, the tower goal. Its front is the r 39 arc; it wraps the gallery. |
| **Weighbridge pit** | x −12…−5, z −52…−48 | 7 × 4, sunk 0.6; ramps 2.4 m long (14°) off its west and east ends (x −14.4…−12 and −5…−2.6, 4 m wide) | 3.0 | — | The yard's ground feature: a sunken iron weighbridge plate. Its long sides are 0.6 m steps. |
| Yard front railing | the r 39 arc from θ −63 to −116 and −123 to −126, gaps at θ −67.8…−72.2 (Cupola Stair), −90…−101 (Upper Surge Steps + the plain hop face θ −90…−95), −105…−112.2 (the tower climb) | 0.25 thick, 1.0 | — | rail | Turns the 1.2 m yard front into a wall except at its ways down. |
| Upper Surge Steps | on the terrace at θ −98, top edge on r 39 | 4 wide, 2.7 run: from (−5.05, 2.4, −35.95) up to (−5.43, 3.6, −38.62) | 2.4 → 3.6 | — | Terrace ↔ yard, centre. |
| Cupola Stair | on the terrace at θ −70 | 3 wide, from (12.41, 2.4, −34.11) up to (13.34, 3.6, −36.65) | 2.4 → 3.6 | — | Terrace ↔ yard, east. |
| Office Stair | on the terrace along the Rim Head's east face (θ −126) | 3 wide, from (−17.10, 2.4, −28.46) up to (−19.51, 3.6, −26.86) | 2.4 → 3.6 | — | Terrace ↔ Rim Head, west. |
| **Bastion** | sector r 35.5 → 39.05, θ −116 → −123 | 16 m² | 3.6 | basalt parapets 0.9 on its free sides | The Surge Office's balcony out over the terrace: the defenders' high point over the Moorings. Its undercroft is the Pattern Shop (doors on the terrace, giant wooden patterns inside). |
| Surge Office | x −23…−16, z −53.5…−47.5 | 9.5 tall | 9.5 | roof | Two storeys of basalt, works-green window frames; the split-flap **Surge Board** on its south face, toward the gallery. |
| Cupola furnace | (14.0, −46.5) | 4.4 square collider, round mesh r 2.2, stack to 15 | 15 | roof | The iron melter; sparks at its hood; big cover on the yard's east side. |
| Weighbridge office | x 10.5…14.5, z −59.5…−56 | 3.2 tall | 6.8 | roof | Cover by the gallery's east stair. |
| Jib crane | mast at (16.0, −56.5), 1.2 × 1.2 to 12 m | jib 9 m at 10 m, parked pointing ESE (toward (24, −60)), out of play | 12 | roof (mast) | Replaces revision 1's overhead crane. From the `play` lens (about (0, 7.5, −69)) the mast is 52° off the view axis, outside the 41° half-field: nothing crosses the spawn view. |
| Casting stacks (cover, all `roof`) | covers stack (5.6, −56.2) 1.6 × 1.6 × **1.3**; manhole covers (2.0, −50.6) 1.6 × 1.6 × **1.3** (the Gate apron's two blocks, §4.4); lamp-post rack (−7.5, −56.6) 5 × 1.2 × 1.2; bench ends (−16, −44.5) 1.6 × 2.4 × 1.0; pig iron (−18.5, −41.5) 1.6 × 1.6 × 1.0; ingot stack (−1.0, −47.0) 1.6 × 1.6 × 1.1; drum stacks (−24.0, −44.5) 1.4 × 1.4 × 1.2 and (−25.5, −37.0) 1.6 × 1.2 × 1.2; mould boxes (4.0, −39.9) 2 × 1 × 1.0; cable drum (13.5, −53.5) 1.6 × 1.6 × 1.2; weighbridge load (−8.5, −54.0) 2 × 1.2 × 1.1; weigh-beam hut (−8.5, −46.3) 2.4 × 1.4 × 2.4; ingot rack (−1.5, −40.1) 2 × 1 × 1.0; bollard pallet (−21.5, −46.0) 1.6 × 1.6 × 0.9; drain grates (−12.5, −59.0) 1.6 × 1.6 × 1.1; rails (10.5, −40.4) 2.2 × 1.2 × 1.0; cairn (−21.5, −36.5) 1.2 × 1.2 × 1.2 | — | — | roof | Cover every 5–8 m, all ≥ 0.5 m clear of the tower lane and ≥ 4 m from the Gate. |
| Charging shed | outside the line ch(34, −5.5) (18.66, −28.95) → P(39, −63) (17.71, −34.75) | 2.5 m deep, 5.1 tall | 7.5 | roof | Edge piece E7 (below): closes the corner between the Spillway Quay and the yard. |

**Alpha's half — the Moulding Terrace (2.4) and the Lakefront (1.2):**

| piece | where | size / shape | top | flags | purpose |
|---|---|---|---|---|---|
| **Moulding Terrace** | — | `arc(30, -126, -58.6)` (without its last point), `ch(29.49, -HW)` (15.65, −25.60), `ch(S_LIP, -HW)` (18.66, −28.95), then `arc(39, -63, -126)`; 362 m² | 2.4 | — | The slice: the works' curved terrace, the ladle rail flush along it. Its east end along the channel (s 29.5 → 34) is the **Spillway Quay**. |
| **Casting bed** | sector r 33 → 36.2, θ −74 → −80 | 12 m² | 3.0 | — | The terrace's ground feature: a raised sand bed with moulding flasks round it (0.6 m step). |
| Terrace parapet | on the r 30 arc, θ −58.6 → −71 and −77 → −79.5 | 0.5 × 0.9 | 3.3 | roof (solid, cover) | Basalt with a whitewashed coping. Gaps: the East Steps (θ −71…−77), the tower climb and a plain hop face (θ −79.5…−89.4), the Lower Surge Steps (θ −89.4…−104.6); west of θ −104.6 the terrace face is open onto the Moorings (0.6 step). |
| Lower Surge Steps | on the Lakefront at θ −97 | 8 wide, from (−3.33, 1.2, −27.10) up to (−3.66, 2.4, −29.78) | 1.2 → 2.4 | — | Lakefront ↔ terrace, centre (off the causeway axis, so the weir has room). |
| East Steps | on the Lakefront at θ −74 | 3 wide, from (7.53, 1.2, −26.24) up to (8.27, 2.4, −28.84) | 1.2 → 2.4 | — | Lakefront ↔ terrace, east. |
| Firebrick Store | centre P(35, −63.5) (15.6, −31.3), turned to face the lake | 4 × 5, 4.6 tall | 7 | roof | Buff brick, works-green iron doors. |
| Terrace cover (all `roof`) | pattern crates (−10.0, −37.0) 2.4 × 1 × 1.2 and (11.5, −31.5) 1 × 2.4 × 1.2; firebrick pallet (9.5, −37.4) 1.2 × 1.2 × 1.0; ingot pile (−14.0, −31.4) 1.6 × 1.6 × 1.0; flask stacks (−7.5, −31.4) and (−2.0, −31.3) 1.6 × 0.9 × 1.1; mould boxes (−1.0, −36.8) 2 × 0.8 × 1.0 | — | — | roof | Clear of the tower lane (z −34 ± 1.75). |
| **Lakefront** (with the south Slump head) | — | `[ch(S_MOUTH, -HW), ch(29.49, -HW)]`, `arc(30, -58.6, -126)`, P(30.5, −126) (−17.93, −24.68), P(31.5, −133) (−21.48, −23.04), P(31.5, −145.5) (−25.96, −17.84), the south head's tip face `sp(S0, 0, -FACE)` (−20.69, −14.60) and `sp(S0, 0, FACE)` (−17.09, −13.36), `arc(23, -137, -100.1)`, (−4, −22.65), (4, −22.65), `arc(23, -79.9, -61.9)`; 291 m² | 1.2 | sides to −1.1 | Alpha's shore: a 7 m quay between the lake arc (r 23) and the terrace face (r 30). Its west end is the **south Slump head**, whose tip face is square to the stone line. Mooring bollards and lamp posts along the lake edge are **colliderless** (decor). |
| **Pumice Moorings** | `arc(23.6, -106, -134)`, P(31.2, −134), P(30.5, −126), `arc(30, -126, -106)` | 87 m² | 1.8 | — | **Alpha's side zone**: the iron-edged stage where the works keep the Race's winch and spare stones. 0.6 m step on every side. |
| Moorings cover | capstan (−14.6, −22.0) 1.4 × 1.2 × 1.3; chain bollard (−11.4, −24.4) 1 × 1 × 1.0; stone crate (−17.4, −21.6) 1.2 × 1.2 × 1.0 | — | — | roof | Cover inside the zone. |
| Winch house | (−21.2, −19.6), turned −140° | 3 × 3, 2.8 tall | 4.0 | roof | On the south head: drives the Race's chains (they run out to the stones). Cover at the landing. |
| Lakefront cover | ladle car (11.5, −24.6) 3 × 1.6 × 2.0; chain bin (−5.6, −24.2) 1.2 × 1 × 1.1; **Tide Board** (7.0, −23.8) 2.4 × 0.6 × 2.2 | — | — | roof | All ≥ 0.5 m from the tower lane and ≥ 3 m from the weir. |
| **Causeway** | x −4…4, z −22.65…−11.5 | 8 × 11.15 | 1.2 | sides to −1.1 | The centre lane over the moat, always open; the tower's track. Lamp plinths 0.9 × 0.9 × 1.3 (roof) at (±3.4, −14.5) and (±3.4, −19.5), lamps on top. |
| **Casting Floor** | (4, −22.65), `arc(23, -79.9, -61.9)` (without its first point), `ch(S_MOUTH, -HW)` (10.83, −20.25), `ch(S_MOUTH, 0)` (14.92, −16.57), (12.3, −7.4), (10.4, −9.2), (7.8, −10.9), (5, −11.5), (4, −11.5); 107 m² | 0 | drowns, sides to −1.1 | The centre's LOW-only swap: the moat floor between the causeway's east side, the island's SE shoulder and the Lakefront (hop 1.2 onto any of them). Its north-east edge faces the East Pool (open lava). Pig beds (flush moulds) glow after every fall; floor drains spit sparks before a rise. Mould stack (8.4, −17.4) 1.6 × 1.6 × 1.8 and ladle stand (13.4, −15.0) 1.6 × 1.6 × 2.0 (roof). |

**Alpha's half — the Spillway (its own breach, south-east) and the enemy horn beyond it:**

| piece | where | size / shape | top | flags | purpose |
|---|---|---|---|---|---|
| **Spillway** | `ch(22.3, -5.5)` (10.83, −20.25), `ch(34, -5.5)` (18.66, −28.95), `ch(34, 5.5)` (26.84, −21.59), `ch(22.3, 5.5)` (19.01, −12.89) | 11 × 11.7, 129 m² | 0 | drowns, sides to −1.1 | The diagonal breach floor: a **glazed lava channel even when dry** (black glassy pahoehoe ropes running outward to the lip, a glossy glaze, flow ripples, hot seams that glow for 20 s after each fall). At LOW a low road from the Casting Floor to the enemy horn; at HIGH the lake pours out over its lip as a lavafall. |
| Spillway Bridge | s 27 → 30 across the channel: `ch(27, ±HW)`, `ch(30, ±HW)` | 3 × 11 | 2.4, underside 2.0 | girder sides `rail` (y0 2.4, 1.0 tall) | Alpha's Spillway Quay (terrace) → Bravo's horn tip. Pier at `ch(28.5, 0)` (19.07, −21.18), 2.4 × 0.8 turned to the channel, roof 2.0. Kids walk under it on the channel floor (2.0 m clear). |
| Channel sides | SW side (t −5.5): the Lakefront (1.2) for s 22.3…29.5, the quay (2.4) for s 29.5…34; NE side (t +5.5): Bravo's Horn Step (1.2) for s 22.3…27, Bravo's horn tip (2.4) for s 27…34 | — | — | — | **Every way out of the channel is a 1.2 m hop:** onto the Lakefront, onto the Horn Step, or onto the Casting Floor's level at the mouth. No 2.4 m stair, so nothing ends in the air (revision 1's Horn Stairs did). |
| Horn Step (Bravo's; this row is the turn of Alpha's) | `ch(22.3, 5.5)` (19.01, −12.89), `ch(27, 5.5)` (22.15, −16.38), `ch(27, 8)` (24.01, −14.71), (18.26, −10.97), (18.32, −11.45) | 10 m² | 1.2 | sides to −1.1 | A 2.5 m shelf along the horn's channel face: channel (0) → Horn Step (1.2) → horn tip (2.4), two hops. |
| Hornitos ×2 | `ch(31.5, 2)` (22.56, −22.07) and `ch(24.6, -2.6)` (14.53, −20.02) | 1.6 × 1.6 × 2.2 | 2.2 | roof | Spatter chimneys on the channel floor; cover; they smoke at the warning. |
| Lip fence | across the lip at s 34, t −5.5 … 5.5 | 0.25 × 1.0 | — | rail | Chain fence; beyond it the lavafall chute (out of play; a fall there reports `lava`, §3.5). |

**Alpha's half — its own west rim and the Slump:**

| piece | where | size / shape | top | flags | purpose |
|---|---|---|---|---|---|
| **Rim Head** | P(39, −126) (−22.92, −31.55), P(30.5, −126), P(31.5, −133), P(31.5, −145.5), P(36, −148.5) (−30.70, −18.81), P(41, −143) (−32.74, −24.67), P(44.5, −136) (−32.01, −30.91), (−34, −35.5), (−31.5, −41), (−27.5, −44), (−27.5, −40) | 216 m² | 3.6 | — | The rim root: a knoll of raw basalt at the base's west corner, joined flat to the yard. Natural ground (below). It overlooks the Slump; a 2.4 m wall down to the Lakefront and the south head. |
| Rim Head parapet | from P(31.5, −145.5) to P(36, −148.5) | 0.4 × 0.9 | 4.5 | roof | The edge over the Slump cliff: a vantage, not a drop route. |
| Rim Head ground | spatter cone at (−29.5, −33.0): top r 1.2 at 4.5 (0.9 up), base r 3.2, eight radial ramp facets (craters `coneFacets`, ≤ 24°); hummock at (−28.5, −24.5): top r 0.8 at 4.2, base r 2.15; outcrops (roof) (−33.0, −38.0) 2.4 × 1.6 × 1.4, (−29.8, −40.8) 1.6 × 1.4 × 1.3, (−24.5, −29.0) 1.6 × 1.4 × 1.3; cairns (roof) (−26.0, −27.0), (−32.2, −27.5) 1.2 × 1.2 × 1.2 | — | — | mounds walkable; outcrops roof | Not a flat terrace: lava-rock mounds you climb and outcrops you hide behind. |
| **Slump shelf** | `[P(27, SA0), P(31.5, SA0)]`, `arc(31.5, SA0 - 2.5, SA1 + 2.5)`, P(31.5, SA1), P(27, SA1), `arc(27, SA1 + 2.5, SA0 - 2.5)`, with SA0 = −145.5, SA1 = −176.5 | 4.5 m wide, about 16 m long, 71 m² | 0 | drowns, sides to −1.1 | **The flank that drowns.** At LOW the only way along this shore: a cliff-foot path between the two heads (hop 1.2 down and up). Hornitos (roof, 1.4 × 1.4 × 2.0) against the cliff at P(30.4, −152) (−26.84, −14.27) and P(30.4, −168) (−29.74, −6.32), leaving a 2.7 m path on their lake side. |
| The Slump cliff | outside the arc r 31.5 from θ −145.5 to −176.5, and from P(31.5, −176.5) to P(30.5, 178) | 1.5 m thick | 7.0 | roof | Edge piece E3: the caldera wall comes down to the lake here. Its face is in the lava region (it carries the rind). |
| **South Slump head** | the Lakefront's west end (above) | tip face 3.8 m wide, square to the stone line | 1.2 | — | The Race's south landing; the shelf's south end (hop). |
| **North Slump head** | `sp(S1, 0, -FACE)` (−25.29, −1.23), P(27, SA1) (−26.95, −1.65), P(31.5, SA1) (−31.44, −1.92), P(30.5, 178) (−30.48, 1.06), P(21, 178) (−20.99, 0.73), `sp(S1, 0, FACE)` (−21.70, 0.00) | 20 m² | 1.2 | sides to −1.1 | The Race's north landing; the shelf's north end; a hop up to the Ladle Road. |
| **Ladle Road** | `arc(21, 157.5, 178)`, `arc(26, 178, 157.5)` | 5 m wide, 43 m² | 2.4 | sides to −1.1 | The rim's road of rough basalt from the north head to the horn tip; the West Bridge leaves it. Vent hood (roof) 1.4 × 1.4 × 1.4 at P(24, 177) (−23.97, 1.26). |
| **Rim Ridge** | `arc(26, 158, 178)`, P(30.5, 178), P(31, 172), P(30, 166), P(28.2, 161) | 36 m² | 3.6 | — | The rim's crest of raw rock over the Ladle Road. Spatter cone at P(28.25, 166.5) (−27.47, 6.59): top r 0.6 at 4.2 (0.6 up), base r 1.95; outcrop (roof) at P(28, 175.5) (−27.91, 2.20) 2.0 × 1.4 × 1.3. |
| Scree ramps ×2 | radial at θ 163.5 and 171: from P(23, θ) (2.4) up to P(26, θ) (3.6) | 3 wide, 3 m run (21.8°) | 2.4 → 3.6 | — | In place of a straight 1.2 m face between the Ladle Road and the Ridge: loose scree you run up. The rest of that face is a hop. |
| **Horn tip** | `ch(-27, -HW)` (−22.15, 16.38), `ch(-S_LIP, -HW)` (−26.84, 21.59), P(31, 144.5) (−25.24, 18.00), P(30.5, 149) (−26.14, 15.71), P(29.5, 153) (−26.29, 13.39), P(28, 156) (−25.58, 11.39), P(26, 157.5) (−24.02, 9.95), P(21, 157.5) (−19.40, 8.04), `arc(21, 155, 150)`, P(21.3, 149) (−18.26, 10.97), `ch(-27, -8)` (−24.01, 14.71) | 42 m² | 2.4 | sides to −1.1 | Alpha's tail tip, a 9 m spit of rough basalt along Bravo's Spillway. Its Horn Step is the turn of the row above. Cairn (roof) (−24.6, 16.2) 1.2 × 1.2 × 1.2; ladle cradle (roof) at P(22, 155.8) (−20.07, 9.02) 1.6 × 1.4 × 1.2 (lake-side cover for the Ladle Road). |
| Gauge Post W | centre P(26.2, 152) (−23.13, 12.30), turned 152° | 3.6 × 3.6 | 3.6 | basalt parapet 0.9 on its two outer sides | A squat blockhouse whose flat roof is a 1.2 m hop: a lookout over Bravo's Spillway and the West Bridge. Hand-cranked siren on the parapet. |
| **West Bridge** | from (−20.75, 2.4, 5.0) on the Ladle Road down to (−13.5, 1.2, 5.0) on the island's W face (x −13.5, z 2…7.9) | 4 wide (z 3…7), 7.25 run (9.4°) | 2.4 → 1.2 | rails along both sides | Alpha's rim → the island's W face (north half). |

**Riders (Alpha's; Bravo's are the turn):**

| piece | where | size | top | flags | purpose |
|---|---|---|---|---|---|
| **Organ A** | (−10, −6.34) | hexagon, corners on ±x, r 1.5 (flat to flat 2.60) | **1.4 at LOW → 2.35 at HIGH** | rider; deck inkable; depth 3.3 | The first step, in the island's socket. |
| **Organ B** | (−10, −9.14) | hexagon r 1.5 | **1.8 → 3.5** | rider; deck inkable; depth 3.7 | The middle step, in the socket. |
| **Organ L** (lookout) | (−10, −12.80) | hexagon r 2.5 (16.2 m²) | **2.3 → 4.65** | rider; deck and sides inkable; depth 4.2 | The lookout: its north half in the island's notch, its south half **standing in the lake**. A broken stub 1.2 × 1.2 × 0.7 on its lake side rides with it. Seams A–B and B–L 0.20 m (flat to flat, along z); 0.15 m to the island. |
| Organ stumps (static, walkable) | hexagons at (−6.5, −8.8) r 0.9 top 2.1; (−12.4, −2.8) r 0.9 top 2.4; (−7.0, −3.4) r 0.8 top 1.8 | — | — | — | The column pavement round the cluster: uneven basalt you step and hop on (0.6 / 0.9 / 1.2 m), and cover. None stands within 1.2 m of a column flat where a step link lands (§3.7). |
| **Pumice Race** ×5 | along S0 → S1 (a 14.13 m line at θ 109°); centres (−18.94, −12.46), (−20.70, −10.11), (−20.82, −7.13), (−22.54, −4.76), (−22.59, −1.86) | along × across: 2.4 × 2.6, 2.7 × 2.3, 2.5 × 2.8, 2.6 × 2.4, 2.43 × 2.6; offsets across the line +0.45, −0.45, +0.40, −0.45, +0.45 (the zig-zag); all turned to the line (engine yaw −19.0°) | **top = lava + 0.45**: 1.25 at HIGH; sunk at LOW | rider (stone, bare); depth 0.9 | The floating rocks: south head → five stones → north head, 0.25 m seams between stones and at both heads (each pair of facing ends is parallel), consecutive stones overlap by ≥ 1.4 m across the line. Colliders are boxes; the meshes are irregular pumice boulders (pitted, rounded, overhanging the box by ≤ 0.1 m, never short of it by more than 0.15 m at a walking edge) that tilt 2–4° and bob ±3 cm on the mesh only. ≥ 2.58 m of open lava between any stone and the shelf, ≥ 4.7 m to the island and to Organ L. |

**The Bazookarp-only piece (Alpha's; `onlyIn: 'bazookarp'`):**

| piece | where | size | top | flags | purpose |
|---|---|---|---|---|---|
| Ladle Gantry | x 8…11, z −21.5…−9.4 (Lakefront east to the island's SE shoulder, over the Casting Floor) | 3 × 12.1 | 1.2 | sides to −1.1; works-green iron, chain rails `rail` on both sides except its two ends | The second route to the weir at HIGH, when the Casting Floor is under lava (§4.4). At LOW it is a 1.2 m step across the Casting Floor. Built into the `caldera.bazookarp` world and lightmap only. |

**Edges: the outer edge of every walkable floor** (Alpha's half; Bravo's are the turn). Every edge is a caldera-wall
piece (basalt, `roof`, at least 1.0 m thick, laid outside the line, its top at least 3.0 m above the floor it bounds),
except the two lips. **No open drop anywhere except over the lip fences**, and those falls report `lava` (§3.5).

| # | edge (polyline) | what stands there | top |
|---|---|---|---|
| E1 | the gallery's back z −69 and the side yards' backs z −66 (x ±10…±16) | the Casting Hall and its wings | 12 / 8 |
| E2 | (−16, −66) (−16, −60.5) (−20.5, −58) (−24, −54) (−27.5, −47) (−27.5, −44) (−31.5, −41) (−34, −35.5) (−32.01, −30.91) (−32.74, −24.67) (−30.70, −18.81) | caldera wall, 1.5 m thick (the yard's west side and the Rim Head's outer edge) | 7.0 |
| E3 | the Slump: the arc r 31.5 from θ −145.5 to −176.5, then P(31.5, −176.5) → P(30.5, 178) | the cliff, 1.5 m thick, rising into the backdrop's cliff; in the lava region | 7.0 |
| E4 | the Ridge's outer edge P(30.5, 178) (−30.48, 1.06) → P(31, 172) → P(30, 166) → P(28.2, 161) → P(26, 158), then the horn's outer edge P(26, 157.5) → P(28, 156) → P(29.5, 153) → P(30.5, 149) → P(31, 144.5) → `ch(-S_LIP, -HW)` (−26.84, 21.59) | caldera wall, 1.2 m thick | 6.6 on the Ridge, 5.4 on the horn |
| E5 | Bravo's Spillway lip, `ch(-S_LIP, ±HW)` (Bravo's piece: the turn of E6) | lip fence (rail 1.0); beyond it the chute (out of play, `falls`: lava) | — |
| E6 | Alpha's Spillway lip, from `ch(S_LIP, -HW)` (18.66, −28.95) to `ch(S_LIP, HW)` (26.84, −21.59) | lip fence (rail 1.0); beyond it the chute | — |
| E7 | the quay's outer end, (18.66, −28.95) → P(39, −63) (17.71, −34.75) | the charging shed (lean-to, coke bunkers) | 7.5 |
| E8 | the yard's east side, P(39, −63) → (18, −40) → (18, −47) → (17.5, −54) → (16, −60) → (16, −66) | caldera wall, 1.5 m thick; the jib crane's mast stands on it at (16, −56.5) | 7.0 |

`cover-map.js` counts these walls as cover (they are level blocks), so the paper cover numbers (§2.8) include them.
The lip fences and the bridge girders are railings and do not count.

### 2.4 Heights, natural ground, stairs, walls

- **Tier steps** are 1.2 m (bots hop them; kids climb 1.8 m) or 0.6 m (the Pour Floor, the Moorings, the pit, the casting
  bed). Organ steps are 1.15 m at HIGH and 0.2 / 0.4 / 0.5 m at LOW.
- **Natural volcanic ground** (raw basalt, not paving) on the Rim Head, the Rim Ridge, the Ladle Road and the horn tip:
  two spatter cones and a hummock (0.6–0.9 m, slopes ≤ 24°, walkable), five outcrops and four cairns (cover, roof), two
  scree ramps in place of the Ridge's straight face, hornitos on the Slump shelf and the Spillway floor, and the
  columnar basalt pavement with three stumps round each Organ cluster. The paved works keep their tiers (the yard, the
  terrace, the Lakefronts), each with one ground feature: the sunken weighbridge pit (yard) and the raised casting bed
  (terrace).
- **Deliberate walls** (over 1.8 m from below): the shelf → Ridge and → Rim Head faces (3.6: no way up), the channel's
  quay and horn faces past the Horn Step (2.4), the Rim Head → Lakefront face (2.4), the terrace front behind the
  parapet (1.2 + 0.9), the yard front (1.2 + rail; squids pass the rail), the bastion (1.2 + parapet), every building,
  the caldera wall (E1–E8).
- **Stairs and ramps:** every 1.2 m stair is 2.7 m long (23.96°) except the Office Stair (2.9 m, 22.5°); the scree ramps
  3.0 m (21.8°); the West Bridge 7.25 m for 1.2 m (9.4°); the pit's ramps 2.4 m for 0.6 m (14°). All ≤ 24°. There are
  no 2.4 m stairs on this stage.
- **Swimming:** any inked wall can be swum. Organ L's sides take ink (humans swim up it; bots use the step links).

### 2.5 Lanes and flanks (from Alpha's spawn; Bravo's are identical by the 180° turn)

| route | state | path | spawn → the island (paper, bot moves) | meets mid at |
|---|---|---|---|---|
| **Centre** | always | Gallery Stair → yard → Upper Surge Steps (or the hop face) → terrace → Lower Surge Steps → Lakefront → causeway | **66.8 m / 5.66 s** to the centre; straight line 64.5 m | the island's S face, then the Pour Floor |
| **Casting Floor** (centre swap) | LOW only | Lakefront → drop onto the Casting Floor → hop onto the SE shoulder | 62.6 m to the shoulder | the SE shoulder (it is 4–11 m beside the causeway: a second approach to the centre, **not counted as a flank**) |
| **Right: own rim over the Slump** | always, in two forms | yard / terrace west → Lakefront → south Slump head → **LOW: the shelf at the cliff's foot; HIGH: the Pumice Race** → north head → Ladle Road → West Bridge | **LOW 96.6 m / 8.19 s; HIGH 89.1 m / 7.55 s** to the W face | the W face (north half); the shelf and the Race run 15–27 m west of the causeway; or on to the horn tip and Bravo's Spillway |
| **Left: the enemy horn** | always | terrace east → Spillway Quay → Spillway Bridge → Bravo's horn tip → Bravo's rim north → Bravo's East Bridge | **78.6 m / 6.66 s** to the E face | the E face (south half) |
| **Left low: the Spillway floor** | LOW only | Lakefront east → drop into the channel → Horn Step → Bravo's horn tip (66.8 m; via the bridge 59.9 m), or out of the channel's mouth onto the Casting Floor | — (a second line into the same flank) | the SE shoulder or the E face |

**Counted honestly:** each side has **2 flanks at HIGH** (the own rim over the Race; the enemy horn by the bridge) and
**3 at LOW** (the own rim over the shelf; the enemy horn by the bridge; the Spillway floor), meeting mid at the W face,
the E face and the SE shoulder (rule 33: 2–4 per side in each state ✓). The centre has a LOW-only swap
(the Casting Floor) that is not counted. **What the lava does to the flanks:** the Spillway's low road and the Casting
Floor close at every surge; the own-rim flank closes as a shelf and reopens as the Race in the same bay, exposed,
narrow and overlooked by the owner's lookout. The right flank is the long one (22–30 m longer than the centre), the
left 12 m longer. The own-rim flank carries on past mid to the horn tip over the enemy's Spillway; the enemy-horn flank
carries on through the enemy's Slump into the enemy's base. That is the pinwheel: **each team always fights on both
rims, and on each rim it meets the other team's breach**.

**The island's ways on:** at HIGH 4 (2 causeways 8 m wide, 2 bridges 4 m wide); at LOW 6 (plus the two Casting Floors
along their whole edge, about 14 m each). Nothing onto mid is narrower than 4 m.

### 2.6 Mid: Gauge Island

- **Floor:** 556 m² at 1.2 round the 100 m² Pour Floor (1.8) under the Surge Gauge's four piers.
- **High ground:** at LOW each Organ cluster is a 1.4 / 1.8 / 2.3 m stair of columns, with the pavement stumps round it
  (1.8 / 2.1 / 2.4); at HIGH it is a stair of three 1.15 m hops (2.35 / 3.5 / 4.65) to a 16 m² lookout 3.45 m over the
  island and 2.85 m over the zone, standing in the lake. Alpha's cluster is at the island's SSW beside Alpha's causeway,
  overlooking Alpha's Lakefront, Moorings and Slump; Bravo's at the NNE, the turn.
- **Cover:** the piers (in the zone), ingot stacks at both causeway landings (±2.8, ∓9.0), a stilling-well drum (7.5,
  −6.4) 2 × 1.6 and a ladle stand (11.2, 0.6) 1.6 × 2.0 in the east (and their turns), the stumps, the Organs.
- **Sightlines:** the spawn-to-spawn axis is cut by the tie girders (6.0–7.0 m) and the solid gauge above; fire crosses
  the moat freely between the island and the shores (8–11 m) and between the rims (40–55 m: the rims are rough rock with
  cover every 5–8 m).

### 2.7 Spawn depth and the base

Spawn gallery (4.8) → yard (3.6, 18.5 m deep at the centre) → terrace (2.4, 9 m) → Lakefront (1.2, 7 m): 41.5 m of works
between the pad and the lake. Three exits off the gallery (8 m front stair, two 3 m side stairs), four ways from the
yard down to the terrace (Upper Surge Steps + its hop face, the tower's gap, the Cupola Stair, the Rim Head's Office
Stair and its hop face), four from the terrace to the Lakefront (Lower Surge Steps, East Steps, the hop faces at θ
−79.5…−89.4 and onto the Moorings). Attackers off the lake meet the parapet and the bastion; at LOW they can also come
up out of the Spillway (hops) and along the Slump shelf; at HIGH over the Race.

### 2.8 Cover (paper, `cover-map.js` rules, caldera walls included)

| | floor within 5 m of cover | largest open circle | where it is |
|---|---|---|---|
| LOW | **97.8 %** | 6.75 m | the barrier circle round each pad |
| HIGH | **97.6 %** | 6.75 m | same |
| Halyard after the stretch (for reference) | 96.4 % | 17 m | the houseboat roof |

Outside the pads no open circle exceeds 6 m except on the bridge decks (railed, exposed by design). The builder
re-measures with the real tool at `LAVA=low` and `LAVA=high`; both must be ≥ Halyard's.

### 2.9 What the builder looks at before detailing

Checkpoint A (§6.1) adds the comparison the advocate asked for: top shots of the blockout at LOW and HIGH placed beside
Craters', Halyard's and Spirhalite's, sent to the lead before any detailing. The question is "is this a crescent
pinwheel round a lake, unlike those three?". If it reads as a ring, the levers are (in order) a deeper Slump bite (cliff
at r 30), a narrower enemy horn (outer edge r 27), and pulling the yard's east side in to x 16.

---

## 3. The gimmick: the Bellows' breath

### 3.1 The rules

1. **Two levels.** LOW −0.6 (molten lava 0.6 m under the ledges and 1.8 m under the quays, all match), HIGH +0.8 (the
   high mark). One horizontal surface over the whole lava region (§3.2): the lake round the island, both Spillways and
   both Slump bays. The region lies **0.5 m inside every bank** that bounds it, so every shore wall, island face and
   cliff face is wholly inside it (the rind and the burn are defined on the whole face; that 0.5 m strip is bank above
   HIGH + 0.3 and never drowns).
2. **What drowns:** every floor at 0 inside the region: the two Slump shelves, the two Spillways, the two Casting
   Floors: about 575 m², about 10 % of the floor. **Nothing at 1.2 or above ever drowns.** A player learns one rule:
   *glazed, darkened ground below the white rind floods; dry pale stone never does.*
3. **Touching lava splats you**, exactly as the sea does: feet below L + 0.15 inside the region, cause `lava`, the
   attacker credited if they hit you in the last 4 s. Kid, squid, mid-special or carrier: the same. No grace hop. A fall
   over a Spillway lip into the chute is `lava` too.
4. **Moves:** 10 s each, smoothstep (peak 0.21 m/s). A 10 s warning comes before every move.
5. **The Pumice Race (floating rocks):** five stones per Slump whose top is the lava + 0.45 m while they are up. A
   stone's top, relative to the lava, runs linearly between −0.45 and +0.45 over 2.4 s, timed so that it crosses +0.15
   (the kill height, the moment it becomes solid) **exactly as the shelf beside it becomes deadly** on a rise, and
   **exactly as the shelf becomes dry** on a fall. So the bay always offers one crossing, the shelf or the stones: never
   both, never neither.
6. **The Organ Pipes (rising lookouts):** their tops are linear in the lava level (A 1.4 → 2.35, B 1.8 → 3.5, L 2.3 →
   4.65). They carry whoever stands on them. At every pose each is one hop (≤ 1.15 m) above the next.
7. **The lava never stops a mode**, except Boss Battle (held at LOW, §4.5). Every match ends at LOW (§3.3).

Key moments of a rise (s after the move starts; a fall is the mirror):

| t | L | what happens |
|---|---|---|
| −10 | −0.6 | the warning: bell, siren, beacons red, the rind glows, the HUD counts down |
| 0 | −0.6 | the rise starts; the Organs begin to climb, shedding rubble |
| 2.2 | −0.43 | the stones begin to surface in each Slump bay; the chains go taut |
| **3.8** | **−0.15** | **the ledges are deadly** (13.8 s after the warning began); **the stones are solid** (top 0.0, rising to lava + 0.45 by 4.6 s) |
| 4.5 | 0.0 | the ledges are awash; both Spillways pour over their lips |
| 4.6 | 0.01 | the stones reach lava + 0.45 |
| 7.0 | 0.5 | the stones are within 0.3 m of their HIGH pose: bots may path over them |
| 10 | 0.8 | HIGH: stones at 1.25, Organs locked, needle at HIGH MARK |
| fall 3.0 | 0.5 | bots stop planning over the stones |
| fall 5.4 | 0.01 | the stones begin to sink |
| fall **6.2** | −0.15 | **the shelves are dry and the stones are deadly** (16.2 s after the fall warning began) |
| fall 7.8 | −0.43 | the stones are parked |

### 3.2 The data (engine format, real positions)

`src/world/stages/caldera/layout.js` (plain data and the helpers of §2.3; importable in Node). Alpha's half;
`mirror: true` gives every rider, gauge, cascade, vent, fall and bay its 180° twin.

```js
// the lake: one self-symmetric outline (0.5 m into every bank), then the two bays of each half
const LAKE_HALF = [
  ...arc(23.5, -90, -62.6), ch(Math.sqrt(23.5 ** 2 - 6 ** 2), -6), ch(S_MOUTH, 0),       // Alpha's Lakefront, the mouth
  ...[P(22.1, 148), P(21.5, 150), ...arc(21.5, 152.5, 177.5),                              // Bravo's horn and Ladle Road
      sp(S1, 0.5, FACE), sp(S1, 0.5, -FACE),                                               // across Bravo's Slump mouth,
      sp(S0, -0.5, -FACE), sp(S0, -0.5, FACE),                                             //   0.5 m into both heads
      ...arc(23.5, -137, -92.5)].map(rot),                                                 // Bravo's Lakefront
];
const LAKE = [...LAKE_HALF, ...LAKE_HALF.map(rot)];                                        // 96 vertices
const SPILL = [ch(S_MOUTH - 1.5, -6), ch(S_LIP, -6), ch(S_LIP, 6), ch(S_MOUTH - 1.5, 6)];  // Alpha's Spillway, 0.5 m into its sides
const SLUMP = [sp(S0, -0.5, FACE), sp(S0, -0.5, -FACE), P(32, -144.4), ...arc(32, -147, -175),
               P(32, -177.6), sp(S1, 0.5, -FACE), sp(S1, 0.5, FACE)];                        // Alpha's Slump bay, to the cliff + 0.5
const CHUTE = [ch(S_LIP, -6), ch(S_LIP + 12, -7), ch(S_LIP + 12, 7), ch(S_LIP, 6)];         // beyond Alpha's lip (falls only)
const STONES = [   // [cx, cz, across, along, offset]  (offset is already in the centre; kept for the record)
  [-18.94, -12.46, 2.6, 2.4], [-20.70, -10.11, 2.3, 2.7], [-20.82, -7.13, 2.8, 2.5],
  [-22.54, -4.76, 2.4, 2.6], [-22.59, -1.86, 2.6, 2.43]];

export const LAVA = {
  low: -0.6,
  high: 0.8,                                     // the high mark: the stain line (rind) at 0.8 on every face in the region
  region: { polys: [LAKE], half: [SPILL, SLUMP] }, // union; the set is 180°-symmetric
  falls: { half: [CHUTE] },                      // a fall below the death plane here reports cause 'lava' (ENGINE H3)
  timing: { warn: 10, rise: 10, fall: 10, ease: 'smooth' },
  schedule: {
    'turf:180': { moves: [35, 70, 110, 140] },   // rise, fall, rise, fall
    'turf:90':  { moves: [30, 55] },
    zones:      { loop: { first: 35, high: 35, low: 35 }, overtime: 'hold' },
    tower: 'zones', bazookarp: 'zones',
    practice:   { loop: { first: 20, high: 35, low: 35 } },   // looked up by m.practice (ENGINE H24)
    attract:    { loop: { first: 8, high: 15, low: 15 } },    // looked up by m.attract
    boss: 'low',
  },
  mirror: true,
  riders: [
    // the Pumice Race: sink stones; top = L + 0.45 while up; solid while top ≥ L + 0.15; surface / sink timed to the shelf
    ...STONES.map(([x, z, w, d], i) => ({ id: 'race' + (i + 1), kind: 'stone', pos: [x, z], size: [w, d], yaw: -19.0,
      top: [-0.15, 1.25], depth: 0.9, sink: { at: -0.15, ease: 2.4, rel: [-0.45, 0.45] },
      look: { type: 'caldera_pumice', variant: i, chain: [-21.2, -19.6] } })),
    // the Organ Pipes (Alpha's cluster, SSW): hexagonal basalt columns, corners on ±x, in a line along z
    { id: 'organL', kind: 'float', shape: 'hex', pos: [-10, -12.80], r: 2.5, top: [2.3, 4.65], depth: 4.2, ink: 'all',
      inLake: true, parts: [{ x: 0, z: -1.4, w: 1.2, d: 1.2, y0: 0, y1: 0.7, ink: false }],   // the stub on its lake side
      look: { type: 'caldera_organ', role: 'lookout' } },
    { id: 'organB', kind: 'float', shape: 'hex', pos: [-10, -9.14], r: 1.5, top: [1.8, 3.5], depth: 3.7, ink: 'deck',
      look: { type: 'caldera_organ' } },
    { id: 'organA', kind: 'float', shape: 'hex', pos: [-10, -6.34], r: 1.5, top: [1.4, 2.35], depth: 3.3, ink: 'deck',
      look: { type: 'caldera_organ' } },
  ],
  steps: [   // explicit nav links across every rider seam (ENGINE §4.3): [from, to]; a point is static floor nearest it
    [[-10, -4.45], 'organA'], ['organA', 'organB'], ['organB', 'organL'],
    [[-18.74, -14.40], 'race1'], ['race1', 'race2'], ['race2', 'race3'], ['race3', 'race4'], ['race4', 'race5'],
    ['race5', [-23.64, -0.19]],
  ],
  gauges: [
    { kind: 'bar', pos: [0, 8.0, -2.5], yaw: Math.PI, h: 7.0, single: true },    // the Surge Gauge's south board (to Alpha)
    { kind: 'bar', pos: [0, 8.0, 2.5], yaw: 0, h: 7.0, single: true },           //   and its north board (to Bravo)
    { kind: 'bar', pos: [-19.5, 6.2, -53.6], yaw: Math.PI, h: 1.8 },             // the Surge Board on the Surge Office (twin)
  ],
  cascades: [{ lip: [[18.81, -28.81], [26.69, -21.72]], y: 0.0, drop: 14 }],      // Alpha's Spillway lip (twin: Bravo's)
  vents: [[-9.5, -0.6, -18.5], [17.0, -0.6, -5.0], [10.0, 0, -15.0], [23.27, 0, -22.11]],   // pools and floor drains (8 with twins)
  flotsam: { count: 48, size: [0.3, 0.9], keepOff: 1.0 },  // cosmetic pumice drifting on the open lava, no collider
  look: { crust: 'ember', cone: [230, 0, 150] },           // warm charcoal-maroon crust, lit seams (§5.3); the Bellows Vent
  text: {
    warnRise: ['LAVA RISING', 'Off the low ground: {n}'],
    rise:     ['SURGE!', 'The Pumice Race is coming up'],
    high:     ['HIGH MARK', 'Race up · Organ Pipes up'],
    warnFall: ['LAVA FALLING', 'The stones sink in {n}'],
    low:      ['EBB', 'Slump shelf, Spillway and casting floor open'],
    hold:     ['LAVA HOLDS', ''],
  },
};
// in LAYOUT: lava: LAVA, env: { …, sea: false, edge: 'none', boats: false, bay: false } (§5.6)
```

Rider parts: each hexagon is three turned boxes (r × √3·r at yaw 0°, 60°, 120°; L 2.5 × 4.33, A and B 1.5 × 2.60), L
carries its stub: 10 parts per cluster, 20 for both; the stones 10. **30 rider parts** (engine cap 40).

The `steps` end points that are not riders are on the island's socket collar just north of A's north flat (−10, −4.45),
on the south head 0.45 m behind its tip face (`sp(S0, -0.45, 0)` = (−18.74, −14.40)) and on the north head 0.45 m behind
its tip face (`sp(S1, 0.45, 0)` = (−23.64, −0.19)). Each names the static node nearest to it.

### 3.3 The schedule in each mode

Unchanged in its times from revision 1. Every schedule ends at LOW, never moves in the opening 30 s, never moves in the
last 12 s of regulation, and holds in overtime. Clock = time left. Ledge times below use the LOW −0.6 moments of §3.1.

**Turf War 3:00** (`moves: [35, 70, 110, 140]`): two surges, the second landing on the final-minute music.

| clock | t | state |
|---|---|---|
| 3:00 – 2:25 | 0 – 35 | LOW: the opening rush on the whole stage. Warning at 2:35. |
| 2:25 – 2:15 | 35 – 45 | rise (shelves deadly, Race solid at 2:21.2) |
| 2:15 – 1:50 | 45 – 70 | **HIGH 1** (25 s). Fall warning at 2:00. |
| 1:50 – 1:40 | 70 – 80 | fall (shelves dry, Race deadly at 1:43.8) |
| 1:40 – 1:10 | 80 – 110 | LOW (30 s). Warning at 1:20. |
| 1:10 – 1:00 | 110 – 120 | rise: **HIGH arrives at exactly 1:00, on the final-minute music** |
| 1:00 – 0:40 | 120 – 140 | **HIGH 2** (20 s). Fall warning at 0:50. |
| 0:40 – 0:30 | 140 – 150 | fall |
| 0:30 – 0:00 | 150 – 180 | **the final ebb**: 30 s of LOW, the burned ledges bare: the ledge scramble |

**Turf War 1:30** (`moves: [30, 55]`): LOW to 1:00 (warning at 1:10), rise to 0:50, HIGH to 0:35, fall to 0:25,
**final LOW 25 s**.

**Zone Control, Tower Command, Bazookarp 5:00 + overtime** (`loop: { first: 35, high: 35, low: 35 }`, period 90 s):

| | rise | HIGH | fall | LOW |
|---|---|---|---|---|
| warning at | 4:35 / 3:05 / 1:35 | | 3:50 / 2:20 / 0:50 | |
| surge 1 | 4:25 – 4:15 | 4:15 – 3:40 | 3:40 – 3:30 | 3:30 – 2:55 |
| surge 2 | 2:55 – 2:45 | 2:45 – 2:10 | 2:10 – 2:00 | 2:00 – 1:25 |
| surge 3 | 1:25 – 1:15 | 1:15 – 0:40 | 0:40 – 0:30 | **0:30 – 0:00, and all of overtime** |

Over 5:00: 135 s at LOW, 105 s at HIGH, 60 s moving. A fourth rise would fall at 305 s (its warning at 295 s, inside
the last 12 s): never scheduled.

**Practice** loops `first 20, high 35, low 35`; **the menu backdrop** loops `8 / 15 / 15`. Both are found by
`lavaSchedule` through the match's `practice` / `attract` flags (match.js sets the mode string to `'turf'` for both, so
the mode key alone would hand them Turf War's timetable). Both are exempt from check-maps rule 3 (they are not matches).
**Boss Battle:** held LOW (§4.5).

### 3.4 How it is announced (rising and falling are opposites in every channel)

| channel | warn-rise (10 s) | rise | HIGH | warn-fall (10 s) | fall | LOW |
|---|---|---|---|---|---|---|
| **The Surge Gauge** (both boards) | beacons flash red | the needle climbs 7 m (5× the lava's own move) | needle in the HIGH MARK band, beacons steady red | beacons flash white | the needle sinks | needle on EBB, beacons off |
| **Sound** (`sfx-lava.js`) | the **Surge Bell**: 3 slow tolls then fast; `lava_rumble` swells; `lava_tick` at 3-2-1 | the **siren winds UP** in pitch over 10 s; `lava_erupt`; the Race's chains clank taut, `lava_pop` per stone; the Organs grind | the spillways roar, crackle | **two short steam-whistle blasts** | the **siren winds DOWN**; `lava_hiss`, `lava_drain` | one long low all-clear whistle |
| **HUD gauge chip** (under the timer) | `▲ SURGE 9…1`, pulsing | `RISING ▲`, the fill climbs | `HIGH · falls 0:24` | `▼ EBB 9…1` | `FALLING ▼`, the fill drops | `LOW · surge 0:31` |
| **Callout banner** | `LAVA RISING` / `Off the low ground: 10` | `SURGE!` (small) | `HIGH MARK` / `Race up · Organ Pipes up` (small) | `LAVA FALLING` / `The stones sink in 16` | — | `EBB` / `Slump shelf, Spillway and casting floor open` (small) |
| **Your own line** (bottom centre) | on a ledge: `GET OFF THE LOW GROUND → 6 m` (arrow to the nearest way up) | same until you are off | — | on a stone: `THE STONES ARE SINKING → 4 m` | same until you are off | — |
| **Minimap / TAB map** | ledges hatched dull red, pulsing | the lava fill spreads over them | ledges solid lava; stones as dark tiles; Organs as hexes with ▲ | stones blink | the fill shrinks | hatching fades |
| **The world** | the rind glows dull red on every face ("this is how high it comes"); the drains and hornitos spit sparks and smoke; the lake churns | a bright seething front climbs the walls; embers stream **up**; the Organs grind up shedding rubble and dust plumes, the lookout's stub cracks off rock chips; stones bob up chained in a zig-zag; the drifting pumice lifts | lavafalls pour off both lips; red under-light | the stones crack and glow; steam starts | the lake crusts over in dark plates; white steam billows **down** off every surface it leaves; the pig beds glow and cool | quiet: crust with lit seams, wisps of steam |
| **Backdrop** | — | the Bellows Vent puffs an ash burst; camera shake 0.25 (settings permitting) | plume lit red from below | — | the plume pales | — |

Colour is never the only signal: the arrows, the words, the pitch direction and the direction of motion all agree.

### 3.5 Fairness rules

- **Notice:** ≥ 13.8 s from the first warning sound to any ledge being deadly; ≥ 16.2 s from the fall warning to the
  stones being deadly. The schedule is fixed, on the HUD all match, and identical in every match of a mode.
- **Ways out:** every point of every ledge is ≤ **10.0 m** of walking from floor that never drowns (paper: the Casting
  Floor 8.1 m, the Spillway 10.0 m, the Slump shelf 9.9 m; engine rule 14 allows 12). The shelf has a 1.2 m hop at
  each end (the two heads); the Spillway has 1.2 m hops onto the Lakefront (s 22.3…29.5) and the Horn Step (s 22.3…27)
  and its open mouth onto the Casting Floor; the Casting Floor is a 1.2 m hop onto the island, the causeway or the
  Lakefront along its whole edge. **No ledge has a dead end.**
- **Nothing appears inside a player:** the stones rise from under the lava, where nobody can be alive, and become solid
  only at the kill height (anyone airborne over one lands on it). The Organs only move vertically inside their notch
  (0.15 m) and carry their riders; nothing is ever above them (clear sky, the nearest static piece ≥ 3.7 m away).
- **Nothing pinches:** every gap beside a rider is a ≤ 0.3 m seam (stones 0.25, columns 0.20 and 0.15) or ≥ 2.5 m of
  open lava. No leap gaps.
- **No unplanned jumps:** the narrowest level gap between two floors across lava is 4.5 m (the south head's tip to the
  island's SW corner); everything narrower is a seam. The dash-reach audit (§6.2) checks hop + air dash at both levels.
- **Symmetric:** one lake, a 180° layout, both sides change at the same instant.
- **Objectives never drown:** the Pour Floor (1.8), both Moorings (1.8), the whole tower track (≥ 1.2), the Pond, weir
  and Gates (≥ 1.2), the Ladle Gantry (1.2), every spawn (≥ 30 m from the region).
- **Calm finish:** every match ends on LOW (Turf War ≥ 25 s of it), overtime holds LOW, nothing moves in the last 12 s.
- **Super jumps** onto ground that will be lava (or a stone that will be gone) at landing are redirected to the nearest
  dry node (engine `safeLanding`).
- **No fall reports the sea.** Every edge is a wall except the two lips; a fall over a lip lands in the `falls` polygon
  and reports `lava`, with the lava's card and flood.

### 3.6 Ink, turf, players, devices

- **Ink burns:** as the surface passes a floor or wall cell on its way up, the cell's ink is erased with a hiss and a
  puff of steam in that ink's colour. Nothing can be inked under the lava. A fall reveals bare glazed floor.
- **Turf:** cells under the lava count for nobody. The final count is always at LOW. Re-inking the bare ledges after a
  fall charges specials as usual. Organ decks take ink (swim, refill, hide) but are never turf (like the tower's deck);
  stones are never inked.
- **Players:** the sea's rule (above). Riders carry players and squids (the actor's ground stick). A player still on a
  stone when the shelves dry is at the kill height at that instant and splats; the warning and their own line said so
  for 16 s.
- **Devices** (sprinkler, beacon, Drip Curtain, Surf N' Turf buoy, Lurk Mine, Skitter Bomb, batch 5's Scrap Sentry and
  Chain Bobbers): the owner's screen calls the shared destroyer `G.deploy.crushIn({ where: (p) => lava.under(p, -0.05) },
  'lava')` at 4 Hz while the lava rises (no blast, no ink, a sizzle); on an Organ they ride it; on a stone they are
  crushed when it sinks. A Chain Bobber floats 1.0 m over the lava through `G.level.liquidY` (ENGINE H23). Thrown subs,
  bombs and shots that reach the surface fizzle with no paint and no blast; the Glide Bomb sinks with a hiss.
- **Specials:** a special that ends over the lake drops you in it, as over the sea. Tempest rain over lava paints
  nothing below the surface.

### 3.7 Bots

What every bot knows is what the HUD shows: the schedule and the clock (no wall-hacks). From the engine:
- **Avoid:** from each warning, ledge nodes the lava reaches within 8 s are blocked as goals and cost +60 to enter; A*
  refuses a route that would cross a ledge after it drowns at the bot's arrival time (1/7 s per metre).
- **Escape:** a bot whose node shuts within `escD / 5 + 2.5` s walks the precomputed exit route, still shooting. Target:
  20 of 20 bots off a drowning ledge in time (`lava-bots.js`).
- **The Race:** stone nodes exist only at the HIGH pose and are open only within 0.3 m of it (L ≥ 0.5: from 7.0 s into a
  rise to 3.0 s into a fall); the explicit `steps` links join the heads and the stones whatever the nav grid's offset;
  rider nodes pay no "near water" cost. Bots never plan onto a stone that will be gone when they arrive, and step off
  one whose window closes within 4 s.
- **The Organs:** nodes at both poses; the `steps` links give island → A → B → L jump edges (1.15 m) at HIGH and walk
  edges at LOW, so the climb exists for any grid offset (ENGINE §4.3). Chargers, bows and splatlings value height
  (`_pickPaintGoal`), so they take the lookouts at HIGH.
- **Modes:** Zone Control defence plans use the live approaches; Bazookarp carriers use `floodsIn` and never start
  across a ledge they would not leave 3 s before it drowns; tower escorts are told which approaches are live.
- **Targets (Mac mini):** ≤ 0.25 lava splats per bot per 3:00; stuck ≤ the stage average with no episode > 10 s; the
  Slumps crossed (shelf or Race) ≥ 4 times per match together; an Organ lookout used by a long-range bot ≥ once per
  match.

---

## 4. Every mode

### 4.1 Turf War

The whole stage on the 3:00 / 1:30 schedules. The ledges (about 10 % of the floor) are the swing turf: cheap to ink,
burned twice in a 3:00 match. The first surge lands in the first fight for mid, the second on the music cue, and the
match ends on the 30 s ledge scramble. Neither Organ decks nor stones count.

### 4.2 Zone Control

```js
zones: {
  center: [{ poly: [[-5, -5], [5, -5], [5, 5], [-5, 5]], y0: 1.7, y1: 2.0 }],       // the Pour Floor: 94 m² net of the piers
  side: { poly: [[-6.50, -22.69], [-9.22, -21.72], [-11.80, -20.44], [-14.20, -18.85], [-16.39, -16.98],
                 [-21.67, -22.44], [-17.93, -24.68], [-17.63, -24.27], [-13.15, -26.96], [-8.27, -28.84]],
          y0: 1.7, y1: 2.0 },                                                        // Alpha's Pumice Moorings: 87 m² (Bravo's turned)
},
```
(The side polygon is the Moorings' outline reduced to 10 points, within 0.12 m of it; the zone is the Moorings' top.)
- **Centre (the Pour Floor):** flat iron plates 0.6 m above the island, the four piers inside as cover; on from all four
  sides by a hop. High ground over it: both Organ lookouts at HIGH (2.85 m above, 9–10 m away), the bridges' roots. At
  LOW the island is open from below (the Casting Floors) and the zone is easier to reach; at HIGH the lookouts make it
  harder to hold. Never drowns (1.7 ≥ HIGH + 0.3).
- **Side (the Pumice Moorings):** 26.5 m from the centre, 44 m from its own pad (the Long Stages rule: side zones near
  mid). Ways in: the Lakefront east (0.6 step), the quay edge north, the south head west, the terrace south (0.6 drop):
  four. Cover: capstan, chain bollard, stone crate, the winch house beside it. Attacked from the terrace and the bastion
  (0.6 / 1.8 above), from the Rim Head (1.8 above), and from Alpha's own lookout at HIGH (2.85 above). **At LOW the
  enemy comes along the Slump shelf; at HIGH over the Race**: the side zone sits at the end of the flank the lava swaps.
- The rotation is independent of the lava; both teams meet the same states. The final 30 s and overtime are LOW.

### 4.3 Tower Command

**"The tower rides the ladle rail"**: flush rails in the floor from the Pour Floor down the causeway, a jog along the
Lakefront, up onto the terrace, west along it, up into the yard, east across it and down to the end-stop by the
gallery. **Three checkpoints**, so not the two-checkpoint doubling rule: the engine keeps 100 s to the goal (60 track
points at 1 point per second plus 40 at the checkpoints).

`TOWER_DEFS.caldera` (Alpha's attack, drawn on Bravo's half; Bravo's is the turn):
```js
caldera: {
  path: [[0, 1.8, 0], [0, 25.5], [-3.5, 25.5], [-3.5, 34], [13, 34], [13, 43], [-8, 43], [-8, 52]],
  checkpoints: [[0, 22.5], [8, 34], [4, 43]],
},
```

| # | from → to (Bravo's half) | length | floor | note |
|---|---|---|---|---|
| 1 | (0, 0) → (0, 25.5) | 25.5 | 1.8 → 1.2 | drop 0.6 off the Pour Floor's edge at z 5, between the piers (7.2 m clear); the island; Bravo's causeway (a bridge over lava at HIGH); onto Bravo's Lakefront. **CP1 at (0, 22.5)**: 22.5 m, 24 %: the causeway foot |
| 2 | → (−3.5, 25.5) | 3.5 | 1.2 | the jog along the Lakefront |
| 3 | → (−3.5, 34) | 8.5 | 1.2 → 2.4 | **climb** the plain 1.2 m terrace face at z 29.8 (parapet gap θ 93…100.5 on Bravo's side, the turn of θ −87…−79.5) |
| 4 | → (13, 34) | 16.5 | 2.4 | along the terrace's ladle rail. **CP2 at (8, 34)**: 49.0 m, 53 % |
| 5 | → (13, 43) | 9 | 2.4 → 3.6 | **climb** the plain yard face at z 37.4 (rail gap θ 75…67.8 on Bravo's side). |
| 6 | → (−8, 43) | 21 | 3.6 | across the yard's front. **CP3 at (4, 43)**: 72.0 m, 77 % |
| 7 | → (−8, 52) | 9 | 3.6 | **goal (−8, 3.6, 52)**: 14.8 m short of Bravo's pad, outside the barrier, in full view of the gallery |

- **Length 93.0 m** (paper; `tower-len.js` decides): about 1.55 m/s with one rider.
- **Holes:** none (the whole 2.5 m platform is over floor ≥ 1.2 everywhere; the track never touches a ledge).
- **Headroom (3.72 m):** the tie girders are 4.2 m over the Pour Floor; nothing else passes over the track.
  **Clutter:** no prop within 0.5 m of the 2.5 m lane anywhere (paper check: none).
- **Riders:** the nearest Organ is 6.25 m from the swept lane (rule 27 needs 1.0).
- **The lava:** the causeway leg is a bridge over lava at HIGH (a rider knocked off drowns) and is flanked by the
  Casting Floor at LOW. CP1 sits where both teams meet it.

### 4.4 Bazookarp

`BAZOOKARP_DEFS.caldera` (Alpha's attack on Bravo's half; the engine mirrors it):
```js
caldera: {
  start: [0, 1.8, 0],                                  // the Pond on the Pour Floor, under the Surge Gauge
  weirs: [{ at: [0, 1.2, 24.5] }],                     // Bravo's Lakefront at the causeway foot (posts at x ±2.7)
  gate: { at: [-9, 3.6, 52] },                         // Bravo's yard, a level below the gallery
  freeZones: [{ poly: [[-10, 57.5], [10, 57.5], [10, 69], [-10, 69]], y0: 4.6, y1: 6.5,      // Bravo's gallery
                signs: [[0, 57.1, 0], [10.4, 63, 90], [-10.4, 63, -90]] }],               // front stair and both side stairs
  routes: {
    causeway:     [[0, 12], [0, 22], [0, 24.5], [2, 30], [5.4, 36.5], [-9, 52]],
    castingFloor: [[-6, 14], [-6, 20.5], [0, 24.5]],                          // LOW only
    gantry:       [[-9.5, 10], [-9.5, 21.5], [0, 24.5]],                      // the Ladle Gantry (bazookarp only)
    east:         [[0, 24.5], [-7.9, 27], [-12.8, 35.5], [-13.3, 40], [-9, 52]],   // East Steps → Cupola Stair
  },
},
```
The layout also carries the Ladle Gantry (`onlyIn: 'bazookarp'`, §2.3), so the mode has its own world and lightmap
(`caldera.bazookarp`, SPEC §4.2); Turf War, Zone Control and Tower Command build without it.

| requirement (SPEC §9.1) | Highmark Foundry (paper, carrier metres) |
|---|---|
| #1 L 55–85 m | **L 57.8 m**: 12.0 s walking (4.8 m/s), 6.1 s swimming (9.44 m/s); the same at LOW and HIGH (the main routes use no ledge and no stone) |
| #2 one weir at 40–55 % | progress 25.1 m: **43.4 %** (count 57) |
| #3 weir → Gate ≥ 45 % of L and ≥ 25 m | **32.7 m, 56.6 %** |
| #4 two routes to the weir and to the Gate, the second ≤ 1.6× | weir: causeway 25.1 m; second: **LOW** the Casting Floor 33.2 m (**1.32×**), **HIGH** the Ladle Gantry 35.7 m (**1.42×**). (Without the gantry the HIGH second route would be a flank, 65.5 m, 2.6×: that is why the gantry exists.) Gate: Lower + Upper Surge Steps 32.7 m; East Steps + Cupola Stair 36.1 m (**1.10×**); also the Rim Head and the Office Stair |
| #5 2–5 entrances into the Gate's 15 m ring, seen from the deck | about 3: the yard's open front-west arc (from the Upper Surge Steps, the hop face and the tower gap), the terrace arc by the Cupola Stair, the gallery's east side; all below and in front of the gallery. The checker decides. |
| #5 no hidden shortcut; no drop > 2.5 m into the ring; no unknown connection | the yard is railed except at its ways up; the only drops into the ring are the gallery's 1.2 m stairs (defenders'); no lava gap between 1.2 and 3.8 m anywhere near the base (the narrowest level gap is 4.5 m, §3.5) |
| #6 pad → Gate 12–20 m; ≥ 3 ways off the deck; an apron with ≥ 2 cover blocks ≥ 1.2 m tall within 4 m of route 1 | **15.4 m**, 35.8° off the pad → Pond line; three stairs; the covers stack (5.6, −56.2) and the manhole covers (2.0, −50.6) (both 1.3 m, `roof`, 3.0 m and 3.4 m from route 1), on Alpha's half (turned for Bravo's) |
| #8 Gate y ≤ pad y + 0.2, seen from the deck | 3.6 vs 4.8; open view from the gallery's front |
| #9 checkpoint room: no solid within 3.0 m (0.3–3.6 m above the weir floor), the posts at 2.7 m excepted | nearest solids: the Lower Surge Steps' rise above 1.5 m (3.5 m), the chain bin (5.0 m), the parapet line (5.5 m), the Tide Board (5.8 m), the lamp plinths (6.1 m) |
| #10 the Pond at the centre, 360°, room round it | the piers stand at (±4.2, ±1.75), off all eight checker directions: the shell's centre is seen from **8 of 8**; ring 4.5–10 m about 95 % floor |
| #7 no unreachable high ground | every high spot is walkable and reachable by both teams (Organs by hops, Gauge Posts, bastion, Rim Head, Rim Ridge); everything else is `roof`. The only Carp-Free Zone is each gallery |
| lava (SPEC §9.4, §5.5) | Pond 1.8, weir 1.2, Gates 3.6, free zone 4.8, the gantry 1.2: none on lava-reachable ground; no free zone on a lava-only route; lava is a fall judged by last footing; the field has two states switched at `lava:warn`, with `restMask(level)` from the engine (ENGINE §3.2) |

- **Expected carry:** unopposed 12.0 s Pond → Gate. Pond → weir 25.1 m (5.2 s walking; contested 15–25 s); weir → Gate
  32.7 m (6.8 s; against a defence 20–35 s). A first carry cannot knock out (the weir comes first), and a full push from
  the weir fits inside the 60 s fuse.
- **How the lava plays in it:** at HIGH the second way to the weir is the gantry under the enemy lookout; at LOW the
  Casting Floor, and the Spillway floor and the Slump shelf open flanks toward the Gate's west and east. The final 30 s
  and overtime are LOW: the team behind gets the most routes for its comeback.
- **If the checker reads L < 56 m**, rail the plain hop face beside the Upper Surge Steps (θ −90…−95 on each side): the
  carrier then walks to the stairs (+1.5 m). **Fallback weir** (if #9 or the count test flags it): (0, 1.2, 23.6), the
  causeway's very foot (≥ 4.5 m from every solid).

### 4.5 Boss Battle: yes

- Lava **held at LOW** (`schedule.boss: 'low'`): ledges dry, the Race sunk, the Organs at their LOW pose.
- `boss: { floorY: 1.2 }`. HULLBREAKER's home ground is the 1.2 tier: the island, both causeways, both Lakefronts and
  south heads: about 1,300 m² connected (the check needs ≥ 150). The ledges are 1.2 m below it (drops: it never walks
  them); the lake is void (a drop). Its charges stop on the piers, the ladle cars, the drums (stun windows).
- The engine adds the rider parts before `BossNav` builds (ENGINE H21), so the Organ columns are walls to it.
- Verify with a copy of `tools/botlab/jobs/stretch/boss-check.js`: home ground, roams > 50 m, never idle ≥ 12 s, moves
  played.

### 4.6 The gimmick per mode (summary)

| mode | lava | objective safety |
|---|---|---|
| Turf War | 2 surges (3:00) / 1 (1:30); ends with ≥ 25 s of LOW | drowned cells count for nobody; final count at LOW |
| Zone Control | 90 s loop, 3 surges, LOW for the last 30 s and overtime | both zones at 1.8 |
| Tower Command | same | the whole track at ≥ 1.2 |
| Bazookarp | same; the Carp Field switches state at `lava:warn` | Pond, weir, Gates, free zones, the gantry dry; lava = a fall |
| Boss Battle | held at LOW | the boss's tier never drowns |
| Practice / menu | endless loop (their own keys) | — |

---

## 5. The look

### 5.1 Architecture, piece by piece

The works were built to live with the lake: everything below the high mark is armoured basalt, everything above it is
iron painted **works green**, with whitewashed walls, verdigris roofs, buff firebrick and cream enamel. Outside the
works the caldera is raw: black and rust basalt, red scoria, glassy lava.

- **The Surge Gauge** (landmark, §1): basalt piers to 7 m with iron collars; tie girders at 6.0–7.0 m; a riveted
  works-green lattice (an A-frame across the piers to 12 m, then a square shaft to 17 m); gauge boards 2.4 m wide × 7 m
  (8–15 m) on the south and north faces painted `EBB · 1 · 2 · 3 · HIGH MARK` in cream enamel (an ash-white band at the
  top, never yellow), the 1.6 m float needle riding a slot; the clock house (17–18.5 m) with a dial each side; the bell
  cage (18.5–20.5 m) with the Surge Bell (it swings while it tolls), two siren trumpets, four beacons; a verdigris
  pyramid roof to 22 m and the ladle-pouring weathervane. At dusk the boards are backlit, the needle glows and a lantern
  burns under the bell. All of it is collision to 22 m (§2.3); the needle, bell, beacons and vane animate.
- **Gauge Island**: rough basalt sides with columnar joints (the rind at 0.8 all round), a top of tight hexagonal basalt
  pavement (flat to walk, cracked and uneven to the eye), the Pour Floor's cast-iron plates with the foundry mark in the
  middle, iron-bound socket collars round the Organ notches with the lava glowing in the seams. Bollards and chains along
  the faces are colliderless.
- **The Organ Pipes**: tight clusters of hexagonal basalt columns, rough-topped, with a lighter weathered band on the
  tops; no rind (they move: ENGINE §4.1); while they move they shed rubble and dust, and the lookout's lake face shows
  wet glossy heat-glaze near the lava. The static stumps round them are the same stone, shorter and cracked.
- **The causeways**: basalt roads with tuff paving, the ladle rail inlaid down the middle, four works-green lamp
  standards on plinths; the rind on their sides.
- **The Pumice Race**: pale grey, porous pumice boulders of five shapes, each chained through an iron ring to the
  winch house on the south head; at LOW only the chains show, running down into the lava from rings on the south head.
- **The Slump**: a raw cliff of columnar basalt above a glassy black shelf, old slag runs down the cliff, two hornitos
  smoking on the shelf, rope handholds at both heads, works signs nailed to the cliff.
- **The Casting Floor**: iron-grey glazed floor with flush rows of ingot moulds (the pig beds), floor drains with iron
  grates (decals that glow and spit sparks before a rise), mould stacks and ladle stands; a hanging chain hoist on a
  works-green gantry well above play (scenery, ≥ 6 m, never over the tower lane).
- **The Spillways**: a channel of black glassy ropy lava rock (the read of a lava channel even when dry: flow lines
  running out to the lip, a glossy glaze, hot seams that glow for 20 s after a fall), the lip a worn sill with a chain
  fence; the Spillway Bridges are works-green riveted girders on a basalt pier; cast plates `SPILLWAY E` / `SPILLWAY W`.
- **The rims**: raw basalt and red scoria; spatter cones with glowing throats (decor), cairns, survey posts, pylons
  carrying cable along the crest, the Gauge Posts (whitewashed blockhouses with works-green doors and a hand siren).
- **The Lakefronts and Moorings**: tuff quays with iron-capped edges; the Moorings an iron-edged stage with a capstan,
  chain bollards, spare pumice in a crate; the ladle car on short rails; the Tide Board at the causeway head (a tall
  cream enamel board on two works-green posts).
- **The Moulding Terrace**: the bastion's undercroft is the Pattern Shop (weatherboard doors open on giant wooden
  patterns of lamp posts and bollards; "THE TAP ROOM" tea hatch), the Firebrick Store (buff brick, works-green iron doors),
  the casting bed with its flasks, the parapet (basalt with a whitewashed coping, high-mark notices bolted to it), the
  ladle rail flush in the flags.
- **The Yard**: the Surge Office (two storeys of whitewashed basalt with works-green window frames; the split-flap Surge
  Board under a little canopy on its south face; the bastion its balcony), the cupola furnace (a round firebrick-and-iron
  stack with a verdigris cone hood and sparks), the weighbridge pit with its beam hut and the weighbridge office, the jib
  crane (works green, its jib parked out over the edge), the charging shed, stacks of castings for the ferry.
- **The Casting Hall (spawn)**: a long whitewashed basalt hall with a north-light verdigris sawtooth roof running back
  out of play and two brick chimneys; its gable to the lake has a great round window glowing with furnace light, the
  works clock, and `HIGHMARK FOUNDRY` in cast-iron letters; the spawn gallery is the gable's iron balcony (works-green
  balusters `rail`, two lamp standards, four planter urns), open to the sky.

### 5.2 Props (all `caldera_`-prefixed, built in `props.js`; colliders as the piece table says)

`caldera_surge_gauge` (piers, collars, girders, lattice, boards, clock, bell cage), `caldera_organ` (rider look, hex, two
variants), `caldera_organ_stump`, `caldera_socket_collar`, `caldera_pumice` (rider look, five variants, with chain),
`caldera_pumice_float` (the drifting flotsam), `caldera_chain_ring`, `caldera_capstan`, `caldera_chain_bollard`,
`caldera_mooring_bollard`, `caldera_winch_house`, `caldera_tide_board`, `caldera_ladle_car`, `caldera_lamp_plinth`,
`caldera_lamp_post`, `caldera_ingot_stack`, `caldera_stilling_drum`, `caldera_ladle_stand`, `caldera_mould_stack`,
`caldera_hornito`, `caldera_spatter_cone`, `caldera_outcrop`, `caldera_cairn`, `caldera_scree`, `caldera_pig_bed`
(flush), `caldera_floor_drain` (decal + glow), `caldera_pattern_doors`, `caldera_pattern_crates`,
`caldera_firebrick_store`, `caldera_firebrick_pallet`, `caldera_casting_bed`, `caldera_flask_stack`,
`caldera_ingot_pile`, `caldera_surge_office` (with the Surge Board frame), `caldera_bastion_rail`, `caldera_cupola`,
`caldera_weigh_office`, `caldera_weigh_pit`, `caldera_jib_crane`, `caldera_casting_stack` (variants: manhole covers,
lamp-post rack, bollard pallet, bench ends, drain grates, rails, pig iron, cable drum, drum stack, mould boxes, ingot
rack), `caldera_charging_shed`, `caldera_vent_hood`, `caldera_ladle_cradle`, `caldera_gauge_post`,
`caldera_hand_siren`, `caldera_spillway_bridge`, `caldera_ladle_gantry` (bazookarp only), `caldera_parapet`,
`caldera_casting_hall_gable`, `caldera_gallery_balustrade`, `caldera_planter_urn`, `caldera_rim_pylon`. Small parts
through `H.noShadow`; every prop merged into the kit's material buckets (`paint`, `gloss`, `metal`, `wood`, `rubber`;
inside the lava region only those five, engine rule 32). Working-life clutter on the dry tiers: tongs racks,
wheelbarrows of moulding sand, coke heaps, crucibles, heat suits on pegs, gas bottles, sand buckets, enamel signs, a
bicycle rack, the tea urn. Nothing loose on the ledges.

### 5.3 Stage surfaces, the palette and the lava (three slots; the lead assigns the PATTERN numbers)

1. **`caldera_tuff`**: pale warm-grey tuff flags (`#a8a49e`, dark joints): quays, terrace, yard, island top. Ink pops
   on it.
2. **`caldera_basalt`**: raw and dressed basalt in two looks from one slot (rough columnar rock for the rims, the cliff
   and the island's sides; dressed ashlar with pale lime joints for the works' walls), `#5f636b`, with rust and red
   scoria tints on the rims: every wall and all the natural ground.
3. **`caldera_glaze`**: glassy, ropy lava rock with flow lines (`#6e6862` base): every ledge (the Slump shelves, the
   Spillways, the Casting Floors), so a ledge reads as a lava bed even dry. It lives below the high mark, so the
   shader's glaze darkens it to about `#4d4945` and makes it glossy (engine rule 38: sRGB luminance ≥ 0.35).

**The works' identity colours** (so the day picture is not grey on grey): **works green** `#2f5a48` (a deep, dull bottle
green on all painted iron: balustrades, bridges, the gauge lattice, the crane, railings, lamp posts, doors), **verdigris**
`#7fb5a3` on the copper roofs (the Casting Halls, the Surge Office, the cupola hood, the gauge's pyramid: never on
walkable ground), **whitewash** `#f1ede4` on the halls' gables, the Surge Office, the Gauge Posts, the winch houses and
the parapet copings, **cream enamel** `#efe8d4` on every sign and board, buff firebrick `#c9b08a`. The works green is
dark and desaturated, so it never reads as Mint or Lime ink; the verdigris is out of reach. **No orange, yellow or
saturated red anywhere in the architecture.**

**The lava, day and dusk** (ENGINE §7 R1, revised):
- At rest the crust is **warm charcoal-maroon** (`#3b1f1a` to `#4a2219`, never black), broken by a net of lit seams
  that covers **≥ 35 % of the lake's pixels away from the shore** (crimson `#a3121a` → scarlet → white-hot `#fff0c8`), with
  slow smoke wisps and heat shimmer on. The drifting pumice and the moat's continuous ring make the lake read as molten
  from the spawn on a sunny day.
- **Full orange where no ink can be:** the two lavafalls, the lava channel winding down the mountain, the Spillway
  chutes and the Bellows Vent's summit glow at full orange-gold (`#ff8a1e` … `#ffc84a`), always; they are out of play and
  never next to ink on screen.
- **Ink stays the loudest colour on walkable ground:** the seams' orange band is a thin part of the ramp, and it is
  dropped entirely when either team's ink is orange or red (Tangerine, Cherry, the colour-blind Sun: crimson straight
  to white-gold); the glow thrown onto rock is multiplied by (1 − 0.8 × ink coverage); only white-hot cores bloom.
  Between ink and lava there is always basalt and the pale rind.

### 5.4 Murals and signage (mural ids 4…11)

| id | what | where |
|---|---|---|
| 4 | `HIGHMARK FOUNDRY · BELLOWS CALDERA · EST. 1931` in cast-iron letters | each Casting Hall gable over the gallery |
| 5 | the works' **HIGH MARK** line: a white painted stripe at 0.8 m with `HIGH MARK — DO NOT STAND BELOW THIS LINE DURING A SURGE` | posts, pier collars, walls, the parapet's lake face, the causeway plinths |
| 6 | `CASTING FLOOR — EBB ONLY`, `SLUMP PATH — FLOODS AT EVERY SURGE` and crossed-boot pictograms | the ledges' edges and the heads |
| 7 | `PUMICE RACE — HIGH LAVA ONLY` with chain arrows | both Slump heads, the winch house |
| 8 | the **Tide Board**: the cycle drawn as a wave (`EBB · SURGE · HIGH MARK · FALL`) with the timetable | the board at each causeway head |
| 9 | the foundry mark (a ladle in a ring) and `POUR FLOOR` cast in the plates | the Pour Floor |
| 10 | `SPILLWAY — NO STANDING DURING A SURGE`, black-and-white hazard chevrons | the Spillway Bridges, lips and the Horn Steps |
| 11 | `LADLE RAIL — MIND THE CARS` arrows, `TAP 1` / `TAP 2`, `CUPOLA No.1`, `PATTERN SHOP`, `WEIGHBRIDGE 20 T`, `DISPATCH — INKOPOLIS MUNICIPAL CASTINGS` | floor stencils along the ladle rail; building signs |

Old high-mark dates painted up the caldera wall (`HIGH 1931`, `SLUMP 1977`, `HIGH 2004`) are backdrop texture.

### 5.5 The world round it (backdrop.js, every side)

- **The near ring, all round**: the caldera wall in organ-pipe basalt columns, 18–30 m, with scree fans, fumaroles
  steaming from ledges, pale crust in cracks, a few ferns; faint older bathtub rings up the lower 10 m; a line of
  power pylons along the rim. Above each Slump the cliff shows the fresh scar of the 1977 collapse (paler rock, a
  rockfall fan running into the lake). The cliff pieces E3 run straight into it.
- **North and south, behind each Casting Hall**: each works' company town on the rim (whitewashed basalt terrace houses
  with verdigris roofs and smoking chimneys, a water tower, a radio mast whose lamp blinks at dusk); the South Works'
  funicular runs down the outer slope, the North Works' cable car to the coast.
- **South-east, through Alpha's Spillway**: the lavafall pours over the lip and down the black outer flank as a glowing
  ribbon; a lava channel winds down the mountain, full orange. On the north-eastern horizon (centre (230, 0, 150), about
  150 m high) the active cinder cone, **the Bellows Vent**: rust-brown scoria, a glowing summit, a plume drifting west
  over the lake (white by day, lit pink above and red below at dusk). It puffs an ash burst at every rise (backdrop
  `animate` reads `G.match?.lava?.state()`).
- **North-west, through Bravo's Spillway**: the second lavafall, the outer slope falling away over black lava fields to
  the sea: the ocean entry (a white steam plume), a black-sand cove, Cinder Isle's ferry pier with the Inkopolis ferry,
  and the faint Inkopolis skyline.
- **Overhead**: the lake's own thin steam column, lit from below at dusk.
- **Every view out** (rule 42): from the bridges, the horn tips and the lips the backdrop's slopes cover down to at
  least 20 m below the deck.

### 5.6 `env`, day and dusk, lamps

```js
env: {
  backdrop: buildBackdrop, bay: false, edge: 'none', boats: false, gulls: false, buoys: false,
  sea: false,                 // ENGINE H22: no sea mesh (the backdrop draws the far ocean far below); the death plane stays
  stars: true,
  weather: { mist: { layers: 2, height: 1.6, reach: 26, inner: 6, opacity: 0.12, scale: 1.0, color: '#d8c8bc' } },   // heat haze over the lake
  theme: {
    all:    { fog: [40, 900], haze: [1 / 2600, 0.8, 320] },
    day:    { zenith: '#1f5fbf', skyMid: '#5c9be0', horizon: '#d6cbbd', sunIntensity: 3.2 },   // thin high air, warm volcanic haze
    sunset: { hemiIntensity: 0.62, envK: 0.45, grade: { uExposure: 1.02, uSat: 0.98 } },     // violet-indigo; the lava is the key light
  },
},
```
- **Day**: a deep blue zenith, a strong high sun (south-east, about 45°) for hard short shadows on the basalt; whitewash
  and works green bright against the dark rock; the lake a glowing ring of maroon crust and lit seams; the lavafalls and
  the Vent full orange; the plume white.
- **Dusk**: the sun just set behind the west rim, the sea holding the last orange through Bravo's breach, stars. The
  lake lights the island, the gauge and the walls red from below and swells at every rise. The works' lamps are warm
  white (never orange): lamp posts along each Lakefront (colliderless, every 8 m, ≥ 1 m from every quay edge the Race or
  a hop uses), on the four causeway plinths, along the terrace's parapet line, floodlights on the jib crane, the
  gallery's two lamp standards; the Casting Halls' windows glow; the Surge Gauge's boards are backlit. The ambient and
  shadow tint stay cool so ink keeps its hue.
- `decor.lamps`: the posts above (Alpha's half, mirrored); no palms; two flags on each Casting Hall's ridge.

### 5.7 The intro and the hero shot

- **Intro** (`intro: { from: [40, 26, -40], lookFrom: [0, 8, 0], toBack: 3.2 }`): from high outside Alpha's Spillway,
  over the lavafall, sweep in low up the channel, over the Casting Floor, past the Surge Gauge's board as the bell swings
  once, then over the causeway, the terraces and the yard to settle behind the player on the gallery.
- **Hero shot** (`art: { from: [-44, 30, -56], look: [4, 2, 4], fov: 56, lava: 'high' }`): from high over Alpha's Rim
  Head looking north-east across the whole caldera **at HIGH** (`art.lava`, ENGINE T2): the Rim Head's spatter cone and
  the Surge Office in the foreground, Alpha's Slump with the Race afloat, the terraces stepping down, the glowing lake
  with Gauge Island, both Organ lookouts raised, the Surge Gauge dead in the middle third with its needle at HIGH MARK,
  Alpha's lavafall right of centre, the North Works across the lake and the Bellows Vent with its plume over the rim.
  Day and dusk versions.

### 5.8 What each camera sees

- **The spawn `play` view**: down the Gallery Stair over the yard's stacks and the weighbridge, the Surge Office's roof
  and the cupola's sparks; the terraces stepping down; the glowing moat; the Surge Gauge straight ahead (the board facing
  you); the North Works at the far end; the Bellows Vent and its plume ahead-right over the east rim (for Bravo, the sea
  through the west breach ahead-right). **Nothing crosses the view:** the jib crane's mast is 52° off axis, the gallery
  is open to the sky.
- **From mid**: the two Casting Halls at the ends; both works' terraces rising like the seats of a theatre; the rims of
  raw rock; the cone and the sea through the two breaches; the bell and the gauge overhead.
- **From a flank**: the rim wall close on one side, the lake on the other; on the own rim the Slump bay ahead with the
  Race or the shelf; on the enemy horn the breach and the lavafall beside you.

---

## 6. Build order, checkpoints and acceptance

The engine is built in parallel on `lavabox` (ENGINE.md §6). The stage builder owns only `src/world/stages/caldera/*`,
its entries in `tower-data.js`, `zones-data.js` (or the layout's own), `bazookarp-data.js`, its lightmaps and stage art.

### 6.1 Order (stop and look at pictures at every ★)

1. **Blockout (plain boxes) at LOW.** Every piece in §2.3 built with the §2.3 kit (`ground.js`), the edges E1–E8, the
   Organs as static hexes at their LOW pose and the stones as static boxes at HIGH (until the engine lands), the `LAVA`
   data, zones, tower, Bazookarp. `node build/check-maps.mjs caldera` ok (no overlaps). ★ **Checkpoint A**: top shots at
   LOW and HIGH **placed beside Craters', Halyard's and Spirhalite's** (same scale, same height); `play` from both spawns
   with `SHOTS=play` (no beam across the view); mid from four sides; a flank from each rim; `spawn-mid.js` (5.4–6.6 s),
   `cover-map.js`, `climb-audit.js`, `tower-check.cjs` (0 holes). Send the pictures to the lead before any detailing;
   §2.9 lists the levers if the top shot reads as a ring.
2. **Both states** (needs engine steps 1–4, or its `?lava=` hold). The same measures at `LAVA=high`; `lava-audit.js`
   (rules marked (A)). ★ **Checkpoint B**: top and mid shots at LOW, mid-rise and HIGH; **a HIGH picture of every
   boundary wall with its rind visible** (the Lakefront faces, the causeway sides, the island, the Slump cliff and
   heads, the Ladle Road, the channel sides); route counts per state.
3. **The palette proof** (needs engine step 6), before any detailing. ★ **Checkpoint C**: `lava-look.js` pictures at
   HIGH with all five team palettes and the colour-blind one, from the Lakefront and from an Organ lookout, day and
   dusk; **plus a day picture from each spawn at LOW, judged beside Halyard's from its spawn, against the question "is
   this obviously molten lava?"**, and the lake's lit-seam share measured (≥ 35 %). The lead and the user look at them.
4. **Mid first**: the Surge Gauge (all its colliders and looks), the island and its pavement, the Organs' looks, the
   causeways, the stones and their chains, the flotsam. ★ **Checkpoint D**: mid at LOW and HIGH, day and dusk.
5. **The rest**: the South Works (yard, terrace, Lakefront, Moorings), the rims and their natural ground, the Slumps,
   the Spillways, surfaces, murals, the backdrop on every side, `env`, lamps. ★ **Checkpoint E**: the full picture set
   (below), day and dusk.
6. **Modes and bots** (Mac mini): turf with the lava, zones, `tower-check` + `tower-match`, `bazookarp-check` (both
   states) + 16 karp matches, the boss check; perf; **bake two lightmaps** (`caldera`, and `caldera.bazookarp` with the
   kit's weir and Gate pieces and the Ladle Gantry); stage art at HIGH (`art.lava`); final pictures. ★ **Checkpoint F**:
   everything below.

### 6.2 Acceptance (the lead judges against this list)

**Layout**
- [ ] `check-maps` ok (bounds, overlaps, ramps ≤ 24°, spawn pads), plus its lava section (ENGINE.md §5 rules marked (C)).
- [ ] `lava-audit.js` clean (rules marked (A)): no sealed pits; every ledge point ≤ 12 m from dry floor (paper ≤ 10.0);
      every rider reachable and leavable at both poses by its `steps` links; no leap gaps; props in the region in kit
      buckets; every boundary wall wholly inside the region (no half-masked face).
- [ ] Spawn → mid **5.4–6.6 s in both states** for both teams (paper 5.66 s).
- [ ] **Cover map ≥ Halyard's (96.4 %) at LOW and at HIGH**, measured with `cover-map.js` the same day on both stages;
      no open circle > 6 m outside the zones, the bridges and the pad barriers.
- [ ] **No empty areas, no flat terraces**: every area of §2.3 dressed as described; the natural ground (cones, hummock,
      scree, outcrops, pavement) present; the top shots at LOW show no bare floor larger than the zones.
- [ ] **The outline**: Checkpoint A's comparison accepted by the lead; bounds ±36 × ±74.
- [ ] Flanks: 2 per side at HIGH, 3 at LOW, meeting mid at different faces (route-count report); the Slump's swap
      happens in the same bay (rule 41).
- [ ] `climb-audit.js` clean; `size-budget.js` passes (lightmap rows with the gauge's colliders, paint ppm, A* reach).
**The gimmick's fairness tests**
- [ ] No lava splat earlier than warning + 13.8 s on a ledge; no stone deadly earlier than fall warning + 16.2 s.
- [ ] 20 of 20 bots fighting on a drowning ledge are off it in time; ≤ 0.25 lava splats per bot per 3:00 match.
- [ ] A kid and a squid ride every Organ through a full rise and fall; a player on a stone when the shelves dry splats
      with cause `lava`; nobody is ever inside a rider (`lava-riders.js`).
- [ ] Ink: a ledge inked before a rise is bare after it; **an inked Ladle Road face, Lakefront face and island face burn
      to the waterline**; a splat across the waterline inks only above it; two-client ink identical (`net-lava.cjs`).
- [ ] Devices on a ledge are gone after a rise (through `crushIn`), on an Organ they ride.
- [ ] **A fall over either lip reports `lava`; no fall anywhere on the stage reports `water`** (`lava-rules.js`).
- [ ] **The dash-reach audit** (subs SPEC D10.6) at `LAVA=low` and `LAVA=high`: no hop + air-dash connection the nav
      graph lacks with a gain over 10 m, or each one listed and accepted.
- [ ] Online: L within 0.1 m on two screens through a cycle, a late joiner mid-rise, a host change on time.
- [ ] Every mode ends LOW; overtime holds; the Turf War final LOW ≥ 25 s.
**Modes**
- [ ] Zones: both zones never touch lava; a full zones match sane (stuck ≤ 3 %).
- [ ] Tower: `tower-len.js` 100 s to the goal; `tower-check.cjs` 0 holes, clearances clean but the two deliberate climbs,
      both rides knockout; `tower-match.cjs` sane.
- [ ] Bazookarp: `bazookarp-check.cjs` RESULT ok at `LAVA=low` and `LAVA=high` (including #13 apron, #14 Pond 8/8, #15
      weir room); the `caldera.bazookarp` lightmap fresh; 16 karp matches inside SPEC §9.1's targets.
- [ ] Boss: home ground ≥ 150 m², roams, never idle ≥ 12 s, all moves.
- [ ] Bots, turf (12 matches with the lava): stuck ≤ 1 %, no episode > 10 s; the Slumps crossed ≥ 4 times and a
      lookout used by a long-range bot ≥ once per match.
**Looks and performance**
- [ ] Ink is the loudest colour in every palette picture (Checkpoint C), and recognisable at 30 m next to an open seam.
- [ ] The day picture from the spawn reads as molten lava beside Halyard's (Checkpoint C); lit seams ≥ 35 % at rest.
- [ ] Day and dusk both beautiful; lamps glow at dusk; no z-fighting, no floating props, no see-through gaps; the `play`
      view clean from both spawns.
- [ ] **Performance against Halyard, side by side in the same `shoot.cjs` run, at LOW and at HIGH**: draw calls ≤
      Halyard's, triangles ≤ Halyard's, cpuRender ≤ Halyard's, loadMs ≤ Halyard's + 0.8 s (Halyard after the stretch:
      312–379 calls, 3.63–3.86 M tris, 5.2–6.1 ms, 8.1–8.9 s).
- [ ] Lightmaps baked (`caldera`, `caldera.bazookarp`), stage art day + dusk at HIGH, intro and hero framed.
- [ ] Pictures (JPEG < 300 KB) in `tools/botlab/jobs/batch5/caldera/out/`: top at LOW and HIGH beside Craters', Halyard's
      and Spirhalite's, top (zones), top (tower), `play` both spawns, mid at LOW / mid-rise / HIGH, an Organ lookout's
      view, the Race at HIGH and the shelf at LOW (the same bay), the Spillway from the quay, every boundary wall's rind,
      the palette sheet, the day spawn view beside Halyard's, art day + dusk, the cover maps at both levels with
      Halyard's beside them.

---

## Review log (revision 2)

Two reviews of revision 1: **A** = the user's advocate, **E** = the build / modes engineer. Every issue was changed in
the design unless the entry says otherwise.

| # | from | severity | issue | what I did |
|---|---|---|---|---|
| A1 | A | blocker | From above it read as a square pool in a capsule, not a crescent | Redrawn in curves (§2.1–§2.3): the lake and every lake-facing edge are arcs round the island (shore r 23 / r 21, tier fronts r 23 / 30 / 39), the region is a 96-vertex outline plus four bays, Gauge Island is an irregular 70-vertex basalt mass with notches for the Organs, each crescent sweeps from a fat rim root (the Rim Head, to x −34) through the Slump's bite to a 9 m horn tip, each Spillway is a diagonal breach (θ −48 / 132) with the narrow enemy horn beyond it, so each half is lopsided left to right. The Spillway floor is glassy ropy lava rock (`caldera_glaze`, §5.3). Bounds ±36 × ±74, floor 5,514 m² (was ±40 × ±77, 7,800). Checkpoint A now places the top shots beside Craters', Halyard's and Spirhalite's before any detailing (§6.1, §2.9 lists the levers). The paper pictures are `plan-r2-low.png` / `plan-r2-high.png`. |
| A2 | A | major | Every floor a flat paved tier; no volcanic ground | The rims and horn tips are raw rock with two spatter cones and a hummock (0.6–0.9 m, ≤ 24°, walkable), five outcrops and four cairns, two scree ramps in place of the Ridge's straight face, hornitos on the shelf and the channel; the island has a basalt pavement with three stumps per Organ cluster (0.6 / 0.9 / 1.2 m); the yard has a 0.6 m sunken weighbridge pit with ramps, the terrace a raised casting bed (§2.3, §2.4). Paper cover re-run: 97.8 % / 97.6 %. |
| A3 | A | major | At LOW the volcano barely showed; black lava on a grey stage | LOW raised to −0.6 (0.6 m under the ledges; ENGINE rule 1 allows it) and the lake made a continuous moat 8–11 m wide: 668 m² of open lava at LOW (was 521, in pits 2.8 m down). Day target added: warm charcoal-maroon crust, ≥ 35 % lit seams at rest, smoke and shimmer, drifting pumice (§5.3, ENGINE R1). Full orange spent on the lavafalls, the chutes, the mountain channel and the Vent. Works identity colours: works green, verdigris, whitewash, cream enamel (§5.3, §5.1). Checkpoint C adds a day picture from the spawn beside Halyard's, judged "is this obviously molten lava?". |
| A4 | A | major | No flank ever closed; the floating rocks were a second centre lane | Each rim is broken at **the Slump** (§2.3): at LOW the only way along that shore is the cliff-foot shelf; at HIGH it drowns and the Pumice Race surfaces in the same bay, 2.6–3.6 m lakeward of it, ≥ 15 m from the causeway. The stones are irregular (five sizes 2.3–2.8 × 2.4–2.7 m, a zig-zag of ±0.45 m offsets, boulder meshes that tilt and bob on the mesh only), on 0.25 m seams; cosmetic pumice drifts on the whole lake (`flotsam`). The centre Race is gone. Flanks recounted honestly: 2 per side at HIGH, 3 at LOW (§2.5); §6.2 updated. |
| A5 | A | major | The lookouts grew about one kid's height and already stood at LOW | LOW pose kept (1.4 / 1.8 / 2.3), HIGH lifted to 2.35 / 3.5 / 4.65: hops 1.15 m (≤ 1.25), travel 0.95 / 1.7 / 2.35 m, L's peak speed 0.35 m/s (≤ 0.6), the lookout 3.45 m over the island (≤ 4.6). L now stands in the lake, half out of the island's notch, its bottom ≥ 0.35 m under the surface at every pose; rubble, dust plumes and the stub's chips at every rise (§3.4). |
| A6 | A | major | Stain line and burn undefined on walls on the region outline | The region is drawn 0.5 m into every bank (§3.1, §3.2: lake r 23.5 / 21.5, channels t ±6.0, the Slump to the cliff + 0.5, the head tips + 0.5); that strip is bank above HIGH + 0.3, so nothing new drowns and `under()` never fires there. ENGINE rule 10 rewritten, new rule 45; Checkpoint B and `lava-audit.js` picture every boundary wall's rind; §6.2 burns an inked Ladle Road face. |
| A7 | A | major | The stage's outer edge was not in the piece table | Edges table E1–E8 in §2.3: caldera walls (roof, ≥ 1 m thick, ≥ 3 m over the floor) along every outer edge, the cliff at the Slumps, buildings where they close an edge, open only at the two lips (lip fence, `falls` → lava). Cover numbers re-run with them. |
| A8 | A | major | The Pond failed checker #14 (piers on the diagonals) | Piers moved to (±4.2, ±1.75): all 8 sightlines open, 2.35 m clear of the tower lane, girders still cut the spawn-to-spawn line (§2.3, §4.4). |
| A9 | A | minor | Chain bin 2.9 m from the weir | The weir moved to (0, 1.2, ±24.5) and the chain bin to (−5.6, −24.2): 5.0 m from it. Every solid ≥ 3.5 m (§4.4 #9). |
| A10 | A | minor | No 1.2 m blocks on the Gate apron | Two 1.3 m roof stacks on route 1 between the deck and the Gate: (5.6, −56.2) and (2.0, −50.6), 3.0 / 3.4 m from it (§2.3, §4.4 #6). |
| A11 | A | minor | §4.4 quoted old Bazookarp bands | The table now quotes SPEC §9.1 #3 (≥ 45 % and ≥ 25 m): 32.7 m, 56.6 % (§4.4). |
| A12 | A | minor | ASCII plans omitted cover | The plans are regenerated from the piece model; the text says the table wins where a 2 m row misses a small piece (§2.2). |
| A13 | A | minor | 1.1 m pinch on the Slag Walk | The Slag Walk and its stairs are gone; the Slump shelf is 4.5 m wide with its two hornitos against the cliff, leaving a 2.7 m path, and nothing onto mid is narrower than 4 m (§2.3, §2.5). |
| A14 | A | minor | Ladle Road cover 13.5–14 m apart against the lake | Revision 1's 47 m Ladle Road is gone. The new one is an 8 m stretch of rough rock between the north Slump head and the horn tip, with lake-side cover at both ends (the vent hood at θ 177, the ladle cradle at θ 155.8) and the West Bridge's railed root between them, under the Ridge's outcrop and spatter cone (§2.3); every point of it is within 5 m of cover (paper). |
| A15 | A | minor | Engine API did not match the subs spec | ENGINE H23 provides `G.level.liquidY(x, z)` (the lava inside the region, `PLAYER.waterY` outside) and the device sweep uses the shared `G.deploy.crushIn({ where }, 'lava')` (subs SPEC §0.3; its `liquid` shape was dropped in subs revision 3); `destroyWhere` is gone. The dash-reach audit is in §6.2; the narrowest lava gap between floors is now 4.5 m (§3.5). |
| A16 | A | minor | The rind on the Organ columns was ill-defined | Riders get no rind, only weathering above the island and heat-glaze near the lava on L's lake face; `patchStain` is never applied to rider meshes (§5.1, ENGINE §4.1). Their visible faces are never submerged, so no stain is physically right. |
| E1 | E | blocker | Both Horn Stairs ended in mid-air | The Spillway has no 2.4 m stairs at all: every way out is a 1.2 m hop (onto the Lakefront for s 22.3…29.5, onto the Horn Step for s 22.3…27, onto the Casting Floor at the mouth), and the Horn Step is part of the horn tip's polygon (§2.3). The horn tip's own edge runs the whole channel to the lip. Exits re-measured: 10.0 m worst. |
| E2 | E | major | The Organ climb existed for bots only by luck of the nav grid | Both fixes: explicit `steps` links in the data (island → A → B → L, and head → five stones → head), which `LavaWorld.buildNav` turns into edge pairs across each seam at each pose and fails the build if it cannot (ENGINE §4.3, rule 46); and the cluster is laid in a straight line along z with flats facing the climb (§2.3). `lava-nav.js` rebuilds with bounds shifted 0.25 m and 0.5 m and asserts the full climb at both poses (ENGINE §6 step 7). |
| E3 | E | major | The Pond failed #14 | As A8. |
| E4 | E | major | The Surge Gauge had no collision above 7 m | Colliders to 22 m (roof): lattice, shaft, boards, clock house, bell cage, cap; only the needle, bell, beacons and vane animate (§2.3, §5.1). Lightmap rows checked in `size-budget.js` (§6.2). |
| E5 | E | major | The yard crane's girder crossed the spawn view | The overhead crane is gone; a jib crane's mast stands at (16, −56.5), 52° off the `play` axis (outside the 41° half-field), its jib parked outward (§2.3). Proved with `SHOTS=play` at Checkpoint A. |
| E6 | E | major | Outer edges undefined; falls reported the sea | As A7, plus `LAVA.falls` (the chutes beyond both lips) so a fall there reports `lava`, and no other open drop exists (§3.5, ENGINE H3, rule 43). |
| E7 | E | major | Weir room, apron and the variant lightmap failed the SPEC | Weir room and apron as A9 and A10; the fallback weir (0, 1.2, 23.6) is clear by ≥ 4.5 m; `caldera.bazookarp` is baked and accepted (§6.1, §6.2); the bands corrected (A11). |
| E8 | E | minor | Geometry errata: coplanar overlaps, stairs inside tiers, overhang, lake faces, sockets, ferry steps, edge dressing | Rewritten: pieces share edges and never overlap at the same height (a paper overlap check found none but the Moorings' own cover); every stair sits on its lower tier (§2.3 kit); the Gauge Post sits inside the horn tip; every bank face in or by the region reaches −1.1 (the "sides to −1.1" flags); the island's Organ notch and its collars are specified point by point; the Moorings have plain 0.6 m steps (no ferry steps) and the zone is their top exactly; lamp posts and bollards are colliderless and ≥ 1 m from every hop edge and landing. |
| E9 | E | minor | Engine contract errata | Fixed in ENGINE.md: hex side paint uses the boxes' **short** faces (§4.1); `lavaSchedule` reads `m.practice` / `m.attract` (H24); rule 3 exempts practice and attract; H19 is mandatory for kits that roll or walk along floors or deal damage; sink stones surface and sink on a 2.4 s linear ease timed so they are solid exactly at the kill moment and deadly exactly when the shelf dries (≤ 0.6 m/s, rule 17); rider nodes pay no "near water" cost, and the Race target stays with them exempt. |

**Not fully resolved (and why):**
- **The right flank is long**: 89 m at HIGH and 97 m at LOW to the W face against 67 m for the centre. It is the price of
  sending the flank round the lake's west side through the Slump bay; it is still a third shorter than walking to the far
  horn. If bot matches show it unused, the lever is moving the West Bridge 4 m south onto the north head (about −8 m).
- **The Bazookarp HIGH second route needs a mode-only piece** (the Ladle Gantry). Revision 1 had none; the critics' flank
  fix removed the central Race that served it. Rainmaker layouts in the research change terrain per mode, so I judge it
  fair, but it adds a lightmap and a piece Turf War players never see.
- **The outline's read is unproved until Checkpoint A's pictures**: the paper raster is not the render. §2.9 gives the
  levers in order if it still reads as a ring.
