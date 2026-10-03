# Bluestone (`bluestone`): concept "the place first"

One of three independent concepts for the time-travel city. This one starts from the place: what you fight over, what you
see, what the streets are made of. The lanes, heights, cover and routes all come from that architecture. The user's
words are in `../../REQUEST.md` ("stages:"); the rules are in `../STAGE-RULES.md`.

**Conventions.** World metres. x points east and z points north. Bravo is at +z (north) and Alpha at −z (south). Every
number below is for **Alpha's half**. Bravo's half is the 180° twin, (x, z) → (−x, −z). Heights are floor tops. Water is
the death plane at −1.6.

---

## 1. Names and identity

**Name options**
1. **Bluestone Junction** (my pick). This is the station where the city's two great streets cross the river.
2. **Under the Clocks**. This is what every local says when they arrange to meet.
3. **Bluestone Bend**. The river bends round the station.

**Identity.** Bluestone is a southern harbour city that a gold boom paid for. It is built from the dark blue-grey volcanic
stone quarried on its plains: every kerb, gutter and laneway is paved with it, in 1888, in 2026 and in 3026. At its
heart, two great streets cross at an angle on a stone bridge over a bend in the river. The **Cable Road** is the tram
boulevard, and **Station Street** runs along the station front. Where they meet stands **Bluestone Station's Clock
Dome**: an ochre rotunda on the bridge, with a row of clocks over its steps and a copper dome. On top of the lantern sits
the city's very first public telephone, a three-metre cream-and-brass candlestick phone. That phone is **Commander
Tartar**, the 12,000-year-old AI. He wired himself into Bluestone's telephone exchange the year it opened. Now he is
winding the city's clocks forward to watch how the world ends, so that he can go back and tell the Professor. He rings
twice a match. Each time, a wave of clock-light sweeps out from the dome and the city becomes its own future around the
players:
- 1888 is a gaslit boom town of cable trams and hoardings;
- 2026 is a café-laneway city with murals and glass towers;
- 3026 is a city of light, glass and gardens, raised above a sea that is visibly coming in.

Through all three eras the bluestone, the street pattern, the dome and the telephone stay the same. Tartar is the one
thing in the city that never changes.

---

## 2. The plan

### 2.1 Macro shape: a skewed X, belted at the waist by the river

From above, Bluestone is a **skewed X**:
- **The two arms.** The Cable Road runs 25° east of north. Station Street runs 30° west of north. They cross at mid at
  55°, so the X leans and is not mirror-symmetric about the spawn axis.
- **The quarters (the notches facing the bases).** The south notch is Alpha's laneway quarter and the north notch is
  Bravo's. Each is a wedge of city blocks cut by lanes, so each half reads as a triangle of streets that widens from the
  bridge (about 31 m across) to the base (about 64 m).
- **The side notches.** These are the river. It comes in from the south-west, loops into a **lagoon** round the bridge,
  passes under it, and leaves to the north-east. Beyond the lagoons, the riverside warehouses and the railway yards are
  out of play.
- **The river walks.** Two curved stone walks, 8 m wide, sit on a ring of radius 23–31 m round the dome. They belt the
  waist and link each team's avenue to the other team's avenue round the outside of mid.

The result is a bow-tie of two street wedges, knotted at the Clock Bridge, with a belt of river walks round the knot. It
is not a band and not a bowl. It is unlike the aquarium (round galleries) and the caldera (a crescent). It is also unlike
the twelve stages we have: the nearest is Kelpline, which is one skewed band. In era 3 the river decks fill part of the
lagoons, so **the silhouette itself changes during the match**.

**How to draw it.** There are two frames, one per avenue:
- **Cable Road.** It is the centreline through (0, 0) along (sin 25°, cos 25°) = (0.4226, 0.9063). The cross offset is
  `tA = 0.9063·x − 0.4226·z`. The road is |tA| ≤ 7 (14 m: a 7 m carriageway with the tram tracks, plus two 3.5 m
  footpaths under verandas).
- **Station Street.** It is the centreline through (0, 0) along (−0.5, 0.866). The cross offset is `tB = 0.866·x + 0.5·z`.
  The street is |tB| ≤ 7.
- **The laneway quarter** is tA > 7 and tB < −7.
- **The west side notch** is tA < −7 and tB < −7.
- **The east side notch** is tA > 7 and tB > 7.
- **Everything inside the quarters** (lanes, blocks, the Haymarket) is on the plain x/z grid. "The city grid cut on the
  diagonal" is literally true: the grid is square and the two avenues slice through it at angles. That is why the
  Flatiron and the corner blocks are wedges.

### 2.2 Plan (all eras overlaid; 1 character = 2 m east–west, 1 row = 3 m north–south)

```
          x: -40       -20         0         20        40
        |    |    |    |    0    |    |    |    |
    71  YYY################################~~~~~        Bravo's half (z > 0) is the 180° twin
    68  YYY################################~~~~~
    65  YYY##########PPPPPPPPPPPP##########~~~~~
    62  YYY##eeeeeee#PPPPPPPPPPPP#wwwwwww##~~~~~
    59  YYY##eeeeeee#PPPPPPPPPPPP#wwwwwww##~~~~~
    56  YYY##eeeeeee#PPPPPPPPPPPP#wwwwwww##~~~~~
    53  YYYEEEEEEEEEEEEEEuuuuEEEEEEEEEEEEEE~~~~~
    50  YYYEEEEEEEEEEEEEEuuuuEEEEEEEEEEEEEE~~~~~
    47  YYYEEEEEEEEEEEEEEuuuuEEEEEEEEEEEEEE~~~~~
    44  ###SSSSSSSShhhhhhhhhhhhhhhCCCCCCCC#####~
    41  ####SSSSSSSShHHHHHHHHHHHHhCCCCCCC#####~~
    38  Y####SSSSSSSSHHHHHHHHHHHHCCCCCCCC#####~~
    35  Y#####SSSSSSSSGGGGaaGGGGCCCCCCCC#####~~~
    32  YY#####SSSSSSSSGGGaaGGGCCCCCCCC#####~~~~
    29  YYY#####SSSSSSSSLLLLLLLCCCCCCCC####~~~~~
    26  YYYY#####SSSSSSSSLLLLLCCCCCCCC#####~~~~~
    23  YYYYY####SSSSSSSSS###CCCCCCCCRR###~~~~~~
    20  YYYYYY##RRSSSSSSSS###CCCCCTTRRRR#~~~~~~~
    17  YYYYYYYRRRRSSSSSSSS#CCCCCTTCRRRRR~~~~~~~
    14  YYYYYYRRRRR~SSSSSvvvvvCCTTT~~RRRRR~~~~~~
    11  YYYYYRRRRR~~~SSSSSS++CCCCC~~~~RRRRR~~~~~
     8  YYYYYRRRR~~~~==============~~~~RRRR~~~~~
     5  YYYYYRRRDDDDD====OOOOOO====DDDDDRRR~~~~~
     2  YYYYYnnnFFFFF===OOOOOOOO===FFFFFnnn~~~~~
    -1  ~~~~~nnnFFFFF===OOOOOOOO===FFFFFnnnYYYYY
    -4  ~~~~~RRRDDDDD====OOOOOO====DDDDDRRRYYYYY
    -7  ~~~~~RRRR~~~~==============~~~~RRRRYYYYY
   -10  ~~~~~RRRRR~~~~CCCCC++SSSSSS~~~RRRRRYYYYY
   -13  ~~~~~~RRRRR~~TTTCCvvvvvSSSSS~RRRRRYYYYYY
   -16  ~~~~~~~RRRRRCTTCCCCC#SSSSSSSSRRRRYYYYYYY
   -19  ~~~~~~~#RRRRTTCCCCC###SSSSSSSSRR##YYYYYY
   -22  ~~~~~~###RRCCCCCCCC###SSSSSSSSS####YYYYY
   -25  ~~~~~#####CCCCCCCCLLLLLSSSSSSSS#####YYYY
   -28  ~~~~~####CCCCCCCCLLLLLLLSSSSSSSS#####YYY
   -31  ~~~~#####CCCCCCCCGGGaaGGGSSSSSSSS#####YY
   -34  ~~~#####CCCCCCCCGGGGaaGGGGSSSSSSSS#####Y
   -37  ~~#####CCCCCCCCHHHHHHHHHHHHSSSSSSSS####Y
   -40  ~~#####CCCCCCChHHHHHHHHHHHHhSSSSSSSS####
   -43  ~#####CCCCCCCChhhhhhhhhhhhhhhSSSSSSSS###
   -46  ~~~~~EEEEEEEEEEEEEEuuuuEEEEEEEEEEEEEEYYY
   -49  ~~~~~EEEEEEEEEEEEEEuuuuEEEEEEEEEEEEEEYYY
   -52  ~~~~~EEEEEEEEEEEEEEuuuuEEEEEEEEEEEEEEYYY
   -55  ~~~~~##wwwwwww#PPPPPPPPPPPP#eeeeeee##YYY
   -58  ~~~~~##wwwwwww#PPPPPPPPPPPP#eeeeeee##YYY
   -61  ~~~~~##wwwwwww#PPPPPPPPPPPP#eeeeeee##YYY        Alpha's spawn deck, pad at (2, 3.8, -61)
   -64  ~~~~~##########PPPPPPPPPPPP##########YYY
   -67  ~~~~~################################YYY
   -70  ~~~~~################################YYY
```

