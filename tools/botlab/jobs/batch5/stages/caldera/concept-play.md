# Caldera: the play-first concept ("Charr Caldera")

One of three independent concepts for `caldera`. This one starts from how a 4v4 fight flows and dresses the result as
the place. All numbers are metres, seconds and world coordinates (x right, +z toward Bravo; Alpha's spawn at −z,
Bravo's at +z, every `half` piece turned 180° about the centre). Distances marked "nav" were measured on a 0.5 m
paper raster of this plan in both lava states (walk ≤ 0.45 m steps, hop ≤ 1.45 m, drops, jumps ≤ 2.3 m over a gap).
They are a builder's starting point, not a substitute for `spawn-mid.js`, `tower-len.js` or `bazookarp-check.cjs`.

Picture: `concept-play-plan.png` next to this file. It shows the whole stage at EBB (left) and FLOOD (right), with
both tower tracks, the zones and the Bazookarp pieces.

## 0. The concept in ten lines

1. **Place.** A live volcano's caldera with a lava lake that breathes. Grizzco has built a geothermal works inside it:
   a drilling derrick on the cinder island in the middle, a causeway to each landing, survey floats on the lake, an ore
   railway round the benches, and a gondola down the crater wall to each spawn.
2. **Shape.** Two crescents of terraced rim cup the lake, one per team. They are broken by two lava spillways that are
   offset from each other (west breach at z −10, east breach at z +10). Each team's crescent has a fat **long horn**
   that runs past the middle and a thin **short horn** that stops short of it, so the outline twists like a pinwheel.
3. **Mid.** Tap Island: a 26 × 22 m plaza (1.3 m) with a 10 × 10 m drill floor (2.4 m) under a 24 m derrick. Two
   causeways arrive from the north and south, two pipe walks from the east and west, and two survey floats sit in
   berths on its corners.
4. **The lava** is the stage's sea. It breathes between −1.6 m (EBB) and +0.8 m (FLOOD) on a fixed timetable that
   every player can read. A 10 s warning comes first, then a 10 s rise or fall.
5. **At EBB** the lake bed is 1,340 m² of open, dished, cover-studded crust. The lake is one big brawl with routes
   everywhere.
6. **At FLOOD** the crust, the spillway fords and the rim-foot strands drown. Twenty pumice stones float up out of
   their vent pits into stepping-stone paths, and the two floats rise 2.4 m to become lookouts over the centre zone.
   The stage becomes a three-lane bridge fight.
7. **The stain line** (the volcanologists' "bathtub ring") runs at +0.8 m on every face the lava can reach. It glows
   red-hot during each warning, so everyone can see exactly what is about to go under.
8. **Objectives** never touch lava. The centre zone is the drill floor. The side zones are on the landings. The tower
   rides a causeway and then the ore railway. The Bazookarp weir is on a causeway and its Gate is on a rail bench.
9. **Fairness.** Nothing drowns without 16 s of notice. Every square metre of crust is within 6.1 m of safe ground. The
   lava never moves in the opening rush, in the final 30 s of a 5-minute mode, in Turf War's final minute, or in
   overtime.
10. **Bazookarp** fits the research numbers: L ≈ 57 m, the weir at 46 %, the weir to the Gate 35 m, two routes on
    every leg in both lava states. **Boss Battle: no.**

---

## 1. Names and identity

**Name options**
1. **Charr Caldera** (recommended). The char is a fish, and a charred rock is what the whole crater is. Short,
   punny and Splatoon-shaped.
2. **Smeltworks Caldera.** The smelt is a fish, and Grizzco's works smelt sulphur out of the crater.
3. **Sizzlefin Crater.**

**Identity.** We are inside the caldera of Mount Charr, a volcanic island far off the coast. Its crater holds a lava
lake that breathes. Like real lava lakes that "gas-piston", it swells 2.4 m as gas builds in its foam, holds there,
then drains back down, every minute and a half. Grizzco saw free heat. Its **Heat Tap No. 1**, a 24 m steel drilling
derrick on the cinder island in the middle of the lake, taps the vent. A basalt causeway runs from each landing to the
island. Survey floats ride the lake on guide piles to measure it. An ore railway runs round the crater's benches to the
sulphur works on the rims. Visitors and crews ride a gondola down the crater wall to a landing station at each end:
those stations are the spawns. Every wall in the crater carries the black, ash-rimmed ring of the last high stand, and
Grizzco has painted on it in big stencils: **HIGH LAVA MARK — KEEP ABOVE THE LINE**. The landmark is the derrick. A
4 m gauge dial on its side faces each spawn and swings to RISING and FALLING, and its beacons flash before every
breath of the lake. Over the north-east rim, the volcano's summit cone smokes into the sky and can be seen from
everywhere.

---

## 2. The plan

### 2.1 The macro shape, and why it is two crescents and not one

The lead's direction is a horseshoe of rim and terraces round a lava lake with islands in it as mid. A single
horseshoe cannot be turned 180° onto itself, and every INKWAVE stage must be (half pieces turn (x, z) → (−x, −z)). Two
horseshoes facing each other across the lake can. So each team owns one crescent:

- **Alpha's crescent** wraps the lake's south end. Its **long horn** runs up the **east** rim to z +6, past the middle.
  Its **short horn** runs up the **west** rim only to z −14.
- **Bravo's crescent** is the twin: the long horn on the west rim (down to z −6), the short horn on the east rim (down to
  z +14).
- **The two spillways** cut through the rim between the horns: the **west breach** at z −14…−6 and the **east breach**
  at z +6…+14. They are offset, so the outline twists.
- **The rims are sheared.** A long horn is fat (8–14 m of rim, works buildings against the wall). A short horn is thin
  (4.5–6 m). The east wall bulges in the south and pinches in the north, and the west wall does the opposite.
- **The outline also has** squared ore-yard shoulders on the SE and NW, rounded assay shoulders on the SW and NE, and
  the gondola stations as tabs at the ends.

At FLOOD the playable footprint is literally two crescents round a lava lake, plus the island and its bridges: a broken
ring, not a band. At EBB the lake bed fills in. Even then the dark crust, the breaches and the lop-sided rims keep the
read. It is unlike `bluestone` (a skewed X of streets) and unlike `aquarium` (a ring or figure-8 of indoor galleries
with spawn wings). It is also unlike the twelve existing stages: none of them has a void in the middle of the map, and
none has a pinwheel-sheared outline.

Overall extent: x −32…+32 (the spillway lips at ±30), z −72…+72 to the back of the spawn decks, and the gondola halls
to ±80 (out of play). `bounds` ≈ ±34 × ±74.

### 2.2 Top-down plan (ASCII)

Alpha's half and the whole mid (z +11 … −77). Bravo's half is this turned 180° about (0, 0). One column is 1 m of x and
one row is 2 m of z (each row is labelled with its centre z), so the picture is to scale. Shown at **EBB**. The markers
are Bravo's attack on Alpha's half: Bravo's tower track and Bazookarp weir and Gate.

```
  x =        -30       -20       -10       0         10        20        30
   11       HHH2222211111....................======........,,,,,TTTT,,,,,
    9        222222211111.......iiiiiiiiiiiiiiiiiiiii......,,,,,TTTT,,,,,
    7        222222211111.....iiiiiiiiiiiiiiiiiiiiFFFFF....,,,,,TTTT,,,,,
    5         22222211111.....iiiiiiiiiiiiiiiiiiiiFFFFFi.....111TTTT222
    3         2HH22211111.....iiiiiiiiDDDDDDDDDD##################22222
    1         2HH22211111.....iiiiiiiiDDDDOODDDD##################222HH
   -1         2HH222##################DDDDOODDDDiiiiiiii.....11111222HH
   -3          22222##################DDDD++DDDDiiiiiiii.....11111222HH
   -5          2222211111.....iFFFFiiiDDDD++DDDDiiiiiiii.....11111222222
   -7        sss,TTTT,,,,,,...iFFFFii+++++++iiiiiiiiiiii....111112222222
   -9        ,,,,TTTT,,,,,,....iiiiii++iiiiiiiiiiiiiii......111112222222
  -11        ,,,,TTTT,,,,,,......iiii++iiiiiiiiiiiii........11111222222HHH
  -13        sss,TTTT,,,,,,........==++==......oo...........11111222222HHH
  -15           2TTTT11111.........==++==.......oo.........111112222222HHH
  -17            222211111.........==++==..................111112222222HHH
  -19            2222211111........==++==.......oo.........111112222222HHH
  -21            2222211111........==++==......gggggg.....1111122222222HHH
  -23             2222211111.oo.oo.==WW==oo.oogggggggg....1111122222222222
  -25             22222211111......==WW==......gggggggoo.11111222222222222
  -27             22222211111......==++==..........gg.oo111112222222222222
  -29             222222211111.....==++==..............1111122222222222222
  -31            22222222211111....==++==.............11111222222222222222
  -33            222222222211111...==++==............111112222222222222222
  -35            2222222222221111^.==++==.........///11112222222222222HHH2
  -37           2222222222222221111==++==.........///11222222222222222HHH2
  -39           2222222222222222211==++==......^1111222222222222222222HHH22
  -41           11111zzzzzzzzzzzz1111++11111111111111111111111111111111111
  -43           11111zzzzzzzzzzzz1111++++++++ccc++++++++++++++++++++111111
  -45            1111zzzzzzzzzzzz111111111111111111111111111111111++111111
  -47            1111zzzzzzzzzzzz111111111111111111111111111111111++11111
  -49            2222222222222222222222222222222222222222222222222++22222
  -51             2222222222+++++++++++++++++++++++++GG+++++cc++++++222
  -53               22222222++222222222222222222222222222222222222222
  -55                  33333++333333333333333333333333333333333
  -57                  33333++++++++333333333333333333333333333
  -59                  3333333333333333333333333333333333333333
  -61                  3333333333333333333333333333333333333333
  -63                            SSSSSSSSSSSSSSSSSSSS
  -65                            SSSSSSSSSSSSSSSSSSSS
  -67                            SSSSSSSSSPPSSSSSSSSS
  -69                            SSSSSSSSSSSSSSSSSSSS
  -71                            SSSSSSSSSSSSSSSSSSSS
  -73                        HHHHHHHHHHHHHHHHHHHHHHHHHHHH
  -75                        HHHHHHHHHHHHHHHHHHHHHHHHHHHH
  -77                        HHHHHHHHHHHHHHHHHHHHHHHHHHHH
```

Legend:
- **Floors that drown at FLOOD:**
  - `.` the lake crust (0, dished to −0.3 at the vent rows);
  - `,` the spillway fords (0);
  - `o` a vent pit at EBB (1 m deep, floored by a pumice stone) or a stepping stone at FLOOD (1.4);
  - `/` the Rampart Stair (crust → Landing).
- **Safe floors:**
  - `1` the shore strip and the Landing (1.3);
  - `2` the rail bench (2.4);
  - `3` the Overlook (3.8);
  - `S` the spawn deck (4.8), with `P` the pad;
  - `=` causeway A (1.3);
  - `g` Gauge Rock (1.3);
  - `i` the Tap Island plaza (1.3);
  - `D` the drill floor (2.4), with `O` the Pond;
  - `#` the pipe walks (2.4);
  - `T` the trestles over the breaches (2.4);
  - `s` a spillway sill step (1.2);
  - `F` a lookout float (1.3 at EBB, 3.7 at FLOOD).
- **Other:**
  - `^` the rampart parapet (top 2.1 above the crust);
  - `z` Alpha's side zone;
  - `H` buildings (roofs);
  - blank: the caldera wall, out of play.
- **Bravo's attack on this half:**
  - `+` Bravo's tower track (its centre line);
  - `c` Bravo's checkpoints;
  - `W` Bravo's weir;
  - `G` Bravo's Dragon Gate.

### 2.3 The pieces

Alpha's half is authored (Bravo's is the turn) unless the row says "single".

