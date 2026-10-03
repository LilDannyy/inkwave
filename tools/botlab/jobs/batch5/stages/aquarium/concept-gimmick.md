# `aquarium`: concept (gimmick first): the Tubeway and its tide

Designer's angle: the clear pipes come first. The stage is built round one network of clear tubes and one rhythm, the
**tide**, which reverses the one-way tubes every 40 s and turns every tube toward the centre for the final minute. The
building, the lanes and the mode objectives are placed to serve that rhythm.

The user's words for this stage: "an aquarium. there's a gimmick on this map too, there's clear pipes that can suck you
in one end and pop you out the other, similar to Super Mario 3D World. Some pipes are bi-directional, and some are one
way only." Everything below answers that sentence first.

**Conventions used throughout.** World metres. South = −z = Alpha's end, north = +z = Bravo's end, east = +x, west = −x.
Alpha faces north, so Alpha's left is east. Angles φ = atan2(z, x) in degrees: 0° is east, −90° is south (Alpha's
axis), 90° is north, 180° is west. Every piece listed is Alpha's (the `half` list); Bravo's is its 180° twin
(x, z) → (−x, −z). Pieces marked *single* sit on the centre and are their own twin.

---

## 1. Names and identity

**Name options**
1. **Pipefish Aquarium** (my pick). The pipefish is a real fish, a slim cousin of the seahorse, and the stage is all
   pipes. It reads well in the stage list next to Mahi-Mahi Resort and Museum d'Alfonsino.
2. **Siphon Sound Aquarium**. A squid moves by squirting water through its siphon; the tubes suck you in and squirt you
   out.
3. **Tubeworm Point Aquarium**. Named after the deep-sea tube worm and the rocky point the building stands on.

**Identity.** Pipefish Aquarium stands on Gillshell Point, a granite islet at the mouth of Inkopolis Bay, reached by a
causeway. It is a grand public aquarium from the 1930s in Inkling Art Deco: cream render, sea-green faience, verdigris
copper roofs and brass portholes. Its founder had run the old Central Post Office's pneumatic tube system. When the
post office modernised, she bought the tubes and built them through her aquarium. The result is the **Tubeway**: clear
acrylic tubes with brass collars that suck visitors in at one brass bell and pop them out at another, running straight
through the shark tanks. It is the only way an Inkling can "swim" with sharks, because the water would dissolve them;
the tubes are dry. The pumps that keep the tanks breathing also blow the Tubeway, and they alternate between the
kelp loop and the reef loop. Keepers call this the **tide**. At feeding time every line runs to the Great Tank so
visitors can watch the sharks feed.

**The landmark** is **the Great Tank**: a glass drum of sharks 17 m across and 9 m tall, held 7.6 m up on six bronze
coral columns over the round central courtyard (the Rotunda). Inside it, in the middle of the water, hangs **the
Bubble**: a brass-ribbed glass sphere where four two-way tubes meet. Players riding through the Bubble flash their team
colour across the middle of the map. Under the tank, its glass floor throws moving caustic light onto the fight below.

---

## 2. The plan

### 2.1 Macro shape: a round Rotunda with two back-of-house wings ("Φ")

- **The Rotunda**, a disc 74 m across (sea wall at r 37). From the centre outward it has four rings:
  - the **Tank Floor** dais (r 0–6.5);
  - the **Blue Hall** courtyard floor (r 6.5–19);
  - a ring of four great **tank halls** with four gaps between them (r 19–27);
  - the **outer gallery**, a 10 m promenade round the outside (r 27–37). Its sea wall is broken by two Seal Coves cut
    in and two Seal Stand bastions bulging out.
- **Two wings**, one per team. Each is the aquarium's back of house: a 36 m wide yard that sticks straight out of the
  ring at Alpha's south end (x −18…18, z −33…−72) and at Bravo's north end. Each wing holds the Pump House, the
  quarantine yard and the Life Support building with the spawn deck on top.
- **Footprint** 80 × 148 m (bounds x ±40, z ±74). The silhouette is a circle with a bar through it, like Φ. It is
  unlike the stadium of Craters, the diamond of Treehills, the S of Spirhalite and the bands of the others. It is also
  unlike its batchmates: the skewed X of `bluestone` and the crescent of `caldera`.
- **Lanes bend.** Both flanks curve round the tank halls on the outer gallery, and the centre lane runs straight down
  the axis. Nothing about it is a rectangle.

### 2.2 Figures

The figures are true top views turned on their side: **Alpha's end on the LEFT (−z), Bravo's end on the RIGHT (+z),
east (+x) at the TOP.** The left margin gives x and the bottom ruler gives z.

Legend:
```
.  floor at 0 (terrazzo, deck, yard)     o  Tank Floor dais (1.3)          s  stairs
K  Kelp Forest hall (roof, off-limits)   R  Coral Reef hall (roof)         =  Reef Tunnel (floor 0, acrylic arch)
T  Kelp terrace (2.4)   t  its bleacher steps (0.8 / 1.6)                  B  Reef Gate bastion (2.4)  b  footbridge
c  Great Tank column    *  the Bubble (11.5 m up)                          k  cover (kiosk, bench, console, crate...)
@  Crossing bell (two-way)   X  Express bell (one-way, tidal)   +  tube overhead, drawn in plan
p  touch pool   L  rock ledge (1.3)   S  Seal Stand (1.3 / 2.6 / 3.8)   ~  Seal Cove (sea)   J  jelly column
f  Pipefish Fountain   D  Gauge Deck (1.3)   P  Pump House (roof)   G  Tide Gauge dial   q  quarantine tank / filter
F  Filter Gantry (2.4)   H  Life Support building (roof)   N  spawn deck (3.4)   !  spawn pad
```

**Figure A: the whole stage** (one character = 2 m of z × 4 m of x)
```
  40.0 |
  36.0 |                                 .........
  32.0 |                         ~~~~..................
  28.0 |                        ~~~~kk.............X......
  24.0 |                      .S..~....KK.........RR+.......
  20.0 |                     .SSSS..KKKKKK.......RB@R+=......
  16.0 | ....ss.......PPPPP........KKK++X........++b=++=.........q.sssFFFF..ss....
  12.0 | ....ss.......PPPPP.....X+++++@TTt......++...b+XRR..................ss....
   8.0 | HHHNNNNNss..........ff....KK.T+++.....++...ssRR...k.....q..q...ssNNNNNHHH
   4.0 | HHHNNNNNss.kssDDD........k......c+ookoosc......k........DDDD...ssNNNNNHHH
   0.0 | HHHNN!NNNN...DkDDs...............ooo*ooo...............sDDkD...NNNN!NNHHH
  -4.0 | HHHNNNNNss...DDDD........k......csookoo+c......k........DDDssk.ssNNNNNHHH
  -8.0 | HHHNNNNNss...q..q.....k...RRss...++.....+++T.KK....ff..........ssNNNNNHHH
 -12.0 | ....ss..................RRX+b...++......tTT@+++++X.....PPPPP.......ss....
 -16.0 | ....ss..FFFFsss.q.........=++=b++........X++KKK........PPPPP.......ss....
 -20.0 |                      ......=+R@BR.......KKKKKK..SSSS.
 -24.0 |                       .......+RR.........KK....~..S.
 -28.0 |                         ......X.............kk~~~~
 -32.0 |                            ..................~~~~
 -36.0 |                                 .........
 -40.0 |
   z  |  -70  -60  -50  -40  -30  -20  -10  0    10   20   30   40   50   60   70
```

