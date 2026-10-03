# Bluestone: concept "play" (competitive play first)

One of three independent concepts for `bluestone`. This one is designed from how a 4v4 fight flows: the mid fight first,
then the lanes and flanks, heights, spawn depth and each mode's objective. The place is dressed on top of that. A paper
design: every number below can be built from as written.

The engine design next to this file (`engine-draft.md`, the era engine; first written as `engine.md`) sets hard limits for level designers (its §5). This
concept follows them. Where it touches one, the rule number is given as "(E14)" and so on.

## 0. Conventions

- **World axes.** +x is drawn to the right and +z (Bravo) up. Alpha faces up the page, so Alpha's left (+x) is on the
  page's right. Alpha's half is listed. Bravo's is the 180° turn: (x, z) → (−x, −z).
- **The grid frame (u, v).** The city grid is turned 20° off the spawn axis, the way an old grid follows its river.
  - u runs along the Promenade toward Bravo. v runs across it toward Alpha's left.
  - x = 0.342·u + 0.940·v and z = 0.940·u − 0.342·v. Back the other way: u = 0.342·x + 0.940·z and
    v = 0.940·x − 0.342·z.
  - A grid box is `O(cx, cz, sizeV, sizeU, y0, y1, 20)`. Its local x axis is v and its local z axis is u (the obox
    convention in `mapThumb.js` / `level.js`).
- **The diagonal frame (σ, ω).** Flathead Street, the diagonal, crosses the grid at 60° (world heading 80°).
  - σ runs along it toward the east arm. ω runs across it, positive toward Alpha's side.
  - u = 0.5·σ − 0.866·ω and v = 0.866·σ + 0.5·ω.
  - A diagonal box is `O(cx, cz, sizeΩ, sizeΣ, y0, y1, 80)`.
- **Era tags** use the engine's format: `eras: '1' | '12' | '23' | '3'`, with no tag meaning all three. "Era 1" is the
  1880s, "era 2" today and "era 3" the 3000s. The HUD names come from the engine: `1880s / TODAY / 3000s`.

---

## 1. Names and identity

**Name options**
1. **Bluestone Junction** (preferred; id `bluestone`)
2. **Under the Clocks**
3. **Clockface Crossing**

The stage, its signage and its blurb never say Melbourne. Street names are fish puns in the house style. They are
optional, and the lead may drop them if they read too close:
- the Promenade is **Swimston Street**;
- the diagonal is **Flathead Street** and its station is **Flathead Street Station**;
- the café lane is **Degrayling Lane**, the laneway square **Centre Plaice**, and the street-art lane **Hoki Lane**;
- the arcade is the **Barra Arcade**, the river the **Yabby**, and the riverside walk the **Yabby Walk**;
- the pub is the **Young & Jackfish**.

**Identity.** A river-bend city where two tram streets cross at a slant under the station's famous row of clocks.
- Swimston Street is the long boulevard on the old grid. Flathead Street is the even older road that cuts the grid on the
  diagonal toward the wharves.
- Between them run bluestone laneways full of cafés and murals, a glass-roofed arcade and a riverside walk.
- At the crossing stands the station concourse. An iron arch carries the row of clocks over it, and a dome sits on the
  arch.
- In the dome's lantern hangs **Commander Tartar**: a 12,000-year-old AI in the shape of an old telephone. He is running
  the city's clock forward to watch how the world ends, so that he can go back and tell the Professor how to start it
  anew. Every time he rings, the city jumps:
  - **1880s**: cable trams, gaslight, hoardings, a dome still in timber scaffolding;
  - **TODAY**: electric trams, café laneways, street art, glass towers behind the old facades;
  - **3000s**: floating trams, a sky-bridge and a high line over the streets, a garden deck over the river.
- The landmark, seen from everywhere, is the clock arch and its dome with Tartar's lantern at the top.

---

## 2. The plan

### 2.1 Macro shape: a skewed X

- **The long stroke.** The city grid runs from Alpha's base to Bravo's base. It is about 58 m wide (three lanes and two
  riverside routes) and is tilted 20°, so from above it runs from bottom-left to top-right.
- **The short stroke.** Flathead Street crosses the long stroke at mid at 60° (world heading 80°). Its two arms run
  46 m out from the centre, to x = ±47.
- **Four river bends.** The Yabby cuts into all four re-entrant corners. The two big bends (south-east of Alpha's
  laneways, north-west of Bravo's) are 14–18 m deep. The two smaller ones sit beside the wharf ends of the arms.
- The result is a four-pointed, skewed X: two long points (the bases) and two short points (the wharves). It is widest
  through mid: the junction plus both arms are 94 m across.
- This shape is unlike the round aquarium, the crescent caldera and the twelve existing stages:
  - Kelpline and Cargo are a straight diagonal band.
  - Treehills is a diamond with no arms.
  - Terraces and Spirhalite are curved S shapes.
- **Bounds:** x −50…50, z −81…81. The engine house's back corners are the farthest points, 80 m from the centre (E37
  allows 85 m).
- **Walkable floor** (raster estimate, both halves): about 7,200 m² in era 1 (reachable), 7,900 m² in era 2 and
  8,300 m² in era 3. That is a little larger than Calamari after the stretch (6,071 floor cells). It needs watching for
  the paint and lightmap budgets (Risk 3).

### 2.2 The whole stage in era 2 (world view, 2 m per character)

Legend:
- Floors:
  - `.` street or plaza (0)
  - `q` the Quay (river level, −0.5); `r` the Yabby Walk and its boardwalk (−0.5)
  - `a` the Barra Arcade (covered, 0)
  - `c` Degrayling Lane (0); `s` Centre Plaice (0); `l` Hoki Lane (0)
  - `=` the swing bridge (−0.5); `~` the creek (water)
- Raised pieces:
  - `C` the concourse (2.4); `L` the clock-arch legs
  - `p` corner plinth (1.3); `M` the Monument terrace (1.3); `b` the beer-garden deck (1.3); `h` the hotel terrace
    (1.3); `w` the wharf deck (1.3)
  - `i` tram islands (0.3); `T` parked trams (roof)
  - `#` spawn deck (3.2); `/` stairs and ramps
- Buildings: `B` (roof, out of play) and `H` (the engine house).
- Era pieces: `%` stands only in some eras (§3).
- Lower-case letters are Bravo's copies. `O` is the centre.

```
   82                          hhh
   80                          hhhhhh
   78                         hhhhhhhhh
   76                         hhhhhhhhhhhh
   74                        ....hhhhhhhhhhhh                       Bravo's engine house (spawn) at the top right
   72                        .......hhhhhhhhhhhh
   70                        ..........hhhhhhhhhhh
   68                       .......///..#hhhhhhhhhhhh
   66                       .......////#####hhhhhhhhhhhh
   64                       ........../########hhhhhhhhhhh
   62                      ...........###########.hhhhhhhh
   60                      ............##########...hhhhhh
   58                      ............../######////...hh
   56                     ...............///.###.///.....
   54                     rr.............///...#.........
   52                    rrrbbb.........////............
   50                    rrbbbcccc......................
   48                    rrbbbcccb .....................
   46                   rrrllbcccb.....................
   44                   rrbblccccb.....................
   42                   rrbbbcccbb.....................
   40                  rrbbbbcccb.............  ......
   38                  rrbbbcccbb.............baaa....
   36                  rrbsbcccbb..m.........bbaab qq
   34                 rrbbssssc...mmmm.......abaabqqq
   32                 rrsbssss....mmmmmmm....aaaaaqqq
   30                rrrssssssbb..mmmmmmmm.%baaaaa=q
   28                rrsssssssb....mmmmmmm.%bbaaaq=~
   26              rrrrssssss.........mmm.%%baabbqqq
   24              rrbbbbbsss...........m.%bbaabbqq
   22             rrrbbbbcccc.........t...%baaabqqq
   20             rrbbbbbcccbb.....ii.tt.%%baabbqqq
   18             r.bbbbbcccb......ii.t...bbaabqqq  ..
   16             rbbhbb.ccbb......i.tt...aaaa.qqq.www
   14              ..hhh....b......i.tt.....a...q...www            Bravo's east arm and wharf
   12             ....hh.......///..tt..............www
   10             ............./////.............ttt...
    8            ............pCC//////.........ttttt...
    6             ...........CCCCC///..................
    4       .................CCCCCCCC....iii............
    2    BBB............../..LCCCCCCC//..i...........bbb
    0    BBB.............///CCCCOCCCC///.............bbb            <- mid: the concourse under the clocks
   -2    BBB...........i..//CCCCCCCL../..............bbb
   -4    ............iii....CCCCCCCC.................
   -6     ..................///CCCCC...........
   -8     ...TTTTT.........//////CCp............
  -10     ...TTT............./////.............
  -12     www..............TT..///.......hh....                     Alpha's west arm and wharf (left)
  -14     www...q...a.....TT.i......B....hhh..
  -16      www.qqq.aaaa...TT.i......BBcc.BBhBBr
  -18      ..  qqqBaaBB...T.ii......BcccBBBBB.r
  -20         qqqBBaaB%%.TT.ii.....BBcccBBBBBrr
  -22         qqqBaaaB%...T.........ccccBBBBrrr
  -24         qqBBaaBB%.M...........sssBBBBBrr
  -26        qqqBBaaB%%.MMM.........ssssssrrrr
  -28        ~=qaaaBB%.MMMMMMM....Bsssssssrr
  -30        q=aaaaaB%.MMMMMMMM..BBssssssrrr
  -32       qqqaaaaa....MMMMMMM....ssssbsrr
  -34       qqqBaaBa.......MMMM...cssssbbrr
  -36       qq BaaBB.........M..BBcccBsbrr
  -38      ....aaaB.............BBcccBBBrr
  -40      ......  .............BcccBBBBrr
  -42     .....................BBcccBBBrr
  -44     .....................BcccclBBrr
  -46     .....................BcccBllrrr
  -48    ..................... BcccBBBrr
  -50    ......................ccccBBBrr
  -52    ............////.........BBBrrr
  -54   .........#...///.............rr
  -56   .....///.###.///...............
  -58   HH...////######/..............
  -60  HHHHHH...##########............
  -62  HHHHHHHH.###########...........                              Alpha's engine house (spawn), bottom left
  -64  HHHHHHHHHHH########/..........
  -66    HHHHHHHHHHHH#####////.......
  -68       HHHHHHHHHHHH#..///.......
  -70          HHHHHHHHHHH..........
  -72            HHHHHHHHHHHH.......
  -74               HHHHHHHHHHHH....
  -76                  HHHHHHHHHHHH
  -78                     HHHHHHHHH
  -80                       HHHHHH
  x:  -50       -30       -10   0   10        30        50
```

