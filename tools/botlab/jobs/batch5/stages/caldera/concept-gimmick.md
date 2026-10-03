# `caldera` concept: THE GIMMICK FIRST

One of three independent concepts for the `caldera` stage (batch 5). The user's words (REQUEST.md, "stages:"): *"an
active volcano, where the lava level falls and rises. areas that the lava can rise to should have an indicator at the
top of the lava level similar to how water can stain into rocks. the lava rises up and covers flank routes, brings
floating rocks with it, rises platforms in the middle that are used as lookouts, adds or removes new routes temporarily
etc. and it should be very obvious when the lava is falling or rising."*

My angle: I designed the lava's rhythm first, the moments it makes and what each one does to every route and every
objective, and only then drew the ground those moments need. Every piece in §2 exists because of a moment in §3.

Conventions:
- Metres and seconds. Alpha spawns at −Z, Bravo at +Z. Pieces are listed for **Alpha's half**. Bravo's are the 180°
  turn about the centre ((x, z) → (−x, −z)). Pieces on the centre are listed once and are self-symmetric.
- Alpha faces +Z, so **Alpha's left is +X (east)** and its right is −X (west).
- ASCII plans are true top-down views: +X to the right, +Z down the page, so Alpha is at the top. 1 character = 1 m
  across, 1 row = 2 m down.
- "Low" and "high" are the two lava levels. "Ledge" means any floor the lava covers at high.

---

## 0. The concept in ten lines

1. **Tidefire Caldera**: a summit crater whose lava lake *breathes*. Every 85 s it swells to the same line on the
   rocks, holds there, and sinks back. The 1931 geothermal station on the rim has lived by that rhythm for a century.
2. **The shape is a pinwheel of two crescents.** Each team's crescent of rim and terraces wraps one side of the lake,
   from its base to a horn tip deep in the enemy half. The lake sits in the middle with **the Anvil** as mid, and the
   lava pours out through two breaches between the horns and the bases.
3. **Low lava opens the edges.** Black ledges along the lake (the Fumarole Walks, the Black Flats, the Spillways) are
   walkable flank routes and a second way onto the Anvil.
4. **High lava closes the edges and lifts the middle.** The ledges drown. Ten **Tide Stones** surface as stepping stones
   across the two deep pools, a route that does not exist at low. The two **Organs**, clusters of basalt columns on the
   Anvil, grind up from 1.3 m to 3.8 m lookouts.
5. **The route into mid flips sides.** At low, each team's second way onto the Anvil is the Flats, to the left of its
   Causeway. At high it is the Tide Stones, to the right. The Causeways and bridges stay.
6. **The rhythm** is one fixed cycle: 10 s warning, 8 s rise, 24 s high, 8 s fall, 35 s low. The first warning comes at
   0:28 into the match. No surge starts that would end inside the last 12 s, so every match ends at low lava.
7. **You cannot miss it.** The Gauge (a 6 m dial hung over the Anvil) swings into its red band. The Breath Horn
   sounds. The lake bulges and spits, the spillways pour, the HUD meter counts down, the map hatches the ledges, and a
   pale **tide rind** marks the high line on every rock the lava reaches.
8. **Lava is the sea:** touching it splats you. Nobody is caught without warning: at least 13.8 s from the first
   warning until any ledge floods, and a way off every ledge within 9 m.
9. **Every objective is on ground that never floods.** The Pond, both zones, the tower track, the weir and the Gate.
   The lava changes how you reach them, never whether they exist.
10. **Biggest risk:** lava is orange and so is some team ink. The lava is mostly black crust with white-hot seams and
    only a hairline of orange, and that hairline turns crimson when a team is orange or red (§5.2).

---

## 1. Name and identity

**Name options**
1. **Tidefire Caldera** (preferred). It says exactly what the stage does: lava with tides.
2. **Emberbreath Summit**. Named for the cycle, which the station calls "the Breath".
3. **Cinderwell Caldera**. Named for the lake as a well of fire.

**Identity.** Tidefire is the summit crater of a lone volcanic island far out in the ocean. Its lava lake does
something no other lake does: it breathes. Every eighty-five seconds it swells up the crater walls to the same pale
line, holds there for a few heartbeats, and sinks back, regular as a tide. In 1931 the **Tidefire Geothermal &
Observatory Company** built on the rim. It taps the summit's steam through a wellfield of valve trees, separators and
a cooling tower that feed a basalt Powerhouse, and it keeps a domed observatory full of seismographs. The keepers chained
pumice **Tide Stones** across the lake as a ferry that only works at high lava. They also built **the Gauge** so nobody
on the summit would ever be caught by the Breath: two basalt piers on the lake's central island, the **Anvil**, carry an
iron truss with a great cream-and-black dial hung from it. The dial's needle is driven by iron floats that ride the lava
in cages on the piers. On the Anvil itself, two clusters of basalt columns, **the Organ Pipes**, heave up on the
swelling magma and settle back; the old keepers used them as lookouts. Today is Tide Day, the station's open day, and
the Turf War is on the visitor walk. **The landmark** is the Gauge's dial, visible from both spawns, its needle
swinging into the red as the lake climbs, with the lake's steam plume rising behind it into a high blue sky.

---

## 2. The plan

### 2.1 Macro shape: two crescents in a pinwheel (and why not one horseshoe)

The lead asked for "a crescent: a horseshoe of rim and terraces around a lava lake, with islands in the lake as mid."
A single horseshoe cannot survive INKWAVE's 180° turn: a C opening east turns into a C opening west. So I made it
**two crescents**, one per team, rotated into each other like a pinwheel or tomoe around one central lake:

- **Alpha's crescent** starts at its base (south) and sweeps up the **west** side of the lake as a terraced rim, its
  horn tip ending deep in Bravo's half at the north-west breach.
- **Bravo's crescent** is its turn: up from the north base, down the **east** side, horn tip at the south-east breach.
- **The breaches** are the gaps where a horn tip falls short of the other team's base. Lava overflows through them,
  down the spillways, and pours off the summit as lavafalls. That is the geology too: the rim is lowest at its horns,
  which is why the lake broke out there.

From above, a glowing lake with an island sits in the middle, wrapped by two hooks of land that taper to tips. Two
notches of lava cut through the outline to the sky. The playable edge falls away to the volcano's outer flank on every
side: the outline is the crater rim, not a box. This is unlike every stage we have (bands, Craters' stadium,
Spirhalite's S of islets with its water in the halves, Treehills' diamond). It is also unlike the other batch-5 shapes:
Bluestone's skewed X, and the aquarium's round galleries. Spirhalite is the nearest relative (it swirls too), but its
middle is land between two lagoons. Ours is a single lake with the fight on an island in it.

Footprint: x −37 … 37 (the two spillway lips reach the edge), z −73 … 73. `bounds` { minX −38, maxX 38, minZ −74,
maxZ 74 }. My rasterised plan gives **about 7,100 m² of floor at low lava, 860 m² of it ledges, and about 6,300 m² at
high**. That is roughly 20 % more than Craters after the stretch, because the lake pushes the routes outward. To trim it,
pull the base wings in by 3 m (the outline points at z ±47 … ±65); nothing else changes.

### 2.2 The plan (low lava; whole stage)

Legend:

| char | meaning |
|---|---|
| `~` | lava, always (the deep pools; the surface is at −1.6 at low) |
| `,` | **ledge, floor −1.0: dry at low, lava at high** (glazed black crust) |
| `.` | floor 0 |
| `-` | 0.6 (the Ferry Landings) |
| `:` | 1.3 |
| `=` | 2.5 |
| `#` | 3.8, the spawn deck; `S` the spawn pad |
| `/` | stairs and ramps |
| `b` | bridge deck (West / East Bridge: ramp 1.3 → 0; Spillway Bridge: 1.3) |
| `L` / `l` | an Organ lookout / its two step columns (they rise; heights in §2.3) |
| `G` | a Gauge pier (off-limits top) |
| `o` | solid cover ≥ 0.9 m (on ledges these are hornitos, 2.2 m with off-limits tops) |
| `O` | big structure, off-limits top (Observatory, Silencer, separator vessels, cooling tower, Valve House) |
| `X` | the Powerhouse body behind the spawn (out of play) |
| (blank) | the volcano's outer flank: void, a fall splats you |