**Figure B: the Rotunda and the Tubeway** (one character = 1 m of z × 2 m of x). The four `@` bells are joined by `+`
tubes to the Bubble `*` over the centre. The four `X` pairs are the Expresses; each `X` on the outer gallery joins the `X`
on the high ground behind the same tank hall.
```
  38.0 |
  36.0 |                              .................
  34.0 |                 ~~~    ...........LLLLLLL...........
  32.0 |              ~~~~~~~....................................
  30.0 |            ~~~~~~~~~~~.......ppppp.......ppppp.............
  28.0 |           ~~~~~~~~~kkk...........................X+...........
  26.0 |         ....~~~~~~~kkk............................+......J......
  24.0 |        ..S....~~.........KKKK.................RRRR.+..............
  22.0 |      ...SSSSS.........KKKKKKK...kk.......kk...RRRRRR+........J.....
  20.0 |     ...SSSSSSSS....KKKKKKKKKKK...............RRBB@RR++==.............
  18.0 |P.........SSSSS...KKKKKKKKKKKKKK.............RRBB+BB==++===.....J............
  16.0 |P............S...KKKKKKKKKKKTT...............ss++Bb====++==R.................
  14.0 |G..............KK+++++++++TTXTT...kk........ss++...bb===+RRRRR...............
  12.0 |P............X+++KKKKKKK@TTTTTt..............++......bbBBXRRRRR..............
  10.0 |......ffff...KKKKKKKKKTTTTTTttt......ccc....+.........sBBBBRRRRR..k..........
   8.0 |......ffff.......KKKK..TTTt+++............++........ssssRRRR......k..........
   6.0 |..............................+++ss.ooooo++ss.......ss.......................
   4.0 |...............kk............cc.++oookkkoooss.cc............kk...............
   2.0 |ss..............................ooooooooooooo..............................ss
   0.0 |ss..............................oooooo*oooooo..............................ss
  -2.0 |ss..............................ooooooooooooo..............................ss
  -4.0 |...............kk............cc.ssoookkkooo++.cc............kk...............
  -6.0 |.......................ss.......ss++ooooo.ss+++..............................
  -8.0 |..........k......RRRRssss........++............+++tTTT..KKKK.......ffff......
 -10.0 |..........k..RRRRRBBBBs.........+....ccc......tttTTTTTTKKKKKKKKK...ffff......
 -12.0 |..............RRRRRXBBbb......++..............tTTTTT@KKKKKKK+++X............P
 -14.0 |...............RRRRR+===bb...++ss........kk...TTXTT+++++++++KK..............G
 -16.0 |.................R==++====bB++ss...............TTKKKKKKKKKKK...S............P
 -18.0 |............J.....===++==BB+BBRR.............KKKKKKKKKKKKKK...SSSSS.........P
 -20.0 |       .............==++RR@BBRR...............KKKKKKKKKKK....SSSSSSSS...
 -22.0 |         .....J........+RRRRRR...kk.......kk...KKKKKKK.........SSSSS...
 -24.0 |          ..............+.RRRR.................KKKK.........~~....S..
 -26.0 |            ......J......+............................kkk~~~~~~~....
 -28.0 |              ...........+X...........................kkk~~~~~~~~~
 -30.0 |                 .............ppppp.......ppppp.......~~~~~~~~~~~
 -32.0 |                    ....................................~~~~~~~
 -34.0 |                        ...........LLLLLLL...........    ~~~
 -36.0 |                              .................
 -38.0 |
   z  |        -30       -20       -10       0         10        20        30
```

**Figure C: Alpha's wing** (one character = 1 m of z × 2 m of x; Bravo's wing is the twin)
```
  22.0 |                                          ...SSSSS...
  20.0 |                                         ...SSSSSSSS.
  18.0 |  .........................PPPPPPPPPP.........SSSSS..
  16.0 |  ........sss..............PPPPPPPPPP............S...
  14.0 |  ........sss......kkkkkkk.PPPPPPPPPG..............KK
  12.0 |  ........sss..............PPPPPPPPPP............X+++
  10.0 |  HHHHHHHHsssHHHHHsss.....................ffff...KKKK
   8.0 |  HHHHHHNNNNNNNNNNsss.....................ffff.......
   6.0 |  HHHHHHNNNNNNNNNNsss..kkk..DDDDDDDD.................
   4.0 |  HHHHHHNNNNNNNNNNsss..kkksssDDDDDDD...............kk
   2.0 |  HHHHHHNNNNNNNNNNNNN.......DDDDDDDsss...............
   0.0 |  HHHHHHNNNN!NNNNNNNN.......DDkkDDDsss...............
  -2.0 |  HHHHHHNNNNNNNNNNNNN.......DDDDDDDsss...............
  -4.0 |  HHHHHHNNNNNNNNNNsss.......DDDDDDDD...............kk
  -6.0 |  HHHHHHNNNNNNNNNNsss.......DDDDDDDD.................
  -8.0 |  HHHHHHNNNNNNNNNNsss.......qq...qq...........k......
 -10.0 |  HHHHHHHHsssHHHHHsss.........................k..RRRR
 -12.0 |  ........sss.....................................RRR
 -14.0 |  ........sss.......kk.............................RR
 -16.0 |  ........sss.....FFFFFFFFssssss..qq.................
 -18.0 |  ................FFFFFFFFssssss................J....
 -20.0 |                                           ..........
 -22.0 |                                             .....J..
   z  |    -70       -60       -50       -40       -30
```

### 2.3 The main pieces (Alpha's half; Bravo's are the twins)

