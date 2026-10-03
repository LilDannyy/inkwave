# Bluestone: concept "the gimmick first"

One of three independent concepts for `bluestone`. The angle: start from the time jump, how a match lives through it,
and build the city around the moments it creates. Paper design, 2026-10-04. All numbers are world metres (x across,
z along the spawn axis, y up) and seconds. Alpha spawns at −Z, Bravo at +Z; every `half` piece has its twin at
(x, z) → (−x, −z). The era engine contract in `engine.md` (next to this file) is assumed throughout; section 3.12 lists
the three places where this concept asks for something different, and why.

**In one paragraph.** A southern river city paved in dark bluestone. The stage is the junction where the city's tram
avenue crosses a diagonal street at the Terminus, a domed station with a row of clocks over its steps. Commander Tartar,
an old telephone, hangs inside the dome and has wired himself into the station's great clock. Twice a match he winds it
forward: the clock's hand comes off the dial as a giant blade of light and sweeps once round the city, and everything
behind the blade is a century or a millennium older. The match starts in the 1800s (cable trams, gaslight, a boarded-up
arcade, a bridge still being built), jumps to today (the arcade, the bridge, the laneways and the level crossing open)
and finally to the 3000s (a glass halo walkway floats round the dome, roof gardens and river platforms appear). The
jumps happen at the same fractions of the clock in every mode. They only ever open routes and add ground, never take
ground away, so nobody's turf, zone or push is erased by the gimmick.

---

## 1. Names and identity

**Name options**
1. **Bluestone Junction** (preferred). The stone the city is built from, and the crossing of its two streets.
2. **Terminus Circus**. The domed station and the round plaza in front of it.
3. **Under the Clocks**. Where the city's people say they will meet, and the clock that drives the time jumps.

**Identity.** A boom-era river city built on gold money, never named. Its streets are paved and kerbed in dark grey-blue
basalt ("bluestone"), with laneways between the blocks. The stage is the city's heart: **Terminus Circus**, the round
plaza where **Tram Parade** (the tram avenue, running straight along the spawn axis) crosses **the Diagonal** (a street
cut across the grid at 25° to it). In the middle of the circus stands the **Terminus Dome**, the station's open domed
booking hall on eight cast-iron columns. Over each of its two grand flights of steps hangs a girder carrying a row of five
clocks. **Commander Tartar**, the 12,000-year-old AI that looks like an old telephone, hangs from the crown of the dome by
his coiled cord, his dial glowing like an eye. He wants to see how the world ends, so he can go back and tell the
Professor how to start it anew, and he is fast-forwarding the city to find out. Tartar is the only thing on the stage
that looks the same in every era: he is outside time. The landmark is the dome with its clocks and the telephone inside
it, visible from both spawns down Tram Parade.

---

## 2. The plan

### 2.1 The macro shape: a skewed X

Two streets cross at the circus: Tram Parade along z, and the Diagonal at 25° to the x axis. The playable land is the
two streets and the city blocks along them. The four corners between them are not playable, and each is different:
- **North-west and south-east: the river.** Each team has the river on its left. The water comes right up to the circus
  on its west and east sides.
- **South-west and north-east: the railyards.** Track fans run into the Terminus from outside the city. Each team has a
  railyard on its right. These are out of play behind a 2.4 m palisade (`rail`).

From above, the stage is an X whose arms have different lengths and widths:
- Tram Parade's arms are 48 m wide with the laneway blocks along them, and run 52 m from the circus to each base.
- The Diagonal's arms are 28 m wide and run 48 m out to a river wharf at each end.

The X is skewed (65° / 115°), so no two corners are alike. It changes over the match: era 2 webs the river corners with
bridges, and era 3 floats platforms in them and a halo over the middle. It is unlike the other stages (bands, a diamond,
an S, rounds), and unlike the round aquarium and the crescent caldera of this batch.

**The defining lines (build from these):**
- **Tram Parade (TP):** |x| ≤ 7, z −52 … 52 outside the circus.
  - Carriageway |x| ≤ 4.5, with the tram tracks at x ±2.2.
  - Footpaths 4.5 … 7. They are flush with the carriageway; the kerb is a dished bluestone channel, not a step, so the
    tower never stutters.
- **The Diagonal:** an axis through (0, 0) with direction **d = (0.906, 0.423)** and north normal **n = (−0.423, 0.906)**.
  For a point p, along = p·d and off = p·n.
  - Carriageway |off| ≤ 6.
  - Frontage buildings 6 ≤ |off| ≤ 10. Walks 10 ≤ |off| ≤ 14.
  - The wharves at 42 ≤ |along| ≤ 48; the river beyond.
  - Alpha's arm is the west one (along < 0). Bravo's is the east one.
- **The bays** (out of play):
  - south-east river: x > 24 and off < −14, inner corner (24, −4.2);
  - south-west railyard: x < −24 and off < −14, inner corner (−24, −26.7);
  - the other two by the mirror.
- **Bounds** about x ±50, z ±79. The bays fill much of that box. The arena's farthest point is 80 m from (0, 0).

### 2.2 ASCII plans

Scale: one character is 2 m in x and 4 m in z. +z (Bravo) is at the top, and +x is to the right. The plans were drawn by a
scratch script from the numbers in this document, so they agree with the table.

**Era 1 (the start of every match):**
```
  z  |x=-52 ............................ x=0 ............................. x=+52|
  80 |                    ###############                 |
  72 |               FFFFFFFFFSSSSSSSSSFFFF               |   Bravo's Engine House, spawn deck S
  64 |               FFFFFFFFFFFFFFFFFFFFFF               |
  56 |               FFFFFFFFFQQQQFFFFFFFFF               |   Q: the cable-tram turntable
  52 |~~~~~~~~~~~~~~jj##ccc#TTTTTTTT######yy==============|
  44 |~~~~~~~~~~~~~~llllllllTTTTTTTTlllXXXll==============|   Customs Lane (Bravo's level crossing X)
  40 |~~~~~~~~~~~~~~ww##ccc#TTTTTTTTPXXX##yy============~~|
  36 |~~~~~~~~~~~~~~wwXXccc#TTTTMMTTPXXX##yy========~~~~~~|
  32 |~~~~~~~~~~~~~~ww##ccc#TTTTMMTTppppppyy====WWW~~~~~~~|
  24 |~~~~~~~~~~~~~~ww##ccc#TTTTMMTTppppppww####DDWWW~~~~~|   Bravo's Prow Place p, East Wharf W
  20 |~~~~~~~~~~~~~~llllllll........pppHHHhhDDDDDDDWWW~~~~|
  16 |~~~~~~~~~~~~~~ww##c..............HDDDDDDDDDDDDWWW~~~|
  12 |~~~~~~~~~~~~//kk#.......^^^^.......DDDDDDDDD###WWW~~|   ^ Clock Steps
   8 |~~~~~~~~~~///~kk.......OOOOOO.......DDDD####wwwwW~~~|
   4 |~~~~~~~~///~wwww......OOOOOOOO......####wwwww~~~~~~~|   O the concourse (1.3) under the dome
   0 |~~~~~~~wwwww####......OOOOOOOO......wwww~///~~~~~~~~|
  -4 |~~~Wwwww####DDDD.......OOOOOO.......kk~///~~~~~~~~~~|   / the Iron Bridge, unfinished in era 1
  -8 |~~WWW###DDDDDDDDD.......^^^^.......#kk//~~~~~~~~~~~~|
 -12 |~~~WWWDDDDDDDDDDDDH..............c##ww~~~~~~~~~~~~~~|
 -16 |~~~~WWWDDDDDDDhhHHHppp........llllllll~~~~~~~~~~~~~~|   Little Lane
 -20 |~~~~~WWWDD####wwppppppTTMMTTTT#ccc##ww~~~~~~~~~~~~~~|
 -28 |~~~~~~~WWW====yyppppppTTMMTTTT#ccc##ww~~~~~~~~~~~~~~|
 -32 |~~~~~~========yy##XXXPTTMMTTTT#cccXXww~~~~~~~~~~~~~~|   X: era-1 gates (arcade, Bond Passage)
 -36 |~~============yy##XXXPTTTTTTTT#ccc##ww~~~~~~~~~~~~~~|
 -40 |==============llXXXlllTTTTTTTTllllllll~~~~~~~~~~~~~~|   Customs Lane, the level crossing X
 -48 |==============yy######TTTTTTTT#ccc##jj~~~~~~~~~~~~~~|   j Bond Wharf (1.0)
 -52 |               FFFFFFFFFQQQQFFFFFFFFF               |
 -60 |               FFFFFFFFFFFFFFFFFFFFFF               |
 -64 |               FFFFSSSSSSSSSFFFFFFFFF               |   Alpha's spawn deck (3.4), pad (-5, -68)
 -72 |                 ###############                    |   the Engine House and its chimney
```

