# `caldera` concept: THE PLACE FIRST

One of three independent concepts for the `caldera` stage (batch 5). The user's words (REQUEST.md, "stages:"): *"an
active volcano, where the lava level falls and rises. areas that the lava can rise to should have an indicator at the
top of the lava level similar to how water can stain into rocks. the lava rises up and covers flank routes, brings
floating rocks with it, rises platforms in the middle that are used as lookouts, adds or removes new routes temporarily
etc. and it should be very obvious when the lava is falling or rising."*

The angle of this concept: start from somewhere real. A working ironworks that lives by the volcano's breath the way a
harbour lives by the tide. Every clause of the user's request is a working part of that place, so the gimmick never
looks bolted on, and the lanes, heights and cover come from the buildings and the caldera wall.

Conventions used throughout:
- Alpha spawns at −Z, Bravo at +Z. Pieces are listed for **Alpha's half**. Bravo's are the 180° turn about Y
  ((x, z) → (−x, −z)). Pieces on the centre are listed once and are self-symmetric.
- Alpha faces +Z, so **Alpha's left is +X**.
- The ASCII plan is a true top-down view: +X to the right, **+Z down the page** (Alpha's spawn at the top). 1 character
  is 1 m across, 1 row is 2 m down. It was generated from the exact coordinates in the tables, so the plan and the
  tables agree.
- Heights are floor tops in metres. "Ebb" means the lava is low, "surge" means it is at the high mark.

---

## 1. Name and identity

**Name options**
1. **Highmark Foundry** (preferred). The ironworks is named after the lava's high mark, the stain line the user asked
   for. The name tells you the stage's signature before you load it.
2. **Bellows Caldera**. The locals call the volcano "the Bellows" because it breathes like a forge's bellows.
3. **Cinder Wharf**. The works' lava quays are run like a harbour's wharves.

**Identity.** Highmark Foundry stands inside Bellows Caldera, the breathing volcano on Cinder Isle, two hours by ferry
from Inkopolis. About every eighty seconds the lava lake on the caldera floor swells up its walls to the high mark,
holds there, and sinks back. The old hands call it the Bellows breathing. The foundry has lived by that breath for
ninety years, the way a harbour lives by the tide. At every ebb the crews work the **Casting Floor** round the island
in the middle of the lake. At every surge the lava pours into the floor's moulds, lifts the iron **Ladle Lifts** up
their frames, and floats the chained pumice stones of the **Pumice Race** up into a walkway. Everything Inkopolis
stands on was cast here: the bollards, the lamp posts, the manhole covers, the bench frames, the drain grates. The
yards are stacked with them, waiting for the ferry. Two works face each other across the lake: the South Works (Alpha)
and the North Works (Bravo). Each has its **Casting Hall** up on the caldera rim and terraces stepping down the
caldera wall to its lakefront. In the middle of the lake, on a basalt plug joined to both shores by causeways, stands
the landmark: **the Surge Gauge**. It is a 22 m iron tower that is the works' clock, bell and tide gauge in one. A
float needle the size of a car climbs a scale on both its faces as the lava rises, and the Surge Bell in its top calls
every surge. Every wall the lava can reach carries the bathtub ring of the last surge: glossy black below and a crisp
ochre crust line at the high mark.

Why this place: it makes each of the user's clauses a working part of somewhere real.

| the user asked for | what it is at Highmark Foundry |
|---|---|
| lava that rises and falls | the Bellows' breath: the works' tide, on a timetable the works posts on a board |
| a stain at the top of the lava level | the high mark, painted on every wall and post the works owns ("DO NOT STAND BELOW THIS LINE DURING SURGE") and baked into the rock as a crust ring |
| covers flank routes | the Casting Floor (the low ring round the island) and the two spillway sills: ebb-only floors |
| brings floating rocks with it | the Pumice Race: pumice stones chained in a slot, floated up into a stepping path by each surge |
| rises platforms in the middle used as lookouts | the Ladle Lifts: iron pontoons in guide frames beside the island, lifted 2.5 m by the lava |
| adds or removes routes temporarily | ebb: the Casting Floor and the sills open; surge: they drown and the Pumice Race opens |
| very obvious when rising or falling | the Surge Gauge's needle, the Surge Bell, a siren whose pitch climbs on the rise and falls on the fall, the Surge Board, the glow |

---

## 2. The plan

### 2.1 Macro shape: two horseshoes facing across a lake

The lead asked for "a crescent: a horseshoe of rim and terraces around a lava lake, islands in the lake as mid". A
single horseshoe cannot survive the 180° turn (a "C" turned half round is a "Ɔ"), so the shape is **one horseshoe per
team, mouth to mouth across the lake**:
- Each half is a **U** of terraces stepping down the caldera wall round its end of the lake. The bottom of the U is
  the team's works (Casting Hall, Yard, Moulding Terrace, Lakefront). The two arms are its **horns**, the flanks that
  run along the lake's long sides.
- **The horns are unequal.** Each team's left horn is long: it runs to the halfway line and ends at a **Point**
  (Alpha's East Point at z −4 … +2). Its right horn is short and ends at z −10. Turned 180°, Bravo's long horn is on −X
  and its short horn on +X.
- **The breaches.** Where a long horn meets the other team's short horn, the caldera wall is breached by a **spillway**:
  a gorge where the lava pours out of the caldera over a lip, at the surge, as a lavafall. The east spillway is at z +2
  … +10 (on Bravo's half), the west one at z −10 … −2 (on Alpha's half).

From above, the outline is a long barrel, widest along the lake (x ±34) and narrowing to the two works (yards ±25,
Casting Halls ±16). It is broken at two diagonally opposite gaps, and its middle is a void: the lake, with an island in
it. It is unlike the other two batch-5 stages: Bluestone is a skewed X, and the aquarium is three solid round courts in a
row. It is also unlike the existing set: Craters is a solid stadium, Spirhalite and Terraces are S shapes, Treehills is
a diamond, and Calamari, Halyard and Crossmarket are bands. Its silhouette changes during the match, too: at the ebb
the middle is a black floor ringed by quays, and at the surge it is a glowing lake with an island.

**Footprint.** Playable x −34 … +34, z −69 … +69. `bounds` { minX −35, maxX 35, minZ −72, maxZ 72 }. About 6,800 m² of
floor at the ebb, including 774 m² of Casting Floor and 128 m² of sills that drown at the surge. Outside the playable
area: the caldera's basalt cliffs (scenery, off-limits) on the long sides, the Casting Halls running back out of play,
and the spillway gorges.

### 2.2 Heights, and what a 1.8 m climb means

| height | what |
|---|---|
| lava **−1.6** (ebb) ↔ **+0.9** (surge) | the lake. −1.6 is also the world's death plane. |
| **+0.9** | **the high mark**: the stain line on everything the lava can reach |
| **0.0** | the Casting Floor (the low ring round the island), the two sills: **drowned at the surge** |
| **1.3** | the Lakefront and the horns' quays, Gauge Island, the causeways, the Pour Bridges; the Ladle Lifts at the ebb; the Pumice Race stones at the surge |
| **1.9** | the Pour Floor (the plinth under the Surge Gauge) |
| **2.4** | the Moulding Terrace and the horns' terraces, the Points, the footbridges, the spillway bridges |
| **3.8** | the Yard, the Surge Office bastion, the Gauge Post roofs; the Ladle Lifts at the surge |
| **4.8** | the spawn gallery |

Each tier is 1.1–1.4 m above the next, so every edge can be hopped (a kid climbs about 1.8 m) unless the architecture
closes it. Where an edge is meant to be defended, the architecture closes it:
- **The Yard's front (3.8 over 2.4)** carries a cast-iron railing (`rail`, 1.0 m): 2.4 m from below, so it cannot be
  climbed. Defenders can hop onto the railing and drop down. Ways up: the Surge Steps, the ladle incline, the Office
  stair and the Cupola stair.
- **The Moulding Terrace's front (2.4 over 1.3)** carries a basalt parapet (0.9 m, solid cover): 2.0 m from below, so
  it cannot be climbed either. Ways up: the West Steps, the Surge Steps and the East Steps, plus two 2 m slots in the
  parapet (at x −20 and x +6) where a hop works.
- **Open edges, hop anywhere**: the Lakefront and quays ↔ the Casting Floor (1.3, at the ebb), Gauge Island ↔ the
  Casting Floor (1.3), the island ↔ the Pour Floor (0.6), the spawn gallery's front (1.0, down only for the enemy:
  the spawn barrier).
- **Walls (≥ 1.9)**: a Ladle Lift at the surge, seen from the island (2.5 m: ink it and swim up); a Point's lake face
  from the Casting Floor (2.4); the Pumice Race slot from inside at the ebb (fenced, see §3).
- **Off-limits tops (`roof`)**: every building, the Surge Gauge above its piers, the Ladle Bay roof, the cranes, the
  cupola, the mould stacks and ladle stands on the Casting Floor, the sand mill, the caldera cliffs.

### 2.3 The plan in ASCII (Turf War, at the ebb)

Legend:

| char | meaning |
|---|---|
| `,` | **Casting Floor and sills, 0.0: drowned at every surge** |
| `~` | lava at all times (tap pools, spillway chutes) |
| `x` | **Pumice Race**: a fenced lava slot at the ebb; its four stones float up to 1.3 at the surge |
| `L` | **Ladle Lift**: 1.3 at the ebb, 3.8 at the surge |
| `.` | 1.3: Lakefront, horn quays, Gauge Island, causeways, Pour Bridges |
| `:` | 1.9: the Pour Floor |
| `T` | the Surge Gauge's four piers |
| `=` | 2.4: terraces, Points, footbridges, spillway bridges |
| `#` | 3.8: the Yard, the bastion, the Gauge Post roofs |
| `S` | 4.8: the spawn gallery. `P` is the pad |
| `/` | stairs and ramps |
| `B` | buildings (off-limits roofs) |
| `o` | solid cover ≥ 0.9 m |
| blank | the caldera wall, the Casting Halls running back, out of play |

```
       x: -35       -25       -15        -5 0  5        15        25       35
  -72                     BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB                     ALPHA: Casting Hall (gable to the lake)
  -70                 BBBBBBBBBSSSSSSSSSSSSSSSSSSSSSSBBBBBBBBB                 spawn gallery (4.8)
  -68                 BBBBBBBBBSSSSSSSSSSSSSSSSSSSSSSBBBBBBBBB
  -66                 #########SSSSSSSSSSPPSSSSSSSSSS#########                 pad (0, 4.8, -64)
  -64                 ######///SSSSSSSSSSSSSSSSSSSSSS//#######                 side stairs to the side yards
  -62                 #########SSSSSSSSSSSSSSSSSSSSSS#########
  -60                 #########SSSSSSSSSSSSSSSSSSSSSS#########
  -58                #################////////#################                Gallery Stair
  -56              #####################################BBBBB####              THE YARD (3.8): weighbridge office E
  -54            #######################################BBBBB######
  -52            #########oo#######################oo##############            casting stacks, crane legs
  -50            #############################################oo###
  -48            #oo###################################BBBB########
  -46            #####BBBBBBBBB###############oo#######BBBB########            Surge Office W, cupola furnace E
  -44            #####BBBBBBBBB####################################
  -42            ##################################################
  -40      =BBBBBB////#########=///==//////////===BBBBBBBB====////ooooo==      yard railing; Office stair, incline,
  -38    ===BBBBBBBBB===========///===============BBBBBBBB========ooooo====      Surge Steps, Cupola stair; bastion
  -36   ====================================================================   MOULDING TERRACE (2.4)
  -34   =======oo===========================================================   the ladle rail runs along z -34
  -32   =========================================================oo=o=======
  -30   ======................///....//////////............///........======   parapet; West / Surge / East Steps
  -28   ======................///....//////////...ooo......//oo.......======   ladle car in the side zone
  -26   ==oo==........................................................======   THE LAKEFRONT (1.3)
  -24   ======........................................................======   Slag Bank W / Crane Walk + Ladle Bay E
  -22   ======...............,,,...,,,,......,,,,,,,,,,...............====oo
  -20   ======...........~~~~,,,...,,,,......,,,,,,,,,,,,.............======   CASTING FLOOR (0.0), tap pools
  -18   ======.......oo.,~~~~,,,...,,,,......,,,,,~~~~,,,,oo..........======   Pour Bridge W, South Causeway
  -16   ======.......,,,,,,,,,,,...,,,,......,,,,,,,,,,,,,,,,,........====oo
  -14   ==oo==.....,,,,,,,,,,,,,...,,,,......,,,,,,,,,,,,,,,,,,,,o...o======   portal crane legs on the Crane Walk
  -12   ======.....xxx,,,,,,,,,,...,,,,......,,,,,,,,,,,,,,,,,,,,.....======   PUMICE RACE starts at the Moorings
  -10  ~~=====,,,,,xxxxx,,,,,,,......................,,,,,,,,o,,,.....======   WEST SPILLWAY: chute, sill, bridge
   -8  ~~=====,,,,,,,,,xxxxx,....oo..............oo....,,,,,,,,,,.....======   GAUGE ISLAND (1.3)
   -6  ~~=====,,,,,,,,,,,xxx.........::::::::::.........LLLLL,,,,///..======   Lift A, Point Steps
   -4  ~~=====,,,,,,,,,,,,,,.........:T::::::T:.........LLLLL,,,,======####=   POUR FLOOR (1.9) + Surge Gauge piers
   -2   ====================//.......::::::::::......///===========oo==####=   EAST POINT + Gauge Post E
    0   =####==oo==,,,,LLLLL.........::::::::::......///====================   footbridges to both Points
    2   =####======,,,,LLLLL.........:T::::::T:.........,,,,,,,,,,,,,,=====~~   EAST SPILLWAY: sill, bridge, chute
    4   ======.///.,,,,LLLLL............................xxx,,,,,,,,,,,=====~~   Lift B; Bravo's Pumice Race
    6   ======.....,,,,,,,,,,....oo..............oo....,xxxxx,,,,,,,,,=====~~
    8   ======.....,,,o,,,,,,,,......................,,,,,,,xxxxx,,,,,=====~~
   10   ======.....,,,,,,,,,,,,,,,,,,,,......,,,,...,,,,,,,,,,xxx.....=oo===
   12   oo====o...o,,,,,,,,,,,,,,,,,,,,......,,,,...,,,,,,,,,,,,,.....======
   14   ======.......,,,,,,,,,~~~~,,,,,......,,,,...,,,,,,,,,,........======
   16   ======..........oo,,,,~~~~,,,,,......,,,,...,,,~~~~,.oo.......======
   18   oo====............,,,,,,,,,,,,,......,,,,...,,,,,.............======
   20   ======........................................................======
   22   ======........................................................==oo==
   24   ======........................................................======
   26   ======.......oo//.....ooo....//////////....///................======
   28   ====================================================================
   30   =======o=oo==========oo======================oo=====================
   32   ===========================================================oo=======
   34   ====================================================================
   36    ===ooooo=////====BBBBBBBB===//////////=///============BBBBBBBBB===
   38      =ooooo=////====BBBBBBBB===//////////=///==#########///BBBBBBB=
   40            ####################################BBBBBBBBB#####
   42            ####################################BBBBBBBBB#####
   44            ########BBBB#######oo###############BBBBBBBBB#####
   46            ########BBBB###################################oo#
   48            ###oo#############################################
   50            ##############oo#######################oo#########
   52            ######BBBBB#######################################
   54              ####BBBBB#####################################
   56                #################////////#################
   58                 #########SSSSSSSSSSSSSSSSSSSSSS#########
   60                 ######///SSSSSSSSSSSSSSSSSSSSSS//#######
   62                 ######///SSSSSSSSSSPPSSSSSSSSSS//#######                 BRAVO (the 180° turn)
   64                 #########SSSSSSSSSSSSSSSSSSSSSS#########
   66                 BBBBBBBBBSSSSSSSSSSSSSSSSSSSSSSBBBBBBBBB
   68                     BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
   70                     BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
```

Notes on the plan:
- At the surge, every `,` cell is lava, the `x` slots carry stepping stones at 1.3, and the `L` blocks stand 2.5 m
  above the island as lookouts. The rest is unchanged.
- Each `=` strip over a `,` area at the spillways is a spillway bridge, 2.0 m above the sill (you walk under it on the
  sill at the ebb). The `=` strips at z −1 … +2 and z −2 … +1 are the footbridges, also 2.0 m above the Casting Floor.
- Areas measured from this plan: the lake basin 1,772 m², Gauge Island 528 m², the Casting Floor 774 m², the sills
  128 m², the Lakefront plus horn quays 668 m² per half, the Moulding Terrace plus horn terraces 996 m² per half, and
  the Yard about 1,000 m² per half (outside the gallery and buildings).

### 2.4 The pieces

**Single pieces (the centre, self-symmetric)**

| piece | centre x / z | size | floor | purpose |
|---|---|---|---|---|
| **Gauge Island** | 0 / 0 | octagon 28 × 20 m (4 m chamfers): (±14, ±6), (±10, ±10) | 1.3 | Mid. The island everyone fights over. Basalt sides with the stain ring at 0.9, tuff flagstones on top. |
| **Pour Floor** | 0 / 0 | 10 × 10 m | 1.9 (a 0.6 step) | The plinth under the Surge Gauge: cast-iron plates stencilled POUR FLOOR. Centre zone, Bazookarp Pond, tower start. Hop on from anywhere. |
| **Surge Gauge piers** ×4 | (±3.6, ±3.6) | 1.2 × 1.2 m, basalt to 7.0, then iron lattice | — | Cover inside the centre zone. Above 7 m the landmark (§5.1). Clear 6.1 m above the Pour Floor (the tower's 3.72 m headroom). |
| Ingot stacks ×4 | (±3, ±8) | 1.2 × 1.2 × 1.0 m | 1.3 | Low cover at the causeway landings, outside the tower's lane (x ±1.25). |
| Stilling-well drums ×2 | (−8, −7.5), (8, 7.5) | d 2.2 m × 1.6 m | 1.3 | The gauge's float wells: round iron drums. Cover in the island's quadrants. |
| Ladle stands ×2 | (8, −7.5), (−8, 7.5) | 1.6 × 1.6 × 2.0 m | 1.3 | An iron cradle holding a ladle at chest height. Cover in the other two quadrants. |
| **The basin** (lake) | 0 / 0 | octagon 46 × 42 m: (±13, ±21), (±23, ±13) | floor 0.0 | Its floor is the Casting Floor at the ebb and the lava lake at the surge. |

**Alpha's half (Bravo's is the 180° turn)**

| piece | centre x / z | size | floor | purpose |
|---|---|---|---|---|
| **Spawn gallery** | 0 / −63.5 | 22 × 11 m (x ±11, z −69 … −58) | 4.8 | The Casting Hall's front gallery, open to the sky. Pad (0, 4.8, −64), barrier 4.2. |
| Casting Hall | 0 / −70.5, running back out of play | 32 m wide | roof | The South Works' main hall: gable to the lake, works clock, sawtooth roof. Its side wings (x ±11 … ±20, z −69 … −66) are buildings too. |
| Gallery Stair | 0 / −56.75 | 8 × 2.5 m | 4.8 → 3.8 | Spawn exit 1 (forward). |
| Gallery side stairs ×2 | (±12.25, −62.5) | 2.5 × 3 m | 4.8 → 3.8 | Spawn exits 2 and 3, into the side yards. The gallery's front edge is also a 1.0 m drop. |
| Side yards ×2 | (±15.5, −62) | 9 × 8 m | 3.8 | Room to re-form beside the gallery. Pallets of drain grates, a fork-lift. |
| **The Yard** | 0 / −48 | x ±25, z −58 … −40, corners cut | 3.8 | The dispatch yard: the defenders' apron and the Bazookarp Gate. Railing along its front (z −40). |
| Surge Office | (−15.5, −43.5) | 9 × 5 m, roof 8.5 | roof | The works' nerve centre. The **Surge Board** (7 × 2.5 m) is on its lake face above the bastion. |
| Bastion (office balcony) | (−15.5, −38.75) | 9 × 2.5 m | 3.8 | The Yard pushed forward over the terrace. High ground over the Lakefront. Solid parapet 0.9. |
| Cupola furnace | (15, −46) | r 2.2 m, stack to 15 m | roof | The iron melter, sparks at its hood. A landmark from the lake and big cover on the Yard's east side. |
| Weighbridge office | (16.5, −54) | 5 × 4 m, 3.2 m tall | roof | Cover by the gallery's east stair. The weighbridge plate (flush, a decal) runs at x 7 … 13. |
| Yard crane legs ×4 | (±19, −44), (±19, −54) | 1.2 × 1.2 m | — | Cover. The crane's girder is at 9.5 m (off-limits) with a hook block hanging over a stack. |
| Casting stacks | (5, −45) manhole covers 2 × 1.6 × 1.1; (−15, −51) lamp-post rack 5 × 1.2 × 1.2; (10, −51), (21, −49), (−23, −47) bollard pallets 1.6 × 1.6 × 0.9 | — | 3.8 | Cover every 6–8 m on the Yard. |
| Surge Steps, upper flight | 0 / −38.5 | 10 × 3 m | 3.8 ↔ 2.4 | The central way between the Yard and the terrace. |
| **Ladle incline** | (−8, −38.25) | 3 × 3.5 m ramp (22°) | 2.4 → 3.8 | The ladle rail's ramp onto the Yard (the tower's way up). Also a way in. |
| Office stair | (−21.75, −38.75) | 3.5 × 2.5 m | 2.4 → 3.8 | Up onto the bastion at its west end. |
| Cupola stair | (22, −38.5) | 4 × 3 m | 2.4 → 3.8 | Up onto the Yard's east side. |
| **Moulding Terrace** | 0 / −34.5 | x ±34, z −40 … −29, corners cut | 2.4 | The works' long terrace. The **ladle rail** (flush rails in the floor) runs along it at z −34. |
| Pattern Shop | (−25.5, −37.75) | 9 × 4.5 m | roof | Timber-and-iron shed full of wooden casting patterns. Crates of patterns outside (cover). |
| Firebrick Store | (12, −38) | 8 × 4 m | roof | Pallets of buff firebrick outside (cover). |
| Sand mill | (27, −38) | 5 × 3 m, 1.6 m | roof | A muller pan with two iron wheels under a lean-to. Cover. |
| Terrace parapet | along z −29, x −28 … 28 | 0.9 m tall, 0.5 m thick | — | Cover for defenders, a 2.0 m wall from the Lakefront. Gaps at the three stairs and two 2 m slots (x −20 and x +6). |
| Pattern crates | (−12, −31.5), (12, −31.5) | 2.4 × 1 × 1.2 m | 2.4 | Cover in front of the ladle rail. Plus (−26, −33), (24, −31.5), (26.5, −31). |
| West / Surge / East Steps | x −12 … −9; −5 … 5; 17 … 20, all at z −29 … −26.5 | 3 m / 10 m / 3 m wide | 2.4 ↔ 1.3 | The ways up from the Lakefront. |
| **The Lakefront** (south quay) | 0 / −25 | x ±28, z −29 … −21, plus the fill along the basin's chamfers | 1.3 | Alpha's shore of the lake: mooring bollards along the edge, the Tide Board at the causeway head. The side zone. |
| Ladle car | (10, −27.6) | 3 × 1.6 × 2.0 m | 1.3 | A ladle on a bogie, on short rails. Cover inside the side zone. |
| Sand pile, bollard pairs | (20, −27.5) sand heap 1.6 × 1.6 × 1.2; bollards 0.7 m every 5–6 m along the lake edge | — | 1.3 | Cover and edge dressing. |
| **South Causeway** | 0 / −15.5 | 6 × 11 m (x −3 … 3, z −21 … −10) | 1.3 | The centre lane: a basalt causeway with bollards, open to the lava on both sides. The tower's track. |
| **Pour Bridge W** | (−8.5, −15.5) | 3 × 11 m (x −10 … −7) | 1.3 | The second centre route: a riveted iron deck on two piers. 0.95 m under it at the ebb, so squids can pass under and kids go over. |
| Tap pools ×2 | SE (10, −16.5), 4 × 3 m; SW (−15, −17.5), 4 × 3 m | — | lava always | Where the crews dip the ladles. Fenced with a 1.0 m railing (`rail`). They break up the Casting Floor. |
| Casting Floor cover | (6.5, −14) 2 × 1.6; (17, −17.5) 1.6 × 1.6; (19.5, −9) 1.6 × 1.6; (−20, −17) 1.6 × 1.6; (−5, −16) 1.2 × 1.2 | 1.6–2.0 m tall, `roof` tops | 0.0 | Mould stacks and ladle stands. At the surge they stand out of the lava with the stain ring round them. Nobody stands on them. |
| Pig beds | the Casting Floor's open stretches | flush rows of ingot moulds | 0.0 | They glow dull red for 10 s after each fall (they just took a pour), then cool. |
| **Ladle Lift A** | (16.5, −3.5) | 5 × 5 m | 1.3 ↔ 3.8 | The rising lookout beside the island (§3). A 0.9 m bulwark on its south and east sides; open on its north side (the footbridge) and its west side (the island). Two guide columns at (19.6, −5.5) and (19.6, −1.5), 0.6 m square, up to 7.5 m. |
| **East Footbridge** | (18.5, 0.5) | 9 × 3 m deck (x 14 … 23, z −1 … 2) + stair onto the island (x 11.5 … 14) | 2.4 | The long horn → mid. Lattice girder sides (`rail`). Runs along Lift A's north side (hop onto the risen lift). |
| **Crane Walk** (east horn quay) | (25.5, −16.5) | x 23 … 28, z −29 … −4 | 1.3 | Alpha's left flank at quay level, along the lake. Tower checkpoint 1. |
| Portal crane | legs (23.3, −13), (27.7, −13), each 0.6 × 2 m | portal beam at 5.5 m | — | A jib crane on rails straddling the quay. Its legs are cover; you walk under the portal. |
| Point Steps | (25, −5.25) | 3 × 2.5 m | 1.3 → 2.4 | The Crane Walk up onto East Point. |
| **Ladle Bay** (east horn terrace) | (31, −16.5) | x 28 … 34, z −29 … −4; roof at 7.0 over z −24 … −6 | 2.4 | A long open-fronted shed where ladles are relined: a covered flank lane. Columns at x 28.3, z −24 / −18 / −12 / −6. Ladles on their sides at (33.1, −20) and (33.1, −14), 1.8 m. The tower rides through it. |
| **East Point** | (28.5, −1) | 11 × 6 m (x 23 … 34, z −4 … 2) | 2.4 | The long horn's tip at the halfway line, where the footbridge and the spillway bridge meet. |
| Gauge Post E | (31, −1.5) | 4 × 4 m stone hut, roof deck at 3.8 with a railing | 3.8 | The old surge-watcher's hut. Its roof is a 1.4 m hop from the Point, with two steps on its south side. High ground over the east spillway and the footbridge. |
| **East Spillway Bridge** | (30.5, 6) | 5 × 8 m (x 28 … 33, z 2 … 10) | 2.4 | Alpha's left flank across the breach onto Bravo's Slag Bank. Riveted girders (`rail`). 2.0 m under it is the east sill. Its turn is the West Spillway Bridge at (−30.5, −6). |
| **Slag Bank** (west horn terrace) | (−31, −19.5) | x −34 … −28, z −29 … −10 | 2.4 | Alpha's right flank, the short horn. Slag cakes (−31, −24) 2 × 2 × 1.5 and (−32, −16) 2 × 1.6 × 1.2, and a slag pot on its tipping cradle at (−30.5, −12), 2.2 m. |
| **Pumice Moorings** (west horn quay) | (−25.5, −19.5) | x −28 … −23, z −29 … −10 | 1.3 | Where the Pumice Race starts. Big iron mooring bollards with chains running to the stones, a winch house. Bollards (−26, −14), (−24, −26). |
| **Pumice Race** | from (−23, −11.5) to (−14, −4.5) | a 3.0 m slot, 11.4 m long, fenced (0.6 m `rail`) | lava | Four pumice stones, 2.0 × 2.4 × 0.9 m (turned along the slot), centred at (−21.47, −10.31), (−19.49, −8.77), (−17.51, −7.23), (−15.53, −5.69). 0.5 m gaps between them. Their tops rest at −0.6 at the ebb and float to 1.3 at the surge. |
| **West Sill** | (−27, −6) | x −31 … −23, z −10 … −2 | 0.0 | The west spillway's stone sill: an ebb-only pocket under the West Spillway Bridge. Its lip at x −31 has a chain fence. Beyond it the chute (lava). |