```
x =         -30       -20       -10         0         10        20        30
              |         |         |         |         |         |         |
  -73                              XXXXXXXXXXXXXXXXXX                              Alpha POWERHOUSE (out of play)
  -71                              XXXXXXXXXXXXXXXXXX
  -69                              ##################                              spawn deck 3.8
  -67                     =========##################::::::::::
  -65                  ======oo=///########SS########//////::::::::                pad (0, -64.5) · W stair · E ramp
  -63               ============///##################//////::::oo:::
  -61             =OOOOOO==========##################::::::::::::::::              OBSERVATORY terrace 2.5 · Transformer terrace 1.3
  -59           ===OOOOOO===::::::::::::://///::::::::::::::::::::::::o
  -57         ======OOOO====:::oo:::::::://///:::::::::oo::::::oo:::::::           GALLERY 1.3 · Grand Stair
  -55        =======////====::::::::::::://///:::::::::::::::::::::::::::
  -53             ::::::::::::::::............................////........
  -51      =======::::::::::::::::.......................................oo        FORECOURT 0 (Gate / tower goal) · Obs. lawn 1.3
  -49     ========::::::::::::::::...oo.........oo......oo.......OOOOOOOO...
  -47     ========:::::::::::///::...............................OOOOOOOO....      cooling tower (E)
  -45    oo=======///....................................o.......OOOOOOOOooo.
  -43    =========.......................................o.......OOOOOOOO....
  -41    =========....................:OO::::::OO:...........................      SEPARATOR DECK 1.3 (vessels) · Silencer (W)
  -39   =====:::::....OOOO............::::::::::::..........................oo
  -37   =====:::::....OOOO............::::::::::::............................     WELLFIELD 0
  -35   =====:::::.............oo.....:::o::::o:::.....OOO....................
  -33   =====::o::....................///.....///......OOO.................:::     deck stairs · Valve House (E)
  -31   =oo==:::::......ooooo..........................ooo......:::::::::oo:::
  -29   =====:::::.........................................//:::::::::::::::::     Spillway QUAY 1.3 (E)
  -27   =====:////.ooo..------------.oo....................//:::::::::::::::///,,
  -25   ==o==:////.ooo..------------.....o...................::::::::::bbb,,,,,,,  FERRY LANDING 0.6 · STRAND 0 · Spillway Bridge
  -23   =====:::::......------------..............o....oo....::::///,,,bbb,oo,,,,
  -21   =====::::://///.............................//....//.,,,,,,,,,,bbb,,,,,,,  lake rail · steps to the Flats
  -19   =oo==::o::,,,,,~~~~~~~~~~~~~~~~~........,,,,,,,,,,,,,,,,,,,,,,,bbb,,,,,,,  SW pool · CAUSEWAY · FLATS -1 · SPILLWAY -1
  -17   =====:::::,,,,,~~~~~~~~~~~~~~~~~........,,,,,,,oo,,,,,,,,,,,,,,bbb,
  -15   =====:::::,o,,,~~~~~~~~~~~~~~~~~........,,,,o,,,,,,,,,,,,,,,,,:::::        RIM: T2 2.5 / T1 1.3 / Fumarole Walk -1
  -13    ====:////,,,,,~~~~~~~~~~~~~~~~~o......o,,,,,,,,,,,,,,,~~,,,,,:::::
  -11    o===:////,,,,,~~~~~~~~~~~~~~~~~........,,,,,,,,,oo,,,~~~,o,,,:oo::        Bravo's horn (E): T1 1.3 + walk -1
   -9     //=:::::,,,,,~~~~~~~~~~~....l...............,,,,,,,~~~~,,,,,:::::
   -7     ::::::::,,,o,~~~~~~~~~..LLL........o..oooo....,,~~~~~~~,,,,,////:        ANVIL: Organ (Alpha half)
   -5      :::::::,,,,,~~~~~~~....LLL................o....~~~~~~~,,,o,////::
   -3      ::::o::bbbbbbbbbbbb.......l................GGG.~~~~~~~,,,,,::::::       WEST BRIDGE · Gauge pier
   -1       ::::::bbbbbbbbbbbb........................GGG.~~~~~~~,//,,::::::
    1       ::::::,//,,~~~~~~~.GGG........................bbbbbbbbbbbb:::::::      Gauge pier · EAST BRIDGE (Bravo)
    3       ::::::,,,,,~~~~~~~...................ll.......bbbbbbbbbbbb::o::::
    5        :////,,,,,~~~~~~~.....................LLL....~~~~~~~,,,,,::::::::
    7        :////,,,,,~~~~~,,,,....oooo..o......l.LLL..~~~~~~~~~,,,,,::::::::     ANVIL: Organ (Bravo half)
    9        :::::,,,o,~~~,,,,,,,,....................~~~~~~~~~~~,,,,,:::::=//
   11        ::oo:,,,,,~~~,,,oo,,,,,,,,,........~~~~~~~~~~~~~~~~~,,,,,////:===o
   13        :::::,,,,,~,,,,,,,,,,,,,,,,........~~~~~~~~~~~~~~~~~,,,,,////:====
   15        :::::,,,,,,,,,,,,,,,,,o,,,,........~~~~~~~~~~~~~~~~~,,,o,:::::=====
   17       ,,bbb,,,,,,,,,,,,,,oo,,,,,,,o......o~~~~~~~~~~~~~~~~~,,,,,:::::=oo==
   19  ,,,,,,,bbb,,,,o,,,,,,,,,,,,,,,,,,........~~~~~~~~~~~~~~~~~,,,,,::o::=====   Bravo's CAUSEWAY · Bravo's SPILLWAY (W)
   21  ,,,,,,,bbb,,,,,,,,,,.........................-o----oo----......:::::=====
   23  ,,,,oo,bbb,,,///::::.........................------------......////:==o==
   25  ,,,,,,,bbb::::::::::.........................------------..ooo.////:=====   Bravo's STRAND · FERRY LANDING
   27  ,,///::::::::::::::://.......................------------......:::::=====
   29    :::::::::::::::::://.........................................:::::=====
   31    :o:::::::::..oo......ooo.....///.....///..........ooooo......:::::==oo=
   33    ::..................OOOO.....///.....///......oo.............::o::=====
   35     ...................OOOO.....:::o::::o:::....................:::::=====
   37     oo..........................::::::::::::............OOOO....:::::=====
   39     ............................::::::::::::............OOOO....:::::=====
   41      ....OOOOOOOO.......o.......:OO::::::OO:....................=========    Bravo's SEPARATOR DECK
   43      ....OOOOOOOO.......o....................................///=======oo
   45      ooo.OOOOOOOO.................................///........///=========
   47       ...OOOOOOOO...............................::::::::::::::::========
   49        .................oo......................::::::oo::::::::=======
   51        o........////............................::::::::::::::::=======      Bravo's FORECOURT
   53         ::::::::::::::::::::::::::://///::::::::::::::====////========
   55          ::::::::::::::::oo:::::::://///:::::::::oo:::====////=======
   57           oo:::::oo:::::::::::::::://///::::::::::::::===OOOOOO=====
   59             :::::::::::::::::##################==========OOOOOO===
   61              ::::::::::::::::##################===========OOOO==
   63               :::oo:::///////##################///=oo=========
   65                 ::::::///////########SS########///========                   Bravo pad (0, 64.5)
   67                     :::::::::##################========
   69                              ##################
   71                              XXXXXXXXXXXXXXXXXX
              |         |         |         |         |         |         |
```

**The same band at high lava.** Every `,` is now lava. The Tide Stones (`rr`) stand in the south-west and north-east
pools. The hornitos stick out of the lava as smoking chimneys. The Organs (`L`) are 3.8 m lookouts.

```
x =         -30       -20       -10         0         10        20        30
  -33   =====::o::....................///.....///......OOO.................:::
  -31   =oo==:::::......ooooo..........................ooo......:::::::::oo:::
  -29   =====:::::.........................................//:::::::::::::::::
  -27   =====:////.ooo..------------.oo....................//:::::::::::::::///~~
  -25   ==o==:////.ooo..------------.....o...................::::::::::bbb~~~~~~~
  -23   =====:::::......------------..............o....oo....::::///~~~bbb~oo~~~~
  -21   =====::::://///.............................//....//.~~~~~~~~~~bbb~~~~~~~
  -19   =oo==::o::~~~~~~~~~~~~~rr~~~~~~~........~~~~~~~~~~~~~~~~~~~~~~~bbb~~~~~~~
  -17   =====:::::~~~~~~~~~~~~~rr~~~~~~~........~~~~~~~oo~~~~~~~~~~~~~~bbb~
  -15   =====:::::~o~~~~~~~~~~~~~~~~~~~~........~~~~o~~~~~~~~~~~~~~~~~:::::
  -13    ====:////~~~~~~~~~~~~~rr~~~~~~~o......o~~~~~~~~~~~~~~~~~~~~~~:::::
  -11    o===:////~~~~~~~~~~~~~rr~~~~~~~........~~~~~~~~~oo~~~~~~~o~~~:oo::
   -9     //=:::::~~~~~~~~~~~~~rr~....l...............~~~~~~~~~~~~~~~~:::::
   -7     ::::::::~~~o~~~~~~~~~~..LLL........o..oooo....~~~~~~~~~~~~~~////:
   -5      :::::::~~~~~~~~~~~~....LLL................o....~~~~~~~~~~o~////::
   -3      ::::o::bbbbbbbbbbbb.......l................GGG.~~~~~~~~~~~~::::::
   -1       ::::::bbbbbbbbbbbb........................GGG.~~~~~~~~//~~::::::
    1       ::::::~//~~~~~~~~~.GGG........................bbbbbbbbbbbb:::::::
    3       ::::::~~~~~~~~~~~~...................ll.......bbbbbbbbbbbb::o::::
    5        :////~~~~~~~~~~~~.....................LLL....~~~~~~~~~~~~::::::::
    7        :////~~~~~~~~~~~~~~....oooo..o......l.LLL..~~~~~~~~~~~~~~::::::::
    9        :::::~~~o~~~~~~~~~~~~....................~rr~~~~~~~~~~~~~:::::=//
   11        ::oo:~~~~~~~~~~~oo~~~~~~~~~........~~~~~~~rr~~~~~~~~~~~~~////:===o
   13        :::::~~~~~~~~~~~~~~~~~~~~~~........~~~~~~~rr~~~~~~~~~~~~~////:====
   15        :::::~~~~~~~~~~~~~~~~~o~~~~........~~~~~~~rr~~~~~~~~~~~o~:::::=====
```

(The plans were rasterised from the piece list in §2.3, so the two agree. The Tide Stones are 2.5 m apart and the 2 m
rows skip some of them.)

### 2.3 The pieces (Alpha's half and the centre)