**Era 3, with the mode objectives** (Z = zones, C = Bazookarp checkpoints, t = Tower Command track, both directions):
```
  56 |               ttttttttttttttttttFFFF               |
  52 |~~~~~~~~~~~~~~jt##ccc#TTTTTTTT######yy==============|
  44 |~~~~~~~~~~~~~~lttttttttttTTTTTllllllll==============|
  40 |~~~~~~~~~~~~~~ww##ccc#TTTTCCTTPAAA##yy============~~|   A the Gilded Arcade (open from era 2)
  32 |~~~~~~~~~~~~~~ww##ccc#TTTTMMTZZZZZZZyy====WWW~~~~~~~|
  24 |~~~~~~~~~~~~~~ww##ccc#TTTTMMTZZZZZZZww####DDWWW~~~~~|
  20 |~~~~~~~~RRRR~~llllllll........pppGGGhhDDDDDDDWWW~~~~|   R river platform, G Prow roof garden
  16 |~~~~~~~~RRRR~~ww##c.ttttt@@@@....GDDDDDDDDDDDDWWW~~~|   @ the Halo (5.0-5.4)
  12 |~~~~~~~~~~~~BBkk#...t@@.^^^^.@@@...DDDDDDDDD###WWW~~|   B the Iron Bridge (from era 2)
   8 |~~~~~~~~~~BBB~kk...@t..OOZZOO..@@...DDDD####wwwwW~~~|
   4 |~~~~~~~~BBB~wwww...@t.OZZZZZZO..@...####wwwww~~~~~~~|
   0 |~~~~~~~wwwww####...@..OZZZZZZO.t@...wwww~BBB~~~~~~~~|
  -4 |~~~Wwwww####DDDD...@@..OOZZOO..t@...kk~BBB~~~~~~~~~~|
  -8 |~~WWW###DDDDDDDDD...@@@.^^^^.@@t...#kkBB~~~~~~~~~~~~|
 -12 |~~~WWWDDDDDDDDDDDDG....@@@@ttttt.c##ww~~RRRR~~~~~~~~|
 -16 |~~~~WWWDDDDDDDhhGGGppp........llllllll~~RRRR~~~~~~~~|
 -20 |~~~~~WWWDD####wwZZZZZZZTMMTTTT#ccc##ww~~~~~~~~~~~~~~|   Alpha's side zone (Prow Place)
 -28 |~~~~~~~WWW====yyZZZZZZZTMMTTTT#ccc##ww~~~~~~~~~~~~~~|
 -32 |~~~~~~========yy##AAAPTTMMTTTT#cccbbww~~~~~~~~~~~~~~|   b Bond Passage (open from era 2)
 -36 |~~============yy##AAAPTTCCTTTT#ccc##ww~~~~~~~~~~~~~~|   Alpha's Bazookarp checkpoint C
 -40 |==============llllllllTTTTTttttttttttl~~~~~~~~~~~~~~|
 -48 |==============yy######TTTTTTTT#ccc##tj~~~~~~~~~~~~~~|
 -52 |               FFFFtttttttttttttttttt               |
```

**Mid close-up, era 3** (1 m in x by 2 m in z):
```
  20 |RRR~~~lllllllllllllllllT...t........TppppppppppGGhhhhh###DDD|
  16 |RRR~~~wwwww####cc..........t...............GGGGGDDDDDDDDDDDD|
  14 |RRR~B~wwwww####...t....@@@@@@@@@@@@@@........DDDDDDDDDDDDDDD|
  12 |RRBBBBkkkkk##.....t.@@@@@^^^^^^^^^^@@@@@.......DDDDDDDDDDDDD|
   8 |BBBBB~kkkkk......@t@.....OOOOOOOOOO.....@@@......DDDDDDDDDD#|
   4 |B~~wwwwwww.....@@@t..OOOOZZZZZZZZZZOOOO...@@@.....D#########|
   0 |wwww######.....@@@...OOOZZZZZZZZZZZZOOO..t@@@.....#wwwwwwwww|
  -4 |#####DDDDDD.....@@@....OOOOZZZZZZOOOO....t@@.....kkkkk~~~BBB|
  -8 |DDDDDDDDDDDD......@@@@...^^^^^^^^^^...@@@t......#kkkkkBBBBB~|
 -12 |DDDDDDDDDDDDDDD........@@@@@@@@@@@@@@....t...####wwwww~B~RRR|
 -16 |DDDDDDDDhGGGGGGGGpp.............t........lllllllllllll~~~RRR|
 -20 |######hhhwwppppppppppppTTTMMMTTTtTTTTlllllllllllllllll~~~~~~|
 -24 |wwwwwwwwwwyZZZZZZZZZZZZTTTMMMTTTtTTTT###ccccc####wwwww~~~~~~|
```

**Legend:**

| Symbol | Meaning |
|---|---|
| `O` `+` | concourse (1.3) and its centre |
| `^` | Clock Steps |
| `.` | Terminus Circus (0) |
| `T` | Tram Parade |
| `M` | a tram (3.2, roof) |
| `D` | the Diagonal |
| `W` | the wharves |
| `w` | walks |
| `k` | Rowing Club deck (2.4) over the walk |
| `j` | Bond Wharf (1.0) |
| `c` | Cafe Lane |
| `l` | cross lanes |
| `y` | Yard Lane |
| `p` | Prow Place |
| `H` / `h` | the Prow Hotel and its low wing (roof 3.8) |
| `P` | Post Office Steps (1.3) |
| `A` | the Gilded Arcade |
| `b` | Bond Passage |
| `X` | era-1 gates |
| `/` | the unfinished bridge |
| `B` | the Iron Bridge |
| `R` | river platforms |
| `G` | Prow roof garden (3.8) |
| `@` | the Halo |
| `F` | forecourt |
| `Q` | turntable |
| `S` | spawn deck |
| `#` | buildings (roof) |
| `~` | river |
| `=` | railyard |

### 2.3 The pieces

The table lists the single (centre) pieces, then Alpha's half. Bravo's half is the 180° twin of Alpha's.