### 2.5 Lanes, flanks and routes

**The three lanes from Alpha's base** (Alpha faces +Z; its left is +X):
- **Centre: the Surge Steps.** Gallery → Yard → Surge Steps (upper) → Moulding Terrace → Surge Steps (lower) →
  Lakefront → South Causeway → Gauge Island. Beside it, the **Pour Bridge** (x −8.5) is a second, parallel crossing
  from the Lakefront's west half straight into the island's south-west.
- **Left: the long horn.** Yard east → Cupola stair → the terrace's east end → either the **Ladle Bay** (2.4, covered)
  or down the East Steps to the **Crane Walk** (1.3, along the lake under the portal crane) → **East Point** at the
  halfway line. From the Point: the **East Footbridge** into the island's east face (beside Lift A), or the **East
  Spillway Bridge** across the breach onto Bravo's short horn (its Slag Bank) and on round Bravo's works.
- **Right: the short horn.** Yard west → Office stair / bastion → Pattern Shop end of the terrace → the **Slag Bank**
  (2.4) or the **Pumice Moorings** (1.3) → the horn's tip at z −10. From there: the **West Spillway Bridge** onto
  Bravo's long horn (its West Point, where Bravo's footbridge reaches the island's west face), or, at the surge, the
  **Pumice Race** straight across to the island's west face.