| Symbol | Meaning | Height |
|---|---|---|
| `O` | Clock Dome plinth (single) | 1.3 |
| `=` | Clock Bridge deck (single) | 0 |
| `C` | Cable Road | 0 |
| `S` | Station Street | 0 |
| `+` | the two avenues overlapping (the forecourts) | 0 |
| `#` | buildings (roofs off-limits): the Flatiron, the Engine House hall, the out-of-play riverside warehouses and market buildings | — |
| `L` | Lantern Lane / Lantern Place | 0 |
| `a` | Royal Arcade (boarded in era 1) | 0 → 1.3 |
| `G` | Wool Store and Coffee Palace (their roofs become the Sky Garden in era 3) | top 4.6 |
| `H` | raised Haymarket | 1.3 |
| `h` | quarter floor | 0 |
| `E` | Engine Street, the base forecourt | 0 |
| `u` | turntable dais (the goal) | 1.3 |
| `P` | spawn deck | 3.8 |
| `w` / `e` | West Yard / East Yard | 0 |
| `R` | river walk | 0 |
| `n` | Iron Bridge hump on the river walk | 0 → 1.3 → 0 |
| `~` | river and lagoon (death) | −1.6 |
| `Y` | railway yards (out of play) | — |
| `v` | Flatiron veranda | 2.4 |
| `F` | footbridges (**era 2+**) | 0 |
| `D` | River Decks (**era 3**) | 0 |
| `T` | Skytram Halt (**era 3**, over the road) | 3.8 |

**Mid close-up, era 2, with the Tower Command track (`*`, Bravo's push into Alpha's half). 1 character = 1.5 m.**

```
          |x=-30              0                 x=30|
     2  YRnnnnR~~~~~~====OOOO**OOOO====~~~~~~RnnnnR~
     1  YRnnnnRFFFFFF====OOOO**OOOO====FFFFFFRnnnnR~     footbridges (era 2) from the deck to the river walks
    -2  ~RnnnnR~~~~~~====OOOO**OOOO====~~~~~~RnnnnRY
    -5  ~~RRRRR~~~~~~=====OOO**OOO=====~~~~~~RRRRRYY
    -7  ~~RRRRR~~~~~~=======O**O=======~~~~~~RRRRRYY     the track drops off the plinth (1.3) here
    -8  ~~RRRRRR~~~~~~CCCCCC+**********~~~~~RRRRRRYY
   -11  ~~~RRRRRR~~~~CCCCCCCC+++SSSSS**S~~~RRRRRRYYY
   -13  ~~~RRRRRR~~~~CCCCCCvvvvvvvSSS**S~~~RRRRRRYYY     Flatiron veranda (2.4) beside the track, never over it
   -16  ~~~~RRRRRRR~CCCCCCCCCC#SSSSSS**SSRRRRRRRYYYY
   -19  ~~~~##RRRRRCCCCCCCCCC###SSSSS**SSSSRRR###YYY
   -23  ~~~#####RRCCCCCCCCCCLLLLLLSSS**SSSSS######YY
   -26  ~~#######C*********************SSSSSS#######     Lantern Lane (cp 1 at x 2)
   -29  ~#######CC**CCCCCCLLLLLLLLLLSSSSSSSSSSS#####
   -32  #######CCC**CCCCC#####aaa####SSSSSSSSSSS####
   -35  ######CCCC**CCCC######aaa#####SSSSSSSSSSS###     cp 2 at (-17, -38) on the Cable Road
   -38  #####CCCCC**CCChHHHHHHHHHHHHHHHSSSSSSSSSSS##
   -41  ####CCCCCC**CChhHHHHHHHHHHHHHHHhSSSSSSSSSSS#
   -44  ~~EEEEEEEE************************EEEEEEEEEE     along Engine Street
   -47  ~~EEEEEEEEEEEEEEEEEEEuuuuuEEEEEE**EEEEEEEEEE
   -50  ~~EEEEEEEEEEEEEEEEEEEu************EEEEEEEEEE     onto the turntable dais: the goal
   -53  ~~###wwwwwwwww#PPPPPPPPPPPPPPPP##eeeeeeeee##
```

### 2.3 The main pieces (Alpha's half unless marked "single")

