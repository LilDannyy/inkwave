# Gulper Aquarium (`aquarium`): the design

The lead designer's document for the batch-5 aquarium stage, **revision 2** (after the advocate's and the build / modes
engineer's reviews; the "Review log" at the end lists every issue and what changed). The builder builds from this file
and from `ENGINE.md` next to it (the pipe engine's final contract for exactly this design). The user's words: *"an
aquarium. there's a gimmick on this map too, there's clear pipes that can suck you in one end and pop you out the other,
similar to Super Mario 3D World. Some pipes are bi-directional, and some are one way only."*

Read first: `../STAGE-RULES.md`, `tools/botlab/jobs/new-stages/BRIEF.md` (with its addendum),
`tools/botlab/jobs/stretch/BRIEF.md`, `../../bazookarp/SPEC.md` §4 and §9, and `ENGINE.md`.

Conventions. World metres and seconds. Alpha spawns at −z ("the South"), Bravo at +z ("the North"); every `half` piece
and placement is turned 180° about Y for Bravo, (x, z) → (−x, −z). Alpha faces +z, so **Alpha's left is +x (east)**.
Bearings α are measured in plan from +x toward +z (south is −90°). In the ASCII plans +x is to the right and +z runs
down the page; 1 character = 1 m across, 1 row = 2 m down.

**The blade frame.** Alpha's spawn wing is a blade swept 30° off the z-axis. Pieces aligned to it are given in local
coordinates (s, w): s runs along the blade, u = (0.5, −0.866), from H0 = (0, −32.5) (the Shark Arch's wing mouth); w runs
across it, l = (0.866, 0.5), + = Alpha's left. **World (x, z) = (0.5 s + 0.866 w, −32.5 − 0.866 s + 0.5 w).** A
blade-aligned box is an `obox` with `rotY: −30` (level.js: its local x is l, its local z is −u) and `size: [across, h,
along]`. Every other piece is axis-aligned and given in world coordinates.

Every number below was measured on a 0.5 m raster of this plan (a paper model, not a built stage): areas, the cover map,
nav-style route lengths (jumps ≤ 1.25 m, drops ≤ 3.4 m, as `nav.js` builds them; "kid" lengths also allow 1.8 m hops),
the tower track, the pipe lengths and every pipe-rule distance. The ASCII plans are printed by the same script from the
piece tables, so the drawing and the tables agree; Bravo's half is printed as the exact turn of Alpha's. The builder
re-measures each number with the real tools and keeps the targets in §6.

---

## 0. The judging, and what was taken from whom

| (1–10) | concept-play: Siphon Sound | concept-place: Gulper Aquarium | concept-gimmick: Pipefish |
|---|---|---|---|
| **Place** (identity, landmark, would the user love it) | 7: a strong liner-deco aquarium; the Halo (a ring of sea water floating 7 m up) is striking but reads as fantasy more than as an aquarium | **9**: a real aquarium at a glance: the shark tank you fight on top of, Bathysphere No. 1 over it, kelp drums, a shark tunnel, penguins, ferry piers, "ALL WATER IS BEHIND GLASS" | 7: good Deco rotunda, Seal Stand and the Deep Dome backdrop; the Bubble is the same idea as play's Exchange |
| **Play** (mid, lanes, flanks, heights, cover, spawn depth) | **8**: the best lane and sightline writing (95 % cover, three lanes round each tank); but the two centre zones under two balconies invite a "one each" stalemate, and each half's flanks are different shapes | 7: a clean flank pair (low covered arcade on your left, high open promenade on your right) round a spacious court; but the side zone sits 39 m from mid, and the wing pipe lands inside 22 m of the pad | 5: 80 m wide, a 38 m courtyard that risks a bowl, flanks 61–66 m long against a 41 m centre |
| **Gimmick** (better matches, readable, fair, buildable per engine.md) | 7: closest to engine.md (full-ride exit telegraph, intent capture, lifts); the Drop needs E1 + E2 and lands on the tower start and the Pond | 7: the up/down tide on the kelp lines is the best schedule idea in the three (symmetric at every instant, no geometry moves); but bomb mail and branch junctions are outside the engine core, Kelp Line B is 58 m, and the Penguin Express breaks the 22 m pad rule | 5: a four-way junction (E1 supports three), a 40 s tide that is busy, a 1.0 s cooldown and post-landing invulnerability below the engine's floor, bomb mail |
| **Every mode** (zones, the straight track, Bazookarp distances, boss) | 6: a 143.5 m track; side-by-side checkpoints contradict the SPEC's sequential weirs; its weir sits at about 68 % | 6: a good 144 m feeding-round track; the weir on the Ticket Hall at about 70 % and 16 m from the Gate fails SPEC §9.1 | 5: a three-checkpoint 106 m track against the two-checkpoint standard; weir 10 m from the Gate |
| **Uniqueness** (vs. the twelve and bluestone / caldera) | 5: three rounds in a row along z is close to Craters' lobed silhouette | **8** as drawn in the concept (one round drum with two swept wings); the first revision lost the sweep (see the Review log), revision 2 restores it | 7: a circle with a bar through it, but 80 m wide |
| **Total** | 33 | **37** | 29 |

What I took, in five lines:
1. **Base: concept-place.** The name, the island drum with swept spawn blades, the Great Tank with the Feeding Deck on its lid, Bathysphere No. 1, the kelp drums, the Shark Arch, the low Reef Hall / high Sea Promenade flank pair, the Gulper Run, the kelp lines' up/down tide (no junction, no bomb mail) and, rebuilt to the rules, its Penguin Express.
2. **From concept-play:** a two-way line through a tank that joins one half's two flanks (the Arch Lines through the Arch Tank), the bubble column that splits the tunnel and blocks the spawn-to-mid sightline, the full-ride team-colour exit telegraph, the refused carrier, a one-way/two-way read carried by shape first, and its palette rules for ink against water.
3. **From concept-gimmick:** the Tide Gauge dials as the schedule's world cue, the pneumatic-post lore of the Tubeway, the Deep Dome on the horizon with streaks running along its tube, and the balance metrics (share of arrivals at mid's high ground by pipe, splats near exits).
4. **Redesigned by me for the rules:** the swept blades (§2.1), the Bazookarp weir in the Shark Arch hall and the Gate a level below the spawn (L 59.5 m, weir at 49 %, 31.3 m from weir to Gate), the side zone in the low arcade, a 147.8 m two-checkpoint track on a square grid through a swept wing, and every pipe fitted and measured against engine rules 1–34.
5. **Also mine:** the cuts (no junctions, no bomb mail, no spawn express into mid), the Glass Walk over the Gulper Run, the deck hatches and the promenade Lookouts against a fortress mid, and the raised gantry so the whole bathysphere shows from both spawns.

---

## 1. Name, identity, story, landmark

**Name: Gulper Aquarium.** Stage-select blurb: *"Inkopolis's island aquarium, where every drop of water stays behind
glass and the Tubeway's clear pipes whisk squids through the shark tanks."*

The gulper eel is the deep-sea fish whose mouth is bigger than its body. The aquarium's emblem is a gulper eel coiled
into a ring (the plan of the building), and the two bronze gulper heads at mid are the mouths of its most famous pipe.

**Identity.** Gulper Aquarium is Inkopolis's grand public aquarium, built in 1936 in white Streamline Moderne as a round
drum on its own islet in the bay. Visitors arrive by ferry at two piers. From each pier a long ferry wing sweeps up to the
drum like the blade of a ship's propeller: a ferry plaza with the entrance pavilion and its neon fin tower, the Ticket
Hall, the open-sided Pump Hall along one edge and the penguin colony along the other. Inklings dissolve in water, so the
house rule is painted on every sign: **ALL WATER IS BEHIND GLASS**. The drum is a ring of galleries round an open-air
**Ocean Court**. On each half one side of the ring is the low **Reef Hall** arcade with its glowing wall tank, the other
the high **Sea Promenade** terrace open to the sea. Two tall glass **Kelp Drums** rise where they meet. Each wing enters
the court through a gatehouse with a glass tunnel under a shark tank, the **Shark Arch**.

**Story.** The aquarium's founder ran the old Central Post Office's pneumatic tubes before she ran an aquarium. When the
post office modernised she bought the whole system and threaded it through her building as **the Tubeway**: dry, clear
acrylic tubes with brass collars that suck a visitor in at one brass bell and pop them out at another, through the shark
tanks, the only way an Inkling can swim with sharks. The tank pumps blow the Tubeway, and twice every three minutes the
keepers reverse the kelp drums' pumps to stop the kelp clogging: the kelp lines run **UP** for 90 s, then **DOWN**. The
ferry wings got the newest line, the **Express**, which whisks late visitors from the ferry plaza high over the Ticket
Hall to the penguins. Today the aquarium is closed for a Turf War; the ferries are tied up at the piers.

**The landmark: the Great Tank and Bathysphere No. 1.** At the centre of the court stands a 15 m glass drum full of
sharks, rays and a turtle, its lid the teak **Feeding Deck** at 2.4 m where the keepers feed them (and where every fight
at mid happens). A 2.4 m strip of glass-block deck lights, the **Glass Walk**, crosses the lid from jaw to jaw over the
Gulper Run, so you see the riders slide under your feet. Over the deck, on a riveted sea-green portal gantry 17.8 m tall,
hangs **Bathysphere No. 1**, the steel diving ball with lit portholes that went down 923 m in 1934; the whole ball shows
over the gatehouse from both spawns. Under the deck, the **Gulper Run** pipe crosses the tank among the sharks between
two bronze gulper heads.

What a player remembers after one match:
- standing on the Glass Walk while a teammate's squid streaks under their feet among the sharks, then pops out of a bronze
  eel's jaws;
- a squid shooting up the middle of a 10 m kelp drum and arcing over the enemy's promenade;
- spawning and seeing a rider fly high over the ferry plaza in the Express;
- the hoot, the countdown and the WHUMP as the kelp swings round and the lines go DOWN;
- planting the Bazookarp in the shark tunnel with sharks overhead;
- the bathysphere's lit portholes over the deck at dusk.

---

## 2. The plan

### 2.1 Macro shape, bounds and the outline

**A round drum (r 31–32.5) round the Ocean Court, with one spawn blade swept off each gatehouse: a two-bladed
propeller.** Each blade leaves its gatehouse's wing mouth and runs 30° off the z-axis toward its team's left. Its
trailing edge (the penguin cove) is drawn tangent to the drum and curves out like a propeller blade's; its leading edge
(the Pump Hall's back wall) leaves the drum at α ≈ −54° and steps in three Deco bays toward the tip; the tip is the Fin
Pavilion with a curved back. Alpha's blade ends at x +2…+35, z −51…−77 (its pad at (18.0, −63.7)); Bravo's is the turn,
ending at x −35…−6. The blades are 32–37 m wide against the drum's 65 m, so the disc reads round between them.

Silhouette on a 2 m × 4 m raster (`#` = floor or a solid piece; +x to the right, +z down), next to the two stages the
advocate compared it with (their real layout pieces, read with `layoutFor(MAP_LAYOUTS[id], 'turf')` as
`check-maps.mjs` reads them and rasterised the same way):

```
Gulper Aquarium (rev. 2)                    Treehills                                   Craters
.........................................   .........................................   .........................................
.......................##................   .........................................   .........................................
......................###########........   .........................................   .........................................
...................##############........   ..............#############..............   .........................................
.................###################.....   ..............#############..............   ...............###########...............
................######################...   .............###############.............   ...............###########...............
..............######################.....   ..........##################.............   ...............#.#######.#...............
.............######################......   .........###################.............   ...........###################...........
............######################.......   .........#####################...........   .......###..###############.######.......
...........######################........   .........######################..........   ......######################.######......
..........#######################........   ........#########################........   .....#..####################.#######.....
.........#######################.........   .......##########################........   .....#...#...############..####..###.....
........#######################..........   ......##########################.........   .....###############################.....
........######################...........   ......#########################..........   .....###########################..##.....
.........######################..........   ......##########################.........   ......#############################......
........#########################........   .....#############################.......   .......################...#.######.......
.......############################......   .....##############################......   ......######################..#####......
......##############################.....   ...#################################.....   .....##############################......
.....###############################.....   ...##################################....   .....##..######################...##.....
....################################.....   ...##################################....   .....##..######################...##.....
....#################################....   ...###################################...   .....##############...##############.....
.....###############################.....   ....##################################...   .....##...######################..##.....
.....###############################.....   ....##################################...   .....##...######################..##.....
.....##############################......   .....#################################...   ......##############################.....
......############################.......   ......##############################.....   ......#####..######################......
........########################.........   .......#############################.....   .......######.#...################.......
..........######################.........   .........##########################......   ......#############################......
..........#######################........   ..........#########################......   .....##..###########################.....
..........######################.........   .........##########################......   .....###############################.....
.........#######################.........   ........##########################.......   .....###..####..############...#...#.....
........#######################..........   ........#########################........   .....#######.####################..#.....
.......#######################...........   ..........######################.........   ......######.######################......
......#######################............   ...........#####################.........   .......######.###############..###.......
.....#######################.............   .............###################.........   ...........###################...........
....######################...............   .............##################..........   ...............#.#######.#...............
...######################................   .............###############.............   ...............###########...............
.....##################..................   ..............#############..............   ...............###########...............
........###########.##...................   ..............#############..............   .........................................
........###.######.......................   .........................................   .........................................
```

Treehills and Craters are mirror-symmetric about both axes and widest at mid with square spawn stubs on the z-axis.
Gulper Aquarium is symmetric only under the 180° turn: its spawns sit 18 m off the z-axis on opposite sides, each blade's
two edges are different (a curved penguin cove and a stepped shed wall), no edge of the outline runs north–south, and no
straight wall on it is longer than 14 m. It is also unlike bluestone's skewed X (two crossing bands), caldera's crescent,
the bands (Halyard, Calamari, Crossmarket, Nantai) and the S shapes (Spirhalite, Terraces).

- `bounds`: { minX −36, maxX 36, minZ −78, maxZ 78 }.
- Walkable floor: **5,446 m²** (Craters 5,818, Calamari 6,071): 2,986 at 0; 108 of low relief at 0.22–0.45 (plinths, kerbs,
  viewing steps); 210 of beds, daises and terraces at 0.5–1.0; 640 at 1.2; 784 at 2.4; 56 at 3.0; 608 at 3.4 (spawn decks); 50 at 3.6.
- The ring and court hold 2,544 m²; each blade 1,451 m², 27 % of the floor each.

### 2.2 Heights and what a 1.8 m climb means

| height | where |
|---|---|
| **0** | Ocean Court, Reef Hall arcades, Shark Arch halls, Gate Terraces, the Pump Hall aisle, the ferry plazas (forecourts) |
| 0.22–0.45 | colonnade plinths and their steps, Reef Window kerbs, viewing steps round the Great Tank (0.4) (relief, walked over) |
| 0.5–1.0 | queue terraces and the Ticket Hall's queue step (0.6), diving-helmet beds (0.9), touch-pool daises (0.5 step, 1.0 top) |
| **1.2** | Feeding Steps, Ticket Halls, filter bunds, Penguin Point rock terraces |
| **2.4** | **Feeding Deck (mid)**, Sea Promenades, Penguin Point upper rocks |
| 3.0 | telescope bays on the promenades |
| 3.4 | spawn decks |
| **3.6** | Kelp Balconies, promenade Lookouts |
| off-limits (`roof`) | the Great Tank's glass sides, gulper heads 2.4 and necks 1.9, gantry legs and beams, the bathysphere, gatehouse pylons 9.0, kelp drums 10.6, plant rooms 6.0, Reef Window wall 5.0, arcade canopies 4.6–5.3, kiosks, booths and huts, the Ticket Hall canopy 6.6–6.8, sand filters 4.3, the Pump Hall roof and back wall 7.0–8.2, the penguin glass 2.6–4.4 and cove, fin towers 18, every pipe, mouth housing and bell |

Every tier step is **1.2 m**. A kid hops it, and `nav.js` makes a **jump edge** for it (0.5 < rise ≤ 1.25), so bots and
the Bazookarp checker (climbs off) use every hop the players use. No rise in the stage falls in 1.25–1.3, the band
`nav.js` makes neither a jump nor a climb.

A kid climbs about 1.8 m. So:
- **Hops** (≤ 1.25, bot jump edges): every 1.2 edge; 1.2 → 2.4 (Feeding Step to deck, rock terrace to upper rock); 2.4 →
  3.6 (promenade to Kelp Balcony or Lookout); a deck hatch (1.2); relief up to 1.0.
- **Climbs** (squid only, inkable faces): the promenade's 2.4 inner face (white render, inkable along its whole length, a
  bot climb edge too).
- **Walls** (> 1.8): the deck's glass sides: 2.4 m over the court and 2.0 m over the viewing step (glass is never inked,
  so the deck is reached only by its six ways up); the spawn decks' 3.4 fronts (a non-inkable glass-block fascia: a
  one-way drop, a `nav` drop edge); the gulper heads; the penguin glass (≥ 2.0 m over every standable surface within
  3 m, §2.4).
- **The Penguin terrace does not hop onto the promenade**: the promenade's outer edge carries a 1.0 m sea rail, so its
  top is 2.2 m over the terrace. Only the Penguin Steps join them (a kid can still hop onto the rail from the promenade
  side and drop down).
- **Pipes are never the only way anywhere.** Every inkable floor is reached on foot.

### 2.3 The whole stage (Turf War)