**Ways into mid.** At the surge, Gauge Island has eight ways in: 2 causeways, 2 Pour Bridges, 2 footbridges and 2
Pumice Races. They meet the island at the south, south-west, east, west, north, north-east and the two race corners.
At the ebb, add every edge: the island stands 1.3 m above the Casting Floor all round, so you can hop up anywhere.

**Flank routes per side (Alpha going toward Bravo).** Four real ones, meeting mid at different points:
1. Ladle Bay or Crane Walk → East Point → East Spillway Bridge → Bravo's Slag Bank (always open).
2. Crane Walk → East Point → East Footbridge → the island's east face (always open).
3. Slag Bank → West Spillway Bridge → Bravo's West Point → Bravo's footbridge → the island's west face (always open).
4. At the ebb, the Casting Floor round either side of the island, and the east sill onto Bravo's Pumice Moorings
   (ebb only). At the surge, the Pumice Race from the Moorings to the island's west face (surge only).

**How the lava changes the map**:

| | ebb (the lava is low) | surge (the lava is at the high mark) |
|---|---|---|
| Casting Floor (774 m²) | open: a low ring round the island, hop up onto the island or the quays anywhere | drowned |
| sills | open: ebb-only flank pockets under the spillway bridges | drowned; the lava pours over the lips (lavafalls) |
| Pumice Race | a fenced lava slot, in the way | four stones at 1.3: a surge-only road from each short horn to the island |
| Ladle Lifts | flush with the island (1.3): part of the plaza, with a 0.9 m bulwark ring | lookouts at 3.8 beside the island |
| who holds the high ground | the works' terraces and the Points look down into the caldera | mid: the lifts look down on everything round the lake |
| mid's shape | the island plus a wide low ring: open, many angles | an island in a lake: eight crossings, the lifts over it |