| Piece | Centre (x, z) / extent | Size | Floor / top | Purpose |
|---|---|---|---|---|
| **Clock Bridge deck** (single) | (0, 0); x ±13, z ±8 | 26 × 16 m | 0 | Mid's floor over the river bend. A solid 1.0 m bluestone balustrade runs along x = ±13, with gaps at z −2…2 for the era-2 footbridges. Lamp standards on bluestone bases sit every 6 m. |
| **Clock Dome plinth** (single) | (0, 0) | round, r 7.5 (24 facets) | 1.3 | The centre zone. Four flights of steps, 5 m wide with a 3 m run, sit on the avenue axes (bearings 25°/205° and 150°/330°). Everywhere else is a hop-up. |
| **Dome piers** (single, 8) | r 6.5, bearings 22.5° + k·45° | 0.9 × 0.9 m | stand on 1.3 | Cover on the zone's rim. Arches between them spring at 6.8; each arch opening is 4.1 m wide. |
| **Dome, drum, lantern, Tartar** (single) | (0, 0) | drum r 7.5 from 6.8 to 10; dome to 15; lantern 15–17; Tartar 17–20 | `roof` | The landmark, seen from every lane. The two clock rows sit on the drum over the 205° and 25° flights (Alpha's and Bravo's). |
| **South forecourt** | between the avenues, z −8…−15 | about 28 × 7 m | 0 | Where both avenues land on the bridge. Two telephone kiosks stand here: Alpha's at (−9, −11), Bravo's at (9, 11). |
| **Flatiron Hotel** | prow at (0.7, −15.1), back face at z −23 (x −3.0…5.2) | wedge 8 m long, 8.2 m at its back | 9 m, corner turret 13 m, `roof` | The wedge between the avenues. It frames the dome from the base. |
| **Flatiron veranda** | x −4.5…5.5, z −11.5…−15.5 | 10 × 4 m, cantilevered on two iron columns at z −11.8 | 2.4 | Each bank's high ground over mid. It is a scaffold (`roof`) in era 1 and a floor from era 2. A 2.2 m stair climbs the Flatiron's Station-Street face from (5.5, 0, −22.5) to (2.8, 2.4, −17). |
| **Cable Road** (SW arm) | centreline (0, 0) → (−19, −40.8) | 14 m wide, about 45 m long | 0 | The cable-tram boulevard: Alpha's west lane. Its vista ends on the dome. |
| **Cable Road tram stop island** | centreline, z −13…−22, centre (−7.9, −17.5) | 3 × 10 m | 1.3 | Low cover with a step-up and ramps at both ends. Its shelter's roof is off-limits. |
| **Parked tram** (one collider, three looks) | west of the island, (−10.5, −18) | 2.6 × 10 × 3.2 m | `roof` | Big cover. It is a cable grip car and trailer, then a heritage tram, then a hover tram. |
| **Signal box** (era 3: Skytram Halt) | box at (−20, −22), on the river walk's outer edge where it meets the Cable Road, with a stair from the walk | 3 × 4 m | 2.4 | A small balcony over the walk and the forecourt. In era 3 the **Skytram Halt** deck (3.8, 4.5 × 10 m) hangs over the road's west half (tA −6.5…−2, z −13…−22). |
| **Station Street** (SE arm) | centreline (0, 0) → (22.5, −39) | 14 m wide | 0 | The station-front avenue: Alpha's east lane. The tower uses its upper half. |
| **Station Street tram stop island** | centreline, z −30…−39, centre (19.6, −34.5) | 3 × 10 m | 1.3 | Cover on the lower half, with a parked tram on its east side. |
| **Lantern Lane / Lantern Place** | z −23…−31; x −4.9…7.5 at z −27 | 8 m wide | 0 | The cross link behind the Flatiron. It holds the Bazookarp checkpoint and tower checkpoint 1. The Royal Arcade's north mouth opens on its south side. |
| **Wool Store** | from the Cable Road's east edge (x −6.7 at z −31, −9.5 at z −37) to x −0.5; z −31…−37 | about 7 × 6 m | top 4.6 | Bluestone warehouse. Its loft landing (2.4) on the west face is reached by a stair from the Cable Road footpath. A solid gate on the landing hides a flight to the roof, which opens in era 3. |
| **Royal Arcade** | x −0.5…4.5, z −31…−37 | 5 × 6 m, glass roof at 7.5 | 0, then steps up to 1.3 over its last 3 m | The centre lane. It is boarded in era 1 and opens in era 2. |
| **Coffee Palace** | x 4.5 to Station Street's west edge (9.8…13.3); z −31…−37 | about 7 × 6 m | top 4.6 | Temperance hotel. Its balcony landing (2.4) on the east face is reached by a stair from Station Street's footpath, with a gated flight to the roof that opens in era 3. |
| **Raised Haymarket** | x −9…13, z −37…−42.5 | 22 × 5.5 m | 1.3 | The side zone. It has steps from the arcade (north) and from both avenues (west and east), and a 1.3 hop-up from Engine Street (south). The weighbridge house stands on it. |
| **Engine Street** | x −30…34, z −44…−53 | 64 × 9 m | 0 | The base forecourt, with room to re-form. It is the goal approach. |
| **Turntable dais** | x −2…6, z −46.5…−53 | 8 × 6.5 m | 1.3 | The old cable-tram turntable. It holds the goal for both pushing modes, a level below the spawn. |
| **Spawn deck** (Cable Tram Engine House) | x −10…14, z −53…−66; pad at (2, 3.8, −61) | 24 × 13 m | 3.8 | Exits: a west stair (from (−10, 3.8, −55) down to (−18.5, 0, −55)), an east stair (from (14, 3.8, −55) down to (22.5, 0, −55)), and drops onto the dais or Engine Street. The main hall (z −66…−72, 10 m) and the chimney ((12, −70), 24 m) are `roof`. |
| **West Yard / East Yard** | x −26…−12 / 16…30, z −53…−64 | 14 × 11 m each | 0 | The cable-tram terminus loop and the stables / goods yard. |
| **River walk** (west arc: Alpha's half, then into Bravo's) | ring r 23…31 round (0, 0), from the Cable Road's west edge at (−17.4, −20.7) to the hump at (−27, 0) | 8 m wide, 25.7 m of arc per half | 0 | The flank belt round mid. The east arc is its twin: it leaves Station Street's east edge at (19.1, −19.1). |
| **Iron Bridge hump** | (−27, 0) (straddles the half line); twin at (27, 0) | 6 × 8 m | ramps 0 → 1.3 → 0 | The river runs under it into the lagoon. This is the "bend with a bridge". |
| **Lagoon** | inside r 23, outside the deck and the avenues | — | water | The river bend. Sightlines cross it, but you cannot walk it. |
| **Footbridges** (era 2+) | x −23…−13, z −2…2; twin x 13…23 | 10 × 4 m | 0 | Mid ↔ river walk. |
| **River Decks** (era 3) | x −23…−13, z −7…7; twin x 13…23 | 10 × 14 m each | 0 | Mid widens over the lagoons. |
| **Sky Garden** (era 3) | the Wool Store and Coffee Palace tops, plus a glass gallery bridge across the arcade at x −0.5…4.5, z −32…−34 | about 95 m² | 4.6 | Era 3's upper level over the slice and the side zone. |

`bounds`: x ±38, z ±74. The playable floor runs to |x| 34 and |z| 66.

### 2.4 Heights and the 1.8 m climb

- **0.** Streets, lanes, the bridge deck, the river walks, Engine Street and the yards.
- **1.3.** The dome plinth, the raised Haymarket, both tram stop islands, the turntable dais and the Iron Bridge humps.
  Each has steps or ramps **and** can be hopped up from anywhere: a kid climbs 1.8 m.
- **2.4.** The Flatiron veranda (from era 2), the Wool Store's loft landing, the Coffee Palace's balcony landing and the
  signal box. All are reached **only by stairs**, because 2.4 m is more than a climb.
- **3.8.** The spawn deck (behind the barrier) and the era-3 Skytram Halt. Stairs only.
- **4.6.** The era-3 Sky Garden. Stairs only.
- **Barriers.** The arcade hoardings and the stair gates are 2.8 m tall with `roof` tops. The yard walls and building
  walls are 2.6 m or more. Nothing between 1.4 m and 1.9 m is left as an ambiguous ledge.

### 2.5 Lanes, flanks and how they meet mid

From Alpha's spawn looking north: the Cable Road is on the **west (right)**, Station Street is on the **east (left)**, and
the quarter is between them.

- **West lane: the Cable Road.** Engine Street's west end → the road → the forecourt's west half → the plinth's
  south-west flight.
- **East lane: Station Street.** Engine Street's east end → the street → the forecourt's east half → the plinth's
  south-east flight.
- **Centre.**
  - In era 1: Engine Street → over the Haymarket → back out to an avenue → Lantern Lane → round either side of the
    Flatiron → the forecourt.
  - From era 2: straight up through the Royal Arcade into Lantern Place, then round the Flatiron, or **up its veranda
    stair onto the veranda (2.4)** and drop to the plinth.
- **West flank: the river walk.** The Cable Road leads to the walk at (−17, −21). The walk curves round the lagoon to the
  Iron Bridge hump at (−27, 0) and on into Bravo's half, where it reaches **Bravo's Station Street** at (−19, 19). This
  bypasses the bridge entirely and is open from era 1. From era 2, the west footbridge lets you cut from the walk onto
  mid's west edge (−13, 0).
- **East flank: the east river walk.** Station Street leads to the walk at (19, −19), then over the hump at (27, 0) to
  **Bravo's Cable Road** at (17, 21), with the east footbridge from era 2.
- **Cross links.**
  - Lantern Lane, at 27 m from mid.
  - The Haymarket and Engine Street, at 40–48 m from mid.
  - The river walks, which link the two halves round the outside.
- **Era 3 additions.**
  - The River Decks make mid's whole east and west sides walkable.
  - The Sky Garden adds a second storey to the slice.
  - The Skytram Halt adds a lookout over the Cable Road.

**Count per side.** Era 1 has two avenues and one river walk per side. They meet mid at the south-west and south-east
flights, and the walks carry you round the outside to the enemy's avenues and forecourt. Era 2 adds the arcade, the
veranda and two footbridges. Era 3 adds the decks, the garden and the halt. **The gimmick is literally how the flank count goes
up over a match.**

### 2.6 Cover and sightlines

- **The target.** Cover of 0.9 m or more every 6–10 m: at least 90 % of the floor within 5 m of cover
  (`cover-map.js`), and no open circle wider than 6 m in radius except on the plinth top and the zone.