| # | Piece | Centre x / z | Size | Floor (m) | Purpose |
|---|---|---|---|---|---|
| 1 | Terminus Circus | 0 / 0 | disc r 20 | 0 | Mid. An open ring 10.5 m wide round the dome, the old cable-tram turning loop. Twelve bronze hour marks are set in it at r 18, so the circus is a clock face and players can call "4 o'clock". |
| 2 | Concourse | 0 / 0 | octagon, circumradius 9.5 | 1.3 | Fight space under the dome. Centre zone, tower start, Bazookarp start. Faces: N and S are the Clock Steps; NE and SW are ramps; E, W, SE and NW are plain 1.3 m faces you hop onto. |
| 3 | Clock Steps ×2 | 0 / ±10.4 | 9 wide, 3.2 run | 0 → 1.3 | The grand steps facing each team down Tram Parade. |
| 4 | Concourse ramps ×2 | ±7.6 / ±7.6 (NE, SW faces) | 5 wide, 4 run (18°) | 0 → 1.3 | Toward the Diagonal. |
| 5 | Dome columns ×8 | r 8.2 on bearings 22.5° + k·45° | ⌀0.9, to 8.0 | — | Cover on the concourse. The dome springs at 8.0, its crown is at 15.0, and the lantern with four clock faces reaches 19.0. All roof. |
| 6 | Clock beams ×2 | x −3.1 … 3.1, z ±7.6 | 6.2 × 0.6, y 4.3 … 6.0 | roof | The row of five clocks over each flight of steps. Kids pass under them (2.95 m above the concourse). They cut the spawn-to-spawn sightline along Tram Parade at deck eye height (4.7). |
| 7 | Tartar | 0 / 0, body at y 8.3 … 10.1 | 1.8 tall | out of reach | Hangs from the crown on his cord. No collider. |
| 8 | Ticket barriers ×4 | r 5, bearings 90°, 270°, 135°, 315° | 3.0 × 0.5 × 1.1 | on 1.3 | Concourse cover. The centre stays clear for the tower (2.5 m square plus margin). |
| 9 | Circus carts ×4 | r 15 at 45° / 225°; r 16.5 at 100° / 280° | 2.2 × 1.2 × 1.2 | 0 | Cover-slot objects (section 5.2). Kept off both tower tracks. |
| 10 | Circus columns ×4 | r 15.7 at 20° / 200°, 60° / 240° | ⌀1.4 × 2.6, roof | 0 | Bill-poster columns (1800s) and advertising columns (today). In era 3 each becomes an inkable glass light-pylon to the Halo (B2). |
| 11 | The Halo (era 3) | 0 / 0 | annulus r 12 … 15, deck y 5.0 … 5.4 | 5.4 | The era-3 sky walkway round the dome. Twelve 30° segments (7 m each). Solid glass parapet 1.0 m on its outer edge, a rail on its inner edge. |
| 12 | Tram Parade, Alpha's arm | 0 / −35 | 14 × 33 (z −52 … −18.7) | 0 | The centre lane and the tram line. |
| 13 | Alpha's tram | −2.2 / −26 | 2.6 × 16 × 3.2, roof | 0 | Big cover on the west track. Bravo's tram is on the east track. The same collider in every era (section 5.2). |
| 14 | Post Office Steps | −8.5 / −34.75 | 3 × 9.5 (x −10 … −7, z −39.5 … −30) | 1.3 | Each half's strategic point. A colonnaded terrace (6 columns, cover), with two flights down to Tram Parade and a ramp from Customs Lane. The Bazookarp checkpoint is in front of it. |
| 15 | The Gilded Arcade (gate G1) | −12.5 / −36 | 5 × 7 (x −15 … −10, z −39.5 … −32.5), octagonal court widening to x −16 at z −37 … −35 | 0 | Glass roof at 6.0 (roof). A covered link from Customs Lane to Prow Place, with a side door up three steps onto the Post Office terrace. Boarded in era 1. |
| 16 | Prow Place | −13 / −24.75 | 12 × 15.5 (x −19 … −7, z −32.5 … −17) | 0 | The square behind the Prow Hotel. Holds Alpha's side zone (x −19 … −7, z −30 … −21.5). |
| 17 | Prow Hotel | tip at (−10.6, −17.0), along the W arm's south frontage from r 20 to r 27 | ~8 × 7 | roof 3.8 | A two-storey flatiron with a clock turret on its tip (to 12, roof). An iron-lace balcony (2.4, 2 m deep) runs round its circus face, its Tram Parade face and its back face over Prow Place; a stair (2 m, 0 → 2.4 over 5.5 m) climbs its back wall from Prow Place. Its low wing (roof 3.8) runs on to the West Wharf. |
| 18 | Yard Lane | −21.5 / −39 | 5 × 25 (x −24 … −19, z −52 … −26.7) | 0 | Alpha's right flank, beside the railyard palisade, open in every era. It opens north into the Diagonal's south walk and Prow Place. Spray Lane (street art) from era 2. |
| 19 | The Diagonal, Alpha's (west) arm | axis from r 20 to along −42 | 12 wide | 0 | Alpha's side avenue to the West Wharf. North frontage: riverside warehouses over the river. South frontage: the Prow and its low wing, the goods shed. |
| 20 | West Wharf (Alpha's) | −40.8 / −19.0 | 6 × 28 (along −48 … −42, \|off\| ≤ 14) | 0, loading dock 1.3 | Riverside plaza at the Diagonal's end. Goods shed (roof) with a 1.3 m dock along its front, a crane base (2 × 2) as cover, cargo slots. Bravo's Iron Bridge lands on its north walk at (−37.7, −4.3). |
| 21 | Shops on Tram Parade (east) | 8.5 / … | 3 deep (x 7 … 10) | roof | Iron-lace verandas over the footpath (posts at the channel line, roofs at 3.2, off-limits). No veranda over a lane mouth. |
| 22 | Cafe Lane | 12.5 / −32 | 5 × 40 (x 10 … 15, z −52 … −12) | 0 | Alpha's inner left lane. Its north end opens to the circus's south-east. Called Bond Lane in the 1800s. |
| 23 | Bond stores + Bond Passage (gate G3) | 17 / −34 | stores x 15 … 19 (roof 6.5); passage z −36 … −32 | 0 | Bluestone warehouses. The passage links Cafe Lane to the River Walk; it is full of crates in era 1. |
| 24 | The River Walk | 21.5 / −28 | 5 × 48 (x 19 … 24, z −52 … −4) | 0; Bond Wharf 1.0 at z −52 … −44.5 | Alpha's outer left flank along the river wall (rail at x 24). Bollard groups and benches on its river side every 8 m. |
| 25 | Rowing Club deck | 21.5 / −7.5 | 5 × 7 (z −11 … −4) | 2.4, on posts | High ground over the circus's south-east and the bridge head. The walk passes underneath (2.1 m clear). Stair up from the walk. |
| 26 | Little Lane | 15.5 / −19 | 17 × 4 (x 7 … 24, z −21 … −17) | 0 | Cross link from Tram Parade to the River Walk. |
| 27 | Customs Lane (gate G4 on its west run at x −19 … −15) | ±15.5 / −42 | two runs of 17 × 5 (z −44.5 … −39.5) | 0 | The cross lane in front of the base: it ties every lane together. In era 1 a goods siding crosses its west run (the level crossing), so Yard Lane and Tram Parade do not connect there until era 2. |
| 28 | The Iron Bridge (gate G2) | from (24, −12) to (37.7, 4.3) | 4.5 wide, 21.3 long, three 7.1 m spans | 0 | Alpha's left flank over the river to the East Wharf (Bravo's wing). Unfinished in era 1. |
| 29 | SE river platform (era 3) | 32 / −15 | 9 × 8, deck −0.4 … 0 on columns | 0 | A floating plaza in the river bend. Gangways to the River Walk at z −20 and to the bridge's middle span. |
| 30 | Turntable Forecourt | 0 / −62 | x −22 … 22, z −72 … −52 (round the deck body) | 0 | The base apron. The cable-tram turntable (r 4.5, flush) at (0, −57) carries the Bazookarp goal. |
| 31 | Engine House + spawn deck | deck x −14 … 4, z −72 … −64 | deck 18 × 8 | 3.4 | The cable-tram winding house. Pad at (−5, 3.4, −68), 4 m from every deck edge. The engine hall behind it (x −18 … 12, z −78 … −72, roof 9) has a chimney at (8, −76), 24 m tall. Exits: the grand stair (x −12 … −6, from z −64 down to −56); a stair off the deck's west end down to x −21.5; a ramp off its east end down to x 12. |
| 32 | SW railyard | x < −24, off < −14 | — | out of play (void) | Track fans running into the Terminus, behind a 2.4 m palisade (`rail`). |

**Heights:** 0 streets, lanes, walks and the circus · 1.0 Bond Wharf · 1.3 concourse, Post Office Steps, wharf docks ·
2.4 Prow balcony, Rowing Club deck · 3.2 veranda and tram roofs (off-limits) · 3.4 spawn deck · 3.8 Prow roof garden
(era 3) · 5.4 the Halo (era 3).