That swing is the stage's rhythm. At the ebb the rims dominate and mid is wide open. At the surge mid rises and the
fights are on the crossings.

### 2.6 Cover and dressing by area

Cover at least 0.9 m tall, about every 5–8 m (to be checked with `tools/botlab/tests/cover-map.js` at both lava
levels; target ≥ 90 % of floor within 5 m of cover, at the ebb and at the surge):
- **Gauge Island**: the four piers on the Pour Floor (3.6 m from the centre), ingot stacks at the landings, a drum or a
  ladle stand in each quadrant (8 m out), the lifts' bulwarks (ebb) or the lifts themselves (surge), bollard pairs at
  the causeway and bridge ends.
- **Casting Floor**: tap-pool railings (shots pass, bodies don't), mould stacks and ladle stands every 6–8 m, the
  Pumice Race fences, the footbridges' piers.
- **Lakefront**: the terrace parapet behind, the ladle car, the sand heap, bollards, the Tide Board post, the causeway
  head's bell post.
- **Horns**: the portal crane legs, the Ladle Bay's columns and ladles, the Gauge Post hut; the slag cakes, the slag pot,
  the Moorings' bollards and winch house.
- **Moulding Terrace**: the Pattern Shop, the Firebrick Store, the sand mill, pattern crates, firebrick pallets, the
  parapet.
- **Yard**: the Surge Office and bastion, the cupola, the weighbridge office, crane legs, stacks of castings, sand
  bunkers (0.8 m concrete bins) along the west side.

### 2.7 Spawn to mid (the Long Stages standard)

Straight line from the pad (0, −64) to the centre: **64 m**. Walking the central lane (gallery stair, the Yard,
both flights of the Surge Steps, the Lakefront, the causeway, the island): about 66 m, so about **5.6 s** swimming
straight and about 6 s on the nav graph. That is the standard's "about 60 m, about 6 s". Measure with
`tools/botlab/tests/spawn-mid.js` at blockout.

---

## 3. The gimmick: the Breath

### 3.1 The rules

**The lava level.** One number for the whole lake, a pure function of the synced stage clock:
- **Ebb: −1.6** (the lake sits in its tap pools, the Pumice Races and the spillway chutes; every floor is dry).
- **Surge: +0.9**, the high mark.
- **Rise and fall: 8 s each, at a steady 0.3125 m/s.** On the rise the lava reaches the Casting Floor (0.0) 5.1 s in.
  On the fall it leaves the floor 2.9 s in.

**Where it is.** The basin (the lake's octagon) plus the two spillways. Outside it nothing changes.

**Touching it.** Lava is the sea: a player whose feet go 0.05 m below the lava's surface inside the basin is splatted
(cause `lava`), credited to whoever damaged them in the last 4 s, exactly as a fall into the water is. Bombs that land
in it fizzle. Shots and squids pass over it.

**The hot-foot (the one grace).** When the rising surface reaches the feet of someone standing on a floor (not someone
who jumped or fell into it), they get one hot-foot per surge: an automatic hop of about 0.9 m, 25 damage and a sizzle,
so a player who was a second late still has a way out. After that, the normal rule applies.

**Ink.** The lava cooks ink off. As the rising surface passes a floor or a wall, everything below it is wiped to
neutral. A bright sizzle line with puffs of steam in the ink's colour runs along the waterline, using the clear-ink
wave's front (`src/fx/inkWipeFx.js`, `Paint.startWipe`), gated by height instead of by distance. Floors that come back
at the fall are clean black crust, ready to ink again.

**Turf.** Drowned cells count for nobody while they are under the lava. Exposed cells count normally. The lifts' decks
and the stones are moving blocks with their own ink (like the tower's deck and the sprout pods): you can swim and refill
on them, and they do not count for turf.

**Devices.** A sprinkler, beacon, Drip Curtain, Surf N' Turf buoy, Lurk Mine or skitter bomb that the lava reaches is
destroyed with a sizzle-pop, as if it had been shot. Devices on a lift ride it (the moving-floor rule from the `deploy`
package).

**The Ladle Lifts (the rising lookouts).** Two iron pontoons, 5 × 5 m, in guide frames against the island's east face
(Lift A, Alpha's side) and west face (Lift B, its turn).
- Deck height = clamp(lava + 2.9, 1.3, 3.8). They start rising the moment the lava does and take the whole 8 s to go
  up 2.5 m, at walking-pace slowness.
- At the ebb they are flush with the island: part of the plaza, with their 0.9 m bulwark (south and east sides) as
  cover.
- At the surge they are 2.5 m blocks with a 3.8 m deck: lookouts over the island, both causeways, the Lakefront, the
  side zones and the far crossings.
- Getting up at the surge, three ways:
  - ride one up (stand on it when the lava rises);
  - hop 1.4 m from the footbridge running along its north side;
  - ink its island-facing side and swim up 2.5 m.
- Its open sides drop safely: 1.4 m to the footbridge, 2.5 m to the island. Its bulwarked sides face the lava, so
  nobody walks off a lift into the lake by accident.
- Anyone on a lift rides up and down with it. The lift's body fills its well at every height, so nothing is ever
  under a lift.

**The Pumice Race (the floating rocks).** On each side, a fenced 3 m slot in the Casting Floor from a short horn's quay to
the island holds four pumice stones on chains.
- Stone top = max(−0.6, lava + 0.4). They lie at −0.6 (on stone stools in the slot, the lava 1.0 m below) until the
  lava passes −1.0, then float, and they reach 1.3 at the surge: level with the quay and the island, 0.5 m apart. A
  stepping path, a hop each.
- At the ebb the slot is fenced (0.6 m railing). A player who climbs in onto a stone can climb back out (1.2 m with the
  fence). Nobody can cross the slot at the ebb: it divides the Casting Floor on that side, and the way round is over
  the island or the quay.
- The stones bob a few centimetres and roll a degree or two for the eye only. Their colliders stay steady.

**The sills (the drowning flank pockets).** Each spillway's stone sill (0.0) lies under its bridge. At the ebb it joins
the Casting Floor to the short horn's quay beside it (a 1.3 m hop): an ebb-only flank. At the surge the lake pours
across it and out over the lip as a lavafall.

### 3.2 The cycle and its timeline

The same cycle in every mode (Boss Battle holds it at the ebb, §4.5). Times are seconds of play on the stage clock.

| phase | length | what happens |
|---|---|---|
| ebb | 29 s | everything open |
| **rise warning** | 10 s | bell and siren, the HUD counts down, the tap pools brim; in the last 3 s the Casting Floor's drain grates glow and spit sparks. The floor is still safe. |
| **rise** | 8 s | the siren winds up; the lifts and stones rise; the Casting Floor floods 5.1 s in, starting at the pools and spreading out |
| **surge** | 25 s (the last 6 s carry the fall warning) | the lake at the high mark; lifts up, stones afloat, lavafalls at both spillways |
| **fall** | 8 s | the siren winds down; steam; the floor comes back 2.9 s in |

One full cycle is 80 s. The first rise warning starts at 0:25 of play, so the first surge arrives about 40 s in. That
leaves the opening rush to mid on the open floor.

**Turf War, 3:00** (the clock shows time left):

| clock | phase |
|---|---|
| 3:00 – 2:35 | ebb: the opening, the whole caldera floor open |
| 2:35 – 2:25 | rise warning |
| 2:25 – 2:17 | rise (the floor floods at 2:20) |
| 2:17 – 1:52 | **surge 1**: lifts up |
| 1:52 – 1:44 | fall (the floor is back at 1:49) |
| 1:44 – 1:15 | ebb |
| 1:15 – 1:05 | rise warning |
| 1:05 – 0:57 | rise: the floor floods at exactly 1:00, as the final-minute music starts |
| 0:57 – 0:32 | **surge 2** |
| 0:32 – 0:24 | fall |
| 0:24 – 0:00 | **the final ebb**: the Casting Floor comes back wiped clean, 774 m² of fresh turf for the last 24 s |

**Turf War, 1:30**: ebb to 1:05, warning to 0:55, rise to 0:47, surge to 0:22, fall to 0:14, then the final ebb
(14 s).

**Zone Control, Tower Command and Bazookarp (5:00 + overtime)**: rises at 0:35, 1:55, 3:15 and 4:35 of play (surges
0:43–1:08, 2:03–2:28, 3:23–3:48 and 4:43–5:08). The fourth surge spans time-up, and overtime simply runs on along the
same clock.

### 3.3 The set pieces

1. **The flood of the Casting Floor.** The floor dishes very gently toward the tap pools and the races (0.0 at the walls,
   −0.3 at the pool kerbs, ≤ 6°). So the lava shows first in the pools, spills over their kerbs and spreads across the
   floor as a glowing front, reaching the walls about 1 s later, rather than appearing everywhere at once. Ink sizzles
   off ahead of it in coloured steam.
2. **The Ladle Lifts going up.** Chains clank over the pulley wheels at the top of the guide columns, the counterweights
   drop and the decks climb with whoever is standing on them. At the top, a ratchet clunk and the lift's amber lamp turns
   green.
3. **The Pumice Race floating.** The chains go taut one by one from the horn outward as each stone lifts off its stool.
   The stones knock together and settle in a line.
4. **The lavafalls.** As the lake tops the sills, both spillways pour over their lips into the gorges, glowing and
   steaming. Through the east one you see the cone; through the west one, the sea.
5. **The Surge Gauge.** Its float needle (a white disc with a black chevron, 1.6 m across) climbs 7 m up the scale on
   both faces, 2.8 times the lava's own movement. When it hits the ochre HIGH MARK band, the Surge Bell stops and the
   tower's beacons go steady.
6. **The fall.** The lake drains off the floor, leaving it glistening black and steaming. The pig beds glow dull red
   (they just took a pour) and cool to grey over 10 s. The stain ring on every wall is wet and bright for a moment.

### 3.4 What both teams do with it

- **Before a rise.** Get off the Casting Floor, or step onto a lift to ride it up. The team that holds the island when
  the bell rings gets the lookouts, so the 10 s warning is a fight for the lifts.
- **At the surge.**
  - The island is a fortress with two towers, but eight crossings lead into it.
  - Attackers take the causeway and Pour Bridge together, flank by the footbridges from the Points, and come up the
    Pumice Race from their short horn.
  - The Points' Gauge Posts and the Ladle Bay become the flank fights.
  - The Lakefront's edge is the front line: the lake is 0.4 m below it and knockback is lethal.
- **At the fall.** The island holders must come down off the lifts, and the floor comes back clean. That is the moment
  to push the low ring and paint it, or to take the island from below by hopping up its 1.3 m sides.
- **At the ebb.** The rims dominate: the Moulding Terrace's parapet, the bastion, the Points and the Gauge Posts look
  down into the caldera. Mid is wide and fluid; the low ring lets a team slip round the island to the other side.
- **Specials.** Inkjet and Zipline over the lake are fine; landing in it is not. A Kraken knocked off a causeway at the
  surge dies like anyone. Bombs rolled onto the Casting Floor at the ebb drown at the next rise.

### 3.5 How it is announced: rising and falling can never be confused

Rising is bright, loud and climbing. Falling is dark, hissing and sinking.

| cue | rising | falling |
|---|---|---|
| **the Surge Gauge** (visible from everywhere) | needle climbing | needle sinking |
| **the siren** | winds UP in pitch over the 8 s | winds DOWN in pitch over the 8 s |
| **the bell / whistle** | the Surge Bell tolls through the warning (3 slow strokes, then fast) | two short steam-whistle blasts at the fall warning, a long low "all clear" at the ebb |
| **the lava** | boiling: its glowing seams widen, bright bubbling rings, a frothy incandescent front where it meets floors, embers rising | crusting over: dark plates closing up, steam off every re-exposed surface, the floor glistening wet-black |
| **light** | the caldera's lava light swells (the lake's glow lights the island and the walls red, strongest at dusk) | the glow drains away |
| **beacons** | amber beacons turn on the Surge Gauge, the Points and the lifts' frames | beacons off; the lifts' lamps go back to amber |
| **the Surge Board** (on the Surge Office, both works) | `SURGE IN 0:10` … `RISING` | `EBB IN 0:06` … `FALLING` |
| **the Casting Floor** | drains glow and spit sparks in the last 3 s of the warning | pig beds glow and cool |
| **the volcano** (backdrop) | the cone puffs a dark ash burst, and a low rumble with a slight camera shake (0.05) as the rise starts | its plume pales back to white |

**HUD** (INKWAVE's voice: capitals with a sub-line):
- A small **lava gauge chip** beside the match timer: a vertical scale in the stain's ochre, a white needle at the
  current level, an ▲ or ▼ arrow while it moves, and the seconds to the next change. No team colours in it.
- Call-outs:

| when | call-out | sub-line |
|---|---|---|
| rise warning | `LAVA RISING IN 10` | `Off the casting floor!` (the number counts down) |
| rise | `LAVA RISING!` | `The lifts are going up` |
| surge reached (small) | `HIGH MARK` | `Stones afloat · lifts up` |
| fall warning | `LAVA FALLING IN 5` | — |
| fall | `LAVA FALLING` | `The casting floor opens` |
| ebb (small) | `EBB` | `Casting floor open` |
| your hot-foot (personal) | `HOT FOOT!` | `Get out of the lava` |
| splat feed | — | `<name> fell in the lava` / `<attacker> knocked <name> into the lava` |

- **Minimap and TAB map**:
  - During a rise warning, the Casting Floor and the sills hatch with ochre diagonal stripes.
  - At the surge they turn dark lava-red with a crisp outline, and the races' stones and the risen lifts are drawn.
  - The TAB map's diorama shows the real lake anyway.

### 3.6 Fairness

- **Warned every time.** 10 s before every rise (plus the 3 s of glowing drains), 6 s before every fall. The schedule
  never changes within a match, and the HUD chip always shows the seconds to the next change.
- **Nobody is trapped.** Every point of the Casting Floor is within about 5 m of a 1.3 m hop-up (the island or a
  quay), and the far corner of a sill is about 9 m from one. Nobody standing on drownable floor when the warning starts
  needs more than 2 s to leave, and they have 15 s. The hot-foot gives one last chance.
- **Nothing appears inside anyone.** The lifts and stones rise from below and carry whoever is on them. Nothing moves
  sideways into a player. The lava is a surface, not geometry.
- **Identical for both teams.** One shared lake and a 180° layout: each team's lift, race, horns and sill are the
  other's turned round.
- **Edges.** At the surge the island's, causeways' and quays' edges are 0.4 m above the lava, unrailed: the danger is
  visible and the same for both. The footbridges and spillway bridges are railed. The lifts' lava sides are bulwarked.
- **Objectives never drown.** Zones, the tower's track, the Bazookarp Pond, weirs and Gates all stand at 1.3 m or
  higher.

### 3.7 Bots

- **Avoid.** From the start of each rise warning until 1 s after the fall ends, the nav nodes on every drownable floor
  are marked blocked (the `stageKit` nav layers that the movers and pods use). Routes avoid them, and goals never pick
  them. A bot standing on them gets an evacuation goal: the nearest dry node. Nothing is hidden from bots: the schedule
  is on everyone's HUD.
- **Path with it.**
  - At the surge, the Pumice Race's stone-to-stone jump edges are switched on (from 0.5 s after the stones reach the top
    until 1 s before the fall).
  - During the surge the lava module marks a 0.6 m band along every drowned edge, so bots' combat strafing does not step
    off the island or the causeways.
  - For Bazookarp the Carp Field is rebuilt at each phase change (§4.4).
- **Use it.**
  - A bot within 8 m of a lift when the warning sounds, in a fight near mid, steps onto the lift to ride it up.
  - At the surge, a bot fighting near mid takes a risen lift the way the pods' canopies are taken: hop from the
    footbridge, or ink a column of its island face and swim up. It gets off when there is no reason to stay.
  - Bots flanking at the surge prefer the Pumice Race; at the ebb they prefer the Casting Floor.
- **Measure.** Lava deaths per bot per match (target under 0.3), stuck episodes on the floor during a rise, and lift
  use. A Mac mini A/B, gimmick on against off, gives the balance numbers.

### 3.8 Online

- The lava level, the lifts and the stones are a pure function of the host's stage clock (`stageKit.js`
  `StageClock`), the same as Calamari's trains. Every screen computes the same picture with no new records. A late
  joiner or a new host just reads the clock.
- Each client judges its own squidkids' lava deaths and hot-foots, and carries its own players on the lifts and
  stones (owner-authoritative, as with the trains and the pods).
- The ink wipe is deterministic by time and height. Splat records that land within 0.5 s of the waterline carry the
  painter's stage-clock time, so every screen accepts or drops the same cells (the approach the Bluestone era engine
  uses). A late joiner's imported paint grid already has the wipes in it.
- Practice sends the stage clock the way it does for movers and pods.

### 3.9 Engine sketch (one new module)

`src/game/lava.js` (`StageLava`), driven by `LAYOUT.lava`:

```js
LAYOUT.lava = {
  low: -1.6, high: 0.9,
  cycle: { first: 25, warn: 10, rise: 8, surge: 25, fallWarn: 6, fall: 8, period: 80 },   // s of play
  modes: { boss: 'ebb' },                       // 'run' (default) | 'ebb' (held low) | 'surge' (held high)
  basin: [poly, …],                             // where the surface is drawn and kills: the lake + both spillways
  stain: { y: 0.9, band: 0.15 },                // the high mark: the level shader's ring inside the basin
  dish: { pools: [[x, z, r], …], depth: 0.3 },  // (optional) the floor's gentle dish toward the pools
  mirror: true,
  lifts: [{ id: 'A', box: [14, 19, -6, -1], low: 1.3, high: 3.8, draft: 2.9,
            bulwark: { h: 0.9, sides: ['s', 'e'] }, mesh: { type: 'caldera_lift' } }],
  stones: [{ id: 'race-1', at: [-21.47, -10.31], size: [2.0, 0.9, 2.4], yaw: 52.1, rest: -0.6, freeboard: 0.4,
             mesh: { type: 'caldera_pumice' } }, …],   // four per race
  hud: true,
};
```

It reuses what exists:
- `StageClock` and the nav layers (`navClaim`, `navCommit`) from `stageKit.js`.
- The movers' dynamic blocks (`G.level.addDynamic` / `moveDynamic`), made vertical and carrying riders the way the
  tower carries its riders.
- `Paint.startWipe` and `inkWipeFx`, given a height gate.
- The bus events `lava:warn`, `lava:rise`, `lava:surge`, `lava:fallwarn`, `lava:fall` and `lava:ebb` drive the HUD and
  `karpField.rebuild()`.
- A level-material uniform carries the stain ring and the lava light.
- Its own SFX registration: the bell, the siren, the whistle, sizzles and chains.

Small tagged hook-ins (`[b5-lava]`):
- the actor's fall check (the lava kill and the hot-foot);
- `Paint` (skip and wipe drowned cells);
- the minimap tint;
- `bots.js` (evacuation, lift riding);
- the turf count (drowned cells excluded).

Dynamic blocks: 2 lifts × (deck + 2 bulwarks) + 8 stones = 14, fewer than Treehills' pods at full growth.

---

## 4. Every mode on this layout

One layout for every mode. The only mode-only piece is the Bazookarp dispatch train (§4.4).

### 4.1 Turf War

- The lava runs its cycle (§3.2). It wipes the ink on the Casting Floor and sills at every rise, and they count for
  nobody while drowned.
- Every match ends at the ebb. In 3:00 the floor comes back clean at 0:24 and in 1:30 at 0:14: a last scramble for
  fresh turf in the middle of the map. It is symmetric, and it rewards the team that holds mid as the lava falls.
- The final minute opens with the floor flooding (1:00) and the lifts going up: the stage's showpiece lands on the
  music's cue.

### 4.2 Zone Control

**Zones** (in `zones-data.js` format; the side zone is Alpha's, and Bravo's is its turn):

```js
caldera: {
  center: [{ poly: rect(-5, 5, -5, 5), y0: 1.7, y1: 2.1 }],   // the Pour Floor under the Surge Gauge (≈ 94 m² net of the piers)
  side:   { poly: rect(5.5, 16, -29, -21), y0: 1.1, y1: 1.5 }, // the Lakefront east of the causeway head (84 m²)
},
```

- **The centre zone** is the Pour Floor: flat, 0.6 m above the island, with the Surge Gauge's four piers inside it as
  cover. You can hop onto it from all four sides. High ground over it: the lifts at the surge (3.8), the footbridges
  (2.4), the Gauge Posts and the terraces across the lake. It is 0.7 m above the high mark, so it never drowns.
- **The side zone** is on Alpha's Lakefront, between the causeway head and the East Steps. The ladle car stands in it as
  cover.
  - Ways in: from the causeway (west), the Surge Steps (south-west), the East Steps (south-east), the Crane Walk (east),
    and at the ebb from the Casting Floor (north, a 1.3 m hop).
  - It is attacked from the terrace parapet behind it, the bastion, and Lift A at the surge, 14 m away.
  - Its centre is 27 m from the centre and 41 m from its own pad: close to mid, as the Long Stages rule wants.
- **The gimmick in this mode.** The cycle runs as usual, independent of the zone rotation. At the ebb the zones have
  more ways in from below; at the surge, fewer, and the lifts overlook both kinds of zone. Neither zone ever touches the
  lava.

### 4.3 Tower Command

**"The tower rides the ladle rail."** The rail is real in every mode: flush rails in the floor from the Pour Floor
along the causeway, the Lakefront and the Crane Walk, through the Ladle Bay, along the Moulding Terrace and up the ladle
incline into the Yard. The tower runs on it. Straight lines, square corners. Two checkpoints, so the track is about
twice a classic one (the user's rule: 10 s checkpoints, the track worth 80 points, 100 s to the goal).

Drawn as the data wants it, from the centre to Alpha's goal on Bravo's half (z > 0):

| # | from → to | length | floor | what |
|---|---|---|---|---|
| 1 | (0, 1.9, 0) → (0, 5) | 5 m | 1.9; a 0.6 m drop at z 5 | off the Pour Floor between the Surge Gauge's piers (1.75 m clear each side) |
| 2 | (0, 5) → (0, 24) | 19 m | 1.3 | across the island, the North Causeway, onto Bravo's Lakefront |
| 3 | (0, 24) → (−25.5, 24) | 25.5 m | 1.3 | along the Lakefront past the causeway head and Bravo's side-zone floor |
| 4 | (−25.5, 24) → (−25.5, 9) | 15 m | 1.3 | back toward mid along Bravo's Crane Walk, under the portal crane. **Checkpoint 1 at (−25.5, 11.5)**, s = 62 m (41 %), beside the lake |
| 5 | (−25.5, 9) → (−30.5, 9) | 5 m | a 1.1 m **climb** at x −28 | into the Ladle Bay between its columns (z 6 and 12) |
| 6 | (−30.5, 9) → (−30.5, 34) | 25 m | 2.4 | through the Ladle Bay under its roof (4.6 m clear) and round onto the Moulding Terrace |
| 7 | (−30.5, 34) → (8, 34) | 38.5 m | 2.4 | the ladle rail along the terrace, past the sand mill, the Firebrick Store and the foot of the Surge Steps. **Checkpoint 2 at (−27, 34)**, s = 98 m (65 %) |
| 8 | (8, 34) → (8, 52) | 18 m | up the ladle incline (z 36.5 → 40, 22°) to 3.8 | into the Yard. **Goal at (8, 3.8, 52)**, 14.4 m from Bravo's pad, outside the barrier, in full view of the gallery |

Total **151 m**; the speed is 151 / 80 ≈ 1.9 m/s. One rider takes 80 s of riding plus 2 × 10 s of checkpoints = 100 s.

```js
tower: {
  path: [[0, 1.9, 0], [0, 5], [0, 24], [-25.5, 24], [-25.5, 9], [-30.5, 9], [-30.5, 34], [8, 34], [8, 52]],
  checkpoints: [[-25.5, 11.5], [-27, 34]],
},
```

**Headroom** (3.72 m above the track's floor), all clear:
- the Surge Gauge's lowest brace at 8.0, 6.1 above the Pour Floor;
- the portal crane's beam at 5.5, 4.2 above the quay;
- the Ladle Bay roof at 7.0, 4.6 above its floor;
- the yard crane's girder at 9.5.

No footbridge or bridge crosses the track.

**Clearances that must be kept** (the reasons the pieces sit where they do):
- the causeway's bollards at its edges;
- the portal crane's legs (0.65 m each side of the lane);
- the Ladle Bay's columns and its ladles at the back wall (0.45 m);
- the sand mill (1.25 m from the corner);
- the lower Surge Steps' foot (1.25 m from the Lakefront run);
- the ingot stacks on the island (1.15 m).

**Headroom problems to watch**:
- the climb into the Ladle Bay must stay a plain 1.1 m face between columns (no stair there);
- the Lakefront run at z ±24 passes 1.25 m from the stair feet, so nobody may later move a stair north.

**The gimmick in this mode.** The track never touches drownable ground. The lava runs as usual, and the tower's
riders on the causeway and the Crane Walk ride with the lake 0.4 m below the edge at every surge. Riders knocked off
there land on the quay or the causeway, which are 1.25–1.75 m wide beside the lane. Nothing on the track moves, so
there are no Tower-only pieces and no `caldera.tower` lightmap.

### 4.4 Bazookarp

The data, in `bazookarp-data.js`'s convention (Alpha's attack on Bravo's half):

```js
caldera: {
  start: [0, 1.9, 0],                        // the Pond on the Pour Floor, under the Surge Gauge
  pondPlinth: { h: 0.6, r: 5 },              // (the Pour Floor is square, 10 × 10)
  weirs: [{ at: [0, 2.4, 32] }],             // on the Moulding Terrace between the two flights of the Surge Steps
  gate: { at: [0, 3.8, 52] },                // in the Yard, 12 m in front of Bravo's pad, a level below the gallery
  freeZones: [{ poly: rect(-11, 11, 58, 69), y0: 4.6, y1: 6.5,          // Bravo's spawn gallery beyond the barrier
                signs: [[0, 57.6, 0], [12.3, 62.5, 90], [-12.3, 62.5, -90]] }],
  routes: {
    centre: [[0, 10], [0, 21], [0, 26.5], [0, 37], [-11.5, 44], [-11.5, 48], [0, 52]],
    pour:   [[8.5, 10], [8.5, 21], [10.5, 26.5], [10.5, 29], [0, 32]],
    // the east footbridge → East Point → the East Spillway Bridge → Bravo's short-horn terrace (2.4) → the weir
    flank:  [[14, 0.5], [28.5, 0.5], [30.5, 6], [31, 20], [28, 32], [0, 32]],
  },
},
```

The route hints are waypoints; the checker measures the real routes.

**The mode-only piece: the dispatch train** (`onlyIn: 'bazookarp'`, mirrored like any half piece). Three flatcars stand on
the Yard's siding (whose rails are in the floor in every mode), loaded with lamp posts for the ferry.
- Each car is 7 × 2.6 m; together they run x −11 … 11 at z 44.4 … 47 (Bravo's half; Alpha's at −47 … −44.4).
- They are 2.2 m tall with `roof` tops: a wall no carrier hops or swims over.
- They shield the Gate, so a carrier must round their ends at x ±11.5. That gives the Gate its corner and lengthens
  the last approach: the research's "one level down, one corner".
- Lightmap variant `caldera.bazookarp`.

**The numbers against SPEC §9.1** (Carp Field walking metres, estimated from the plan; the checker confirms):

| requirement | this layout |
|---|---|
| L (Pond → Gate) 55–85 m | **≈ 67 m**: Pour Floor, island, causeway (21), Lakefront and lower flight (8), terrace (8), upper flight (3), round the train (27) |
| one weir at 40–55 % | weir at P ≈ 32 m, **48 %** (count 52) |
| last weir → Gate ≥ 20 m and ≥ 35 % of L | **≈ 35 m, 52 %** |
| two routes to the weir, the second ≤ 1.6× | causeway + lower flight ≈ 32 m; Pour Bridge + West Steps ≈ 43 m (**1.36×**); at the ebb also the Casting Floor (≈ 30 m) |
| two routes to the Gate | round the train's east end or its west end (equal); also via the ladle incline, the Office stair or the Cupola stair |
| 2–5 entrances into the Gate's 15 m ring, each seen from the gallery | **4**: the Surge Steps, the ladle incline, the Yard's west side (from the bastion), the Yard's east side (from the Cupola stair) |
| no hidden shortcut, no drop > 2.5 m into the ring | the Yard's front is railed except at the stairs; the only drops in the ring are the gallery's own 1.0 m |
| pad → Gate 12–20 m; ≥ 3 ways off the spawn deck; an apron | **12 m**; three stairs plus the front drop; the Gate court between the train and the gallery (22 × 8.5 m) |
| Gate y ≤ pad y + 0.2, in the ±40° cone, seen from the deck | 3.8 vs 4.8; on the axis; in front of the Gallery Stair |
| Pond at the exact centre, 360°, room round it | under the Surge Gauge; the piers block about 54° only beyond 5 m. Island plus causeways give 10–14 m of floor round the 4.5 m burst ring (at the ebb the Casting Floor adds more). |
| no unreachable high ground | every high spot is reachable on foot (Gauge Posts, bastion, lifts); everything else is `roof`. Only free zone: the gallery. |
| lava (SPEC §9.4) | Pond, weir and Gate all at ≥ 1.3; drop spots exclude the Casting Floor, the sills and the races; the free zone is not on a lava-only route |

**Routes and the gimmick.**
- Both phases always have the causeway and the Pour Bridge, so L never changes. The Carp Field is rebuilt at each phase
  change (`lava:rise` removes the floor's nodes, `lava:surge` adds the races' stones, `lava:fall` removes them,
  `lava:ebb` restores the floor). Best counts never rise.
- A carrier who falls or is knocked into the lava follows the fall rule by last footing (SPEC S25 and S26).
- A carrier may ride a lift. At the surge, a carrier on a risen lift has a 3.8 m perch for Carp Shots over mid. It is
  answerable from three sides and costs fuse time, because mid is not progress.
- The Pumice Races are flank roads at the surge: each one runs from a team's own short horn toward the island, so a
  carrier using the enemy's race is advancing.

**Expected carry times** (a carrier walks at 4.8 m/s):
- Pond → weir is about 7 s of walking. Contested, 15–25 s.
- Weir → Gate is about 7.5 s of walking round the train. Against a defence, 20–35 s.
- A first carry cannot knock out (the weir comes first), and a full push from the weir fits well inside the 60 s fuse.
- The design target is a median knockout after 2:30 (to be confirmed with 16 bot matches on the Mac mini).

### 4.5 Boss Battle: yes

- HULLBREAKER fights here with the lava **held at the ebb** (`modes.boss: 'ebb'`, like Calamari's trains being off):
  the lifts are down, the stones are low, the Casting Floor is open.
- Its home ground is the Casting Floor, the island and the Lakefronts. About 2,600 m² of connected floor at 0.0 and
  1.3, far above the 150 m² minimum.
- Its charges run across the low ring and the quays. The tap pools and races are railed, so the boss treats them as
  walls.
- To verify with a copy of `boss-check.js`: nav round the island's 1.3 m sides and the railings, and no long stuck
  episodes.
- A held surge would leave the boss an island and a lake. It would be spectacular, but it would trap it.

### 4.6 The gimmick per mode

| mode | lava | notes |
|---|---|---|
| Turf War | runs; ends at the ebb | drowned cells count for nobody; the final ebb |
| Zone Control | runs | zones on the Pour Floor and the Lakefront, never drowned |
| Tower Command | runs | the track at 1.3–3.8, never on drownable ground |
| Bazookarp | runs; field rebuilt at each phase | the dispatch train (mode-only); nothing rests on drownable ground |
| Boss Battle | held at the ebb | the boss roams the Casting Floor |

---

## 5. The look

### 5.1 Architecture and its story

The works were built to live with the lake, like a tidal harbour: everything stands on basalt, everything below the
high mark is armoured, and everything above it is iron painted in the works' own green.

- **The Surge Gauge** (the landmark, 22 m):
  - Four basalt piers on the Pour Floor rise to 7 m, where a riveted iron lattice takes over.
  - From 8 to 16 m, the gauge boards on its north and south faces: 2.4 m wide, painted with a scale (`EBB` · `1` ·
    `2` · `3` · the ochre `HIGH MARK` band) and the float needle riding a slot up the middle.
  - At 16–17 m, a louvred gauge house with a clock dial on each face.
  - At 17–20 m, the bell cage with the 1.6 m Surge Bell (it swings as it rings), two siren trumpets and four amber
    beacons.
  - A pyramid roof to 22 m, topped by a weathervane of a ladle pouring a flame.
  - At dusk the gauge boards are backlit, the needle glows and a lantern burns under the bell.
  - It can be seen from every spawn, every lane and the stage-select shot. Its silhouette is unlike every other
    INKWAVE landmark (the clock tower, the observatory dome, the obelisks, the solar canopy).
- **Gauge Island and the Pour Floor.** A basalt plug faced in dressed basalt blocks, with the stain ring at 0.9 m all
  round. Its top is tuff flagstones; the Pour Floor is cast-iron plates with the works' foundry mark (a ladle in a
  ring) cast in the middle. Iron bollards stand at the edges, with chain hanging between them along the island's
  faces.
- **The Ladle Lifts.** Round, riveted iron pontoons (the box collider wears a round, flared drum mesh) painted works
  green with `LIFT A` / `LIFT B` stencils and an ochre-and-black hazard band at the deck's lip. Each has two guide
  columns and a crosshead at 7.5 m with a big spoked pulley wheel and a counterweight: a little mine headframe. The
  pulley spins on the rise and the fall.
- **The causeways and Pour Bridges.** The causeways are basalt roads with ladle-rail tracks in their tuff paving. The
  Pour Bridges are riveted iron plate decks on two basalt piers.
- **The Casting Floor.** Glossy black lava-glazed stone with flush iron rail inlays, the pig beds (rows of ingot moulds
  in the floor), tap pools with iron kerbs and railings and a hanging chain hoist over each, and ladle stands and mould
  stacks.
- **The Pumice Race.** A slot lined in firebrick, fenced with iron posts and chains. Pale grey pumice stones, porous and
  pitted, flat-topped, each held by a chain to a mooring bollard on the horn. A `PUMICE RACE — KEEP CLEAR AT EBB` sign.
- **The Casting Hall** (spawn). A long basalt hall with a north-light sawtooth roof of iron and glass running back out
  of play, and two brick chimneys.
  - Its gable to the lake has a great round window glowing with furnace light, the works clock, and `HIGHMARK FOUNDRY`
    in cast-iron letters (`SOUTH WORKS` / `NORTH WORKS` under it).
  - The spawn gallery is the gable's iron balcony: cast balusters (`rail`) and two lamp standards. It is open to the
    sky, so no beam crosses the player's view.
- **The Yard.**
  - The overhead yard crane: two rail beams on legs, the bridge girder and the hook block.
  - The cupola furnace: a round firebrick-and-iron stack with a cone hood and a charging bridge, spitting sparks.
  - The weighbridge and its office.
  - **The Surge Office**: two storeys of basalt with iron window frames. The **Surge Board** on its lake face is a big
    split-flap board under a little canopy: `NEXT SURGE 0:42`, `RISING`, `HIGH MARK`, `FALLING`, `EBB`. Its balcony is
    the bastion.
- **The Moulding Terrace.**
  - The Pattern Shop: a timber-and-corrugated-iron shed, the one wooden building, kept high above the lake. Its door
    is open on giant wooden patterns of lamp posts and bollards.
  - The Firebrick Store, the sand mill under its lean-to, the ladle rail in the floor.
  - The parapet: basalt with a firebrick coping, high-mark notices fixed to it.
  - "THE TAP ROOM", the crews' tea hatch in the Pattern Shop's end wall: an urn, enamel mugs, a stack of lunch tins.
- **The horns.**
  - The Crane Walk's portal jib crane on rails.
  - The Ladle Bay: an iron shed open to the lake, ladles on their sides, firebrick pallets, a relining jig, aluminised
    heat suits on hooks.
  - East Point's stone Gauge Post hut with a hand-cranked siren on its roof railing.
  - The Slag Bank's black slag cakes, stacked like giant biscuits, and the slag pot on its tipping cradle.
  - The Pumice Moorings' winch house and bollards.
  - The spillway bridges: riveted girders with cast plates reading `SPILLWAY E` / `SPILLWAY W — NO STANDING DURING
    SURGE`.

### 5.2 Materials and palette

Three stage surfaces (texlib slots):
1. **Tuff flagstones**: pale warm-grey volcanic tuff (about `#a8a49e`) in big flags with dark joints. The quays,
   terraces, island and Yard. A middle-light neutral, so every ink pops on it.
2. **Basalt ashlar**: dressed dark blue-grey basalt blocks (about `#474c55`) with pale mortar. Walls, the causeway and
   island sides, building lower storeys. Cool and dark: ink on walls reads hard, and the lava's glow models it at dusk.
3. **Lava-glazed crust**: glossy near-black stone with a faint ropy (pahoehoe) texture (about `#1d1a1b`). Every
   drownable floor, and every face below the high mark inside the basin. Ink on it at the ebb is the loudest thing on
   the stage.

Shared patterns:
- iron in **works green** (a muted verdigris, about `#5d7a70`);
- **firebrick buff** (about `#c9b08a`) as a small warm accent on the cupola, the Pattern Shop's chimney and the copings;
- white stencils;
- **the stain ochre** (about `#b28a3c`, a desaturated sulphur): the high-mark line, hazard chevrons, the gauge's HIGH
  MARK band.

**The high mark (the user's stain).** A world-height band in the level material inside the basin and the spillways:
- below 0.9 m, the crust glaze (glossy black with oxidised streaks);
- at 0.9–1.05 m, a crisp ochre crust line like a bathtub ring;
- above it, the surface's own material.

Props inside the basin (piers, stacks, stands, bollards, the lifts' frames, the races' posts) get the same band from the
same uniform. The works also paint their own mark on every post they own: a white line at 0.9 with `HIGH MARK` beside
it. So you can read the line twice, as nature's stain and as the works' paint.

**Team ink stays the loudest colour.** Lava is orange, and so are the Tangerine, Cherry, Lemon and colourblind Sun inks.
The rules that keep them apart:
- **The lava is dark.** Its surface is mostly cooled crust in slowly drifting plates (`#2b1e1b` to charcoal), with
  glowing seams covering about 12 % at rest, about 30 % while rising and about 5 % while falling.
- **Only the seams glow.** They run from deep crimson (`#c23a14`) at the edge to orange to a near-white core
  (`#fff0c8`) in the brightest cracks, with bloom. The lava is never a flat bright orange sheet; ink always is.
- **The lava never takes ink**, and it only ever lives inside the basin, below the edges of the floors.
- **Everything else is quiet:** pale grey, dark basalt, black crust, muted green iron, a little buff and ochre. The only
  big saturated areas on screen are the inks.
- **At dusk** the lava light is a local light that falls off by the quays. The scene's ambient and the shadow tint stay
  cool blue, so ink keeps its hue under the red glow.
- To verify: pictures with all five palettes and the colourblind one, at the ebb and the surge, by day and at dusk.

### 5.3 Signage and working-life clutter

- **Signs** (murals): `HIGHMARK FOUNDRY · BELLOWS CALDERA · EST. 1931`, `SOUTH WORKS` / `NORTH WORKS`, `SURGE GAUGE`,
  `NEXT SURGE` (the board), `HIGH MARK — DO NOT STAND BELOW THIS LINE DURING SURGE`, `CASTING FLOOR — EBB ONLY`,
  `LADLE RAIL — MIND THE CARS`, `LIFT A` / `LIFT B`, `PUMICE RACE — KEEP CLEAR AT EBB`, `TAP 1` / `TAP 2`,
  `SPILLWAY E` / `SPILLWAY W`, `CUPOLA No. 1`, `PATTERN SHOP`, `DISPATCH — INKOPOLIS MUNICIPAL CASTINGS`, the Tide Board
  at each causeway head, and floor stencils (`POUR FLOOR`, the foundry mark, arrows to the stairs).
- **Clutter**, every piece with a collider where it is cover:
  - castings waiting for the ferry: stacks of manhole covers, rows of bollards, racks of lamp posts, bench ends, drain
    grates, a giant half-finished anchor;
  - sand-mould flasks, crucibles, tongs racks, wheelbarrows of moulding sand;
  - firebrick pallets, coke heaps, slag cakes, chain coils, hooks;
  - heat suits on pegs, a notice board with the surge timetable, enamel signs, gas bottles, sand buckets;
  - the crews' lockers, a bicycle rack, the tea urn.
  - Nothing on the Casting Floor is loose at the ebb: the crews know the lake.

### 5.4 The far backdrop, every side

We are inside a caldera high on a volcanic island, so the near ring is the caldera wall and the far world shows over it
and through the two breaches.
- **All round**:
  - the caldera wall in organ-pipe basalt columns, 12–30 m, with scree fans;
  - fumaroles steaming from ledges, small pale-sulphur crusts, ferns and moss in the wet cracks;
  - a line of power pylons along the rim carrying cable to the works.
- **North-east: the active cone, the Bellows Vent.** A young cinder cone about 150 m high and about 350 m away, centred
  near (220, 0, 160).
  - Rust-brown scoria with a glowing summit and a fissure. A lava river winds from its flank toward the caldera.
  - Its plume (white by day, lit pink above and red below at dusk) drifts west across the sky over the lake.
  - Alpha sees it ahead and to the right from the gallery; it fills the east spillway's gorge from mid.
- **South-west: the sea.** Over the lower west rim and through the west spillway, the outer slope falls away over black
  lava fields to the ocean.
  - The **ocean entry** where the spillway's lava meets the sea: a white steam plume and a black-sand cove.
  - Cinder Isle's ferry pier with the Inkopolis ferry, and the faint Inkopolis skyline on the horizon.
  - Bravo sees it ahead and to the right from its gallery: each team gets one great view.
- **South and north, behind each Casting Hall**: each works' company town on the rim.
  - Rows of basalt terrace houses with tin roofs and smoking chimneys, a water tower, a radio mast (its lamp blinks at
    dusk).
  - The South Works' funicular running down the outer slope; the North Works' cable car to the coast.
- `env`: `bay: false`, `edge: 'none'`, `boats: false`, `gulls: false`, `stars: true`. Steam `weather.mist` lying low
  over the lake: warm grey, thin, never hiding the floor.
  - The world's sea plane (the death plane at −1.6) is hidden under the caldera floor, the backdrop terrain and the
    spillway chutes' lava. The only sea you see is the far ocean in the backdrop.

### 5.5 Day and dusk

- **Day.** A clear, high, deep-blue sky (thin air); a sun high in the south-east (elevation about 45°) for hard, short
  shadows that model the basalt. The ground hemisphere is warm (the lava's bounce off the floor) and the sky fill is
  cool. A faint warm-grey volcanic haze at distance. The grade is slightly desaturated with cool shadows, so the inks
  and the lava's seams pop. The plume is white with a soft shadow.
- **Dusk.** A violet-to-indigo sky with the sun just set behind the west rim; the ocean holds the last orange; stars.
  - The lava becomes the key light: the lake lights the island, the Surge Gauge's legs and the caldera walls red from
    below, swelling at every rise. That makes the surge even more obvious at dusk.
  - The works' sodium lamps glow amber on the terraces; cool white floodlights on the cranes; the Casting Halls'
    windows glow orange; the Surge Gauge's boards are backlit; the cone's vent glows and spits sparks.

### 5.6 The intro fly-in and the stage-select hero shot

- **Intro** (about 5 s):
  1. Start high over the north-east rim beside the cone's plume, looking down into the caldera at the Surge Gauge.
  2. Sweep down and across the lake, low over the tap pools' glow and the black Casting Floor.
  3. Curve close past the gauge board as the bell swings once (the first toll, which also sets the match's mood).
  4. Pull back over the South Causeway, the Lakefront, the terraces and the Yard, and settle behind the player on the
     gallery.
  - In the current format: `intro: { from: [52, 34, 30], lookFrom: [0, 12, 0], toBack: 3.2 }`.
- **Stage-select hero shot** at the surge (an `art.lava: 'surge'` option, so the art shows the stage at its most
  spectacular): `art: { from: [-42, 30, -58], look: [6, 1, 6], fov: 56 }`. From high over Alpha's Pattern Shop,
  looking north-east across the whole caldera:
  - the Pattern Shop's roofs and the Surge Board in the foreground;
  - the terraces stepping down to the Lakefront;
  - the glowing lake with Gauge Island, the risen Lift B, the Pumice Race afloat and the Surge Gauge dead in the middle
    third;
  - the east spillway's lavafall right of centre;
  - the North Works' Casting Hall across the lake;
  - the Bellows Vent and its plume over the rim on the right.
  - Day and dusk versions.

### 5.7 What you see from each camera

- **From the spawn gallery (the `play` view).** Down the Gallery Stair over the Yard's cranes and stacks, the Surge
  Office roof and the cupola's sparks; the terraces stepping down; the lake; the Surge Gauge straight ahead with its
  needle; the other works' Casting Hall at the far end; the cone over the right-hand rim.
- **From mid.** The two Casting Halls facing each other at the ends of the lake; both works' terraces rising like the
  seats of a theatre; the caldera walls all round; the cone and the sea glimpsed through the two gorges; the bell and
  the gauge overhead.
- **From a flank.** The basalt cliff close beside you, the Ladle Bay's iron columns or the slag cakes, the lake to the
  other side, and the spillway with the outside world opening ahead of you.
- **From the air.** The two horseshoes, the lake, the island and the tower, the two diagonal breaches. At the surge a
  ring of fire, at the ebb a black floor with glowing holes.

---

## 6. The three biggest risks and how I would handle them

1. **It reads as "a bowl" or "a ring", and the lake eats mid.** A caldera is literally a bowl, two horseshoes face to
   face read as a ring, and the user has rejected "just a bowl" and empty stages before.
   - Nothing above the lake is bare: every terrace carries buildings and working clutter, and the cliffs stay outside
     play as a frame.
   - The outline is broken at two diagonal breaches with the outside world in them, and the two works' halls stand out
     at the ends.
   - At the ebb, the lake is a floor: mid is about 1,300 m² (the island plus the Casting Floor). At the surge it is a
     528 m² island with two towers and eight crossings.
   - Judge it at blockout from top shots, cover maps and the `play` view at **both** lava levels.
   - The levers if it still feels thin: shrink the basin to about 40 × 36 m (channels 6–8 m), or lift the Casting
     Floor's outer band to 1.3 so less of it drowns.
2. **Lava against orange, red and yellow ink, and the stage's loudness.** Glowing lava next to Tangerine, Cherry, Lemon
   and Sun ink, plus a red-lit dusk, could muddy who owns what.
   - The lava is a dark crust with thin moving seams and bloom, never a flat bright sheet.
   - It never takes ink and lives only inside the basin, below the floors' edges.
   - The stage's materials are neutral (grey, black, muted green), and the dusk lava light is local with a cool
     ambient.
   - Picture tests with every palette at both levels and both times are part of the first art pass.
   - The fallback is to push the glow toward crimson and cut the seam coverage. Performance (the lava shader, two
     lavafalls, steam) is checked against Halyard's budget in the same pass.
3. **The surge is unfair, confusing or swingy in play.** Lava deaths that feel cheap, bots stranded on the floor, lifts
   that become unassailable turrets, and a final-ebb turf swing.
   - 10 s warnings and the hot-foot; nav blocked from the warning, plus evacuation goals.
   - A lava-death metric in bot matches (target under 0.3 per bot per match) and in the user's playtest.
   - Lifts open on two sides with a 0.9 m bulwark, reachable three ways.
   - The Mac mini A/Bs set the surge length (25 s), the lift height (3.8, or 3.4 if they dominate) and the final-ebb
     length.
   - The engine risk (a vertical moving floor carrying riders) is solved once by reusing the tower's rider carry. If it
     proves fragile, the fallback is lifts that rise empty and are climbed like the pods' canopies.

---

## 7. First things to check at blockout

1. `spawn-mid.js`: about 6 s from both pads. Top shots and `play` at the ebb and the surge.
2. `cover-map.js` at both lava levels (≥ 90 % within 5 m).
3. `tower-check.cjs` with the path above: 0 holes, clearances, both rides to a knockout.
4. A first bot match per mode with the lava running: lava deaths, stuck episodes during rises, lift and race use.
5. The palette sheet: every ink on tuff, basalt and crust beside the lit lake, by day and at dusk.
6. `bazookarp-check.cjs` once it exists: L, the weir at 48 %, the routes at each phase, the Gate's entrances.