| # | piece | centre x / z | size | floor | purpose |
|---|---|---|---|---|---|
| C1 | **The Anvil** (single) | 0 / 0 | octagon: corners (±14, ±5), (±9, ±10); ≈ 510 m² | 0 | Mid. A basalt-flag island in the lake. Pond, centre zone and tower start. Six ways on (three per side). |
| C2 | Breath Rose (single) | 0 / 0 | disc r 6.5 | 0 | The open middle: a bronze compass-and-tide-dial inlay. The centre zone (10 × 9) sits inside it. |
| C3 | **Organ** lookout (Bravo's twin at (8.6, 6.0)) | −8.6 / −6.0 | basalt hex, 4.4 m across | **1.3 low → 3.8 high** | The lookout. Two 0.6 m basalt stubs on its lake side ride with it as cover. Inkable top and sides. |
| C4 | Organ step A | −5.8 / −8.0 | hex 2.2 m across | 0.6 → 1.6 | The hop stair. From floor 0 it is a 1.6 hop at high. |
| C5 | Organ step B | −6.4 / −3.4 | hex 2.2 m across | 1.0 → 2.6 | A to B is a 1.0 hop and B to the lookout 1.2, at every level. |
| C6 | **Gauge pier** (Bravo's twin at (−11.5, 1.5)) | 11.5 / −1.5 | 3 × 3 m, masonry to 7.0 (roof) | — | Big cover at the Anvil's east end. Carries the truss (underside 9.0) to its twin. The dial is 6 m across, centred at (0, 9.5, 0) facing ±Z, its bottom edge at 6.5. A float cage is on the pier's lake face. |
| C7 | Toppled gauge float | 6.0 / −7.2 | rusty iron cylinder 4.4 × 1.6, 1.4 tall | top 1.4 | Cover on the Anvil's south-east edge above the Flats. The top is a 1.4 hop: a mini perch. |
| C8 | Mooring bollard, boulder | (9.5, −4.2), (1.8, −7.0) | 1.2 × 1.2 × 1.1; 1.0 × 1.0 × 1.0 | — | Cover around the plaza. Both stay outside the tower's lane (\|x\| < 1.6). |
| C9 | **The Cauldron** (lava lake, single) | 0 / 0 | polygon (−21, −20) (17, −20) (21, −16) (21, 20) (−17, 20) (−21, 16) | lava −1.6 → −0.3 | The lake. The Anvil, causeways, bridges and ledges sit in it. |
| A1 | **Causeway** | 0 / −15 | 8 × 10 (x −4 … 4, z −20 … −10) | 0 | The centre route onto the Anvil, always open. Lamp plinths 0.9 × 0.9 × 1.3 at (±3.4, −12.5) and (±3.4, −17.5). An iron rail on its west edge over the deep pool. |
| A2 | **Tide Stones** ×5 | x −12; z −18.6, −16.1, −13.6, −11.1, −8.6 | pumice discs 2.2 m across, 0.9 thick | **high only:** top +0.15 | The flood route from the Strand (−12, −20) to the Anvil's south-west face (−11.5, −7.5). Gaps of 0.3 m between stones, 0.3 to the shore, 0.5 to the Anvil. |
| A3 | **The Black Flats** | ≈ 11 / −14 | polygon (4, −20) (4, −10) (9, −10) (13, −6) (17, −8) (19, −12.6) (18, −20); ≈ 150 m² | **−1.0, floods** | The low-only approach onto the Anvil's south-east face (a 1.0 hop up anywhere). Hornitos at (8.5, −15.5), (14, −11.5), (12, −17.2). |
| A4 | **Spillway** | ≈ 27 / −20 | channel 9 m wide, (18, −12.5) (36, −18.5) (36, −27.5) (17, −21.5); ≈ 180 m² | **−1.0, floods**; lava pours out over its lip at x 36 | The left flank's crossing at low. Continuous with the Flats and with Bravo's Fumarole Walk. Hornitos at (22.5, −19.6), (32, −22.6). |
| A5 | **Spillway Bridge** | 28.5 / −20.6 | 3 × 10 (x 27 … 30, z −25.6 … −15.6) | 1.3; underside 1.0 (2.0 m clear above the floor) | The left flank's only crossing at high: the Quay to Bravo's horn T1. Iron parapet rails both sides. |
| A6 | **Fumarole Walk** | −23.5 / −3 | 5 m wide (x −26 … −21), z −20 … +14 | **−1.0, floods** | The right flank's low road along the lake, under the rim. Hornitos at (−24.5, −15), (−22.5, −6.5), (−24.5, 4.5), (−22.5, 10). Exits: steps up to the Strand (z −20), stairs up to T1 at z −12 and z +6, steps up to the West Bridge at z +1, and its north end opens into Bravo's Spillway (z 14). |
| A7 | **Rim T1** | −28.5 / −12 | 5 m wide (x −31 … −26), z −40 … +16; widens to the outline north of z −8 | 1.3 | The rim's middle tier, the crescent's spine. Cover every ~12 m: steam vent hoods, a weather hut, survey cairns. |
| A8 | **Rim T2** | −33.5 / −30 | outline … x −31, z −52 … −8 (11 m wide at z −52 … −40) | 2.5 | The right flank's high road from the Observatory to mid. T2 → T1 stair at z −9. |
| A9 | **West Bridge** | −20 / −2.5 | 12 × 4 (x −26 … −14, z −4.5 … −0.5) | ramp 1.3 → 0 (6°) | Rim T1 to the Anvil's west end, between Bravo's Gauge pier and Alpha's Organ. Clears the Walk under it by 1.75 m (a kid passes; at high, lava). Steps from its north side down to the Walk at x −24.5 … −22.5. |
| A10 | **The Strand** | −4.5 / −24 | 43 × 8 (x −26 … 17, z −28 … −20) | 0 | The lakefront visitor promenade. Iron lake rail along the deep pool (x −21 … −4, z −20) with a gap at the Tide Stones (x −13 … −11). The Flats' edge (x 4 … 17) is open: a 1.0 step, hop up anywhere, with steps at x 8 … 10 and 14 … 16. Telescopes, benches, the LAVA TIDE TABLE board. |
| A11 | **Ferry Landing** | −14 / −24.5 | 12 × 7 (x −20 … −8, z −28 … −21) | 0.6 | Where the Tide Stones come ashore: the **side zone** and (mirrored) **Bazookarp weir**. Capstan 1.4 × 1.2 × 1.3 at (−15, −21.6); chain bollard 1.0 at (−9.5, −21.6). The Stone Winch House (3 × 3 × 2.8, roof) is at (−23.5, −25.5). |
| A12 | **Spillway Quay** | 26 / −28 | polygon (17, −21.5) (34, −27.2) (34, −33) (17, −30) | 1.3 | The left flank's shelf over the Spillway. **Tower checkpoint 2.** Stairs down into the Spillway at x 21 … 24 and 32 … 35. Iron rail along the Spillway edge between them. |
| A13 | **Wellfield** | −4.5 / −37 | 43 × 18 (x −26 … 17, z −46 … −28) | 0 | The slice: three lanes between the Silencer (west), the Separator Station (centre) and the Valve House (east). |
| A14 | **Separator Deck** | 0 / −38 | 12 × 8 (x −6 … 6, z −42 … −34) | 1.3 | The slice's strategic point and **tower checkpoint 3**. Two riveted vessels, 2.2 m across and 5.5 m tall (roof), at (±4.3, −40.8). Consoles 0.8 × 1.2 × 1.1 at (±2.8, −35). Stairs at x −5.5 … −2.5 and 2.5 … 5.5 (z −31 → −34); hop up anywhere. |
| A15 | **Silencer** | −20 / −38 | 4.5 m across, 4.8 tall (roof) | — | The west lane's landmark, venting steam. |
| A16 | Wellhead W1 | −12 / −34 | pad 2.6 × 2.6, valve tree 1.9 (roof) | — | Cover. |
| A17 | **Valve House** + wellhead W2 | 12.7 / −34; W2 at (12.5, −31) | 3.5 × 3 × 2.8 (roof); W2 3.6 × 3 × 1.9 | — | East-lane cover. |
| A18 | Steam main (low pipe) | −17.5 / −31 | 5 × 1, top 1.2 | 1.2 | A cover line you hop over; walkable top. |
| A19 | **Steam Yard** | 27 / −45 | x 17 … outline, z −30 … −53 | 0 | The base's east wing. |
| A20 | **Cooling tower** | 25 / −45 | 8 × 8 (x 21 … 29, z −49 … −41), 5.5 (roof) | — | Big cover, with a plume. |
| A21 | Brine tanks ×2 | (31, −45), (31, −51) | 3 across, 3.0 (roof) | — | Cover. |
| A22 | **Observatory lawn** | −18 / −49.5 | 16 × 7 (x −26 … −10, z −53 … −46) | 1.3 | The step from the Wellfield up to the terrace. |
| A23 | **Observatory terrace** | −22 / −60 | x outline … −9, z −68 … −53 | 2.5 | The base's high west wing. Joins T2: a continuous 2.5 high road from the spawn to z −8. |
| A24 | The Observatory | −22 / −59 | drum 6.4 across, copper dome to 9.0 | roof | Landmark (seismographs, anemometers). |
| A25 | **Forecourt** | 3.5 / −49.5 | 27 × 7 (x −10 … 17, z −53 … −46) | 0 | The defenders' apron. Bazookarp Gate (0, −50); tower goal (0, −51.5). Benches and planters as cover at (±5.5, −48.5). |
| A26 | **Gallery** | 0 / −56 | 32 × 6 (x −16 … 16, z −59 … −53) | 1.3 | The Powerhouse's front terrace under its arched windows: where the defenders re-form. |
| A27 | **Transformer terrace** | 19 / −60 | x 9 … outline, z −68 … −53 | 1.3 | The base's east wing. Transformers 2 × 2 × 1.8 as cover. |
| A28 | **Spawn deck** (Powerhouse roof) | 0 / −64.5 | 18 × 11 (x −9 … 9, z −70 … −59) | 3.8 | Pad (0, 3.8, −64.5), barrier 4.2, iron balustrade. |
| A29 | Grand Stair | 0 / −56 | 5 × 6 | 3.8 → 1.3 (22.6°) | Spawn exit 1, forward. |
| A30 | West stair | −10.5 / −64 | 3 × 4 | 3.8 → 2.5 | Spawn exit 2, onto the Observatory terrace and the high road. |
| A31 | East ramp | 12 / −64 | 6.5 × 3.5 | 3.8 → 1.3 (21°) | Spawn exit 3, onto the Transformer terrace and the Steam Yard. |

The Gauge truss, the dial and the lavafalls are scenery (off-limits, no collision below 6.5 m over play).

### 2.4 Heights and what a 1.8 m climb means

- **Tiers:** −1.0 the ledges · 0 the Anvil, Causeways, Strand, Wellfield, yards · 0.6 the Ferry Landings · 1.3 Rim
  T1, the Quay, the Separator Deck, lawns, Gallery, Transformer terrace, bridge heads · 2.5 Rim T2 and the Observatory
  terrace · 3.8 the spawn decks, and the Organs at high.
- **Lava:** −1.6 at low (the summit's base lava, the stage's death plane) · **−0.3 at high** (the flood mark and the
  tide rind).
- **A kid's ~1.8 m climb:**
  - Every 1.0 step from a ledge up to the Strand or the Anvil can be hopped anywhere. That is what makes the Flats
    safe to stand on.
  - The 2.3 m face from the Fumarole Walk up to T1 cannot. The Walk's ways up are its stairs, its steps and its ends.
  - Every 1.3 edge (Separator Deck, Quay, Gallery) can be hopped. 0 → 2.5 cannot (a wall, inkable). 1.3 → 2.5 can
    (T1 to T2 anywhere along their seam).
  - The Organ cluster is a hop stair at every level: at low 0.6 / 1.0 / 1.3, at high 1.6 / 2.6 / 3.8.
  - Off-limits (`roof`, slide off): the hornitos, Gauge piers, vessels, Silencer, Valve House, cooling tower, tanks,
    Observatory, Stone Winch House and the Powerhouse body.
- **Two rules a player learns at a glance:** *glossy black floor floods; grey stone never does.* And the tide rind
  shows where.

### 2.5 Lanes, flanks, mid, cover, spawn to mid

**Alpha's five ways forward at low lava** (four at high), left to right as Alpha faces +Z:

1. **Left flank: the Spillway.** From the Steam Yard or the Quay, cross the Spillway onto Bravo's horn: on its
   floor at low, or on the Spillway Bridge at any time. Then go north along Bravo's T1 (1.3), or along Bravo's Fumarole
   Walk at low. You reach mid by **Bravo's East Bridge at the Anvil's north-east end**, or you carry on toward Bravo's
   base. At high this lane narrows to the bridge.
2. **Centre-left: the Flats** (low only). From the Strand's east half, step down onto the Black Flats and hop up onto
   the Anvil's **south-east face**, among the hornitos.
3. **Centre: the Causeway.** From the Separator Deck across the Wellfield and the Strand, then down the 8 m Causeway
   onto the Anvil's **south face**. Always open.
4. **Centre-right: the Tide Stones** (high only). From the Ferry Landing across the south-west pool onto the Anvil's
   **south-west face**, at the foot of Alpha's Organ.
5. **Right flank: the Rim.** The high road runs from the spawn over the Observatory terrace and T2 (2.5), then down
   to T1 (1.3), onto the **West Bridge at the Anvil's west end**. Or it carries on along Alpha's horn to the north-west
   breach and Bravo's base. At low there is also the low road, the Fumarole Walk (−1.0), under it along the lake.

So the flanks meet mid at four different points (the west end, the south-west face, the south-east face, the
north-east end), and the routes into mid move with the tide. Mid itself is an open 28 × 20 m island with six ways on,
an 8 m causeway on each side, 4 m bridges at both ends, and a whole ledge face or a stepping-stone line on the
diagonals. Nowhere is it a corridor.

**Spawn to mid (Long Stages).** Straight line from the pad (0, −64.5) to the centre: **64.5 m**. My rough grid
search on the plan (hop ≤ 1.8, drop anywhere, stairs connect) gives 63.5 m from the deck's front, so about 66 m from
the pad: **≈ 5.6 s of swimming**. The real nav adds the Grand Stair and the deck detour; I expect 66–70 m (5.6–5.9 s).
Measure with `spawn-mid.js`; if it comes in under 5.5 s, move the pad back 2 m. Flank arrivals from the spawn: the
West Bridge's foot on the Anvil 68 m, Bravo's East Bridge 71 m, the Ferry Landing 45 m, the Spillway Bridge 60 m.

**Cover.** Every lane has cover at 6–10 m: the Causeway's lamp plinths, the Strand's telescopes and kiosks, the
Wellfield's valve trees, vessels and pipes, the rims' vent hoods and huts, the ledges' hornitos. A rough cover map of
my plan (floor within 5 m of something ≥ 0.9 m taller than it) reads **94 % at low and 94 % at high**. The weakest
pieces are the spawn deck (by design), Rim T2 (79 %: add two more vent hoods) and the Tide Stones (64 %: by design, the
exposed route). Verify with `cover-map.js`. Big open floors exist only where wanted: the Breath Rose (r 6.5) and the
Ferry Landing (the side zone).

---

## 3. The gimmick: the Breath

### 3.1 The rules

1. **Two levels.** Low: the lava surface is at **−1.6** (the deep pools only). High: **−0.3**, the flood mark. The
   lava is one horizontal surface over the whole caldera: the lake, the ledges, both spillways. Everything below the
   surface is lava; nothing else ever is.
2. **What floods.** Every floor at −1.0: the two Fumarole Walks, the two Black Flats, the two Spillways (≈ 860 m² in
   all). Nothing at 0 or above ever floods. The lava reaches the ledges when it passes −1.0, 3.8 s into a rise, and
   leaves them 4.2 s into a fall.
3. **Touching lava splats you**, exactly like the sea on every other stage. Your feet at or below the surface means a
   splat with cause `lava`, credited to whoever last hit you within 4 s. Squid, kid, roller or carrier, it is the same
   rule. There is no burn-down damage and no grace bounce: one clear rule, made fair by the warning (§3.6).
4. **The Tide Stones** (5 a side) exist only while the lava is high. They rise out of the lava during the surge and
   sink back into it at the start of the fall. At high their tops sit at **+0.15**, flush with the shores. They are
   chained in place (no drift) and bob ±3 cm as a look only; the collider is steady.
5. **The Organs** (one cluster a side on the Anvil) rise and sink with the lava, column by column: lookout 1.3 → 3.8,
   step B 1.0 → 2.6, step A 0.6 → 1.6, at heights proportional to the lava level. They carry anyone standing on them.
6. **The Spillways run** only at high. When the lake passes the breach sill (−1.0) the lava pours out along each
   Spillway, over its lip and down the mountain as a lavafall. At low they are dry, steaming channels.
7. **The tide rind** marks −0.3 on every face the lava can touch (§5.3). The ledge floors themselves are glazed black.
8. **It never stops for a mode** (all modes `run`, §4). The only exception is the quiet finish (§3.2).

### 3.2 The timetable

One cycle, the same every time, a pure function of the match clock:

| phase | length | in the first cycle (s from GO) | what happens |
|---|---|---|---|
| low | 28 s first, then 35 s | 0 – 28 | Ledges open. The Gauge needle sits on LOW. |
| **warning** | 10 s | 28 – 38 | The Breath Horn sounds. The lake bulges and churns. Spatter fountains rise at the four vents. The rind glows. The ledges' cracks heat red. The Tide Stones' spots bubble. HUD `LAVA RISING IN 10`. |
| **rising** | 8 s (eased) | 38 – 46 | The lava climbs 1.3 m. The Stones surface (2 s in) and stand flush by 6 s. The Organs grind up. **The ledges flood at 41.8 s.** The Spillways start pouring at 41.8 s. |
| **high** | 24 s | 46 – 70 | Stones up, Organs up, lavafalls running, needle in the red. The last 6 s (64 – 70) are the fall warning: the Stones crack and glow, a short whistle, HUD `LAVA FALLING IN 6`. |
| **falling** | 8 s (eased) | 70 – 78 | The Stones sink first and are under at 73 s. The Organs settle. The lava drains, and **the ledges clear at 74.2 s**, steaming and glowing for 2 s. The Spillways run dry. |
| low | 35 s | 78 – 113 | … and the next warning starts at 113 s. |

**Period 85 s.** Warnings start at **28, 113, 198 s** from GO.

**The quiet finish.** No warning starts if its fall would end later than 12 s before regulation time-up. Overtime is
always low. So every match ends with the whole stage open and the ledges bare:

| match | surges | ledges under (match time) | calm finish |
|---|---|---|---|
| Turf War 1:30 | 1 | 0:42 – 1:14 | the last 12 s: the **ledge scramble** |
| Turf War 3:00 | 2 | 0:42 – 1:14, 2:07 – 2:39 | the last 17 s: the ledge scramble |
| Zone Control, Tower Command, Bazookarp (5:00 + OT) | 3 | 0:42 – 1:14, 2:07 – 2:39, 3:32 – 4:04 | the last 52 s and all of overtime |
| Boss Battle (4:00) | 2 | 0:42 – 1:14, 2:07 – 2:39 | the last 77 s |
| Practice / the menu backdrop | endless | — | — |

Why 85 s: it fits one surge into a 90 s match with a scramble after it, two into 180 s, and three into 300 s with a
calm last minute. 24 s of high is long enough for two fights on the Organs and a Stones crossing each way. 35 s of low
is long enough to swim spawn to mid and fight once before the next horn. All five numbers live in the layout's data
(§3.10), so the bot-match A/B can tune them without touching code.

### 3.3 The set pieces

- **The Surge** (warning + rise, 18 s). The Breath Horn: two deep steam notes from the Gauge, heard everywhere. The
  lake's crust breaks into plates, and four spatter fountains in the deep lava (at (−14, −14), (16, −4) and their
  twins) throw lava 3–4 m up. The rind on every rock glows dull red, as if the lava were calling its line. Then the
  surface climbs, with a bright seething edge where it meets the walls, toward that line. The Stones break the surface
  with a deep bloop, one after another from the shore outward. The Organs grind up shedding dust. When the lake passes
  the sill, lava floods the Spillways from the lake end outward and pours off both lips.
- **High Lava** (24 s). The middle of the stage is a glowing lake crossed by three ways per side. The Organs stand
  as lookouts 3.8 m over the Anvil, the lavafalls roar off both breaches, the light turns red from below, and the
  Gauge's needle sits in its red band.
- **The Ebb** (fall, 8 s). The Stones go first: they crack, glow and sink. Then the lake drains away from the rind,
  leaving the ledges glazed, steaming and bare (all the ink burned off). The hornitos smoke. The Spillways' last lava
  trickles over the lips and dies to a glow.
- **The ledge scramble** (Turf War's last 12–17 s). The final fall leaves 860 m² of bare black ledge with the clock
  running out. Whoever inks it wins close games.
- **The Great Breath** (the last surge of every match). The same levels and timings, but **Little Breath**, the
  younger cone on the western horizon, erupts with it: a fountain, an ash column, ash drifting over the stage, the sky
  a shade darker. The Breath Horn plays its long call. It is spectacle only.

### 3.4 What both teams can do with it

- **At low:** flank wide (the Walks, the Spillway floors), flank mid through the Flats' hornitos, and ink the ledges.
  That ink is cheap special charge but will burn at the next surge.
- **In the warning:** get off the ledges. Stand on your Organ's lookout so it lifts you: whoever is on top when it
  rises owns the highest ground on the stage for 24 s. Pre-position on the Ferry Landing, or at the Anvil's
  south-west face, to be first across the Stones.
- **Rising:** ride the Organs. Cross the Stones as soon as they are flush (6 s in).
- **High:** snipe from the Organs. Push across the Stones straight into the enemy's Ferry Landing (their side zone,
  their weir). The flanks narrow to Rim T1/T2 and the Spillway Bridge: easy to hold, and worth a special to break.
- **Fall warning:** get off the Stones. Start the low-lava push, because the ledges clear 4.2 s into the fall.
- **Any time:** knock enemies into the lava (Mitts, the Bazookarp's Carp Shot kick, rollers). Mind your devices:
  anything placed on a ledge or a Stone burns.

### 3.5 How it is announced

| channel | low | warning (10 s) | rising (8 s) | high (24 s) | fall warning (last 6 s of high) | falling (8 s) |
|---|---|---|---|---|---|---|
| **The Gauge** (6 m dial over mid; lamp ring) | needle at LOW, lamps white | needle starts to climb, lamps flash amber | needle sweeps up | needle in the red band, lamps steady red | lamps flash white | needle sweeps down |
| **Sound** (synthesised) | quiet volcano rumble | **Breath Horn** (two deep steam notes, 2 s), rumble swells, bubbling | rising roar whose pitch follows the level, the Organs' grind, the Stones' bloops | spillway roar, crackle | a short descending steam whistle | a draining glug, hissing ledges |
| **HUD meter** (under the match timer) | `LOW · surge 0:41` | `SURGE 9…1` (pulsing) | `RISING ▲` | `HIGH · falls 0:17` | `FALLING IN 6…1` | `FALLING ▼` |
| **Call-out banners** | — | **`LAVA RISING IN 10`** / `Get off the black ledges` | — | — | **`LAVA FALLING IN 6`** / `Off the Tide Stones` | small line `LEDGES OPEN` at the end |
| **Your own bottom line** | — | on a ledge: **`GET OFF THE LEDGE! → 6 m`** (arrow to the nearest stair) | same | — | on a Stone: **`THE STONES ARE SINKING!`** | — |
| **Minimap / TAB map** | ledges hatched dull red | hatching pulses | the lava fill spreads over them | ledges solid lava, Stones as dots, Organs as hexes with ▲ | Stones blink | the fill shrinks |
| **The world** | lake crusted and quiet, Spillways dry | lake bulges, fountains, rind glows, ledge cracks heat red, Stone spots bubble | surface climbs with a bright front, Stones surface, Organs rise | lavafalls pour, red under-light, steam | Stones crack and glow | Stones sink, ledges steam and glow for 2 s, then go dark |
| **Camera** | — | a small shake at the horn | a small shake at the start | — | — | — |

The HUD meter is a small vertical tube (14 × 64 px) with the lava fill (black crust, crimson, white-hot seams), a
white tick at the rind and a tick at low, plus the state word and countdown beside it. Its colours are never a team
colour. The TAB map also shows a strip with the next surges' times. Two big banners per cycle, no more.

### 3.6 Fairness

- **Symmetric.** Every ledge, Stone line, Organ, vent and spillway has its 180° twin and changes at the same instant.
- **Predictable.** The timetable never varies, is driven by the match clock, and is on the HUD the whole match.
- **Warned.** From the first warning to the first ledge flooding is 13.8 s. From `LAVA FALLING IN 6` to the Stones
  going under is 9 s.
- **Escapable.** Every point on a ledge is within about 9 m (1.5 s of walking) of a way up:
  - the Flats' edges are 1.0 hops onto the Strand, the Causeway or the Anvil, anywhere along them;
  - each Spillway has two stairs up to its Quay and opens into the Flats and the far Walk;
  - the Walks have stairs or steps at most 13 m apart.

  Every point on a Stone line is within 6.5 m of a shore.
- **Nothing appears inside a player.** The Stones rise from under the lava, where nobody can be alive. A player in
  the air above a surfacing Stone is lifted onto it. The Organs grow from their own tops, carrying anyone on them,
  and nothing beside them moves. Nothing descends onto anyone: the lowering Organs carry their riders down onto solid
  ground. Nothing hangs over the Organs: the Gauge truss passes 6 m to the side, at 9 m.
- **Spawns and objectives never flood.** Bases have no ledges; the Pond, both zones, the tower's whole track (with
  its 2.5 m platform), the weir and the Gate are all on ground at 0 or above.
- **The finish is calm** (§3.2), so the last push, the final count and overtime are never decided by a surge.

### 3.7 Ink, turf, devices, shots and specials

- **Ink burns.** As the lava surface passes a paint cell (floor or wall) on its way up, that cell's ink is erased,
  with a hiss and a puff of team-tinted steam where there was ink. While a cell is below the surface, splats on it are
  dropped. When the lava falls, the ledges come out bare and can be inked at once; their glow for 2 s is a look only.
- **Turf.** Cells under lava count for nobody. The final count always happens at low (the quiet finish). Re-inking
  the bare ledges after a fall charges specials as usual, the same for both teams. The Stones and the Organs take
  ink (you swim and climb on them) but do not count as turf, as with Treehills' hedges.
- **Devices** (sprinkler, beacon, Drip Curtain, Surf N' Turf buoy, Lurk Mine, Skitter Bomb, the batch-5 turret, …)
  standing below the lava surface are destroyed with a pop and a sizzle, through the `deploy` package's crush helper
  (cause `lava`). Devices on a Stone burn when it sinks. Devices on an Organ ride it, like on the tower's deck.
- **Shots and bombs** that reach the lava fizzle: no paint, no blast, a steam puff.
- **Specials.** A special that ends with you over lava drops you into it, as over the sea. A **super jump** whose
  landing spot is below the lava (or will be by landing time) is redirected to the nearest floor that stays dry, within
  6 m. The TAB map greys out teammates standing on doomed ground.

### 3.8 Bots

- **They know the timetable.** It is on every player's HUD, so this is not a wall-hack. `G.lava` gives
  `floodsIn(node)` (seconds until a node is under lava, or ∞), `isDry(node, t)` and the current state.
- **Evacuation.** From warning start until low lava returns, every ledge node is marked blocked in a stageKit nav
  layer (as Calamari's trains mark their sweep), so routes avoid ledges and bots on them replan. A bot whose node floods
  within 6 s drops its fight and walks the precomputed **exit field** (distance to the nearest dry node, over ledge
  nodes) off the ledge. The page test checks that every bot is off within 6 s of warning start.
- **At low,** routes over ledges are allowed, but cost extra if the bot's ETA off the ledges is later than the next
  warning minus 2 s. Carriers and riders use the same check with their slower speeds.
- **The Stones.** The graph is built with nav-only copies of the Stones at their high positions. A layer blocks those
  nodes except during high (they block again from the fall warning on). Bots use the line when it is open and get off
  it when it closes.
- **The Organs.** Nodes at both their low and high top heights, each set masked to its state. At high, long-range
  bots (charger, bow, splatling) get a "perch" goal on the nearest Organ. Others contest an Organ an enemy holds.
- **Mode brains:** Zone Control defence plans use only the live approaches. Bazookarp carriers choose routes with
  `floodsIn` and never start across a ledge that floods before they would leave it plus 3 s. Tower escorts are told
  which approaches to the next checkpoint are live.
- **Graph mechanics:** if Bluestone's union graph with state-masked edges lands (its `engine.md`, §4.3), the caldera's
  two states use it (low / high as two "eras"). Otherwise, nav-only twin blocks plus layers, as above. The ledge nodes
  exist in both; only their blocking changes.

### 3.9 Online

- The Breath is a **pure function of the stage clock** (`stageKit.js` StageClock: duration − time, carried by frame
  time through overtime and Practice), as Calamari's trains are. Every client computes the same lava level, Stone and
  Organ heights and phase. It needs **no records**, and late joiners and host changes are correct for free.
- **Lava splats** are judged by each actor's owner, like sea falls (the owner simulates its own actor).
- **Ink clearing** runs on every client from the same clock; the host's turf count is authoritative as usual.
- **Devices** are destroyed by their owners when they go under; the existing device-death records carry it.
- **Riders** on Organs and Stones are carried by their own client, as pods and the tower do.
- Two-client test `net-lava.cjs`: the same lava level (±0.02 m) and Stone and Organ heights on both screens through a
  whole cycle, a late joiner mid-rise, and a lava splat on the guest seen on the host.

### 3.10 The engine: one module, small hook-ins

**`src/game/lava.js` (`StageLava`, ~700 lines).** It owns:
- the timetable (`lavaPhase(t)` → `{ phase, level, f, toNext }`);
- the lava level and the kill test;
- the Stones and Organs as dynamic blocks (`G.level.addDynamic` / `moveDynamic`, with riders carried as pods carry
  theirs);
- ink clearing below the level, device crushing, nav layers, `floodsIn`, the exit field;
- the HUD state (`state()`), call-outs and sounds;
- `karpField.rebuild()` at each change between low and high.

**`src/fx/lavaFx.js` (~600 lines).** It owns:
- the lava surface (one mesh over the basin polygons with the crust / seam / glow shader);
- the vents' spatter fountains, the lavafalls (scrolling ribbons down the outer flank), steam and ash;
- the rind and glaze uniforms;
- the Gauge's needle and lamps, and the hot-ledge glow.

**Data (`LAYOUT.lava`):**
```js
lava: {
  levels: { low: -1.6, high: -0.3 },                 // the lava surface (m); high is the flood mark / the rind
  timetable: { first: 28, warn: 10, rise: 8, high: 24, fallWarn: 6, fall: 8, period: 85, quietEnd: 12 },
  modes: {},                                         // per mode 'run' (default) | 'low' | 'high' (held), a safety switch
  basin: [[[-21, -20], [17, -20], …]],               // world polygons where lava can be (lake + ledges + spillways), full list
  ledges: { mirror: true, polys: [ /* Walk, Flats, Spillway: Alpha's half */ ] },   // map hatching, exits, bots, HUD
  stones: { mirror: true, r: 1.1, thick: 0.9, free: 0.45, under: -0.6,
            line: [[-12, -18.6], [-12, -16.1], [-12, -13.6], [-12, -11.1], [-12, -8.6]] },
  organs: { mirror: true, list: [
    { id: 'lookout', pos: [-8.6, -6.0], r: 2.2, y: [1.3, 3.8], stubs: [[-10.3, -6.0], [-9.5, -7.5]] },
    { id: 'stepA',   pos: [-5.8, -8.0], r: 1.1, y: [0.6, 1.6] },
    { id: 'stepB',   pos: [-6.4, -3.4], r: 1.1, y: [1.0, 2.6] } ] },
  stain: { y: -0.3, rind: 0.12 },
  vents: [[-14, -14], [16, -4]],                     // mirrored; spatter fountains during the warning and rise
  falls: [{ at: [36.5, -23], dir: 90, width: 9 }],   // mirrored; where each Spillway pours off the summit
  gauge: { piers: [[11.5, -1.5]], dial: [0, 9.5, 0], r: 3 },
}
```

**Hook-ins** (short, tagged `[b5-caldera]`):

| file | change |
|---|---|
| `match.js` | Create, update (before actors, like movers) and dispose `StageLava`. |
| `actor.js` | In the fall check: `if (G.lava && G.lava.below(this.pos)) → splat(…, 'lava')`. |
| the paint system | `clearBelow(y, basinMask)` (the Practice wipe's front, made horizontal); drop splats below the level. |
| `levelMaterial.js` | Uniforms `uFloodY`, `uRindGlow`, a basin mask, for the glaze and rind. |
| `hud.js` | The Breath meter and the two banners. |
| `minimap.js` | Ledge hatching and fill. |
| `bots.js` | `floodsIn`, evacuation, the perch goal. |
| deploy crush helper | Below the lava → destroyed. |
| projectiles | Fizzle on the lava. |
| `environment.js` | `env.sea: false` (no water plane; our backdrop draws the far ocean), and the lava's under-light. |
| `karpField.js` | Rebuild on a state change. |
| super-jump target | Redirect from doomed ground. |

**Reused:** StageClock, nav layers and `shoveActor` from `stageKit.js`; dynamic blocks and rider carrying from
pods and movers; the inkWipe front for clearing.

**Tests:**
- `tools/botlab/tests/lava.js` checks:
  - the timetable at sampled times, and the quiet finish for 90, 180, 240 and 300 s matches;
  - no lava splat before warning + 13.8 s;
  - ledges flood at 41.8 s and clear at 74.2 s;
  - ink on a ledge is gone after a surge;
  - a kid on an Organ is carried to 3.8, and a kid on a Stone at 73 s is splatted with cause `lava`;
  - a sprinkler on a ledge is destroyed;
  - a bot on a ledge is off within 6 s;
  - spawns are never touched.
- `net-lava.cjs`, the two-client test above.
- Plus `spawn-mid`, `cover-map`, `climb-audit`, `tower-check`, a zones match, and `bazookarp-check` at both states
  (`LAVA=low|high`).

---

## 4. Every mode on this layout

### 4.1 Turf War

The whole stage. The ledges (860 m², 12 % of the floor at low) are the swing ground: cheap to ink, and burned at every
surge. In a 3:00 match, the first surge (0:38) lands during the first fight at mid, and the second (2:03) during the
mid-game push. The match ends with the **ledge scramble** in the last 17 s (12 s in a 1:30 match). The Stones and
Organs are not turf. The Gimmick: runs.

### 4.2 Zone Control

- **Centre: the Breath Rose**, one zone: `poly rect(-5, 5, -4.5, 4.5)`, y0 −0.2, y1 0.4 (**90 m²**), on the Anvil's
  flags around the Pond spot.
  - Ways in: six (two Causeways, two bridges, the Flats at low or the Stones at high, on each side).
  - Cover: the Organ step columns at its west and east corners, the bollard, the toppled float.
  - High ground: the Organs (1.3 at low, 3.8 lookouts at high), the West and East Bridges sloping down from 1.3, and
    the toppled float (1.4).
- **Side (Alpha's): the Ferry Landing**, `poly rect(-20, -8, -28, -21)`, y0 0.4, y1 0.9 (**84 m²**); Bravo's is
  the mirror.
  - Distance: 28 m from the centre, 40 m from Alpha's pad. That is the same distance from mid as the stretched stages'
    side zones (the user wants them near mid).
  - Ways in: the Strand from the Causeway's foot (east); the Fumarole Walk's steps and Rim T1's steps (west); three
    gaps from the Wellfield (south); the Tide Stones straight onto its north edge at high.
  - High ground over it: Rim T1/T2 to the west, and the enemy's view from Alpha's Organ at high (17 m off).
- **How the Breath treats it:**
  - At high, the centre is overlooked from 3.8 m on two sides, so it is hardest to hold. The side zone takes attackers
    straight off the Stones.
  - At low, the centre is easier to hold, and the side zone's danger moves west, to flankers coming up off the Walk.
  - Rotation (30–60 s) is independent of the Breath; both teams meet the same states. The final 30 s (centre only)
    and overtime are always at low.

### 4.3 Tower Command

**"Out of the Cauldron."** The tower crosses the lake on the Causeway, runs along the Strand, climbs onto the
Spillway Quay above the lava, comes back through the Steam Yard, crosses the Separator Deck and ends on the forecourt.
**Three checkpoints**, so the user's two-checkpoint doubling rule does not apply. The track is **≈ 130 m** with
TOWER's 60 track points: 2.2 m/s, close to the stretched stages' 2.0, and 13.3 s per checkpoint. (With two
checkpoints instead, the same story needs one more loop through the Steam Yard, to ≈ 160 m.)

Drawn for Alpha's goal on Bravo's half (+z):

```js
tower: {
  path: [[0, 0, 0], [0, 27], [-15.75, 27], [-25, 1.3, 27], [-25, 37.5], [-7.25, 37.5], [7.25, 1.3, 37.5],
         [14, 37.5], [14, 44], [0, 44], [0, 51.5]],
  checkpoints: [[0, 24], [-21, 1.3, 27], [0, 1.3, 37.5]],
  yaw: 0,
}
```

The track as straight segments (Bravo's half):

| # | segment | length | what it does |
|---|---|---|---|
| 1 | (0, 0) → (0, 27) | 27 | Down the middle of Bravo's Causeway (8 m wide, platform 2.5) and across Bravo's Strand. **Checkpoint 1 at (0, 24)** (24 m, 18 %), the Causeway's foot. |
| 2 | (0, 27) → (−15.75, 27) | 15.75 | West along the Strand, 5.75 m clear of the Flats' edge. |
| 3 | climb 1.3 at the Quay's face (x −17) → (−25, 1.3, 27) | 9.25 | Along the Spillway Quay, 1.55 m from the Spillway's railed edge. **Checkpoint 2 at (−21, 1.3, 27)** (48 m, 37 %). |
| 4 | (−25, 27) → (−25, 37.5) | 10.5 | Off the Quay's back face (drop 1.3 at z ≈ 31.2) into the Steam Yard, 1.75 m clear of the cooling tower. |
| 5 | (−25, 37.5) → (−7.25, 37.5) | 17.75 | East across the Yard and the Wellfield, south of the Valve House. |
| 6 | climb 1.3 at the Separator Deck's west face (x −6) → (7.25, 1.3, 37.5) → drop off its east face | 14.5 | Between the consoles (z 35) and the vessels (z 39.7). **Checkpoint 3 at (0, 1.3, 37.5)** (87.5 m, 67 %). |
| 7 | (7.25, 37.5) → (14, 37.5) → (14, 44) | 13.25 | Into the Wellfield's west lane (on Bravo's half), 2.5 m clear of the Silencer. |
| 8 | (14, 44) → (0, 44) → (0, 51.5) | 21.5 | Along the forecourt's front, then up it to **the goal (0, 51.5)**: 13 m short of Bravo's pad, under the Gallery, seen from the whole spawn deck. |

**Headroom.** Nothing passes over the track. The Gauge truss is at 9.0, the dial's bottom edge at 6.5, and no pipe
loops or canopies cross it. **Props** were placed to keep the platform's lane clear: no lamp, bollard, telescope or
console within 0.5 m of the 2.5 m footprint. **Floor** is under the whole platform everywhere, and **no segment ever
touches a ledge**: the lava never reaches the track.

**How the Breath treats it:**
- **Checkpoint 1 (the Causeway's foot):** at low, defenders come up off the Flats beside it; at high, attackers can
  reach the Strand over the Stones 12 m away.
- **Checkpoint 2 (the Quay):** at low, both teams come up the Spillway stairs from the floor below; at high, only
  across the Spillway Bridge, which brings the attackers' reinforcements from their own horn.
- **Headroom problems:** none. The one thing to watch in tower-check is the 1.55 m margin to the Spillway rail on the
  Quay (the rail stays; it also stops riders being knocked into the lava).

### 4.4 Bazookarp

Data, for Alpha's attack on Bravo's half:

```js
bazookarp: {
  start: [0, 0],                                    // the Pond on the Breath Rose: never floods
  weirs: [{ at: [14, 0.6, 24.5] }],                 // Bravo's Ferry Landing, where the Tide Stones come ashore
  gate: { at: [0, 50], yaw: 0 },                    // Bravo's forecourt, a level below the Gallery
  freeZones: [],                                    // only the automatic spawn-deck zone (below)
  routes: {
    causeway: [[0, 12], [0, 28], [-4, 39], [-9.5, 44.5], [0, 50]],
    stones:   [[11.5, 7.5], [12, 14], [12, 20], [14, 24.5]],          // high only
    rim:      [[14, 2.5], [28.5, 2.5], [28.5, 22], [22, 26], [14, 24.5]],
  },
}
```

**One Bazookarp-only piece** (`onlyIn: 'bazookarp'`, mirrored): the **forecourt pipe bridge**, the steam main on
trestles across the forecourt's front. It is 18 m long (x −9 … 9 at z ±44), 0.8 m deep, with the pipes at 1.9 m
(roof). It stops a carrier dropping off the Separator Deck straight onto the Gate, and sends them round either end. It
costs one lightmap variant, `caldera.bazookarp`.

**Numbers** (my grid search on the plan, the same at low and high because the main routes use neither ledges nor
Stones):

| measure | value | requirement |
|---|---|---|
| L, Pond → Gate | **59.5 m** (12.4 s walking at 4.8 m/s, 6.3 s swimming) | 55–85 m ✓ |
| The weir | count 57 (D 33.6 m): 43 % of the way | 40–55 % ✓ |
| Weir → Gate | 33.6 m (56 % of L) | ≥ 20 m and ≥ 35 % ✓ |
| Pond → weir | route 1 34.5 (Causeway and Strand), route 2 38.6 (×1.12) | route 2 ≤ 1.6× ✓ |
| Weir → Gate | route 1 33.6 (the Wellfield's east lane), route 2 41.7 (×1.24, over the deck or the west lane) | route 2 ≤ 1.6× ✓ |
| Gate | (0, 50): 14.5 m from the pad, y 0 (≤ 3.8), on the pad → Pond line, seen from the deck | ✓ |

- **At high**, the Stones become the short route to the weir: Pond → (11.5, 7.5) → the Stones → the weir ≈ 31 m. The
  Causeway becomes route 2.
- **At low**, route 3 to the weir is Bravo's Fumarole Walk under the East Bridge to the Strand's end.
- **Gate entrances** (15 m ring around (0, 50)), all in sight of the spawn deck: the two ends of the pipe bridge, the
  Observatory lawn's steps, and the Steam Yard's side of the forecourt. That is four, plus the Gallery behind the Gate
  (the defenders' own side). No drop over 2.5 m lands in the ring.

**Free zones.** Only the spawn decks (automatic). I checked the plateaus the checker will look at:
- The Observatory terrace and Rim T2 (2.5) can be reached by the enemy by hopping 1.2 m from T1 or the lawn anywhere
  along the seam, and by stairs.
- The Separator Deck and the Quay (1.3) can be hopped onto.
- The Organs at high are at mid and climbed by hops by both teams.
- No free zone lies on a route only the lava opens (the Stones).

**How the Breath treats it:**
- Lava is a fall (S25/S26 by last footing). A carrier on a ledge when it floods, or on a Stone when it sinks, falls.
  On their own half the Bazookarp goes back to the Pond; on the enemy half it lands at the last footing.
- The drop spot never uses ledge or Stone nodes. Lava rising under a resting Bazookarp cannot happen, because it never
  rests on a ledge.
- The Carp Field is rebuilt at each change between low and high. L stays at its start value and the weir's count does
  not move (the weir → Gate leg is dry in both states).
- **The carry plays with the tide.** A carrier picking up at the Pond with 20 s of high left takes the Stones straight
  to the weir. One picking up at low can go wide through the Walk or the Spillway, but must be off before the horn
  plus 13.8 s. Expected carry: about 13 s walking Pond → Gate with no enemies, 20–35 s with a fight at the weir: well
  inside the 60 s fuse.

### 4.5 Boss Battle: yes

- **Home ground.** HULLBREAKER's home is the biggest floor-0 region toward Bravo's end: Bravo's Strand, Wellfield,
  Steam Yard and forecourt, about 1,800 m² of floor 0 less the Separator Deck. That is far above the 150 m² minimum.
  Set `boss.floorY: 0`.
- **The lava never touches it.** The boss nav already treats the −1.0 ledges as drops, so it never walks onto them.
  The Breath runs: the squad's routes change, the boss's do not.
- **Charges** stop on the Silencer, the cooling tower, the vessels and the Valve House (stun windows). If it reaches
  the Anvil, the Organs are dynamic walls to its charge (`dynWall`, as Treehills' hedges are).
- **Set piece:** HULLBREAKER roars at the Breath Horn. Two surges in the 4:00 round, a calm last 77 s.
- To check: `boss-check.js` adapted (home ground, roaming, never idle more than 8 s, moves played), plus a run with the
  Breath on.

### 4.6 The gimmick per mode (summary)

| mode | Breath | what it changes |
|---|---|---|
| Turf War | runs | The ledges burn twice (3:00). The match ends on the ledge scramble. |
| Zone Control | runs | The centre is overlooked by the Organs at high. The side zone's threat swaps between the Stones (high) and the Walk (low). The final 30 s and overtime are calm. |
| Tower Command | runs | Checkpoints 1 and 2 change who can reach them with the tide. The track never touches lava. |
| Bazookarp | runs | High makes the Stones the short way to the weir; low opens the wide flanks. Lava is a fall. Field rebuilt per state. |
| Boss Battle | runs | The squad's routes change, the boss's ground never floods. |
| Practice | runs | Endless cycle on the stage clock (stageSync online). |

---

## 5. The look

### 5.1 Architecture

**Tidefire Geothermal & Observatory, est. 1931.** Dark basalt ashlar with pale lime-mortar joints, cream window
frames, riveted iron painted verdigris grey-green, copper gone green on the domes and flashings, aluminium-clad
pipework, brass instruments.

- **The Powerhouse** (each spawn): a long basalt hall with three tall arched windows facing the lake and
  **TIDEFIRE** in iron letters over them. A green copper hip roof frames the flat roof terrace (the spawn deck) and its
  iron balustrade. Inside the windows, the turbine hall (lit at dusk).
- **The Observatory:** a squat round basalt tower with a green copper dome and an open slit. A seismograph drum shows
  in a window; anemometers and a radio mast stand on the parapet.
- **The Gauge:** the two basalt piers with iron cap-houses, the riveted truss between them, and the dial: cream
  enamel, black lettering LOW · RISING · HIGH · FALLING, a single red band at HIGH, and a lamp ring round the rim. On
  each pier's lake face, an iron float in a cage rides up and down on rails, its chain running over a sheave to the
  needle: you can watch the lava drive the dial.
- **The Wellfield:**
  - valve trees painted green-grey with brass wheels (no red);
  - the Separator Station's two tall riveted vessels with sight-glasses and a valve gallery;
  - the Silencer (a squat concrete drum pouring steam) and the timber-slatted cooling tower with its fan cowl and
    plume;
  - aluminium pipelines on painted steel saddles, with one tall square expansion loop over the west lane at the
    Silencer (underside 4.2: a gateway, off the tower track).
- **The visitor walk:** the Strand's iron lake rail (rail collider), coin telescopes, timber benches, the
  **LAVA TIDE TABLE** board (a mural of the Breath's cycle), the Ferry Landing's capstan, the stone Winch House, and
  signs: `TIDE STONES — HIGH LAVA ONLY`, `BLACK LEDGES FLOOD WITHOUT FAIL`, `MIND THE BREATH`.
- **Nature:**
  - black ropy pāhoehoe glaze on the ledges, and hornitos (spatter chimneys) that smoke;
  - fumaroles crusted pale grey-white (never sulphur yellow) and pumice boulders;
  - layered warm-grey tuff walls on the rim terraces;
  - silver tussock grass, grey lichen and a few small ferns in cracks.

### 5.2 Materials, palette, and the lava next to the ink

**Three stage surfaces:**
1. **Basalt flags**: dark charcoal with pale joints, for the Anvil, Causeways, Strand and decks. Ink pops on it.
2. **Ash tuff**: warm mid-grey with pumice flecks, for the rims, Wellfield and yards.
3. **Ledge glaze**: glossy black ropy crust, for every floodable floor, so "black floods" reads at a glance.

Shared concrete, metal panel and stone step patterns cover the rest.

**Palette:** charcoal `#2b2b2e`, tuff `#8a8378`, ash white `#e6e1d6`, verdigris `#6f9a8d`, iron green-grey `#4e5a55`,
aluminium `#c8ccd0`, cream enamel `#efe8d4`, copper green. **No orange, no yellow, no pink and no saturated blue
anywhere in the architecture.** Team ink is the only saturated mid-value colour on walkable ground.

**The lava, designed to stay quieter than ink:**
- **Mostly crust.** About 75 % of the surface at low (55 % at high, 40 % while rising) is near-black crust plates
  (`#1c1412`) that drift and grind. The light comes only from the **seams**.
- **The seams** run from a crimson edge (`#7d1408`) to a **white-hot core** (`#fff0c8`). The mid-orange band between
  them is a hairline, at most 15 % of the seam width. The lava reads as black and white-hot with red edges, not as an
  orange sheet.
- **Per-palette shift.** When either team's ink is orange or red (Tangerine `#ff8a14`, Cherry `#ff4150`; also
  Bubblegum and Magenta), the shader drops the orange band entirely: crimson straight to white-gold.
- **Ink never sits on lava.** Lava burns it. Between them there is always a band of dark basalt and the pale rind,
  so team colour never touches lava colour on screen.
- **Glow light** is deep red (`#8a2a12`), low saturation, cast up onto rock faces and the Gauge truss. Only
  white-hot seams and lamps reach bloom; ink never blooms.
- **Ash and embers** are grey-white and dark, not orange sparks.
- **Check:** pictures at high lava with all five palettes and the colourblind palette, from the Strand and from an
  Organ.

### 5.3 The tide rind (the stain line)

On every face the lava can reach (the lake walls, the Anvil's sides, both Causeways' sides, the ledge walls, the
bridge piers, the hornitos, the Gauge piers, the Spillway walls):
- **Below −0.3, the glaze:** the rock turns glossy, vitrified black, with drip streaks running down from the line.
- **At −0.3, the rind:** a crisp 12 cm band of pale ash-white crust with a fine crimson hairline under it, the same
  height everywhere. From 40 m away it reads as one level white line ringing the whole lake, like a bathtub ring or a
  tide mark on harbour stone.
- **Above it:** dry tuff or basalt.
- **Built in the level shader:** world y < `uFloodY` inside the basin mask gives glaze, |y − `uFloodY`| < 0.06 gives
  rind. Ink paints over it like any wall, and the lava burns the ink back off below the line.
- **During the warning** the rind glows dull red (`uRindGlow`). At high the lava's seething edge sits exactly on it.
- **Storytelling:** older, fainter rinds high on the outer crater walls of the backdrop show that the lake once
  breathed much higher.

### 5.4 The far backdrop, every side

- **South and north** (behind each Powerhouse): the summit falls away steeply.
  - The station's access road switchbacks down between stone retaining walls.
  - A funicular's cream-and-green cars and pylons run down to a cloud layer.
  - Far below lies the ocean, with a reef ring and a small harbour town on the coast.
- **West and east** (behind the rims): the crater rim drops outside into the volcano's flanks, ribbed with old black
  and rust-brown flows, then a sea of clouds.
  - On the eastern horizon: an older, dormant volcano with a snow cap.
  - On the western horizon: **Little Breath**, a younger cone 3 km off, steaming. It erupts during the Great Breath.
- **The breaches** (south-east and north-west): beyond each Spillway's lip, the lavafall pours down the outer flank as
  a 60 m glowing ribbon. It becomes a channel that snakes down the mountain to the sea, where a white steam plume
  rises. At low these channels are dark crust with a faint glow; at high they are bright.
- **Overhead:** the lake's own plume of steam and gas rises straight into the sky, lit from below.
- **Environment:** `env.sea: false` (we are at 1,500 m; the backdrop draws the far ocean), `bay: false`,
  `edge: 'none'` (we dress our own rim edges), no boats, no gulls, no buoys, light `weather.mist` at the lake.

### 5.5 Day and dusk

- **Day.** High-altitude light: a deep blue zenith, a hazy amber-grey horizon (volcanic haze), a strong high sun,
  white steam everywhere. The lava reads as black crust with bright cracks; its glow is subtle until high.
- **Dusk.** A violet-blue sky with the lava as the main light. The lake paints the Anvil's faces and the Gauge truss
  red from below. Warm-white lamps (not orange) line the Strand, the Powerhouse windows glow, and the lavafalls are
  glowing ribbons down the dark mountain under the stars. The plume glows from below, and the Gauge's dial is backlit.

### 5.6 The intro fly-in and the stage-select hero shot

- **Intro.** Start low outside the south-east breach, looking up the Spillway at the dark lip and the old lavafall
  channel. Fly in along the Spillway, over Bravo's horn, across the lake past the Gauge's dial (the needle on LOW),
  and climb above the Anvil to frame the whole pinwheel with the plume rising out of it. Then drop over the team's
  Strand and Separator Station to its Powerhouse roof. Roughly
  `intro: { from: [44, 10, -26], lookFrom: [0, 2, 0], toBack: 3.0 }`.
- **Hero shot** (stage select), high over Alpha's Observatory terrace looking north-east across the lake **at high
  lava** (a new `art.lava: 'high'` option holds the state for the picture):
  - the Tide Stones in their line and the Organs raised;
  - both Spillways pouring and the Gauge's needle in the red;
  - Bravo's Powerhouse beyond, the plume, and Little Breath smoking on the horizon.

  Roughly `art: { from: [-34, 26, -60], look: [6, 0, 6], fov: 56, lava: 'high' }`. The dusk version uses the same
  camera.

### 5.7 Signage and murals

Station stencils in cream on charcoal:
- `TIDEFIRE GEOTHERMAL & OBSERVATORY · EST. 1931`;
- `SEPARATOR STATION 2`, `WELL 4`;
- the LAVA TIDE TABLE (the cycle drawn as a wave with LOW / RISING / HIGH / FALLING);
- the hazard bands (black and white diagonal stripes, never yellow);
- crossed-out footprint pictograms on the ledges' edges;
- `MIND THE BREATH` on the Causeway's plinths.

---

## 6. The three biggest risks and how I would handle them

1. **The lava fights the ink for the eye.** Lava is orange and glowing; so is Tangerine ink, and Cherry is close. If
   the lava wins, the stage fails the user's first rule.
   - Handle it with the palette in §5.2: crust-first lava, a hairline of orange that disappears when a team is
     orange or red, ink and lava never touching, dark basalt everywhere ink lands, and bloom only on white-hot seams.
   - Prove it before any other look work: pictures at high lava for all five palettes and the colourblind palette.
   - Fallback: a near-black "cooling" lava with crimson seams only.
2. **The tide makes the stage worse to play, not better.**
   - Players could die to lava and blame the stage. The flood could turn mid into Causeway-and-bridge chokepoints. Or
     the opposite: it could change so little nobody cares.
   - What guards against it:
     - the fixed, announced timetable with ≥ 13.8 s of warning;
     - ways off every ledge within 9 m;
     - three ways onto mid per side in both states, and two crossings on every flank in both states;
     - objectives that never flood, and the quiet finish.
   - Then measure on the Mac mini: 16 turf + 16 zones matches with the Breath running against `modes: 'low'` (held).
   - Targets:
     - lava splats ≤ 1.5 per player per 3:00 match (that is the gimmick biting, not griefing);
     - bots' stuck % unchanged;
     - no side bias;
     - kills at the Causeways at high within 1.5× of low.
   - Tune `high` (18–30 s) and `period` (75–95 s) in the data, not in code.
3. **Engine scope:** a moving kill surface, sixteen dynamic floors with nav for the Stones and Organs, paint
   clearing by height, the rind shader, the bots' flood model and a field rebuild for Bazookarp.
   - Handle it by reuse: StageClock, nav layers and shoves from `stageKit.js`; dynamic blocks and rider carrying from
     pods and movers; the Practice wipe's front made horizontal for clearing; Bluestone's state-masked union graph if
     it lands.
   - Build in order, each step tested:
     1. timetable, lava plane and kill;
     2. ink clearing;
     3. Stones and Organs;
     4. bots;
     5. HUD and sound;
     6. the look.
   - If time runs out, the Organs can ship as fixed 1.3 m columns with the Stones only. The rule set does not depend
     on them, but the user asked for lookouts, so they stay in scope.

(Smaller, noted: the floor is ~20 % above Craters. Trim the base wings by 3 m if the lightmap budget (`size-budget.js`)
or the paint density complains.)

---

## 7. What to check first in the blockout

1. Plain boxes for §2.3, the lava as a flat plane at −1.6 / −0.3 toggled by hand: `check-maps`, a top shot at each
   level, `spawn-mid` (target 5.6–6.2 s), `cover-map` at each level.
2. A turf bot match at each held level (`modes: 'low'` / `'high'`): stuck %, where fights happen, whether the Anvil
   is reachable in both states.
3. The timetable running: the evacuation test, then a 3:00 match with lava splats counted.
4. `tower-check` on the track above, then `bazookarp-check` with `LAVA=low` and `LAVA=high`.
5. The lava-against-ink pictures (§5.2) before any detailing.