**What a 1.8 m climb means here:**
- A kid hops onto every 1.0 / 1.3 top anywhere, and from 1.3 to 2.4 (1.1).
- From the street to 2.4 needs the stairs (or ink).
- From the Prow balcony (2.4) to the roof garden (3.8) is a 1.4 m hop. In eras 1–2 that roof is off-limits (you slide
  back off); in era 3 it is a garden.
- The era-1 gates are 2.6 m with roof tops, and nothing standable within 3 m of them is taller than 0.8 m, so nobody
  climbs over a closed gate.

**Cover spacing (6–10 m everywhere):**
- Tram Parade: the trams, the tram-stop shelters, and cover slots on the footpath edges every 8 m, alternating sides.
- The lanes: a cover slot every 6–8 m on the side away from any tower track.
- The walks: bollard groups and benches every 8 m.
- The circus: the 8 columns, 8 slots and 4 barriers.
- The forecourt: the turntable hut, cargo and benches.

Every cover slot keeps the same collider in all three eras, so the cover map is the same in every era except at the gates.
Measure it with `tools/botlab/tests/cover-map.js` with `ERA=1`, `2` and `3`: at least 90 % of floor within 5 m of cover.

**Spawn to mid:**
- Straight line 68.2 m.
- On foot: deck → grand stair → forecourt → Tram Parade → Clock Steps, about 69 m, or 5.8 s at swim speed. That meets the
  Long Stages standard of about 6 s.
- It is the same in every era: nothing changes within 12 m of a spawn pad or on the first 15 m of any route out of it.

### 2.4 Lanes, flanks and mid

Each team has five ways from its base to mid. They meet mid at different points.