Legend: `.` floor 0 · `,` relief 0.22–0.5 (plinths, kerbs, the viewing step, the dais step) · `v` 0.6 (queue
terraces and step) · `n` 0.9–1.0 (beds) · `1` 1.2 · `2` 2.4 · `e` 3.0 · `3` 3.4 · `D` the Feeding Deck (2.4) ·
`_` the Glass Walk (2.4) · `B` Kelp Balcony (3.6) · `L` Lookout (3.6) · `/` stairs and ramps ·
`#` gatehouse pylons, plant rooms, walls, fin towers (roof) · `w` the Reef Window wall tank · `K` kelp drum ·
`G` gulper head · `H` gantry leg · `O` bubble column · `J` jelly column · `T` touch pool · `M` diving helmet ·
`o` lamp / canopy / truss column · `c` coral sculpture or clam · `k` Tubeway stop (a mouth's housing) ·
`q` kiosk, booth, hut · `p` planter, pump, crates, pillar, trolley, cart · `b` bench · `-` turnstiles ·
`=` balustrade · `F` sand filter · `r` rock outcrop · `x` deck hatch · `:` rail · `P` penguin glass and cove (out of
bounds) · `~` sea. Each character shows the most solid thing in its 1 m × 2 m cell.

```
   x = -36       -26       -16       -6        4         14        24        34
               |         |         |         |         |         |         |
    -78  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    -76  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~:::::~~~~~~~~~~~~~~~~~~~~~~~~~~
    -74  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~::/333:::::~~~~###~~~~~~~~~~~~~~
    -72  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~:://33333333:::########~~~~~~~~~~
    -70  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~P~~~~:///3p33333333333######~~~~~~~~~~~
    -68  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPP:///3ppp3333333333333##::~~~~~~~~~~
    -66  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPqqq.3333p3333333333333333:::~~~~~~~~
    -64  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPPvqqvvvv.333333333333333333333::~~~~~~
    -62  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPP.vvpppvv.p...33333333333333333333::~~~
    -60  ~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPP......pvv..pp.....3333333333333333/33:~~
    -58  ~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPP22bbb....p....ppp......3333333ppp3///::~~
    -56  ~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPP22222...........p...ppp..qqq333pp3///::~~~
    -54  ~~~~~~~~~~~~~~~~~~~~~~PPPPPPPP22rr2..................pp.qqq..333///:~~~~~
    -52  ~~~~~~~~~~~~~~~~~~~~~PPPPPPPP22222........ppp........pp........pp/:~~~~~~
    -50  ~~~~~~~~~~~~~~~~~~~~PPPPPPpp1111..........................kk..ppp::~~~~~~
    -48  ~~~~~~~~~~~~~~~~~~~PPPPPPPp11p1111.......................kkkk...::~~~~~~~
    -46  ~~~~~~~~~~~~~~~~~~PPPPPP111p1111......1o1111--o.......oppkkk1..:~~~~~~~~~
    -44  ~~~~~~~~~~~~~~~~~PPPPPP11111111.......11111111.........pp.FF1.:~~~~~~~~~~
    -42  ~~~~~~~~~~~~~~~~PPPPPPqq111111........111111qqq......pp..FFF#:~~~~~~~~~~~
    -40  ~~~~~~~~~~~~~~~PPPPPPkqq1111xxpp...p..1op111qqq......pp11111##~~~~~~~~~~~
    -38  ~~~~~~~~~~~~~~PPPPPPkkkk1111................//.p......11FFF##~~~~~~~~~~~~
    -36  ~~~~~~~~~~~~~PPPPPPkkkk1111.........pp........ppp....111FF##~~~~~~~~~~~~~
    -34  ~~~~~~~~~~~~~PPPPP11kk111..pp.......................11FFF##~~~~~~~~~~~~~~
    -32  ~~~~~~~~~~~~PPPPP1111111...pp.........................FF###~~~~~~~~~~~~~~
    -30  ~~~~~~~~~~~PPPPP111///1..:#####........bbb#####wwww...pp##~~~~~~~~~~~~~~~
    -28  ~~~~~~~~~~~PPPP11//////::2#####...........#####wwww....##~~~~~~~~~~~~~~~~
    -26  ~~~~~~~~~~~~~~~k11:22222222####...........####.........#w~~~~~~~~~~~~~~~~
    -24  ~~~~~~~~~~~~~kkkk:22qqqq222####...........####........wwwww~~~~~~~~~~~~~~
    -22  ~~~~~~~~~~~~~:kkkkk22qqq2222###....OOO...........cc......wwww~~~~~~~~~~~~
    -20  ~~~~~~~~~~~:::22kk22222222222##.....O.....##,....cc........wwww~~~~~~~~~~
    -18  ~~~~~~~~~~::eee222222222===.pp...........JJJJo........cc....wwww~~~~~~~~~
    -16  ~~~~~~~~~::eqqqq22L222==nTTTTT...........JJJJ....oo...cc......www~~~~~~~~
    -14  ~~~~~~~~:22e2qqqLLL==...nTTTTT............................cc...www~~~~~~~
    -12  ~~~~~~~:2xx2222222==/...........HH.....HH...........,o....cc....www~~~~~~
    -10  ~~~~~~::2xx222222///////...//...HH1111.HH..///..................,www~~~~~
     -8  ~~~~~~:222222222=//////.../////.,,1111.,.//////.nMnn...o.........www~~~~~
     -6  ~~~~~:2BBB2/////=..///......////DDDDDDDpp////...MMMn..../////.....www~~~~
     -4  ~~~~##BBKKKKKKK=//.JJJ......,.pDDxDDDDDxDDp,.....M.....///KKKKKkk.www~~~~
     -2  ~~~~###KKKKKKKKK///JJJ..GGG,,DDDxxDDDDDxxDDD,.GGG.....///KKKKKKKKK###~~~~
      0  ~~~~###KKKKKKKKK///.....GGGGG_______________GGGGG.....///KKKKKKKKK###~~~~
      2  ~~~~###KKKKKKKKK//......GGG.,DDDxxDDDDDxxDD,,.GGG..JJJ///KKKKKKKKK###~~~~
      4  ~~~~www.kKKKKKK//....nnMn..../pDDxDDDDDxDDp........JJJ.//=KKKKKKKBB##~~~~
      6  ~~~~www,...////......nMMM../////ppDDDDDD/////......///..=////22BB22:~~~~~
      8  ~~~~~www........,o.....M.//////..,1111.,../////...//////=222222222:~~~~~~
     10  ~~~~~www,..................//...HH.....HH.../....//////2222222xx2::~~~~~~
     12  ~~~~~~www....cc...,o............HH.....HH.,,,,,,.....==2222222xx2:~~~~~~~
     14  ~~~~~~~www...cc...........................nTTTTT....==LL2qqqee22:~~~~~~~~
     16  ~~~~~~~~www......cc...oo....JJJJ...........TTTTT.==222222qqqqe::~~~~~~~~~
     18  ~~~~~~~~~wwww....cc.......,oJJJJ...........pp.===22222222eeee::~~~~~~~~~~
     20  ~~~~~~~~~~wwww........cc.....##.....O.....##22222222222kk22:::~~~~~~~~~~~
     22  ~~~~~~~~~~~~wwww......cc...........OOO....###2222qqq22kkkkk:~~~~~~~~~~~~~
     24  ~~~~~~~~~~~~~~wwwww........####...........####222qqqq22:kkkk~~~~~~~~~~~~~
     26  ~~~~~~~~~~~~~~~~ww.........####...........####2222222/:11k~~~~~~~~~~~~~~~
     28  ~~~~~~~~~~~~~~~~##....wwww#####...........#####2:://///111PPPP~~~~~~~~~~~
     30  ~~~~~~~~~~~~~~~##pp...wwww#####bbb........#####:.11//1111PPPPP~~~~~~~~~~~
     32  ~~~~~~~~~~~~~~###FF1........................pp..11111111PPPPP~~~~~~~~~~~~
     34  ~~~~~~~~~~~~~~##FFF1........................pp.1111kk11PPPPP~~~~~~~~~~~~~
     36  ~~~~~~~~~~~~~##FF11.....ppp/.......pp.........1111kkkkPPPPPP~~~~~~~~~~~~~
     38  ~~~~~~~~~~~~##FFF1.......p//................11111kkkkPPPPPP~~~~~~~~~~~~~~
     40  ~~~~~~~~~~~##1111.pp......oqq111po...p...ppxx1111qqkPPPPPP~~~~~~~~~~~~~~~
     42  ~~~~~~~~~~~:#FFF..pp......qqq11111........1111111qqPPPPPP~~~~~~~~~~~~~~~~
     44  ~~~~~~~~~~:11FF.pp........11111111.......111111111PPPPPP~~~~~~~~~~~~~~~~~
     46  ~~~~~~~~~:..1kkkppo.......o--....o......11111p111PPPPPP~~~~~~~~~~~~~~~~~~
     48  ~~~~~~~::...kkkk.......................1111p11pPPPPPPP~~~~~~~~~~~~~~~~~~~
     50  ~~~~~~::ppp..kk.........................21111ppPPPPPP~~~~~~~~~~~~~~~~~~~~
     52  ~~~~~~:/pp........pp........ppp........22222PPPPPPPP~~~~~~~~~~~~~~~~~~~~~
     54  ~~~~~:///333..qqq.pp..................2rr22PPPPPPPP~~~~~~~~~~~~~~~~~~~~~~
     56  ~~~::///3pp333qqq..ppp...p..........222222PPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~
     58  ~~:://33ppp33333333.....ppp....p....bbb22PPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~
     60  ~~:3333333333333333333.....pp..vvp......PPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~
     62  ~~~::333333333333333333333..pvvvpppvvvPPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     64  ~~~~~~::333333333333333333333.vvvvqqvPPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     66  ~~~~~~~~:::3333333333333333p3333/qqqPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     68  ~~~~~~~~~~::##3333333333333ppp3///:PPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     70  ~~~~~~~~~~~######33333333333p////:~~~~P~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     72  ~~~~~~~~~~########:::3333333///::~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     74  ~~~~~~~~~~~~~~###~~~~:::::333/::~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     76  ~~~~~~~~~~~~~~~~~~~~~~~~~~:::::~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     78  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

### 2.4 The pieces (Alpha's half and the singles)

`half` pieces are listed in Alpha's frame and turned for Bravo; `single` pieces sit on the centre and are self-symmetric.
Sizes are x × z (or Ø, or across × along for blade pieces), then the top. Flags: **R** = `roof` (off-limits, slide off,
never inked), **rail**, **perch**, **grate**, **notIn tower** (`notIn: 'tower'`: the piece is left out of the Tower
Command build, because it would stand within 0.6 m of the track). **Glass and water** are solid level geometry built as
`hidden: true` colliders plus a prop that draws them (§5.3), flagged `paint: false` (never inked, never climbed); no
stage-wide `glass` sight flag is needed (ENGINE.md §1.4). Pieces of the E kelp drum sit on both halves; they are listed
once in the half list and their twins make the W drum.

**The centre**

| piece | list | centre x / z | size | floor / top | flags | purpose |
|---|---|---|---|---|---|---|
| Ocean Court floor | single | 0 / 0 | disc r 21 (24-gon) | 0 | — | Mid's open floor; terrazzo with brass compass roses in its north and south bands |
| **Great Tank + Feeding Deck** | single | 0 / 0 | 16-gon r 7.5; a 0.15 m brass-capped granite kerb, then glass 0.15–2.4 in brass mullions every 2 m; teak lid; inside, a sand bed sunk to −0.6 | deck **2.4** | sides `paint:false` | The mid structure. Centre zone, tower start, the Pond. Built as a `hidden` 16-gon collider 0–2.2 (the tank, drawn by its prop) under drawn, inkable lid blocks 2.2–2.4 (teak; the Glass Walk is its own lid block) |
| **Glass Walk** | single | 0 / 0 | x −7.5…7.5 × z −1.2…1.2, clipped to the lid | 2.4 | inkable (pattern `glasstile`) | Glass-block deck lights in brass frames along the Gulper Run (its glass top 1.02 m below). The pipe engine draws each rider's glow on it through any ink (ENGINE.md §3.6). The Pond sits on its centre |
| Deck hatches ×4 | half (2 entries) | (3.6, −2.52) turned 55°, (−3.6, −2.52) turned −55°; twins (−3.6, 2.52), (3.6, 2.52) | 2.0 tangential × 1.0 radial | **3.6** (1.2 above the deck) | — | Cover inside the centre zone (a hop-up); off the Glass Walk, the tower's lane (≥ 0.75 m) and the Bazookarp shell (≥ 3.4 m from the centre) |
| Fish-food hoppers ×4 | half (2 entries) | (5.93, −3.43), (−5.93, −3.43) | 1.0 × 1.0 | 3.6 | — | Rim cover, outside the zone (r 6.85) |
| Feeding-pole rack ×2 | half | (3.24, −6.09), turned 28° | 2.0 × 0.4 | 3.4 | — | Rim cover |
| Feeding Step S (N mirrored) | half | x −2.0…2.0, z −7.2…−9.8 | 4.0 × 2.6 | 1.2 | — | Hop-through onto the deck on the axis (1.2 + 1.2); the tower's double drop |
| Deck ramp SE (NW mirrored) | half | radial α −45°, r 7.5 → 13.5 | 4.0 wide, run 6.0 | 2.4 → 0, 21.8° | — | Way up for kids and carriers |
| Deck stair SW (NE mirrored) | half | radial α −135°, r 7.5 → 13.5 | 4.0 wide, 15 risers of 0.16 | 2.4 → 0 | — | Way up |
| Viewing step | half | four arcs r 7.5 → 9.0 at α −73…−62, −28…−11, −169…−152, −118…−107 | 1.5 deep | 0.4 | — | Relief round the tank where children press their noses to the glass; it stops 0.2–0.5 m short of every way up and the gulper necks. The deck rim stays 2.0 m above it, so it is no way onto the deck |
| Gulper head (E listed) | half | x 9.5…12.7, z −1.3…1.3 | 3.2 × 2.6 | 2.4 | R | Bronze eel head, jaws facing out; the Gulper Run's mouth at (12.7, 0.8, 0) |
| Gulper neck (E listed) | half | x 7.4…9.5, z −1.0…1.0 | 2.1 × 2.0 | 1.9 | R | The eel's bronze neck runs into the tank glass and hides the end run (ENGINE.md rule 14); 0.5 m below the deck rim, so nobody steps onto it from the deck |
| Feeding Gantry legs ×4 | half | (3.6, −11), (−3.6, −11) | 1.2 × 1.2 | 17.8 | R | Landmark; cover on the centre lanes (inner faces 6.0 m apart) |
| Gantry beams + winch house | single | beams over x ±3.6 from z −11 to 11, cross-beam on z 0 | beams 1.0 deep | 16.8–17.8; winch house 3 × 3 to 20.0 | R | The silhouette over both gatehouses |
| **Bathysphere No. 1** | single | (0, 14.5, 0) | Ø 2.9 (13.05–15.95), on two cables | — | R (prop) | The landmark; the whole ball shows from both pads (§5.1); portholes lit at dusk |
| Moon-jelly column J1 | half | 6.5 / −17.0 | Ø 3.0 plinth, milky glass Ø 2.4 | 4.2 | R | Cover at the arch's court mouth (opaque, lit from inside) |
| Moon-jelly column J2 | half | −16.25 / −2.9 | same | 4.2 | R | Cover beside the W gulper's landing (2.9 m), 39° off its pop axis |
| Touch-pool dais | half | x −12.0…−6.0, z −12.6…−16.0; its step x −12.0…−6.0, z −11.8…−12.6 | 6.0 × 3.4, step 6.0 × 0.8 | **1.0**, step 0.5 | — | The SW exhibit bed: a coral-rock dais with two steps up from the court ("TWO FINGERS, PLEASE") |
| Touch pool | half | x −11.5…−6.5, z −13.0…−15.6 | 5.0 × 2.6 | 2.0 (1.0 above the dais) | R (glass top) | Cover on the dais |
| Diving-helmet bed | half | x 11.3…15.3, z −4.0…−8.0 | 4.0 × 4.0 | **0.9** | — | The SE exhibit bed: a bronze plinth with a 0.7 m walkable ledge round the helmet |
| Diving helmet | half | 13.3 / −6.0 | Ø 2.6 | 3.5 (2.6 above the bed) | R | Hard cover SE of the deck |
| Tubeway map lectern | half | x −8.5…−6.5, z −17.7…−18.3 | 2.0 × 0.6 | 1.2 | R | Cover by the hall's court mouth; the network map |

The first revision's court planter at (−15.5, −11.5) and bench at (−12.5, −13.5) are gone: the planter overlapped the
grand stair's footprint by 1.1 m, and the touch-pool dais now holds that corner.

**The ring (Alpha's half)**

| piece | list | centre x / z (or polar) | size | floor / top | flags | purpose |
|---|---|---|---|---|---|---|
| **SE Reef Hall** (Alpha's left, low) | half | sector α −70°…−8°, r 20 → 30.5, plus the drum's south side (x 19.5…30.5, z −8.5…0, r ≤ 30.5) | ≈ 270 m² | 0 | — | The low covered flank; the side zone; the Tubeway concourse |
| Colonnade plinth | half | sector α −70…−6, r 20.0 → 21.6; 7° gaps at α −57, −43, −29, −15 hold two 0.22 m steps | 1.6 deep | 0.45 | — | Relief along the court edge; the lamp columns stand on it |
| Colonnade lamp columns ×4 | half | r 20.8 at α −64°, −50°, −36°, −22° | Ø 0.9 | 5.3 | R | Thin cover along the court edge, 5 m apart |
| Reef Hall canopy | half | sector α −70…−12, r 25.5 → 30.5 | cantilever from the outer wall | underside 4.6, top **5.3** | R | Shade; headroom 4.6. Its fascia reaches 5.3 so BossNav's 5.2 m probe reads it as a wall (§4.6) |
| Reef Window kerb | half | sector r 29.3 → 30.5 at α −70…−63 and −22…−12 | 1.2 deep | 0.45 | — | Relief under the window; kept off the side zone, the Service Gate and the Kelp landing |
| Coral sculptures ×2 | half | (α −43°, r 25.0), (α −31°, r 26.0) | Ø 1.6 | 1.6 | R | Cover; both inside the side zone |
| Giant clam | half | α −58°, r 25.5 | Ø 2.0 | 1.2 | R | Cover at the Arch Line's landing (2.5 m) |
| **Reef Window** wall tank | half | sector α −70…−8, r 30.5 → 32.5, minus the Service Gate | glass face 0.6–3.4 | 5.0 | R, glass face `paint:false` | The outer wall: a 40 m curved reef window (corals, clownfish, a moray in a pipe, the shy octopus) |
| Service Gate | half | opening α −63…−54 through the Reef Window, r 30.5 → 32.5 (4.8 m wide at r 30.5) | — | 0, lintel 5.0 | — | The left flank's door from the Pump Hall into the arcade |
| South gatehouse pylons | half | sector α −110…−70, r 20 → 31.2, minus the hall x −6…6 and the east door | two wedge pylons joined over the hall by the Arch Tank | 9.0 (court-face parapet letters to 9.8) | R | GULPER AQUARIUM letters on the court face; the Tide Gauge dials on the crest at x ±4.5 (§3.3); a two-faced clock over the wing mouth. Inside each pylon a 2.2 m square void round the Arch Line's end run and riser at (±7.32, −27.13), glazed toward the hall **and** through a 1.2 m-wide vertical slot (0.6–8.4 m) in the pylon's wing face toward the Gate Terrace |
| **Shark Arch hall** | half | x −6 … 6, z −19.0 → −32.5 | 12 × 13.5 | 0; glass ceiling 6.0 | — | The tunnel you fight through. Bazookarp weir at (0, −28); the tower's lane (x −3.4) |
| Arch Tank | half | x −6 … 6, z −19.0 … −31.0 | water box over the hall | 6.0–9.0 | R | Blacktip sharks and an eagle ray overhead; the Arch Line crosses inside it at 7.5, seen from the hall, from both of its mouths and from the court through its court-side glass |
| Bubble column | half | 0 / **−21.5** | Ø 1.6, floor to ceiling | 6.0 | R | Splits the hall's court mouth into two 5.2 m lanes; blocks the axis sightline from the wing to the deck; 5.7 m clear of the weir |
| Shark-viewing bench | half | x 3.0…5.4, z −29.7…−30.3 | 2.4 × 0.6 | 0.9 | — | Cover in the east lane, 3.45 m from the weir's centre (the tower uses the west lane on this half) |
| East door | half | x 5.9 → 8.7, z −20 … −24 | 4.0 wide, through the east pylon | 0, lintel 4.2 | — | The hall's side door into the arcade (the Bazookarp's arcade route) |
| **SW Sea Promenade** (Alpha's right, high) | half | sector α −172°…−110°, r 21 → 31.4 | ≈ 200 m² | **2.4** | — | The high open flank over the sea; inner face r 21 is white render (inkable, swim-up); the Jelly Gallery below is out of play (portholes in the face) |
| Sea rail | half | r 31.0 → 31.4, α −172…−110; gaps for the Penguin Steps (α −124.6…−115.4) and through the deep Kelp stop | 1.0 tall (4.0 along the telescope bay) | — | rail | See-through; blocks walking; a kid can hop onto it from the promenade and drop to Penguin Point |
| Balustrades | half | r 21.0–21.4 at α −170…−158 and −133…−117 | 0.9 solid | 3.3 | — | Cover on the promenade's court edge; gaps at the grand stair and the Lookout |
| **Lookout** | half | sector α −146…−137, r 21.4 → 24.4 | ≈ 9 m² | **3.6** | — | A raised teak deck over the Jelly Gallery's skylight, 1.2 above the promenade (a hop): sees the deck rim from 14–17 m and its own half of the court. Its court edge carries a 0.9 balustrade (r 21.4–21.8, top 4.5) |
| Telescope bay | half | sector α −151…−139, r 27.6 → 31.0 | ≈ 19 m² | **3.0** | — | Relief at the sea rail, 0.6 above the promenade; three coin telescopes |
| Grand stair (NE mirrored) | half | radial α −152°, r 15.6 → 21.2 | 6.0 wide, 16 risers of 0.15 | 0 → 2.4, 23.2° | — | The court's way up to the promenade |
| Souvenir kiosk | half | α −145°, r 27.0 | 2.5 × 2.5 | 5.0 | R | Cover between the Lookout and the telescope bay |
| Ice-cream kiosk | half | α −122°, r 27.5 | 2.5 × 2.5 | 5.0 | R | Cover 2.9 m from the Arch Line's promenade landing |
| Deckchair stack | half | α −158°, r 29.0 | 1.4 × 1.4 | 3.6 (1.2 above) | — | Cover at the promenade's north end |
| Penguin Steps | half | radial α −120°, r 30.9 → 34.6 | 5.0 wide | 2.4 → 1.2, 19° | — | The right flank's link between the promenade and Penguin Point; its top is the promenade's own floor (the edge wall is cut there), its foot lands flat on the rock terrace |

**The E kelp drum (listed in the half list; the W drum is its twin)**

| piece | centre x / z | size | floor / top | flags | purpose |
|---|---|---|---|---|---|
| **Kelp Drum** | 25 / 0 | Ø 9.0 glass to 10.0, riveted brass crown 10.0–10.6 | — | R | Vertical landmark; giant kelp, thinned to clear water within 1.5 m of the Kelp Line's riser; the riser rises up its middle |
| Plant room | x ≥ 29.0, z −1.5 … 4.6, out to the ring (r 32.5), minus the drum and the balcony | — | **6.0** | R | Pumps; fills the drum's sea side. Its face over the Kelp Balcony is the pump-house wall with a vent, 2.4 m above the balcony |
| **Kelp Ramp** | round (25, 0) from bearing −90° (Alpha's arcade) via 180° (court side) to +90° (Bravo's promenade), r 4.6 → 7.5 | 6 straight segments of 30°, 2.9 wide, ≈ 19 m | 0 → 2.4, 7.1° | court-side flank: a render face with a 0.9 parapet from bearing −120° (3.9 m up the ramp) to the top | Where Alpha's low left meets Bravo's high right on foot; its flank is cover in the court. **Its foot** is the radial edge x 25, z −4.6…−7.5 and has 3.0 m of clear flat floor east of it (x 25…28), entered moving west, and its first 3.9 m have no parapet, so it is stepped onto from the arcade too |
| **Kelp Balcony** | bearings 15°…75° from (25, 0), r 4.6 → 7.2 | ≈ 16 m², rail on its sea edge | **3.6** | — | Lookout over Bravo's promenade; hop up from the promenade (1.2) |
| Kelp stop, low (the Kelp Line's A end) | x 26.2 … 28.6, from z −4.6 back to the drum (−2.8) | 2.4 wide, 1.0 out from the drum's foot | 2.6 | R | A brass bell set into the drum's granite foot; its mouth at (27.4, 0.8, −4.6) faces −z into Alpha's arcade, 1.2 m east of the ramp's foot. Its end run continues straight into the drum's water (visible) |
| Kelp stop, deep (the B end) | radial at α 48°, r 28.3 → 33.2, on Bravo's promenade, standing past the sea rail onto Bravo's rocks | 2.4 × 4.9, long side radial | 5.0 | R | The housing of the mouth at (18.94, 3.2, 21.03), facing the court; a 2.2 m void inside it round the end run and the lower 1.8 m of the vertical |

**The wing (Alpha's): the blade**

The blade's floor (the Gate Terrace, the Pump Hall's floor and the ferry plaza) is everything outside the ring between w
−17 (the penguin glass) and the east edge (w 19.5 for s < 10, 18.0 for s 10…19, 16.5 for s 19…31), from s −16 to 31,
at 0. Blade pieces give (s, w) and their world centre; axis-aligned pieces give world x / z.

| piece | where | size | floor / top | flags | purpose |
|---|---|---|---|---|---|
| **Ticket Hall** (axis-aligned, facing the South Gate) | x 2.0 … 10.0, z −39.0 … −46.0 | 8.0 × 7.0 | **1.2** | — | The wing's strategic point at the blade's knuckle; tower checkpoint 2; hop up anywhere (1.2) |
| Ticket Hall stair | x 8.0 … 10.0, z −36.2 → −39.0 | 2.0 wide | 0 → 1.2, 23.2° | — | From the Gate Terrace |
| Ticket Hall queue step | x 7.4 … 10.0, z −46.0 … −47.2 | 2.6 × 1.2 | 0.6 | — | A two-step way up from the plaza |
| Ticket booth | x 8.2 … 10.0, z −40.0 … −42.0 | 1.8 × 2.0 | 3.7 | R | Cover on the hall |
| Luggage scale | x 2.6 … 3.8, z −39.3 … −40.3 | 1.2 × 1.0 | 2.4 (1.2 above) | — | Cover on the hall's north half |
| Turnstiles ×2 | x 8.0…8.6 and 9.2…9.8, z −45.1 … −45.7 | 0.6 × 0.6 each | 2.2 | — | Cover over the queue step |
| Ticket Hall canopy | glass on 4 columns 0.5² at (3.0, −39.3), (9.7, −39.3), (3.0, −45.7), (9.7, −45.7) | 7.7 × 7.4 | columns 6.6; canopy 6.6–6.8 | R | Sun shade; 5.4 m over the hall top |
| **Pump Hall** (blade-aligned) | s 1 … 21, w 6.5 → the east edge | open on its west side | 0; sawtooth roof 7.0–8.2 | roof R | The left flank's back-of-house shed. The roof is cantilevered from the back wall on a riveted truss along w 6.5, carried by the gatehouse at its north end and one truss column at its south end: (s 21, w 9.0) = (18.29, −46.19), Ø 0.6, top 7.0, R. Tower checkpoint 1 is in its open side |
| Pump Hall back wall | on the east edge, from the ring (r ≥ 32.5) to s 21, in three bays: s ≈ 4.2 … 10 at w 18.9…19.5; s 10 … 19 at w 17.4…18.0; s 19 … 21 at w 15.9…16.5; 1.5 m returns at the jogs | 0.6 thick | 7.0 | R | The blade's leading edge; a 12 m Deco vent stack with "GA" behind the middle bay as scenery |
| Filter bund | s 8 … 24, w 13.0 → the back wall | ≈ 5 × 16 | 1.2 | — | High ground along the back wall (hop up anywhere) |
| Sand filters ×3 | (19.11, −33.59), (20.66, −37.89), (22.39, −42.09) | Ø 2.6 | 4.3 | R | Tall cover on the bund |
| Pump sets ×2 | x 17.05 … 18.55, z −40.0 … −42.0; x 18.45 … 19.95, z −44.6 … −46.6 | 1.5 × 2.0 | 1.0 | — | Low cover in the aisle |
| Crate stack ("SEA SALT 25 kg") | x 17.7 … 19.3, z −30.2 … −31.8 | 1.6 × 1.6 | 1.4 | — | Cover at the Service Gate |
| Forklift with a fish tank | x 16.5 … 18.5, z −51.5 … −54.5 | 2.0 × 3.0 | 2.2 | R | Cover where the Pump Hall opens onto the plaza |
| Gate Terrace bollard planters ×2 | (−8.5, −33.5), (11.0, −36.6) | Ø 1.8 | 1.3 | — | Cross-cover at both ends of the Gate Terrace |
| Ice-cream cart | x −6.2 … −4.8, z −39.0 … −40.5 | 1.4 × 1.5 | 1.4 | — | Cover at the terrace's foot |
| Tubeway post-box column | (−1.0, −39.8) | Ø 1.2 | 2.4 | R | Cover in the Gate Terrace's middle; the network map in enamel |
| Ticket-machine bank | x −0.7 … 1.7, z −34.8 … −35.6 | 2.4 × 0.8 | 1.5 | **notIn tower** | Cross-cover in front of the hall's wing mouth |
| **Penguin Point** rock terrace | s −16 … 13 from the penguin glass to w −10; s 13 … 21 from the glass to w −12; outside the ring; minus the Penguin Steps | ≈ 171 m² | 1.2 | — | The right flank in the wing |
| Penguin Point upper rock | s 13 … 21, from the glass to w −12; centre (−4.06, −54.47) | ≈ 38 m² | 2.4 | — | High ground over the plaza (hop up from the terrace; its south edge is a 2.4 m drop) |
| **Penguin glass** | on the blade's west edge in four bays: s −16 … −3 at w −17.0…−17.4; s −3 … 10 at w −17.8…−18.2; s 10 … 24 at w −17.0…−17.4; s 24 … 31 at w −16.6…−17.0; short returns at the jogs | 0.4 thick | **3.2** (s −16 … 7, beside the terrace), **4.4** (s 7 … 24, within 3 m of the upper rock and the ice pile), **2.6** (s 24 … 31, beside the queue terrace) | R, `paint:false` | Brass-framed acrylic in angled bays; ≥ 2.0 m above every standable surface within 3 m of it |
| Penguin cove | between the glass and a curved shore from w −20.0 at its ends to −22.5 at s 7.5 | — | 0.3 (scenery: rocks, a pool, the colony) | R | Out of bounds: anyone who lands there by a special slides off into the sea |
| Keeper's hut | s −1 … 1, w −16.6 … −14.6; (−13.51, −40.30) | 2.0 × 2.0 | 3.9 | R | Cover on the terrace |
| Feeding-bucket rack | x −9.6 … −8.4, z −45.4 … −46.6 | 1.2 × 1.2 | 2.4 | R | Cover on the terrace |
| Ice pile | x −7.7 … −6.3, z −47.8 … −49.2 | 1.4 × 1.4 | 2.2 (1.0 above) | — | Cover on the terrace |
| Basking rock | x −8.2 … −7.0, z −39.3 … −40.5 | 1.2 × 1.2 | 2.2 (1.0 above) | **notIn tower** | Cover on the terrace's broad north end |
| Rock outcrop | s 16 … 18, w −14.5 … −13.1; (−3.45, −54.12) | 1.4 × 2.0 | 3.6 | R | Cover on the upper rock |
| Penguin feeding chute | s 9 … 10.4, w −17.6 … −16.2; (−9.79, −49.35) | 1.4 × 1.4 | 2.6 | R | Dressing and cover at the glass |
| **Ferry plaza** (forecourt) | s 16.5 … 31, the rest of the blade | ≈ 600 m² | 0 | — | The ferry-terminal plaza between the Ticket Hall, Penguin Point and the pavilion |
| Queue terrace | s 25 … 30.6, from the glass to w −9; centre (2.64, −63.08) | 8 × 5.6 | 0.6 | — | The ferry queue: relief on the plaza's west side, stepped on its open sides |
| Ferry-ticket kiosk | s 28.2 … 30.2, w −15.8 … −13.8; (1.78, −65.19) | 2.0 × 2.0 | 3.0 | R | Cover on the queue terrace |
| Luggage trolleys | s 25.6 … 26.8, w −13 … −11; (2.71, −61.19) | 2.0 × 1.2 | 2.0 (1.4 above the terrace) | — | Cover on the queue terrace |
| Whale-tail bench | x −2.5 … 0.5, z −57.4 … −58.6 | 3.0 × 1.2 | 1.2 | — | Cover at the foot of the upper rock |
| Timetable pillar | x 4.4 … 5.6, z −57.0 … −58.2 | 1.2 × 1.2 | 2.2 | R | Cover beside the Gate's circle |
| Fish topiary planter | (11.0, −57.6) | Ø 2.0 | 1.2 | — | **Apron block** 1: 0.5 m off route 1 (§4.4) |
| Luggage-trolley stack | s 27.9 … 29.1, w −7.8 … −5.8; (8.36, −60.58) | 2.0 × 1.2 | 1.4 | — | **Apron block** 2: 3.8 m off route 1 |
| Queue-barrier planter | s 28.1 … 28.9, w 0.8 … 3.2; (15.98, −56.18) | 2.4 × 0.8 | 1.3 | — | **Apron block** 3: 2.2 m off route 1 |
| Luggage trolley | x 6.2 … 8.2, z −51.3 … −52.3 | 2.0 × 1.0 | 1.4 | **notIn tower** | Cover between the Ticket Hall and the Gate |
| Souvenir kiosk | s 28.2 … 30.7, w 6 … 8.5; (21.00, −54.38) | 2.5 × 2.5 | 2.6 | R | Cover in front of the pavilion's east stair |
| Tank-delivery crate stack | s 28.7 … 30.5, w 13.4 … 15.2; (27.18, −50.98) | 1.8 × 1.8 | 1.6 | — | Cover beside the Express's mouth |
| **Express stop, Ferry Plaza** (IN) | s 22.2 … 26.0, w 10.8 … 13.2; (22.44, −47.37) | 2.4 × 3.8 | 3.0 | R | The Express's brass bell and intake fan; its mouth at (23.39, 0.8, −49.02) faces the plaza; the riser stands on it in open air to 10.3 |
| **Express stop, Penguin Point** (OUT) | s −6.0 … −1.4, w −16.2 … −13.8; (−14.84, −36.80) | 2.4 × 4.6 | 5.0 | R | The Express's flap; its mouth at (−15.99, 2.0, −34.80) faces the Penguin Steps; the drop comes down into it from 10.3 |
| **Fin Pavilion spawn deck** | s 31 → its curved back (s = 41 + 2 (1 − (w/16)²), apex s 43), w −13 … 13; centre (18.00, −63.68) | 26 × 10–12 | **3.4** | — | Spawn; **pad (18.0, 3.4, −63.68)**, barrier 4.2. Its front (s 31) is a 0.3 m glass-block fascia, `paint:false`: a 3.4 m one-way drop (a `nav` drop edge) |
| Deck planters ×2 | s 34 … 36, w ±9.5 … ±11.5; (26.59, −57.56), (8.41, −68.06) | 2.0 × 2.0 | 4.5 (1.1 above) | — | Cover on the deck's flanks, outside the barrier |
| Pavilion stairs E / W | s 31 → 39.6 along the deck's flanks, w 13 … 16 / −16 … −13; centres (30.21, −55.82), (5.09, −70.32); landings s 39.6 → the back curve | 3.0 wide, run 8.6 | 0 → 3.4, 21.6° | — | Spawn exits 2 and 3: they descend **toward mid**, beside the deck, and end on the plaza at the deck's front corners |
| Fin tower | s 43 … 46.5, w −3 … 3; (22.37, −71.25) | 6 × 3.5 | 18.0 | R | Vertical neon AQUARIUM; the base's landmark |
| Sea rails | the deck's back curve and the stair landings; the stairs' outer sides (w ±16 … ±16.3); the plaza's east edge (s 21 … 31, w 16.5 … 16.8) | 0.3 | 1.0 | rail | Every sea edge a player can reach on foot is railed |

### 2.5 Spawn, depth and spawn to mid

- **Pad (18.0, 3.4, −63.68)**; Bravo's (−18.0, 3.4, 63.68). Straight line to mid: 66.2 m. Three exits (three `nav` ways
  off the deck, checker #13): the front drop (3.4 m, one-way) and the east and west pavilion stairs. 10–12 m of deck,
  then the ferry plaza (14 m deep) with cover, then the Ticket Hall and Penguin Point: about 32 m of depth to re-form
  before the Gate Terrace.
- **Spawn to mid, measured on the plan** (nav-style 0.5 m grid, jumps ≤ 1.25 m, drops ≤ 3.4 m, to the deck centre, which
  is what `spawn-mid.js` reads: the lowest valid node within 2 m of mid):

| route | length | swim at 11.8 m/s |
|---|---|---|
| **Shortest** (front drop → plaza → west lane past the Ticket Hall → Gate Terrace → Shark Arch → court → Feeding Step S → deck) | **71.6 m** | **6.06 s** (the Long Stages target is 6 s) |
| Centre forced through the hall's middle | 73.0 m | 6.19 s |
| Left: east stair → Pump Hall → Service Gate → SE Reef Hall → deck SE ramp | 72.2 m | 6.12 s |
| Right: west stair → Penguin Point → Penguin Steps → SW Sea Promenade → deck SW stair | 93.5 m (the promenade's middle at 62.8 m, 5.32 s) | 7.93 s |

  The swept blade makes the left flank as short as the centre and the right flank the long, high one. No pipe shortens
  spawn-to-mid: the fastest route with one pipe takes 8.23 s (through the Express), so engine rule 27 holds at 6.06 s.

### 2.6 Lanes, flanks and where they meet mid (Alpha's view)

| lane | height | character | meets mid at |
|---|---|---|---|
| **Centre**: ferry plaza → past (or over) the Ticket Hall → Gate Terrace → **Shark Arch hall** | 0 / 1.2 / 0 | the plaza swings round the Ticket Hall at the blade's knuckle, then the 12 m glass tunnel, two lanes round the bubble column; close quarters inside, open at both mouths | the court's south band, between the gantry legs, at the Feeding Step |
| **Left (low)**: Pump Hall → Service Gate → **SE Reef Hall** | 0 | covered and close: the shed's open side, the bund over it, then canopy, colonnade and the reef window; the side zone; Tubeway stops | the SE quadrant (deck SE ramp, diving helmet) and the E gulper; on up the Kelp Ramp to Bravo's promenade |
| **Right (high)**: Penguin Point → Penguin Steps → **SW Sea Promenade** | 1.2 / 2.4 | open and long: the penguins behind glass, then the sea at your back, sightlines over the court and the deck, the Lookout | the SW (grand stair, deck SW stair) and the W drum; on down the W Kelp Ramp into Bravo's NW arcade |
| Inner links | 0 / 1.2 | the hall's east door to the arcade; the Gate Terrace to Penguin Point (a 1.2 hop) and to the Pump Hall; the court's two sides round the deck | — |
| Pipes | — | the Arch Line (your arcade ⇄ your promenade), the Kelp Lines (into their flank), the Gulper Run (east ⇄ west under mid), the Express (your plaza ▶ your Penguin Point) | — |

So each half has a centre lane and two flank routes that meet mid at four different points (S, SE/E, SW/W, and the arch's
east door into the SE), plus four pipes. The flanks leave the wing through a 4.8 m Service Gate and a 5 m stair, and the
Gate Terrace links all three lanes just outside the gatehouse. Each team's low flank meets the other team's high flank at
a kelp drum: they have the height, you have the Kelp Ramp and (half the time) the Kelp Line.

**Sightlines.** The bubble column and the gatehouse block every line from the spawn and the Ticket Hall to the deck. The
promenades (2.4) see the deck (2.4) at 14 m and the court; the Lookouts (3.6) look down onto the deck rim from 14–17 m. The
deck sees everything in the court within 27 m. The Kelp Balcony (3.6) sees its promenade (the drum hides the court). Close
quarters: the hall, the Pump Hall, the arcade under its canopy. Mid range: the court, the plaza. Long: the promenades, the
Lookouts and the deck rim; in the wing, the upper rock down the plaza.

**Weapon homes.** Chargers, bows, spinners: the promenades and Lookouts, the deck rim, the upper rock and the bund. Shooters,
twins, brollies: the court, the arcades and the plaza. Rollers, brushes, blades, mitts, blasters: the hall, the Pump
Hall, pipe exits, the deck's six ways up. Buckets: over the deck rim, the balustrades, the bund and the Ticket Hall.

**Callouts** (fixed per half; the South is Alpha's at launch): Deck, Glass Walk, Bathysphere, East/West Gulper,
South/North Arch, Reef Hall, Promenade, Lookout, Kelp Drum East/West, Balcony, Gate Terrace, Ticket Hall, Pump Hall,
Penguin Point, Upper Rock, Plaza, Fin.

### 2.7 Cover (measured on the plan, Turf War build)

Cover = anything ≥ 0.9 m above the floor next to it (a solid piece or a higher floor's face), the same rule as
`tools/botlab/tests/cover-map.js`; rails do not count.
- **96.3 % of all floor within 5 m of cover**; **100 %** leaving out the deck top (the zone), the spawn decks and the
  stairs and ramps.
- By area: court 99.9 % (worst point 5.0 m), arcades 100 % (4.3), promenades 100 % (3.6), halls 100 % (5.0), the wing
  floor 100 % (4.7), Ticket Hall top 100 % (2.9), Penguin Point 100 % (4.0), deck 100 % (4.0); only the spawn decks
  (68 %, the barrier's open ring) fall short.
- **Largest open circle: r 5.0 m**, in two places: the court's south band between the Feeding Step and the hall mouth
  (the tower's first run), and the weir's spot in the hall (which the SPEC wants clear for 3 m). Nothing else reaches
  5.0 m; most of the stage is within 3 m.
- Tower Command removes the three `notIn tower` pieces (99.2 % outside the deck top, spawn decks and stairs); there the
  plaza behind the Ticket Hall and the Gate Terrace's middle open to circles of r 5.9 and 5.7 m, which the tower itself
  crosses.

---

## 3. The gimmick: the Tubeway

### 3.1 The network: three kinds of pipe, seven legs, fourteen mouths

| leg | kind | ends (Alpha's half; twins turned) | length | ride | door to door | what it does |
|---|---|---|---|---|---|---|
| **Gulper Run** (`gulper`, single) | **two-way** ⇄ | East Gulper jaws (12.7, 0.8, 0), facing +x ⇄ West Gulper jaws (−12.7, 0.8, 0), facing −x | 25.4 m at 18 m/s | 1.41 s | 2.16 s | Straight through the Great Tank under the Glass Walk, among the sharks: switch sides of the court under mid, untouchable |
| **Arch Line** (`arch`, + twin) | **two-way** ⇄ | South Reef Hall mouth on the east pylon (9.58, 0.8, −26.31), facing (0.94, 0, 0.34) ⇄ South Promenade mouth on the west pylon (−9.58, 3.2, −26.31), facing (−0.94, 0, 0.34) | 27.4 m at 18 m/s | 1.52 s | 2.27 s | Up a glazed shaft, through the Arch Tank over your own shark tunnel, down the other pylon: switch between your own low and high flank |
| **Express** (`express`, + twin) | **one-way** ▶ | IN: Ferry Plaza stop (23.39, 0.8, −49.02), facing (0.5, 0, −0.87) ▶ OUT: Penguin Point stop (−15.99, 2.0, −34.80), facing (−0.5, 0, 0.87) | 55.1 m at 24 m/s | 2.30 s | 3.05 s | Up 9 m beside the Pump Hall, high over the whole wing (the Ticket Hall, the Gate Terrace), down to the foot of the Penguin Steps: your base's left-to-right rotation and the head of your right flank in 3 s; the wing's open-air showpiece |
| **Kelp Line** (`kelp`, + twin) | **one-way, tidal** ▶ (§3.4) | A: South Reef Hall, the low Kelp stop in the E drum's foot (27.4, 0.8, −4.6), facing −z · B: North Promenade, the deep Kelp stop (18.94, 3.2, 21.03), facing the court | 41.8 m at 24 m/s | 1.74 s | 2.49 s | Straight up the middle of the kelp drum, over the Kelp Balcony and along the enemy promenade's outer half at 9.0 m. **UP**: from your arcade into their promenade. **DOWN**: from your promenade into their arcade |

Two-way legs: 3 (the Gulper Run and both Arch Lines). One-way legs: 4 (both Expresses, always the same way, and both
Kelp Lines, which turn with the tide). Total centreline **274.0 m**; 4 of the engine's 6 definitions, 14 of its 24 ends.

**Time saved, measured on the plan** (door to door against swimming the shortest walking route at 11.8 m/s; engine rule
26 asks for 0.35–1.0): Gulper **0.74** (walk 34.3 m round the deck; 0.72 on the nav graph); Arch **0.78**
promenade-ward and 0.87 arcade-ward (walk 34.4 / 30.7 m); Express **0.73** (walk 49.3 m); Kelp 0.92 UP and 0.88 DOWN
(walk 31.9 / 33.6 m). Three legs now save a fifth to a quarter of the swim on top of being untouchable; the Kelp Lines
save a tenth, because their walking twin, the Kelp Ramp, starts beside their A mouth (§3.5 and the Review log say why
that stays). The walking routes stay the main routes; nothing a pipe reaches is out of walking reach.

**Where you can see a rider.** Of the 274 m, about 148 m (54 %) is clear tube in open air (the Kelp Lines' and the
Expresses' overhead runs and risers), 79 m (29 %) runs inside a tank or a glazed shaft where it is lit and seen (the
Gulper Run in the Great Tank, the Arch Lines in the Arch Tank and their glazed risers, the Kelp Lines up the kelp drums),
and 47 m (17 %) is hidden in housings, the bronze heads and the pylons' end runs. §5.4 sets how the tanks keep riders
visible, and §6.2 tests it from 15 m and 30 m.

Why these and not more: every leg has one job a walking route cannot do, every mouth sits in a wall, a housing or a
tank (never on a through-route), no landing is within 22 m of a spawn pad (nearest 38.8 m), the only IN end within 22 m
of a pad (the Express's, 15.6 m) is one-way and leads away from it, no end or landing is within 3 m of a zone or 15 m of
a Gate (nearest 16.1 m), and the network stays under every engine budget. The concepts' extras were cut: junctions (E1:
moderate risk, and every junction we drew landed on an objective), bomb mail (not supportable online), a spawn express
into mid (rule 27), and a two-way leg straight across a wing (a 25–30 m crossing of a 33 m blade rides at 1.0–1.2 of
walking it, which rule 26 forbids; the Express crosses diagonally, 55 m, at 0.73).

### 3.2 The rules of riding (the engine core, unchanged; ENGINE.md §3.5)

- **Who rides:** any kid or squid of either team, by moving into an open IN mouth (`enter: 'any'`). Pushing in for 0.08 s
  captures; strafing past, standing beside or shooting near a mouth never does. Mouths are set into walls, tanks and
  housings, never on a through-route.
- **Who is refused:** the Bazookarp carrier on every leg ("Can't ride with the Bazookarp": the Bazookarp is too big for
  the Tubeway), anyone in a body-owning special, anyone super jumping or dead, at an OUT end ("One way: this end is the
  exit") or a sealed end ("Closed: the Kelp Lines are turning"), and within the 2.5 s cooldown. Bombs, shots, devices and
  the tower never ride: they bounce or splash on the glass like on any wall.
- **Suck:** 0.25 s, drawn into the bell as a squid. **Can be hit**; splatted there, the ride is cancelled.
- **Ride:** constant speed along the centreline (18 m/s; the Express and the Kelp Lines 24). **Untouchable**: the glass
  stops shots and blasts and the damage guard backs it. Riders can't act. Any number ride; opposite riders pass side by
  side.
- **Telegraph:** the exit mouth's ring lights in the rider's team colour for the whole ride; the glass glows in the
  rider's colour round them with a 6 m trail (and on the Glass Walk over the Gulper Run); a two-note chime plays at the
  exit 1.0 s before the pop (heard within 30 m). The rider is a revealed actor: a dot moving along the line on everyone's
  minimap.
- **Pop:** 6.5 m/s out + 6.0 up, landing ≈ 3.1 m out; steer ±45° with the stick held in the last 0.5 s; jump held gives a
  high pop (≈ 3.8 m). Shielded while airborne (≤ 0.8 s), no firing until touchdown; touchdown paints a 1.2 m splat of the
  rider's ink (turf, but no special charge). A second rider popping from the same mouth within 0.4 s fans 30° aside.
- **Cooldown:** 2.5 s from touchdown before any mouth takes that player again (a ring on the ink tank).

### 3.3 How each kind reads (shapes first, never team hues)

| | two-way (Gulper Run, Arch Lines) | one-way (Express) | one-way tidal (Kelp Lines) |
|---|---|---|---|
| mouths | both ends identical: the Gulper's bronze jaws / a brass bell with a "⇄" enamel plate; a still white ring light | **IN**: a brass bell with an intake fan turning behind its grille, a lit floor arrow into it, an enamel roundel "▶ IN". **OUT**: a shut glass check-valve flap, dark ring, roundel "OUT ONLY". Walking into the flap is walking into glass | as the Express, but the roundels are split-flap signs "▲ UP · IN" / "▼ DOWN · IN" / "EXIT ONLY" that riffle and change with the tide |
| glass | clear, brass collars every 3 m | clear, green-painted steel collars and a strip of frosted chevrons along the underside, lit in sequence IN → OUT all the time | as the Express; the chevrons reverse with the tide |
| lights inside | chevrons light only while someone rides, flowing their way | chevrons always run IN → OUT; bubbles stream with the flow | chevrons always run with the tide; bubbles stream with the flow |
| minimap / TAB map | thin pale line, a dot at each end | thin pale line with moving arrowheads | as the Express; the arrowheads flip with the tide; dashed while sealed |

The tide is shown five ways at once: the split-flap signs and the fan/flap swapping ends, the chevrons, the kelp in the
drum (fronds streaming up on UP, down on DOWN), the **Tide Gauge** dials (two per gatehouse on its crest at x ±4.5,
centre 10.8 m, Ø 2.4 brass, double-faced to the court and the wing: a needle between ▲ UP and ▼ DOWN with a 10 s red
countdown sector; the pads' eye lines to the bathysphere pass over the pylons at x ±8.5, clear of the dials), and the HUD.
The Express never changes, so a player learns it once: a fan means "in", a flap means "out".

### 3.4 The schedule (ENGINE.md extension E2, a pure function of the stage clock)

The Kelp Lines flip **every 90 s of play, starting UP**. Both twins always run the same way, so at every instant each
team has exactly one Kelp Line into the enemy half (UP: up its left; DOWN: down its right). The Gulper Run, the Arch
Lines and the Expresses never change.

| mode | Kelp Lines (seconds of play) | notes |
|---|---|---|
| Turf War (180 s) | UP 0–90 · DOWN 90–180 | one flip at 1:30 left: the half-time swing |
| Zone Control, Tower Command, Bazookarp (300 s + overtime) | UP 0–90 · DOWN 90–180 · UP 180–270 · DOWN 270 → end | the flip at 270 s (0:30 left) is allowed; nothing changes in the last 15 s or in overtime (it holds) |
| Boss Battle | every 90 s on the stage clock | |
| Practice / online Practice | every 90 s on the host's stage clock (NetMatch sends it, ENGINE.md H10e) | |

Each flip, in order:
- **T − 10 s:** PA hoot (two tones) at both drums; HUD line "KELP LINES GOING DOWN IN 10" (or UP) with a countdown, in
  the bottom-middle line the stage HUD uses; the Tide Gauges' red sector starts; chevrons strobe and slow; the split-flap
  signs start to riffle.
- **T − 3 s:** the IN ends close (fans spin down, ring lights go dark, the flap clunks). Riders already inside finish the
  old way (the longest Kelp ride is 1.74 s). Bots replan off the closed edge.
- **T:** a deep pneumatic **WHUMP**, a curtain of bubbles roars through both drums and the kelp swings round; the
  split-flaps clatter to their new words; fans and flaps swap ends; the chevrons run the other way; the minimap arrows flip.
- **T + 1 s:** the new IN ends open. HUD: "KELP LINES DOWN: dive from your promenade" (or "UP: lift from your Reef Hall").
- Match start: the first line reads "TUBEWAY: walk into a pipe to ride · ⇄ both ways · ▶ one way · Kelp Lines UP".

**Feeding Time (looks only).** At 1:00 left in every timed mode (in Boss Battle when the boss enters phase 3) the winch
bobs the bathysphere half a metre and rings its bell three times, a krill cloud drifts down into the Great Tank and the
sharks wheel under the Glass Walk. It changes no rule.

### 3.5 What both teams do with it

- **Gulper Run:** swap court sides under the deck in 2.2 s; escape a lost fight at the deck's foot; outflank the side of
  the deck the enemy is holding. Everyone on the deck sees the rider streak along the Glass Walk, and the exit glows, so
  the other side can meet you.
- **Arch Line:** move between your own Reef Hall and your own promenade without crossing the court: defend the side zone
  from the promenade and drop back into it; reinforce your right when they come up the W Kelp Ramp. Seen through the
  glazed risers from the hall and the Gate Terrace and through the Arch Tank from the court.
- **Express:** a defender on the plaza's left gets to the foot of the Penguin Steps in 3 s (walking: 4.2 s), so a
  Bazookarp or Tower defence can switch sides of its base, and a team pushing its right flank can reinforce it. An
  attacker who has broken into the enemy plaza can ride it too, but it carries them out of the base, toward their own
  side, past nothing the defenders need.
- **Kelp Line UP (your left):** lift from your Reef Hall into the middle of their promenade, behind its balustrade and
  past the Kelp Ramp's head where they wait.
- **Kelp Line DOWN (your right):** from your own promenade, dive into their Reef Hall next to their side zone.
- **Exit camping** is a real, two-sided fight: the exit is public for the whole ride, every landing has cover within
  3 m and two ways off, the rider can steer or high-pop, is shielded until touchdown and lands in their own ink.

### 3.6 Fairness rules (each one a test, §6)

1. **Symmetry at every moment:** twins change on the same stage-clock tick; the Gulper Run is self-symmetric.
2. **Announced:** the same 90 s rhythm all match, 10 s of warning, five world/HUD cues, sounds. The Express never changes.
3. **Nothing appears, nothing moves, nobody is trapped:** the flip changes flow, lights and flaps, never geometry; IN ends
   close 3 s before a flip and every ride finishes; no ride lasts more than 2.30 s.
4. **No hidden shortcut:** no landing within 22 m of a pad or 15 m of a Gate; the one IN end within 22 m of a pad leads
   away from it; carriers refused everywhere.
5. **Pipes never the only way:** every end is walkable both ways with pipes shut; spawn-to-mid is unchanged by pipes.
6. **Exits:** cover ≥ 1.0 m within 3 m of every landing, two walking ways off at ≥ 90°; every IN mouth seen from at least
   90 % of the floor 2–6 m in front of it and from at least 10 points 10 m or more away (ENGINE.md rule 13, restated).

### 3.7 Ink, players and devices

- Pipes, mouths, housings, tank and drum glass are never inked (glass beads a white splash that runs off in 1 s, looks
  only). The floor round every mouth inks normally; inking the enemy's approach slows their squids, which is honest
  counterplay. The Glass Walk is ordinary inkable floor; a rider's glow is drawn over its ink.
- The pop splat (1.2 m) is real turf. The flip covers, removes and reveals no floor. Turf is counted as on any stage.
- Players: riders run no physics; nobody is ever shoved by a pipe; at match end riders finish and pop.
- Devices (sprinkler, beacon, curtain, buoy, mines, the turret) are placed as anywhere and can be shot (batch-5
  `deploy`). Sprinklers and beacons are not body colliders, so one placed in a mouth does not block it. A Drip Curtain
  across an IN mouth stops enemies walking into it as it stops them anywhere; it never pushes a rider: riders in any
  phase skip the curtain's shove (ENGINE.md H18), so a curtain across an OUT end cannot throw a pop back against the
  flap. Nothing enters a pipe.

### 3.8 Bots (ENGINE.md §4.3)

Each IN → OUT pair is a typed `'pipe'` nav edge (cost (0.25 + L/v + 0.5) × 6 + 2: Gulper 15.0, Arch 15.6, Kelp 16.9,
Express 20.3). A tidal leg gives both directed edges at load and `pipeShut` masks the closed one, so a flip only toggles
bits. On this stage A*'s straight-line heuristic is scaled by 0.45 (the cheapest pipe's cost ÷ the straight distance it
spans), so A* never skips a pipe it should take. A* takes pipes when they are cheaper, including in retreat. A flip shuts
and reopens Kelp edges with replanning (the movers' pattern). Exit danger comes only from what the bot itself saw near the
landing (no wall-hacks); an enemy rider is treated like a super-jump landing (memory and aim at the landing). Carrier bots
never plan through a pipe. Stage-specific tactic weights (step 9b): a bot holding its side zone prefers the Arch Line to
reach the promenade; in DOWN phases a bot on its promenade whose goal is in the enemy's Reef Hall takes the Kelp Line; a
defending bot on its plaza whose goal is on its right flank takes the Express.

### 3.9 Online

Per ENGINE.md: each ride sends two records and one tick flag bit, and every screen draws the rider exactly on the path
from the entry record. The tide is a pure function of the stage clock (host clock in matches, NetMatch's stage clock in
online Practice), so a late joiner and a new host see the same direction.

### 3.10 The data (ENGINE.md §3.3 format)

```js
// src/world/stages/aquarium/layout.js
pipes: {
  label: 'TUBEWAY',              // the HUD's name for the network (≤ 14 characters)
  mirror: true,                  // every leg gets its 180° twin (id + '~'), except `single: true` legs
  enter: 'any',                  // 'any' (kid or squid) | 'squid' (a kid bumps the mouth like a wall)
  speed: 18,                     // m/s, the default for every leg (12–24)
  cooldown: 2.5,                 // s (1.5–4)
  modes: {                       // per match mode; omitted = every leg as listed
    bazookarp: { shut: [], carp: [] },   // nothing shut (no end within 15 m of a Gate); carriers refused on every leg
    boss: 'open',                // 'open' | 'off' (every leg shut, still drawn and solid)
  },
  water: [                       // optional, looks only: volumes where the ride camera gets the underwater grade
    { cyl: [0, 0, 7.4], y: [-0.6, 2.3] },                    // the Great Tank, down to its sunken sand bed (its own twin)
    { cyl: [25, 0, 4.4], y: [0, 9.9] },                      // the E kelp drum (twin: the W drum)
    { box: [-5.9, 5.9, -30.9, -19.1], y: [6.05, 8.95] },     // the South Arch Tank over the hall (twin: the North)
  ],
  legs: [
    { id: 'gulper', way: 'two', single: true, bend: 2.0,    // the Gulper Run, through the Great Tank under the deck
      names: ['EAST GULPER', 'WEST GULPER'],                  // A's, B's (≤ 14 characters each); "→ WEST GULPER" shown at A
      pts: [[12.7, 0.8, 0], [9.6, 0.8, 0], [7.6, 0.5, 0], [-7.6, 0.5, 0], [-9.6, 0.8, 0], [-12.7, 0.8, 0]],
      ends: [{ nozzle: 'level' }, { nozzle: 'level' }],
      hide: [[0, 5.2], [20.2, 25.4]],                         // inside the bronze heads and necks (x 7.5…12.7)
      look: { tint: 'clear', collars: 'brass', mouth: 'gulper', deckLight: [-7.5, 7.5, -1.2, 1.2, 2.4] } },
    { id: 'arch', way: 'two', bend: 1.8,                     // the Arch Line, through the Arch Tank over the hall
      names: ['S. REEF HALL', 'S. PROMENADE'],
      twinNames: ['N. REEF HALL', 'N. PROMENADE'],
      pts: [[9.58, 0.8, -26.31], [7.32, 0.8, -27.13], [7.32, 7.5, -27.13], [-7.32, 7.5, -27.13],
            [-7.32, 3.2, -27.13], [-9.58, 3.2, -26.31]],
      ends: [{ nozzle: 'level' }, { nozzle: 'level' }],
      hide: [[0, 2.0], [25.4, 27.4]],                         // the end runs inside the pylons (the risers are glazed: drawn)
      look: { tint: 'clear', collars: 'brass' } },
    { id: 'express', way: 'one', speed: 24, bend: 2.7,        // the Express, across the wing high over the Ticket Hall
      names: ['FERRY PLAZA', 'PENGUIN POINT'],
      pts: [[23.39, 0.8, -49.02], [21.69, 0.8, -46.07], [21.69, 9.4, -46.07], [-14.29, 9.4, -37.75],
            [-14.29, 2.0, -37.75], [-15.99, 2.0, -34.8]],
      ends: [{ nozzle: 'level' }, { nozzle: 'level' }],
      hide: [[0, 4.4], [49.9, 55.1]],                         // inside the two Express stops
      look: { tint: 'clear', collars: 'steel', chevrons: true } },
    { id: 'kelp', speed: 24, bend: 2.7,                       // the Kelp Line, up the E drum, along the North Promenade
      way: { flip: { every: 90, first: 'ab', warn: 10, close: 3, reopen: 1, quietEnd: 15 } },   // the tide (E2)
      names: ['S. REEF HALL', 'N. PROMENADE'],
      twinNames: ['N. REEF HALL', 'S. PROMENADE'],
      pts: [[27.4, 0.8, -4.6], [27.4, 0.8, -1.2], [27.4, 9.0, -1.2], [21.28, 9.0, 23.63],
            [21.28, 3.2, 23.63], [18.94, 3.2, 21.03]],
      ends: [{ nozzle: 'level' }, { nozzle: 'level' }],
      hide: [[0, 0.8], [37.7, 41.8]],                         // the low stop's frame; the deep stop's housing
      look: { tint: 'clear', collars: 'steel', chevrons: true } },   // tidal: the engine adds the split-flap signs
  ],
},
```

Numbers this produces (ENGINE.md §3.3 table): landing points (15.8, 0, 0) / (−15.8, 0, 0); (12.49, 0, −25.25) /
(−12.49, 2.4, −25.25); the Express B landing (−17.54, 1.2, −32.11); Kelp A landing (27.4, 0, −7.7), Kelp B landing
(16.87, 2.4, 18.73). Run margins (each run against its fillets' need): every run ≥ 0.1 m, the Kelp Line's drop and end
run 0.3 m. About 160 collider pieces (with ENGINE.md's `arcPiece: 1.2` for this stage; budget 200).

### 3.11 The objective overlay (Alpha's half and mid)

`Z` centre zone · `z` Alpha's side zone · `+` pipe glass in plan (overhead runs included) · `g` Gulper mouths ·
`a` Arch Line mouths · `L` / `U` a Kelp Line's low (A) and deep (B) mouths · `E` / `X` the Express's IN and OUT mouths.
The Kelp Line rising from the E drum runs off the bottom edge of this drawing to its deep mouth on Bravo's promenade; the
one drawn arriving at Alpha's promenade (`U` near (−19, −21)) is Bravo's, from the W drum. Alpha's Express runs from `E`
on the plaza's east side, high over the Ticket Hall, to `X` at the foot of the Penguin Steps.

```
   x = -36       -26       -16       -6        4         14        24        34
               |         |         |         |         |         |         |
    -78  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    -76  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~:::::~~~~~~~~~~~~~~~~~~~~~~~~~~
    -74  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~::/333:::::~~~~###~~~~~~~~~~~~~~
    -72  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~:://33333333:::########~~~~~~~~~~
    -70  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~P~~~~:///3p33333333333######~~~~~~~~~~~
    -68  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPP:///3ppp3333333333333##::~~~~~~~~~~
    -66  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPqqq.3333p3333333333333333:::~~~~~~~~
    -64  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPPvqqvvvv.333333333333333333333::~~~~~~
    -62  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPP.vvpppvv.p...33333333333333333333::~~~
    -60  ~~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPP......pvv..pp.....3333333333333333/33:~~
    -58  ~~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPP22bbb....p....ppp......3333333ppp3///::~~
    -56  ~~~~~~~~~~~~~~~~~~~~~~~~PPPPPPP22222...........p...ppp..qqq333pp3///::~~~
    -54  ~~~~~~~~~~~~~~~~~~~~~~PPPPPPPP22rr2..................pp.qqq..333///:~~~~~
    -52  ~~~~~~~~~~~~~~~~~~~~~PPPPPPPP22222........ppp........pp........pp/:~~~~~~
    -50  ~~~~~~~~~~~~~~~~~~~~PPPPPPpp1111..........................kEE.ppp::~~~~~~
    -48  ~~~~~~~~~~~~~~~~~~~PPPPPPPp11p1111.......................kkkk...::~~~~~~~
    -46  ~~~~~~~~~~~~~~~~~~PPPPPP111p1111......1o1111--o......++p++kk1..:~~~~~~~~~
    -44  ~~~~~~~~~~~~~~~~~PPPPPP11111111.......1111111+++++++++.pp.FF1.:~~~~~~~~~~
    -42  ~~~~~~~~~~~~~~~~PPPPPPqq111111......++++++++qqq......pp..FFF#:~~~~~~~~~~~
    -40  ~~~~~~~~~~~~~~~PPPPPPkqq111+x+p++++p+.1op111qqq......pp11111##~~~~~~~~~~~
    -38  ~~~~~~~~~~~~~~PPPPPPkkk+++++................//.p......11FFF##~~~~~~~~~~~~
    -36  ~~~~~~~~~~~~~PPPPPPkkkk1111.........pp........ppp....111FF##~~~~~~~~~~~~~
    -34  ~~~~~~~~~~~~~PPPPP11Xk111..pp.......................11FFF##~~~~~~~~~~~~~~
    -32  ~~~~~~~~~~~~PPPPP1111111...pp.........................FF###~~~~~~~~~~~~~~
    -30  ~~~~~~~~~~~PPPPP111///1..:#####........bbb#####wwww...pp##~~~~~~~~~~~~~~~
    -28  ~~~~~~~~~~~PPPP11//////::2####++++++++++++#####wwww....##~~~~~~~~~~~~~~~~
    -26  ~~~~~~~~~~~~~~~k11:2222222aa###...........###aa........#w~~~~~~~~~~~~~~~~
    -24  ~~~~~~~~~~~~~kkkk:22qqqq222####...........####........wwwww~~~~~~~~~~~~~~
    -22  ~~~~~~~~~~~~~:+kkUk22qqq2222###....OOO...........cc.zzz..wwww~~~~~~~~~~~~
    -20  ~~~~~~~~~~~:::+2kk22222222222##.....O.....##,....cczzzzzz..wwww~~~~~~~~~~
    -18  ~~~~~~~~~~::e++222222222===.pp...........JJJJo....zzzzczzzz.wwww~~~~~~~~~
    -16  ~~~~~~~~~::eqqqq22L222==nTTTTT...........JJJJ....oozzzzzzzzz..www~~~~~~~~
    -14  ~~~~~~~~:22e++qqLLL==...nTTTTT.......................zzzzzczz..www~~~~~~~
    -12  ~~~~~~~:2xx2+22222==/...........HH.....HH...........,ozzzzzzz...www~~~~~~
    -10  ~~~~~~::2xx++2222///////...//...HH1111.HH..///..........z.......,www~~~~~
     -8  ~~~~~~:2222+2222=//////.../////.,,1111.,.//////.nMnn...o.........www~~~~~
     -6  ~~~~~:2BBB++////=..///......////DDDDZDDpp////...MMMn..../////.....www~~~~
     -4  ~~~~##BBKKKKKKK=//.JJJ......,.pDZZZZZZZZZDp,.....M.....///KKKKKLL.www~~~~
     -2  ~~~~###KKKKKKKKK///JJJ..GGG,,DDZxZZZZZZZZZDD,.GGG.....///KKKKKKKKK###~~~~
      0  ~~~~###KKKKKKKKK///....ggGGGG+ZZZZZZZZZZZZZ+GGGGgg....///KKKKKKKKK###~~~~
      2  ~~~~###KKKKKKKKK//......GGG.,DDZxZZZZZZxxZD,,.GGG..JJJ///KKKKKKKKK###~~~~
      4  ~~~~www.LLKKKKK//....nnMn..../pDZZZZZZZZZDp........JJJ.//=KKKKKKKBB##~~~~
      6  ~~~~www,...////......nMMM../////ppDDZDDD/////......///..=////++BB22:~~~~~
      8  ~~~~~www........,o.....M.//////..,1111.,../////...//////=2222+2222:~~~~~~
```

---

## 4. Every mode

### 4.1 Turf War

The whole stage, all pipes, one flip at 1:30 left. **5,446 m²** of floor (the spawn decks included). The UP half rewards
pushing your left into their promenade; after the flip their divers come down into your Reef Hall, so a team that won the
first half on its left has to turn round. High ground is real paint: 784 m² at 2.4, 56 at 3.0, 50 at 3.6 and 608 at 3.4
(the spawn decks).

### 4.2 Zone Control

- **Centre: the Feeding Deck.** One zone, a 12-gon of radius 6.2 on (0, 0): **115.3 m²**, y0 2.2, y1 2.8.
  `poly: [[6.2, 0], [5.369, 3.1], [3.1, 5.369], [0, 6.2], [-3.1, 5.369], [-5.369, 3.1], [-6.2, 0], [-5.369, -3.1],
  [-3.1, -5.369], [0, -6.2], [3.1, -5.369], [5.369, -3.1]]`. Flat: the Glass Walk is part of the lid.
  - Cover inside: the four deck hatches (1.2 m, at r 4.4, turned along the rim); on its rim, the hoppers and pole racks.
  - Six ways in: two ramps, two stairs, two Feeding Steps.
  - High ground over it: both **Lookouts** (3.6, 1.2 above the deck) at 14–17 m and both promenades (2.4) at 14 m, so a
    team holding the deck is shot at from above on two sides. Nothing hangs lower than the bathysphere (10.65 m over the
    deck).
  - No pipe end within 6.5 m of it; the Gulper Run passes 1 m under the Glass Walk, in sight.
- **Side: Alpha's Reef Hall** (Bravo's is the 180° twin). The annular sector α −54°…−26°, r 21.6 → 28.5, y0 −0.2, y1 0.6:
  **84.4 m²**, 25 m from mid, 50.1 m on foot from Alpha's pad. Flat at 0 (the colonnade plinth ends at r 21.6, the kerb
  starts at r 29.3).
  `poly: [[16.75, -23.06], [18.32, -21.83], [19.8, -20.5], [21.18, -19.07], [22.46, -17.55], [23.63, -15.94],
  [24.68, -14.25], [25.62, -12.49], [19.41, -9.47], [18.71, -10.8], [17.91, -12.08], [17.02, -13.3], [16.05, -14.45],
  [15.0, -15.54], [13.88, -16.55], [12.7, -17.47]]`.
  - Cover inside: two coral sculptures (α −43°, −31°); the canopy shades its outer 3 m; two lamp columns stand on its
    inner edge.
  - Ways in (four sides): the whole court edge over the colonnade plinth (0.45, with four 0.22 steps); the arcade from
    the arch side (the hall's east door and the Arch Line's landing); the arcade from the drum side (the Kelp Ramp's foot
    and the Kelp Line's A mouth); the Service Gate from the Pump Hall (4.8 m wide, 7 m from the zone).
  - High ground over it: the deck rim (2.4) at 12–20 m and the Kelp Ramp's upper half.
  - Pipes and the zone: no end or landing within 3 m (nearest end 7.7 m, the Arch Line's A; nearest landing 4.7 m, the
    Arch Line's; the Kelp Line's A landing 5.1 m). In DOWN phases the enemy's dive lands 5.1 m from it; in UP phases the
    owner's lift leaves 7.9 m from it. When the live side zone and the tide line up, the HUD's tide line is the tell for
    both teams.
- The last 30 s and overtime are centre-only (the engine's rule); the tide's last change, at 0:30, falls on that lock.

### 4.3 Tower Command: "the Feeding Round"

The keepers' cart route: off the shark deck, through the shark tunnel, round the Pump Hall, back over the Ticket Hall,
past the penguins and across the plaza to the pavilion. Drawn on Bravo's half (Alpha's goal), centre → goal, on the
stage's square grid (`yaw: 0`): the blade is swept 30°, so the track crosses it in square steps rather than along it,
two checkpoints. The data:

| # | from → to (x, z) | floor | length | notes |
|---|---|---|---|---|
| 1 | (0, 0) → (0, 13.5) | 2.4 → **drop** 1.2 at z ≈ 8.6 → **drop** 0 at z ≈ 11.0 | 13.5 | Off the deck over the Feeding Step N (4.0 wide, 2.6 deep: the platform sits wholly on it between the two drops); between the gantry legs (1.75 m each side). The drop points are where the platform's edge leaves each top (`tower.js` `baseAt`) |
| 2 | → (3.4, 13.5) | 0 | 3.4 | Into the North Arch hall's east lane line |
| 3 | → (3.4, 33.5) | 0 | 20.0 | Through the hall's east lane: bubble column 1.35 m off the west edge, wall 1.35 m off the east; ceiling 6.0; 1 m out of the wing mouth |
| 4 | → (−14.0, 33.5) | 0 | 17.4 | West along the Gate Terrace into the mouth of Bravo's Pump Hall (under its 7.0 roof) |
| 5 | → (−14.0, 50.0) | 0 | 16.5 | Down the Pump Hall's open side, between the bund and the Ticket Hall. **Checkpoint 1 at (−14.0, 44.0)**, s 64.8 m (44 %) |
| 6 | → (−6.0, 50.0) | 0 | 8.0 | East behind the Ticket Hall |
| 7 | → (−6.0, 37.0) | 0 → **climb** 1.2 at z ≈ 47.2 → **drop** 0 at z ≈ 37.8 | 13.0 | North over the Ticket Hall, back toward mid. **Checkpoint 2 at (−6.0, 40.0)**, s 88.8 m (60 %) |
| 8 | → (10.5, 37.0) | 0 → **climb** 1.2 at x ≈ 7.0 | 16.5 | East along the Gate Terrace's wing side and up onto Penguin Point |
| 9 | → (10.5, 42.5) | 1.2 | 5.5 | Along the rocks; the penguins watch through the glass (3.9 m away) |
| 10 | → (−0.5, 42.5) | 1.2 → **drop** 0 at x ≈ 3.75 | 11.0 | Off the rocks into the lane west of the Ticket Hall |
| 11 | → (−0.5, 53.5) | 0 | 11.0 | Down the lane to the plaza |
| 12 | → (−12.5, 53.5) | 0 | 12.0 | Across the plaza. **Goal (−12.5, 0, 53.5)**, 11.6 m from Bravo's pad, outside its barrier, 6.6 m in front of the spawn deck's front, seen from all of it |

```js
tower: {
  path: [[0, 2.4, 0], [0, 13.5], [3.4, 13.5], [3.4, 33.5], [-14.0, 33.5], [-14.0, 50.0], [-6.0, 50.0], [-6.0, 37.0],
         [10.5, 37.0], [10.5, 42.5], [-0.5, 42.5], [-0.5, 53.5], [-12.5, 53.5]],
  checkpoints: [[-14.0, 44.0], [-6.0, 40.0]],
  yaw: 0,
},
```

- **147.8 m** (two-checkpoint standard: 80 track points, speed 147.8 / 80 = 1.85 m/s, 100 s centre to goal with one
  rider). Six deliberate height changes and no others (sampled along the plan with the platform's 5 × 5 footprint).
- **Headroom** (TOWER_HEAD 3.72): the bathysphere 10.65 m over the start; gantry beams 14.4 over the deck; the hall
  ceiling 6.0; the Pump Hall roof 7.0 (its truss 6.5); the Ticket Hall canopy 5.4 over its top. Pipes: the Arch Line
  crosses over the hall at 6.62 (glass bottom); the Express crosses over the Gate Terrace and the plaza at 8.52 and over
  the Ticket Hall top at 7.32 above it; the Gulper Run's glass top is 1.02 m under the deck floor at the start (rule 21's
  1.0 m). Nothing else hangs over the track.
- **Clutter kept off** (0.6 m from the 2.5 m footprint, checked on the plan for every run): every piece except three
  covers tagged `notIn: 'tower'` (the Gate Terrace's ticket-machine bank, the basking rock on Penguin Point, the luggage
  trolley behind the Ticket Hall), which the Tower build leaves out; so Tower Command gets a variant `aquarium.tower` and
  its own lightmap. No pipe mouth or pop region within 2 m of the track (nearest: the Arch Line's A pop region, 2.08 m
  from run 4's footprint).
- **What the track does:** checkpoint 1 stops the tower in the Pump Hall's open side, the bund over it on one side and
  the Ticket Hall on the other; the U-turn brings it back toward mid over the Ticket Hall, where checkpoint 2 is the
  wing's strategic point; then it climbs past the penguins, drops into the west lane and crosses the plaza in front of
  the pavilion, where the defenders spawn.
- Riders on the tower cannot enter pipes (no mouth is near the track anyway).

### 4.4 Bazookarp

Following SPEC §9.1 (the user's rules and the research). Drawn for Alpha's attack on Bravo's half
(`LAYOUT.bazookarp` or `BAZOOKARP_DEFS.aquarium`):

```js
bazookarp: {
  start: [0, 2.4, 0],                       // the Pond: on the Glass Walk's centre, raised like S1 Blackbelly's tower
  weirs: [{ at: [0, 0, 28.0], yaw: 0 }],    // inside the North Arch hall, 6.5 m past the bubble column
  gate: { at: [-8.54, 0, 55.28], yaw: -20 },// the North plaza, a level below the spawn deck, 12.6 m from the pad
  freeZones: [                              // Bravo's own (turned: Alpha's)
    { poly: [[-1.64, 67.35], [-29.36, 51.35], [-34.36, 60.01], [-29.76, 64.05], [-21.5, 69.74], [-12.44, 74.05],
             [-6.64, 76.01]], y0: 2.9, y1: 6,
      signs: [[-32.06, 59.02, 150], [-6.94, 73.52, 150]] },          // the spawn deck and its stair landings
    { poly: [[31.95, 1.86], [31.53, 3.04], [30.9, 4.13], [30.09, 5.09], [29.13, 5.9], [28.04, 6.53], [26.86, 6.95],
             [26.19, 4.44], [26.94, 4.17], [27.64, 3.77], [28.25, 3.25], [28.77, 2.64], [29.17, 1.94], [29.44, 1.19]],
      y0: 3.1, y1: 6, signs: [[26.53, 5.7, -75]] },                   // the E Kelp Balcony, arc points every 10° (on Bravo's half)
    { poly: [[8.22, 52.26], [3.89, 49.76], [-0.11, 56.69], [4.22, 59.19]], y0: 1.9, y1: 5,
      signs: [[6.26, 50.66, 150], [1.55, 53.02, -120]] },              // Bravo's Penguin upper rock
  ],
  routes: {
    centre:   [[0, 2.4, 0], [0, 10], [2, 21.5], [0, 28], [-1.8, 31], [-1.8, 48.8], [-8.5, 55.3]],
    arcade:   [[0, 2.4, 0], [-16, 16], [-8.8, 19.2], [0, 28]],
    pumphall: [[0, 28], [-10, 37.8], [-14.8, 39.8], [-13.2, 50.8], [-8.5, 55.3]],
    rocks:    [[0, 28], [9.8, 40.8], [4.8, 42.2], [-8.5, 55.3]],
  },
  noRest: [],                               // filled by the builder from expandPipes: an 8-gon of r 2.5 m round every
                                            // pipe end's approach point and landing point (y0 −0.5, y1 4)
},
```

- **Distances, measured on the plan:** Pond → Gate **L = 59.5 m** (both teams by the exact turn; band 55–85, ±2 %).
  Pond → weir 29.0 m (**49 %**, band 40–55); weir → Gate **31.3 m = 53 % of L** (SPEC §9.1 #3: ≥ 45 % of L and ≥ 25 m);
  Gate → pad 12.6 m (band 12–20), 33° off the pad → Pond line (cone ±40°), y 0 against the pad's 3.4, in full view of the
  spawn deck.
- **Routes** (checker #5: route 2 avoids every node within 2.5 m of route 1 except within 6 m of either end; ≤ 1.6 ×
  route 1). To the weir: route 1 the centre (29.0 m) through the North Arch's court mouth; route 2 on the other side of
  the bubble column (30.7 m, 1.06×); the named arcade route through Bravo's NW Reef Hall and the hall's west door
  (44.5 m, 1.53×), plus a third via Bravo's promenade, Penguin Steps and the Gate Terrace (61 m). To the Gate: route 1 the
  lane west of the Ticket Hall (31.3 m); route 2 over the Ticket Hall (31.6 m, 1.01×); named: through Bravo's Pump Hall
  (37.7 m, 1.20×) and over Penguin Point (42.0 m, 1.34×). All walkable by a slow carrier: ramps, stairs and 1.2 m hops,
  which are `nav` jump edges (the checker runs with climbs off).
- **Entrances into the Gate's 15 m ring** (#7a): past or over the Ticket Hall from the Gate Terrace; out of the Pump
  Hall's open side; off Penguin Point's terrace and upper rock; across the plaza's east side (expected 4 groups, each in
  sight of the spawn deck's edge). **Drops over 2.5 m into the ring** (#7c): only the spawn deck's own front (3.4 m),
  listed for a lead waiver: it is the defenders' deck, whose two stairs start on the plaza inside the ring, so dropping
  off it gains an attacker nothing. The upper rock's south edge is a 2.4 m drop.
- **Deep spawn** (#13): three ways off the deck (the front drop, a `nav` drop edge at 3.4 m, and two stairs). **Apron
  blocks** at least 1.2 m tall within 4 m of route 1 between the deck's edge and the Gate: the fish topiary planter
  (0.5 m off), the queue-barrier planter (2.2 m) and the luggage-trolley stack (3.8 m), plus the luggage trolley behind
  the Ticket Hall (3.8 m; left out only in Tower Command): 4 in Bazookarp against the 2 the checker asks for.
- **Weir room** (#15): no solid within 3.0 m of (0, 28) between 0.3 and 3.6 m: the bubble column's surface is 5.7 m away,
  the shark-viewing bench 3.45 m, the hall walls 6.0 m. The weir's centre is seen from route 1's node 8 m before it (in
  the court mouth) and 8 m after it (on the Gate Terrace), and from the hall's lanes and both mouths.
- **The Pond** (#14): the ring 4.5–10 m round it is 92 % floor (the deck, the viewing steps, the ways up and the
  court; only the hatches, hoppers, racks and gulper necks are not), and the shell (1.3 m up) is seen from every compass
  point at 7 m: the 1.2 m hatches stay under each eye line (3.83 m over a 3.6 m top).
- **No unreachable high ground:** every top is reachable and in view (promenades, Lookouts, balconies, the upper rock, the
  bund, the Ticket Hall) or `roof`. The free zones cover each team's spawn deck, its Kelp Balcony and its Penguin upper
  rock (the high spots on its own side where a carrier could stall). The Lookouts are reached by a 1.2 m hop from the
  promenade, by both teams, so the plateau test needs no zone there.
- **Carry time:** at 4.8 m/s the shortest carry is 12.4 s walking (6.3 s swimming): Pond → weir 6.0 s, weir → Gate 6.5 s.
  Expect 20–35 s to plant against defenders and 15–30 s from the replant to the Gate.
- **Pipes in this mode:** all open; carriers refused at every mouth, and a player in any ride phase (suck, ride, pop)
  cannot pick the Bazookarp up; no end within 15 m of a Gate (nearest 16.1 m, the Express's IN end, which has no landing),
  so nothing is shut. The `noRest` circles keep the Bazookarp from resting in any mouth's approach or landing. Escorts use
  the Kelp Lines (UP lifts them onto the enemy promenade over the arcade route; DOWN drops them into the enemy Reef Hall
  beside that route) and the Arch Line to swap flanks round the hall; defenders use their Express to cross their wing.
- **The Pond:** the shell on the Glass Walk's centre; the hatches (r 3.4–5.4) straddle the 4.5 m burst radius, so
  standing behind them while popping it is a risk. Fighting room: the deck to r 7.5 and the court round it.
- **Mode-only pieces:** only the auto-built weir posts, Gate plinth and NO CARP signs (`onlyIn: 'bazookarp'`), so a
  lightmap variant `aquarium.bazookarp`. No Bazookarp-only redesign is needed. If testing shows the centre route too
  strong, the fix is a Bazookarp-only pair of shark-viewing benches narrowing the hall's wing mouth; never close the hall.

### 4.5 The modes overlay (Bravo's half, the data's frame)

`t` the tower track's centre line · `!` `%` its checkpoints 1 and 2 · `Y` the tower goal · `R` the Pond (Bazookarp start,
also the tower start) · `W` the weir · `@` the Dragon Gate · `f` Bravo's own Carp-Free Zones. (The tower and Bazookarp
pieces never coexist: each is its own mode.)

```
   x = -36       -26       -16       -6        4         14        24        34
               |         |         |         |         |         |         |
     -8  ~~~~~~:222222222=//////.../////.,,1111.,.//////.nMnn...o.........www~~~~~
     -6  ~~~~~:2BBB2/////=..///......////DDDDDDDpp////...MMMn..../////.....www~~~~
     -4  ~~~~##BBKKKKKKK=//.JJJ......,.pDDxDDDDDxDDp,.....M.....///KKKKKkk.www~~~~
     -2  ~~~~###KKKKKKKKK///JJJ..GGG,,DDDxxDDDDDxxDDD,.GGG.....///KKKKKKKKK###~~~~
      0  ~~~~###KKKKKKKKK///.....GGGGG_______R_______GGGGG.....///KKKKKKKKK###~~~~
      2  ~~~~###KKKKKKKKK//......GGG.,DDDxxDDtDDxxDD,,.GGG..JJJ///KKKKKKKKK###~~~~
      4  ~~~~www.kKKKKKK//....nnMn..../pDDxDDtDDxDDp........JJJ.//=KKKKKKKff##~~~~
      6  ~~~~www,...////......nMMM../////ppDDtDDD/////......///..=////22ff22:~~~~~
      8  ~~~~~www........,o.....M.//////..,11t1.,../////...//////=222222222:~~~~~~
     10  ~~~~~www,..................//...HH..t..HH.../....//////2222222xx2::~~~~~~
     12  ~~~~~~www....cc...,o............HH..t..HH.,,,,,,.....==2222222xx2:~~~~~~~
     14  ~~~~~~~www...cc.....................tttt..nTTTTT....==LL2qqqee22:~~~~~~~~
     16  ~~~~~~~~www......cc...oo....JJJJ.......t...TTTTT.==222222qqqqe::~~~~~~~~~
     18  ~~~~~~~~~wwww....cc.......,oJJJJ.......t...pp.===22222222eeee::~~~~~~~~~~
     20  ~~~~~~~~~~wwww........cc.....##.....O..t..##22222222222kk22:::~~~~~~~~~~~
     22  ~~~~~~~~~~~~wwww......cc...........OOO.t..###2222qqq22kkkkk:~~~~~~~~~~~~~
     24  ~~~~~~~~~~~~~~wwwww........####........t..####222qqqq22:kkkk~~~~~~~~~~~~~
     26  ~~~~~~~~~~~~~~~~ww.........####........t..####2222222/:11k~~~~~~~~~~~~~~~
     28  ~~~~~~~~~~~~~~~~##....wwww#####.....W..t..#####2:://///111PPPP~~~~~~~~~~~
     30  ~~~~~~~~~~~~~~~##pp...wwww#####bbb.....t..#####:.11//1111PPPPP~~~~~~~~~~~
     32  ~~~~~~~~~~~~~~###FF1...................t....pp..11111111PPPPP~~~~~~~~~~~~
     34  ~~~~~~~~~~~~~~##FFF1..tttttttttttttttttt....pp.1111kk11PPPPP~~~~~~~~~~~~~
     36  ~~~~~~~~~~~~~##FF11...t.ppp/..ttttttttttttttttt111kkkkPPPPPP~~~~~~~~~~~~~
     38  ~~~~~~~~~~~~##FFF1....t..p//..ttttttttttttttttt11kkkkPPPPPP~~~~~~~~~~~~~~
     40  ~~~~~~~~~~~##1111.pp..t...oqq1%1po...p...ppxx1111qqkPPPPPP~~~~~~~~~~~~~~~
     42  ~~~~~~~~~~~:#FFF..pp..t...qqq1t111..ttttttttttt11qqPPPPPP~~~~~~~~~~~~~~~~
     44  ~~~~~~~~~~:11FF.pp....!...1111t111.......111111111PPPPPP~~~~~~~~~~~~~~~~~
     46  ~~~~~~~~~:..1kkkppo...t...o--.t..o......11111p111PPPPPP~~~~~~~~~~~~~~~~~~
     48  ~~~~~~~::...kkkk......t.......t........1111p11pPPPPPPP~~~~~~~~~~~~~~~~~~~
     50  ~~~~~~::ppp..kk.......ttttttttt.........f1111ppPPPPPP~~~~~~~~~~~~~~~~~~~~
     52  ~~~~~~:/pp........pp........ppp........fffffPPPPPPPP~~~~~~~~~~~~~~~~~~~~~
     54  ~~~~~:///fff..qqq.pp...YYttttttttttt..frrffPPPPPPPP~~~~~~~~~~~~~~~~~~~~~~
     56  ~~~::///fppfffqqq..ppp...p.@@.......2fffffPPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~
     58  ~~:://ffpppffffffff.....ppp....p....bbbffPPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~
     60  ~~:fffffffffffffffffff.....pp..vvp......PPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~
     62  ~~~::fffffffffffffffffffff..pvvvpppvvvPPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     64  ~~~~~~::fffffffffffffffffffff.vvvvqqvPPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     66  ~~~~~~~~:::ffffffffffffffffpffff/qqqPPPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     68  ~~~~~~~~~~::##fffffffffffffpppf///:PPPPP~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     70  ~~~~~~~~~~~######fffffffffffp////:~~~~P~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     72  ~~~~~~~~~~########:::fffffff///::~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     74  ~~~~~~~~~~~~~~###~~~~:::::fff/::~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     76  ~~~~~~~~~~~~~~~~~~~~~~~~~~:::::~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     78  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

### 4.6 Boss Battle: yes (prove it with the boss check)

- **Home ground:** the Ocean Court annulus between the viewing step (r 9) and r 20, about 900 m² of floor round the
  cover, plus the arcades' inner 5 m. The beds, the dais and the viewing step are all under BossNav's 1.35 m stride, so
  they are ground to it; the touch pool's glass and the helmet are walls. The deck is a 2.4 m wall to HULLBREAKER; its
  glass sides and the gantry legs stun its charge.
- **Overhead:** nothing below 5.3 m over the court except the gantry legs (walls); the bathysphere is 13.05 m up; the
  Kelp Lines run over the promenades and the Expresses over the wings, never over the court. The arcade canopy runs from
  4.6 to **5.3 m**, so BossNav's probe at floor + 5.2 m finds it and the canopied outer arcade is a wall to the boss
  (in the first revision the canopy topped out at 5.0, between the 3.8 and 5.2 probes, and the boss could have walked
  under it and clipped it). The boss's arena is the court and the open inner arcade.
- **The halls are passable** (6.0 m ceilings); that is fine (12 m wide, straight, no trap).
- **Pipes:** open; the squad escapes through them; the boss cannot enter. The tide runs every 90 s; Feeding Time (looks
  only) plays at phase 3.
- If the boss check stalls at the Kelp Ramps' feet or between the deck and the jelly columns, move J1/J2 out for Boss only
  (`notIn: 'boss'`, a variant `aquarium.boss`); if it still fails, `noBoss: true`.

---

## 5. The look

### 5.1 Architecture, piece by piece

- **The style:** 1936 Streamline Moderne. Curved white render with three pale sea-green "speed lines", porthole windows,
  glass-block panels, ribbon windows, polished brass handrails with ball ends, black-granite plinths, terrazzo with brass
  inlays (wave borders, fish trails, compass roses).
- **The Tubeway** (the founder's pneumatic post, renewed last spring): clear acrylic tubes Ø 1.76 with brass collars
  every 3 m (green steel on the one-way lines), slim riveted brackets painted sea-green, Deco roundels at every mouth,
  small warm bulbs in the collars at dusk. Mouths are brass bells (two-way) or bell and check-valve flap (one-way); the
  Gulper Run's mouths are the eels' jaws. The Express's 37 m overhead span has a sea-green steel spine along its top and
  one lattice strut, standing on the Ticket Hall's canopy roof (6.8) up to the tube (8.5); nothing of it reaches down to
  walkable floor.
- **The Great Tank and the Feeding Deck:** a 0.15 m brass-capped granite kerb, then 2.25 m of glass in brass mullions
  every 2 m, sharks, rays, a sea turtle and a bronze diver statue on a sand floor sunk to −0.6; the teak lid with a brass
  rim kerb, the **Glass Walk** (glass blocks in a brass grid, lit from below, the Gulper Run's tube visible 1 m beneath),
  fish-food hoppers, pole racks, hatches and bucket stacks. The four viewing steps hug the glass.
- **The Feeding Gantry and Bathysphere No. 1:** a riveted sea-green portal crane on four legs, beams at 16.8–17.8 m, a
  winch house with "No. 1" on top (to 20.0), the steel ball hanging on two cables, centre 14.5 m, a brass plaque "923 m ·
  1934". Portholes lit at dusk. **The whole ball shows from both pads:** from the `play` camera behind the pad, the eye
  line to the ball's underside (13.05) crosses the gatehouse's east (or west) pylon at x ±8.5, 1.5 m above its 9.0 crest
  and its 9.8 letters; the Tide Gauge dials (x ±4.5) are off that line.
- **The gulper heads:** two bronze gulper-eel heads 2.4 m tall, jaws agape with needle teeth, lit eyes; their bronze
  necks (1.9) run into the tank glass, and from there the tube is in the water.
- **The gatehouses:** two curved Deco pylons each side of the Shark Arch, 9 m tall, joined by the Arch Tank (6–9 m),
  which shows as a long window of sharks over both of the hall's mouths. Court-face parapet letters **GULPER AQUARIUM ·
  EST. 1936**; the two Tide Gauge dials on the crest; a two-faced clock and "SOUTH GATE" ("NORTH GATE") over the wing
  mouth; a 1.2 m glazed slot in each pylon's wing face, where Arch Line riders flash up and down.
- **The Shark Arch halls:** a glass vault (6.0) with blacktip sharks and an eagle ray gliding over, caustic light on the
  floor, the bubble column (glass, bubbles streaming) at the court mouth, a shark-viewing bench, the glazed riser shafts
  at the wing-end corners where Arch Line riders rise and fall.
- **The Reef Halls (arcades):** slim lamp columns with fluted brass capitals on a 0.45 m granite colonnade plinth along
  the court edge, a cantilevered canopy from the outer wall, the 40 m curved Reef Window (corals, clownfish, a moray in a
  pipe, an octopus den labelled "PLEASE DO NOT DISTURB: SHY") over a granite viewing kerb, coral sculptures, a giant
  clam, the brass Tubeway stops, the Kelp Line's bell in the drum's foot.
- **The Sea Promenades:** a teak terrace over the Jelly Gallery (out of play; its portholes glow in the promenade's inner
  face), a wave-pattern balustrade at the court edge, the raised **Lookout** round the gallery's skylight, a see-through
  sea rail on the sea edge, the raised telescope bay with three coin telescopes, the ice-cream and souvenir kiosks, a
  stack of striped deckchairs, the deep Kelp stop.
- **The Kelp Drums:** 9 m glass cylinders to 10 m with riveted brass crowns and keepers' ladders, giant kelp swaying in
  shafts of sun (thinned round the riser), garibaldi; the Kelp Line rising up the middle; the plant room behind with
  pumps and a vent in the wall over the balcony.
- **The ferry wings (the blades):**
  - **The Ticket Hall:** a Deco pavilion facing the South Gate square-on, raised 1.2 m, with a glass canopy, a hanging
    station clock, a "TODAY'S FEEDINGS 11:00 · 15:00" board, a ticket booth, a luggage scale, turnstiles over the queue
    step, school-trip coat pegs.
  - **The Pump Hall:** the back of house along the blade's leading edge: an open-sided steel shed whose sawtooth roof
    cantilevers from a buttressed back wall in three stepped bays, sand filters on the bund, pumps, valve walls with red
    handwheels, bundles of flanged pipes, the 12 m Deco vent stack with "GA", sea-salt sacks, scuba cylinders in racks,
    spare acrylic panels on an A-frame, a forklift carrying a fish tank.
  - **Penguin Point:** a pale faux-Antarctic rockery along the blade's trailing edge, the keeper's hut, feeding buckets,
    an ice pile, a basking rock, a feeding chute through the glass, and behind brass-framed acrylic in angled bays the
    penguin cove, where the penguins waddle, dive and turn to watch whoever fights nearest.
  - **The ferry plaza:** terrazzo with a brass compass rose, the raised ferry queue with its ticket kiosk and luggage
    trolleys, the timetable pillar, a whale-tail bench, fish topiary, stacked luggage and a queue-barrier planter in front
    of the pavilion, a souvenir kiosk, tank-delivery crates, the Express's brass stop with its riser climbing into the sky.
  - **The Fin Pavilion:** the entrance pavilion with the spawn on its curved roof terrace, a glass-block fascia along its
    front, stairs down its flanks with brass handrails, sea rails round its back, the 18 m fin tower with vertical neon
    AQUARIUM; behind it the ferry tied up at the pier (a little white Deco steamer with a buff funnel).

### 5.2 Props and set dressing (colliders where it is cover; see the piece tables)

Keepers: feeding carts with buckets, a glass-cleaning robot parked against the Great Tank, hose reels, life-ring posts,
"FLOOR DRY" A-boards (everything here is dry). Visitors: a stroller line by the ice-cream kiosk, the souvenir kiosks'
plush-shark walls, coin telescopes, info lecterns, deckchairs, benches. Exhibits: the jelly columns, the touch pool, the
coral sculptures, the giant clam, the diving helmet, the bronze diver in the Great Tank. Pump Hall: pumps, filters,
valves, sacks, cylinders, panels, forklift. Wing: ferry-ticket kiosk, timetable pillar, whale-tail bench, fish topiary,
luggage trolleys, ticket machines, queue stanchions, the Tubeway post-box column. All merged into material buckets; tiny
parts `H.noShadow`.

### 5.3 Surfaces, glass and water (three slots: suggest PATTERN 67–69, the integrator assigns)

1. `aquarium:terrazzo`: warm cream `#d6cfc0` with grey and ochre chips and brass divider strips on a 2 m grid (court,
   arcades, halls, Ticket Hall top, plaza).
2. `aquarium:teak`: weathered silver-brown planks `#8f7a63` with dark caulk (the Feeding Deck, promenades, balconies,
   Lookouts, spawn decks).
3. `aquarium:render`: white render `#ece6da` with a muted sea-green faience band `#9bb3a8` (every inkable wall: the
   promenade faces, the Ticket Hall's sides, the Kelp Ramps' flanks, the bund's faces). The spawn decks' fronts are the
   non-inkable glass-block fascia.

Shared patterns: the Pump Hall floor and bund (`metalpanel`, `concrete`), the penguin rocks (stone), the spawn deck's pad
ring, the Glass Walk (`glasstile`, inkable like any floor).

**Glass and water blocks.** Every glass or water volume (the Great Tank's sides, the drums, the Arch Tanks, the Reef
Windows, the penguin glass, the jelly columns, the touch pools) is a level block with `hidden: true` (collision only: no
faces, no paint cells, no lightmap rects) plus a prop that draws it: a back-face and a front-face pass of the house glass
material, a water shell with interior fog, and the fish. Each such block also carries `bakeClear: true`, so
`build/bake-ao.cjs` traces through it like pipe glass (ENGINE.md H15): the halls under the Arch Tanks bake as daylit
glass vaults, not tunnels, and the tanks cast no AO. Opaque granite kerbs and brass frames are ordinary blocks and do
bake.

### 5.4 Palette, tank light and how riders stay visible (team ink stays the loudest colour)

| element | colour |
|---|---|
| render | `#ece6da` |
| terrazzo | `#d6cfc0` |
| teak | `#8f7a63` |
| faience band | `#9bb3a8` |
| brass | `#a8895a` |
| black granite | `#33373b` |
| tank water (deep, desaturated) | `#173a48`, clearing to `#5f8790` within 1.5 m of a tube |
| glass edge | `#cfe3e6` at 15 % |
| gantry / brackets sea-green | `#6e978a` |
| penguin rock | `#8d8a84` |
| kelp | `#5b5a33` |
| coral (half saturation) | `#c99a8a` |
| jelly glow (near-white, a hint of lilac) | `#f2eefa` |
| dusk tank emissive | warm white `#f3ead8` or pale lilac `#ece6f4`, never cyan or green |

Rules: floors are warm neutrals (every palette pair reads on cream terrazzo and teak); nothing a player inks is saturated
aqua or blue; tank water is always deep and dull, never bright cyan; caustic light is white and touches lighting only
(±10 %, never albedo or ink); fish are grey-silver with a few small reef colours; jellies near-white; pipe lights warm
white; nothing on a pipe is tinted a team hue except a rider's own glow.

**Riders in tanks.** Inside every tank and drum the water's fog falls to near zero within 1.5 m of a tube's axis (a
distance-to-leg term in the tank shell's shader, using the leg's LUT), and each tube carries a strip of warm-white
up-lights along its underside, so the rider's ink-coloured glow shows through the tank's glass at the same strength as
in open air. Kelp is thinned to clear water round the Kelp Lines' risers. The Glass Walk shows the Gulper riders from
above (ENGINE.md §3.6, the deck light). §6.2 tests this from 15 m and 30 m, day and dusk.

### 5.5 Murals and signage (stage murals 4–11)

4. **GULPER AQUARIUM · EST. 1936** parapet letters and the coiled-gulper ring emblem.
5. **ALL WATER IS BEHIND GLASS · INKLINGS KEEP DRY** boards (piers, Ticket Hall, arcades).
6. Tubeway roundels: "⇄ GULPER RUN", "⇄ ARCH LINE", "▶ EXPRESS", "KELP LINE" with split-flap ▲ UP / ▼ DOWN; the Tubeway
   line map on the lecterns and the post-box column.
7. Floor inlays: brass compass roses ("S" / "N") in the court's bands and the plazas, wave borders round the deck, fish
   trails leading to each mouth, "KEEP CLEAR" arcs at each landing, a brass border round the Glass Walk.
8. Exhibit signs: "PLEASE DO NOT TAP THE GLASS", "TOUCH POOL · TWO FINGERS, PLEASE", "FEEDING DECK · KEEPERS ONLY",
   "BATHYSPHERE No. 1 · 923 m · 1934", "PENGUIN POINT", "SOUTH GATE" / "NORTH GATE".
9. Back-of-house stencils: "PUMP HALL · NO ADMITTANCE", "SEA SALT 25 kg", "FILTER 3", hazard stripes.
10. The Tide Gauge dial faces.
11. "TODAY'S FEEDINGS 11:00 · 15:00" board and the ferry timetable on the pillar.

No real brand names anywhere.

### 5.6 The world round it (`env`) and the backdrop on every side

`env: { backdrop, bay: false, edge: 'none', gulls: true, boats: false, buoys: false, stars: true }`. The islet's granite
sea wall with bollards and life rings is dressed under every deck edge, round the drum and along both blades' edges and
the penguin coves (`kit.runs`). Theme overrides (`all`): `seaDeep '#1e4a57'`, `seaShallow '#2f7a7a'`, a warm-neutral fog,
foam a little dimmer than the bay's. No weather.

| side | what you see |
|---|---|
| **South-east** (behind Alpha's Fin Pavilion) | The ferry pier with *MV Gulper* tied up; the harbour mole running back to the seafront; a palm esplanade, white hotels and a seaside Ferris wheel |
| **North-west** (behind Bravo's) | The second pier with *MV Barreleye* coming in; beyond it, across the bay, the Inkopolis skyline (our own silhouette) |
| **East** (beyond the E drum) | Open sea to the horizon; the **Deep Dome**, a glass observatory dome on stilts 250 m out, joined to the islet by a long Tubeway tube on pylons where a glowing streak runs every few seconds (`animate`); a red-and-white breakwater lighthouse; sailing dinghies |
| **West** (beyond the W drum) | The coast curving away: pale cliffs, white villas, a marina; a whale's spout on a slow loop |

### 5.7 Day and dusk, lamps

- **Day ("Opening Hours"):** a bright summer late morning, sun from the south-west (sunAz ≈ 215, sunEl ≈ 50), a clean
  blue sky with a few cumulus, a slightly desaturated teal sea. White render reads crisp; caustics dance under the tanks
  and in the halls.
- **Dusk ("Late Night at the Aquarium"):** sunset from the west (sunEl ≈ 6), apricot to violet. Every tank glows softly
  from within in **warm white or pale lilac only** (never cyan or green), with its emissive luminance capped at 60 % of a
  fresh ink splat's at the same exposure (the shader clamps it), so team ink stays the most saturated and the brightest
  colour in frame; silhouetted sharks, white-lit kelp, softly lit jellies. The neon fins burn warm white, the bathysphere's
  portholes and the Tide Gauges are lit, the Tubeway collars twinkle, string lights hang along the sea rails, the
  lighthouse beam sweeps, the Deep Dome glows on the horizon, the city lights come on across the bay.
- **`decor.lamps`:** the colonnade capitals (4 per arcade), lamp posts along each promenade (6), the plaza lamps (4), the
  Ticket Hall clock, the fin towers, the gantry's winch-house lantern.

### 5.8 The intro fly-in and the hero shot

- **Intro** (`intro: { from: [24, 16, 18], lookFrom: [0, 13, 0], toBack: 3.0 }`): close on the bathysphere's portholes
  with sharks passing under the Glass Walk; pull up and out over the E Kelp Drum as a neutral-white maintenance pod rises
  up the Kelp Line and arcs over the promenade; sweep along the player's blade over the Express and down behind the
  player's Fin Pavilion. (Waypoints if the format grows them.)
- **Stage-select hero shot** (`art: { from: [40, 26, -58], look: [0, 4, -6], fov: 56 }`): high over the sea east of Alpha's
  Pump Hall. Foreground right: the stepped sawtooth roof and the GA stack. Across: the ferry plaza, the Express's glass arc
  with a team-coloured squid mid-ride over the Ticket Hall, the South Gate's letters and Tide Gauges. The round court: the
  Great Tank with the bathysphere on its gantry, a rider streaking along the Glass Walk, both kelp drums and the Kelp
  Line's glass arc over the North Promenade. Horizon: Bravo's blade and fin tower and the Inkopolis skyline. Dusk: the
  same frame with every tank lit.

---

## 6. Build order, checkpoints and acceptance

### 6.1 Build order (the pipe engine is built in parallel to ENGINE.md; the stage never waits on it until step 5)

1. **Block-out** (plain boxes; the blade's pieces as `obox` with `rotY: −30`): the court, the deck and its six ways up,
   the gatehouses and halls, the drums, ramps and balconies, the arcades and promenades, the blades, the spawn decks, and
   the relief (§2.2). `node build/check-maps.mjs aquarium` → ok. `spawn-mid.js` (5.7–6.3 s), `cover-map.js`,
   `climb-audit.js`, and the physical way-round search (`tools/botlab/jobs/new-stages/out/pods/treehills-pods.js`'s kid
   walker, pointed at Penguin Point, the Kelp Balconies, the promenades' sea rails and the spawn decks).
   **STOP 1 (pictures to the lead):** top; the outline next to Treehills and Craters (`check-maps --svg` in the builder's
   own worktree; delete the previews after); `play` from both spawns (the whole bathysphere must show over the gatehouse;
   no beam across the view); mid from both arch mouths; the cover map.
2. **Zones and tower:** `LAYOUT.zones`, `LAYOUT.tower`, the three `notIn: 'tower'` pieces; `tower-check.cjs` (0 holes,
   the 6 deliberate height changes at the table's points, both rides knock out); `tower-len.js` (100 s); a bot Turf and a
   bot Zones match (stuck ≤ 1 %).
   **STOP 2:** top (zones), top (tower), the tower in the Pump Hall and on the Ticket Hall.
3. **Bazookarp data** (when the SPEC's WP4 checker exists): `bazookarp-check.cjs` RESULT ok, with the deck-front drop
   (#7c) waived by the lead in the stage note.
4. **The place:** architecture, props, surfaces, murals, backdrop, env, day and dusk; every glass and water volume as a
   hidden collider plus a drawn prop with `bakeClear`; the tank shells' fog clearing round tubes and the tube up-lights.
   Shoot often; measure the tank sub-budget here with `shoot.cjs` (§6.2), not only at the end.
   **STOP 3:** art day and dusk, the court from the deck, an arcade, a promenade and its Lookout, a hall, the Pump Hall,
   Penguin Point, the plaza from the spawn deck, the backdrop on all four sides, and the dusk palette test.
5. **Pipes** (after ENGINE.md steps 1–10 pass on the fixture): `LAYOUT.pipes`, the glazed riser shafts and slots, the
   housings and the Kelp stops' voids, the Glass Walk's deck light, `pipes-audit.js` on the stage (every §5 rule),
   `tower-check` again.
   **STOP 4:** each mouth type close up (two-way bell, one-way IN bell with fan, OUT flap, a tidal split-flap end, the
   gulper jaws); the rider picture test (§6.2); the ride camera in each leg (start, middle, 0.3 s before the pop), with the
   Gulper Run's water-clamp assertion; the tide's T − 10 / T / T + 1 (HUD, gauges, kelp); dusk.
6. **All modes again on the Mac mini:** turf, zones, tower and Bazookarp bot sets with pipes on and off; the boss check;
   `net-pipes.cjs`; perf against Halyard.
7. **Polish:** intro, art, lamps; bake on the Mac mini (`aquarium`, `aquarium.tower`, `aquarium.bazookarp`); stage art;
   final pictures.
   **STOP 5:** the final set below.

### 6.2 Acceptance (what the lead judges against)

| check | pass |
|---|---|
| check-maps, climb-audit, way-round search, `play` views | ok; clean: every barrier stands more than 1.8 m above every standable surface within 3 m (the penguin glass 2.0–2.2 m, the plant rooms 2.4 m over the balconies, the deck's glass 2.0 m over the viewing step), and no top is within 0.35 m of a walkable or roof top beside it; the kid walker finds no way from the playable floor onto a penguin cove, a plant room or the sea except by jumping off a rail; the whole bathysphere visible over the gatehouse from both pads |
| **Cover map** (Turf War build) | ≥ 95 % of floor within 5 m of cover (paper 96.3 %); **no open circle larger than r 5.0 m anywhere except the deck top, the spawn decks and the stairs** (paper 5.0); **and at least Halyard's share measured with the same script** |
| **Spawn → mid** | `spawn-mid.js` 5.7–6.3 s (paper 6.06 s); with pipes ≥ 4.5 s (paper: no pipe helps, 8.23 s at best) |
| No empty areas, relief | every area in §2.4 has its pieces and dressing and a height change inside it (§2.2); no open floor without a purpose in the pictures |
| Floor | 5,200–5,700 m² (paper 5,446) |
| Zones | centre 115 m², side 84 m², both flat; a 5-min bot zones match with ≥ 4 lead changes in 3 of 4 runs |
| Tower | 140–155 m (paper 147.8), 0 holes, 6 deliberate height changes, both rides knock out, 100 s; `aquarium.tower` built without the three `notIn` pieces |
| Bazookarp | checker RESULT ok: L 55–85 and ≥ 58 (paper 59.5); weir 40–55 % (49 %); weir → Gate ≥ 45 % of L and ≥ 25 m (53 %, 31.3 m); Gate → pad 12–20 m (12.6); 2–5 entrances, all seen; #13: ≥ 3 ways off the deck and ≥ 2 apron blocks (3); #15: nothing within 3 m of the weir (column 5.7 m, bench 3.45 m); #7c: the deck front waived; SPEC §9.1 bot targets over 16 matches |
| Boss | home ground ≥ 150 m², never idle > 8 s; or `noBoss` with the reason |
| Pipe rules | `pipes-audit.js`: every ENGINE.md §5 rule, rule 13 as restated there; time ratios: the Gulper, the Arch Line promenade-ward and the Express ≤ 0.80, every leg ≤ 0.95 (paper 0.72–0.92); ≤ 200 collider pieces (≈ 160); ≤ 8 draw calls |
| **Riders visible** (picture test) | A rider mid-ride in each leg, photographed from the court and from a promenade at 15 m and at 30 m (the Express also from its plaza and the Gate Terrace), day and dusk: the rider's ink-colour glow is identifiable in every frame where its tube is in view, including through the Great Tank's side glass and from the Glass Walk above the Gulper Run. Scored by a pixel test (the glow's hue within the team palette's tolerance at the rider's projected point) and by the lead's eye |
| **Ride camera** | On the real stage: on the Gulper Run the camera point is inside the Great Tank's `water` volume on every frame the rider is inside the tank's 16-gon (boom ≥ 1.2 m, y ≤ 2.0), and the underwater grade is on exactly then; the same in the kelp drums and the Arch Tanks |
| **Gimmick fairness** | (a) no rider ever damaged in `ride`/airborne `pop` (page test + 2-client test); (b) the carrier refused at every mouth; (c) both twins flip on the same tick offline and within 0.4 s across two clients, IN ends shut 3 s before, no ride ever cut; (d) camping metric: deaths within 2 s of a touchdown ≤ 2× the match's base rate; (e) rides per bot-minute ≥ 0.3 and the share of arrivals at mid's high ground (deck, promenades, Lookouts) by pipe 10–35 %; (f) pipes on vs off (6 + 6 Mac mini matches per mode): turf %, splats and lead changes within ±10 %, stuck ≤ 1 %, no bot pushing at a mouth > 3 s |
| Bots | stuck ≤ 1 %, no episode > 10 s, in every mode |
| **Performance** | at or under Halyard (calls, tris, cpuRender, loadMs) at load, day and dusk, and in a 50 m ride shot (`shoot.cjs`). **Tank sub-budget:** every tank, drum, reef window and penguin-cove interior with its fish and kelp in ≤ 30 draw calls and ≤ 250 k triangles; kelp sways in the vertex shader; no pixel seen from the deck or a promenade crosses more than 3 transparent layers (tank glass, water shell, pipe glass). Measured at STOP 3, again at STOP 4 with the pipes, and at the end |
| **Dusk palette** | dusk pictures with each of the five team palettes inked on the deck and in an arcade: ink is the most saturated element in every frame; no tank glow is cyan or green or brighter than 60 % of a fresh splat |
| Online | `net-pipes.cjs` passes; `net-stageclock.cjs` with the tide; a 2-client Turf match with no kink reports on riders |
| Pictures (JPEG < 300 KB) | top (turf / zones / tower), the outline next to Treehills and Craters, art day + dusk, spawnA, mid, the deck from a Lookout, a Gulper ride from the Glass Walk and from the court, the Express over the plaza, the Kelp Line rising in its drum, an Arch Line rider in the Gate Terrace slot, the tide flip HUD, the cover map next to Halyard's |

### 6.3 The three biggest risks

1. **Pipes that feel random or unfair** (exit camping, untouchable escapes, players not reading one-way vs two-way or the
   tide). Built in: the full-ride exit telegraph, the steerable and shielded pop, cover at every landing, a fixed 90 s
   rhythm with 10 s warning and five cues, a one-way line (the Express) that never changes, so "fan in, flap out" is
   learnt before the tide. Measured by the fairness tests above and the user's first match. Knobs, in order: Kelp speed
   24 → 20; cooldown 2.5 → 3.5; the pop shield cap 0.8 → 0.5; the tide period 90 → 120; last resort, the Kelp Lines static
   UP (the network keeps two-way, one-way and the Express).
2. **A mid that is a fortress or a bowl.** The deck has six ways up, four 1.2 m hatches inside its zone, and two Lookouts
   at 3.6 m that look down on its rim from 14–17 m, besides the 2.4 m promenades at 14 m. Measured by zone lead changes
   and time held, and the cover map's court share. Fallbacks: a Zone-only extension of the zone down the Feeding Steps;
   lower the Feeding Steps' second hop to a ramp.
3. **Glass, water and performance.** Tanks, drums, the Arch Tanks and 274 m of tube are transparent, and an aquarium is
   full of blue next to Aqua, Cobalt and Mint ink. Answered by the palette rules (deep dull water, white caustics, a capped
   warm dusk glow), opaque milky jelly columns, one merged tube material, instanced fish, cheap tank shells with interior
   fog (no refraction), `bakeClear` glass, the underwater grade only on the ride camera, and the tank sub-budget checked
   from STOP 3 on.

---

## Review log

Revision 2 answers two reviews of revision 1: the user's advocate (A) and the build / modes engineer (B). Every number
quoted here was re-measured on the revised plan raster (§0 conventions). Status: **fixed** (the design changed), **fixed,
differently** (the design changed, but not as the critic proposed, with the reason), **partly** (what is left and why).

### The advocate

| # | severity, issue | what I did | status |
|---|---|---|---|
| A1 | **blocker:** the silhouette was a north–south band with a round bulge; the wings were walled rectangles, the "propeller" was not in the plan | Redrew both wings as **swept blades** (the critic's option a): each leaves its gatehouse's wing mouth and runs 30° toward its team's left, its pad at (±18.0, ∓63.68). The trailing edge is a curved penguin cove tangent to the drum, the leading edge the Pump Hall's stepped three-bay wall, the tip a curved-backed pavilion; no edge of the outline runs north–south and no straight wall on it is longer than 14 m (the penguin glass is four angled bays of 7–14 m). The centre lane bends once, at the Ticket Hall on the blade's knuckle. §2.1 now shows the outline next to Treehills' and Craters' (rasterised read-only from their real layouts, so no `build/preview` files were written into the shared worktree). Every distance was re-measured: spawn → mid 71.6 m / 6.06 s (§2.5); tower 147.8 m (§4.3); L 59.5 m, weir 49 %, weir → Gate 31.3 m (§4.4); cover (§2.7). Each wing now carries a pipe, the open-air **Express**, and a new exhibit set (the ferry plaza) | fixed |
| A2 | **major:** forecourts thin and flat; the Bazookarp apron rule (checker #13) failed; the Gate Terrace a bare 31 m lane; the Ticket Hall top's north half bare | The forecourt is now the ferry plaza with 12 pieces of 1.2–3.0 m and a 0.6 m queue terrace (§2.4: queue terrace, ferry-ticket kiosk, luggage trolleys and a trolley stack, a queue-barrier planter, fish topiary, timetable pillar, whale-tail bench, souvenir kiosk, tank-delivery crates, forklift, the Express stop). **Apron:** 3 blocks ≥ 1.2 m within 4 m of route 1 between the deck and the Gate in every mode (0.5, 2.2, 3.8 m), 4 in Bazookarp; none within 0.6 m of the tower's track or goal. The Gate Terrace has cross-cover at both ends (bollard planters) and in its middle (post-box column, ice-cream cart, a ticket-machine bank tagged `notIn: 'tower'`); the Ticket Hall's north half has the luggage scale and the booth. §6.2's targets restated as asked: no open circle over 5.0 m except the deck top, spawn decks and stairs, measured in the Turf War build (paper: 5.0 m at most), and checker #13 ≥ 2 apron blocks | fixed |
| A3 | **major:** heights changed only between tiers; every area flat inside | Relief in every area (§2.2, §2.4): the court has a viewing step round the Great Tank, a 1.0 m touch-pool dais with a 0.5 step, and a 0.9 m diving-helmet bed (one raised bed per quadrant with the twins); the arcades a 0.45 m colonnade plinth with 0.22 steps between the columns and a 0.45 m kerb under the Reef Window; the promenades a 3.0 m telescope bay at the sea rail and a 3.6 m Lookout; the wings a 0.6 m queue terrace, the Ticket Hall's queue step and the Penguin Point rocks. Zones stay flat (the side zone now starts at r 21.6, after the plinth), the tower's footprint and headroom stay clear, the boss's home ground is ≈ 900 m². **One difference:** the viewing step is 0.4 m, not the suggested 0.6, because a 0.6 step against the tank's glass leaves the deck rim 1.8 m above it, a kid's climb, which would let players (not bots) hop onto the deck anywhere and undo its six ways up; at 0.4 the rim stays 2.0 m above it | fixed, differently (0.4 step) |
| A4 | **major:** the gimmick mostly hidden in tanks and walls; the headline moment barely exists; no leg worth riding for time | **Deck:** the lens became the 2.4 m-wide **Glass Walk** along the Gulper Run (x −7.5…7.5, z ±1.2), inkable, with the rider's glow drawn over any ink (ENGINE.md `look.deckLight`). **Tanks:** fog falls to near zero within 1.5 m of every tube, tubes are up-lit, kelp thinned round the risers (§5.4). **Granite band:** instead of raising the Gulper's central run (it cannot rise: rule 21 needs its glass top ≥ 1.0 m under the deck floor at the tower's start, and it is at 1.02), the tank's granite band dropped to a 0.15 m kerb, so the glass runs 0.15–2.4 and the tube is seen from the kerb up. **Gatehouses:** the Arch Line risers are glazed to the hall and, through a 1.2 m slot, to the Gate Terrace; the court sees the line through the Arch Tank's court-side glass. **Open air:** the new Express in each wing (55 m, 10 m up across the whole wing); 54 % of the 274 m of tube is now open air and 29 % lit inside tanks (was about a third). **Speed:** the Gulper (0.74), the Arch Line promenade-ward (0.78) and the Express (0.73) now save a fifth to a quarter of the swim. **Pass criterion:** the rider picture test in §6.2 and ENGINE.md step 12. **Not reached: the Kelp Lines at ≤ 0.8** (they are 0.92 UP / 0.88 DOWN). Their walking twin, the Kelp Ramp, starts 1.2 m from their A mouth and its upper half merges with the enemy promenade, so moving the B end changes both sides of the ratio alike (B at α 48° 0.92, 52° 0.91, 56° 0.89); lowering the overhead run is impossible (it must clear the Kelp Balcony by 3.4 m and the B drop needs 5.5 m for its fillets); 24 m/s is the engine's ceiling. Reaching 0.8 would need a ≥ 1.9 m screen along the ramp's head (a corridor) or removing the ramp, the ring's only walking link between a team's low flank and the enemy's high flank; I kept the ramp. The Kelp Lines' value is the lift up a 10 m drum and the arrival behind the enemy's balustrade. The optional extra **two-way** wing leg was built as a **one-way** leg instead: a two-way leg across the 33 m blade rides at 1.0–1.2 of walking it (rule 26), and its forecourt end would be a landing 13.8 m from the pad (rule 19 asks 22 m) | partly (Kelp ≤ 0.8 not reached; reason above) |
| A5 | **major:** the penguin glass lower than the ground beside it | The glass now stands ≥ 2.0 m above every standable surface within 3 m: 3.2 m beside the 1.2 terrace, 4.4 m wherever the 2.4 upper rock or the 2.2 ice pile is within 3 m (s 7…24), 2.6 m beside the 0.6 queue terrace (§2.4). The bucket rack, hut, chute and outcrop near it are `roof`. The cove behind it is `roof` scenery that slides anyone who lands there into the sea. §6.2 adds the kid walker's way-round search on Penguin Point | fixed |
| A6 | **major:** the plant room roof a step-up from the Kelp Balcony | Plant room raised to 6.0 m (2.4 above the balcony, now 3.6), its face the pump-house wall with a vent; the balcony's sea rail continues along it | fixed |
| A7 | **major:** the Kelp stop housing blocked the Kelp Ramp's foot | The Kelp Line's A mouth moved into the drum's own foot: a brass bell in a frame only 1.0 m deep (x 26.2…28.6, z −4.6 → −2.8), 1.2 m east of the foot. The foot (x 25, z −4.6…−7.5) has 3.0 m of clear flat approach (x 25…28) facing the arcade; the ramp's parapet starts 3.9 m up, so its low end is also stepped onto from the arcade. A's new landing (27.4, 0, −7.7) rechecked for rules 8, 9 and 12 (§3.10, ENGINE.md §5) | fixed |
| A8 | **major:** the Bazookarp weir too close to the bubble column (SPEC §9.1 #9) | Bubble column moved to z ±21.5 (the engineer's figure): its surface is 5.7 m from the weir at (0, ±28); it still blocks the wing-to-deck axis line; the tower's lane keeps 1.35 m each side. The shark-viewing bench moved to x 3.0…5.4, z ∓29.7…∓30.3 (3.45 m from the weir). Pond → weir 49 %, weir → Gate 53 % and 31.3 m re-measured | fixed |
| A9 | minor: the Gulper rider below the Great Tank's water volume, so the camera fix never engages | Volume now y −0.6…2.3 with the tank's sand bed sunk to −0.6; `inWater` tests the rider's centreline point (ENGINE.md §3.6); STOP 4 and §6.2 assert the camera inside the volume on every frame the rider is inside the tank | fixed |
| A10 | minor: stale Bazookarp thresholds; L only 1.5 m over the floor | §4.4 and §6.2 quote SPEC §9.1 #3 (≥ 45 % of L and ≥ 25 m); L is 59.5 m (4.5 m of margin) | fixed |
| A11 | minor: mid could be a fortress | A 3.6 m **Lookout** on each promenade sees the deck rim from 14–17 m; the deck has four hatches at 1.2 m (was two at 1.0); the zone-match test stays in §6.2 | fixed |
| A12 | minor: only the top 0.7 m of the landmark shows from the spawn | Bathysphere centre raised to 14.5 m (13.05–15.95), gantry beams 16.8–17.8, winch house to 20.0. From the `play` camera behind each pad the line to the ball's underside clears the gatehouse crest by 1.5 m: the whole sphere shows (§5.1); checked again at STOP 1 | fixed |
| A13 | minor: the dusk tank glow had no cap | Dusk tank emissive warm white or pale lilac, never cyan or green, capped at 60 % of a fresh splat's luminance (§5.4, §5.7); §6.2's dusk palette test with all five palettes | fixed |
| A14 | minor: plan hygiene (no `H` cells, sea cells inside the footprint, Bravo not the exact turn) | §2.3, §3.11 and §4.5 are now printed by the raster script from the piece tables: gantry legs drawn as `H`, every cell the most solid thing in it, no sea between the promenades and the wings, Bravo's half the exact turn of Alpha's (the whale-tail bench included) | fixed |

### The build / modes engineer

| # | severity, issue | what I did | status |
|---|---|---|---|
| B1 | **major:** the Gulper rider outside its own water volume; camera above the deck lid; no tank floor | As A9: the volume y [−0.6, 2.3], the sand bed sunk to −0.6 inside the tank's 16-gon (in the piece table), `inWater` on the centreline point (pos + 0.3), and a `pipes-cam` check on the real stage (boom ≥ 1.2 m, y ≤ 2.0 on every frame inside the tank) in ENGINE.md step 12 | fixed |
| B2 | **major:** the weir fails checker #15 because of the bubble column | As A8, with the engineer's numbers: column at (0, ∓21.5), weir kept at (0, ±28), bench ≥ 3.45 m from it, and the `routes.centre` hint offset to x 2 past the column (§4.4) | fixed |
| B3 | **major:** no cover on the Gate apron (checker #13) | As A2: three blocks ≥ 1.2 m within 4 m of route 1 between the deck and the Gate, clear of Bravo's tower goal by more than 0.6 m (the goal moved with the track redesign) | fixed |
| B4 | **major:** the penguin glass lower than the ground next to it | As A5. The beach is now a `roof` cove (a fall into the sea for anyone who lands there by a special); climb-audit plus the walk-off probe on both halves in §6.1 step 1 and §6.2 | fixed |
| B5 | **major:** rules 13 and 14 broken at the Gulper and Kelp A mouths; the compliance table omitted or misstated them | **Rule 14:** each gulper head's bronze neck now runs to the tank glass (head and neck x 7.5…12.7), `hide` [[0, 5.2], [20.2, 25.4]]; no floor is buried under any pipe piece. **Rule 13:** restated in ENGINE.md §5 for a stage whose mouths sit in walls: the ring seen from ≥ 90 % of the walkable points 2–6 m out within ±30° of the axis and from ≥ 10 points 10 m or more away (the critic proposed "5 m out within ±30°"; mine is stricter near the mouth and adds the far test). Measured 90–100 % and 12–130 points. Rows 13 and 14 with these values are in the compliance table | fixed |
| B6 | minor: 1.3–1.4 m hops are not nav jump edges | Every tier step is now 1.2 m (jump edges); the Kelp Balcony and the Lookouts are 3.6 (1.2 over the promenade); §2.2 says which faces are climbs (only the promenades' inkable 2.4 faces). The Bazookarp routes use no climb | fixed |
| B7 | minor: the ring/wing junction at the SW and NE corners undefined | Redrawn with the wings: the promenade's floor runs to r 31.4 with the sea rail on r 31.0–31.4, a 9° rail gap for the Penguin Steps (radial at α −120°, 5 m wide, their top the promenade's own floor, their foot flat on the rock terrace); between the promenade and the terrace there is wall and floor, no sea. Arch B's pop region rechecked (rule 9 row of the compliance table) | fixed |
| B8 | minor: spawn exits pointed at the sea; no rails on the deck's sea edges | The pavilion stairs now run along the deck's flanks and descend toward mid, ending on the plaza at the deck's front corners; rails on the deck's curved back, the stair landings, the stairs' outer sides and the plaza's east edge (§2.4) | fixed |
| B9 | minor: glass and water rendering, AO bake and performance budget left to guess | Every glass and water volume is a `hidden: true` collider plus a drawn prop, flagged `bakeClear` so the AO bake traces through it (ENGINE.md H15); a tank sub-budget (≤ 30 draw calls, ≤ 250 k triangles, kelp in the vertex shader, ≤ 3 transparent layers from the deck or a promenade) measured with `shoot.cjs` from STOP 3 (§5.3, §6.2) | fixed |
| B10 | minor: tidal nav edges and the A* heuristic | A tidal leg yields both directed specs at load with `pipeShut` masking the closed one; on stages with pipe edges A*'s heuristic is scaled by `hScale` (0.45 here: the cheapest pipe's cost over its straight span); `pipes-bots` asserts a bot rides when the pipe saves ≥ 5 m (ENGINE.md H6 c, §4.3, step 7) | fixed |
| B11 | minor: Kelp Line B geometry had zero margin and did not fit its housing | Overhead run raised to 9.0 m (drop 5.8 m against the 5.5 needed; glass top 9.88 ≤ 11); end run 3.5 m against 3.2; the deep stop lengthened radially to r 28.3 → 33.2, standing past the sea rail, with the 2.2 m void inside it. Rule 26 for the moved line: 0.92 / 0.88 | fixed |
| B12 | minor: the tower's double drop not where the table said | The Feeding Steps are 2.6 m deep (z 7.2…9.8) and 4.0 m wide, so the platform sits wholly on the step between the drops; the table now gives the as-built drop points (z ≈ 8.6 and 11.0, where the platform's edge leaves each top) for the whole new track (§4.3) | fixed |
| B13 | minor: Bazookarp data details (a)–(e) | (a) the spawn deck's front is a non-inkable glass-block fascia, so it really is a one-way drop (3.4 m, a `nav` drop edge), and it is listed for a lead waiver under #7c (the defenders' own deck, reached only from inside the Gate's ring); (b) L 59.5 m; (c) the acceptance rows quote ≥ 45 % of L and ≥ 25 m; (d) the Kelp Balcony free zone has arc points every 10°; (e) `noRest` 8-gons of r 2.5 m round every pipe end's approach and landing, and riders in any phase cannot pick the Bazookarp up (ENGINE.md §3.7's Bazookarp note) | fixed |
| B14 | minor: boss and device statements that did not match the code | The arcade canopy now runs 4.6–5.3 m, so `bossNav.js`'s 5.2 m probe reads it as a wall (no boss-only blockers needed); the device sentence is corrected (sprinklers and beacons are not body colliders and do not block a mouth) and a new hook, H18, makes every rider skip the Drip Curtain's shove (§3.7, ENGINE.md §3.7) | fixed |

### What changed besides the issues

- The floor fell from 5,930 to **5,446 m²**, because the blades are narrower than the old boxes; the acceptance range in
  §6.2 follows (5,200–5,700 m²). Both lanes of every half still meet the Long Stages target (6.06 s).
- The right flank is now the long one (93.5 m to the deck, 7.93 s; 62.8 m to the promenade's middle), a consequence of
  the blade sweeping to the left; the left flank is as short as the centre (72.2 m). The Express gives the right flank's
  head a 3 s link from the plaza.
- The court's first-revision planter overlapped the grand stair by 1.1 m; it and the court bench are gone.
- Tower Command gets a variant, `aquarium.tower`, without three cover pieces that stand on the track (§4.3). The track is
  147.8 m (was 155.8), drawn on the stage's square grid through the swept wing, with six height changes (was seven); the
  acceptance range moved to 140–155 m, among the other two-checkpoint tracks (Nantai 138.3, Treehills 144.0, Craters
  147.5, Calamari 159.0 m, measured from `MAP_LAYOUTS`).
- The Kelp Line's B end moved from α 44° to 48° on the enemy promenade, the Feeding Steps grew to 4.0 × 2.6 m, and every
  first-revision 1.3 m tier became 1.2 m (B6).