- **One collider, three looks.** Every cover spot is the same collider in every era and only its look changes (§3.2).
- **Per area:**
  - **The bridge deck.** The plinth and its 8 piers. Lamp bases (0.8 × 0.8 × 1.1 m) every 6 m on both balustrades.
    Four flower barrows (1.0 × 1.8 × 1.0 m) at (±9, ±4).
  - **The forecourts.** The veranda's two iron columns, the telephone kiosk (1.2 × 1.2 × 2.4 m) and a horse trough /
    bench / planter (0.8 × 2.4 × 0.9 m).
  - **The avenues.**
    - Each half has one tram stop island with a parked tram, and the other half is the tower's corridor.
    - Kerbside cover every 7–8 m, alternating footpaths: hay cart / coffee cart / planter pod (1.4 × 3.0 × 1.6 m),
      lamp posts and drinking fountains.
    - Iron veranda posts every 3.5 m along the outer footpaths.
    - The Wool Store's and Coffee Palace's external stairs.
  - **Lantern Lane.** Two 2 m strips either side of the tower's line: barrels / café tables / planter benches
    (0.9–1.0 m), the arcade mouth's two clock pillars, and gas lamps.
  - **The Haymarket.**
    - The weighbridge house (2.4 × 2.4 × 2.6 m, `roof`) at (−5, −40).
    - Two hay wagons / food trucks / hydro planters (1.4 × 3.0 × 1.6 m) at (4, −39) and (9, −41).
    - The horse trough at (−1, −41.6).
    - A plane tree (trunk collider 0.7 m) at (12, −38).
  - **Engine Street.** The dais, bollards, the base's planters, and a parked grip car and trailer in the West Yard.
  - **The river walks.**
    - Bollards and mooring posts.
    - A jib crane base (1.5 × 1.5 × 1.2 m).
    - A small boatshed on the outer edge (3 × 5 × 2.8 m, `roof`).
    - Barrels / café screens / planter walls.
- **Sightlines.**
  - The avenues are about 45 m long. The tram islands, the trams, the signal box and the Flatiron's veranda break each
    one so no clear line is longer than about 25 m.
  - The Cable Road and Station Street aim at the dome, so their long views end on the landmark rather than on a spawn.
  - Spawn decks look down Engine Street, never straight up an avenue: the avenues leave at angles.

### 2.7 Spawn and the Long Stages standard

- **Pad.** At (2, 3.8, −61): **61.0 m straight to mid** (the standard is about 60).
- **On foot.**
  - Era 1 is about 71 m, via the Cable Road: 6.0 s swimming at 11.8 m/s.
  - Era 2 and 3 are about 64 m, via the arcade: 5.4 s.
- **Spawn safety.** The spawn is 4.2 m clear round the pad and protected by its 3.8 m height. It has two stairs plus the
  drops. There is room to re-form on Engine Street (64 × 9 m) and in both yards.
- **Measure** with `spawn-mid.js` in each era (the nav changes with the era).

---

## 3. The gimmick: Tartar's time jumps

### 3.1 The rule in one line

Twice a match, Commander Tartar rings. Ten seconds later a wave of clock-light sweeps out from the dome and rewrites the
city:
1. Into **2026**, which **opens** routes that 1888 had closed.
2. Into **3026**, which **adds** areas that never existed.

Nothing is ever taken away. Nothing ever appears on a floor where someone could be standing. Ink survives time travel.

**The design principle that keeps it fair and buildable: the future is already there, boarded up.** Every 2026 and 3026
route already exists as geometry from the first second. A jump only does three things:
- **(a) It removes blockers.** Hoardings and gates come down. These are walls with `roof` tops, so nobody ever stands on
  them.
- **(b) It flips flags.** A scaffold deck or a pitched roof that was `roof` (slide-off, never inked) becomes floor.
- **(c) It adds pieces where no player can be.** This means over water (the footbridges, the River Decks), or in mid-air
  with at least 3.4 m clear below, which is over a jump's reach of 2.86 m from a 0-height floor (the Skytram Halt deck,
  the Sky Garden gallery bridge).

The one exception is the Skytram Halt's stair. It unfolds down onto the 2.4 m signal box and uses the sprout pods' shove
rule. It is the first thing to cut if it causes trouble.

### 3.2 What changes, era by era

**Jump 1: 1888 → 2026. Routes open.**

| Piece | 1888 | 2026 | Play effect |
|---|---|---|---|
| Royal Arcade (both halves) | Timber hoardings 2.8 m tall across both mouths (x −0.5…4.5 at z −31.2 and z −36.8), plastered with "THE ROYAL ARCADE: GRAND OPENING 1889" posters | Open: mosaic floor, glass roof, shopfronts, and the striker clock over the north mouth (two giant fish-folk automata strike the hours) | **The centre lane opens.** Lantern Place connects to the Haymarket. The Bazookarp checkpoint-to-goal route shrinks from 52 m to 23 m. |
| Flatiron veranda (both banks) | Scaffold planks (`roof`). The stair is boarded at its foot. "HOTEL OPENING SOON" | The hotel's iron-lace balcony (floor, inkable). The stair is open. | **High ground at mid appears.** Each team has one, mirrored. |
| Footbridges (two, shared) | Bluestone abutments with "BRIDGE WORKS 1889" boards. A ferry punt is moored in the lagoon (dressing). | Iron footbridges from the deck's edges to the river walks, with rails | **Mid gains two side doors**, and the river walks become direct flanks into mid. |
| Everything else | Gaslight, cable trams, horse carts | Trams, cafés, murals, glass towers behind | Looks only, with the same colliders. |

**Jump 2: 2026 → 3026. Areas that never existed.**

| Piece | 2026 | 3026 | Play effect |
|---|---|---|---|
| River Decks (two, shared) | Open lagoon | Floating pontoon decks (x ±13…±23, z −7…7) at 0, with planters (0.9 m) and solar-sail posts as cover | **Mid widens** from 26 to 46 m across. There are new angles onto the plinth. |
| Sky Garden (both halves) | Pitched roofs (`roof`) on the Wool Store and Coffee Palace. Their roof flights are gated at the 2.4 landings. | Roof gardens at 4.6 (floor, inkable): planters, glass railings (`rail`) and a glass gallery bridge across the arcade. The gates are gone. | **A second storey over the slice.** High ground over the side zone and over Lantern Place. |
| Skytram Halt (both halves; optional) | The signal box (2.4) | A floating halt deck at 3.8 over the Cable Road's west half, with its stair unfolding from the box | A lookout down the Cable Road to mid. Cut it first if era 3 is too tall. |
| The dome | Completed ochre and copper | A lattice of white light over the old drum. The clocks become rings of light. **Tartar is unchanged.** | Looks only. |

**Cover keeps its place and changes its clothes.** Placements carry `types: [1888, 2026, 3026]` and one `col: [w, h, d]`:

| Collider (w × h × d) | 1888 | 2026 | 3026 |
|---|---|---|---|
| 1.4 × 1.6 × 3.0 | hay cart | coffee cart | hydro-planter pod |
| 2.4 × 0.9 × 0.8 | bluestone horse trough | bench and bin | light-planter |
| 2.6 × 3.2 × 10 | cable grip car and trailer | heritage tram | hover tram, parked low |
| 1.2 × 2.4 × 1.2 | cast-iron telephone kiosk | cast-iron telephone kiosk | cast-iron telephone kiosk (never changes: it is Tartar's) |
| 3.0 × 2.6 × 6.0 | cabmen's shelter | tram shelter | info pod |
| 1.0 × 1.0 × 1.8 | flower seller's barrow | flower stall | bloom drone dock |
| 0.9 × 1.0 × 0.9 | barrel stack | café table set | planter bench |

### 3.3 When it happens

| Mode (length) | Ringing starts | Jump 1 → 2026 | Ringing starts | Jump 2 → 3026 |
|---|---|---|---|---|
| Turf War 3:00 | 50 s of play | **60 s (clock 2:00)** | 110 s | **120 s (clock 1:00)** |
| Turf War 1:30 | 20 s | **30 s (1:00)** | 50 s | **60 s (0:30)** |
| Zone Control / Tower Command / Bazookarp 5:00 | 90 s | **100 s (3:20)** | 190 s | **200 s (1:40)** |
| Boss Battle 4:00 | on HULLBREAKER's phase-2 roar (66 % HP) | at the roar | on the phase-3 roar (33 % HP) | at the roar |

- The jumps fall at **thirds of the match on the clock**, the same for both teams. Players learn "the city jumps at 2:00
  and 1:00".
- **Overtime stays in 3026.**
- In Boss Battle, if a phase has not come by 2:40 / 1:20 left, the jump happens on the clock anyway.
- The final third is always the future. That is deliberate: the most routes, and the most bare turf to take, arrive
  when matches are decided, which favours comebacks. That is the Mahi-Mahi lesson from the research.

### 3.4 The announcement: Tartar rings (T−10 s)

Every channel says the same thing:
- **Sound.**
  - From the dome's lantern, Tartar's ring: an old electric double bell ("brrring-brrring") with a wooden resonance,
    synthesised.
  - **Every telephone kiosk on the map rings with him**: one on each forecourt and one in each yard.
  - The ticking of every clock in the city speeds up over the 10 s.
- **Sight.**
  - The candlestick phone's bells blur and its receiver jumps on the hook.
  - The two clock rows over the dome's steps start spinning.
  - Their centre clock shows a 10-second dial with a sweeping red hand.
  - **Pulses of light run out along the overhead wires.** In 1888 these are the cat's cradle of telephone wires on
    poles over every street; in 2026 the tram wires. The pulses run from the dome to every corner of the map, tracing
    where the wave is about to go.
- **HUD.**
  - Top centre: a telephone icon, "TARTAR IS CALLING", a 10…1 countdown, and an era strip reading "1888 ▸ **2026** ▸
    3026".
  - A one-line message: *"COMMANDER TARTAR: Advancing temporal coordinates. Destination: the present."* Jump 2's line is
    *"Further. I must see how it ends."*
  - The minimap shows a ring growing from mid.
- **T−3 s.** The dome's bells strike three, and the sky dims a touch.

### 3.5 The jump: Tartar's wave (the showpiece)

This reuses the clear-ink wave's language (`inkWipeFx.js`: a world-space front in the level shader, a standing curtain,
a fizz that rides the front), retuned for time:
- **The front.**
  - A ring that leaves the plinth's edge at T=0. Its radius is R(t) = 80·(1 − (1 − t/4.5)^1.7): fast at mid, easing
    out. It reaches the spawn decks at about 3.0 s and the far corners by 4.5 s.
  - Because it starts at the centre, **every mirrored pair of pieces changes at the same instant** (they are the same
    distance from the origin).