| | Route (Alpha) | Meets mid at | Era 1 | Era 2 | Era 3 |
|---|---|---|---|---|---|
| Centre | Tram Parade | the south Clock Steps | open | open | open |
| Inner right | Prow Place, by Tram Parade's west footpath, or Customs Lane → the Arcade → Prow Place | the circus's south-west, under the Prow balcony | footpath only (Arcade boarded) | + the Arcade | + the Prow roof garden above it |
| Outer right | Yard Lane → the Diagonal's west arm | the circus's west (the concourse's SW ramp) | open, but cut off from Tram Parade at the base: the level crossing closes Customs Lane's west run | + the Customs Lane link | open |
| Inner left | Cafe Lane | the circus's south-east | open | + Bond Passage, a link to the River Walk | open |
| Outer left | the River Walk | under the Rowing Club deck at the circus's south-east. From era 2 it also crosses the Iron Bridge to Bravo's East Wharf, bypassing mid. | open (no bridge) | + the Iron Bridge | + the river platform |

Mid (the circus, r 20, about 1,250 m² on two levels, plus the Halo in era 3) is entered from:
- four avenue mouths;
- two walks;
- the Rowing Club and Prow corners.

Each team owns two raised corners next to mid on its own side: the Prow balcony on its right and the Rowing Club deck on
its left. Both are 2.4 m high and look down on the concourse. The other two corners are the enemy's.

---

## 3. The gimmick: Tartar winds the clock

### 3.1 The rule in one line

At one third and two thirds of regulation time, Tartar rings, picks up and winds the station clock. The clock's hand comes
off the dial as a blade of light lying along Tram Parade and turns half a circle about the dome in 5 seconds. Everything
it passes is rewritten into the next era. A jump only removes obstacles nobody can stand on and only adds ground where
nobody can be standing.

### 3.2 Schedule (the same rule in every mode)

| Mode | Regulation | Ring (warn) | Jump 1 (1800s → today) | Jump 2 (today → 3000s) | Last era |
|---|---|---|---|---|---|
| Turf War 3:00 | 180 s | 10 s before each jump | 60 s played (2:00 left) | 120 s played (1:00 left) | the final minute. The jump starts with the final-minute song; the stinger is pitched to fit it. |
| Turf War 1:30 | 90 s | 10 s before | 30 s | 60 s | last 30 s |
| Zone Control / Tower Command / Bazookarp | 300 s + overtime | 10 s before | 100 s (3:20 left) | 200 s (1:40 left) | 1:40 and all of overtime |
| Boss Battle | until the boss falls (4:00 timer) | 4 s before | at the boss's phase 2 roar (66 % hull) | at its phase 3 roar (33 %) | phase 3 |
| Practice | — | 10 s | every 60 s: 1 → 2 → 3, then a backward sweep 3 → 1 ("Tartar goes back to the Professor") | | cycles |
| Menu backdrop | — | — | every 40 s, like Practice | | cycles |

Why thirds of the clock rather than an objective trigger:
- The user described a timeline ("as the match goes on … then even later").
- Both teams see the next jump on the HUD from the first second.
- Nobody can trigger or stall the jump, so neither team gets to own the map.
- It needs no network record.

Why the final minute in Turf War: the 3000s add bare ground, so the last minute becomes a land rush that either team can
win. That is where Turf War wants its drama.

### 3.3 One jump, second by second (J = the start of the sweep)

| Time | What every screen shows and plays (each from its own stage clock) |
|---|---|
| J − 10 | **Tartar rings.** It is a big two-tone bell ring (400 / 480 Hz bursts with a 20 Hz tremolo), heard everywhere, louder near the dome; Tartar shakes on his cord. Street phones of the current era ring with him: wall telephones on the boarded arcade (1800s), payphones (today). HUD: the era chip under the timer pulses, with the callout "TIME JUMP: 1800s → TODAY in 10". **Blueprints:** every piece about to appear is drawn as a pale white-gold wireframe pulsing at 2 Hz. Every piece about to go flickers with sepia film grain. The minimap outlines both (white dashes for coming, grey hatching for going). Bots' danger layer goes on. |
| J − 5 | Second ring. |
| J − 3, −2, −1 | The ten clocks over the Clock Steps strike three chimes, their hands spinning. Lamps across the city flicker on each chime. |
| J − 1 | Tartar lifts his receiver and his dial spins, as if he is dialling the year. A thin beam drops from the dome's crown to the concourse. |
| **J** | **The hand rises out of the tram tracks** along Tram Parade: a 14 m tall blade of light from the dome to past both spawns (80 m each way, both ends at once, like a clock at 6:00). A deep mechanical clunk, a 0.25 screen shake. Both spawns see it rise right in front of them. |
| J … J + 5 | **It turns clockwise (as on the plan, +z up) 180° in 5 s, 36°/s.** Every group of pieces flips when the blade crosses its centre. The shared floors and walls are re-skinned per fragment exactly at the blade. The backdrop's era sets swap behind it out to the horizon, and the sky and grade blend over the 5 s. A ticking whoosh loop rides the blade past you, like the ink wipe's fizz loop. The blade itself does nothing to players: no damage, no push. |
| J + 5.5 | Done (the 0.5 s ink guard ends). HUD: "NEW ROUTES OPEN" (jump 1) or "NEW AREAS!" (jump 2). Every opened gate and every new piece pulses gold for 4 s in the world and pings on the minimap. Bots switch nav and replan. |
| J + 6 | Tartar's line in a text bubble, credited "COMMANDER TARTAR". Before jump 1: "This century tells me nothing. Further." Before jump 2: "Still standing? Further still. Show me the end." At a Practice rewind: "Enough. Back to the beginning." |

**Flip time of a group:**

    F = J + 5 × ((β mod 180°) / 180°)

β is the bearing of the group's centre from (0, 0), measured from +z toward +x. A point and its mirror have bearings β and
β + 180°, so **every mirrored pair flips at the same instant**: the jump is fair by construction, like the engine's radial
front.

Where the blade is when (Alpha's half; Bravo's twin is identical):

| Spot | Bearing | Flips at |
|---|---|---|
| both spawns, both Bazookarp checkpoints, Tram Parade | 180–184° | J + 0.0–0.1 s |
| the Gilded Arcade | 199° | J + 0.5 s |
| the level crossing on Customs Lane | 202° | J + 0.6 s |
| the Prow roof garden | 210° | J + 0.8 s |
| the West Wharf | 245° | J + 1.8 s |
| Iron Bridge spans (from the Wharf end to Alpha's end) | 87–110° | J + 2.4 … 3.0 s |
| the river platform | 115° | J + 3.2 s |
| Bond Passage | 153° | J + 4.3 s |
| the Halo's twelve segments | — | in pairs: 0.4, 1.25, 2.1, 2.9, 3.75 and 4.6 s, so the halo fills in like hours on a clock face |

### 3.4 What changes where

**Gates: era 1 only.** Each is solid, 2.6 m high, non-inkable, with a roof top. Nobody stands on one, so a gate never
drops anyone or takes anyone's ink.

| | Gate (per half) | Era 1 | Era 2 / 3 |
|---|---|---|---|
| G1 | The Gilded Arcade: hoardings in its two mouths and its side door | "NEW ARCADE: OPENING 1892" bill posters, scaffold seen above the hoarding | Open. Shops, a mosaic floor, the octagonal court with its clock and two carved bell-ringer figures. |
| G2 | The Iron Bridge: a hoarding at each bridge head (4.5 m); the deck missing | Iron arch ribs standing over the river with timber falsework, "BRIDGE OPENS 1888" | The deck appears over the water in three 7.1 m spans (safe: nothing can stand over water). Heritage lamps. |
| G3 | Bond Passage: a crate and barrel stack, 4 × 4 × 2.6 | "H.M. CUSTOMS: BONDED" | A café passage with tables in its cover slots |
| G4 | The level crossing on Customs Lane's west run (x −19 … −15): a goods wagon (5 × 2.6 × 2.6) standing across the lane, behind closed crossing gates | A shunting siding from the railyard into the back shops' goods shed | The rails are paved over and Customs Lane runs through. Yard Lane becomes Spray Lane, with street art on the yard wall. |

**Builds: era 3 only.** Each appears only where nobody can be:
- above 5.0 m;
- over water;
- or inside the footprint of the solid it replaces, in the same group.

| | Build | Where | Safe because |
|---|---|---|---|
| B1 | **The Halo**: 12 segments | annulus r 12 … 15 at 5.0 … 5.4 over the circus ring | Underside 5.0: above any jumping kid (2.9 m), and above the tower's headroom (3.72) plus 1.0 m. |
| B2 | **Light-pylons** ×4 | replace the four circus columns (⌀1.4) | The footprint is inside the old column. The part above 2.6 m rises over a roof top nobody stands on. Inkable glass: squids swim up onto the Halo. |
| B3 | **Sky-bridges** ×2 | from the Halo at bearings 212° (Alpha) and 32° (Bravo), flat at 5.4 to above the Prow's tip (r 21), then a stair down onto the roof garden | Over the circus edge at 5.0 underside, over the Prow's roof after that. |
| B4 | **Prow roof gardens** ×2 | the Prow Hotel's own roof at 3.8 round its clock turret (about 50 m²): planters (cover), a lookout rail | The same roof block swaps from `roof` to walkable. Planters stand inside its footprint. |
| B5 | **River platforms** ×2 | (±32, ∓15), 9 × 8 at 0, on columns, two gangways each | Over water. Bottom above −1.0, so it is not a waterline deck slab (engine rule 36). |

**Looks only** (no collision change): every facade, floor, lamp, sign, vehicle and the backdrop (section 5).

**Totals per half:**

| Jump | Pieces | Turf |
|---|---|---|
| Jump 1 | 4 gates, 6 groups | +about 190 m² (arcade, bridge, passage, crossing) |
| Jump 2 | 5 builds, about 14 groups including the shared Halo | +about 270 m² per half (Halo 254 m² shared, gardens 2 × 50, platforms 2 × 72, bridges 2 × 18). Era 3 is about 9 % more turf than era 2. |

No inkable surface ever disappears.

### 3.5 What happens to people, devices and ink at a jump

- **Players.** Nobody stands on a gate (roof tops) and nobody can be inside a build (above 5 m, over water, or inside the
  old solid). As a safety net, the engine's shove still runs at each flip: lift onto the new top if it is within 1.8 m,
  otherwise shove to the nearest open floor, never into a wall or water. A bot-match audit expects 0 shoves.
- **Squids** on a gate's wall drop as it goes. Squids on a pylon in era 3 swim up it as on any inked wall.
- **Devices** (sprinkler, beacon, Drip Curtain, Lurk Mine, cling bomb, Surf N' Turf buoy, Skitter Bomb) on a gate that goes
  are destroyed with the same crunch the tower uses (the `deploy` package's destroy path, engine H17).
  - A buoy anchored to a gate falls and anchors again.
  - A Zipline anchored to a gate ends at once, and the rider lands where they are.
- **The tower, zones, Bazookarp, spawns** are never touched (section 4).
- **Ink:**
  - Floors and walls that exist in every era keep their ink through both jumps, even when the surface under it changes
    from setts to asphalt to lightstone. The ink "travels through time".
  - Gates were never inkable, so nothing is lost.
  - Ground uncovered by a gate (the arcade floor, the passage, the crossing, the floor under the wagon) becomes live turf,
    blank.
  - Builds arrive blank and take ink 0.5 s after they flip.
  - Turf % is always out of the turf that exists now. The Turf War result is counted on era 3.

### 3.6 How it is announced

- **Before the match.** The stage-select blurb says "Commander Tartar jumps the city forward in time twice a match: new
  routes, then new areas." The intro fly-in ends on Tartar ringing once.
- **Always on screen.** The HUD era chip shows "1800s · TODAY · 3000s" with the current era lit and a thin bar counting
  down to the next jump.
- **The world counts down too.** The two rows of clocks over the Clock Steps show the time to the next jump; their hands
  sit at the jump time. Players at mid can read them.
- **In the last 10 seconds:**
  - ring, blueprint and flicker (you see exactly what will come and what will go);
  - the minimap preview;
  - the chimes;
  - the receiver lifting.
- **After:** the gold pulses on everything new and the "NEW ROUTES OPEN" / "NEW AREAS!" callout.
- **Colour choice.** Blueprints, pulses and the blade are white-gold and pearl. They are never cyan, orange or magenta,
  which are team inks in some pairings.

### 3.7 What both teams can do with it

- **Stage at a gate.**
  - Ten seconds before jump 1, a team can stack at its own arcade's south mouth, on Customs Lane (the side door opens onto
    the checkpoint's terrace).
  - Or it can gather on its River Walk at the bridge head and cross to the enemy's wharf the moment the bridge flips
    (2.4–3.0 s into the sweep).
  - Defenders who read the minimap preview know which doors are about to open behind them.
- **Time specials.** A Booyah Bomb, Ink Storm or Strike thrown into the circus at J lands as the Halo appears over it in
  jump 2.
- **The era-3 land rush** (Turf War). About 650 m² of blank ground appears. Teams split up to paint:
  - the Halo (up the pylons or the sky-bridges);
  - their roof garden;
  - their river platform.
- **High ground swings.** In era 3 the Halo looks down on the centre zone and on the tower's first metres. Each roof garden
  looks down on its own team's Prow Place (the side zone) and on Tram Parade. The defender owns the garden; the attacker
  can reach it by the sky-bridge.
- **Nothing to deny.** The jump cannot be stopped or hurried. Neither team can hold the map back in the 1800s.

### 3.8 How it stays fair

- Every era piece is mirrored. The blade flips mirrored pairs at the same instant.
- The schedule is a pure function of the stage clock, shown on the HUD from second 0.
- A jump never changes score, objectives, health, ink tanks or special gauges. It never removes an inkable surface, never
  closes a route, never appears inside a player, and never touches the spawn areas or any objective.
- Every era meets the stage rules on its own:
  - 2–4 flank routes per side;
  - spawn to mid 5.4–6.6 s (engine rule 33);
  - cover ≥ 90 %;
  - zones with ≥ 3 ways in;
  - ≥ 2 routes to each Bazookarp checkpoint.

  Each is measured with `ERA=1/2/3`.

### 3.9 Bots

They use the engine's design (`engine.md` §4.3): one union nav graph, era bits on the edges, a danger layer during warn,
replans at done, and a ×2 paint weight on fresh ground for 30 s (which drives the era-3 land rush).

This concept adds two behaviours:
1. **Wait at an opening gate.** A bot whose best route in the coming era is at least 25 % shorter through a gate opening
   within 8 s may wait 3–4 m from that gate instead of detouring. It uses only what the HUD shows everyone (the next jump
   and the minimap outlines).
2. **Use the pylons.** In era 3, a bot near mid inks a pylon's column and swims up when the Halo is the best ground for its
   objective. The engine's climb edges already model this (an inked wall up to 5.5 m).

### 3.10 Online

As in the engine:
- the era is a pure function of the host's stage clock, which every follower already tracks;
- no records in a match;
- splats near a flip carry the painter's clock;
- a late joiner (Practice) gets the era instantly;
- a host change carries the clock.

Boss Battle is the one exception, because the boss's phase change is decided on the host. When it plays the phase roar,
the host records **['era', to, J]** (J on the stage clock = roar + 4 s), and every follower runs the same flip schedule
from J. This is the only new record.

### 3.11 Practice, the menu, and the end of a match

- **Practice and the menu backdrop** cycle as in the table. Their 3 → 1 rewind sweeps the blade counter-clockwise; the
  engine's rescue rule covers anyone on a river platform.
- **The end of a match.** When the whistle blows and the results screen still shows the stage, the blade sweeps back
  counter-clockwise to the 1800s. This is cosmetic: the score is already counted. It is the lore's last beat: Tartar has
  seen enough and goes back.

### 3.12 Against `engine.md`: what this concept adopts and what it asks to change

**Adopted:**
- the union world;
- per-group flips with the 0.5 s ink guard;
- the 10 s warn;
- the events and the HUD chip;
- the danger layer;
- the ink rules;
- the RGB AO bake;
- every "never changes" and "appearing pieces" rule (§5 rules 1–44).

The layout above was fitted to them:
- zone outlines are ≥ 2 m from every change;
- the Halo is ≥ 1.0 m above the tower's headroom;
- groups are ≤ 8 m;
- the Halo is split at z = 0;
- nothing changes within 12 m of a pad;
- nothing changes within 3 m of a Bazookarp objective.

**Asked to change:**

| | Engine today | This concept | Cost and fallback |
|---|---|---|---|
| 1 | **The front.** A radial front from (0, 0) at 25 m/s; flips at J + r_g / 25. | **The clock hand.** Flips at J + 5 × ((β_g mod 180°) / 180°). | One line in `StageEras` (the flip function) and the shader's front test (angle to the blade instead of distance to the ring). It is just as fair, and turns "a ring of light" into Tartar's own clock: the stage's story. The curtain is a planar strip turning about the dome instead of a cylinder. **Fallback:** the engine's ring, with no other change. |
| 2 | **Boss Battle.** `fixed: 3`, never jumps. | **Jumps on the boss's phase roars** (1800s → today at 66 %, → 3000s at 33 %). | Three boss-nav builds at load (the boss's nav is coarse) and one host record (3.10). The pay-off: the boss's phase changes become set pieces, and phase 3's Shell Frenzy meets the Halo as an escape. **Fallback:** `fixed: 3`. |
| 3 | **Outline colours.** Minimap outlines dashed cyan and amber. | White-gold and grey. | Colour constants only. Cyan and amber are team inks in some pairings. |

---

## 4. Each mode on this layout

### 4.1 Turf War

- The whole stage, three times over. The total turf grows about 7 % at jump 1 and about 9 % more at jump 2.
- In a 3:00 match, era 3 is the final minute, opened by the blade and the final-minute song together.
- What the gimmick does here:
  - era 1 is a tighter opening: four lanes per side, but no bridge, no arcade and no link between the lanes at the
    base's west side;
  - era 2 opens the flanks (the bridges bypass mid);
  - era 3 adds a vertical layer and blank ground to fight for.

### 4.2 Zone Control

- **Centre:** one zone, a regular octagon of circumradius 6.5 on the concourse (y 1.0 … 1.8), about 120 m².
  - Ways in: the two Clock Steps, the two ramps, four 1.3 m hop-up faces.
  - Cover: the four ticket barriers inside it; the eight dome columns just outside it (r 8.2).
  - High ground over it: both Prow balconies and both Rowing Club decks (2.4); in era 3 the Halo (5.4, 5.5 m away).
  - Tartar hangs above it. "Hold the floor under the telephone."
- **Side (Alpha's):** **Prow Place**, x −19 … −7, z −30 … −21.5 (102 m²) at y 0. Its centre is 28.8 m from mid, where
  Long Stages side zones sit.
  - Ways in: north (the circus's south-west and the Diagonal's south walk), east (Tram Parade's west footpath), west
    (Yard Lane's north end). From era 2 also south (the arcade's north mouth, 2.5 m from the outline).
  - Cover: a cabmen's shelter slot (2.4 × 1.6) and a drinking-fountain column inside it; Alpha's tram 3.5 m east of it.
  - High ground over it: the Prow balcony (2.4) on its north side; in era 3 the roof garden (3.8) behind that.
  - Bravo's side zone is the twin: x 7 … 19, z 21.5 … 30.
- **What the gimmick does here:**
  - Nothing within 2 m of either outline ever changes, so coverage totals never move.
  - If a rotation falls inside a sweep (J … J + 5.5), the host holds it until done. The shift is a few seconds of a 30–60 s
    rotation, recorded as usual.
  - Era 3 (the last 1:40) puts the Halo over the centre: the final-30-s centre lock is fought from above too.

### 4.3 Tower Command: "the tower rides the tram"

The track is drawn from the centre to Alpha's goal on Bravo's half. Straight lines, square corners, world x / z frame.
Bravo's track is the mirror.

| # | From → to | Length | What it runs on |
|---|---|---|---|
| 1 | (0, 1.3, 0) → (−11.5, 0) | 11.5 | Across the concourse; **drop** 1.3 m off the plain west face (x −8.8) onto the circus |
| 2 | (−11.5, 0) → (−11.5, 14) | 14 | North over the circus ring, under the era-3 Halo |
| 3 | (−11.5, 14) → (−2.2, 14) | 9.3 | East into the mouth of Tram Parade. It is 0.75 m clear of the north Clock Steps' foot (z 12.0). |
| 4 | (−2.2, 14) → (−2.2, 42) | 28 | North up Tram Parade's **west tram track** past Bravo's tram (on the east track). **Checkpoint 1 at (−2.2, 30)**, at the tram stop opposite Bravo's Post Office Steps. |
| 5 | (−2.2, 42) → (−21.5, 42) | 19.3 | West along Customs Lane (5 m wide: 1.25 m clear each side), across the west footpath at a lane mouth with no veranda. Cafe Lane's mouth and the bond stores are on either side. |
| 6 | (−21.5, 42) → (−21.5, 54) | 12 | North up Bravo's River Walk: **climb** 1.0 onto the Bond Wharf at z 44.5, **drop** 1.0 off its end at z 52. **Checkpoint 2 at (−21.5, 48)**, on the wharf by the river wall. |
| 7 | (−21.5, 54) → (14, 54) | 35.5 | East across the forecourt over the flush turntable, 0.75 m short of the grand stair's foot (z 56) |
| 8 | (14, 54) → (14, 59.5) | 5.5 | **The goal**, 12.4 m from Bravo's pad (5, 3.4, 68), outside the barrier, in full view of the spawn deck |

- **Length:** 135 m. Two checkpoints, so 80 s of track and 2 × 10 s of checkpoints: 1.69 m/s.
  - That is between the old tracks (1.0) and the doubled Long Stages tracks (2.0–2.2).
  - To match those, add a loop south down Cafe Lane and back along Little Lane (+33 m → 2.1 m/s).
- **Climbs and drops:** three drops (concourse, wharf end) and one climb (the Bond Wharf). Everything else is flat.
- **Headroom:**
  - The Halo's underside (5.0) is 1.28 m above the 3.72 m headroom over segments 1–3.
  - The clock beams are off the track (the track leaves by the west face, not the steps).
  - The verandas sit over the footpaths; the track crosses a footpath only at Customs Lane's mouth, which has no veranda.
  - The sky-bridges and Prow gardens are in the other two quadrants (south-west / north-east). Both tracks use only the
    north-west and south-east quadrants of the circus.
- **Clearance:** no gate, build or cover slot is within 1 m of either track's swept platform:
  - Bravo's arcade, level crossing (x 15 … 19 on Customs Lane's east run) and Bond Passage are 4–20 m away;
  - the pylons and carts in the circus were placed off the track.
- **What the gimmick does here:** nothing to the tower. Era 2's bridges and arcades give attackers new ways to the tower;
  era 3's Halo and gardens give both teams new perches over its first and fourth segments.

### 4.4 Bazookarp

Positions are given for Alpha's half (Bravo carries toward Alpha's goal); Bravo's half is the mirror.

- **Start:** (0, 1.3, 0), the centre of the concourse under Tartar.
- **Checkpoint:** (−2.2, 0, −37.5) on Tram Parade's west track, in front of the Post Office Steps. A 3 × 3 pad.
  - Contested from: the steps' terrace (1.3, colonnade cover), Alpha's tram (its south end is 2 m away), Customs Lane, and
    Tram Parade both ways.
  - Nothing changes within 3 m of it.
- **Goal:** the pedestal on the cable-tram turntable at (0, 0, −57).
  - It is one level below the spawn deck (3.4), 12.1 m from Alpha's pad, in full view of the deck.
  - Routes to it from the checkpoint: Tram Parade (19.6 m); Customs Lane → Cafe Lane → the forecourt (~38 m); Customs
    Lane → Yard Lane → the forecourt (~44 m, from era 2); the River Walk over the Bond Wharf (~55 m).

**Routes from the start to the checkpoint** (Alpha's half):

| Route | Length | Era 1 | Era 2 | Era 3 |
|---|---|---|---|---|
| Tram Parade (south Clock Steps, past the tram) | 38 m | yes | yes | yes |
| Prow Place → the Arcade → side door → Post Office terrace → down its steps | 47 m | no | yes | yes |
| Prow Place → the Arcade → Customs Lane → Tram Parade | 55 m | no | yes | yes |
| Circus SE → Cafe Lane → Customs Lane → Tram Parade | 62 m | yes | yes | yes |
| Prow Place → Yard Lane → Customs Lane | 72 m | no (level crossing) | yes | yes |
| The River Walk → Customs Lane | 83 m | yes | yes | yes |
| Era 3: down from the Halo or the garden into Prow Place, then as above | — | | | yes |

That is three routes in era 1 and six from era 2. None of them is a hidden shortcut into a base:
- the Iron Bridge leads to the enemy's wharf, 60 m from their goal, through their River Walk;
- no era piece reaches within 12 m of a spawn.

**Carry times** (the carrier walks at 4.8 m/s and swims at 9.4 m/s, 20 % slow):

| Leg | Walking | Swimming in own ink |
|---|---|---|
| Start → checkpoint, 38 m | 7.9 s | 4.0 s |
| Checkpoint → goal, 19.6 m | 4.1 s | 2.1 s |

- A pushed but successful leg: expect 20–35 s to the checkpoint, then 12–25 s to the goal after the re-pickup.
- The 60 s timer covers either leg with room to fight.
- Distance to the goal is 57 m in every era. The gimmick never brings the goal closer.

**Rainmaker-free zones** (for Alpha's carrier on Alpha's half; Bravo's are the mirror):
- the Prow balcony (2.4);
- the Rowing Club deck (2.4);
- from era 3, the Prow roof garden (3.8).

These are defensive high ground behind the defenders' line. The engine allows their outlines to carry `eras`. The Halo is
not a free zone: it is mid and shared.

**What the gimmick does here:**
- Jump 1 (3:20 left) turns a three-route defence into a six-route one.
  - The arcade gives the attacker a covered approach that ends on the checkpoint's own terrace.
  - The bridges give a flank to the enemy's wharf.
- Jump 2 (1:40 left) gives the defenders a garden perch over Prow Place, the attackers the Halo over the start, and the
  carrier a pylon or sky-bridge way out of a crowded circus.
- The carrier and the Bazookarp itself are never touched. A dropped Bazookarp lies on ground that never changes.

### 4.5 Boss Battle: yes

HULLBREAKER's home ground is the circus ring plus the first 25 m of Tram Parade's arms and the first 20 m of the
Diagonal's arms: about 2,000 m² of open floor.
- The concourse is an island it walks round, a roundabout arena.
- Tram Parade is a 14 m straight for its Hull Charge, and the trams are walls that stun it when it charges into them.
- The jumps fire on its phase roars (3.12, change 2). Phase 1 is fought in the 1800s (the hoardings are walls it can be
  stunned on), phase 2 today, phase 3 in the 3000s, where the Halo and pylons are the squad's escape from the Shell Frenzy.
- If the lead keeps the engine's `fixed: 3`, the fight is in the 3000s: also good, because the Halo works the same.

---

## 5. The look

### 5.1 Three eras of the same streets

The street lines, the bluestone kerb channels, the dome's silhouette, the river and Tartar never change. Everything on
them does.

| | 1800s (about 1880) | Today | 3000s |
|---|---|---|---|
| **Streets** | Bluestone setts with cable-tram slot rails; straw, puddles | Tram Parade in dark asphalt with flush tram rails; lanes in restored setts | Pale lightstone pavers; the old kerb lines are thin glowing seams |
| **Buildings** | Sandstone and cream render boom-style facades, red-brick bond stores, bluestone warehouses, timber shopfronts with gilt signs, cast-iron lace verandas in deep green | The same facades restored; awnings, neon café signs in muted tones, glass towers rising behind them (backdrop) | White ceramic and glass skins over the old proportions, vertical gardens, verandas become glass canopies (same 3.2 roofs) |
| **The dome** | Fresh copper (a warm bronze), the clocks in timber cases with Roman numerals | Weathered verdigris green, the clocks lit from behind | A glass lattice dome with a slowly turning light ring, holographic clock faces |
| **Trams** (the same collider) | Cable tram: open grip car and saloon trailer, maroon and cream | A low-floor articulated tram, white and graphite with a thin yellow band | A glass float-tram hovering 0.3 m over a light rail |
| **Lanes** | Crates, barrels, washing lines, horse troughs, gas lamps, bill posters | Café tables and umbrellas, coffee carts, street art panels (chalky, low-saturation), bikes | Planter lanes, light strips, garden benches |
| **The river** | Timber wharves, mooring bollards, a sailing barque and a steam tug | A promenade, the Rowing Club's eights on racks, a ferry pontoon | Glass decks, floating gardens, the river platforms |
| **Base** | The cable-tram engine house: bluestone, winding wheels behind arched windows, the chimney smoking | A tram museum and depot; the chimney a heritage landmark with a café sign | A float-tram dock; the chimney a slim light spire |
| **Signs** | "CABLE TRAMS 3d", "NEW ARCADE: OPENING 1892", "H.M. CUSTOMS: BONDED", "BLUESTONE JUNCTION" in gilt | Tram-stop signs, café menus, "SPRAY LANE", the same name in steel letters | Holographic signs, the name in light |

### 5.2 Cover slots: the same box, three objects

Collisions never change for cover, only the mesh. Swap groups are props only.

| Slot (collider) | 1800s | Today | 3000s |
|---|---|---|---|
| Cart 2.2 × 1.2 × 1.2 | barrel hand-cart, hansom cab body | coffee cart | hover planter |
| Kiosk 2.4 × 1.6 × 2.4, roof | cabmen's shelter | news kiosk | light kiosk |
| Column ⌀1.4 × 2.6, roof | bill-poster column | advertising column / phone box | (circus only) glass light-pylon, B2 |
| Bench 2.0 × 0.6 × 0.9 | slatted bench and gas lamp | bench and bike hoop | light bench |
| Bollards 2.0 × 0.6 × 1.0 | mooring bollards and rope | bollards and bins | glowing bollards |
| Crates 1.6 × 1.6 × 1.4 | tea chests, wool bales | café crates, planters | sealed cargo pods |
| Shelter 4 × 1.5 × 2.4, roof | timber tram shelter | glass tram stop | light canopy |
| Barrier 3.0 × 0.5 × 1.1 | timber ticket barrier | ticket gates | solid light gate |
| Tram 2.6 × 16 × 3.2, roof | cable tram | tram | float-tram |

### 5.3 Materials and palette (team ink stays the loudest colour)

- **Six surfaces** (the engine allows its 3 slots plus 3 era alternates):
  - bluestone setts (dark blue-grey, a fine joint pattern; the base of the stage);
  - lightstone (pale warm-white pavers with hairline seams, era 3);
  - wharf timber (grey weathered boards);
  - alternates: restored setts, glass deck, terrazzo.
- **Four remaps:**
  - the Tram Parade carriageway: setts → asphalt (shared `PATTERN.asphalt`) → lightstone;
  - lanes and the circus: setts → restored setts → lightstone;
  - walks: timber → timber → glass deck;
  - concourse: sandstone flags → terrazzo → white ceramic.
- **Palette.** Every large area sits at low-to-mid saturation: blue-grey stone, cream, sandstone, dark green iron, weathered
  timber, white.
  - Saturated colour lives only in small props (a red pillar box, a tram's yellow band) and never on floors.
  - The 1800s "sepia" comes from warm albedos, smoke haze and a warm sky, never from a desaturating grade (`uSat` stays
    ≥ 0.95), so ink keeps its strength.
  - Street art is chalky and kept to wall panels above 1.5 m.
  - Era-3 light is white-gold and pale lilac at low saturation. No cyan, orange or magenta glows.

### 5.4 The far backdrop on every side (one set per era, ≤ 6 draw calls each, swapped behind the blade)

| Side | 1800s | Today | 3000s |
|---|---|---|---|
| South (behind Alpha) and north (behind Bravo) | Two-storey terraces, church spires, a domed exhibition hall on a low hill, gasometers and a shot-tower chimney | A high-rise centre of glass towers among the old spires; one tall gold-crowned tower | Mega-towers with sky gardens and sky-bridges between them, float-trams crossing between them |
| West and east (beyond the river bends) | The river winding between parkland and wharf sheds, tall ships' masts, the bay's flat light | The river between gardens with old elms; a stadium's light towers; an arts-centre spire; a big observation wheel on the far docks | Floating garden platforms over the river; a far city of glass on the bay |
| South-west and north-east (beyond the railyards) | Track fans running out to the suburbs; steam and coal stages | Suburban electric trains under catenary gantries | Maglev guideways disappearing into a hillside |
| Far horizon, all eras | Low blue ranges inland; the bay | | |

### 5.5 Day and dusk

- **Day.**
  - 1800s: a warm hazy sky with chimney smoke drifting over the city.
  - Today: a clear blue sky with cumulus.
  - 3000s: a luminous high sky with a pale arc of an orbital ring.
- **Dusk.** The lamps' colour comes from the era (engine `look[e].lamps`), with the same lamp positions in every era.
  - 1800s: gas lamps warm and flickering, candle-lit windows, the sky orange through smoke.
  - Today: warm-white streetlights, tram headlights, the clocks lit.
  - 3000s: floating lantern orbs, the Halo glowing softly, gold light lines on the facades. Low on the horizon, one red
    star that was not there before: what Tartar is looking for.
- **Tartar** glows in every era and time of day. His dial is the warmest light under the dome.

### 5.6 The intro fly-in and the stage-select hero shot

- **Intro** (`intro: { from: [34, 22, 30], lookFrom: [0, 9, 0], toBack: 3.0 }`). It opens high over the north-east
  railyard and swoops down the Diagonal into the circus, past the clocks into the dome. Tartar rings once and his dial
  lights. Then it pulls back along Tram Parade to the player's spawn.
- **Hero shot** (`art: { from: [46, 24, −38], look: [−2, 4, 4], fov: 56 }`). It looks from high over the south-east river
  bend, across the Iron Bridge and the River Walk, to the dome and its clocks, with Tram Parade running to Bravo's
  chimney.
  - It is rendered **mid-jump**: the blade frozen at bearing 150°, standing in the frame. The 1800s are on one side of it
    (copper dome, cable tram, the unfinished bridge's iron ribs) and today on the other (the green dome, the finished
    bridge, the glass towers).
  - One picture explains the stage.
  - It needs a `HAND=150` option for `stageart.cjs` (engine T3 already plans `ERA=n`).

---

## 6. The three biggest risks and how to handle them

1. **Scope and performance: three cities in one stage.** Every facade, prop and backdrop exists three times, plus the
   biggest new engine module of the batch.
   - *Handling:*
     - Keep collision change tiny: cover slots keep their colliders, there are four gates and five builds per half, and no
       inkable surface ever disappears. Most of the jump is then looks, which the engine draws per era bucket.
     - Budget each era's visible scene at ≤ Halyard (334 calls / 3.0 M tris) and the 5 s sweep at ≤ 390 / 3.6 M.
     - Build in this order, so that each step is useful on its own: looks only, then gates, then builds, then the
       per-era bake.
     - If time runs out, era 3 ships with the Halo and the pylons only (the gardens and the river platforms are additive
       and can follow).
2. **The map has to be good three times.**
   - The risks:
     - era 1 could feel cramped (no bridges, no arcade, a closed level crossing);
     - era 3 could tilt mid toward whoever owns the Halo;
     - the cover map and bots could pass in one era and fail in another.
   - *Handling:*
     - Every check runs per era with `ERA=1/2/3`: cover map, spawn-mid, route count, bot stuck %, zone and tower matches
       on the Mac mini.
     - Era 1 keeps four lanes from each base even with every gate shut: Tram Parade, Cafe Lane, the River Walk and Yard
       Lane. Prow Place leads off Tram Parade to the Diagonal as a fifth way into mid.
     - Tune by moving a gate, never by adding one.
     - The Halo has solid parapets and is exposed from both spawns' avenues. If it dominates, open more gaps in the parapet
       or drop it 0.4 m (it must stay ≥ 4.72 over the track).
3. **The jump moment itself: readability, and fairness under lag.** A fight is running when the blade sweeps through it,
   and routes open behind defenders. On a bad connection the flips could land at different moments on different screens.
   - *Handling:*
     - Warn 10 s ahead with blueprints, flicker, a minimap preview, the chimes and the receiver.
     - The schedule is shown from second 0.
     - Nothing ever appears where a player can stand (checked statically by `check-maps` and dynamically by
       `stats.eraShoves = 0`).
     - Flip times are a pure function of the stage clock (`net-eras.cjs` asserts < 0.4 s skew at 150 ms lag).
     - Before the user plays it, show them a short recording of a jump (warn → blade → done) and tune the blueprint
       opacity, the flicker and the callout words from their reaction.
     - If the clock blade reads worse than the ring in that test, switch to the engine's radial front: one line, no
       other change.

Smaller risks to watch:
- **The skew makes left and right flanks different** by design (each team has the river on its left and its own wharf on
  its right). Measure the win rates per side on the Mac mini.
- **The bounding box is large** (about 100 × 158) because of the bays. The paint atlas covers only the land; check
  `size-budget.js` for the union lightmap (engine rules 8–9).
- **Tower track speed** is 1.69 m/s. If the lead wants the doubled-track feel, add the Cafe Lane loop (section 4.3).