| piece | centre (x, z) | size | floor y | purpose |
|---|---|---|---|---|
| **Tap Island plaza** (single) | 0, 0 | octagon 26 × 22, corners cut 4 m: (±9, ±11), (±13, ±7) | 1.3 | mid's floor; its 1.3 m sides are climbable from the crust at EBB |
| **Drill floor** (single) | 0, 0 | 10 × 10 (x −5…5, z −5…5), chequer plate | 2.4 | centre zone, Bazookarp Pond (the rotary table), tower start |
| **Heat Tap derrick** (single) | legs at (±4.5, ±4.5) | legs 0.8 × 0.8; open lattice to a 24 m crown; drill string's foot at 8.5 m; gauge dial 4 m across at 12 m, one face toward each spawn | roof | the landmark; legs are cover on the zone |
| Pipe walk A (Alpha's) | 13.9, 2 | x 5…22.8, z 0.5…3.5 (3 m wide) | 2.4 | drill floor → Alpha's long horn. A raised gantry over the plaza (x 5…13), a bridge over the crust (x 13…17.8, piers at x 15.5), and an abutment over the shore strip |
| Lookout float A | −9.8, −6 | deck 4.4 × 4.4 (x −12…−7.6, z −8.2…−3.8), hull 3.4 deep, two guide piles at (−12.6, −6) and (−7.0, −6) up to 6 m | 1.3 at EBB → 3.7 at FLOOD | flush plaza at EBB; lookout over the zone at FLOOD; 0.3 m from Bravo's pipe walk |
| Causeway A | −5, −25.5 | x −8…−2, z −40…−11 (6 × 29) | 1.3 | centre lane; Bravo's tower track; Bravo's weir |
| Gauge Arch | −5, −24 | posts 0.8 × 0.8 at x −7.6 and −2.4; beam underside 6.0 m, carrying the lake gauge (LOW / HIGH bands) | roof | the causeway's landmark and strategic point |
| Gauge Rock A (a lava tumulus) | 7.5, −23 | polygon (4, −26) (10, −27) (11.5, −23) (10, −19.5) (5, −20) (3.5, −23), ≈ 8 × 7.5 | 1.3 | an island at FLOOD, where the stone paths meet; a 1.2 × 1.2 × 9 m gauge pylon at (7.5, −23.5), roof |
| Lake crust | the ellipse x²/18² + z²/40² ≤ 1, minus the island and causeways | 36 × 80 lake; crust 1,340 m² over both halves | 0, dished to −0.3 within 3 m of the vent rows | EBB-only floor (dark pahoehoe) |
| Vent pits / pumice stones (10 per half) | see §3.3 | 1.8–2.0 m square tops | top −1.0 at EBB → 1.4 at FLOOD | foxholes at EBB, stepping paths at FLOOD |
| Shore strip (both rims) | along the lake | 5 m wide from the lake edge | 1.3 | the lower rim path; the strand (crust) runs at its foot |
| Rail bench, long horn (east) | x 22.8 → wall | 6–9 m open plus the works against the wall; the wall at x 28.0 (z +6) … 31.8 (z −38) | 2.4 | the long horn's main road (the ore railway's rails, flush) |
| Rail bench, short horn (west) | from the shore strip's outer edge (5 m out from the lake) → the wall | 4.5–6 m; the wall at x −26.4 (z −14) … −25 (z −24) … −26.6 (z −42) | 2.4 | the short horn's ledge road |
| West breach (spillway) | −23, −10 | x −30…−16, z −14…−6 (14 × 8); lip and rail at x −30, then a lavafall out of play; two **sill steps** (1.2 m basalt blocks, x −29.5…−26.5, 1.4 deep) against its north and south walls at the lip end, so nobody standing at the lip is walled in by the 2.4 m bench faces | 0 (steps 1.2) | the ford at EBB; at FLOOD lava pours out over the lip |
| West trestle | −23.6, −10 | x −25.6…−21.6, z −15…−5 (4 × 10); timber-and-steel trestle; 2.1 m clear under it | 2.4 | the always-open flank crossing |
| The Landing (quay) | 2.5, −43.5 | x −27…+32 (clipped by the wall), z −47…−40 | 1.3 | the base front; the tower and the Gate approach |
| The rampart | the lake's south end | a 0.8 m basalt parapet on the Landing's lake lip where \|x\| < 11; gaps at causeway A and the stair | parapet top 2.1 above the crust | walls the base off from the crust: you can't hop 2.1 m |
| Rampart Stair | 8.5, −36.1 | 3 × 3 (x 7…10, z −37.6…−34.6) | 0 → 1.3 | the crust's one stair into the base (EBB only) |
| **Assay Yard** (Alpha's side zone) | −16, −43.5 | x −22…−10, z −47…−40 (12 × 7) | 1.3 | side zone; a sunken yard between two 2.4 benches |
| **Ore Yard** (SE shoulder) | 25, −44 | the shoulder between the Landing (1.3) and the rail band (2.4); ore hopper legs at (21.2, −48.5) and (27.2, −48.5), hopper underside 6.4 m | 1.3 / 2.4 | Bravo's tower turns here; works cover |
| Rail band | 3, −50.5 | x −23.5…+29.5, z −54…−47 | 2.4 | the defenders' second line; Bravo's Gate; Bravo's tower |
| The Overlook | 0, −58 | x −20…20, z −62…−54 | 3.8 | the spawn apron; the defenders re-form here |
| Spawn deck (the gondola landing) | 0, −67 | x −10…10, z −72…−62; pad (0, 4.8, −67); barrier 4.2 | 4.8 | spawn. Three exits: 6 m front steps, plus a 2.4 m stair at each front corner onto the Overlook's wings |
| Gondola station hall | 0, −76 | 28 × 8, 10 m tall | roof | the spawn's building; the cables leave its back for the rim |
| Heat Exchanger House | 29.6, −16 | 2.8 × 10 front block, 6 m (the hall continues into the wall) | roof | long-horn works; splits the rail bench lines |
| Pump House | 27.4, −1.5 | 2.2 × 5 front, 6 m | roof | the pipe walk's head |
| Ore shed | 28.6, −36.5 | 3 × 5, 6 m | roof | the Ore Yard's back |

**Heights.** Crust 0 · shore / Landing / causeways / island / Gauge Rocks 1.3 · rail bench / drill floor / pipe
walks / trestles 2.4 · Overlook 3.8 · spawn deck 4.8 · floats 1.3 ↔ 3.7 · stones −1.0 ↔ 1.4.

**The 1.8 m climb** (a hop is 1.41 m, plus 0.35 m of ledge assist):
- **Every tier step is a hop:** crust → 1.3, 1.3 → 2.4, 2.4 → 3.8, 3.8 → 4.8. Players flow up and down the benches
  anywhere, and the tier faces are the low walls you fight behind.
- **Deliberate walls (over 1.8 m):**
  - the rampart, 2.1 m from the crust;
  - a risen float, 2.4 m above the plaza (it is still a 1.3 m hop from a pipe walk);
  - the 2.0–2.6 m spatter cones and lava trees (roofs);
  - every building front;
  - the caldera wall (roof, out of play).
- **Swimming instead.** A squid swims up any inked wall: the float hulls, the rampart's lake face (inkable basalt) and
  the bench faces. The rampart is a squid-only way into a base at EBB, a welcome extra. If `bazookarp-check` flags it
  as a climb shortcut (#7b), make the rampart's lake face `noPaint`.

### 2.4 Lanes and flanks (from Alpha's spawn)

**Centre.** Deck → Overlook → the grand stair (x −4…4) → rail band → Landing → causeway A → the island's south face
→ the drill floor. 69 m nav, **5.9 s swimming**: the Long Stages standard (about 6 s, about 60 m straight; the straight
line is 67 m). Bravo's is 69.3 m. FLOOD adds less than 1 m, because the causeway is always there.

**East: the long horn (Alpha's strong flank).**
- **Routes:** the Landing → the Ore Yard → up the east rim on either the shore strip (1.3) or the rail bench (2.4,
  past wagons, racks, the Heat Exchanger House and the Pump House). The **strand** is a third route at EBB only: the
  crust at the rim's foot, covered from the rail bench by the shore strip's edge.
- **Where it meets mid:** pipe walk A at z +2 (78.9 m nav from the pad), straight onto the drill floor's east edge at
  2.4. At EBB the waist crust (x 13…18) is also open.
- **Going past mid:** the east trestle at z +10 (87.3 m) crosses into Bravo's thin short horn and on to Bravo's side
  zone (the NE Assay Yard).

The long horn is Alpha's attacking flank, and it ends at the enemy's side zone.

**West: the short horn (Alpha's weak flank).**
- **Routes:** the Assay Yard → up the thin west rim on the shore strip or the rail bench ledge → the west trestle at
  z −10 (67.5 m nav). At EBB the ford under the trestle and the strand are open too.
- **Over the trestle** you land on Bravo's fat long horn, 8 m from the head of Bravo's pipe walk (74.9 m). From there,
  Bravo's pipe walk leads into mid from the enemy's side, or Bravo's long horn leads north into Bravo's base.
- **At FLOOD only:** the **Rim Stones** connect the west rim to causeway A at z −22.

**Flank and mid meeting points.** Each side has 3 walking flank routes plus a lava-only one, and they meet mid at
different points:
- the pipe walk heads at z ±2;
- the trestles at z ±10;
- the waist crust at z 0 (EBB);
- the stone paths at the island's south face and at the causeway's midpoint (FLOOD).

**The pinwheel in one sentence.** Each team's strong flank runs past the middle and ends at the enemy's side zone.
Each team's weak flank crosses early onto the enemy's strong flank. Both teams therefore always fight on both rims,
and a team that wins its long horn has to cross a trestle to cash it in.

### 2.5 Mid: Tap Island

- **The drill floor** (2.4, 10 × 10) is king of the hill.
  - It is reached by a hop from any side of the plaza; by 2 m wide stair flights on the west half of its north edge
    (x −4…−2) and the east half of its south edge (x 2…4), clear of the tower's drops at x 0; and level from both
    pipe walks.
  - Cover on it: the four derrick legs (0.8 m, full height) and two drawworks winch housings (1.8 × 1.2 × 1.2 m) at
    (2.8, −2.5) and (−2.8, 2.5).
  - Its centre is the **rotary table**: a 3 m round grate over the well, glowing from below at FLOOD.
- **The plaza ring** (1.3) round it is 4–8 m wide.
  - Cover pairs:
    - mud tanks (3 × 1.6 × 1.5) at (±9.5, ∓4.5);
    - valve manifolds (2.4 × 1.0 × 1.1) at (±3, ∓8.5);
    - crates at (±1, ∓9.8) and (±11.2, ∓8.6);
    - a bollard run (0.6 × 2.4 × 0.9) at (∓11.8, ±3).
  - Plaza edge details: 0.9 m bollards and chain rails (rail, see-through) only where the edge faces open lava.
- **Ways in:**
  - at EBB: everywhere (1.3 m hops from the crust);
  - at FLOOD: 2 causeways, 2 pipe walks, 2 stone paths (the Island Stones), and a squid's leap across the 4.3–5 m
    lava moats at the waist (a deliberate skill route: a running kid's jump reaches about 4.2 m, a swim-jump much
    further).
- **The floats** are flush pieces of the plaza at EBB and 3.7 m lookouts at FLOOD.
  - Float A (SW) sits next to Bravo's pipe walk, and float B (NE) next to Alpha's. So each team's strong flank leads
    straight to the lookout on the enemy's side of mid.
  - Either float is reached at FLOOD by a 1.3 m hop from the adjacent pipe walk (0.3 m gap), or by swimming up its
    inked hull.

Mid is spacious: 480 m² of plaza plus 100 m² of drill floor. Nothing in it is narrower than 4 m, and the derrick's
open base keeps the sky visible.

### 2.6 Spawn depth and re-forming

The spawn deck sits 4.8 m up at the back of the crescent. Between it and the lake are 22 m of terraces:
- the Overlook (40 × 8 at 3.8): a ticket kiosk, a coin telescope, the big LAVA LEVEL board, crates;
- the rail band (53 × 7 at 2.4): ore wagons, pipe-rack legs, crates;
- the Landing (59 × 7 at 1.3): the rampart parapet as the front line, the Assay Yard, the Ore Yard.

There are three ways off the deck, three stairs down from the Overlook (a 8 m grand stair at x 0, 2.4 m stairs at
x −18 and +18) and hops everywhere. The Overlook's front rail is see-through (`rail`), with a 3 m gap at x −14, where
Bravo's tower climbs up the face.
- **At EBB** the lake front of a base can be entered only by causeway A, the Rampart Stair and the two rims. Attackers
  on the crust must funnel through those, because the rampart stops them hopping up anywhere else.
- **At FLOOD** only the causeway and the rims are left.

So FLOOD is the defenders' breather and EBB is the attackers' window. That rhythm is the stage's heartbeat.

### 2.7 Cover

- **Target:** cover every 6–10 m on all floor.
- **Count:** the plan places about 75 pieces per half: the ones listed in §2.3 and §2.5, plus the lists below.
- **Measured** with a stand-in for `cover-map.js` (cover ≥ 0.9 m tall, or a tier face rising ≥ 0.9 m within reach):
  - 98.6 % of floor within 5 m of cover at EBB, 98.4 % at FLOOD;
  - largest open patch 6.4 m across, beside Bravo's pipe walk head.

The builder must re-measure with the real tool, in both states.

**Crust (Alpha's half; Bravo's mirrored)**

Spatter cones and lava trees are slide-off roofs: at FLOOD they stand out of the lava as pillars and must never
become perches. Ridges are walk-over floor and drown.

| kind | x, z | footprint | height |
|---|---|---|---|
| spatter cone | (−12.5, −31) | 2.4 | 2.0 |
| spatter cone | (0.5, −33.5) | 2.4 | 2.0 |
| spatter cone | (15.2, −13.5) | 2.0 | 2.0 |
| spatter cone | (−15, −9) | 2.0 | 2.0 |
| spatter cone | (15.6, −5) | 1.6 | 1.6 |
| lava tree | (−11.5, −15.5) | 1.0 | 2.6 |
| lava tree | (9.8, −15.5) | 1.0 | 2.6 |
| lava tree | (14.3, −20) | 1.0 | 2.6 |
| lava tree | (−10.5, −27) | 1.0 | 2.6 |
| pressure ridge | (−13.8, −25.5) | 1.2 × 4.5 | 0.7 |
| pressure ridge | (6, −31) | 5 × 1.2 | 0.7 |
| pressure ridge | (1, −16) | 4 × 1.2 | 0.7 |
| pressure ridge | (−15.6, −2) | 1.2 × 4.5 | 0.7 |
| pressure ridge | (8.5, −8) | 1.2 × 4 | 0.7 |
| half-sunk ore wagon (sloped, roof) | (9.5, −33.5) | 2.6 × 1.6 | 1.3 |

**Causeway A**
- Parapet blocks (1.2 × 2.0 × 1.0), on alternate sides and off the tower lane: (−7.4, −35), (−2.6, −29),
  (−7.4, −17) and (−2.6, −13.5).
- The Gauge Arch posts at z −24.

**Rims**
- East (long horn):
  - crates (1.4 m) at (20, −29), (21.5, −12) and (25.5, 4.8);
  - pipe-rack legs (1.0 m) at (21, −21) and (21.5, −5);
  - tipper wagons (1.6 × 3.0 × 1.4) at (26, −25) and (25, −31.5);
  - a valve stand at (26.5, −8);
  - the Heat Exchanger House and the Pump House.
- West (short horn):
  - crates at (−18.5, −32.5), (−20.8, −18), (−21.5, −29.5) and (−24, −35.5);
  - a rack at (−20, −25);
  - a valve stand at (−24.2, −20);
  - a sill boulder (1.4 × 1.4 × 1.0) at (−28.2, −10), plus a parapet post on the trestle.

**Base**
- Landing / Assay Yard:
  - sulphur vats (2.2 × 2.2 × 1.4) at (−12.5, −42.2);
  - an assay shed (2.4 × 3 × 2.6, roof) at (−20.5, −41.5);
  - crates at (−18, −45.6), (3, −46), (13, −41.2) and (28.5, −42);
  - a bollard run at (0.5, −41);
  - a wagon at (19, −46).
- Ore Yard: the hopper legs, a crate at (25, −38.5), the ore shed.
- Rail band: a wagon at (−18.5, −50); crates at (−6, −53) and (12, −53); a rack at (4, −48.2).
- Overlook:
  - a kiosk (2.4 × 2.0 × 2.6) at (−17.5, −60);
  - a telescope at (−5, −55);
  - a board (3 × 0.4 × 2.4) at (10, −60.5);
  - crates at (17, −57), (−11, −60.5) and (−1.5, −57.5).

Every piece above was checked against both tower tracks (the 2.5 m platform's sweep). None is in the way.

### 2.8 Sightlines and weapon classes

**Sightlines**
- **Spawn to spawn:** the derrick blocks the spawn axis. The causeways are offset 5 m from it, so no lane runs straight
  from spawn to spawn.
- **Longest lines:**
  - the Overlook's front over the lake to the island: 43–55 m;
  - the long horn's rail bench along z: up to 30 m, broken by the works every 8–12 m;
  - the pipe walks: 18 m straight E–W lines.
- **At FLOOD** the lake is void, like the water between Halyard's piers. Fire crosses it freely, but nobody stands in
  it.

**Where each class shines**

| class | where it shines | its counter |
|---|---|---|
| Chargers and bows | the Overlook's front rail (into the lake and onto the causeway); the long horn's rail bench over the waist; the floats at FLOOD (3.7 m, the best perches on the stage) | the floats are a hop from the pipe walks, so a perched charger is always flankable |
| Rollers, brushes, brollys, mitts | the EBB crust (cones, lava trees, ridges, and the vent pits as 1 m foxholes to ambush from); the plaza ring; the works on the long horn | the FLOOD phase takes the crust away |
| Splatlings and long shooters | the pipe walks and the causeways (long, straight, 3–6 m wide) | |
| Blasters and sloshers | lobbing up onto the drill floor and the floats; over the rampart parapet onto the Landing; over the tier faces | |
| Bazookarp carrier (charged lob) | lobbing from the island over a causeway, or from Gauge Rock onto the causeway | |

---

## 3. The lava

### 3.1 Rules

1. **The lava is the stage's sea.** One surface at level L(t), between **LOW −1.6** (the normal sea height, so EBB plays
   like an ordinary stage) and **HIGH +0.8** (the stain line).
2. **Touching it splats you**, cause `lava`, exactly as falling in the sea does. The fall height becomes L + 0.15.
   Kid, squid, mid-special and super-jump landings are all treated the same. Bombs and thrown subs that land in it
   fizzle with no blast. Devices on ground it covers are destroyed with a sizzle: sprinkler, beacon, Drip Curtain,
   Surf N' Turf buoy, Lurk Mine.
3. **It breathes in four states:**
   - **EBB**: L = −1.6, holding;
   - **RISE**: 10 s, smoothstep, peak 0.36 m/s;
   - **FLOOD**: L = +0.8, holding;
   - **FALL**: 10 s, smoothstep.

   A **10 s warning** comes before every RISE and every FALL.
4. **What drowns** (everything with floor below 0.8): the lake crust, the spillway fords, the strands, the vent pits,
   and the lower half of each Rampart Stair. In all that is 20 % of the stage's floor: 6,770 m² at EBB, 5,430 m² at
   FLOOD.
5. **What rises**, carrying anyone and anything standing on it (players, squids, devices; a dropped Bazookarp never
   rests on one, §4.4):
   - **20 pumice stones**, top at L + 0.6: −1.0 at EBB, 1.4 at FLOOD;
   - **2 lookout floats**, deck at L + 2.9: 1.3 at EBB, 3.7 at FLOOD.

   Both rise straight up inside their own sockets: a stone's vent pit, a float's berth cut into the plaza corner.
6. **Everything at 1.3 m or above never changes.** That includes every objective.

**Key moments in a RISE** (seconds after it starts):

| t (s) | what happens |
|---|---|
| 0 | the stones and floats start rising with the surface (they float on it) |
| 3.3 | glowing lava wells up the pits round the stones (L −1.0) |
| 4.4 | the stones' tops break the crust's surface |
| 4.7 | the floats pass the pipe walks' height (2.4) |
| 5.3 | lava wells over the dished crust round the vent rows |
| 6.1 | it covers the flat crust, sheeting from the vent rows outwards to the shores in about 1.5 s |
| 10 | it reaches the stain line; stones at 1.4, floats at 3.7 |

**Key moments in a FALL:** the crust breaks the surface at 3.9 s, the stones drop back below the crust at 5.6 s, and
everything is down at 10 s.

### 3.2 Timetables (s of play, and the clock as players see it)

**Turf War 3:00.** One flood, in the middle minute:

| clock | t | state |
|---|---|---|
| 3:00–2:10 | 0–50 | EBB (the opening rush is always dry). Warning at 2:20 |
| 2:10–2:00 | 50–60 | RISE |
| 2:00–1:10 | 60–110 | FLOOD (50 s). Warning at 1:20 |
| 1:10–1:00 | 110–120 | FALL |
| 1:00–0:00 | 120–180 | EBB: **the last ebb**. The final minute is played on the whole stage, and the freshly scorched crust is a painting race |

**Turf War 1:30.**

| clock | t | state |
|---|---|---|
| 1:30–1:05 | 0–25 | EBB. Warning at 1:15 |
| 1:05–0:55 | 25–35 | RISE |
| 0:55–0:40 | 35–50 | FLOOD. Warning at 0:50 |
| 0:40–0:30 | 50–60 | FALL |
| 0:30–0:00 | 60–90 | EBB |

**Zone Control, Tower Command, Bazookarp (5:00).** The lake breathes every 90 s: EBB 30, RISE 10, FLOOD 40, FALL 10.

| clock | t | state |
|---|---|---|
| 5:00–4:30 | 0–30 | EBB. Warning at 4:40 |
| 4:30–4:20 | 30–40 | RISE |
| 4:20–3:40 | 40–80 | FLOOD. Warning at 3:50 |
| 3:40–3:30 | 80–90 | FALL |
| 3:30–3:00 | 90–120 | EBB. Warning at 3:10 |
| 3:00–2:50 | 120–130 | RISE |
| 2:50–2:10 | 130–170 | FLOOD. Warning at 2:20 |
| 2:10–2:00 | 170–180 | FALL |
| 2:00–1:30 | 180–210 | EBB. Warning at 1:40 |
| 1:30–1:20 | 210–220 | RISE |
| 1:20–0:40 | 220–260 | FLOOD. Warning at 0:50 |
| 0:40–0:30 | 260–270 | FALL |
| 0:30–0:00 | 270–300 | EBB |
| **overtime** | | **EBB, held**: the lava never moves in overtime |

Over 5:00 the stage spends 120 s at EBB, 120 s at FLOOD and 60 s moving, and both states hold the objective fight for
equal time.

**Practice and the menu backdrop** loop the 90 s breath.

**Boss Battle** is not offered (§4.5).

### 3.3 The set-pieces

1. **The Heat Tap's gauge.**
   - The derrick carries a 4 m dial at 12 m height, one face toward each spawn. A brass needle runs over a dark band
     marked LOW, with HIGH in the stain-line's ash-white.
   - Red beacons sit on the crown and on the dial's rim.
   - Each spawn's Overlook has a matching LAVA LEVEL board with a moving marker: a glance from spawn tells you the
     state.
2. **The vent rows: pits at EBB, stones at FLOOD.** Ten per half, in four rows. Centres for Alpha's half (Bravo's
   mirrored):

   | row | links | stones (centre, top) |
   |---|---|---|
   | **Shore Stones** | the long horn's shore strip → Gauge Rock | (12.2, −27.4) and (11.9, −25.0), 1.8 m |
   | **Island Stones** | the island's south face (x ≈ 5.6) → Gauge Rock | (5.6, −12.8), (5.8, −15.6), (6.0, −18.4), 2.0 m |
   | **Rim Stones** | the short horn's shore strip → causeway A | (−13, −22) and (−10, −22), 2.0 m |
   | **Cross Stones** | Gauge Rock → causeway A at the Gauge Arch | (1.97, −23) and (−0.46, −23), 1.8 m |

   Gaps between stones, and to the ground they link, are 0.5–1.0 m: an easy hop for a kid, and impossible to mistake
   for a gap you can't cross. At EBB each pit is a 1 m deep, stone-floored hollow you can drop into and hop out of:
   foxholes, and varied ground. At FLOOD the same spots are paths. **The low map and the high map are each other's
   negative.**
3. **The lookout floats.** Grizzco survey floats: steel pontoon decks on two guide piles each, with amber strobes on
   the piles while they move, and their guide rollers clatter as they climb.
4. **The spillways.**
   - At EBB each breach is a dry, crusted sill (the ford) under its trestle.
   - At FLOOD the lake overtops the sill and pours out of the caldera as a lavafall down the outer flank. You can see it
     through the notch from the whole rim, and hear it.
   - During a FALL the falls thin to glowing drips.
5. **The rampart.** The Landing's 0.8 m parapet round the lake's ends: cover for the defenders, a wall to the crust.
6. **The stain line.** A 0.18 m band at exactly +0.8 on every face the lava can reach:
   - the island's and causeways' sides;
   - the shore strips' lake faces;
   - the breach walls and the rampart's lake face;
   - Gauge Rock and the pylons;
   - the cones and lava trees;
   - the pipe-walk piers;
   - the float hulls and guide piles.

   Below the line the rock is darker and glassy (the rind). The line itself is a crisp pale ash rim with a speckle of
   cream sulphur, like a tide-line stain. Above the line the rock is its normal colour.

### 3.4 What both teams can do with it

- **Before a RISE:**
  - the team holding mid clears the crust and lets the lava close the door behind its enemies;
  - the team on the crust either breaks through to the island or retreats to the causeway heads and rims.
- **Riding up.**
  - Stand on a float as it rises and you arrive on the lookout first, 2.4 m above the zone, without having to make the
    hop.
  - Stand on a stone in its pit at the warning and you ride up with it, safe: a lifeboat in the middle of the lake.
- **At FLOOD:**
  - the stage becomes three lanes (causeway, pipe walks, rims) plus the stone paths, which are exposed and slow but are
    the only way to hit the island's south face or a causeway's flank;
  - the lookouts decide the zone;
  - the base fronts are safest.
- **Before a FALL:** attackers stack on the island's edges and the stones, ready to pour across the crust the moment it
  surfaces (3.9 s into the fall). Defenders pre-aim the Rampart Stair and the causeway head.
- **After a FALL:** the crust comes back scorched clean (§3.7). It is the cheapest turf on the stage, and in Turf War
  the final minute starts this way.
- **Every phase is predictable.** The timetable is printed on the HUD, so a team can time a push to land as the crust
  opens, or a retreat to finish as it closes.

### 3.5 How it is announced

"It should be very obvious when the lava is falling or rising." Every cue has a rising version and a falling version,
and they are opposites:

| cue | RISE (red, upward, roaring) | FALL (white steam, downward, hissing) |
|---|---|---|
| HUD call-out (the `_zCall` banner, INKWAVE's voice) | `LAVA RISING!` / sub `10 s — get off the crust`; at FLOOD, `LAVA HIGH` / sub `Stones up · floats up` | `LAVA FALLING!` / sub `The crust opens in 10 s`; at EBB, `LAVA LOW` / sub `The crust is open` |
| HUD gauge (always on screen on this stage, beside the minimap; 72 px tall) | ▲ pulsing, the fill climbing, `RISING 8` counting down | ▼ pulsing, the fill dropping, `FALLING 8`. While holding: `RISES IN 24` / `FALLS IN 31` |
| your own danger | standing on floodable ground during a warning or a RISE: the screen edge glows hot and a fast sizzle ticks | — |
| minimap / TAB map | floodable ground is always hatched dark red; the hatching pulses through the warning and the RISE; at FLOOD it is drawn as lava, with stone and float icons | the hatching fades back to crust as it surfaces |
| sound (synthesised in `src/audio/`) | the Tap's siren as a two-tone glide upward, three cycles; a sub-bass rumble swelling; the lake bubbling louder; then a rolling roar and the floats' ratchet clatter | a falling horn glide; steam hiss bursts; a draining gurgle (filtered noise sweeping down) |
| derrick | beacons flash red; the needle swings up | beacons flash white; the needle swings down |
| stain line | glows red-hot along every face during the warning ("this is how high it comes"), and cools as the lava arrives | fades to ash as the lava leaves it |
| the lake | vent fountains spit glowing blobs (cosmetic); the crust's cracks brighten from dull red to orange; the lava wells from the vent rows first, then a bright molten front sheets out to the shores; smoke where it eats ink | the surface skins over in dark plates; white steam billows off the crust as it surfaces; the lavafalls thin |
| moving pieces | stones bob up out of their pits; floats climb their piles under amber strobes | the reverse, ending in a clank as they reseat |

The colour, the direction of motion, the arrow and the pitch all agree, and none of them depends on colour vision
alone: the arrows, the words and the pitch direction carry it.

### 3.6 Fairness

- **Notice.**
  - The first warning comes 16.1 s before lava touches the crust (10 s of warning plus 6.1 s of RISE).
  - The farthest crust point is 6.1 m (walking) from ground a kid can climb onto, with the rampart counted as a wall.
    It is at (4.2, −32.2) and its twin, in the pocket between causeway A, Gauge Rock and the rampart. That is 1.0 s at a
    run, 2.1 s hopping as a dry squid, and 0.5 s swimming.
  - The Rampart Stair's edge is 3.7 m from that point.
- **No traps.**
  - Every drowning area has at least two exits to safe ground.
  - The only walls over 1.8 m round floodable floor are the rampart's lake face and the spillways' 2.4 m side walls.
    Every pocket against the rampart also touches a 1.3 m edge: the causeway, the shore strip or the stair.
  - Each spillway has sill steps at its lip end (§2.3), so its far end is never more than 4 m from a way out.
- **Appearing geometry never appears inside anyone.**
  - Stones and floats only ever move vertically inside their own sockets, and nothing can stand inside a socket's
    column except on the moving piece itself.
  - A player straddling a float's edge as it starts to move is shoved (`stageKit.shoveActor`) onto whichever side holds
    their centre, during its first 0.3 m of travel.
  - A player in a vent pit stands on its stone and rides it.
- **Nobody is splatted by geometry.** Floats and stones carry what is on them and never crush: nothing is ever above
  them.
- **Spawns and objectives are never affected.** Every spawn, zone, track and Bazookarp piece is at 1.3 m or above.
- **The lava never moves:**
  - in the opening 30 s (5-minute modes) or 50 s (Turf War);
  - in the last 30 s of a 5-minute mode;
  - in Turf War's final minute;
  - in overtime.
- **Super jumps** to a teammate standing on floodable ground are allowed. The jumper sees the same warnings, and the
  landing leaves at least 6 s to step off.

### 3.7 Ink, turf and devices

- **Scorching.**
  - As the surface passes over a floor or wall cell, the lava burns its ink off, with a hiss and a team-tinted puff.
    This reuses the paint system's region wipe (`paint.flood(region, −1, …)`, or a small `wipeBelow(y)` built on the
    same cell sweep).
  - Cells under lava count for nobody.
  - When the lava falls, the crust comes back **uninked**, glossy black and steaming for 3 s.
- **Turf.**
  - In Turf War the final count happens at EBB on the whole stage. The last flood ends with 60 s (3:00) or 30 s (1:30)
    left, so nothing is decided by a drowning.
  - Both teams lose crust ink equally at every rise. That keeps the lake a live fight and gives the team behind a reset
    to exploit.
- **Stones** are uninkable (pumice glass; you hop them, you don't swim them).
- **Floats.**
  - Float decks and hull sides take ink through a per-block paint, as the pods' plants do (`BoxPaint`). Ink stays on
    them while they ride; you can swim up an inked hull at FLOOD.
  - Float ink is not counted as turf, like the tower's deck: about 38 m² in all.
- **Devices** on stones or floats ride them, using the moving-floor rule from sp-fixes (`b.dp`).
- **Dropped specials:** an Ink Tempest's rain over lava paints nothing below the surface. A Kraken, an Ink Jet landing
  or a Splashdown into lava is a splat, as with water.

### 3.8 Bots

- **The lava layer.** A `stageKit.navClaim` layer of its own.
  - From each RISE warning until 1 s after the crust surfaces in the next FALL, every node on floodable floor is
    blocked. Bots replan off it, and goals skip it.
  - At the warning, any bot on a floodable node gets an **evacuate** goal to the nearest safe node (by nav, ≤ 6 m).
    The goal outranks fighting, though the bot keeps firing while it retreats.
- **Stone and float nodes.**
  - The nav graph is built once with stone tops at their high positions and the float decks at both positions. Each
    set is enabled only in its state: high positions from FLOOD start to the FALL warning, low positions from the end
    of the FALL to the RISE warning.
  - Stone-to-stone jumps are jump edges (gaps 0.5–1.0 m).
- **Bots use it.**
  - Charger, splatling and bow bots take float decks as perches at FLOOD.
  - Roaming bots take stone paths when they are shorter.
  - Painters target the fresh crust after a FALL: it is the cheapest turf.
  - Defenders hold the causeway heads at FLOOD.
  - A bot planning a route over the crust checks the timetable. If the next RISE comes before the route clears the
    crust (route length ÷ speed + 3 s), it takes the dry route.
  - Bazookarp carrier bots do the same, with the carrier's 4.8 m/s.

### 3.9 Online and the engine contract

**The engine.** One new module, `src/game/lava.js` (`StageLava`). It follows `movers.js` and reuses `stageKit.js`:
- `StageClock` for time;
- `navClaim` / `navCommit` for the layer;
- `shoveActor` for straddlers;
- `buildLook` for the stone and float meshes;
- `G.level.addDynamic` / `moveDynamic` for their colliders, with `dp` carrying riders.

**Data:**

```js
LAYOUT.lava = {
  level: { low: -1.6, high: 0.8 },
  rise: 10, fall: 10, warn: 10,                       // s
  timetable: {
    turf180: [[0, 'ebb'], [50, 'rise'], [60, 'flood'], [110, 'fall'], [120, 'ebb']],
    turf90:  [[0, 'ebb'], [25, 'rise'], [35, 'flood'], [50, 'fall'], [60, 'ebb']],
    long:    { period: 90, ebb: 30, flood: 40 },       // zones / tower / bazookarp; overtime holds 'ebb'
    loop:    { period: 90, ebb: 30, flood: 40 },       // practice, the menu backdrop
  },
  mirror: true,                                         // each stone / float gets its 180° twin
  stones: [{ id: 'shore-1', pos: [12.2, -27.4], size: [1.8, 1.8], top: 0.6, hull: 1.4 }, /* … §3.3 */],
  floats: [{ id: 'float-a', pos: [-9.8, -6], size: [4.4, 4.4], deck: 2.9, hull: 3.4,
             piles: [[-12.6, -6], [-7.0, -6]], mesh: { type: 'caldera_float' } }],
  stain: { y: 0.8, band: 0.18 },
  dish: [{ poly: [/* the vent rows + 3 m */], y: -0.3 }],   // where the lava wells first (cosmetic order of the front)
};
```

**Short, tagged hook-ins** (`[b5-lava]`):
- the actor's fall height reads `G.lava?.deathY ?? PLAYER.fallDeathY`;
- `env.water: 'lava'` swaps the sea shader for the lava surface, and the module drives its height;
- the paint scorch, and turf skipping cells below the surface;
- the HUD gauge and call-outs;
- minimap hatching;
- the audio cues.

**Online.** The state is a pure function of the stage clock, exactly like the railcars: no records, the same on every
screen, correct for a late joiner and after a host change. The scorch is deterministic on every client (same surface,
same cells). Lava splats are judged by the victim's owner, as falling into the sea is. Test with a
`net-stageclock`-style two-client test: the level, the stone and float positions, a scorched cell, a lava splat.

**Lightmap.** Stones and floats are dynamic and never baked. The stain band is a material effect on static faces.

---

## 4. Each mode on this layout

### 4.1 Turf War

The whole stage, on the 3:00 / 1:30 timetables (§3.2):

| minute | stage | what it plays like |
|---|---|---|
| 1st | the dry one | the open lake brawl |
| 2nd | the flooded one | three lanes, the stones and the lookouts; crust ink burnt away |
| last | the dry one again | a scorched-clean lake bed to repaint, and every route open |

Floor: 6,770 m² at EBB, 5,430 m² at FLOOD, against Craters' 5,800 after the stretch. It is on the large side. If the
paint atlas density suffers, trim the long horns' rail benches by 1–2 m first.

### 4.2 Zone Control

**Centre: the drill floor.** One zone, x −5…5, z −5…5, y0 2.3, y1 2.5 (100 m², flat chequer plate).
- **Ways in:** a hop from all four sides of the plaza, two stair flights, and both pipe walks (level).
- **Cover on it:** four derrick legs and two winch housings.
- **High ground over it:** at FLOOD, both lookout floats (3.7 m, 1.3 m above the zone, one on each side). At EBB the
  zone is itself the high ground at mid.
- **The rhythm.** The zone gets harder to hold at FLOOD, because a lookout overlooks it. It gets easier to reach at EBB,
  because the crust surrounds the island.

**Side: the Assay Yard.**

| | Alpha's | Bravo's (the turn) |
|---|---|---|
| polygon | x −22…−10, z −47…−40 | x 10…22, z 40…47 |
| floor | y0 1.2, y1 1.4 (84 m², flat) | same |
| distance | 28.4 m from its own spawn pad, 46.3 m from the centre | same |

- **What it is:** a sunken yard on the Landing, between two 1.1 m-higher benches: the short horn's rail bench to the
  north, the rail band to the south.
- **Ways in:** the Landing from the east (the causeway head), the short horn's shore strip from the north-west, stairs
  down from the rail band, and hops off both benches.
- **Cover:** sulphur vats, the assay shed, crates.
- **Who attacks it:** the enemy reaches it along its strong flank, its long horn, over the west trestle (for Alpha's
  yard). Defenders hold it from the rail band and the Overlook's west wing.
- **The lava never touches it.** At FLOOD the attackers' crust route is gone, so taking a side zone at FLOOD means
  going round by the rim: fair, and readable.

### 4.3 Tower Command

Two checkpoints, under the user's two-checkpoint rule: 10 s each, the track worth 80 points, about 100 s from the
centre to the goal with one rider.

**The story.** The tower crosses the lake on Grizzco's causeway, then rides the ore railway round the back of the enemy
landing.

**Alpha's track** (drawn on Bravo's half; Bravo's is the turn):

| # | from → to (x, z) | length | floor | note |
|---|---|---|---|---|
| 1 | (0, 0) → (0, 7.5) | 7.5 | 2.4 → 1.3 | starts on the drill floor; **drops** off its north edge (z 5) onto the plaza |
| 2 | (0, 7.5) → (5, 7.5) | 5 | 1.3 | across the plaza's north quarter (float B 1.35 m clear) |
| 3 | (5, 7.5) → (5, 43.5) | 36 | 1.3 | Bravo's causeway (x 2…8) and onto Bravo's Landing; under the Gauge Arch at z 24 |
| 4 | (5, 43.5) → (−24, 43.5) | 29 | 1.3 | west along Bravo's Landing; **checkpoint 1** at (−3.5, 43.5) |
| 5 | (−24, 43.5) → (−24, 50.5) | 7 | 1.3 → 2.4 | **climbs** onto the rail band in Bravo's Ore Yard (NW shoulder), under the ore hopper |
| 6 | (−24, 50.5) → (14, 50.5) | 38 | 2.4 | east along the rail band past the station's front; **checkpoint 2** at (−18, 50.5) |
| 7 | (14, 50.5) → (14, 57.5) | 7 | 2.4 → 3.8 | **climbs** onto Bravo's Overlook |
| 8 | (14, 57.5) → (8, 57.5) | 6 | 3.8 | **goal** at (8, 3.8, 57.5): 12.4 m short of Bravo's pad, outside the 4.2 m barrier |

```js
tower: { path: [[0, 2.4, 0], [0, 7.5], [5, 7.5], [5, 43.5], [-24, 43.5], [-24, 50.5], [14, 50.5], [14, 57.5], [8, 57.5]],
         checkpoints: [[-3.5, 43.5], [-18, 50.5]] }
```

**Numbers.**
- Length **135.5 m**; tower speed 135.5 / 80 = **1.69 m/s**.
- Checkpoints at 57.0 m (**42 %**) and 90.5 m (**67 %**).
- Exactly one drop and two climbs, every run straight with square corners, no stutter over clutter.

**Headroom** (3.72 m above the platform's floor):

| overhead piece | clearance | needed | |
|---|---|---|---|
| derrick drill string over the drill floor | 6.1 | 3.72 | ✓ |
| Gauge Arch beam over the causeway (6.0 − 1.3) | 4.7 | 3.72 | ✓ |
| ore hopper over the rail band (6.4 − 2.4) | 4.0 | 3.72 | ✓ |

Pipe racks along the rail band are legs only: no cross-beams over the track. The gondola cables run high above. The
platform's sweep was checked against every prop in §2.7: no conflicts. The two tracks share only the centre point.

**Tower and lava.** The whole track is on 1.3 m or higher, so the lava never touches the tower. The 36 m causeway leg
changes with the breath:
- **at EBB** defenders swarm it from the crust on both sides;
- **at FLOOD** it is a bridge over lava. Defenders come head-on or across the Cross Stones and Island Stones. A rider
  knocked off the side drowns.

The first checkpoint sits where the causeway lands: the enemy's base front, reachable by the defenders from the
Landing's whole length.

### 4.4 Bazookarp

`LAYOUT.bazookarp` (Alpha's attack on Bravo's half; the engine mirrors it for Bravo's):

```js
bazookarp: {
  start: [0, 2.4, 0],                         // the Pond: the drill floor's rotary table (solid in this mode)
  weirs: [{ at: [5, 1.3, 24], yaw: 0 }],      // under the Gauge Arch on Bravo's causeway (posts at x 3.1 / 6.9)
  gate: { at: [-11, 2.4, 51], yaw: 180 },     // on Bravo's rail band, a level below the Overlook and two below the deck
  freeZones: [{ poly: [[-10, 62], [10, 62], [10, 72], [-10, 72]], y0: 4.6, y1: 6,
               signs: [[-10.4, 62.6, 0], [0, 61.6, 0], [10.4, 62.6, 0]] }],   // the spawn deck only
  routes: { causeway: [[5, 11], [5, 40], [-11, 46]], stones: [[-5, 12], [-6, 20], [-2, 23]] },
}
```

**Carrier numbers** (walking 4.8 m/s, swimming 9.44 m/s):

| leg | EBB | FLOOD | research band |
|---|---|---|---|
| L (Pond → Gate) | **≈ 57 m** (11.8 s walking, 6.0 s swimming) | ≈ 59 m | 55–85 m; 11.5–18 s |
| Pond → weir | 26.1 m (**46 %**, count 54) | same | 40–55 % |
| weir → Gate | 34.8 m (**61 %** of L) | same | ≥ 20 m and ≥ 35 % |
| route 2, Pond → weir | the crust beside the causeway, climbing on at the arch (≈ 1.0×) | Island Stones → Gauge Rock B → Cross Stones (39.3 m, **1.51×**) | ≤ 1.6× |
| route 2, weir → Gate | off the causeway over the crust, up the Rampart Stair (≈ 1.0×) | Cross Stones → Gauge Rock B → Shore Stones → the NW shore strip (Bravo's long horn) → rail band (47.5 m, **1.36×**) | ≤ 1.6× |

- **The Gate's distance.** The Gate is 19.4 m from Bravo's pad, 34.5° off the pad → Pond line, at y 2.4 ≤ pad + 0.2.
  It is seen from the deck over the Overlook's see-through front rail: the eye line from 6.3 m clears the Overlook's
  edge by 0.4 m.
- **Carry time.** Unopposed, a carry is 12–13 s. With a real fight I expect 25–45 s from the shell's burst at the Pond
  to the knockout, and most carries ending at the weir or the causeway head.
- **Entrances into the Gate's 15 m ring:** the Landing from the causeway head; the Landing from the NW Ore Yard; the
  rail band from the east; the rail band from the west (the long horn's rim); the Overlook's stairs from above. That is
  five, all in sight of the deck.
- **No shortcuts.** The rampart closes the crust off: at EBB only the causeway, the Rampart Stair and the rims reach a
  base, and nothing drops more than 2.5 m into the ring.
- **High ground.** The only unreachable-by-walking high ground is the spawn deck, which is the free zone. The floats
  are reachable by a hop from the pipe walks. Cones, trees, the derrick, the arch and every building are roofs. No
  other free zone is needed, and none sits on a lava-only route.
- **Retreat sanity.** Every own-half route climbs steadily from the lake to the base. The one place that can dip is the
  stone path's sideways jog across Gauge Rock. If checker #10 reads more than 6 m of lost progress there, a
  `noRetreat` patch over Gauge Rock covers it.
- **The lava in Bazookarp.** It breathes on the 90 s cycle, and the Carp Field is rebuilt at each state change (L stays
  at its start value).
  - Lava is a fall, judged by last footing (S25/S26).
  - The drop spot never chooses floodable nodes or a stone or float.
  - A dropped Bazookarp resting on crust when a RISE warning starts is moved at once to the nearest safe drop spot, with
    its comet arc.
  - The Pond, the weirs and the Gates are all on ground the lava never reaches.
- **If the checker reads L under 55**, move the Gate to (−12, 2.4, 52): 19.2 m from the pad, 38.7° off the line,
  +1.5 m of L.

### 4.5 Boss Battle: no (`noBoss: true`)

HULLBREAKER is about 9 m long and needs one connected open floor to roam and charge across. Caldera's only large floor
is the lake bed:
- the island and both causeways cut it into four pockets, the largest about 16 × 27 m;
- the waist channels beside the island are 4.3–5 m wide, too narrow for the boss to pass;
- it floods.

The rims are 5–14 m wide benches round a hole, so they are no better. Parking the lava and flattening the lake for one
mode would remove the stage's identity, and would still leave the pockets. If the lead wants a boss here anyway, the
smallest change is a boss-only variant: both causeways become 0 m fords (`onlyIn: 'boss'`), the island shrinks to the
drill floor's footprint, and the lava stays parked at EBB. I don't recommend it.

---

## 5. The look

### 5.1 Architecture and props

The ground is volcanic and the works are Grizzco's. Every structure says what it is.

**The ground**
- Columnar basalt benches: the tier faces show hexagonal column ends and joints, and the bench tops are hexagonal
  basalt paving.
- A pahoehoe crust lake bed with ropy folds.
- Spatter cones as squat crusted chimneys.
- Lava trees as hollow stumps of black crust.
- Pressure ridges, and pumice stones like grey sponge glass.
- The tumulus Gauge Rocks.

**The works** (cream-panelled, chocolate-framed, riveted)
- The derrick, with its drawworks, crown block and the dial.
- The Heat Exchanger Houses, with louvred vents breathing steam.
- The Pump Houses at the pipe walks' heads.
- The ore hopper over the rail road, and tipper wagons on narrow-gauge rails set flush.
- Pipe racks (copper heat pipes in verdigris lagging), valve stands with red wheels.
- The sulphur vats and assay sheds.
- The survey floats, with yellow-and-black pile bands.
- The gondola landing stations: steel-and-glass halls, cable sheaves on their roofs, parked cabins at the deck ends.

**Signage** (murals)
- "CHARR CALDERA · GRIZZCO HEAT TAP No.1".
- "HIGH LAVA MARK — KEEP ABOVE THE LINE" on the rampart and the causeway sides.
- Bench stencils: "BENCH 1 · 1.3", "BENCH 2 · 2.4".
- "TAP ISLAND →" fingerposts.
- "NO SWIMMING (IT'S LAVA)".
- The Overlook's LAVA LEVEL board.
- Gondola timetables.
- Old high-stand dates painted up the caldera wall: "HIGH 86", "HIGH 02" …

### 5.2 Materials and palette (three stage surfaces)

**The surfaces**
1. **Basalt paving** for the bench tops, causeways, island and Landing: hexagonal columns, cool blue-grey #4f545c with
   #3b3f45 joints.
2. **Crust** for the lake bed and fords: ropy pahoehoe, warm near-black #2b2625 with a faint glassy sheen. It is the
   darkest floor in INKWAVE, so ink on it is the brightest thing on screen.
3. **Welded tuff** for the Overlook, the station aprons, and the bench faces above the stain line: #a39a8e warm grey
   blocks.

**Props:** Grizzco cream #e3d8bf, chocolate #4e3a2c, chequer steel #7d8186 (drill floor, pipe walks), verdigris
#5e8d84 (lagging, small areas), white rails.

**Lava against ink.** The real problem is that lava is orange-red, and so are Tangerine, Cherry and Lemon ink. The
answer is to separate them by value, area and texture rather than by hue alone:
- **Mostly crust.** At rest the lava is 70 % dark crust plates (#1c1615). The heat shows in hairline cracks: a pale
  gold core #ffd9a0 with an oxblood rim #9e2410. Broad saturated molten colour appears only where it is a signal: the
  vent fountains, the advancing front during a RISE, the lavafalls. That totals under 5 % of the screen at any moment.
- **Ink is the opposite** in all three: flat, saturated, mid-to-high value, on floors that are dark (crust) or
  mid-grey (basalt).
- **Ink-aware tint.** The lava shader is given the match's two ink colours. It pushes its molten tone up to 15° of hue
  away from the nearer one, and caps its saturation at 70 % of that ink's. With Tangerine it leans crimson. With Lemon
  it leans red. It still reads as lava.
- **Glow.** It lights the bench faces from below (a warm hemisphere ground colour), strong at dusk and faint by day.
  It never lights floors from above, where the ink lies.
- **The maps** draw lava as hatching, never as a team-like fill.

### 5.3 The far backdrop, every side

**North and south: the caldera walls.**
- 40–60 m of layered strata: dark flows, oxidised-red scoria bands, pale ash beds.
- Faint old bathtub rings up the lower 10 m, and fumaroles steaming.
- Each spawn's gondola cables run up the wall from the station's back to a lit Grizzco rim station. Cabins crawl up and
  down (backdrop `objects`, animated).

**East: through the east breach's notch.**
- The spillway's lavafall pours down a black outer flank to a black-sand bay.
- Grizzco's harbour sits there: a jetty, two cranes, a moored ore carrier. The sea runs out to the horizon.
- Above the north-east rim stands the **summit cone** with its plume, the landmark from every spawn.

**West: through the west breach's notch.**
- The second lavafall, and the open sea with a few distant islands.
- At dusk the sun sets on this side, so the hero dusk shot looks along the lake into the notch.

**Sky**
- Day: a hazy, very clear blue (#b9cfe0 horizon) with the grey-white plume, and slow grey ash flecks drifting
  (`weather.snow` with a grey colour and a slow fall: a small env addition to request).
- No gulls, no boats, `bay: false`, `edge: 'none'`. The caldera's cliffs are the stage's own banks.

### 5.4 Day and dusk

| | day | dusk |
|---|---|---|
| light | high, white sun | the sun low in the west notch; the sky indigo to violet; stars |
| the crater | crisp basalt and cream works | the plume lit red from beneath; the lake's glow climbs the walls; lamps on |
| the lava | reads as dark crust with hot seams | the cracks glow in earnest and the lavafalls are ribbons of light |
| what stays loudest | ink | ink: it is lit by the scene's key light, the lava only lights faces from below |

At dusk the works lamps, the gondola cabins, the Overlook's lamp posts and the dial's backlight come on.

### 5.5 Intro fly-in and stage-select hero shot

**Intro** (the existing `intro` format, then the engine's own cut to the player):

| | value |
|---|---|
| from | (−18, 38, −92): high over the south wall, looking down the length of the crater with the plume ahead |
| lookFrom | (0, 6, −10) |
| toBack | 3.4 |

The camera glides down Alpha's gondola cable past a descending cabin, sweeps low across the lake past the derrick's
dial, and ends behind the player.

**Hero shot** (`art`):

| | value |
|---|---|
| from | (−42, 30, −58), from the SW rim |
| look | (6, 2, 4) |
| fov | 56 |
| lava state | 65 % of the way through a RISE |

The frame shows the molten front sheeting across the crust, the stones half out of their pits, both floats climbing,
the derrick's beacons red, the north wall, and the plume behind. That one picture explains the gimmick.

---

## 6. The three biggest risks

1. **Two stages to finish instead of one.** EBB and FLOOD are different maps. The empty-bowl risk lives at EBB (1,340 m²
   of lake bed) and the starved-chokepoint risk lives at FLOOD (everything funnels into two causeways and two pipe
   walks).
   - Design both states from day one. Every cover and route claim in this document is given for both.
   - Have the lava module expose a test hook that freezes the level, so `cover-map.js`, `spawn-mid.js`, the climb
     audit and the shots run at EBB and at FLOOD.
   - Keep the stone paths and the waist leap as FLOOD's pressure valves.
   - Tune the FLOOD length (40 s) and the stone count from Mac mini bot sets: stuck %, splats per phase, and time the
     centre zone spends contested per phase.
   - If FLOOD stalls, add a third Island Stones row on each side before making the lake shallower.
2. **Lava against ink colour.** Tangerine, Cherry and Lemon sit next to orange lava.
   - Use the crust-dominant look, hairline seams and value separation (§5.2), plus the ink-aware 15° tint and the
     saturation cap.
   - Test-shoot every palette and the colour-blind palette at EBB, mid-RISE and FLOOD, by day and at dusk.
   - The bar: ink is recognisable at 30 m next to an open seam in every shot.
   - If one palette still fights, darken the molten tone further for that palette rather than change the ink.
3. **A moving death plane must feel fair to humans and to bots, online.**
   - Use warnings in five channels (§3.5), 16 s of notice, the 6 m-to-safety rule, and lifeboat stones.
   - Give the bots the evacuate goal and the timetable-aware routes. Run the Mac mini matches looking specifically for
     lava splats per match: the target is under 1 per player per match by the second flood, and bots under 0.5.
   - Make the level a pure function of the stage clock, with a two-client test.
   - Watch for the late joiner who arrives mid-RISE: they must see the same level within the clock's ±0.2 s, so
     nobody dies on one screen and lives on the other.

Smaller risks, noted:
- **The silhouette** still reads as a band at EBB from far up, because the lake bed is floor. The shear, the offset
  notches and the dark lake carry it. At FLOOD it is unmistakably two crescents.
- **L ≈ 57 m** sits at the low end of the Bazookarp band. There is a fix ready in §4.4.
- **Floor area** is about 17 % above Craters.

---

### Appendix: how the numbers were made

A paper raster of this plan at 0.5 m in both lava states:
- the nav on it (walk, hop ≤ 1.45 m, drops, jumps ≤ 2.3 m over a gap);
- a cover-distance pass (≥ 0.9 m cover or tier face within 5 m);
- the two tower tracks' platform sweep checked against every prop;
- the Bazookarp route-2 rule (ban 2.5 m round route 1 except 6 m from the ends, plus a forced off-causeway variant).

The figures:

| measure | value |
|---|---|
| spawn → mid (nav) | 69.2 / 69.3 m at EBB, 69.7 / 69.3 m at FLOOD |
| tower track | 135.5 m; checkpoints at 57.0 / 90.5 m |
| L | 56.8 m (EBB) / 59.0 m (FLOOD) |
| Pond → weir | 26.1 m |
| weir → Gate | 34.8 / 35.4 m |
| crust → safe ground (max) | 6.1 m (rampart counted as a wall; the spillways' sill steps included) |
| floor | 6,766 / 5,430 m² |
| cover within 5 m | 98.6 / 98.4 % |

These are planning figures. The builder's real tools decide.