| piece | centre x / z | size | floor (top) | purpose |
|---|---|---|---|---|
| **Tank Floor** (*single*) | 0 / 0 | disc r 6.5 (16-gon); 4 stairs 3 m wide on the diagonals (radial 6.3 → 9.1); hop-up anywhere else | 1.3 | Mid. Centre zone, tower start, Bazookarp start |
| **Great Tank** (*single*) | 0 / 0 | drum r 8.5, underside 7.6, top 16.5 | off-limits | The landmark. Sharks, rays and a whale shark; caustics on the dais |
| Great Tank columns ×6 (*single*) | r 9.8 at φ 0, 60, 120, 180, 240, 300 | Ø 1.4, to 7.6 | — | Cover round the dais, 9.8 m apart |
| **The Bubble** (*single*) | 0 / 0, y 11.5 | glass sphere Ø 4 | off-limits | The hub where the four Crossing tubes meet (the gimmick's heart) |
| Dais consoles ×2 (*single*) | ±4.2 / 0 | 0.8 × 2.4, 1.1 tall | — | Cover inside the centre zone, off the tower's line |
| **Blue Hall** floor (*single*) | ring r 6.5–19 | ~1000 m² with the dais | 0 | Mid's open floor |
| Coral benches ×3 | 5.0 / −15.0; 14.5 / −3.5; −15.0 / −2.5 | 1.4 × 1.4, 1.2 with coral | — | Cover in the hall's gap mouths |
| **Kelp Forest hall** | ring r 19–27, φ −70…−20 | 8.0 tall | roof | Alpha's left lane divider. Its huge windows look into swaying kelp; the Kelp Express runs through it |
| **Kelp terrace** | r 14.5–19, φ −62…−28 (centre 11.8 / −11.8) | ~10.5 × 4.5 m (47 m²) + two bleacher steps (r 12.3–14.5) | 2.4 (steps 0.8, 1.6) | Alpha's left high ground over mid. Holds a Crossing bell and the Kelp Express's top bell |
| **Coral Reef hall** | ring r 19–27, φ −160…−110 | 6.5 tall | roof | Alpha's right lane divider |
| **Reef Tunnel** | radial axis φ −135, from r 27 to 18.5 | 6 m wide; acrylic arch 3.4 clear in the tank, 2.0 clear under the footbridge | 0 | "The tunnel you fight through": the right flank's short lane into the hall |
| **Reef Gate** | on the φ −135 axis: two bastions (radial 18.5–22.5 × across 3–7.5) and a footbridge (radial 18.5–20, 6 m) | each bastion 4.0 × 4.5 m; two stairs 3 m wide (radial 18.5 → 13.1, 24°) | 2.4 | Alpha's right high ground over mid; the tunnel comes out under its bridge. Holds a Crossing bell (west bastion) and the Reef Express's top bell (south bastion) |
| Alpha gap | ring r 19–27, φ −110…−70 | 13 → 18.5 m wide | 0 | The centre lane into the hall; two fish-ID kiosks at ±4.5 / −22.5 (1.4 × 1.4 × 2.0) |
| East gap (equator, shared) | ring r 19–27, φ −20…20 | 13 → 18.5 m wide | 0 | Left flank's way into the hall. Kiosk 22.5 / −4.5; its twin kiosk at 22.5 / 4.5 comes from the west gap's −22.5 / −4.5 |
| **Alpha Court** | x −12…12, z −37…−26 | ~24 × 11 m | 0 | Where the wing meets the ring. The side zone. Pipefish Fountain at 9.0 / −30.5 (Ø 4: basin 0.9 + glass rail 0.4, bronze pipefish 4 m); lecterns ±3.0 / −28.0 (1.2 × 1.6 × 1.1); bench planter −9.5 / −28.0 (3 × 1 × 1.0) |
| Staff Gate arch | z −36.5, x −6…6 | posts 0.6 × 0.6 at x ±6; lintel 3.2–5.0 up | — | Breaks the spawn → mid sightline; a "TUBEWAY · STAFF ONLY" sign |
| **Kelp Walk** (outer gallery) | ring r 27–37, φ −70…−20 | 10 m wide teak boardwalk | 0 | Alpha's left flank. Kelp Express outer bell at 12.4 / −25.4 |
| **Seal Cove** | sea inlet r ≥ 32, φ −44…−28 | ~6 × 9 m of sea | sea | Breaks the outline; a seal rock out of reach; railed sides, 6 m open haul-out edge |
| **Seal Stand** | 20.0 / −26.5, its front facing (0.83, 0.56) toward the cove | 8 × 5 m, three tiers each 1.67 m deep; 2.5 m stair on its south-west side; sea wall bulges to r 39 behind it | 1.3 / 2.6 / 3.8 | Left flank's high ground (the 3.8 tier), overlooking the Kelp Walk, the East Court and the Alpha Court |
| Feed kiosk | 26.7 / −16.7 | 3 × 3, 2.8 tall | roof | Cover where the Kelp Walk meets the East Court |
| **East Touch Pool Court** (equator, shared) | ring r 27–37, φ −20…20 | touch pools at 30.5 / ±6.0 (2.2 × 4.0; basin 0.9 + glass rail 0.4); rock ledge 34.0 / 0 (3 × 7) | 0 (ledge 1.3) | The meeting point of both teams' left flanks. The West Court is its twin |
| **Reef Walk** (outer gallery) | ring r 27–37, φ −160…−110 | 10 m wide | 0 | Alpha's right flank. Tunnel's outer portal at −19.1 / −19.1; Reef Express outer bell at −28.5 / −12.1 |
| **Jelly Garden** | jelly columns at −17.5 / −26.0, −22.0 / −24.0, −26.5 / −20.0, −29.0 / −15.5, −21.0 / −30.0 | Ø 1.5, 3.4 tall; open lattice shade at 6.5 over it (off-limits, see-through) | 0 | Right flank's pillar forest: close-quarters cover. The jellies glow at dusk |
| **Gauge Deck** (the strategic point) | x −6…6, z −46…−39 | 12 × 7 m; north stair x −2…2 (z −39 → −36.7); south stair x 2.5…4.5 (z −46 → −48.3); hop-up elsewhere; pressure manifold at 0 / −43.5 (2.4 × 1.6 × 2.2); control desk at 3.5 / −44.5 | 1.3 | The Pump House's front platform. Bazookarp checkpoint; tower checkpoint 3 (on Bravo's) |
| **Pump House** | x 11…18, z −47…−38 | 7.5 tall, iron vent stacks to 12 | roof | The Tubeway's blower house. The **Tide Gauge** (brass dial Ø 4.0) on its north face at 14.5 / −37.9, centre 5.5 up |
| Pump House lane | x 6…11, z −47…−37 | 5 m wide | 0 | Left way into the base (and the tower's last run) |
| Filter Yard | x −18…−6, z −47…−37 | quarantine tanks at −8.5 / −40.5 and −15.5 / −39.5 (Ø 3.0, 2.6 tall); sand filter −8.5 / −45.5 (Ø 2.2, 2.0) | 0 | Right way into the base |
| Filter Gantry | x −18…−15.5, z −56…−48 | stair x −18…−15.5, z −48 → −43 | 2.4 | Defenders' perch over the apron and yard |
| Apron | x −18…18, z −53.6…−46 (alleys x ±11…18 back to z −66) | fish-food truck 14.5 / −52 (2.6 × 6 × 2.8); forklift 5.0 / −50.0 (2 × 3 × 2.2); crates −13.5 / −53.5 (1.6³) | 0 | Re-forming ground. Bazookarp goal pedestal at 0 / −51 |
| **Life Support building + spawn deck** | x −11…11, z −72…−56; deck x −9…9, z −66…−56 | pad at 0 / −62; front landing x −2.5…2.5, z −56…−53.6; horseshoe flights x ±(2.5…10.5) at z −56…−53.6 (run 8, 23°); side stairs x ±(9…17), z −64…−61.6 | 3.4 (building roof 7.5) | Spawn with four exits and 4 m clear round the pad |

### 2.4 Lanes and flanks (Alpha's side; Bravo's is the twin)

1. **Centre.** Spawn → apron → over the Gauge Deck (or past it) → under the Staff Gate arch → Alpha Court → Alpha
   gap → the hall's south side → the Tank Floor. Straight, open, watched by the Gauge Deck and the Reef Gate.
2. **Left ground (Kelp).** Pump House lane → round the Pump House → the Kelp Walk past the Express bell, the Seal Stand
   and the cove → East Touch Pool Court → east gap → meets mid at the **east** (x ≈ 14).
3. **Left lift (Kelp Express, tidal).** From the Kelp Walk bell up through the kelp tank onto the **Kelp terrace**:
   meets mid on the south-east high ground. Runs this way only while the Kelp tide is in (section 3).
4. **Right tunnel (Reef).** Filter Yard → Jelly Garden → the Reef Tunnel through the reef tank → comes out under the
   Reef Gate's footbridge: meets mid at the **south-west**, at floor level.
5. **Right ground (Reef).** Filter Yard → Reef Walk → West Touch Pool Court → west gap → meets mid at the **west**
   (x ≈ −14).
6. **Right lift (Reef Express, tidal).** From the Reef Walk bell over the tunnel inside the reef tank onto the **Reef
   Gate**. Runs this way only while the Reef tide is in.
7. **Across mid (the Crossing, two-way, always on).** Between the four mid high grounds through the Bubble.

That gives three to four real flank routes a side, meeting mid at four different points (east, south-east high,
south-west low, west). No tube touches a wing, a spawn, a zone or a checkpoint.

### 2.5 Heights and what a 1.8 m climb means

| height | where |
|---|---|
| 0 | the Blue Hall, the gaps, the courts, the outer gallery, the tunnel, the wing's yards and apron |
| 0.8 / 1.6 | the Kelp terrace's bleacher steps (each a hop) |
| 1.2–1.3 | the Tank Floor, the Gauge Deck, the Seal Stand's first tier, the rock ledges, touch pools (1.3 with the glass rail, cover only) |
| 2.4 (2.6) | the Kelp terraces, the Reef Gates, the Filter Gantry (and the Seal Stand's second tier at 2.6) |
| 3.4 | the spawn decks |
| 3.8 | the Seal Stand's top tier: the flank's highest standable point |
| 5–12 | tubes overhead (off-limits, slide-off) |
| 7.6 | the Great Tank's glass underside (off-limits) |

A kid climbs about 1.8 m. So every 1.3 m edge (the dais, the Gauge Deck, the rock ledges, the Seal Stand tiers) is a
hop-up from anywhere. The Kelp terrace (2.4) is reached by hopping its two 0.8 m bleacher steps, by swimming up its inked
faces, or by tube. The Reef Gate (2.4) is reached by its two stairs, by swimming up its inked front, or by tube. Nothing
reaches the Seal Stand's 3.8 tier in one hop: you climb its tiers or its side stair. Tank halls are glass above a
1.2 m tiled plinth. The plinth takes ink; the glass does not, so nobody climbs a tank. Every roof, bell top, tube and
the Great Tank are `roof` (slide off).

### 2.6 Cover spacing

The target is the standing rule: cover every 6–10 m, with at least 90 % of floor within 5 m of cover measured by
`tools/botlab/tests/cover-map.js`. The dais and the side zone are the only open circles wider than 6 m.
- **Hall.** The six columns sit 9.8 m apart round the dais. The two consoles are on the dais; the coral benches are in
  the gap mouths; two kiosks stand in each gap. The bleacher fronts and the Reef Gate stairs are low walls. The bells on
  the high ground are cover too: 1.8 m across, 2.2 tall, solid.
- **Outer gallery.**
  - Lamp-post planters (1.0 m tall bases) every 8 m, staggered along the inner and outer edges.
  - Benches with backs (1.0 m) between them.
  - The Seal Stand, the feed kiosk, the touch pools, the rock ledges, the jelly columns, the fountain and both Express
    outer bells.
- **Wing.** The Gauge Deck and its manifold, the Pump House, the tanks, the truck, the forklift, the crates, the gantry
  and the horseshoe stairs.

### 2.7 Spawn to mid (the Long Stages standard)

The pad is at (0, 3.4, −62): 62 m from the centre in a straight line. The nav path goes down a horseshoe flight, across
the apron, over or past the Gauge Deck, through the court and the gap to the dais. That is about 66–70 m, or 5.6–5.9 s
of swimming, against a target of about 6 s. Measure it with `tools/botlab/tests/spawn-mid.js`. The whole wing is one
block of numbers, so if the reading is short, move the wing out 1–2 m. **No tube shortens it:** no tube starts or ends in
a wing. The spawn deck has four exits (two front flights, two side stairs) and a 10 m deep apron to re-form on.

---

## 3. The gimmick: the Tubeway

### 3.1 The network

There are two kinds of tube. Each kind always looks the same.

- **The Crossing: two-way, always on.** Four tubes, one from each mid high ground (Alpha's Kelp terrace and Reef Gate,
  Bravo's Kelp terrace and Reef Gate). Each rises over the hall into the side of the Great Tank and meets the others in
  **the Bubble** at (0, 11.5, 0). A rider entering any of the four chooses at the Bubble which of the other three to
  come out of. Straight across is the default, or they can veer left or right. The Crossing is self-symmetric.
- **The Expresses: one-way, tidal.** One per tank hall, so four: Alpha's Kelp Express and Reef Express, and Bravo's two
  twins. Each joins a bell on the outer gallery behind its hall to a bell on the high ground in front of it, through the
  tank's water. At any moment it runs **IN** (outer gallery → high ground) or **OUT** (high ground → outer gallery), or
  it is **sealed**. The tide decides which (3.4).

| tube | kind | bells (Alpha's; x, y, z) and facing | centre-line length | ride (18 m/s) | door to door* | walking it instead |
|---|---|---|---|---|---|---|
| Crossing, Kelp branch | two-way | Kelp terrace (11.44, 2.4, −13.64), faces the centre ↔ the Bubble | 18 m | 1.0 s | — | — |
| Crossing, Reef branch | two-way | Reef Gate west bastion (−19.27, 2.4, −11.84), faces in along the gate ↔ the Bubble | 23 m | 1.3 s | — | — |
| (any branch → any other, via the Bubble) | two-way | e.g. Alpha's Kelp terrace → Bravo's Kelp terrace | 36–45 m | 2.0–2.5 s | 2.8–3.3 s | across the hall: ~38 m, 6.3 s on foot, ~3.2 s swimming |
| **Kelp Express** | one-way, Kelp tide | outer: Kelp Walk (12.4, 0, −25.4), faces the Alpha Court · top: Kelp terrace (14.76, 2.4, −9.95), faces the centre | 21 m (rises to 6.0 inside the kelp tank) | 1.2 s | 2.0 s | ~24 m + two hops: ~4.5 s on foot |
| **Reef Express** | one-way, Reef tide | outer: Reef Walk (−28.5, 0, −12.1), faces the Jelly Garden · top: Reef Gate south bastion (−11.84, 2.4, −19.27), faces in | 22.5 m (5.5 up, passing over the tunnel inside the reef tank) | 1.25 s | 2.05 s | through the tunnel and up the stair: ~31 m, ~5.2 s on foot |

\*Door to door = 0.25 s suck-in + the ride + 0.55 s pop-out flight.

The Express saves about 55–60 % of walking time and 20–30 % of swimming in your own ink. It lands you on high ground
with no climb. The Crossing is about as fast as swimming across the hall. You take it because you are untouchable over
the deadliest ground in the stage and you come out on the other team's high ground, not because it is quicker.

**Data, as the builder would write it** (`LAYOUT.tubes`, read by the new engine module, 3.11):
```js
tubes: {
  mirror: true,                               // every bell and tube gets its 180° twin; the hub is single
  speed: 18,                                  // m/s along any tube (Feeding Time: the Crossing × 1.5)
  enter: 0.25,                                // s: the suck-in
  pop: { fwd: 4.0, up: 6.5, invuln: 0.3, splash: 1.4 },   // launch out of a bell (lands ~3 m out after 0.52 s),
                                              // invulnerable until 0.3 s after landing, ink radius at the landing
  cooldown: 1.0,                              // s after landing before that player can enter any bell
  gap: 0.35,                                  // s between two riders entering the same bell (a third bounces off)
  tide: { half: 40, slack: 3, warn: 5, feed: 60 },        // s; feed = the last N s of regulation
  modes: { turf: 'clock+feed', zones: 'clock+feed', tower: 'clock', bazookarp: 'follow', boss: 'clock+phase3' },
  hub: { id: 'bubble', pos: [0, 11.5, 0], r: 2.0, choose: 0.6 },   // choose: the branch window before the Bubble (s)
  bells: [                                    // Alpha's; face = the way the bell's mouth opens (plan unit vector)
    { id: 'kelp-top',  pos: [11.44, 2.4, -13.64], face: [-0.64, 0.77] },
    { id: 'reef-top',  pos: [-19.27, 2.4, -11.84], face: [0.71, 0.71] },
    { id: 'kelpx-out', pos: [12.4, 0, -25.4],      face: [-0.94, -0.35] },
    { id: 'kelpx-top', pos: [14.76, 2.4, -9.95],   face: [-0.83, 0.56] },
    { id: 'reefx-out', pos: [-28.5, 0, -12.1],     face: [0.48, -0.88] },
    { id: 'reefx-top', pos: [-11.84, 2.4, -19.27], face: [0.71, 0.71] },
  ],
  list: [                                     // centre lines (corners get 1.5 m bends in the mesh; the ride follows them)
    { id: 'cross-kelp', kind: 'shuttle', a: 'kelp-top', b: 'hub',
      path: [[11.44, 4.6, -13.64], [11.44, 6.2, -13.64], [5.46, 9.0, -6.51], [1.29, 11.5, -1.53]] },
    { id: 'cross-reef', kind: 'shuttle', a: 'reef-top', b: 'hub',
      path: [[-19.27, 4.6, -11.84], [-19.27, 6.2, -11.84], [-7.24, 9.0, -4.45], [-1.70, 11.5, -1.05]] },
    { id: 'kelp-x', kind: 'express', tide: 'kelp', out: 'kelpx-out', top: 'kelpx-top',
      path: [[12.4, 2.2, -25.4], [12.4, 6.0, -25.4], [14.76, 6.0, -9.95], [14.76, 4.6, -9.95]] },
    { id: 'reef-x', kind: 'express', tide: 'reef', out: 'reefx-out', top: 'reefx-top',
      path: [[-28.5, 2.2, -12.1], [-28.5, 5.5, -12.1], [-11.84, 5.5, -19.27], [-11.84, 4.6, -19.27]] },
  ],
},
```

### 3.2 Riding rules

- **Who rides.** Anyone, either team, in kid or squid form, by moving into an open bell's mouth. The trigger is a disc
  1.0 m in front of the lip, 0–1.5 m high, and the player's movement must point into the mouth (within 60°, faster than
  2 m/s). Standing next to a bell or backing past it while shooting does nothing. No button: Mario's pipes take you
  when you walk in, and so do these.
- **Who cannot ride.**
  - The Bazookarp carrier. The bell flashes red and the HUD reads "The Bazookarp is too big for the Tubeway." The
    research says carriers must not get hidden shortcuts; this rule makes sure.
  - Anyone in a moving special: Zipline, Ink Jet, Crab, Reefslider and the like.
  - Anyone in a super jump, riding the tower's platform, or within the 1.0 s re-entry cooldown.
- **Thrown and rolling bombs ride too: "bomb mail".** Any bomb whose body enters an open mouth (thrown, lobbed, or
  rolled like the batch's new floor-rolling bomb) is carried at the same speed with its fuse **paused**. It is dropped
  from the far bell with a small forward pop, and its fuse resumes. Only one bomb rides a tube at a time; others bounce
  off the bell. Placed devices, shots, special projectiles and the Bazookarp's shots do not enter. This is a skill shot,
  and its far bell flashes a bomb icon as it comes (3.3). If it misbehaves in testing it is the first rule to cut;
  nothing else depends on it.
- **The ride.**
  - The suck-in takes 0.25 s: the kid stretches into the horn with a rising *fwoomp* and a puff of bubbles.
  - The rider then travels as a team-coloured squid at **18 m/s** (1.5 × swim speed), along the tube's curve.
  - You cannot shoot, throw, use a special or change course, except at the Bubble.
- **Invulnerable inside.** The tube is armoured acrylic, so riders cannot be hurt from the suck-in until 0.3 s after
  they land. Shots that hit a tube splat harmlessly on it and leave no ink. A rider is never in a tube longer than 2.5 s
  (3.3 s door to door), the same order as a super jump's flight, which is also untouchable.
- **The Bubble (Crossing only).** From 0.6 s before the rider reaches the Bubble, their HUD shows three arrows: the
  three other branches. Holding the stick or keys toward one picks it. If nothing is held, the rider goes straight
  across to the opposite high ground. There is no U-turn. This is Mario 3D World's junction steering, and it is also the
  anti-camping rule: nobody knows the exit until the last 0.6 s.
- **The pop-out.**
  - The rider is launched out of the far bell: 4 m/s forward, 6.5 m/s up. They land about 3 m in front after 0.52 s,
    with normal air control, so they can steer the landing about ±1.5 m.
  - They land in kid form, inside a **1.4 m splash of their own ink**, the same as a super jump landing. The splash
    counts as their turf and gives them swim ink to escape.
  - If the landing spot is occupied or blocked, they land at the nearest free floor within 2 m. This uses
    `stageKit.floorFor` and never puts them into a wall or the sea. Every exit is drawn with at least 4 × 4 m of clear
    floor in front of it.
- **Spam limits.**
  - 1.0 s before the same player can enter any bell after landing.
  - A bell admits a rider every 0.35 s; a third arrival bounces off.
  - Riding in circles buys nothing: each loop is 3 s untouchable and 1 s exposed at a known exit, and you are not
    painting, holding a zone or riding the tower.

### 3.3 What everyone sees and hears

**One-way and two-way look different from every distance:**

| | **Crossing (two-way)** | **Express (one-way)** |
|---|---|---|
| tube | clear, **aqua-tinted** brass collars every 2.5 m | clear, **amber** collars; a strip of chevron lights along the tube's underside |
| inside | still | a constant **stream of bubbles flowing the way it runs** (the strongest single read) |
| bells | both ends identical: brass gramophone horns 1.8 m across, 2.2 tall, irises open, **aqua** light ring, a "⇄" enamel plate | the **IN** end: iris open, white-aqua ring, a lit floor arrow pointing into it · the **OUT** end: **iris shut** (walk into it and you bump), amber ring, "EXIT · STAND CLEAR" plate |
| sealed (slack water) | never | both irises shut, amber rings blinking, bubbles stopped |

**A rider:**
- Everyone with a line of sight sees the rider's squid shoot along the tube in their team colour, with a glowing wake
  in the tube that fades over 1.0 s. Clear tubes do not block sight, for players or for bots.
- The **destination bell's ring flashes in the rider's team colour** from the moment the destination is fixed until the
  pop. For an Express that is the moment of entry; for the Crossing it is the moment the rider passes the Bubble,
  0.6–1.3 s before the pop. Everyone can see the flash. It is the fair warning for both sides: campers know someone is
  coming, and the rider knows the campers know.
- The Bubble flashes the rider's colour as they pass through it, so the whole hall sees who is crossing.
- A bomb on its way shows a bomb icon on the destination ring.
- **Rider's camera:** a chase camera 3 m behind, a slight fisheye, the world visible through the acrylic. For the last
  0.5 s it swings to look where the rider will pop out.

**Sound** (synthesised, no audio files):
- the suck-in: a filtered noise sweep rising;
- the ride: a whoosh with Doppler for anyone nearby;
- the pop: a bright pluck plus a splash;
- the Bubble: a glassy ping in the rider's team's pitch.

**The tide's cues:**
- **The Tide Ring.** A band of light round the Great Tank's rim, split into four quarters, one per Express. IN shows
  white-aqua chevrons running toward the tank; OUT shows amber chevrons running away; sealed shows amber blinking. A thin
  countdown arc fills over each 40 s. It is visible from everywhere in the Rotunda.
- **The Tide Gauge.** A 4 m brass dial on each Pump House, facing mid. Its needle swings between KELP and REEF through a
  red SLACK sector, and a gold FEEDING sector waits at the end of the dial. The spawn view looks straight at it.
- **HUD.**
  - A small tide pill under the match timer: two tube glyphs, the one running IN lit, plus a thin countdown bar.
  - Lines at the moments that matter:
    - 5 s before a turn: "TIDE TURNING: Reef tubes to the Great Tank in 5".
    - At the turn: "REEF TIDE: Reef tubes in, Kelp tubes out".
    - 5 s before the final minute: "FEEDING TIME in 5".
    - At the final minute: "FEEDING TIME! Every tube runs to the Great Tank".
  - Bumping a shut bell: "EXIT ONLY: turns in 12 s".
- **Minimap and TAB map.**
  - Tubes drawn as thin pale lines; Expresses carry moving arrows the way they run, and sealed ones are dashed.
  - Allies' riders are drawn as dots moving along the line.
  - A destination flash shows as a ping in the rider's colour, under the same visibility rule as the super-jump landing
    marker (the `jumpui` package decides it; the Tubeway follows it).
- **Sound for the tide:**
  - the warning: a two-tone pneumatic hoot and the bubbling slowing;
  - the turn: a valve clunk and a rising rush;
  - Feeding Time: a marimba arpeggio and a gong-like bubble burst in the Great Tank.

### 3.4 The tide: the rules and the timeline

**Rules.** The tide is a pure function of the stage clock t (seconds of play) and the mode.
- The tide alternates every **40 s**: **Kelp tide** (both Kelp Expresses IN, both Reef Expresses OUT), then **Reef
  tide** (Reef IN, Kelp OUT), and so on, starting with Kelp tide at GO.
- **Warning** 5 s before each turn.
- **Slack water**: the last 3 s before each turn, when every Express that is about to reverse is sealed. The longest
  Express ride is 1.25 s, so every tube is empty when it turns.
- **Feeding Time**: the last 60 s of regulation, and all of overtime, in the modes that use it. Every Express runs
  IN and the Crossing runs at 1.5 × (27 m/s). Expresses that were OUT seal for the 3 s before it, like any turn.
- **The Crossing never closes.**

**Turf War, 180 s** (90 s matches: Kelp tide 0–27, slack for the Reef Expresses 27–30, Feeding Time 30–90):

| t (s) | clock | state | Kelp Expresses | Reef Expresses | Crossing |
|---|---|---|---|---|---|
| 0–32 | 3:00–2:28 | **Kelp tide** | IN | OUT | 18 m/s |
| 32–37 | 2:28–2:23 | warning | IN | OUT | |
| 37–40 | 2:23–2:20 | slack water | sealed | sealed | |
| 40–72 | 2:20–1:48 | **Reef tide** | OUT | IN | |
| 72–77 / 77–80 | 1:48–1:40 | warning / slack | → sealed | → sealed | |
| 80–112 | 1:40–1:08 | **Kelp tide** | IN | OUT | |
| 112–117 | 1:08–1:03 | "FEEDING TIME in 5" | IN | OUT | |
| 117–120 | 1:03–1:00 | slack (Reef only) | IN | sealed | |
| 120–180 | 1:00–0:00 | **FEEDING TIME** | IN | IN | 27 m/s |

**Five-minute modes, 300 s.** Turns come at 40, 80, 120, 160 and 200 s: Kelp, Reef, Kelp, Reef, Kelp, Reef. After that
the modes differ (section 4):
- Zone Control: Feeding Time from 240 s and through overtime.
- Tower Command: the tide carries on (Kelp 240–277, Reef 280–317, and on into overtime).
- Bazookarp: the tide follows the Bazookarp, not the clock.
- Boss Battle: the clock, with Feeding Time at the boss's phase 3.

### 3.5 The set-pieces of a match (Turf War)

1. **The opening (0:00, Kelp tide).** Both teams leave spawn on foot; no tube shortens the run to mid.
   - The centre walks through the court and the gap.
   - The left flank (Kelp) reaches its Express bell about 4 s after GO and is lifted onto its own Kelp terrace by about
     6 s, at the same moment the centre arrives at the dais.
   - The right flank (Reef) has the tunnel; its Express runs OUT, carrying players off the Reef Gate to the right flank.
   - Expected first contact: the dais and the Kelp terraces at about 6 s.
2. **The first turn (2:20 on the clock).** The Kelp terraces' Expresses now run OUT and become **dives**: whoever holds
   a Kelp terrace (often the other team's, after a good opening) can drop to that terrace's outer bell on the Kelp Walk.
   That bell is 7 m from that team's side zone and about 39 m from its spawn pad. Meanwhile the Reef flanks get their lift
   onto the Reef Gates. The map's pressure swings from left to right.
3. **Slack water (2:23–2:20, 1:43–1:40 and 1:03–1:00).** For 3 s every Express is shut. The flanks are cut off from
   the high ground, and it is the moment to storm a terrace.
4. **The second Kelp tide (1:40).** The left lifts are back and the right flanks are dives.
5. **Feeding Time (1:00).**
   - The keeper's brass feeding drone sinks into the Great Tank, a cloud of food fans out and the sharks wheel.
   - The Bubble glows gold and the hall's lights warm.
   - All four Expresses lift IN and the Crossing runs fast.
   - For the last minute every flank feeds the Rotunda's four high grounds, and the match ends in a brawl round and
     over the Great Tank. A team pushed back to its flanks has two fast ways back to mid's high ground. A team holding
     mid has no dive routes, so it must walk out to paint.

### 3.6 What both teams can do with it

- **The lift.** On your IN flank, take your own high ground over mid in 2 s with no climb.
- **The dive.** On an OUT flank, from a high ground you hold (usually the enemy's), drop into the enemy's flank walk
  behind their lines, next to their side zone. The exit flashes, so a defender who is watching can meet you.
- **The cross.** From your high ground through the Bubble onto either of theirs, never touching the dais. It is good
  for breaking a team that holds both its high grounds.
- **The late veer.** Enemies watch you enter the Crossing. You choose your branch in the last 0.6 s.
- **Bomb mail.** Roll or lob a bomb into an IN bell or a Crossing bell; it pops out on the high ground at the far end.
- **The rotate.** On your own half, an OUT Express takes you from your high ground back to your flank in 2 s, to
  defend your side zone or your base.
- **Holding a bell.** The exits on the high ground are where the fights are. Players who learn the tide hold the
  ground in front of the bell that is about to become an exit.

### 3.7 Fairness

- **Mirrored at every instant.** A tube and its twin are always in the same state, and the Crossing is its own twin.
  Each team always has the same routes as the other, turned round.
- **Announced.** The same 40 s rhythm all match, a 5 s warning before every change, and the same cues in the world (Tide
  Ring, Tide Gauge, bubbles, irises), on the HUD and on the minimap.
- **Nobody trapped.**
  - Tubes never close on a rider: slack water (3 s) outlasts the longest Express ride (1.25 s).
  - Exits never face water or an edge. Landings go to the nearest free floor.
  - **Nothing appears or disappears:** the tubes, bells and Bubble are always there. Only irises and lights change, and
    they are inside the bells, so no geometry can ever appear inside a player.
- **Exit camping** is limited, and stays a two-sided fight, because:
  - the exit is public;
  - the Crossing's exit is chosen late;
  - the pop-out is an arc the rider can steer;
  - the rider is invulnerable until 0.3 s after landing and lands in their own splash of ink;
  - every exit has cover within 3 m (the bleacher steps, the Reef Gate's railings, the benches, the Seal Stand, the jelly
    columns).
- **No shortcuts into bases.** No tube reaches a wing; the exit nearest to any spawn pad (an Express's outer bell) is 39 m from it. The carrier
  cannot ride. No tube ends in a zone or on a checkpoint.

### 3.8 Ink and turf

- Tubes, bells and the Bubble are never inked. Shots splat on them harmlessly, like glass.
- The round plinth each bell stands on (Ø 2.4, 0.15 high) is inkable floor. The bell's own 1.8 m footprint is not floor
  and is not counted as turf.
- The pop-out splash (r 1.4) is the rider's ink and counts as their turf.
- Tank glass takes no ink; the 1.2 m tiled plinth under every tank window does. The tunnel's floor does; its acrylic
  arch does not.
- Turf counting is otherwise unchanged. The tide covers, removes and reveals no floor.

### 3.9 Online

- **The tide** is computed on every screen from the stage clock, the host's clock that every follower already runs in
  step with (`stageKit.StageClock`), plus the mode's own synced state (the Bazookarp holder). It adds no network
  records. A late joiner, or a screen after a host change, simply reads the clock.
- **A ride** is decided by the rider's owner, the same way their movement is. Two records: `['tube', actor, bell, t0]`
  at entry and `['tubeBranch', actor, branch]` when a Crossing branch is chosen. Every screen plays the ride as a
  deterministic function of (tube, t0, branch), with no position stream. The exit flash comes from the same records.
  Normal movement records resume at the pop.
- **Damage.** Invulnerability is judged where the victim is authoritative (the rider's own client), as for the super
  jump.
- **Bombs:** the thrower's client records `['tubeBomb', bomb, bell, t0]`.
- **Proof:** a two-client test, `tools/botlab/tests/net-tubes.cjs` in the style of `net-surf.cjs`. Both screens must
  agree on the tide state at 0 / 37 / 40 / 120 s, a ride and its exit, a Crossing branch choice, a bomb in a tube, and a
  late joiner in the middle of a ride.

### 3.10 Bots

- **Nav.** Each IN bell gets a `tube` edge from the node in front of its mouth to the node at its exit's landing spot.
  The Crossing has 12 edges (4 bells × 3 destinations). The cost is (0.25 + length / speed + 0.55) s, times 11.8 to
  convert to metres, times 1.2 so that bots don't overuse tubes. The module switches edges on and off with the tide
  (sealed or OUT means off, for that direction) and re-plans routes through a closed edge. This is the movers' nav-layer
  pattern in `stageKit.js`.
- **Use.** A bot whose route has a tube edge walks into the bell. At the Bubble it takes the branch its route says.
  Bots use IN Expresses to reach high ground. They use OUT Expresses when their goal (enemy turf, a zone, a foe) lies
  past the exit.
- **React** (no wall-hacks). A bot that can see a bell flashing in the enemy's colour aims at its landing spot for up to
  1.5 s or until the rider lands. Bots don't stand on landing spots.
- **Never ride:** carriers, tower riders, bots mid-special.
- **Bomb mail:** a stretch goal for bots. A bot with a bomb and a foe near a far bell posts it.
- **Test** `tools/botlab/tests/tubes.js`:
  - rides, branch choices and tide states;
  - bots taking tubes;
  - match stats: tube rides per bot-minute, the share of arrivals at mid's high ground by tube, splats within 4 m of
    exits compared with elsewhere, stuck %.

### 3.11 Engine: one module and small hook-ins

- **New module** `src/game/tubes.js` (`StageTubes`). It is created in match setup from `LAYOUT.tubes`, like movers and
  pods, and updated from `Match.update`. It owns:
  - the tide state;
  - the bells' triggers, irises and lights;
  - riders' tube state;
  - bombs in tubes;
  - nav edges;
  - the look (bubble streams, wakes, the Tide Ring);
  - the HUD and minimap feeds;
  - events: `tubes:warn`, `tubes:tide`, `tubes:feed`, `tubes:ride`, `tubes:branch`, `tubes:pop`.
- **It reuses** `StageClock`, `floorFor` / `shoveActor` (for landings) and `buildLook` from `stageKit.js`, and the
  super jump's state-machine shape from `actor.js`.
- **Hook-ins, tagged `[b5-aquarium]`:**

| file | hook-in |
|---|---|
| `actor.js` | a `tubeState`, checked at the top of update like `superJumpState` (no weapon, invulnerable) |
| `cameraRig.js` | the tube chase camera |
| `nav.js` | `tube` edges with an on/off flag that A* honours |
| `bots.js` | following tube edges, the branch choice, exit reactions |
| `subs.js` | bombs entering bells |
| `hud.js` | the tide pill and lines; the branch arrows |
| `minimap.js` | tubes, riders, exit pings |
| `netmatch.js` | the records |

- **The stage's own props** (`src/world/stages/aquarium/props.js`):
  - `aquarium_tube`: a path in, merged acrylic tube and collars and pylons out, one transparent material for all
    tubes;
  - `aquarium_bell`, with an iris the module animates;
  - `aquarium_bubble`;
  - `aquarium_greattank`;
  - the tank halls' windows.

---

## 4. Every mode on this layout

### Figure D: the modes

Tower track `%` (both sides drawn), its checkpoints `1 2 3`, the goals `Y`. Centre zone `Z`, side zones `z`. Bazookarp
checkpoint `C` and goal `Q` (the tubes are left out of this figure).
```
  40.0 |
  36.0 |                                 .........
  32.0 |                         ~~~~..................
  28.0 |                        ~~~~kk....................
  24.0 |                      .S..~....KK.........RR........
  20.0 |                     .SSSS..KKKKKK.......RBRR==......
  16.0 | ....ss.......PPPPP........KKKKKT........ssb====.........q.sssFFFF..ss....
  12.0 | ....ss.......PPPPP......KKKKKTTTt...........bBRRR..%%%%%%2%%%%.....ss....
   8.0 | HHHNNNNNssY%%%%%....ff....KK.Ttt....Z......ssRR...k%....q..q.%.ssNNNNNHHH
   4.0 | HHHNNNNNss.kssD%D..zzzzz.k......cZZZZZZZc......k.zzzzz..D3%%%%.ssNNNNNHHH
   0.0 | HHHNN!NNNN.Q.DkCDs.zzzzz%1%%%%%%%ZZZZZZZ%%%%%%%1%zzzzz.sDCkD.Q.NNNN!NNHHH
  -4.0 | HHHNNNNNss.%%%%3D..zzzzz.k......cZZZZZZZc......k.zzzzz..D%Dssk.ssNNNNNHHH
  -8.0 | HHHNNNNNss.%.q..q....%k...RRss......Z....ttT.KK....ff....%%%%%YssNNNNNHHH
 -12.0 | ....ss.....%%%%2%%%%%%..RRRBb...........tTTTKKKKK......PPPPP.......ss....
 -16.0 | ....ss..FFFFsss.q.........====bss........TKKKKK........PPPPP.......ss....
 -20.0 |                      ......==RRBR.......KKKKKK..SSSS.
 -24.0 |                       ........RR.........KK....~..S.
 -28.0 |                         ....................kk~~~~
 -32.0 |                            ..................~~~~
 -36.0 |                                 .........
 -40.0 |
   z  |  -70  -60  -50  -40  -30  -20  -10  0    10   20   30   40   50   60   70
```

### 4.1 Turf War
The base game, with the full tide and Feeding Time (3.4, 3.5). Paintable floor is about 5,000 m², a little under
Craters (5,818 cells) and Calamari (6,071). It is all walkable, including the wings' yards, the tunnel and every perch.

### 4.2 Zone Control
- **Centre: the Tank Floor.** One zone: the disc r 6.0 (16-gon) at y 1.0–1.6, about **113 m²**, under the Great Tank.
  - Cover inside: the two consoles.
  - Ways in: hop-ups all round, four diagonal stairs, and arrivals from all four gaps.
  - Attackable from high ground: both Kelp terraces and both Reef Gates (2.4) at 8–12 m.
  - The tubes end on that high ground, never inside the zone.
- **Side: the Alpha Court** (Bravo's is the twin). x −5.5…5.5, z −34…−26, y −0.2…0.4: about **88 m²**, 30 m from
  mid, on Alpha's half, as the user wants side zones near mid.
  - Cover: the two lecterns inside; the fountain and the bench planter at its edges.
  - Four ways in: the Alpha gap, the Kelp Walk, the Reef Walk / Jelly Garden, and the wing.
  - Overlooked by the Gauge Deck (1.3, 5 m south) and the Seal Stand's 3.8 tier (15 m east).
- **How the tide treats it.** The clock tide runs all match.
  - When a side zone is live, the OUT Expresses on that half deliver mid-holders 7–15 m from it. Attacking a side zone
    is easier on a dive tide, and the HUD's countdown tells both teams when that is.
  - Feeding Time (the last 60 s) lifts everyone back to the Rotunda, in step with the existing rule that the last 30 s
    and overtime are played on the centre only.

### 4.3 Tower Command
**"The tower takes the visitors' route."** It leaves the Rotunda through the north gap, crosses the court, goes up
through the quarantine yard, round onto the Gauge Deck under the Tide Gauge, and down the Pump House lane.

The track is drawn on Bravo's half (Alpha's goal), centre → goal, with straight runs and square corners:

| # | from → to (x, y, z) | length | note |
|---|---|---|---|
| 1 | (0, 1.3, 0) → (0, 1.3, 7.75) | 7.75 | across the Tank Floor (clear of the consoles at x ±4.2) |
| 2 | **drop** to (0, 0, 7.75) | 1.3 | off the dais's north edge |
| 3 | → (0, 0, 31.0) | 23.25 | through the north gap (kiosks at x ±4.5 clear) into the Bravo Court; **checkpoint 1 at (0, 0, 22.0)**, between the two tank halls |
| 4 | → (12.0, 0, 31.0) | 12.0 | east across the court (lecterns at z 28, the fountain on the west side: clear) |
| 5 | → (12.0, 0, 50.0) | 19.0 | north up the Filter Yard between the quarantine tanks; **checkpoint 2 at (12.0, 0, 41.5)** |
| 6 | → (3.0, 0, 50.0) | 9.0 | west along the apron |
| 7 | → (3.0, 0, 47.25) | 2.75 | to the Gauge Deck's south wall |
| 8 | **climb** to (3.0, 1.3, 47.25) | 1.3 | onto the Gauge Deck |
| 9 | → (3.0, 1.3, 41.0) | 6.25 | back toward mid across the deck, past the manifold (0.55 m clear); **checkpoint 3 at the corner (3.0, 1.3, 41.0)**, under the Tide Gauge's gaze |
| 10 | → (−7.25, 1.3, 41.0) | 10.25 | west over the deck's edge |
| 11 | **drop** to (−7.25, 0, 41.0) | 1.3 | into the Pump House lane |
| 12 | → (−8.5, 0, 41.0) | 1.25 | centre the platform in the lane |
| 13 | → (−8.5, 0, 51.5) | 10.5 | north up the lane; **goal at (−8.5, 0, 51.5)**, 13.5 m from Bravo's pad, outside the spawn barrier, a level below the deck and in view of it |

**Total 105.9 m**, with three checkpoints at 23.3 / 54.8 / 82.6 m (22 / 52 / 78 %). On the standard three-checkpoint
rules that is 60 s of track at about 1.77 m/s and 13.3 s per checkpoint: 100 s centre to goal. If the lead prefers the
two-checkpoint standard (a track twice as long), the loop to add is round the court's fountain and back through the
west gap's mouth. I'd keep three.

**Headroom.**
- The Great Tank's underside is 7.6 m above floor, which is 6.3 m over the dais (needs 3.72).
- Nothing else hangs over the track. The Staff Gate arch is at z ±36.5 on the axis, and the track has left the axis by
  z 31. The Tide Gauge is on the Pump House face, beside the lane, not over it. No tube crosses the track in plan, apart
  from the Crossing inside the tank, 9–11.5 m up.
- **Keep clear in both frames:** a 3.5 m corridor along every segment (platform 2.5 m plus 0.5 m each side). The crates,
  forklift and truck positions above were chosen against both the track and its twin.

**The tide in Tower Command.** The clock tide runs all match; there is no Feeding Time. The fight follows the tower
along the axis and into the wings, and pulling everyone back to the Rotunda for the last minute would work against the
mode. The tubes give the defenders' high grounds fast rotations, but no tube reaches the track beyond checkpoint 1.

### 4.4 Bazookarp
(The user's Rainmaker. The spec is still being written, so these follow the user's rules and the research.) Listed for
Alpha's half, which Bravo attacks; Alpha's are the twins.
- **Start.** The Tank Floor centre, (0, 1.3, 0), on a pedestal under the Great Tank. The shield pops in the middle of
  the stage's main arena.
- **Checkpoint.** The Gauge Deck, **(0, 1.3, −41.0)**, in front of the manifold, which is its cover.
  - It is the slice's strategic point: raised, with four ways onto it (the north stair, the south stair, hop-ups from
    the Filter Yard and from the Pump House lane).
  - The Tide Gauge stands over it, and it sees the court and the gap.
- **Goal.** The apron, **(0, 0, −51.0)**: in front of the spawn deck's front landing, a level below the deck (3.4), and
  2.6 m from its edge, so defenders look straight down on it.
  - Reached from the deck's south stair, from the Filter Yard, and from the Pump House lane.
- **Routes from mid to the checkpoint** (estimates; measure with a `routes.js` like Craters'):

| route | length | via |
|---|---|---|
| centre | ≈ 41 m | gap, court, under the arch, north stair |
| Reef tunnel | ≈ 53 m | through the tunnel, the Jelly Garden, hop up from the Filter Yard |
| right ground | ≈ 61 m | west gap, West Court, Reef Walk, Filter Yard |
| left ground | ≈ 66 m | east gap, East Court, Kelp Walk past the Seal Stand, Pump House lane |

  From the checkpoint to the goal is 11–14 m by any of three ways.
- **Carry time.** At 80 % speed the carrier walks 4.8 m/s. The centre route unopposed is about 51 m, or 10.6 s. A real
  push with fights should take 25–45 s, inside the 60 s timer even by the 66 m flank.
- **Free zones.** None are needed. Every perch can be climbed by the enemy: the Seal Stand by its tiers and stair, the
  terraces, the gates and the gantry by stairs. Every top that cannot be reached is `roof`. The spawn deck is behind its
  barrier.
- **How the tide treats it ("follow").**
  - While the Bazookarp is free (shielded at the centre, or dropped), the clock tide runs.
  - While a team **carries** it:
    - **the carrier's half's Expresses run IN**, so its respawning players get back to mid's high ground fast (they
      reverse after a 1.5 s seal if they were OUT);
    - **the defenders' half's Expresses seal**, so the escorts have no dive route into the defending flanks, which is
      the research's "no shortcuts into a base".
  - The HUD says "The Tubeway seals ahead of the Bazookarp."
  - Feeding Time in this mode is spectacle only (the drone, the gold Bubble, the Crossing at 1.5 ×), not all-IN.
- **The tubes and the carrier's shots.** The carrier cannot ride. Their lobbed shots can hit tubes, which block shots.
  Over the hall, the Crossing's four tubes (5–11 m up) sometimes catch a lob. Arcing over the X at the right angle is
  part of carrying through mid. If testing says that is a nuisance, Crossing tubes can be made shot-transparent
  to the Bazookarp's shots only.

### 4.5 Boss Battle: yes, to be confirmed by the boss check
- **HULLBREAKER's ground** is the Blue Hall: a 38 m round arena. The boss (about 9 m long, 5–6 m tall) walks over the
  1.3 m Tank Floor and under the 7.6 m Great Tank. Its ground also takes in the four gaps and the four courts: about
  1,700 m², against the check's 150 m².
- Its Hull Charge stuns against the tank halls, the bleachers and the Reef Gates, so there are walls everywhere to bait
  it into.
- **The tubes are the squad's escape hatches**: dodge a charge by taking the Crossing out of the hall. The boss cannot
  enter them.
- The tide runs on the clock. Feeding Time (all Expresses IN, the Crossing fast) starts when the boss enters
  **phase 3**, its "shell cracks" phase, so the squad gets maximum mobility for the finish.
- **Risk.** If BossNav cannot step onto the dais, give it a boss-only ramp skirt round the dais (`onlyIn: 'boss'`). If
  the 5.8 m ring between the dais and the terraces traps it, set `noBoss`. Copy Craters' `boss-check.js` and run it.

---

## 5. The look

### 5.1 Architecture

- **The Rotunda** is 1930s Inkling Art Deco by the sea.
  - The tank halls: cream render with stepped parapets, sea-green faience bands, bronze reliefs of pipefish and
    seahorses, copper fish-scale roofs gone verdigris, and tall round-arched acrylic windows.
  - The Kelp halls are 8 m tall, with golden-green light, kelp and leopard sharks. The Reef halls are 6.5 m, with
    coral, clownfish and a turtle.
- **The Great Tank** is the modern centrepiece.
  - A steel ring beam on six bronze columns shaped as twisted coral.
  - Inside: a whale shark, rays, a ring of sardines and a sunken bronze statue.
  - Its glass floor glows and throws caustics onto the Tank Floor.
  - The Tide Ring of lights runs round its rim.
- **The Tubeway** is Victorian pneumatic post.
  - Clear acrylic tubes, 1.5 m across, with brass collars every 2.5 m.
  - Slim riveted pylons painted sea-green.
  - Gramophone-horn bells on round plinths, and enamel signs: "TUBEWAY", "KEEP ARMS & TENTACLES INSIDE", "⇄".
- **The outer gallery** is a seaside promenade.
  - Teak boardwalk, granite sea wall with bollards and life-ring stands.
  - Lamp posts with fish-shaped finials, benches, coin telescopes, the Seal Cove with its rock.
  - The Seal Stand's painted bleachers ("SEAL SHOW 11:00 · 14:00"), the touch pools ("TWO FINGERS, PLEASE"), the
    Jelly Garden's glowing columns under a white lattice.
- **The wings** are back of house.
  - The Pump House is the one dark building on the stage: dark red brick, iron vent stacks, the brass Tide Gauge.
  - Corrugated sheds, painted concrete with safety-yellow lines, drain grates, red valve wheels, blue pipes along
    walls, hose reels, the fish-food truck ("FRESH KRILL DAILY"), stacked crates, a forklift.
  - The quarantine tanks have stencilled numbers. Signs read "STAFF ONLY · QUARANTINE · KEEP OUT".
  - The spawn sits on the Life Support building's roof deck, behind a rail with the team's emblem.

### 5.2 Materials and palette
Team ink must stay the loudest colour on screen. No large surface is saturated; the brightest saturated things are small
(fish, ring lights, signs).

| material | colour | where |
|---|---|---|
| terrazzo | warm pale grey #d4cdbf with shell flecks and thin brass wave inlays | the hall, gaps, courts |
| teak boardwalk | weathered silver-brown #93806c | the outer gallery, bleachers, Seal Stand |
| service epoxy | grey-green #9fa59d with muted safety-yellow lines #c9a94e | the wings |
| cream render | #e8e0cf | tank halls |
| faience | sea-green #86a89b | tank halls |
| verdigris | #6e978a | roofs |
| bronze / brass | #8a6a45 / #b0904f | reliefs, bells, collars |
| brick | muted #8a4e3e | the Pump House only |
| tank water | dark, desaturated teal #24484f | all tanks: a deep, quiet backdrop; caustic highlights near-white, never blue |
| jelly glow | pale cyan-white #cfe9ea, low saturation | the Jelly Garden |
| Tide Ring | aqua and amber at low brightness by day | the Great Tank's rim |

**Surfaces** (the stage's three texlib slots):
1. `terrazzo`: pale with shell flecks and brass lines.
2. `deck`: weathered teak planks.
3. `service`: epoxy with drain lines.

### 5.3 The world round it (`env`)
`bay: false`, `edge: 'none'` (we dress our own granite sea wall), `boats: false` (our own ferry), gulls on, `stars: true`
at dusk. The sea is clear turquoise over the rocks round the islet and deep blue beyond.

- **East:** open sea and the **Deep Dome**, a glass observatory dome on stilts 250 m out. It is joined to the islet by a
  long Tubeway tube on pylons, along which a coloured streak zips every few seconds (backdrop `animate`). This is the
  far promise of the gimmick. Sailboats and a whale's spout far off.
- **West:** the **Dolphin Lagoon** (a sea pen ringed by a boardwalk, dolphins breaching on a loop), then a rocky
  headland with sea caves and wind-bent pines.
- **South (behind Alpha's wing):** the aquarium's service harbour: a breakwater with a red-and-white lighthouse, a
  supply boat at the quay, and the seawater intake pipes running down into the sea.
- **North (behind Bravo's wing):** the visitors' causeway to the mainland. The grand entrance pavilion with
  "PIPEFISH AQUARIUM" in Deco letters and a giant bronze pipefish weathervane; the ferry pier with the little ferry *MV
  Seahorse*; the seafront town; Inkopolis's towers far off across the bay.
- The backdrop is not mirrored, so each team looks out on something different, and both look across the Great Tank to
  the other's wing.

### 5.4 Day and dusk
- **Day: "Opening Hours".** High summer sun from the south-west (sunAz ~210, el ~55), clean light, cool shadows, haze
  over the sea. The tanks glow softly from within, caustics dance on the dais, and the Tubeway's acrylic glints.
- **Dusk: "Late Night at the Aquarium".** A low sun behind the west headland and a violet-coral sky.
  - The tanks are lit from inside in teal, and the Great Tank's under-lights throw moving caustics.
  - The Tubeway's collars carry small warm bulbs and the bells' rings glow.
  - String lights hang along the outer gallery, the portholes are lit, and the jelly columns glow pale.
  - The lighthouse beam sweeps; the Deep Dome glows on the horizon; stars come out.

### 5.5 The intro fly-in
1. Start low over the eastern sea above the Deep Dome's tube.
2. Fly along the tube toward the islet as a streak races past the camera.
3. Rise over a Kelp hall's copper roof.
4. Glide between two Crossing tubes beside the Great Tank, with sharks wheeling and the Bubble glinting.
5. Swing out over the team's wing and settle behind the spawn.

In the format: `intro: { from: [44, 20, 6], lookFrom: [0, 10, 0], toBack: 3.0 }`.

### 5.6 The stage-select hero shot
`art: { from: [34, 26, -46], look: [-2, 5, 8], fov: 55 }`: from high over Alpha's Seal Cove, looking across the
Rotunda. In frame:
- the Seal Stand and the Kelp Express arcing out of the kelp hall in the foreground;
- the Great Tank on its six columns with the Bubble and the X of four tubes in the middle;
- the Reef Gate and Bravo's Kelp terrace beyond;
- Bravo's wing with its Pump House and Tide Gauge, and the causeway and the town on the horizon.

At dusk, the same shot with every tank lit.

**Stage-select blurb:** "Ride the Tubeway through the shark tanks of Pipefish Aquarium, but watch the tide: the amber
tubes turn every 40 seconds."

---

## 6. The three biggest risks

1. **The tubes could make the walking routes pointless and turn mid into a teleporter party.**
   - Built-in limits:
     - No tube touches a wing, a spawn, a zone or a checkpoint.
     - Every tube saves at most about 60 % of the walk. The Crossing saves nothing over swimming; it only makes you
       safe.
     - Riders can't shoot, and their exits are public.
     - There are cooldowns and capacity limits.
   - Measure it on the Mac mini with bots and with humans: the share of arrivals at mid's high ground that come by tube
     (target 15–35 %), tube rides per player-minute, and splats within 4 m of exits against elsewhere.
   - Knobs, in this order:
     1. ride speed, 18 → 14 m/s;
     2. door-to-door time (a longer suck-in);
     3. invulnerability after landing, 0.3 → 0;
     4. cooldown, 1 → 2 s.
   - The last resort is to freeze the tide (static one-way Expresses). The Crossing, the landmark, stays whatever
     happens.
2. **The tide and the one-way / two-way rules could be unreadable.** A new player bumps a shut bell, is popped out
   somewhere they didn't expect, or never notices the 40 s rhythm.
   - The answer is redundancy. Every state is shown five ways at once: irises, the bubble flow, the collar colours, the
     Tide Ring and Gauge, and the HUD pill with the minimap arrows. Every change has a 5 s warning and a sound.
   - The rhythm never varies, and a shut bell tells you when it turns.
   - Add a one-line tip on the loading screen and an icon in the stage select ("⇄ aqua: both ways · ▶ amber: follows
     the tide").
   - Playtest with the user early on a block-out. Ask "what just happened?" after the first turn, and watch whether
     players walk into OUT bells.
   - Fallback: lengthen the half-period to 60 s and the warning to 8 s.
3. **Exit camping and the invulnerable rider (fairness, and online).**
   - Mitigations:
     - the Crossing's late branch choice;
     - the steerable pop-out arc;
     - 0.3 s of protection after landing and a splash of the rider's own ink;
     - cover within 3 m of every exit;
     - an exit flash that both sides see.
   - Online, the rider is authoritative for their own invulnerability, and remote screens draw rides from the entry
     record, so there is no rubber-banding and no hits that land on one screen and not another.
   - Prove it with the two-client test (3.9) and with bot matches: splats within 4 m of exits should be no more than
     about 2× the stage's average splat density.
   - If camping still wins, give the pop-out a choice of two landing pads per bell, picked by the rider's held
     direction.

Smaller risks, watched but not top three:
- **New engine surface.** A movement state, nav edges, bots and net records. Build `tubes.js` on the super jump's
  pattern, write the page test first, keep each hook-in to a few tagged lines.
- **Transparent tubes and tanks costing frame time.** One merged transparent material for all tubes. Tank windows are
  opaque panels with a cheap parallax-fish shader rather than real transparency; only the Great Tank's underside and the
  Bubble are truly transparent.
- **The ring's long flanks.** 61–66 m against 41 m down the centre: the same ratio as Craters and Calamari. The Express
  lifts give the flanks their purpose.
- **Chargers on the spawn deck seeing mid.** The Staff Gate lintel blocks that sightline.

---

## 7. Numbers to verify when it is built

- `check-maps` ok; the climb audit clean; the cover map ≥ 90 % within 5 m.
- `spawn-mid.js`: 5.8–6.3 s average.
- `tower-check`: 105.9 m, 0 holes, clearance clean but the two drops and one climb, both rides end in a knockout.
- The boss check: home ground ≥ 150 m², never idle more than 8 s.
- `tubes.js` and `net-tubes.cjs` pass, three times each on the Mac mini.
- Bot matches (turf, zones, tower), five each on the Mac mini: stuck ≤ 1 %, no episode over 10 s; tube share of
  arrivals at mid's high ground 15–35 %; exit splat density ≤ 2× the average.
- Performance at load within Halyard's numbers.