### 2.3 Alpha's half in the grid frame, all eras overlaid (2 m per character)

This is the builder's view. Every piece is an axis-aligned box here: u runs up (toward Bravo), v runs right (toward
Alpha's left). Rows above u = 0 are Bravo's half.
- `%` stands only in eras 1–2 or era 1 (§3.4).
- `X` and `R` appear in era 3 (§3.5). The `/` column at v ≈ −10, from u −36 to −24, is the era-3 west stair inside its
  era 1–2 site.

```
  v:      |    |    |    |    |    |    |    |       (v −48 … +38; | every 10 m; v = 0 is the Promenade's axis)
   14         rrbbbbbcccx........t.................
   12         rrbbbbbccxx..//..//.......i..........
   10         rrbbbbb...x..////////....ii..........
    8         r.bhhhb......////////..............
    6         rrbhhhh.....pCCCCCCCC//..........
    4           ...hh......CCCCCCCC///......%%%
    2          ............CCCCCCCC/./......%%
    0          ............LCCCOCCL............          <- the concourse (u −7…7, v −8…8)
   -2           %%.....././CCCCCCCC............
   -4          %%%......///CCCCCCCC......hh...           <- hotel terrace (1.3), SE plaza
   -6          ..........//CCCCCCCCp.....hhhhBrr
   -8        ..............////////......BhhhB.r         <- Alpha's grand steps (u −12…−7)
  -10      ..........ii....////////..X...BBBBBrr         <- High Line on E shops N (era 3)
  -12     ...........i.......//..//..XXccBBBBBrr
  -14   .BB.................T........XcccBBBBBrr         <- W arm tram + island (left), Promenade tram + island
  -16    BBB......T.........T.ii.....XcccBBBBrrr
  -18     ......TTT.........T.ii.....XXssBss%rr          <- Plaice Lane, Centre Plaice
  -20     .....TTT.......XXXXXXXXXXXXXssssss%rr          <- the Sky Bridge (era 3) across the Promenade
  -22      ...TT.....a%aaXXXXXXXXXXXXXXsssss%r           <- arcade north door, goods-yard fence
  -24      ...w...qq. aBB/..T........BXsssss%rr
  -26       www...qqBBaBB/...........BBssssb%r
  -28        www..qqBBaaB/.MM.MMMMM..BBssssb%rr          <- Monument terrace (u −36…−28)
  -30        ww.RRqqBBaaB/.MMMMMMMM....csBBbrrr          <- Cod Lane
  -32       RRRRRRqqBBaaB/.MMMMMMMM..BcccBBBrrr
  -34       RRRRRRqqBBaaB/.MMMMMMMM..BcccBBBrrr
  -36       RRRRRRqqBaaaB..MMM....M..BcccBBBrrr
  -38        RRRRR==aaaaa............Bccc%lBrr           <- swing bridge, rotunda, Hoki Lane (era 1: gated)
  -40       RRRRRR=~aaaaa............Bccc%llrrr
  -42       RRRRRRqqBBaaB............BBccBBBBrr
  -44            qqqBBaaB............BBccBBBBrr
  -46             qqBaaaB............BccccBBBrr
  -48            qqq.%%%................c.B.%%%          <- arcade S hoarding, goods-yard gate (era 1)
  -50             .............................          <- the tram terminus (Bazookarp goal at u −52)
  -52             .............................
  -54             ...........////..............          <- base grand stair (u −61…−54)
  -56             ............//...............
  -58             .............///..............
  -60             ............///..............
  -62            .........##########..........           <- spawn deck (3.2), pad at u −66
  -64            .....////##########/.//......           <- spawn ramps W and E (v ±10 → ±18)
  -66            .....////##########////.......
  -68             .....///##########.///......
  -70             HHHHHHHH##########HHH.HHHHHHH          <- the Cable Engine House
  -72 … -78       HHHHHHHHHHHHHHHHHHHHHHHHHHHH
```

### 2.4 Heights, and what a 1.8 m climb means

| Tier | Where | How a kid gets up |
|---|---|---|
| −0.5 river level | the Quay, the Yabby Walk, the boardwalk, the swing bridge (water at −1.6) | 0.5 m kerbs with short ramps (18°) at every join |
| 0 street | the Promenade, Flathead Street, the lanes, the plazas, the forecourt | — |
| 0.3 | the tram islands | step |
| 0.6 | the River Deck (era 3) | 0.6 step from the arm, 1.1 m hop from the quay |
| 1.3 | the Monument terrace, the beer-garden deck, the hotel terrace, the wharf deck, the concourse corner plinths | a hop, or steps |
| 2.4 | the concourse | stairs, ramps, or plinth 1.3 then a 1.1 m climb. Its 2.4 m walls are too high for a kid (1.9 m and up is a wall), so squids swim them |
| 3.2 | the spawn deck | stairs and ramps |
| 5.4 | the era-3 Sky Bridge, its landing and the High Line (underside 5.0) | the west stair (12.2 m run, 24°), or squids up the High Line's 5.0 m living walls |
| roof | trams 3.2, verandas 3.4, shops 7, hotel 9, engine house 9, the arch, dome and lantern 11–20 | never: off-limits, slide off |

- Every 1.3 m top can be hopped from the street. The 2.4 m concourse is the only tier you must earn: there are six
  stairs, ramps and plinth routes up it, and squids can swim any of its walls.
- Nothing walkable is out of reach on foot. Every 1.3 / 2.4 / 3.2 / 5.4 top has a stair or ramp.

### 2.5 Lanes and flanks (Alpha's half; Bravo's mirrors)

| Route | Eras | Where it starts | Where it meets mid | Length (m) | Swim (s) |
|---|---|---|---|---|---|
| **Centre: Swimston Street** (24 m wide, trams, the Monument terrace) | all | the grand stair | the concourse's south grand steps | 54 to the steps' foot, 66 to the centre | 4.6 / 5.6 |
| **Right inner: the Barra Arcade** (covered, 4 m, rotunda half way) | 2, 3 | west ramp → west apron | its north mouth on the west arm, σ −26 | 60 | 5.1 |
| **Right outer: the Quay** (river level, creek and swing bridge) | all | west ramp → west apron | the west arm near the wharf (σ −34), then along the arm | 58 to the arm, 76 to the junction | 4.9 / 6.4 |
| **Left inner: Degrayling Lane** (6 m, cafés, Centre Plaice half way) | all | east ramp → east apron | the SE plaza and the east arm's south side | 76 | 6.4 |
| **Left outer: the Yabby Walk** (river level, boardwalk jog) | 2, 3 | east ramp → east apron | the east arm, Bravo's home arm (σ +27) | 91 | 7.7 |

Cross links:
- **Plaice Lane** (u −24…−18) and **Cod Lane** (u −32…−28) join the Promenade to Degrayling Lane in every era.
- **Hoki Lane** joins Degrayling Lane to the Yabby Walk (eras 2–3).
- The arcade's **north door** (u −23.5…−20.5) and **rotunda door** (u −41…−37) open onto the Promenade (eras 2–3).
- In era 3 the **Sky Level** joins the Promenade's west footpath to the east shop roofs, 5.4 m up.

What this means in play:
- **Each team gets a home side and an away side.** The right side (the arcade and the Quay) feeds your own arm of
  Flathead Street. The left side (the laneways) feeds the enemy's arm.
- **Each arm is where one team's home flank meets the other team's away flank.** Alpha's west arm takes Alpha's arcade
  and Quay from the south face, and Bravo's Degrayling Lane (σ −14) and Yabby Walk (σ −27) from the north face. So the
  two arms are the second and third battlefields beside the concourse.