- **The curtain.** A shimmering curtain 4.6 m tall stands up out of the front. It is not pearly like Practice's wave
  but warm brass at its foot, with Roman-numeral clock faces and gear shadows drifting up through it and a white crest.
  It is the inkWipe curtain shader with a numeral and gear texture and a brass tint.
- **Behind the front, the new city.**
  - The level shader shows the new era's wall and floor looks (per-era colour and pattern, §3.10).
  - Old dressing **dissolves** into brass sparks and floating poster scraps over 0.6 s. New dressing **assembles**:
    fragments fly in and lock, over 0.8 s.
  - Set pieces get their own moments:
    - the hoardings burst into flurries of poster paper;
    - the arcade's striker automata strike twelve;
    - the footbridges' girders slide out from their abutments;
    - the River Decks surface from the lagoon in a spray;
    - the pitched roofs fold back into gardens;
    - the dome's scaffolding falls away (jump 1), then its copper turns to light (jump 2).
- **The backdrop.** When the front leaves the stage edge, the horizon shimmers once and the far city changes: towers
  rise, the sky retints, and the sun is unchanged.
- **Players caught by the front.**
  - A ripple and a brass flash over their screen, a whoosh that drops in pitch, and a tiny camera shake.
  - **No damage, no knockback, no slow.** Specials, bombs and shots in flight are untouched.
- **End of match.** Under the results, a **rewind** wave sweeps inward from the edges back to the dome. The city returns
  to 1888, and Tartar's receiver lifts. *"Data acquired. Returning to origin."* The stage is ready for the next match,
  and the lore closes.

### 3.6 How it stays fair

- **Timing.** Scheduled, symmetric, and announced 10 s ahead on four channels. Nobody is surprised.
- **Players.**
  - Blockers that vanish have `roof` tops, so nobody stands on them. Their collision is off the moment the front
    reaches them.
  - Flipped flags turn slide-off surfaces into floor, so nobody falls.
  - Additions appear only over water or with at least 3.4 m clear below.
  - If a player is mid-air inside a new piece's volume (an Ink Jet or a Zipline over the lagoon), that piece rises over
    0.8 s and **lifts them onto its top**, using the pods' shove/lift rule. A piece never closes on anyone.
  - The halt's stair uses the pods' shove (out to the side, over floor, never into water).
- **Ink.**
  - **Ink on persistent surfaces survives every jump.** Turf War's first two thirds still count.
  - Ink on a vanished blocker is cleared with it.
  - Floors that appear or flip arrive **bare**.
  - Turf is counted over the surfaces that exist at that moment, so the final count is over 3026's city.
  - The extra bare turf is about 110 m² per half in jump 1 (the arcade, veranda and footbridges) and about 260 m² per
    half in jump 2 (the decks, garden and halt): a late swing, the same for both teams.
- **Devices.**
  - Sprinklers, beacons, curtains, buoys and mines on a blocker that vanishes are destroyed with a pop: the same rule as
    the tower crushing them.
  - A device whose spot is swallowed by a new piece (for example a mine on a pitched roof that becomes the garden) is
    also popped.
  - Everything else rides through.
  - A Zipline anchored to a vanishing hoarding releases its rider, who drops.
- **Objectives.** Zones, the tower track and its headroom, and the Bazookarp start, checkpoints and goals sit only on
  persistent floor that **never changes in any era** (§4).

### 3.7 What both teams can do with it

- **Before jump 1:**
  - Stage at the footbridge abutments to be first through the side doors.
  - Pre-position behind the enemy's arcade hoardings to break into their Lantern Place the moment the boards fall.
  - Save specials for the first 10 s of 2026, when the routes are new.
- **Bazookarp:** time a push so the carrier reaches the enemy Lantern Place as the arcade opens. The route to their goal
  shrinks from 52 to 23 m.
- **Before jump 2:**
  - Climb to the Wool Store and Coffee Palace landings (2.4). When the gates go, you are first onto the Sky Garden.
  - Hold the river walks: the River Decks will connect you straight into mid.
- **The losing team** gets the most out of both jumps: new routes break a hold, and the new turf is bare.

### 3.8 Bots

- **Navigation.** The nav graph is built over the union of all eras. Each node and edge carries the eras it is valid in:
  for example the arcade's interior is valid in eras 2 and 3, the Sky Garden in era 3, and edges through hoardings in
  era 1 only. The era layer is applied through the stageKit nav layers (`navClaim` / `navCommit`), the same way movers
  do it. At each flip, bots whose route is affected replan. New routes are then used automatically, because they are
  shorter.
- **Avoiding.** From T−3 s, bots stop choosing a hoarding as cover.
- **Using.** Bot high-ground choices include the veranda and the Sky Garden once they are floor. Bazookarp and Tower
  bots path through the arcade when it is open.
- **Knowing.** Bots read the schedule (a pure function of the clock), so a bot holding Lantern Place at 1:58 knows the
  arcade will open behind it.
- No wall-hacks: bots react to the ringing like players do.

### 3.9 Online

- **Deterministic clock.** The schedule and the front are a pure function of the match's playing time (stageKit
  `StageClock`, the movers' model). Every client computes the same front radius and the same flips with **no new
  records**.
- **Late joiners and host changes** compute the current era from the clock.
- **Boss Battle** is the only exception. Its jumps follow the host's phase change, so the host records
  `['era', k, tPlay]` on its event timeline, and followers replay it.
- **Movement.** Each client lifts or shoves its own squidkids, like pods.
- **Proof:** a two-client test (`netpage.cjs`, after `net-stageclock.cjs`). Both screens flip the same pieces at the same
  clock time (±0.2 s). A joiner at 2:30 sees 2026 at once.

### 3.10 The contract and the engine module

There is one new module, `src/game/eras.js` (`StageEras`), built like `movers.js`: `create(match)`, `update(dt)`,
`state()`, `dispose()`. The layout carries:

```js
LAYOUT.eras = {
  names: ['1888', '2026', '3026'],
  origin: [0, 0],                         // the front starts under Tartar
  front: { reach: 80, dur: 4.5, ease: 1.7 },
  warn: 10,                               // s of ringing before each jump
  when: { turf: [1 / 3, 2 / 3], zones: [100, 200], tower: [100, 200], bazookarp: [100, 200], boss: 'phase' },
  grow: 0.8, fade: 0.6,                   // s: an added piece rises / a removed one dissolves after the front reaches it
  phones: [[x, y, z], ...],               // kiosks that ring (mirrored) + Tartar's lantern
  theme: [{ /* 1888 env overrides */ }, { /* 2026 */ }, { /* 3026 */ }],
};
// on any layout piece or prop collider:
piece.era = [from, to];                   // exists in eras from..to (default [1, 3]); hoardings [1, 1]; decks [3, 3]
piece.eraFlags = [{ roof: true }, {}, {}];   // per-era flags: the veranda; [{roof}, {roof}, {}] the Sky Garden tops
piece.looks = [{ color, pattern }, ...];  // per-era look of a persistent wall / floor
// on prop placements:
placement.types = ['bluestone_haycart', 'bluestone_coffeecart', 'bluestone_pod'];  placement.col = [1.4, 1.6, 3.0];
```

Small tagged hook-ins (`[b5-eras]`):
- **`level.js`.** Era-tagged blocks are built as static blocks: they are in the collision hash and the paint atlas from
  the start, with a `dormant` state. Dormant means not solid, skipped by shots and paint, and not drawn.
- **`levelMaterial.js`.**
  - A per-vertex era range plus a per-vertex era look index, so one merged mesh holds all three eras.
  - A `uEra` / `uEraFront` uniform pair. At a fragment's distance from the origin, the era shown is the new one inside
    the front and the old one outside.
  - The era tint is applied to the city's albedo **before** ink is composited, so ink never desaturates.
- **`paint.js`.** Dormant faces refuse splats. Cells of a piece that goes dormant are cleared, and the turf total is
  recounted.
- **Props.** Each era's dressing goes in its own material buckets, with the same front test in `onBeforeCompile`.
  Colliders are era-tagged.
- **`environment.js`.** Three backdrop groups, and a theme lerp when the front exits the stage.
- **The rest:**
  - the HUD (banner, era strip, minimap ring);
  - audio (ring, ticks, wave, the era ambiences: horses and cable hum, tram bells and cafés, a soft hum and chimes);
  - `match.js` (create and update, like movers);
  - bots (nav layer, cover hint);
  - boss (the phase hook).

### 3.11 Lightmaps, performance, tests

- **Lightmaps.**
  - Bake per era with that era's solid set: `bluestone.e1`, `.e2`, `.e3`.
  - The level shader samples the outgoing and incoming maps and switches at the front.
  - There are no mode variants: nothing is mode-tagged, because the tower track, the zones and the Bazookarp marks fit
    the one layout.
  - If three bakes break the size budget (`size-budget.js`), bake era 2 only, and give era-1 blockers and era-3
    additions vertex AO in their meshes.
- **Performance.**
  - Only one era's prop buckets are drawn, except during a 4.5 s wave.
  - Each era's dressing is budgeted at or under Halyard's (about 334 calls, 3.0 M triangles).
  - Era 2 and era 3 dressing is built in idle frames during the intro, so `loadMs` stays near Halyard's.
- **Tests** (`tools/botlab/tests/eras.js`, plus `?era=1|2|3` to force an era):
  - Per era: collision, climb-audit, `cover-map`, `spawn-mid` and nav reachability of every inkable area.
  - `tower-check` in all three eras: the track must be clean in each.
  - The jump itself: a player standing on every changing spot at T=0; a device on every blocker.
  - Ink: ink kept, turf recount.
  - The two-client test.
  - On the Mac mini, force-era bot matches (a whole match locked in each era) next to normal-schedule matches. They show
    each era's flow on its own.

---

## 4. Every mode on this layout

### Turf War

- **The whole city is turf.** That includes the walls of the plinth, the Haymarket, the islands and the dais, and the
  avenues' building faces up to 2.4 m.
- **Jumps** at thirds of the match (2:00 and 1:00 of a 3:00 match).
- **Ink and turf.** Ink is kept through jumps. Bare new turf arrives in the final third.
- **The match arc.**
  - 1888 is a fight for the bridge and the avenues: one bridge, two lanes and the walks.
  - 2026 is flank war: the arcade, the footbridges and the veranda.
  - 3026 is a war of height and width: the decks and the garden.
  - Each third plays differently on the same streets.

### Zone Control

- **The centre zone** is the **plinth top under the dome**: a circle of r 6.0 (a 16-gon) at y 1.3 (y0 1.0, y1 1.6),
  **113 m²**.
  - Cover: the 8 piers on its rim, and the dome's shade.
  - Ways in: 4 flights and a hop-up from anywhere.
  - High ground over it: both Flatiron verandas (2.4, from era 2), the River Decks (era 3), and the river walks' humps
    (1.3) across the lagoon.