- **The routes meet mid at four different points:** the south steps, the west-arm mouth, the SE plaza and deep on the
  east arm.
- **Route counts per half:** era 1 has three (two flanks), era 2 five (four flanks), era 3 five plus the Sky Level. That
  meets E32 (2–4 flanks per side in every era) and E35 (no route removed without another way).
- **Spawn to mid is 66 m straight**, about 5.6–5.9 s of nav swimming. That is inside E33's 5.4–6.6 s and the Long
  Stages standard of about 60 m and about 6 s. Measure it with `spawn-mid.js ERA=1/2/3`.

### 2.6 Mid: "Under the Clocks"

- **The junction.** The Promenade (24 m) and Flathead Street (22 m) cross at 60°. The open floor is about 40 × 40 m,
  plus each arm's mouth.
  - The concourse stands in the middle. It has open street on every side: 5–12 m on the south and north, more than 10 m
    on the west and east, and both arms run off its corners.
  - The corners of the junction are the narrow shop ends of the Flatirons (the 60° acute corners, roofs) and the two open
    plazas in the 120° corners (the SE plaza is Alpha's, the NW plaza Bravo's).
- **The concourse**: grid u −7…7, v −8…8, top 2.4 (`single`, symmetric). It is the station's sandstone forecourt with a
  clock-face mosaic.
  - **Grand steps**, one flight per team: Alpha's at u −12…−7, v −7…7, 14 m wide, a 5 m run. They face straight down
    that team's Promenade.
  - **Side ramps**, one per arm: the west ramp at u −6…−2 runs from v −8 down to v −13.5 (2.4 over 5.5 m = 23.6°) into
    Alpha's west-arm mouth. The east ramp is its mirror.
  - **Corner plinths** (1.3, 2 × 2 m) at u −7…−5, v 8…10 (the SE corner), and Bravo's at the NW corner. A kid hops 1.3,
    then climbs 1.1.
  - Every other face is a 2.4 m inkable wall. That makes **six walk-up ways in** plus swim-up walls on every side.
- **The clock arch.**
  - Two iron legs (1.6 × 1.6 m, roof) stand on the concourse at u 0, v ±6.5. They are hard cover that splits the deck
    into a south half and a north half.
  - The arch springs between them to a crown at 11 m. The dome (a cupola 8 m across, 11→17 m) sits on the crown, and
    the lantern at 17–20 m holds Tartar.
  - The **row of clocks** hangs from the arch: seven double-faced clocks across v −4.5…4.5, at 6.6–7.7 m. Each face
    shows the countdown to the next jump.
  - The arch's underside clears the tower (2.4 + 3.72 = 6.12 m) and is out of jump reach (2.4 + 1.41 + 1.45 = 5.26 m).
    The centre (0, 2.4, 0) is open for the tower's start and the Bazookarp's shield.
- **Cover on the concourse.**
  - Two departure-board kiosks (2.0 × 0.8 × 1.2) at grid (u −3, v 3) and (u 3, v −3), world (1.8, −3.8) and
    (−1.8, 3.8). They are off the u axis, so the tower runs between them.
  - The arch legs.
  - Balustrades (rail) beside the grand steps.
- **Why it plays:**
  - The concourse is the king-of-the-hill platform both teams reach from their own steps. But each arm's ramp and plinth
    side is a flank onto it, so holding it means watching four approaches.
  - The legs and kiosks stop it being a bare plate.
  - From the deck you see down each Promenade past the tram stop to the Monument terrace, 21–29 m from the deck's edge,
    which is a charger's range. You cannot see a base: the trams and the terrace break the line.
  - Down on the street, the trams, the tram islands and the plinths give ground fighters cover within 6–8 m of the
    walls.

### 2.7 The base: spawn depth and re-forming

- **The Cable Engine House** (grid u −78…−70, v −18…18, 9 m, roof) holds the spawn.
  - In the 1880s it is the steam engine house that pulled the cable trams. Today it is the tram depot, and in the 3000s
    a hangar for hover trams.
  - Its chimney (18 m) is the base's landmark.
- **The spawn deck** is the engine house's iron-railed front gallery: u −70…−61, v −10…10, at 3.2. The pad is at grid
  (−66, 0), world (−22.6, 3.2, −62.0), with a 4.2 m barrier.
- **Exits** (four):
  - the grand stair (u −61…−54, 6 m wide) to the forecourt;
  - the west ramp (v −10 → −18, 21.8°) to the west apron;
  - the east ramp (v 10 → 18) to the east apron;
  - the deck's front corners as one-way drops.
- **The re-form area.** In front of the deck lie the tram terminus forecourt (u −61…−48) and Engine Square
  (u −48…−36): 25 m of apron with cover before the Monument terrace.
  - The west apron leads to the Quay, and in eras 2–3 to the arcade's south mouth.
  - The east apron leads to Degrayling Lane, and in eras 2–3 to the Yabby Walk.
- **E14 holds.** Nothing changes within 12 m of the pad, on the deck, or on the first 15 m of any way out. The nearest era
  piece (the arcade's south hoarding) is 25 m along the route.
- **The goal spot** (Bazookarp) is the terminus forecourt in front of the grand stair's foot: grid (−52, 0), a level
  below the deck (§4.4).

### 2.8 Cover rhythm and the "era slot" kit

Every piece of cover has **one collider in every era**. Only its look changes, as an era prop on a shared collider. So
the jump never moves cover and never puts a collider in someone's space. The kit:

| Slot | Collider (w × d × h) | 1880s | TODAY | 3000s |
|---|---|---|---|---|
| street box | 2.4 × 1.0 × 1.0 | horse trough | planter box | glass planter with light |
| phone booth (rings with Tartar) | 1.0 × 1.0 × 2.4 | timber telephone cabinet | red public phone box | light booth |
| kiosk | 2.0 × 1.4 × 2.2 | newsboy stand | newsstand / espresso window | info pylon |
| coffee cart | 2.2 × 1.2 × 1.5 | baker's barrow | coffee cart | drone café pod |
| tram shelter (on islands) | 5.0 × 1.2 × 2.6, roof | timber cable-tram shelter | glass tram shelter | light canopy |
| parked tram (two cars, one era group each: E3's 8 m limit) | each car 3.2 × 5.5 × 3.2, roof (era 3: 0.8 → 3.8, §3.5) | cable grip car + trailer | two-car low-floor tram | floating tram |
| stair site (era 3 stair inside; two 6.1 m groups) | 2.5 × 12.2 × 2.6, roof, not inkable | cab-rank shelters | construction hoarding "OPENING 3001" | (the stair) |

Spacing, Alpha's half:
- **Promenade** (24 m wide), from the base up:
  - planters at the forecourt (u −56, v ±8) and Engine Square (u −45, v ±7);
  - the Monument terrace (u −36…−28) with its statue (u −33.5, v 4.5);
  - the newsstand (u −26, v 8);
  - the tram and its island + shelter (u −25…−14);
  - the grand steps.
  - Nothing more than 8–10 m apart. The veranda posts every 5 m along both footpaths add thin cover.
- **West arm**: phone booth at σ −15, ω 7; tram island + shelter at σ −24…−18; the tram at σ −40…−29 (south track);
  a coffee cart at σ −30, ω −7; the wharf shed (σ −46…−41, north side) and the wharf deck (σ −46…−40, south side).
- **Lanes**: Degrayling Lane has café tables on its east side (0.75 m, not cover), A-frames, the coffee cart in Centre
  Plaice (u −26, v 21), espresso kiosks at (u −40, v 19.5) and (u −12, v 19), and the beer-garden deck's 1.3 m wall. The
  arcade has shopfront bays every 4 m and the rotunda kiosk (1.6 × 1.6 × 2.4). The Quay has bollards, fish crates, the
  creek and swing bridge, and a moored steamer's gangway. The Yabby Walk has the boathouse jog (u −16…−6), benches and
  bike racks (era 2), and lookout bays.
- **Long lines**:
  - The Yabby Walk is the longest open line, about 30 m to the boathouse jog. It is meant as the charger flank.
  - Degrayling Lane is broken by the square and the kiosks into runs of 18 m or less.
  - The arcade is broken by the rotunda into runs of 12–14 m.
- Measure with `cover-map.js ERA=1/2/3`. The target is 90 % or more of the floor within 5 m of cover (E34).

### 2.9 Main pieces (Alpha's half; Bravo's are the 180° turn)

Sizes are across × along, in the piece's own frame (grid: v × u, rotY 20; diagonal: ω × σ, rotY 80). Heights are the top
(or start>end for stairs and ramps). Era: 123 means all eras.

| Piece | Centre x, z (world) | Size (m) | rotY | Top | Era | Grid / diagonal extent | Purpose |
|---|---|---|---|---|---|---|---|
| Concourse (single) | (0, 0) | 16 × 14 | 20 | 2.4 | 123 | u −7…7, v −8…8 | mid's high ground, under the clocks |
| Clock-arch legs (single pair) | (−6.1, 2.2), (6.1, −2.2) | 1.6 × 1.6 | 20 | roof to 11 | 123 | u 0, v ±6.5 | cover on the deck; carry the arch, clocks, dome and Tartar |
| Grand steps (Alpha's) | (−3.2, −8.9) | 14 × 5 | 20 | 0>2.4 | 123 | u −12…−7, v −7…7 | Alpha's way up |
| Concourse ramp W | (−11.5, −0.1) | 5.5 run × 4 | 20 | 0>2.4 | 123 | u −6…−2, v −13.5…−8 | onto the deck from Alpha's arm |
| Concourse plinth SE | (6.4, −8.7) | 2 × 2 | 20 | 1.3 | 123 | u −7…−5, v 8…10 | hop-up from the SE plaza |
| Promenade (Swimston St) | (−8.2, −22.6) | 24 × 48 | 20 | 0 | 123 | u −48…0, v −12…12 | centre lane; tram tracks at v ±5 |
| Tram island + shelter | (−6.3, −17.4) | 3 × 7 | 20 | 0.3 | 123 | u −22…−15, v ±1.5 | cover 15–22 m from mid |
| Parked tram (W track, two 5.5 m cars) | (−11.4, −16.6) | 3.2 × 11 | 20 | roof 3.2 | 12 (3: floats) | u −25…−14, v −6.6…−3.4 | big cover, blocks the boulevard line |
| Monument terrace | (−10.9, −30.1) | 16 × 8 | 20 | 1.3 | 123 | u −36…−28, v −8…8 | the slice's strategic point; Bazookarp checkpoint; tower CP3. Steps north (u −28 → −25, v −6…0) and south (u −36 → −39, v 1…7), hop-up sides; statue 2 × 2 at (u −33.5, v 4.5) |
| W shops S / M | (−27.6, −36.3) / (−23.0, −23.8) | 3 × 5 / 3 × 13.5 | 20 | 7 roof | 123 | v −15…−12 | the Promenade's west frontage (no veranda between u −37 and −19) |
| E shops S / M / N | (−0.7, −41.3) / (3.8, −29.0) / (7.9, −17.8) | 3 × 14 / 3 × 4 / 3 × 8 | 20 | 7 roof (N: 5.0 in era 3) | 123 | v 12…15 | the east frontage; gaps for Cod and Plaice Lanes |
| Plaice Lane / Cod Lane | (5.5, −24.4) / (2.4, −32.8) | 3 × 6 / 3 × 4 | 20 | 0 | 123 | u −24…−18 / −32…−28 | Promenade ↔ laneways; tower route |
| Barra Arcade | (−27.8, −26.6) | 4 × 27 | 20 | 0 | 123 | u −48…−21, v −19…−15 | covered right flank; glass roof 6.0 (roof); closed in era 1 |
| Arcade rotunda | (−30.7, −30.3) | 7 × 6 | 20 | 0 | 123 | u −42…−36, v −22…−15 | the arcade's fight room; kiosk in the middle; glass dome 7.5 |
| Rotunda door / north door | (−26.0, −32.0) / (−20.2, −16.1) | 3 × 4 / 3 × 3 | 20 | 0 | 123 | v −15…−12 | arcade ↔ Promenade (eras 2–3) |
| Arcade W shops S / the Flatiron | (−34.3, −34.3) / (−29.7, −21.6) | 3 × 4 / 3 × 11 | 20 | 7 roof | 123 | v −22…−19 | the arcade's west wall; the Flatiron's north end is cut along the arm face |
| The Quay | (−35.3, −25.4) | 5 × 24 | 20 | −0.5 | 123 | u −48…−24, v −27…−22 | right outer flank to the wharf |
| Creek (water) + swing bridge | (−36.5, −28.7) | creek 5 × 3, bridge 3 × 3 | 20 | bridge −0.5 | 123 | u −41…−38 | a 3 m gap with a bridge; kids can also jump it (about 4 m) |
| Degrayling Lane | (7.3, −32.5) | 6 × 40 | 20 | 0 | 123 | u −48…−8, v 15…21 | left inner flank; tower route |
| Centre Plaice | (11.5, −29.7) | 12 × 12 | 20 | 0 | 123 | u −30…−18, v 15…27 | the laneway square; side zone |
| Beer-garden deck | (14.6, −34.6) | 3 × 5 | 20 | 1.3 | 123 | u −30…−25, v 24…27 | high ground over the side zone; steps on its north edge |
| Hoki Lane | (9.0, −45.3) | 6 × 3 | 20 | 0 | 123 | u −41…−38, v 21…27 | Degrayling ↔ Yabby Walk (gated in era 1) |
| Bond Store / Printers block | (7.3, −50.0) / (10.9, −40.2) | 6 × 7 / 6 × 8 | 20 | 7 roof | 123 | v 21…27 | laneway blocks |
| Corner Hotel + boathouse | (18.1, −20.4) + (23.0, −20.1) | 6 × 10 + 3 × 10 | 20 | 9 / 2.6 roof | 123 | u −18…−8 / −16…−6 | the pub; the boathouse makes the walk jog |
| Hotel terrace | (20.5, −13.8) | 6 × 4 | 20 | 1.3 | 123 | u −8…−4, v 21…27 | Alpha's perch on Bravo's east arm |
| The Yabby Walk + boardwalk | (19.7, −30.6) + (26.8, −21.5) | 4 × 52 + 3 × 12 | 20 | −0.5 | 123 | v 27…31 (+31…34) | left outer flank (fenced off in era 1) |
| SE plaza | (19.2, −10.2) | 19 × 14 | 20 | 0 | 123 | u −10…4, v 12…31 | the lanes' mouths on the east arm |
| West arm (Flathead St) | (−22.7, −4.0) | 22 × 46 | 80 | 0 | 123 | σ −46…0, ω ±11 | Alpha's home arm; tram track on its axis |
| W-arm tram island + shelter | (−20.7, −3.6) | 2.4 × 6 | 80 | 0.3 | 123 | σ −24…−18 | arm cover |
| W-arm parked tram | (−33.5, −8.5) | 3 × 11 | 80 | roof 3.2 | 12 (3: floats) | σ −40…−29, ω 1…4 | arm cover |
| Wharf deck / wharf shed | (−41.1, −14.4) / (−44.1, −0.2) | 6 × 6 / 5 × 5 | 80 | 1.3 / 3 roof | 123 | σ −46…−40 | the wharf end: a perch and a block |
| Base floor | (−18.3, −56.1) | 58 × 22 | 20 | 0 | 123 | u −70…−48, v −27…31 | forecourt and aprons |
| Spawn deck | (−22.4, −61.5) | 20 × 9 | 20 | 3.2 | 123 | u −70…−61 | spawn (pad at u −66) |
| Base grand stair | (−19.7, −54.0) | 6 × 7 | 20 | 3.2>0 | 123 | u −61…−54 | main exit |
| Spawn ramps W / E | (−35.7, −57.2) / (−9.4, −66.8) | 8 run × 4 | 20 | 3.2>0 | 123 | v ∓10 → ∓18 | side exits |
| Cable Engine House | (−25.3, −69.5) | 36 × 8 | 20 | 9 roof | 123 | u −78…−70 | spawn building; chimney 18 m |

The era-only pieces are listed in §3.4 and §3.5.

### 2.10 Where each weapon class shines

| Class | Best ground |
|---|---|
| Chargers, bows, splatlings | Down the arms (34 m axes, the trams breaking them), the Promenade from the concourse or the terrace, the Yabby Walk and the Quay (long river lines), and in era 3 the Sky Bridge and High Line (high and exposed) |
| Shooters, dualies, twins | Everywhere; the junction's ring round the concourse and the plazas |
| Rollers, brushes, blades, mitts | The laneways (Degrayling 6 m, Hoki 3 m, Cod 4 m, Plaice 6 m), the arcade (4 m, covered), Centre Plaice |
| Blasters, sloshers, buckets | The concourse edges (arcing over 2.4 m walls), the terrace, the rotunda, round the trams and islands |
| Brollies | The arcade and the lanes (short lines, doors) |

---

## 3. The gimmick: Tartar's time jumps

### 3.1 The rules

1. **Two jumps per match, at a third and two thirds of regulation time.** Era 1 (1880s) → era 2 (TODAY) → era 3
   (3000s). This is the engine's `at: [1/3, 2/3]`. Overtime is always in era 3. The schedule is a pure function of the
   stage clock, so it is the same on every screen with no new records.
2. **Tartar rings first.** The 10 s warning (`warn: 10`) has rings, a countdown and in-world previews (§3.8). On top of
   that I want one early "distant" ring at J − 20 s (cosmetic, a single bell from the dome), so players can start moving
   to the routes that are about to open.
3. **The Chrono Wave** leaves the dome at (0, 0) at 25 m/s (the engine's front).
   - The look of shared surfaces changes as the front passes: the surface re-skin (`remap`), the era tint and the AO
     channel.
   - Each era piece switches whole (collision, ink, nav and look together) when the front reaches its centre.
   - It reaches both pads at J + 2.6 s and the farthest corner at J + 3.2 s. Mirrored points switch at the same instant.
4. **Era 2 opens; era 3 adds.**
   - Era 2 removes closures: hoardings, gates and a fence. Nothing appears.
   - Era 3 adds high and over-water areas, and the floating trams. Nothing a team uses is removed in either jump (E35).
5. **No player is ever hurt, trapped or put inside geometry.**
   - Every appearing piece is inside an older solid of the same group (E19), over water (E20), or overhead with an
     underside 5.0 m up (E21).
   - Every vanishing piece has a roof top and no walkable surface (E27).
6. **Ink travels through time.** Ink on ground that exists in both eras stays. Vanishing pieces were never inkable.
   Appearing pieces arrive bare (§3.6).
7. **The objectives never change.** Nothing changes within 2 m of a zone (E15), 1 m of the tower's swept track and
   headroom (E16), 3 m of a Bazookarp start, checkpoint or goal (E17), or 12 m of a pad (E14).
8. **Boss Battle stays in era 3** (`fixed: 3`, the engine's choice). Practice cycles every 60 s with a 3 → 1 rewind.

### 3.2 Timeline over a match

| Mode | Regulation | Era 1 | Jump 1 (1 → 2) | Era 2 | Jump 2 (2 → 3) | Era 3 |
|---|---|---|---|---|---|---|
| Turf War 3:00 | 180 s | 0:00–1:00 | 1:00 played (2:00 left) | 1:00–2:00 | 2:00 played (1:00 left) | the final minute, with its music |
| Turf War 1:30 | 90 s | 0–30 s | 30 s | 30–60 s | 60 s | the last 30 s |
| Zone Control | 300 s | 0:00–1:40 | 1:40 | 1:40–3:20 | 3:20 | 3:20 to the end + overtime |
| Tower Command | 300 s | 0:00–1:40 | 1:40 | 1:40–3:20 | 3:20 | 3:20 to the end + overtime |
| Bazookarp | its duration (spec pending; 300 s assumed) | first third | 1/3 | second third | 2/3 | last third + overtime |
| Boss Battle | 240 s | — | — | — | — | era 3 all match |
| Practice | — | 60 s | → 2 | 60 s | → 3 | 60 s, then a rewind to 1 |

### 3.3 One jump, second by second (jump 1 of a 3:00 Turf War)

| Clock | What happens on every screen |
|---|---|
| 0:40 (J − 20) | A distant bell from the dome. The clock faces turn red-gold and count down. Small HUD line: "☎ Tartar is calling…". *(My addition, cosmetic.)* |
| 0:50 (J − 10) | **Warn** (engine). Tartar's first ring: the telephone shakes in its lantern and **every phone booth in the city rings with him**, so you hear it wherever you are. HUD callout "TIME JUMP — 1880s → TODAY in 10" and the era chip pulses. Pieces about to **vanish** (hoardings, gates, the goods-yard fence) flicker sepia. Pieces about to **appear** (era 3 only) show as pulsing holograms. The minimap draws both. The bots' danger layer goes on. |
| 0:55 | Second ring. The clocks' hands start to spin. |
| 0:57–0:59 | Short rings each second. **The time-lapse**: the sky flickers through nights and days, about four cycles in 2 s, as the hands race. Cosmetic: a grade and sky flicker, with no change to gameplay light. |
| 0:59 | Tartar picks up (`era_pickup`). HUD line: "TARTAR: Advancing the clock. Do keep up." |
| **1:00 (J)** | **The Chrono Wave** leaves the dome: a curtain 10 m tall, sepia-gold with clock-gear glyphs in jump 1 (white-cyan with hex shards in jump 2), the swell sound and a 0.25 screen shake. |
| J + 0.4 s | The front passes the concourse's edge and the arms' first 10 m. Mid is in the new era. |
| J + 1.0–1.1 s | The arcade's north hoardings (25–28 m out) burst into fluttering posters. |
| J + 1.45 s | Centre Plaice's fence (36 m) folds away. |
| J + 1.8 s | The wharf ends (46 m) flip. |
| J + 2.0–2.3 s | The arcade's south hoarding (51 m) and the goods-yard south gate (56 m) go. |
| J + 2.6 s | The front reaches both spawn pads (66 m) together. |
| J + 3.2 s | The front leaves the arena. The skyline's "horizon run" rebuilds the backdrop. |
| J + 3.7 s (done) | Nav switches to era 2 and bots replan. Minimap swapped. HUD "NEW ROUTES OPEN" (jump 2: "NEW AREAS!"). |

### 3.4 Era 1 → 2: what opens (Alpha's half; all `eras: '1'`, non-inkable, roof tops, 3.0 m tall, ≤ 8 m per group)

| Closure (gone in era 2) | Centre x, z | Grid extent | What opens |
|---|---|---|---|
| Arcade south hoarding (posters "THE BARRA ARCADE — OPENING 1892") | (−32.5, −39.6) | u −48.6…−48, v −19…−15 | the arcade from the west apron |
| Arcade north-door hoarding | (−19.1, −16.5) | u −23.5…−20.5, v −12.6…−12 | arcade ↔ Promenade at the junction's SW |
| Arcade mouth hoarding, on the arm face | (−23.5, −15.0) | σ −27.5…−24, ω 10.4…11 | arcade ↔ west arm |
| Rotunda door hoarding | (−24.9, −32.4) | u −41…−37, v −12.6…−12 | rotunda ↔ Promenade beside the Monument terrace |
| Hoki Lane gates W / E (the bond store yard, full of crates) | (6.5, −44.4) / (11.6, −46.2) | u −41…−38 at v 21 and v 27 | Degrayling ↔ the Yabby Walk |
| Goods-yard fence on the walk's edge (two 6 m groups) | (17.4, −31.9) | u −30…−18, v 27…27.6 | Centre Plaice opens onto the river walk |
| Goods-yard gates S / N | (10.7, −55.3) / (28.3, −7.1) | v 27…31 at u −48.6 and u 2…4 | the Yabby Walk from the east apron and onto the east arm |

- **In era 1 the goods siding** (rails, two goods wagons, era-1 props) sits on the Yabby Walk behind the fence. The
  arcade is a construction site under timber scaffolding, seen through gaps between the boards.
- **The closed floors are mask 7.** They count as turf in era 1 but nobody can reach them, so both teams' era-1
  percentages are lower by the same amount. Era 2's turf therefore equals era 1's (E11), and no inkable area vanishes
  (E13).
- **Cover never moves at this jump.** The trams, kiosks and stair sites keep one collider; only their looks change, from
  cable trams to low-floor trams, gas lamps to street lights, and horse troughs to planters.

### 3.5 Era 2 → 3: what is added (Alpha's half)

| Addition | Centre x, z | Extent | Top | Rule it meets |
|---|---|---|---|---|
| **West stair**, rising inside its eras 1–2 site (cab shelters, then a construction hoarding; mask `12`, 2.6 m, roof, not inkable). Two 6.1 m flights, each sharing a group with its half of the site | (−20.3, −24.5) | u −36.1…−23.9, v −12…−9.5 (2.5 wide, 12.2 m run, 24°) | 0 > 5.4 | E19 (inside an older solid), E24, E3 |
| **Sky Bridge** across the Promenade, in three 8 m groups, rails 1.0 m | (−7.3, −20.2) | u −23.9…−19, v −12…12 | 5.4 (underside 5.0) | E21, E22 (4.9 m wide), E23; E16: 5.0 ≥ 3.72 + 1.0 over the track |
| **East landing** over Plaice Lane | (5.5, −24.4) | u −24…−18, v 12…15 | 5.4 | E21, E16 |
| **High Line** on E shops N | (7.9, −17.8) | u −18…−10, v 12…15 | 5.4 | built on a swap of E shops N: its eras 1–2 block (7 m, roof, not inkable) becomes a 5.0 m block with **living walls** (inkable greenery). Squids climb them (E25: an inkable wall ≤ 5.5 m) |
| **River Deck** ("the floating garden") over the Yabby, four groups of 6 × 5 m, on prop columns, bottom +0.3 (E36) | (−42.4, −22.9) | u −42…−30, v −37…−27, trimmed off the arm band | 0.6 | E20 (over water); reached by a 0.6 m step from the arm or a 1.1 m hop from the Quay |
| **Floating trams**: each car's collider swaps from 0 → 3.2 to 0.8 → 3.8 (two 5.5 m cars per tram, one group each) | (−11.4, −16.6) and (−33.5, −8.5) | the same footprints | roof 3.8 | E19 (inside the old car), E3; the floor beneath becomes squid-only turf |

What the Sky Level does:
- It links the west footpath stair (deep on Alpha's half, near the Monument terrace) to the east shop roofs over Plaice
  Lane and the High Line, which ends 10 m from mid.
- **Kids** get up only by the west stair. **Squids** also get up the High Line's living walls from the Promenade's east
  footpath, Degrayling Lane's north end and the SE plaza. So defenders get their stair at the back, and attackers coming
  from mid get the green wall at the front.
- It overlooks the Promenade's first 25 m, Centre Plaice (the side zone, from 2.5 m outside its edge), the Monument
  terrace (the checkpoint, 4–12 m) and the concourse (14 m to its edge, 21 m to its centre: in charger range).
- The High Line's north end is an open balcony over the SE plaza: a one-way 5.4 m drop toward mid.
- The River Deck turns the wharf end of each arm into a wide open area for long-range weapons. It also gives a second way
  past the Quay's swing-bridge pinch.

**Turf**: era 3 adds about 330 m² per half (the bridge, landing, High Line, River Deck and the floor under the trams).
That is about +9 % on era 2, within E12 (≤ 1.25×).

### 3.6 Safety: players, devices, ink, turf

| Case | Rule |
|---|---|
| Standing on or against a vanishing closure | Closures have roof tops (you slide off them anyway) and non-inkable faces (nobody clings to them). When one goes, the space is simply open. |
| Where an appearing piece arrives | Only inside a solid nobody can enter (the stair site, the shop, the old tram), over water, or 5.0 m overhead. The engine's shove and rescue are a safety net; `stats.eraShoves` must read 0 in every bot match. |
| Airborne in the space of an appearing deck (Ink Jet hovering at about 3.8 m, Booyah orb, a high jump off a terrace) | The engine's shove and rescue. I'd ask it to try straight up first (onto the deck) when the feet are within 0.8 m below the deck's top, and straight down otherwise, before its 16-direction search. |
| Squid on a wall that vanishes | Drops to the floor (≤ 2.6 m, never over water). |
| Devices (sprinkler, beacon, Drip Curtain, mine, cling, buoy) on a vanishing closure | Popped with the shot-down pop (no damage) by the owner's screen (engine H17). The buoy falls and re-anchors. |
| Ink on shared ground (every street, lane, wall, deck, the concourse) | Stays. The surface under it re-skins (setts → asphalt → light-tile on the Promenade and arms), and the ink stays on top. |
| Ink on vanishing pieces | There never is any: they are not inkable. |
| New pieces | Arrive bare: fresh turf for whoever gets there first. |
| Turf % | Counted against the floor that exists now. The Turf War result is counted in era 3 (host's count, as today). |

### 3.7 What both teams can do with it

- **Pre-position for jump 1.**
  - The arcade opens at both ends at once: its south mouth on Alpha's own apron, and its north mouth and north door at the
    junction's SW corner on Alpha's own arm.
  - **Alpha** gets a covered fast lane from spawn to its arm, which is a re-take tool.
  - **Bravo** gets a back door from Alpha's arm straight to Alpha's apron. A Bravo team holding Alpha's west arm at 1:00
    can dive the arcade into Alpha's base side.
  - The Yabby Walk does the same on the east: Alpha's walk leads onto Bravo's east arm.
  - So holding the arms at the jump matters, and both teams know it 10–20 s ahead.
- **The fresh-turf rush.** About 870 m² opens at jump 1 and about 660 m² appears at jump 2, all bare. A team that is
  behind can catch up by painting the new ground. This is the comeback lever, the same for both sides.
- **Race for the Sky Level** at jump 2. It is high ground over each half's Promenade, side zone and checkpoint. Defenders
  reach theirs by the west stair. Attackers swim the High Line's living wall near mid.
- **Save specials** for the jump: Ink Jet, Tempest or Booyah into the newly opened arcade, or onto the Sky Bridge
  the moment it lands.
- **Bots do all of this** (§3.10).

### 3.8 How it is announced

- **The world**:
  - the clocks over the concourse count down to the next jump all match, and turn red-gold for the last 20 s;
  - Tartar's lantern glows and the telephone shakes;
  - every phone booth rings;
  - holograms show what appears and sepia flicker shows what vanishes;
  - the sky time-lapse;
  - the wave itself.
- **The HUD**:
  - the engine's era chip under the timer ("1880s · TODAY · 3000s");
  - the callouts "TIME JUMP — 1880s → TODAY in 10", the era banner, "NEW ROUTES OPEN" and "NEW AREAS!";
  - Tartar's line at the pickup.
- **The sound**:
  - Tartar's ring, synthesised in code (two-tone, 400/450 Hz with bell decay; cadence 0.4 s on, 0.2 off, 0.4 on, then
    2 s off);
  - the pickup click;
  - the wave's swell, and a fizz loop that rides the front past you.
- **The minimap**: dashed cyan for what appears and amber hatch for what vanishes, from the warning until done.
- **Tartar's lines** (HUD, short, original), with an "…" icon of the telephone:
  - at match start: "Observe. They are only beginning to build.";
  - jump 1: "Advancing the clock. Do keep up.";
  - jump 2: "Further. I must see how it ends.";
  - at time-up (the epilogue, §3.11): "…So that is how it ends."

### 3.9 Why it is fair

- **Time and space are symmetric.**
  - The front is radial from the centre, so mirrored pieces switch at the same instant and both pads flip at J + 2.6 s.
  - The schedule is fixed by the clock, not by score, so nobody is rewarded or punished by the jump.
  - Each era gives both halves the same routes.
- **Nothing that matters moves:**
  - the spawn exits;
  - the objectives (the concourse, Centre Plaice, the tower track, the Bazookarp start, checkpoints and goals);
  - every cover collider.
- **Warned 10–20 s ahead, in five channels**: world, HUD, sound, minimap and bots. There are no surprises and no damage.
- **Era 1 is the tight version** (three routes per half), era 2 the open version (five) and era 3 the vertical version.
  Each is a complete, playable layout. Only the transition is new.

### 3.10 Bots, online and the engine

- **The engine** (`engine-draft.md`) does it all: one union world; pieces tagged `eras` / `eraGroup`; flips at
  J + r_g / 25; a union nav graph with per-era validity; three AO channels; per-era minimap bases. This concept stays
  inside its §5 limits:
  - groups ≤ 8 m, none crossing z = 0;
  - no appearing piece at foot level outside an older solid or water;
  - no era-only waterline slabs;
  - stairs ≤ 24°;
  - the turf ratios;
  - objectives and spawn exclusion distances;
  - the arena ≤ 85 m.
- **Bots** use the engine's danger layer (they leave closures and stair sites at the warning) and the era-masked nav
  (they take the arcade and the Yabby Walk from era 2 and the Sky Level from era 3 because the graph has them). The
  engine's `fresh` weighting sends them to paint the new ground for 30 s after each jump.
- **Two additions I'd ask the bots package for:**
  - in the last 10 s before jump 1, a bot with a flank role heads for its arm (to use the arcade or walk when it opens);
  - in era 3, bots treat the Sky Bridge and High Line as perches (the perch logic they use for 1.3–2.4 m tops).
- **Online**: a pure function of the stage clock (no records). Splats near a jump carry the painter's clock so ink agrees
  (engine H11). Late joiners (Practice) and host changes need nothing extra.

### 3.11 The set-pieces, and the epilogue

**Jump 1 (1880s → TODAY)**, behind the sepia-gold front, "the photograph develops":
- colour floods back;
- the timber scaffolding falls off the dome to reveal green copper;
- the cable grip cars shed their timber bodies and stand as modern trams;
- the hoardings burst into fluttering posters and the arcade's glass roof glints;
- the goods wagons sink into the street ("the line goes underground");
- gas lamps become street lights and horse troughs become planters;
- murals splash along Hoki Lane in a sweep;
- glass towers rise behind the facades on the skyline.

**Jump 2 (TODAY → 3000s)**, behind the white-cyan front:
- the trams lift 0.8 m and hum;
- the Sky Bridge, the landing and the High Line assemble from flying light-panels, and the west stair unfolds out of its
  hoarding;
- the east shops' upper storeys dissolve into greenery;
- the River Deck unfolds over the water like lily pads;
- light seams appear in the paving;
- the dome becomes a floating ring of glass;
- the skyline grows arcologies and a far space-elevator thread.

**The epilogue** (cosmetic, after play ends): at time-up, during the results camera only, the clocks spin once more and
the city is shown far in the future: dark sea up to the rooftops under a dead sky (the Splatoon canon: the seas rose).
Tartar has his answer: "…So that is how it ends." It never touches play, and it fulfils the user's lore. It can be cut
with no effect on anything else.

---

## 4. Each mode on this layout

### 4.1 Turf War

- **Shape of the match.**
  - Era 1 (0:00–1:00) is a three-lane fight that settles mid and the arms.
  - Era 2 (1:00–2:00) opens 870 m² of bare flank turf (the arcades and river walks). It rewards whichever team splits
    well.
  - Era 3 (the last minute) adds 660 m² of high and river turf and the Sky Level's angles over mid. The final minute is
    always a new map, which is the stage's signature.
- **Where the turf is.** Each half paints its streets and lanes. The arms are shared battlegrounds, and the concourse is a
  small, valuable, contested plate.
- **Specials** charge as usual. The jumps add no special charge.

### 4.2 Zone Control

- **Centre: one zone on the concourse.** Grid u −5…5, v −5.5…5.5 (110 m²), y 2.3…2.7.
  - World polygon: [[−6.88, −2.82], [3.46, −6.58], [6.88, 2.82], [−3.46, 6.58]].
  - Flat sandstone. Its cover is the two kiosks; the arch legs stand just outside its edges.
  - Ways in: two grand steps, two ramps, two plinths, plus swim-up walls on all four faces.
  - It can be attacked from the hotel terraces (1.3), the arm islands, the Promenade trams, and in era 3 the High Lines
    and Sky Bridges (14–25 m).
  - Nothing changes within 2 m of it in any era (E15). The arch keeps one collider; only its look changes.
- **Side zone (Alpha's; Bravo's is mirrored automatically): Centre Plaice.** Grid u −30…−19, v 17.5…24.5 (77 m²),
  y −0.2…0.4.
  - World polygon: [[6.18, −34.18], [9.95, −23.84], [16.52, −26.23], [12.76, −36.57]].
  - 32 m from mid on Alpha's half, 46 m from Alpha's pad.
  - Flat setts. Cover: the coffee cart (inside) and the beer-garden deck's 1.3 m wall on its east side. A phone booth
    stands just outside at (u −20, v 25).
  - Ways in: Degrayling Lane north and south, Plaice Lane and Cod Lane from the Promenade; in eras 2–3 also the Yabby
    Walk (the fence gone) and Hoki Lane.
  - High ground: the beer-garden deck (1.3) on its east edge, and in era 3 the east landing and High Line (5.4), 2.5 m
    outside its west edge.
  - The zone keeps 2.5 m from the era-1 fence and from the era-3 landing (E15).
- **The rotation shifts the fight sideways.** Each side zone is on its team's laneway (left) side, so a rotation pulls
  play off the concourse into the laneways and the arms.
- **The jumps never touch a zone.** They only change how you get there: era 1 has fewer ways into Centre Plaice, and
  era 3 adds the high line over it.
- The final 30 s and overtime are centre-only (`ZONES.finalCentre`), always in era 3.

### 4.3 Tower Command

"The tower rides the old cable-tram loop": the straight runs follow the tram rails down the Promenade's east track,
through the laneways' heritage rails, and back up the west track.

- **Track** (grid runs, so the platform's yaw is the grid's 20°; use the runs' own grid, or set `yaw` to 20° in
  tower.js's unit).
- **Alpha's half, as Bravo pushes it** (the format's path is the mirror, below):
  1. (u 0, v 0) at 2.4 on the concourse → (−7, 0): 7 m along the deck, between the kiosks and under the clocks (6.6 m
     underside; 6.12 needed).
  2. Down Alpha's grand steps to (−12, 0) at 0 (an incline over stairs), then 1.5 m flat to (−13.5, 0), clear of the
     steps' foot.
  3. Jog east 5 m to (−13.5, 5), onto the east tram track.
  4. South 7.5 m to (−21, 5), past the tram island (v ±1.5). The parked tram is on the west track.
  5. East 13 m through Plaice Lane to (−21, 18) in Degrayling Lane (under the era-3 Sky Bridge and east landing:
     underside 5.0).
  6. South 9 m down Degrayling Lane to (−30, 18). The café tables stand on the lane's east side, 0.75 m clear of the
     platform.
  7. West 23 m along Cod Lane, across the east footpath, onto and across the Monument terrace (climb 1.3 at its east
     edge, v 8) to (−30, −5) on the terrace.
  8. South 23 m along the west tram track (drop 1.3 off the terrace's south edge at u −36) to the goal at (−53, −5).
     The goal is 13.9 m short of the pad, on the terminus forecourt, outside the 4.2 m barrier.
- **Length 94 m. Three checkpoints**, at 22, 43 and 71 m: (u −17, v 5) by the tram stop, (−25, 18) in Degrayling Lane
  beside Centre Plaice, and (−30, −5) on the Monument terrace.
  - Three checkpoints means `trackPoints` 60, so 60 s of riding: 1.57 m/s with one rider, 13.3 s per checkpoint.
  - That is in line with the other three-checkpoint stages (Kelpline, Halyard, Terraces). With two checkpoints the
    user's rule would ask for a track about 160 m long, which this city cannot hold without looping a lane twice.
- **`LAYOUT.tower`** (Bravo's side, z > 0: Alpha's goal):
  ```
  path: [[0, 2.4, 0], [2.39, 2.4, 6.58], [4.10, 0, 11.28], [4.62, 12.69], [-0.08, 14.40], [2.48, 21.44],
         [-9.73, 25.89], [-6.65, 34.35], [14.96, 26.48], [22.83, 48.09]],
  checkpoints: [[1.12, 17.68], [-8.36, 29.65], [14.96, 26.48]],
  ```
- **Headroom problems, all solved by the layout:**
  - the clock row over the start (6.6 ≥ 6.12);
  - the verandas (3.4) over the east footpath: no veranda at Plaice Lane (u −24…−18) or Cod Lane (u −32…−28), so the
    gaps are where the tower crosses;
  - the era-3 Sky Bridge and east landing (underside 5.0 ≥ 3.72 + 1.0, E16);
  - nothing else overhead.
- **Clutter kept off the track:** the tram island, the parked tram (west track, north of u −25), the newsstand
  (u −27…−25, 1.75 m clear), the terrace statue (u −34.5…−32.5, v 3.5…5.5), café tables, A-frames.
- **The two sides' tracks never cross.** They meet only at the start.
- **The jumps and the tower.** The track is on all-era floor with all-era clearances. The nearest era piece is the west
  stair site, 3.25 m from the platform's edge (E16). The tower may be anywhere at a jump: nothing changes around it. The
  new "tower destroys deployables in its path" rule is unaffected.
- **Check with** `tower-check.cjs ERA=1/2/3` (0 holes, clearance clean but the two deliberate climbs and drops) and
  `tower-len.js` (94 m, 100 s to the goal).

### 4.4 Bazookarp

Positions are for Alpha's half, where Bravo scores. Bravo's are mirrored.

- **Start**: the concourse centre (0, 2.4, 0), under the clocks.
  - It is raised, central and reached equally by both teams (their steps, ramps and plinths).
  - Breaking the shield here throws ink over the whole deck: a fight for the top.
- **Checkpoint**: the Monument terrace, grid (u −32, v −3), world (−13.8, 1.3, −29.0). It is 32 m from the start.
  - It is the slice's strategic point: a raised island in the middle of the Promenade.
  - Attackers come down the Promenade from mid, or round through Cod and Plaice Lanes (and the rotunda door in eras 2–3).
  - Defenders come up from Engine Square, the forecourt and the arcade.
  - Cover on and round it: the statue (2 × 2 m), its 1.3 m walls and the trams' ends.
  - In era 3 the Sky Bridge overlooks it from 5–12 m.
- **Goal pedestal**: the tram terminus forecourt, grid (u −52, v 0), world (−17.8, 0, −48.9).
  - A level below the spawn deck (3.2), 14 m in front of the pad, in view of the deck and the grand stair.
  - Reached from the Promenade, the west apron (Quay and arcade) and the east apron (Degrayling Lane and the Yabby Walk).
- **Routes and carry times** (the carrier walks at 4.8 m/s, 80 % of 6.0, or swims its own ink at 9.4 m/s):

  | Leg | Route | Eras | Length | Walk / swim |
  |---|---|---|---|---|
  | start → checkpoint | Promenade | all | 32 m | 6.7 s / 3.4 s |
  | | Degrayling Lane + Cod Lane | all | 65 m | 13.6 s |
  | | west arm + arcade + rotunda door | 2, 3 | 66 m | 13.8 s |
  | checkpoint → goal | Promenade + Engine Square | all | 20 m | 4.2 s |
  | | Cod Lane + Degrayling Lane + east apron | all | 57 m | 11.9 s |
  | | rotunda door + arcade + west apron | 2, 3 | 43 m | 9.0 s |

  Every checkpoint has two routes or more in every era, three in eras 2–3.
- **Expected carry.** An uncontested push takes about 11 s of walking from start to goal. A contested push takes 25–45 s
  per leg, well inside the 60 s timer. The first pushes usually happen in era 1, with fewer routes; the comeback routes
  open at the third.
- **No hidden shortcut into a base.**
  - The Yabby Walk and the Quay are long, open and visible from the base.
  - The Sky Level is on each team's own half and comes down at the Promenade's west footpath (u −36), 16 m before the
    goal.
  - The River Deck is at the wharf, far from any goal.
- **Rainmaker-free (Bazookarp-free) zones, on the carrier's own side:**
  1. The base back: the spawn deck, its ramps and the aprons behind the grand stair, grid u −70…−56, v −27…31. World
     corners: (−49.3, −56.5), (−44.5, −43.4), (10.0, −63.2), (5.2, −76.4).
  2. In era 3, the team's own Sky Level (west stair, Sky Bridge, east landing, High Line), so nobody hides the carrier
     over their own Promenade. This is an era-tagged free zone (E17 allows `eras` on free zones). Signposts stand at the
     stair foot and on the High Line.
- **The jumps and Bazookarp.** Nothing changes within 3 m of the start, checkpoints or goals (E17). The carrier lifted or
  shoved by the engine's safety net just carries on. "Don't retreat" is measured along u (the spawn axis), the same in
  every era.

### 4.5 Boss Battle: yes

- **Era 3, fixed** (the engine's `fixed: 3`): the boss attacks the city of the future.
- **Home ground**: the junction ring round the concourse, both arms (22 × 34 m each, long straight charge lanes), the SE
  and NW plazas, and the Promenades out to u ±19. That is about 2,300 m², far above the 150 m² minimum.
- **The concourse's 2.4 m walls and the arch legs are stun walls** for Hull Charge: a charge across the junction into
  the deck is the classic punish.
- **The boss stays off:**
  - the Promenades beyond the Sky Bridges (underside 5.0 m, lower than the boss's 5–6 m shell);
  - the lanes;
  - the arcade.
  BossNav must treat the Sky Bridge footprints as blocked.
- The floating trams on the arms (0.8 → 3.8) are walls to it. The River Deck (0.6) is a step it can take.
- Copy `tools/botlab/jobs/new-stages/out/craters/boss-check.js` for the check.

---

## 5. The look

### 5.1 Architecture, by area and era

| Area | 1880s | TODAY | 3000s |
|---|---|---|---|
| Concourse and clock arch | Sandstone forecourt new and pale. Iron arch in red primer, the dome a timber skeleton with a steam crane. Brass clocks | The ochre-and-brick station style, the dome green copper. The famous clocks | Pale stone with light seams. The dome a floating ring of glass over the arch. Clocks as light discs |
| Swimston Street | Two-storey shops, iron-lace verandas (dark green, white lace), granite setts, cable-tram slot rails, gas lamps, hitching posts, horse troughs | The same facades repainted, glass towers behind, asphalt with tram rails, low-floor trams, planters, bike racks | Facades wrapped in greenery and glass, light-tile paving, floating trams, glass planters |
| Flathead Street and the wharves | Timber wharf, paddle steamer moored, bales and barrels, a wharf shed | River-cruise jetty, a café in the shed | A glass ferry dock; the River Deck's garden |
| Barra Arcade | Hoarded, a scaffold inside | Glass roof, mosaic floor, wrought-iron shopfronts, the rotunda's glass dome | The same, lit from within, plants climbing the iron |
| The laneways (Degrayling, Hoki, Centre Plaice) | Produce lane, barrows, crates, the bond store's gated yard | Cafés, umbrellas, espresso windows, Hoki Lane's murals (painted in the house style: squid-and-fish street art) | Hanging gardens, floating café pods, murals turned to moving light |
| Yabby Walk and Quay | A fenced goods siding with wagons (era 1); the Quay as a working fish wharf | The river walk, boardwalk, boathouse, benches | Glass balustrades, light posts |
| The engine houses (spawns) | Red-brick engine house, smoking chimney | Heritage tram depot, its doors open on old trams | Hover-tram hangar, the chimney a light mast |
| The Corner Hotel | Bluestone pub with a corner tower | The same pub: neon sign, beer garden | Glass-top pub with a roof garden (off-limits) |

### 5.2 Materials and palette

Team ink must be the loudest colour: surfaces sit at mid value (0.35–0.7) and low chroma (saturation < 0.3).

**Three stage surfaces**, plus the engine's era alternates (E39):
1. **Bluestone** (every era): dark blue-grey basalt setts, #5f6874 with #3d434b joints. Laneways, kerbs, the Quay, the
   concourse's base, plinths.
2. **Street**, re-skinned per era with the engine's `remap`: granite setts #8a8478 (1880s) → asphalt #6b6e72 with tram
   rails (TODAY) → pale light-tile #b9bfc4 with thin seams (3000s). The Promenade and Flathead Street.
3. **Station stone**: warm sandstone #c4a675 (a desaturated mustard) with brick #9b5d4a. The concourse, the arch's base,
   civic trim.

**Other colours:**
- Facade stuccos: #ddd2bb, #c9b9a0, #b8a08a.
- Veranda iron: #3f5a4e.
- Copper: #6f9c8c.
- Era-3 white #e8ecef, glass #a9c4cc, greenery #5e8a55, light lines #bfe9ff (thin; never a broad glow).
- The river: olive-brown #5a5a3e (1880s) → #4e5b44 (TODAY) → clear teal #3e6f74 (3000s).

Signage goes on props and the 12 mural ids (E38): the station name, "UNDER THE CLOCKS", street signs, the arcade's sign,
Hoki Lane's murals and the clock-face mosaic.

### 5.3 The far backdrop, every side, per era (one set per era, ≤ 6 draw calls each, E41)

| Side | 1880s | TODAY | 3000s |
|---|---|---|---|
| West (beyond the west wharf and both west river bends) | The river's far bank: wharves, sailing ships, timber sheds, gum trees | The arts precinct with its lattice spire, a concert hall's shells, a footbridge, cruise boats | Terraced arcologies with hanging gardens, a floating stadium |
| East (beyond the east wharf) | Parkland on a rise, the domed exhibition hall, a botanic glasshouse | Sports stadium light towers, an observation wheel | Floating parkland islands, sky-tram rails of light |
| South (behind Alpha's base) | Low streets, church spires, a cathedral's three spires, smokestacks, telegraph poles | The office towers, the tallest one with a gold crown | Needle towers joined by sky-bridges, vertical forests |
| North (behind Bravo's base) | The bay's piers and tall ships, a lighthouse | Container cranes, the port, a bay-side ferris wheel | A sea wall and a floating harbour city |
| Every era, the far horizon | Blue ranges to the east: the same hills in every era, which ties the three cities together | | |

The river bends round the stage's sides. Railway bridges cross it behind each base in the backdrop.

### 5.4 Day and dusk

| Era | Day | Dusk |
|---|---|---|
| 1880s | Warm sun through coal haze: the engine's sepia tint, a little desaturated, soft shadows | Orange sunset, gas lamps flicker warm (#ffb35c), chimney smoke lit from below |
| TODAY | A crisp, clear blue day with fast clouds | A pink and violet sunset; street lights, tram headlights, the hotel's neon |
| 3000s | A pale clean sky, a faint orbital ring arc | Violet dusk; light seams in the paving and the floating trams glow cyan (#9ff3ff), stars |

Lamp positions are shared across eras (≤ 12, E42). Only their colour changes.

### 5.5 Intro fly-in and stage-select hero shot

- **Intro** (era 1, as the match starts there): `intro: { from: [−64, 18, −6], lookFrom: [0, 8, 0], toBack: 3.2 }`.
  - The camera starts over the west river, beyond Alpha's wharf, looking east along Flathead Street at the scaffolded
    dome.
  - Tartar rings once as the camera passes the clocks, as a teaser.
  - Then it flies back to the team's spawn deck.
- **Stage-select hero shot**: `art: { from: [46, 30, −58], look: [−4, 4, 2], fov: 56 }`.
  - The camera is high over the south-east river bend. It looks north-west over the laneways, Centre Plaice and the
    junction, with the dome centre-frame, the west arm running off left and Bravo's half beyond.
  - **I'd render it mid-jump.** The Chrono Wave frozen at radius 32 m: inside the ring the city is the 3000s (the Sky
    Bridge, floating trams, the glass ring dome), outside it the 1880s (sepia, scaffolding, cable trams). The glowing
    front arcs through Centre Plaice, and Tartar's lantern blazes at the top.
  - This needs `stageart.cjs` to take a frozen front (`ERA=1→3 FRONT=32`), a small addition to the engine's T3.
  - Day and dusk versions.

---

## 6. The three biggest risks, and how I'd handle them

1. **The jump reads as chaos, or feels unfair in the moment.**
   - The risk: a first-time player doesn't see what changed, or a team at the arms feels robbed when the arcade opens
     behind it.
   - Handling:
     - five warning channels (§3.8) and the early bell at J − 20;
     - era 2 only opens and era 3 only adds, so nothing a player is using is ever taken away;
     - both halves change identically at the same instant;
     - the HUD and minimap name what opened.
   - Measure:
     - a 30 s capture of each jump for the lead and the user;
     - Mac mini turf, zones and tower sweeps comparing win rates and knockouts by era, and lead changes in the 20 s after
       each jump. If the jumps decide matches, shorten what opens (keep the arcade closed until jump 2) or move jump 2
       to 0.75.
2. **Mid and the silhouette.**
   - The risk: the Diagonal's arms make a mid band 94 m long that is too open, with sniping down the arms. And the tilted
     58 m body could read as "a tilted rectangle with spurs".
   - Handling:
     - the concourse sits across both arms' axes, so no tip-to-tip line exists at eye height;
     - the arms carry trams, islands, a shed and a wharf deck every 6–8 m;
     - the river bends are cut deep (14–18 m) so the four points read;
     - a top-down shot is checked against the other stages at blockout, before any detailing.
   - Fallbacks: shorten the arms to σ ±40 (bounds x ±44); narrow the Quay and the Yabby Walk to 4 m so the body thins to
     52 m.
3. **Cost: three cities in one, in a big footprint.**
   - The risk: every street dressed three times, plus era-3 decks, three AO channels and a union nav. The walkable floor
     (about 8,300 m² at most) is above Calamari's. Draw calls, the lightmap's 1,800-row limit (E9) and the paint
     atlas's density (E8) are all at risk.
   - Handling:
     - the era-slot kit (§2.8): one collider and three cheap looks per slot, merged per era mask;
     - shared facades with era trims instead of three facade sets;
     - backdrops as instanced silhouettes per era;
     - roofs and back faces `paint: false`.
   - Measure `G.paint.ppm`, `G.level.lightUsed` and draw calls per era at blockout.
   - What I would cut first, in order: the boardwalk jog (use a kiosk instead); the depot sheds (backdrop); the River
     Deck (it is the least important era-3 piece); the epilogue.