- **The side zone (Alpha's)** is the **raised Haymarket top**: x −9…13, z −37…−42.5 at y 1.3 (y0 1.0, y1 1.6),
  **121 m²**.
  - Its centre (2, −39.8) is 39.8 m from mid and 21.3 m from Alpha's pad: closer to the spawn.
  - Cover: the weighbridge house, two carts, the trough and the plane tree.
  - Ways in: the arcade steps (era 2+), the west and east steps, and the hop-up from Engine Street.
  - High ground: the Wool Store and Coffee Palace landings (2.4, all eras), the Sky Garden (4.6, era 3), and Alpha's
    spawn deck (3.8).
  - Bravo's side zone is the twin.
  - If the lead wants the side zone nearer mid (Calamari's is 22 m out, Treehills' 34 m), the alternative is **Lantern
    Place**: x −4.9…7.5, z −24…−30 (about 70 m², 27 m from mid). It is smaller, and it is the Bazookarp checkpoint.
- **The gimmick in Zone Control.**
  - The jumps fall at 3:20 and 1:40 on the clock. They are never in the final 30 s (centre only), so the last stand is
    always played in 3026.
  - Neither zone's floor ever changes. Jumps only add ways to attack them.

### Tower Command ("the tower takes the tram route round the block")

Straight runs, square corners, one heading. The grid is the plain x/z grid, so the avenues are crossed and driven on the
square, like a tram turning at the corners.

Below is Alpha's half (Bravo's push to Bravo's goal). `LAYOUT.tower` is the mirror, drawn to Alpha's goal on Bravo's
side:

| # | From → to | Run | m | What it rides | Clearance |
|---|---|---|---|---|---|
| 1 | (0, 1.3, 0) → (0, −9.5) | S | 9.5 | Off the plinth through the south arch (piers at 157.5° and 202.5°: a 4.1 m gap, soffit 5.5 m over the plinth). **Drop 1.3** at z −7.5 onto the deck. | The arch soffit is at 6.8 ≥ 1.3 + 3.72 + 0.3. |
| 2 | (0, −9.5) → (12, −9.5) | E | 12.0 | Along the south forecourt | The veranda edge at z −11.5 is 0.75 m south of the platform: beside it, never over it. |
| 3 | (12, −9.5) → (12, −27) | S | 17.5 | Station Street's upper half, across the tram tracks on the square | Open sky. The tram wires at 5.6 m don't collide. |
| 4 | (12, −27) → (−17, −27) | W | 29.0 | Lantern Lane through Lantern Place (**cp 1 at (2, −27)**), then across the Cable Road | 2 m strips of low cover either side. No overhead: the Sky Garden's gallery bridge is over the arcade at z −32…−34, not over the lane. |
| 5 | (−17, −27) → (−17, −44.5) | S | 17.5 | The Cable Road's lower half (**cp 2 at (−17, −38)**) | The tram island is on the upper half. The Skytram Halt is over the upper half. |
| 6 | (−17, −44.5) → (16, −44.5) | E | 33.0 | Engine Street's north edge, 0.75 m off the Haymarket's wall | Open. |
| 7 | (16, −44.5) → (16, −50) | S | 5.5 | Engine Street | Open. |
| 8 | (16, −50) → (2, −50) | W | 14.0 | **Climb 1.3** onto the turntable dais at x 6 → **goal (2, 1.3, −50)**, 11 m short of the pad | Open. |

- **Length.** 138 m, with two checkpoints, so `TOWER.twoCheckpoints` applies: 80 track points, a speed of 1.73 m/s, and
  **100 s** from the centre to the goal with one rider, the same as the stretched two-checkpoint stages.
- **Checkpoint spacing.** The checkpoints sit at 49 m (36 %) and 79 m (57 %).
- **Data:**

  ```js
  path: [[0, 1.3, 0], [0, 9.5], [-12, 9.5], [-12, 27], [17, 27], [17, 44.5], [-16, 44.5], [-16, 50], [-2, 50]]
  checkpoints: [[-2, 27], [17, 38]]
  ```

- **Headroom problems, and how they are solved.**
  - **The dome.** The track leaves under the south arch, so pier placement is fixed at 22.5° + k·45°.
  - **The veranda.** It is set 0.75 m off the platform's south edge.
  - **The era-3 pieces.** The gallery bridge is over the arcade, not Lantern Lane. The Skytram Halt is over the Cable
    Road's upper half; the track uses the lower half. The River Decks are not on the track.
  - **Clutter.** Kerb cover on the track's runs keeps 0.6 m off the 2.5 m platform: Station Street's upper half,
    Lantern Lane's middle, the Cable Road's lower half and Engine Street's north strip. Both trams and both islands sit
    on the avenues' other halves.
  - **The two sides' tracks never meet.** Alpha-side runs are at x 12 and −17; the twins are at −12 and 17.
- **The gimmick in Tower Command.**
  - The track and its 3.72 m headroom are identical in all three eras: `tower-check` runs per era.
  - Jumps fall at 3:20 and 1:40 and only add ways to reach the tower. In 2026 the arcade becomes a path straight into
    checkpoint 1, and the footbridges become side doors to the start.
  - The tower crushes nothing era-related: no device can stand on its track's blockers, because there are none.

### Bazookarp

- **Start.** On the plinth at (0, 1.3, 0), shielded, under the dome. "Tartar's prize, under the clocks." The plinth's
  round edge and four flights make it easy to read who is in the burst's reach.
- **Checkpoint (one per half).** Alpha's is at **Lantern Place (2, 0, −27)**; Bravo's at (−2, 0, 27).
  - It is contested: the slice's crossroads behind the Flatiron, in view of mid along both avenues and under each
    team's veranda.
  - Cover: the arcade's clock pillars, troughs, barrels and lamps; the Flatiron's back wall.
  - Routes from mid: the Cable Road and Station Street (2), plus the Flatiron veranda's stair from era 2 (3). The
    defenders also arrive up the arcade (era 2+).
- **Goal (one per half).** Alpha's pedestal is on the **turntable dais (2, 1.3, −50)**. It is a level below the spawn
  deck (3.8), 11 m in front of the pad and outside the barrier, under the defenders' eyes. Bravo's is at (−2, 1.3, 50).
- **Routes, mid → checkpoint (about 36 m):**
  - the Cable Road → Lantern Lane west;
  - Station Street → Lantern Lane east;
  - (era 3) across the River Decks and the river walk onto the Cable Road.
- **Routes, checkpoint → goal:**
  - era 1: via either avenue and Engine Street, **52 m**;
  - era 2+: through the Royal Arcade (steps to 1.3) → over the Haymarket → hop down → hop up the dais, **23 m**;
  - era 3: also through the Sky Garden (a stair up, the gallery, a stair down), about 35 m.
  - No hidden way into the base: every entry is in view of the spawn deck.
- **Carry times.** The carrier moves at 4.8 m/s on foot and 9.4 m/s swimming:
  - unopposed: era 1, 88 m: 18 s on foot / 9 s swimming; era 2 and 3, 59 m: 12 s / 6 s;
  - contested, expected 25–45 s inside the 60 s timer;
  - so the length is not a one-push win, and it is reachable.
- **Free zones (own side, for the carrier's own team).** These stop a carrier stalling in spots that are hard to reach:
  - the spawn deck, its stairs and both yards (z < −53);
  - the signal box (2.4) and the Skytram Halt (era 3), each with one stair;
  - signposted with an enamel "NO TRAMS BEYOND THIS POINT" Bazookarp-free sign.
  - Everything else high is reachable both ways (stairs on both sides) or is `roof`.
- **The gimmick in Bazookarp.**
  - Jumps fall on the clock at 3:20 and 1:40. The start, checkpoints and goals never move, and stand on floor that
    never changes.
  - The arcade (era 2) is the decisive late route into both bases. The research's "add routes into the centre and the
    bases over time" happens inside one match.
  - The carrier is never touched by the wave. A Bazookarp dropped on a hoarding is impossible: hoardings are `roof`.

### Boss Battle: yes

- **The home ground.**
  - The Clock Bridge deck and both forecourts: about 26 × 30 m.
  - Plus the avenues' first 15 m: about 1,100 m² after the plinth's 177 m².
  - The River Decks add 280 m² in phase 3.
- **The plinth and piers are the stun pillar.** A Hull Charge across the deck ends against the plinth wall: a readable
  "make it charge the dome" tactic.
- The balustrades (solid 1.0 m) keep it out of the lagoon. Mark the footbridges, river walks and Lantern Lane as
  boss-nav excluded (too narrow).
- **The gimmick:** jumps on the boss's phase roars (66 % and 33 % HP), with the clock fallback. Phase 3's frenzy gets
  the widest arena (the River Decks).
- Needs a `boss-check.js` run: home ground of 150 m² or more, and no long stuck.

---

## 5. The look

### 5.1 The hero buildings across three eras

| Building | 1888 (the boom) | 2026 (today) | 3026 (tomorrow) |
|---|---|---|---|
| **Clock Dome** (mid) | Being finished: bluestone plinth and piers done; the drum wrapped in timber scaffolding with ladders; half the copper on a timber dome skeleton; **the clocks already hung** (the city's pride); Tartar already on top, "there first" | Ochre render with cream bands, a copper-green dome, "BLUESTONE STATION" in gold on the frieze, two rows of seven clocks over the steps | A geodesic of white light over the old drum; clocks as rings of light; vertical gardens on the piers; **Tartar unchanged** |
| **Flatiron Hotel** | A corner hotel going up: scaffolded veranda, hoardings, posters | A corner pub hotel with iron-lace veranda, gold signage and a domed turret | The facade preserved under a glass tower stub, the veranda planted |
| **Royal Arcade** | Boarded: "GRAND OPENING 1889" | Mosaic floor, glass vault, chocolatier, toy shop and barber, and the striker clock | A light-wrapped gallery; the Sky Garden's bridge crosses inside it |
| **Wool Store / Coffee Palace** | A bluestone warehouse with hoist beam and loft door / a temperance hotel with a mansard roof | Loft gallery with a squid mural / boutique hotel café | A vertical farm / garden hotel, with roofs as gardens |
| **Engine House** (spawn) | A working cable-tram engine house: arched windows on huge winding wheels, the cable's hum, **chimney smoking** | A heritage tram depot and brewery café, chimney cold, string lights | A power hall: **a beam of light rises from the old chimney** |
| **The avenues** | Two-storey shops under cast-iron verandas, gas lamps, a cat's cradle of telephone wires, cable trams in green and cream | The same facades restored, tram wires, cafés, bike docks, glass towers rising behind | Terraces with greenery, light rails overhead, hover trams gliding at 7 m (visual only) |
| **River walks** | The wharf: bollards, jib crane, barrels, rowing sheds, a moored punt | A promenade: café pontoons, the rowing sheds as cafés | **The floodwall promenade**: glass flood barriers, planter walls, and the river 0.5 m higher, lapping just below the walk. "FLOOD LEVEL 3026 ▲" marks. This is Tartar's clue to how it ends. |
| **Railway yards** (out of play) | Steam engines and goods wagons | Electric suburban trains | Maglev pods |

### 5.2 Materials and palette (team ink stays the loudest colour)

Three surfaces:
1. **`bluestone`.** Basalt setts and flags, blue-grey #57606b with paler joints, the laneways' centre gutter, kerbs. It is
   **the constant**: it is in all three eras, so ink is always read against the same dark mid-grey, where every team
   colour pops. Era tints touch only its joints: straw dust in 1888, painted tram lines in 2026, fine white light-seams
   in 3026.
2. **`render`.** Lime render with ashlar lines, for walls. Per-era looks:
   - 1888: soot-tinged cream #ddd2bb and sandstone #c9b28a;
   - 2026: cream #e8dcc4 and ochre #d9b884;
   - 3026: white #eef0ec with glass-seam inlays.
3. **`boards`.** Hardwood decking for the verandas, footbridges, river-walk boardwalk and decks: raw timber in 1888,
   oiled in 2026, pale composite with light strips in 3026.

**Accents.**
- Brunswick green #3e5a48 iron, muted brick #9b5d4a and copper green.
- The trams' livery is muted green and cream.
- Murals in Lantern Lane are at most 35 % saturated: dusty teal, terracotta and mustard.
- 3026's light is **white and pale cyan only**. There is no saturated neon anywhere that could be mistaken for team ink.
- 1888's sepia mood comes from materials and a warm haze, never from a post-process that would also dull the ink.

### 5.3 Signage and working-life clutter

- **Mid.** "BLUESTONE STATION". The clock rows' destination plates (INKOPOLIS, THE CAPE, KELP HILL, SALTWATER, NORTH
  QUAY, THE PLAINS, RIVERSIDE).
- **Streets.**
  - Enamel street signs: "CABLE RD", "STATION ST", "LANTERN LANE".
  - Tram stop flags.
  - 1888's "NO SPITTING: BY ORDER" and "CABLE TRAMWAY: MIND THE GRIP".
- **Buildings.**
  - "THE ROYAL ARCADE", "HAYMARKET PUBLIC WEIGHBRIDGE", "COFFEE PALACE: TEMPERANCE HOTEL", "WOOL STORE: BALES DAILY".
  - "CABLE TRAMWAY ENGINE HOUSE 1885" on the base.
- **2026:**
  - "FREE TRAM ZONE", café chalkboards, bike-share docks, recycling bins;
  - the Haymarket's big screen on the Wool Store's south face, showing the turf meter;
  - murals of squids and fish-folk down Lantern Lane.
- **3026:** "SKYTRAM LINE 3", flood-level marks, planters with irrigation pipes, drone docks.
- **Everywhere:** "TELEPHONE" enamel plates on the kiosks, unchanged across three eras, which is the visual joke.
- **Clutter by era.** Hay bales, wool bales, barrels and a sandwich-board post (1888); bins, bollards and café chairs
  (2026); planters, light bollards and drone pads (3026).

### 5.4 The far backdrop, every side (one group per era, swapped at the horizon)

- **North (beyond Bravo's base, the view from Alpha's spawn).** The city grid climbing away:
  - 1888: a low skyline of spires, a brick shot tower and a domed exhibition hall on a hill, in coal haze;
  - 2026: glass towers, a gold-crowned tower, the shot tower inside a glass shopping cone;
  - 3026: arcology towers with hanging gardens and sky-tram rings, with the shot tower and the exhibition dome
    **preserved under glass bells**.
- **South (beyond Alpha's base).** The river widening to the bay, with a five-arch stone road bridge just behind the
  West Yard (the "bridge behind your spawn"):
  - 1888: tall ships and wharves;
  - 2026: an arts precinct's white lattice spire, a Ferris wheel and container cranes;
  - 3026: **the great sea wall and tide gates across the bay mouth, the sea visibly high against it**.
- **West and east.** The river reaches out (south-west and north-east), the railway yards (south-east and north-west) and
  the parklands' hill with an observatory. On the horizon, blue ranges in every era: the constant that says it is the
  same place.
- **Sky.** Southern-hemisphere light, with the **sun in the north**:
  - 1888: a warm, slightly hazy sky;
  - 2026: crisp blue;
  - 3026: clean bright blue with a faint cyan, and **a bank of storm cloud on the southern horizon** (the coming end,
    never in play).

### 5.5 Day and dusk

- **Day.** A crisp noon with the sun high in the north. Shadows fall toward Alpha's base: neither team looks into the
  sun along the avenues.
- **Dusk.** The sun sets in the west over the river reach.
  - 1888: gas lamps glowing amber and flickering, the engine-house furnace light, coal smoke turning purple.
  - 2026: neon shop signs (muted), café fairy lights, **tram-wire sparks**, the dome floodlit gold.
  - 3026: the dome's lattice and the light-seams glowing white, floating lanterns over the river decks, the sea wall's
    beacons.
- **Lamps** are listed in `decor.lamps` for each era's dressing.

### 5.6 Intro fly-in and stage-select hero shot

- **Intro** (`intro: { from: [-34, 18, 4], lookFrom: [0, 12, 0], toBack: 3.0 }`). It starts high over the west lagoon with
  Tartar and the dome filling the frame. **Tartar rings once** (a short "brrring": cute, and it teaches the sound). The
  camera dives along the Cable Road past the cable tram, the gas lamps and the Flatiron, over the Haymarket's hay
  wagons, and settles on the Engine House deck with its chimney smoking.
- **Stage-select art** (`art: { from: [-36, 24, -44], look: [4, 3, -6], fov: 56 }`): **the split-time shot**.
  - From high over Alpha's river walk, looking north-east across the lagoon, the Iron Bridge and the Clock Bridge to the
    dome and Tartar, with the Flatiron and the Cable Road in the foreground.
  - **The wave is frozen mid-sweep at r ≈ 28 m.** Inside the brass ring, 2026: the dome complete, trams, murals. Outside
    it, 1888: scaffolding, hoardings, the cable tram and the gas lamps.
  - The dusk art is the same shot at jump 2: 3026 inside the ring and 2026 outside.
  - One picture tells the whole gimmick.

---

## 6. The three biggest risks, and how I'd handle them

1. **Three cities' worth of art, and performance, load time and lightmaps.** Every surface and prop exists in three
   versions, and the backdrop too. There is also a look risk: 1888 alone could read like Tidewater (Victorian) or
   Crossmarket (market town).
   - **Shared masses.** One collision layout for all eras. Facades are a **modular kit** (a shopfront bay, a veranda
     bay, an upper-storey bay, each with three trims), so each era is a material, trim and hero-prop swap.
   - **Shared colliders.** "One collider, three looks" for all cover.
   - **Per-era budget.** Dressing at or under Halyard's. Only one era's buckets are drawn outside the 4.5 s wave. Eras 2
     and 3 are built during the intro. Lightmaps per era, with the single-bake fallback (§3.11).
   - **Identity.** It comes from what no other stage has:
     - bluestone and cast-iron lace;
     - cable trams;
     - the cut-diagonal grid with its flatiron wedges;
     - the domed station on a river bend;
     - and two of the three eras are not Victorian at all.
   - Shoot each era's art early, next to Tidewater and Crossmarket.

2. **Changing geometry must be readable, fair and robust** for players, bots and online.
   - **Readability.** Four warning channels and a front you can watch. The rule that **the future is already there,
     boarded up**: jumps only remove `roof`-topped blockers, flip slide-off surfaces to floor, or add over water or high
     in the air. So nothing can trap or crush anyone, and the engine work is "dormant static blocks plus flags", not
     moving collision.
   - **Bots** get era-gated nav layers on the existing stageKit mechanism.
   - **Online** is a pure function of the match clock, as the movers already are.
   - **Tests and the escape hatch.** Force-era tests, per-era `tower-check`, `climb-audit` and `cover-map`, and a
     standing-on-every-changing-spot test. The one piece that breaks the rule (the Skytram Halt's unfolding stair) is
     marked optional and cut first.

3. **Each era must play well on its own**, and the bow-tie must not pinch mid.
   - **The worries.**
     - 1888 could funnel everyone onto the Clock Bridge: one crossing plus the river walks.
     - 3026 could be over-tall, with the Sky Garden at 4.6 and the halt over the slice and the avenue.
     - The base front (Engine Street, 64 m wide) could feel like an empty bar.
   - **Measure first.** On the Mac mini, run force-era bot matches (Turf, Zones and Bazookarp, each era locked for a full
     match) against normal-schedule matches. Compare kills per area, mid control time, stuck episodes, the Bazookarp's
     best pushes and the cover maps per era.
   - **Levers, in order:**
     - If 1888 stalls, open the footbridges from era 1, and keep the arcade and veranda as the only era-2 openings.
     - If 3026's height dominates, cut the Skytram Halt, then lower the Sky Garden to 3.8 with longer stairs.
     - If Engine Street feels bare, add the cable-tram loop's track island and a second weighbridge-style kiosk row.
       These are in the dressing, not new lanes.
   - **Mid itself stays generous in every era.** The forecourts and deck are about 28 × 30 m round a 15 m plinth with
     four flights. Every era only ever adds ways in.
