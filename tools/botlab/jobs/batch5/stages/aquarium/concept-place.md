# `aquarium` concept: THE PLACE FIRST — Gulper Aquarium

One of three independent concepts for the batch-5 aquarium stage. This one starts from the building, the story it
tells and what you see from every camera, and derives lanes, heights, cover and routes from that architecture. All
numbers are world metres and seconds. Alpha spawns at −Z, Bravo at +Z, and Bravo's half is the 180° turn of Alpha's
half ((x, z) → (−x, −z)). Bearings α are measured in plan from +x (east, 0°) toward +z (north, 90°); south (Alpha's
side) is −90°.

The user's words for this stage: "an aquarium. there's a gimmick on this map too, there's clear pipes that can suck
you in one end and pop you out the other, similar to Super Mario 3D World. Some pipes are bi-directional, and some
are one way only."

---

## 1. Names and identity

**Name options**
1. **Gulper Aquarium** (recommended). The gulper eel is the deep-sea fish whose mouth is bigger than its body: it
   swallows anything. The two bronze gulper-eel heads at mid are the mouths of the stage's central pipe, and the
   aquarium's emblem is a gulper eel coiled into a ring, the plan of the building.
2. **Barreleye Aquarium.** The barreleye has a transparent head. Its emblem is a clear dome, and the whole building
   is about seeing through glass.
3. **Siphon Point Aquarium.** Every squid swims by its siphon. The pipe network would be the "Siphon Line", on a
   rocky point.

**Identity.** Gulper Aquarium is Inkopolis's grand public aquarium, built in 1936 in white Streamline Moderne as a
round drum on its own small island off the seafront. Visitors arrive by ferry at two piers, one on each side, and
each pier has an entrance pavilion with a neon fin tower. Inklings dissolve in water, so every drop here sits behind
glass. That is the house rule, and it is painted on the signs: "ALL WATER IS BEHIND GLASS". The building is a ring of
galleries around an open-air **Ocean Court**. One side of the ring is the low **Reef Hall** arcade with its glowing
wall tanks. The other is the high **Sea Promenade** terrace, open to the sea. Two tall glass **Kelp Drums** rise where
the two meet. In the middle of the court stands the landmark everyone fights over: **the Great Tank**, a 15 m glass
drum full of sharks and rays, with the keepers' **Feeding Deck** on its lid. Above it, on its old winch gantry, hangs
**Bathysphere No. 1**, the riveted steel diving ball that went down 923 m in 1934. Last spring the aquarium threaded
the whole building with **the Tubeway**: clear, dry pneumatic tubes that whisk visitors in squid form from exhibit to
exhibit, through the shark lagoon and up inside the kelp. Today the aquarium is closed for a Turf War, and the ferries
are tied up at the piers.

What a player remembers after one match:
- the pop of a teammate shooting out of a bronze eel's mouth on the far side of the Great Tank, after you watched
  them slide through the sharks under your feet;
- a squid spiralling up inside a 9 m kelp drum, through the fronds, to burst out on a balcony over the enemy's
  promenade;
- the chime, then "THE KELP LINES ARE NOW FALLING": the arrows on the glass run backwards, and the uphill route is
  suddenly a dive;
- the bathysphere hanging over mid, its portholes lit at dusk;
- the Shark Arch, the 9 m-wide glass tunnel you charge through to get into the court, with sharks over your head.

---

## 2. The plan

### 2.1 Macro shape: a ring with two swept wings (a two-bladed propeller)
- **The ring.** The aquarium drum is a circle of radius 30.5 m (its outer wall reaches 31.2). Inside it is the open
  Ocean Court (r ≤ 20 m), with the Great Tank at the centre.
- **The two wings.** Each spawn wing hangs off the ring at its south (Alpha) or north (Bravo) gate. Each wing is
  offset to one side, because its penguin exhibit is scenery behind glass: Alpha's playable wing spans x −17 … +24,
  and Bravo's spans x −24 … +17.
- **The silhouette.** Seen from above, the playable outline is a disc with two offset wings turning the same way (a
  two-bladed propeller, or a pinwheel). The two round Kelp Drums bulge at east and west, and on the two promenade arcs
  the sea comes right up to the edge.
- **How it differs from the other stages.** It is not a band, a diamond, an S or a stadium. Craters is the closest
  round stage: it is a stadium of downs. This is one drum with offset blades and a walled half and an open half.
- **Bounds:** x −33 … 33, z −76 … 76. Walkable floor is about 5,600 m², measured on the plan raster: Craters after
  the stretch had 5,818 m².

### 2.2 The plan in ASCII (whole stage, 1 character = 1 m across, 1 row = 2 m down)

```
 legend  ~ sea      # solid / off-limits top (walls, roofs, gatehouses, kiosks, plant rooms, the fin tower)
         . floor 0  : floor 0 under a roof (arcade canopy, the Shark Arch tunnel)   _ viewing step 0.5
         1 tier 1.3   2 tier 2.4   3 tier 3.8   D the Feeding Deck (2.4)   X centre (0, 2.4, 0)
         / ramp       s stairs     = solid balustrade 0.9 (on the promenade's inner edge) / turnstile row
         K kelp drum (glass, 9 m)  G bronze gulper head (pipe mouth inside)  H gantry leg  J jelly column
         T touch tank (1.0 glass)  M diving-helmet sculpture  F sand filter  q pump set  v valve wall
         o column   B ticket booth   b bench   p planter   i Tubeway map lectern   P penguin exhibit (out of bounds)
         | 2 m glass wall   k Kelp Line mouth   e Penguin Express mouth   Q Bazookarp checkpoint   * Bazookarp goal
         @ spawn pad
            |         |         |         |         |         |         |
 z +75   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#######~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~      Bravo's fin tower
 z +73   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#######~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 z +71   ~~~~~~~~~~~~~~~~~~~~###########################~~~~~~~~~~~~~~~~~~~~
 z +69   ~~~~~~~~~~~~~~~~~~~~333333333333333333333333333~~~~~~~~~~~~~~~~~~~~      Bravo's Fin Terrace (spawn 3.8)
 z +67   ~~~~~~~~~~~~~~~~~~~~333333333333333333333333333~~~~~~~~~~~~~~~~~~~~
 z +65   ~~~~~~~~~...........3333333333333@3333333333333........~~~~~~~~~~~~
 z +63   ~~~~~~~~~...ssssssss333333333333333333333333333ssssssss~~~~~~~~~~~~
 z +61   ~~~~~~~~~...ssssssss333333333333333333333333333ssssssss~~~~~~~~~~~~
 z +59   ~~~~~~~~~..............................................~~~~~~~~~~~~      forecourt
 z +57   ~~~~~~~~~...............................bbb............~~~~~~~~~~~~
 z +55   ~~~~~~~~~..............###.......*.....................~~~~~~~~~~~~
 z +53   ~~~~~~~~~..............................................~~~~~~~~~~~~
 z +51   ~~~~~~~~~#........................................|PPPPPPPP~~~~~~~~
 z +49   ~~~~~~~~~#11111...................................|PPPPPPPP~~~~~~~~
 z +47   ~~~~~~~~~#1FF11.....qqq................p..e...2222|PPPPPPPP~~~~~~~~      Pump Hall (W) | Penguin Pt (E)
 z +45   ~~~~~~~~~#11111..........pp...................2222|PPPPPPPP~~~~~~~~
 z +43   ~~~~~~~~~#11111...........111111111111111.....2222|PPPPPPPP~~~~~~~~
 z +41   ~~~~~~~~~#1FF11.....ee....111111111111BB1ss.111111|PPPPPPPP~~~~~~~~      Ticket Hall (1.3)
 z +39   ~~~~~~~~~#11111.........ss11111111Q111111...111111|PPPPPPPP~~~~~~~~
 z +37   ~~~~~~~~~#11111.........ss111111111111111...111111|PPPPPPPP~~~~~~~~
 z +35   ~~~~~~~~~#1FF11.....qqq...111111111111111...111111|PPPPPPPP~~~~~~~~
 z +33   ~~~~~~~~~#11111........o...........sssss....111111|PPPPPPPP~~~~~~~~
 z +31   ~~~~~~~~~#11111...............:::::::.......111111|PPPPPPPP~~~~~~~~      Gate Terrace
 z +29   ~~~~~~~~~######.....####_####:::::::::####2.sssss~~~~~~~~~~~~~~~~~~      North Gate + Shark Arch
 z +27   ~~~~~~~~~######....::__::####:::::::::####222222s~~~~~~~~~~~~~~~~~~
 z +25   ~~~~~~~~~######.::::::::::###:::::::::###2222222222~~~~~~~~~~~~~~~~
 z +23   ~~~~~~~~~####:::::::::....###:::::::::###2222222222222~~~~~~~~~~~~~
 z +21   ~~~~~~~~~~#::::::::........##:::::::::##222222222##22222~~~~~~~~~~~      NW Reef Hall | NE Sea Promenade
 z +19   ~~~~~~~~~#::::::..........................=222222222k2222~~~~~~~~~~
 z +17   ~~~~~~~#_:::::............JJ.......ii.......112222222222222~~~~~~~~
 z +15   ~~~~~~#__::::........................TTTTT......=22222222222~~~~~~~
 z +13   ~~~~~#__::::......................................22222###222~~~~~~
 z +11   ~~~~#__:::...................HH.....HH..........pps=2222222222~~~~~
  z +9   ~~~~__::::.............////.....111.....ssss.......ss22222##222~~~~
  z +7   ~~~#:kk:///.........MM../////..DDDDD..sssss..........=22///2222~~~~
  z +5   ~~~::kk://////............//DDDDDDDDDDDss.......JJJ..//////23333~~~      E Kelp Balcony (3.8)
  z +3   ~~###KKKKKKK///............DDDDDDDDDDDDD........JJJ.///KKKKKKK###~~
  z +1   ~~##KKKKKKKKK///.....GGG..DDDDDDDXDDDDDDD..GGG.....///KKKKKKKKK##~~      W drum | Great Tank | E drum
  z -1   ~~##KKKKKKKKK///.....GGG..DDDDDDDXDDDDDDD..GGG.....///KKKKKKKKK##~~
  z -3   ~~###KKKKKKK///.JJJ........DDDDDDDDDDDDD............///KKKKKKK###~~
  z -5   ~~~33332//////..JJJ.......ssDDDDDDDDDDD//............//////:kk::~~~      W Kelp Balcony (3.8)
  z -7   ~~~~2222///22=..........sssss..DDDDD../////..MM.........///:kk:#~~~
  z -9   ~~~~222##22222ss.......ssss.....111.....////.............::::__~~~~
 z -11   ~~~~~2222222222=spp..........HH.....HH...................:::__#~~~~
 z -13   ~~~~~~222###22222......................................::::__#~~~~~
 z -15   ~~~~~~~22222222222=......TTTTT........................::::__#~~~~~~
 z -17   ~~~~~~~~222222222222211.......ii.......JJ............:::::_#~~~~~~~
 z -19   ~~~~~~~~~~2222k222222222=..........................::::::#~~~~~~~~~      SW Sea Promenade | SE Reef Hall
 z -21   ~~~~~~~~~~~22222##222222222##:::::::::##........::::::::#~~~~~~~~~~
 z -23   ~~~~~~~~~~~~~2222222222222###:::::::::###....:::::::::####~~~~~~~~~
 z -25   ~~~~~~~~~~~~~~~~2222222222###:::::::::###::::::::::.######~~~~~~~~~
 z -27   ~~~~~~~~~~~~~~~~~~s222222####:::::::::####::__::....######~~~~~~~~~      South Gate + Shark Arch
 z -29   ~~~~~~~~~~~~~~~~~~sssss.2####:::::::::####_####.....######~~~~~~~~~      Service Gate (x 13–19)
 z -31   ~~~~~~~~PPPPPPPP|111111.......:::::::...............11111#~~~~~~~~~      Gate Terrace
 z -33   ~~~~~~~~PPPPPPPP|111111....sssss...........o........11111#~~~~~~~~~
 z -35   ~~~~~~~~PPPPPPPP|111111...111111111111111...qqq.....11FF1#~~~~~~~~~
 z -37   ~~~~~~~~PPPPPPPP|111111...111111111111111ss.........11111#~~~~~~~~~      Ticket Hall (1.3)
 z -39   ~~~~~~~~PPPPPPPP|111111...111111Q11111111ss.........11111#~~~~~~~~~
 z -41   ~~~~~~~~PPPPPPPP|111111.ss1BB111111111111....ee.....11FF1#~~~~~~~~~
 z -43   ~~~~~~~~PPPPPPPP|2222.....111111111111111...........11111#~~~~~~~~~
 z -45   ~~~~~~~~PPPPPPPP|2222...................pp..........11111#~~~~~~~~~
 z -47   ~~~~~~~~PPPPPPPP|2222...e..p................qqq.....11FF1#~~~~~~~~~      Penguin Pt (W) | Pump Hall (E)
 z -49   ~~~~~~~~PPPPPPPP|...................................11111#~~~~~~~~~
 z -51   ~~~~~~~~PPPPPPPP|........................................#~~~~~~~~~
 z -53   ~~~~~~~~~~~~..............................................~~~~~~~~~      forecourt
 z -55   ~~~~~~~~~~~~.....................*.......###..............~~~~~~~~~
 z -57   ~~~~~~~~~~~~............bbb...............................~~~~~~~~~
 z -59   ~~~~~~~~~~~~..............................................~~~~~~~~~
 z -61   ~~~~~~~~~~~~ssssssss333333333333333333333333333ssssssss...~~~~~~~~~
 z -63   ~~~~~~~~~~~~ssssssss333333333333333333333333333ssssssss...~~~~~~~~~
 z -65   ~~~~~~~~~~~~........3333333333333@3333333333333...........~~~~~~~~~      Alpha's Fin Terrace (spawn 3.8)
 z -67   ~~~~~~~~~~~~~~~~~~~~333333333333333333333333333~~~~~~~~~~~~~~~~~~~~
 z -69   ~~~~~~~~~~~~~~~~~~~~333333333333333333333333333~~~~~~~~~~~~~~~~~~~~
 z -71   ~~~~~~~~~~~~~~~~~~~~###########################~~~~~~~~~~~~~~~~~~~~
 z -73   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#######~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~      Alpha's fin tower
 z -75   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#######~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            3         2         1         0         1         2         3      (x: tens of metres, −33 … +33)
```
The plan was drawn from the coordinates in the table below by a raster script, so the drawing and the table agree.
The rows sit at odd z, so a piece only 1 m deep can fall between two rows. The turnstile row at z −42.2 and the gantry
legs' exact edges are examples: the table is the authority.

### 2.3 Heights, and what a 1.8 m climb means here
| tier | where |
|---|---|
| **0** | the Ocean Court; the Reef Hall arcades; the Shark Arch tunnels; the Gate Terraces; the lanes; the Pump Hall floor; the forecourts |
| **0.5** | the Reef Window viewing steps (a curb you walk over) |
| **0.9–1.1** | cover heights: planters, the touch tanks (1.0), the promenade balustrade (0.9 on top of 2.4), pump sets (1.0), the whale-tail bench (1.1) |
| **1.3** | the Feeding Steps (one hop up onto the deck's edge), the promenade hop step, the Ticket Hall, Penguin Point's rock terrace, the Pump Hall's filter bund |
| **2.4** | **the Feeding Deck (mid)**, the Sea Promenades, Penguin Point's upper rock |
| **3.8** | the Kelp Balconies, the Fin Terraces (spawn decks) |
| off-limits | gulper heads 2.4, filters 4.3, kiosks 2.6, the Ticket Hall's glass canopy 6.6, the arcade canopies 4.6–5.0, the gatehouses 7.0–7.8, kelp drum crowns 9.6, the gantry 11.8, fin towers 18. All `roof: true` (slide off). |

What a 1.8 m climb (a hop plus the ledge assist) means on this stage:
- **These steps are hops:** 0 → 1.3, 1.3 → 2.4 and 2.4 → 3.8.
- **0 → 2.4 is a wall.** You need a ramp, a stair or an inked face. That is why the deck has its Feeding Steps (a 1.3
  shelf you hop through) and the promenade has its hop step.
- **The promenade's inner face is the main swim-up.** It is a 2.4 m render face, inkable, so you can swim up it all
  along its length.
- **Glass is never climbable.** Glass is never inkable either: tank sides, the 2 m penguin glass and the pipes. The
  Feeding Deck's 2.4 m glass sides can only be passed by its ramps, stairs and steps. This is deliberate: the
  island's ways up are readable.
- **The Kelp Balconies are hop-ups.** A balcony is 1.4 m over its promenade, so players hop up. The Kelp Lines (§3)
  also drop riders onto them.

### 2.4 The main pieces (Alpha's half and the singles; Bravo's half is the 180° turn)
| piece | centre x / z | size (m) | floor / top | purpose |
|---|---|---|---|---|
| **Great Tank + Feeding Deck** (single) | 0 / 0 | Ø 15.0 glass drum | glass 0–2.4; teak deck lid **2.4**; acrylic viewing lens Ø 3.2 at the centre (inkable) | mid landmark and high ground; centre zone, tower start, Bazookarp start |
| Feeding Gantry (single frame) + Bathysphere | legs (±3.6, ±11); beams N–S at x ±3.6 | legs 1.2 × 1.2; beams at 11.0–11.8; sphere Ø 2.9, bottom at 8.3 | off-limits | the landmark seen from both spawns; the legs are cover on the centre lanes |
| Gulper heads (E listed; W is its twin) | 11.1 / 0 | 3.2 (x) × 2.6 × 2.4 tall | roof | bronze eel heads; their jaws hold the Gulper Run's mouths, facing out (E head faces +x) |
| Feeding Step S (N is its twin) | 0 / −8.35 | 3.0 × 2.3 | 1.3 | the hop-through onto the deck from the centre lane; the tower's double drop |
| Deck ramp SE (NW twin) | radial at α −45°, r 7.5 → 13.5 | 4.0 wide, run 6.0 | 2.4 → 0 (21.8°) | way up for kids and carriers |
| Deck stair SW (NE twin) | radial at α −135°, r 7.5 → 13.5 | 4.0 wide | 2.4 → 0 | way up |
| Jelly column J1 | 6.5 / −17.5 | Ø 2.4 glass on a Ø 3.0 plinth (0.6) | glass to 4.2, brass cap (roof) | see-through cover at the tunnel mouth |
| Jelly column J2 | −16 / −4 | same | same | see-through cover by the west gulper |
| Touch tank | −6 / −15.5 | 5.0 × 2.2 | 1.0 (glass top, glove ports) | low see-through cover |
| Diving-helmet sculpture | 12.5 / −6.5 | Ø 2.6 | 2.6 (roof) | hard cover east of the deck |
| Planter, lectern, bench | (−15.5, −11.5) / (−2.5, −17) / (−10.5, −16) | Ø 2.0 / 2.0 × 0.6 / 2.5 × 0.6 | 0.9 / 1.3 / 0.5 | small cover |
| **SE Reef Hall** (Alpha's left; NW twin) | ring α −73° … −12°, r 20 → 30.5 | ≈ 280 m² | 0; canopy r 25.5–30.5 at 4.6–5.0 (roof) | the LOW flank: a colonnade (Ø 0.9 lamp columns at α −70°, −60°, −27° on r 20.8), the Reef Window wall-tank glowing along the outer wall (glass 0.6–3.4) |
| Reef Window viewing step | r 29–30.5, α −73 … −66 and −35 … −14 | — | 0.5 | a kerb under the window; kept off the Service Gate and the tower lane |
| Service Gate | outer wall at x 13.2 … 18.8 (z ≈ −26) | 5.6 wide, lintel 5.5 | 0 | the arcade → the Pump Hall; tower checkpoint 1 (in Bravo's twin) |
| **SW Sea Promenade** (Alpha's right; NE twin) | ring α −168° … −107°, r 21 → 30.5 | ≈ 260 m² | **2.4** | the HIGH flank, open to the sea: inkable inner face (r 21), solid balustrade 0.9 on r 21–21.4 with gaps, a see-through sea rail on r 30.5 |
| Promenade grand stair | radial at α −150°, r 15.6 → 21 | 5.0 wide | 0 → 2.4 (24°) | court → promenade |
| Promenade hop step | α −122°, r 19.2 → 21 | 3.5 wide | 1.3 | court → promenade by two hops |
| Promenade furniture | skylight dome α −150° r 26.5 (Ø 3, 1.2); kiosks α −160° r 27 and α −128° r 27 (2.5², 2.6) | — | roof | cover on the terrace; the domes light the Jelly Gallery below |
| **Kelp Drum E** (on the half line; W twin) | 25 / 0 | Ø 9.0 glass | 0 → 9.0, crown 9.0–9.6 (roof); plant room x 29–31.2, \|z\| ≤ 3 (roof) | a vertical landmark; the Kelp Line rides inside it |
| Kelp Ramp E | round the drum's court side, r 5.0–7.5 from (25, 0), bearing −90° → 180° → +90° | 2.5 wide, 6 straight 30° segments of 3.24 m | 0 (Alpha's arcade) → 2.4 (Bravo's promenade), 7° | where the low flank meets the high flank; its solid flank faces the court |
| Kelp Balcony E | the drum's NE side, r 4.6–7.2 from (25, 0), bearings 15° … 75° | ≈ 16 m², rail edge | **3.8** | a lookout over Bravo's promenade and the NE court; a Kelp Line branch mouth |
| **South Gate** gatehouse | ring α −107° … −73°, r 20 → 31.2 | solid to 7.0, parapet 7.0–7.8 | roof | GULPER AQUARIUM letters and a two-faced clock |
| **Shark Arch** tunnel | x −4.5 … 4.5, z −19.6 → −31.2 | 9.0 wide, 11.6 long, glass vault (crown 4.8, ≥ 4.4 clear over its middle 5 m) | 0 | the centre lane into the court; the Arch Tank above, at 4.8–7.0 |
| Gate Terrace | x −10 … 10, z −31.2 → −35 | 20 × 3.8 | 0 | the tunnel's wing-side mouth |
| **Ticket Hall** (strategic point) | 0 / −39 | 14 × 8 (x −7 … 7, z −35 … −43) | **1.3**; glass canopy 6.6–6.8 (roof) on 4 columns 0.7² at (±6.6, −35.3) and (±6.6, −42.6) | side zone, Bazookarp checkpoint, tower checkpoint 2 (Bravo's twin) |
| Ticket Hall stairs | NW: x −6 … −2, z −32.1 → −35; E: x 7 … 9.9, z −37 … −39; W: x −9.9 … −7, z −40.5 … −42.5 | 4 / 2 / 2 wide | 0 ↔ 1.3 | plus a hop-up anywhere on its rim |
| Ticket Hall furniture | booth x −6.6 … −4.6, z −42.6 … −40.6; turnstile row x −4 … 2, z −42.6 … −41.8 (4 units, 0.8 m gaps) | 2 × 2 × 2.4 / 1.0 tall | roof / solid | cover on the hall (kept off the tower lanes, §4) |
| West lane / east lane | x −11 … −7 / x 7 … 10, z −31 … −52 | 4 / 3 wide | 0 | the hall's sides |
| **Pump Hall** (Alpha's left; back of house) | x 10 … 24, z −22 (ring wall) … −52 | 14 × 30 | 0; steel sawtooth roof at 7.0 (roof); columns 0.4² on x 10.2 at z −33, −38.5, −44, −49.5; back wall x 23.5–24.5 | the left flank through the wing: an open-sided steel shed |
| Filter bund + 3 sand filters | bund x 18.5 … 23.5, z −31 … −50; filters Ø 2.6 at (21.5, −35 / −41 / −47) | — | bund 1.3; filters to 4.3 (roof) | high ground in the hall; tall cover |
| Pump sets, valve wall | (12, −35.5), (12, −47); valve wall (12.3, −31.5) | 2.0 × 1.5 / 3.0 × 0.8 | 1.0 / 1.6 | cover in the hall's west strip |
| **Penguin Point** (Alpha's right) | visitor side x −17 … −11, z −30 … −52; exhibit x −25 … −17.4 (out of bounds) | — | rock terrace 1.3 (z −30 … −42), upper rock 2.4 (x −17 … −12.5, z −42 … −48) | the right flank through the wing; penguins behind a 2.0 m glass wall at x −17.4 |
| Penguin Steps | x −15 … −11, from the promenade's sea rail (z ≈ −27.4) to z −30.6 | 4 wide | 2.4 → 1.3 | promenade → wing |
| Forecourt | x −17 … 24, z −43 … −60.5 (to −65 beside the pavilion) | ≈ 600 m² | 0 | the defenders' apron; the Bazookarp goal at (0, −55.5) |
| Forecourt furniture | whale-tail bench (−8, −56.5) 3.0 × 1.2 × 1.1; souvenir kiosk (9, −55.5) 2.5² × 2.6 (roof); fish topiary planters Ø 2.0 × 1.1 at (−6, −47.5), (7.5, −45.5) | — | — | cover on the apron |
| **Fin Pavilion** (spawn) | x −13 … 13, z −60.5 … −72 | 26 × 11.5 | spawn deck **3.8** (x −13 … 13, z −61 … −70.5); pad (0, 3.8, −65.5); barrier 4.2 | the entrance pavilion; its roof terrace is the spawn |
| Pavilion stairs | east x 13 → 21.5, west x −13 → −21.5, at z −61 … −64 | 3 wide, run 8.5 | 3.8 → 0 (24°) | two of the spawn's three exits; the third is the 3.8 m front drop |
| Fin tower | x −3 … 3, z −72 … −75 | 18 m | roof | the base's landmark: vertical neon AQUARIUM |

### 2.5 Lanes, flanks and routes (Alpha's view, looking north; Alpha's left is +x)
- **The centre lane:** the Fin Terrace → the forecourt → over or round the Ticket Hall → the Gate Terrace → **the
  Shark Arch** → the court's south band → the Feeding Step → the deck. The tunnel is 9 m wide, so it is a gate, not a
  corridor.
- **The left flank (low):** the forecourt → **the Pump Hall** (its main aisle x 14.75–17.25, the filter bund above it)
  → **the Service Gate** → **the SE Reef Hall** under the canopy → the Kelp Ramp's foot at the E drum. From there:
  - up the ramp onto the enemy's NE promenade;
  - into the court at any colonnade gap;
  - or the Kelp Line (§3).
- **The right flank (high):** the forecourt → **Penguin Point** (the lane, the rock terrace at 1.3, the upper rock at
  2.4) → **the Penguin Steps** → **the SW Sea Promenade** (2.4) along the sea → the W drum. From there:
  - down the W Kelp Ramp into the enemy's NW arcade;
  - hop up onto the W Kelp Balcony;
  - or drop into the court.
- **The inner flanks:** the court's two sides round the Great Tank (east past the gulper and the diving helmet; west
  past the jelly column and the touch tank). They meet mid at the gulper heads and at the deck's four ways up.
- **Where each team's routes meet mid:**
  - the deck's south side (centre lane);
  - the E drum and the east gulper (left flank);
  - the W drum and the west gulper (right flank);
  - all along the promenade's balustrade (the high flank looks down on the court).

  That is four distinct meeting points. There are three routes from the base into the ring (tunnel, Service Gate,
  Penguin Steps), and many from the ring into the court.
- **The character of each flank.** Each team's left is low and covered: the arcade, with short sightlines and wall
  tanks. Its right is high and open: the promenade, with long sightlines over the court and the sea at its back. Where
  your low flank meets the enemy's high flank (at a drum), they have the height and you have the Kelp Line (§3).

### 2.6 Cover spacing (the user's 6–10 m rule)
- **The court.** It is an annulus 12.5 m wide round the deck. Hard cover stands at most 7–8 m apart round it:
  - the gantry legs;
  - the jelly columns;
  - the touch tank, the diving helmet and the planter;
  - the gulper heads;
  - the deck's ramps and stairs;
  - the drums' ramps.

  The open floor left in the court is about 830 m², and no open circle in it is wider than about 5 m in radius.
- **The arcade.** Lamp columns every 4–11 m, the viewing step, benches, two coral sculptures (Ø 1.6, 1.6 tall at
  α −40° r 27 and α −66° r 24) and the Kelp Line stop.
- **The promenade.** The balustrade along its inner edge, the dome, the two kiosks, coin telescopes and benches.
- **The wing.** Every 5–8 m: the hall's booth, turnstiles and columns, the filters and pumps, the rocks, the planters,
  the bench and the kiosk.
- **Exempt open areas:** the deck top (the zone) and the forecourt's goal circle (r 3 round (0, −55.5)).
- **The target:** cover-map ≥ 90 % of the floor within 5 m of cover at least 0.9 m tall, measured with
  `tools/botlab/tests/cover-map.js` + `cover-map.py`.

### 2.7 Spawn to mid (the Long Stages standard)
- **Straight line:** the pad (0, 3.8, −65.5) to the centre is 65.5 m.
- **Nav path, estimated:** about 67 m. That is the deck front drop (one-way), the forecourt, a hop over the Ticket Hall
  or round it, the Gate Terrace, the Shark Arch, the court, the Feeding Step, the deck.
- **Swim time:** about 5.7 s, plus about 0.3 s for the drop and the hops, so **≈ 6.0 s**. The target band is 6.0–6.3 s.
- **If the build reads long,** shorten the wing by moving the forecourt and the pavilion in by up to 2 m. Measure with
  `tools/botlab/tests/spawn-mid.js`.
- **The pipes do not shorten it.** None starts in a spawn or runs toward a base.

### 2.8 Glass (one shared-engine flag this stage needs)
Glass is the material of this place, so it needs one level flag: **`glass: true`** on layout pieces and on prop
colliders (`B.col(…, { glass: true })`). Glass is:
- solid to players, squids, shots, ink and thrown bombs;
- never inkable, and never swum up;
- **not** a sight blocker: bot perception (`botSight.js`) sees through it, as players do. The camera boom still
  collides with it, so the camera never ends up inside a tank.

Shots and ink that hit glass make a white "beaded" splat. It runs down and fades in 1.5 s, with a glassy "tock". That
is how the player learns "I can see him but can't shoot him" in one hit. This is a small change in `level.js` /
`physics.js` / `botSight.js`. It is tagged `[b5-aquarium]`, and every other stage is unaffected.

---

## 3. The gimmick: the Tubeway (clear pipes, as in Super Mario 3D World)

### 3.1 The network: five pipes of three kinds
The tubes are clear acrylic with brass collars every 3 m, 1.7 m outside diameter. Inside each one a squid travels at
**18 m/s**.

| pipe | kind | ends (Alpha's half; twins mirrored) | length | ride | what it does |
|---|---|---|---|---|---|
| **Gulper Run** (single, through mid) | **two-way** | the east gulper's jaws (12.7, 0.3, 0) ↔ the west gulper's jaws (−12.7, 0.3, 0) | 26 m | 1.45 s (≈ 2.2 s mouth to landing) | straight through the Great Tank at y 1.0, under the Feeding Deck, among the sharks. It switches between the court's east and west sides under mid, untouchable. |
| **Kelp Line E** (W is its twin) | **one-way, flips** (§3.4) | *low mouth* in Alpha's SE Reef Hall (27.5, 0.3, −6.0), facing south · a 1.5-turn spiral (radius 3) up inside the kelp drum to a **junction** at the drum's top (25.5, 9.4, 3.0) · *branch A* down to the **Kelp Balcony** mouth (29.2, 4.1, 4.2) · *branch B* along the outside of Bravo's NE promenade at 6–9 m, then down to the **far mouth** on that promenade (19.0, 2.7, 19.0), facing the court | A: 41 m · B: 58 m | A 2.3 s · B 3.2 s (+ 0.7 s in and out) | joins one team's low flank to the other team's high flank, through the kelp, either up or down depending on the phase |
| **Penguin Express** (Bravo's is its twin) | **two-way** | Penguin Point (−9.0, 0.3, −47.5), facing north ↔ the Pump Hall (12.5, 0.3, −41.0), facing west; runs overhead at 7.6 (underside 6.75) along z −47.5, then north to z −41 | 41 m | 2.3 s | crosses the wing between its two flanks behind the Ticket Hall; riders are seen against the sky over the forecourt |

How a pipe compares with walking or swimming the same trip:
- **Gulper Run:** walking round the deck is 31 m and 5.2 s; swimming in your own ink 2.6 s.
- **Kelp Line A:** walking is 26 m plus a hop, 4.3 s; swimming 2.2 s.
- **Kelp Line B:** walking 33 m, 5.5 s; swimming 2.8 s.
- **Penguin Express:** walking 25 m, 4.2 s; swimming 2.1 s.

So a pipe is about as fast as swimming in your own ink, and slower than swimming over a cleared route. **Its value
is not speed.** You are untouchable inside. It goes where feet can't: through a tank, up a 9 m kelp drum, over the
forecourt's fight. And it can surprise the other team. That keeps the walking routes the main routes.

### 3.2 Riding rules
- **Who can enter.** Any player in **squid form** who swims into a mouth's intake: a 1.2 m disc at the mouth, at floor
  level. You do not have to be in your own ink: the mouths have a dry brass lip, so squid-on-dry is fine. Kid form
  bumps the mouth's grille, which counts as `rail`, so nobody falls in by strafing past during a fight. A squid
  squeezing into a tube is also the creature fantasy.
- **Who cannot enter:**
  - **The Bazookarp carrier.** A heavy clunk, the intake ring flashes, and the HUD says "TOO BIG FOR THE TUBEWAY".
  - A player in a special that owns the body (Zipline, Ink Jet, Crab and the like).
  - A super-jumping player.
  - The tower, the boss, placed devices.
- **The intake.** 0.25 s: the squid is pulled in with a slurp and a puff of bubbles. Once started, it can't be
  cancelled.
- **The ride.** 18 m/s along the tube's centre line. The rider is drawn inside the glass as their own squid at full
  size, in team colour, trailing bubbles. Everyone sees them all the way, as in 3D World. Teammates also see the
  rider's name tag.
  - The rider's camera rises to a smoothed chase view: 3 m behind and 2 m above along the tube, the tube drawn faintly.
    It frames the exit about 0.6 s before arriving, so the rider sees what waits there.
  - The HUD shows "TUBEWAY → <destination>" with a progress bar.
- **Riders can't be hurt.** Shots and blasts splash on the glass. A rider can't shoot, throw or use a special.
- **Junction (Kelp Lines).** In the RISING phase, branch A goes to the balcony and branch B to the promenade. A prompt
  "◀ BALCONY · PROMENADE ▶" appears 1 s before the junction. The rider steers with the movement keys; the default
  is B. In the FALLING phase the two branches merge, so there is no choice.
- **Turning back (two-way pipes only).** Hold back for 0.3 s to reverse, once per ride. It costs the 0.3 s. One-way
  pipes can't be reversed.
- **The exit pop.** The rider is popped out of the mouth on a short arc: 3.0 m out and 1.2 m up, over 0.45 s. They
  land in kid form, facing out of the mouth.
  - **Pop shield:** for those 0.45 s the rider takes no damage and can't fire. Both apply only while airborne.
  - On landing the rider paints a 1.2 m splat of their ink (a super-jump landing is 1.4 m).
  - The landing circle, r 1.6, is inlaid in the floor as a brass ring marked "KEEP CLEAR". Nothing can be placed in
    it. A player standing in it is nudged aside, with no damage (`stageKit.shoveActor`), and the rider lands beside
    them.
- **Spacing and cooldown.**
  - A mouth takes one rider per 0.7 s. Its ring light dims while busy, and a second squid waits at the lip.
  - After leaving a tube, a player can't enter any tube for **3 s**. A small swirl shows on their ink tank.
- **Riders meeting in a two-way pipe.** Opposite riders pass each other with a bonk sound. Nobody is stopped.
- **Thrown bombs ride too ("bomb mail").** A thrown sub whose flight or slide enters an open intake is drawn in. It
  rides at pipe speed with its fuse paused and is popped out of the exit on the same arc. Its fuse restarts when it
  lands. This covers Splat, Suction, Curling, Autobomb, Fizzy, Waddle and the new bombs. It is visible all the way, a
  glowing bomb in team colour, and it makes a distinct "thunk-whoosh".
  - Contact-burst subs (Burst Bomb, Torpedo, the new dash bomb) burst on the intake's grille instead.
  - The Bazookarp's own shots burst on the grille. No artillery through tubes.
  - Shots, sprays and special projectiles never enter.
- **Placed devices** can't be placed within 1.6 m of a mouth or inside a landing circle. Sprinklers, beacons, mines,
  the new turret, Surf N' Turf and the Drip Curtain all get the usual "Can't place here".

### 3.3 Reading one-way against two-way at a glance
| | one-way (Kelp Lines) | two-way (Gulper Run, Penguin Express) |
|---|---|---|
| mouths | **entry** = a flared brass bell with an intake fan turning behind its grille, a white ring light and a split-flap sign "IN ▶"; **exit** = a narrow nozzle with a rubber flap that only swings outward and a roundel "EXIT ONLY ⛔" | both ends are identical flared bells with a "⇄" roundel; no fan, no flap |
| glass | frosted chevrons etched every 2 m, lit white in a running sequence in the direction of flow ("airport approach lights"); bubbles stream with the flow | plain glass with brass bands; bubbles drift lazily both ways |
| sound | a rising suction hum at the entry; a cork-pop at the exit | the same soft whoosh at both ends |
| maps | the minimap and TAB map draw pipes as pale lines; one-way ones with moving arrowheads; riders as dots on the line | double-ended lines |

Meaning is carried by shapes and motion, not colour. The ring lights are white, the warnings are a white strobe, and
nothing on a pipe is tinted in a hue that could read as a team's ink.

### 3.4 The timeline: the Kelp Lines RISING, then FALLING
The two Kelp Lines are one-way. On the stage clock they **flip direction every 90 s of play**. In-world, the Tubeway's
pumps run a "blow-back" cycle to keep the lines clear.

- **RISING** (from 0 s, then 180 s): each Kelp Line carries riders **up**, from a team's own low arcade up through the
  kelp to the enemy's high side:
  - branch A to the Kelp Balcony (3.8);
  - branch B to the far mouth on the enemy's promenade.

  Alpha's RISING line is the E drum, on its **left**. Bravo's is the W drum, also on its left.
- **FALLING** (from 90 s, then 270 s): each Kelp Line carries riders **down**, from a team's own high promenade (the
  far mouth or the balcony, now both entries) down through the kelp, popping out of the low mouth in the enemy's
  arcade. Alpha's FALLING line is the W drum, on its **right**; Bravo's is the E drum, also on its right.

So the call for both teams is the same: **"RISING: attack up your left. FALLING: dive down your right."**

| mode (length) | flips at (s of play) | the Kelp Lines run |
|---|---|---|
| Turf War (180 s) | 90 | RISING 0–90 · FALLING 90–180 |
| Zone Control, Tower Command, Bazookarp (300 s + overtime) | 90, 180, 270 | RISING · FALLING · RISING · FALLING |
| Boss Battle | every 90 s | as above |
| practice / online Practice | every 90 s on the stage clock | as above |

- No flip **starts** in the last 15 s of regulation or in overtime. The line keeps the direction it has.
- The two two-way pipes never change.

### 3.5 The flip, as a set piece (every 90 s)
- **T − 10 s:** the PA chime: three soft notes, synthesized.
  - The HUD banner reads "TUBEWAY: KELP LINES FALLING IN 10", with a countdown. It shows to everyone, in the
    bottom-middle line the stage HUD already uses.
  - The chevrons on both Kelp Lines strobe white and their running sequence slows.
  - The split-flap signs at all six Kelp Line mouths start to riffle.
- **T − 3 s:** the Kelp Line entries close. The fans spin down, the ring lights go dark and the flaps clunk shut.
  Nobody new gets in, and anyone inside finishes their ride the old way. The lines are empty at T.
- **T 0:** a deep pneumatic **WHUMP**. A curtain of bubbles roars up both kelp drums and the kelp swings round.
  - The split-flap signs clatter to their new words: IN ↔ EXIT, RISING ↔ FALLING.
  - The chevrons run the other way, and the exit flaps and intake fans swap ends.
- **T + 1 s:** the new entries open, with ring lights on and fans turning. The HUD says "KELP LINES NOW FALLING —
  dive down your right" (or "RISING — up your left").

At the start of a match the intro shows a brass maintenance pod riding the RISING E line, for looks only. The first
HUD line of the match reads "TUBEWAY: Kelp Lines RISING — up your left".

### 3.6 What both teams can do with it
- **RISING**
  - **Attack up your left.** Ride from your arcade into the enemy's high ground. Take their Kelp Balcony (3.8) over
    their promenade, or pop out mid-promenade behind their balustrade.
  - **Defend your right.** Watch your balcony and your promenade's far mouth. The enemy rider is visible for 2–3 s
    inside the glass, and the exits are known.
  - **Bomb mail.** Throw a Splat Bomb into your left low mouth to clear the enemy's balcony before you ride.
- **FALLING**
  - **Dive down your right.** From your promenade or balcony, drop into the enemy's low arcade on their left. It is a
    3 s untouchable insertion behind their colonnade.
  - **Defend your left.** Watch the low mouth in your arcade: the brass "Tubeway stop" by the drum.
- **Always**
  - **The Gulper Run:** switch sides of the court under mid in about 2 s, escape a lost fight on the deck's flank, or
    post a bomb to the other gulper.
  - **The Penguin Express:** rotate your defence between the Pump Hall and Penguin Point behind the Ticket Hall. An
    attacker who reached one side of your wing can jump to the other.

### 3.7 How it stays fair
- **Symmetry at every moment.** The flip changes both Kelp Lines together. Seen from above, a line flowing north up
  the east side and south down the west side is turned into itself by the stage's 180° symmetry. So at every instant
  each team has exactly one Kelp Line into the enemy half, and its exits sit at the same distances and heights.
- **Nothing hurts, nothing traps.**
  - No geometry appears or moves. The flaps and fans are cosmetic.
  - Nobody is splatted, carried off the stage or locked in.
  - Riders inside at a flip finish their trip.
  - A landing circle nudges players aside instead of landing on them.
- **Against exit camping:**
  - the rider sees the exit coming;
  - two-way riders can turn back;
  - the Kelp Lines have two exits in RISING;
  - the 0.45 s pop shield;
  - the exit splat;
  - bomb mail to clear the exit ahead of you;
  - **every exit faces into hard cover 2–3 m to one side.** The far promenade mouth has a kiosk, the balcony has the
    drum, the low mouth has the Tubeway-stop housing, the gulper mouths have the jelly column and the diving helmet,
    and the Penguin Express mouths have the pumps and the upper rock.
  - Every exit is overlooked from somewhere, so a camper is exposed too.
- **Against pipe spam:** one rider per mouth per 0.7 s; a 3 s personal cooldown after any ride; no carrier; the flip
  blackout; and no pipe in or toward a spawn.
- **No shortcut into a base.** The deepest any pipe reaches is:
  - the far promenade mouth, 27 m from mid;
  - the Penguin Express, inside a team's own wing, between its two flanks, behind the strategic point.

  No pipe skips the slice (the Long Stages rule).

### 3.8 Ink and turf
- **Pipes and glass are never inked.** Ink beads and runs off in 1.5 s; this is cosmetic, and they count nothing for
  turf.
- **The floor round a mouth is ordinary inkable floor.** Inking the enemy's mouth apron makes their entry slower,
  because squids swim slowly in enemy ink. That is honest counterplay.
- **The exit splat is real ink** and counts as the rider's turf.
- **The flip changes no ink.**

### 3.9 Bots
- **Nav.** Each pipe is a one-way nav edge of type `tube`, from the mouth's approach node to each exit's landing node
  (`nav.js` already has typed edges: walk, jump, drop). Its cost is the ride time + 0.6 s. A two-way pipe has an
  edge each way.
  - At T − 3 s the Kelp Line edges close. At T + 1 s they reopen the other way round, and every bot whose route used
    one replans (as with movers: `stageKit.navCommit`).
- **Using pipes.** A bot takes a pipe when the edge is on its cheapest route to its goal and it is off cooldown. It
  turns squid at the approach node and swims in. Under fire, a nearby mouth gets a 1.5 s cost bonus (an escape).
- **Caution.** Before entering, a bot looks at the exit area with its own perception (`botSight`; glass passes
  sight). If it sees two or more enemies within 8 m of the exit, it walks instead. No wall-hacks: if a wall hides the
  exit, the bot doesn't know.
- **Defending.** A rider is a visible actor. A bot that sees an enemy rider in a pipe gets an aim point at the
  rider's landing circle and the arrival time, the way it treats a super-jump marker.
- **Bomb mail.** A bot that sees an enemy standing at a pipe's exit may throw its bomb into the near mouth, once per
  life. This is optional and nice-to-have.
- **The Bazookarp carrier bot** never plans through a `tube` edge.

### 3.10 Online
- **The flip** is a pure function of the stage clock (`stageKit.StageClock`: the host's match clock, carried through
  overtime). It needs no records, a late joiner sees the right direction, and a host change keeps it.
- **A ride is the rider's owner's state**, like a super jump. It is recorded as `['tube', pipe, from-end, branch, t]`
  at entry, plus `['tube-turn', t]` for a reversal. Every client replays the same path at the same speed, and a late
  joiner places riders already in flight from the entry time. The pop shield is judged where the victim is
  authoritative, as usual.
- **A bombed pipe** is recorded by the thrower's client (the bomb's id, the pipe, t). The others replay it.

### 3.11 Engine shape (for the builder)
- **One new module**, `src/game/tubeway.js`. It owns:
  - rides, mouths, junctions and the flip schedule;
  - the bombs in tubes and the landing circles;
  - the nav edges, the bot hooks and the records;
  - the HUD lines and the sounds.
- **It reuses** `stageKit.js` (the clock, nav layers, `shoveActor`, `buildLook`) and the super-jump flow in
  `actor.js`.
- **Small tagged hook-ins (`[b5-aquarium]`):**
  - `actor.js`: a `tubeState` beside `superJumpState`: no physics while riding, invulnerable, drawn on the path.
  - `subs.js`: a bomb entering an intake.
  - `bots.js`, `nav.js`: `tube` edges.
  - `minimap.js`: pipe lines and arrows.
  - `hud.js`: the flip banner and the ride bar.
  - `netmatch.js`: the records.
  - `level.js`, `botSight.js`: the `glass` flag (§2.8).

The layout's data (a sketch):
```js
LAYOUT.tubes = {
  mirror: true,                                   // each listed tube gets its 180° twin; `single: true` = its own twin
  speed: 18, bore: 1.7, intake: 0.25, pop: { out: 3.0, up: 1.2, t: 0.45, shield: true }, cooldown: 3, spacing: 0.7,
  schedule: { flipEvery: 90, warn: 10, close: 3, reopen: 1, quietEnd: 15, overtime: 'hold', start: 'rise' },
  modes: { boss: 'run' },                         // 'run' (default) | 'off'
  list: [
    { id: 'gulper', single: true, kind: 'two-way', look: 'aquarium_gulper',
      ends: [{ at: [12.7, 0.3, 0], face: [1, 0, 0], name: 'East Gulper' }, { at: [-12.7, 0.3, 0], face: [-1, 0, 0], name: 'West Gulper' }],
      path: [[12.7, 0.6, 0], [9.5, 1.0, 0], [-9.5, 1.0, 0], [-12.7, 0.6, 0]] },
    { id: 'kelpE', kind: 'flip', look: 'aquarium_kelpline',          // RISING = low → junction → a/b
      low: { at: [27.5, 0.3, -6.0], face: [0, 0, -1], name: 'Reef Hall' },
      trunk: { spiral: { c: [25, 0], r: 3.0, turns: 1.5, y0: 1.0, y1: 8.6 }, junction: [25.5, 9.4, 3.0] },
      branches: { a: { to: { at: [29.2, 4.1, 4.2], face: [-0.7, 0, 0.7], name: 'Kelp Balcony' }, path: [/* … */] },
                  b: { to: { at: [19.0, 2.7, 19.0], face: [-0.7, 0, -0.7], name: 'Sea Promenade' }, path: [/* r 29.5 arc, then down */] } },
      defaultBranch: 'b' },
    { id: 'penguin', kind: 'two-way', look: 'aquarium_penguin',
      ends: [{ at: [-9.0, 0.3, -47.5], face: [0, 0, 1], name: 'Penguin Point' }, { at: [12.5, 0.3, -41.0], face: [-1, 0, 0], name: 'Pump Hall' }],
      path: [[-9, 0.6, -47.5], [-9, 7.6, -47.5], [12.5, 7.6, -47.5], [12.5, 7.6, -41], [12.5, 0.6, -41]] },
  ],
};
```
The tubes' glass is solid (`glass: true` colliders along each run). The overhead runs are at 6–9 m, far out of reach.
The mouths' housings are `roof`.

### 3.12 Ambient life (looks only, no rules)
- **Fish scatter** from the glass where ink or shots hit it. Sharks circle under the deck, rays glide over the Shark
  Arch, and the kelp sways in the drums' bubble curtains.
- **Feeding time.** At 1:00 left, the keeper's winch on the gantry gives the bathysphere a half-metre bob and rings
  its bell, and the sharks rush the lens. It is a pure nod to the place and changes nothing in play.
- **The penguins** waddle and dive behind their glass, and turn to watch whoever fights nearest.

---

## 4. Every mode on this layout

The modes overlay below covers the whole stage, with the same scale and rows as §2.2:

```
 legend  t tower track (centre line)   C tower checkpoint   G tower goal   Z zone   R Bazookarp start (the deck centre)
         Q Bazookarp checkpoint   * Bazookarp goal   o pipe (plan)   k Kelp Line mouth   e Penguin Express mouth
         (the Gulper Run runs along z 0 under the deck between the gulper heads; the drawn rows skip z 0)
 z +55   ~~~~~~~~~........................*..G..................~~~~~~~~~~~~
 z +53   ~~~~~~~~~...........................t..................~~~~~~~~~~~~
 z +51   ~~~~~~~~~#.....................................t..#PPPPPPPP~~~~~~~~
 z +49   ~~~~~~~~~#.......ttttttttttttt.................t..#PPPPPPPP~~~~~~~~
 z +47   ~~~~~~~~~#.......t..oooooooootooooooooooooe....t..#PPPPPPPP~~~~~~~~
 z +45   ~~~~~~~~~#.......t..oo.......t.................t..#PPPPPPPP~~~~~~~~
 z +43   ~~~~~~~~~#.......t..oo.......t.................t..#PPPPPPPP~~~~~~~~
 z +41   ~~~~~~~~~#.......t..ee.....ZZtZZZZZZZZZZ.......t..#PPPPPPPP~~~~~~~~
 z +39   ~~~~~~~~~#.......t.........ZZtZZZZQZZZZZ.......t..#PPPPPPPP~~~~~~~~
 z +37   ~~~~~~~~~#.......t.........ZZttttCttttttttt....t..#PPPPPPPP~~~~~~~~
 z +35   ~~~~~~~~~#.......t.......................tt....t..#PPPPPPPP~~~~~~~~
 z +33   ~~~~~~~~~#.......t.......................ttttttt..#PPPPPPPP~~~~~~~~
 z +31   ~~~~~~~~~#.......t................................#PPPPPPPP~~~~~~~~
 z +29   ~~~~~~~~~######..t..####.####.........####.......~~~~~~~~~~~~~~~~~~
 z +27   ~~~~~~~~~######..C.......####.........####.......~~~~~~~~~~~~~~~~~~
 z +25   ~~~~~~~~~######..t........###.........###..........~~~~~~~~~~~~~~~~
 z +23   ~~~~~~~~~####....t........###.........###.............~~~~~~~~~~~~~
 z +21   ~~~~~~~~~~#......t.........##.........##................~~~~~~~~~~~
 z +19   ~~~~~~~~~#.......t..................................k..oo~~~~~~~~~~
 z +17   ~~~~~~~#.........t.......................................o.~~~~~~~~
 z +15   ~~~~~~#..........t........................................o.~~~~~~~
 z +13   ~~~~~#...........ttttttttttttttttt.........................oo~~~~~~
 z +11   ~~~~#............................t..........................o.~~~~~
  z +9   ~~~~.............................t...........................o.~~~~
  z +7   ~~~#.............................t...........................oo~~~~
  z +5   ~~~...o.......................ZZZtZZZ........................kk.~~~
  z +3   ~~###KKoKKKK................ZZZZZtZZZZZ................KKKKKoo###~~
  z +1   ~~##KKKooKKKK..............ZZZZZZRZZZZZZ..............KKKKKoKKK##~~
  z -1   ~~##KKKoKKKKK..............ZZZZZZRZZZZZZ..............KKKKooKKK##~~
  z -3   ~~###ooKKKKK................ZZZZZtZZZZZ................KKKKoKK###~~
  z -5   ~~~.kk........................ZZZtZZZ.......................o...~~~
  z -7   ~~~~oo...........................t.............................#~~~
  z -9   ~~~~.o...........................t.............................~~~~
 z -11   ~~~~~.o..........................t............................#~~~~
 z -13   ~~~~~~oo.........................ttttttttttttttttt...........#~~~~~
 z -15   ~~~~~~~.o........................................t..........#~~~~~~
 z -17   ~~~~~~~~.o.......................................t.........#~~~~~~~
 z -19   ~~~~~~~~~~oo..k..................................t.......#~~~~~~~~~
 z -21   ~~~~~~~~~~~................##.........##.........t......#~~~~~~~~~~
 z -23   ~~~~~~~~~~~~~.............###.........###........t....####~~~~~~~~~
 z -25   ~~~~~~~~~~~~~~~~..........###.........###........t..######~~~~~~~~~
 z -27   ~~~~~~~~~~~~~~~~~~.......####.........####.......C..######~~~~~~~~~
 z -29   ~~~~~~~~~~~~~~~~~~.......####.........####.####..t..######~~~~~~~~~
 z -31   ~~~~~~~~PPPPPPPP#................................t.......#~~~~~~~~~
 z -33   ~~~~~~~~PPPPPPPP#..ttttttt.......................t.......#~~~~~~~~~
 z -35   ~~~~~~~~PPPPPPPP#..t....tt.......................t.......#~~~~~~~~~
 z -37   ~~~~~~~~PPPPPPPP#..t....tttttttttCttttZZ.........t.......#~~~~~~~~~
 z -39   ~~~~~~~~PPPPPPPP#..t.......ZZZZZQZZZZtZZ.........t.......#~~~~~~~~~
 z -41   ~~~~~~~~PPPPPPPP#..t.......ZZZZZZZZZZtZZ.....ee..t.......#~~~~~~~~~
 z -43   ~~~~~~~~PPPPPPPP#..t.................t.......oo..t.......#~~~~~~~~~
 z -45   ~~~~~~~~PPPPPPPP#..t.................t.......oo..t.......#~~~~~~~~~
 z -47   ~~~~~~~~PPPPPPPP#..t....eooooooooooootooooooooo..t.......#~~~~~~~~~
 z -49   ~~~~~~~~PPPPPPPP#..t.................ttttttttttttt.......#~~~~~~~~~
 z -51   ~~~~~~~~PPPPPPPP#..t.....................................#~~~~~~~~~
 z -53   ~~~~~~~~~~~~..................t...........................~~~~~~~~~
 z -55   ~~~~~~~~~~~~..................G..*........................~~~~~~~~~
            3         2         1         0         1         2         3
```

### 4.1 Turf War
- **The layout:** the whole thing, with the Tubeway on and one flip at 90 s (RISING, then FALLING).
- **What there is to ink:**
  - the court, arcades, promenades, deck, the hall, the rocks, the bund, the forecourt;
  - the inkable faces: the promenade's inner face, the Kelp Ramp's flank, the hall's and rocks' faces, the bund's
    face.
- **What is never turf:** glass, tubes, roofs.
- **The flip as a comeback hinge.** A team that won the first 90 s by holding its RISING left (the enemy's
  promenade) has to turn round at the flip and defend its own left arcade against divers. It gives Turf War a second
  half with a different shape.

### 4.2 Zone Control
- **Centre zone: the Feeding Deck.**
  - The zone is a 12-gon of radius 6.2 centred on (0, 0), y0 2.2 / y1 2.8: **≈ 115 m²**.
  - Cover on it: the keepers' rim gear stands outside the zone ring (r 6.2–7.5). Two fish-food hoppers (1.0 × 1.0 ×
    1.2) at bearings 0° and 180°, two feeding-pole racks (2.0 × 0.4 × 1.0) at −20° and 160°, and bucket stacks
    (0.8).
  - **Ways in: six.** The two ramps, the two stairs and the two Feeding Steps.
  - **Attacked from above** by the Kelp Balconies (3.8, 18 m off), and level from the promenades (2.4, 14 m).
  - Nothing sits overhead but the bathysphere, 5.9 m up.
- **Side zone (Alpha's; Bravo's is the twin): the Ticket Hall top.**
  - The zone is the rect x −6.5 … 6.5, z −42.5 … −35.5, y0 1.1 / y1 1.7: 91 m², about 84 m² inkable after the booth
    and the turnstiles.
  - Its centre is 39 m from mid and 26.5 m from Alpha's pad, so it is closer to its spawn (the brief's rule).
  - **Ways in:**
    - three stairs;
    - a hop-up anywhere on its 1.3 rim;
    - from the Gate Terrace;
    - from both lanes.
  - **High ground on it:** Penguin Point's upper rock (2.4) and the filter bund (1.3) with the filters as cover.
  - **The zone sits under the glass canopy.** Sight and ink marks are visible from above, and the canopy is 5.3 m
    over the zone floor.
  - **If the lead prefers the user's "side zones close to mid":** the alternative side zone is the court's south
    band, x −7 … 7, z −13 … −20 (98 m²): 16 m from mid, at the Shark Arch's mouth. It is flat, with three ways in
    and the promenade above. It breaks the brief's "closer to its spawn" rule, as the stretched stages' side zones
    already do.
- **The Tubeway in Zone Control:**
  - No mouth or landing circle is inside a zone. The gulper landings are at r 15.2, 9 m outside the centre zone.
  - The flips continue, and the last-30-s centre lock is unaffected.
  - The FALLING phase's dives land in the arcades, not the zones. The Penguin Express lands 2 m off the side zone's
    lanes.

### 4.3 Tower Command
Two checkpoints (the two-checkpoint rule: 10 s each, the track worth 80 points). The tower's speed is length ÷ 80 s.

**The track, drawn on Bravo's half (Alpha pushes north):** "The Feeding Round".
1. **(0, 2.4, 0) → (0, 13.5), 13.5 m.** North off the Feeding Deck: drop 2.4 → 1.3 onto the Feeding Step (z ≈ 7.4),
   drop 1.3 → 0 (z 9.5). Then between the gantry legs: inner faces at x ±3.0, 1.75 m clear each side.
2. **→ (−16, 13.5), 16 m.** West across the court's NW quadrant. The lane z 12.25 … 14.75 is kept clear: the NW
   deck ramp's foot reaches z 11.0, and the legs z 11.6.
3. **→ (−16, 49), 35.5 m.** North through a colonnade gap (α 120°–153°) into Bravo's **NW Reef Hall**, under its
   canopy, then through **the Service Gate** (CP1) and up the Pump Hall's main aisle (x −17.25 … −14.75). The aisle
   runs between the filter bund (x ≤ −18.5) and the pump sets (x ≥ −13).
4. **→ (−4, 49), 12 m.** East out of the Pump Hall's open side, behind the Ticket Hall.
5. **→ (−4, 37), 12 m.** South, back toward mid: climb 0 → 1.3 up the Ticket Hall's back edge (z 43) and ride onto
   the hall.
6. **→ (8.5, 37), 12.5 m.** East across the hall, past **CP2** at (0, 37), and drop 1.3 → 0 off its east edge into
   the lane.
7. **→ (8.5, 33), 4 m.** South in the lane, to the Gate Terrace's east end.
8. **→ (14, 33), 5.5 m.** East: climb 0 → 1.3 onto Penguin Point's rock terrace.
9. **→ (14, 52), 19 m.** North along the rock terrace, climb 1.3 → 2.4 onto the upper rock (z 42), and drop
   2.4 → 0 off its end (z 48) into the forecourt. The penguins are watching through their glass, 2 m away.
10. **→ (3, 52), 11 m.** West across the forecourt.
11. **→ (3, 55), 3 m.** North to **the goal at (3, 0, 55)**: 10.5 m short of Bravo's pad, outside its barrier, below
    the Fin Terrace's front edge, in full view of the deck.

**The numbers:**
- **Length:** 144.0 m in plan. With the climbs and drops (+9.8 m) it is ≈ 154 m if tower.js counts them, which is in
  the 138–171 m range of the other two-checkpoint stages. That gives a speed of 1.8–1.9 m/s and 100 s from the centre
  to the goal.
- **Checkpoints:** CP1 (−16, 27), in the Service Gate's opening, at 43 m (30 %). CP2 (0, 37), on the Ticket Hall, at
  93 m (65 %).
- **For tower-data.js:**
  ```js
  aquarium: {
    path: [[0, 2.4, 0], [0, 13.5], [-16, 13.5], [-16, 49], [-4, 49], [-4, 37], [8.5, 37], [8.5, 33], [14, 33], [14, 52], [3, 52], [3, 55]],
    checkpoints: [[-16, 27], [0, 37]],
  }
  ```

**The story.** The tower rides the keepers' feeding round, off the shark deck, through the reef hall, out of the
service door, through the pump hall, over the ticket hall and past the penguins. One checkpoint is in a doorway (a
tower stuck in the loading door, fought over from the arcade and the hall). The other is on the strategic point.

**Headroom:** TOWER_HEAD 3.72 m above the track floor everywhere.

| where | clearance |
|---|---|
| the bathysphere over the start | 5.9 |
| the gantry beams | 8.6, and not over the track |
| **the NW Reef Hall canopy** | **4.6, the lowest point.** Clears the rule; check the rider camera there. If it clips, raise the canopy to 5.4 in Tower mode only (`onlyIn: 'tower'`). |
| the Service Gate lintel | 5.5 |
| the Pump Hall roof | 7.0 |
| the Ticket Hall canopy | 5.3 over the hall floor |
| the Penguin Express | 4.35 over the upper rock (its underside at 6.75), 6.75 elsewhere |

**Kept off the lanes (no stutter):**
- the colonnade columns (none at α 120°–153°);
- the Reef Window viewing step (none at the Service Gate);
- the hall's booth, turnstiles and corner columns (lanes x −5.25 … −2.75 and z 35.75 … 38.25 on Bravo's hall);
- planters, benches, pipe mouths and landing circles: each at least 1.5 m from the 2.5 m sweep.

All of that is checked on Alpha's mirror too.

**No variants needed.** Every climb and drop is an existing edge, and the canopy raise above is the only possible
`onlyIn: 'tower'` piece. The pipes run in Tower Command (§4.6). Check with `tools/botlab/tower-check.cjs` and
`tests/tower-len.js` until there are 0 holes, both rides knock out, and the time reads 100 s.

### 4.4 Bazookarp (the user's Rainmaker; written for Alpha's half, Bravo's is the twin)
- **Start:** the Bazookarp in its shield on a pedestal at the deck's centre, (0, 2.4, 0), on the viewing lens. A
  shield burst splats enemies on the deck. The carrier leaves by the ramps, the stairs, the Feeding Steps, or a 2.4 m
  drop off the edge.
- **Checkpoint: one, on the strategic point, the Ticket Hall at (−1, 1.3, −39.5).** It is 39.5 m from mid, and the
  rock terrace and the filter bund (both 1.3) overlook it from either side. Planting lowers it and raises the goal.
- **Goal pedestal:** **(0, 0, −55.5)** on the forecourt, a level below the spawn (3.8), 5 m in front of the Fin
  Pavilion's wall. It is seen from the whole deck edge and both stairs. The forecourt's middle (r 3) is kept clear.
- **Routes, mid → checkpoint** (all walkable by a slow carrier: ramps, stairs and hops of 1.3 or less):
  1. **centre**: the deck's south side → the court's south band → **the Shark Arch** → the Gate Terrace → the NW
     stair. **≈ 40 m.**
  2. **east (low)**: the SE deck ramp → the SE Reef Hall → **the Service Gate** → the Pump Hall → the east lane → the
     hall's E stair. **≈ 62 m.**
  3. **west (high)**: the SW deck stair → the promenade's grand stair → **the SW Sea Promenade** → **the Penguin
     Steps** → the rock terrace (1.3) → down into the west lane → the hall's W stair. **≈ 60 m.**
- **Routes, checkpoint → goal:**
  1. **centre**: drop 1.3 off the hall's back edge, 16 m across the forecourt.
  2. **east**: the E stair → the east lane → past the Pump Hall's south end, ≈ 24 m.
  3. **west**: the W stair → Penguin lane → round the upper rock, ≈ 22 m.
- **Hiding:**
  - No carrier can hide up high. Every top is either reachable and in view (the Kelp Balconies 3.8, the promenades
    2.4, the upper rock 2.4, the bund 1.3), or `roof` (slides off): the gatehouses, gulper heads, kiosks, filters, the
    hall's canopy, the gantry.
  - The tubes refuse the carrier, and the Bazookarp's own shots burst on the intakes.
- **Free zones (Rainmaker-free, on Alpha's own side):** carried there by Alpha's own carrier, the timer ticks 3× with
  "Bazookarp-free zone!". All three have signposts at their entrances.
  - the W Kelp Balcony (3.8, over Alpha's promenade);
  - the filter bund in Alpha's Pump Hall (behind the filters);
  - the Fin Terrace's flanks outside the spawn barrier (x ±9 … 13 at 3.8).
- **The "Don't retreat!" line** follows the carrier's best progress. A carrier that splats itself into the sea off
  its own promenade resets the Bazookarp to the centre.
- **The carry time to expect:**
  - Unopposed, a carrier walks at 4.8 m/s and swims at 9.4 m/s. Mid → checkpoint is 40–62 m: **5–13 s**.
    Checkpoint → goal is 16–24 m: **2–5 s**.
  - Contested, expect **20–35 s to the checkpoint and 10–20 s to the goal**. A knockout inside one 60 s carry needs a
    dominant team, which is what the research says to aim for.
- **The gimmick in Bazookarp.** The escorts use the Kelp Lines:
  - RISING lifts them onto the enemy's balcony and promenade over the west route;
  - FALLING drops them into the enemy arcade on the east route;
  - the Penguin Express lets defenders swap between the two final routes behind the checkpoint.

  The carrier walks.
- **No Bazookarp-only geometry needed.** If testing shows the centre route too strong, the fix is a Bazookarp-only
  planter pair narrowing the Gate Terrace. Do not wall off the Shark Arch.

### 4.5 Boss Battle (HULLBREAKER, ≈ 9 m): yes, expected to work; prove it with the boss check
- **Home ground:** the court annulus round the Great Tank, ≈ 830 m² of open floor (the check wants ≥ 150 m²).
- **How the boss moves.** The glass tank is a wall to it. It charges along chords of the ring, for example from the
  SE ramp's foot across to the NW arcade mouth. The court's cover is spaced 6–8 m, so it can thread it.
- **Where the kids go.** The arcades (under the canopy), the promenades (2.4) and the deck are the kids' refuges and
  firing positions.
- **The Tubeway runs.** Kids escape through the Gulper Run under the boss's feet, and the boss can't enter.
- **Risks:** nav round the curved Kelp Ramps' feet, and the jelly columns pinching a charge lane. If the check shows
  long stalls, move J1/J2 out for Boss only (`notIn: 'boss'`). If it still fails, `noBoss: true`. Check with a copy
  of `tools/botlab/jobs/new-stages/out/craters/boss-check.js`.

### 4.6 The gimmick per mode
| mode | Gulper Run | Kelp Lines | Penguin Express | notes |
|---|---|---|---|---|
| Turf War | on | flip at 90 s | on | the flip is the half-time swing |
| Zone Control | on | flip at 90 / 180 / 270 s | on | no mouth in a zone; the final-30-s centre lock unaffected |
| Tower Command | on | flips | on | nothing over or on the track lower than 6.75; riders on the tower can't enter pipes (the mouths are far from the track) |
| Bazookarp | on | flips | on | the carrier and its shots are refused at every mouth |
| Boss Battle | on | flips | on | the boss can't enter; pipes are the kids' escape |

---

## 5. The look

### 5.1 Architecture and its story
- **The style.** It is all **1936 Streamline Moderne**. Curved white render walls carry three horizontal "speed
  lines" in pale sea-green. There are porthole windows, glass-block panels, ribbon windows, polished brass handrails,
  black-granite plinths and terrazzo floors with brass inlay (wave borders, fish, a compass rose).
- **The Tubeway** is the new layer, last year's renovation: clear acrylic with brass collars and Deco roundels. It
  is modern, but it matches the brass.
- **The South and North Gates** are curved gatehouses 7 m tall. Each carries the parapet letters **GULPER
  AQUARIUM · EST. 1936** and a two-faced clock: one face to the court, one to the wing. Under each, **the Shark Arch**
  is a glass vault through the Arch Tank, with blacktip sharks and a slow eagle ray overhead.
- **The Reef Halls** (the low arcades) have:
  - slim lamp columns with fluted brass capitals;
  - a cantilevered canopy;
  - along the outer wall, **the Reef Window**: a 40 m curved run of glass panes, lit from inside, with corals,
    clownfish, a moray in a pipe, and an octopus whose den is labelled "PLEASE DO NOT DISTURB — SHY".
- **The Sea Promenades** are terrazzo terraces. They have the wave-pattern balustrade, coin telescopes, an ice-cream
  kiosk and a souvenir kiosk, and the glass skylight domes over the **Jelly Gallery** below. That gallery is out of
  play, but you see it glowing through portholes in the promenade's inner face.
- **The Kelp Drums** are two 9 m glass cylinders with riveted brass crowns. Giant kelp sways inside in shafts of
  sun, and the Kelp Lines spiral up through them. Keepers' ladders lean on the brass crown rings.
- **The Great Tank** is a 15 m glass drum on a black-granite plinth: sharks, rays, a sea turtle. Its lid is the
  teak **Feeding Deck**, with the round acrylic **viewing lens** at the centre. Over it stands the riveted steel
  **Feeding Gantry** with its winch, and **Bathysphere No. 1** hangs from the winch. Its brass plaque reads "923 m ·
  1934".
- **The gulper heads.** Two bronze gulper-eel heads, jaws agape and needle-toothed, lie either side of the tank. Their
  glass bodies are the Gulper Run.
- **The wings:**
  - **The Ticket Hall:** a Deco pavilion with a glass canopy, a hanging station clock, a "TODAY'S FEEDINGS 11:00 ·
    15:00" board, ticket booths and turnstiles.
  - **The Pump Hall:** back of house. Sand filters, pumps and valve walls with red handwheels; a sawtooth glazed roof;
    a Deco ventilation stack 12 m tall with the "GA" monogram.
  - **Penguin Point:** a faux-Antarctic rockery with the penguin beach behind its glass.
  - **The Fin Pavilion:** the entrance, its roof terrace the spawn, and the **fin tower** with vertical neon
    "AQUARIUM".
  - **Behind each pavilion, the aquarium ferry is tied up:** a little white Deco steamer with a buff funnel.

### 5.2 Materials (3 stage surfaces) and palette (team ink stays the loudest colour)
- **Surface 1, terrazzo:** warm cream with grey and ochre chips and brass divider strips. It covers the court,
  arcades, promenades, gate terraces, lanes and forecourt.
- **Surface 2, teak decking:** the Feeding Deck, the Ticket Hall floor, the spawn deck.
- **Surface 3, white render with a sea-green faience band:** every inkable wall face.
- **Shared patterns:** the Pump Hall uses the shared `metalpanel` and `grate`, the rocks use a shared stone pattern,
  and glass and water are props.

| use | colour |
|---|---|
| render, white | `#ece6da` |
| terrazzo | `#d6cfc0` |
| teak | `#8a6b4e` |
| faience band (muted) | `#9bb3a8` |
| brass | `#a8895a` |
| black granite | `#33373b` |
| tank water | `#173a48` (deep, dark, low saturation) |
| glass edge tint | `#cfe3e6` at 15 % |
| penguin rock | `#8d8a84` |

Rules that keep ink loud:
- **Floors are warm neutrals.** Every team palette (Tangerine/Cobalt, Bubblegum/Mint, Lemon/Grape, Aqua/Cherry,
  Lime/Magenta) reads on cream terrazzo and teak.
- **No saturated aqua or blue anywhere a player inks.** The tank water is dark and desaturated, so Aqua and Cobalt
  ink never melt into it.
- **The caustic light is white, not blue.** It is an animated projected texture on the *lighting* only, ±10 %
  brightness, on floors within 6 m of a tank and under the Shark Arch. It never tints albedo or ink.
- **The fish are grey-silver and coral-muted.** The only saturated colour on a tank is a few small reef fish.

### 5.3 Signage and murals (stage murals 4–11)
- the GULPER AQUARIUM gate letters and clocks;
- "ALL WATER IS BEHIND GLASS — INKLINGS KEEP DRY";
- "TUBEWAY" roundels on every mouth, with names: "KELP LINE · REEF HALL", "KELP LINE · BALCONY", "KELP LINE · SEA
  PROMENADE", "GULPER RUN", "PENGUIN EXPRESS";
- the split-flap IN / EXIT and RISING / FALLING signs;
- a Tubeway line map on the lecterns;
- "PLEASE DO NOT TAP THE GLASS";
- "TOUCH POOL — PLEASE USE THE GLOVES";
- "FEEDING DECK — KEEPERS ONLY";
- "PUMP HALL — NO ADMITTANCE";
- "PENGUIN POINT";
- "BATHYSPHERE No. 1 · 923 m · 1934";
- terrazzo inlays: a compass rose in the court's south and north bands, wave borders round the deck, a fish trail
  leading to each Tubeway stop;
- the Bazookarp-free signposts (that mode only);
- "KEEP CLEAR" rings at every landing circle.

No real brand names anywhere.

### 5.4 Working-life clutter (each piece has a collider where it is cover)
- **The keepers:** feeding carts with fish buckets, a glass-cleaning robot parked against the Great Tank, hose reels,
  life-ring posts, "FLOOR DRY" A-boards (a joke: everything here is kept dry).
- **Pump Hall:** scuba cylinders in racks, sacks of "SEA SALT 25 kg" on a pallet, spare acrylic panels on an A-frame,
  a forklift with a fish-transport tank.
- **The visitors:** a parked stroller line by the ice-cream kiosk, the souvenir kiosk's plush-shark wall, school-trip
  coat pegs at the Ticket Hall, coin telescopes.
- **The exhibits:** a jellyfish life-cycle display, info lecterns.
- **The base:** queue stanchions along the Fin Pavilion's front wall (rails, decoration only, with gaps).

### 5.5 What each camera sees
- **From each spawn (the Fin Terrace, 3.8):**
  - the forecourt and the goal circle below;
  - the Ticket Hall's glass canopy;
  - the gatehouse's curved front with GULPER AQUARIUM, and the lit mouth of the Shark Arch;
  - over the gatehouse (7.0 m): the bathysphere on its gantry and both kelp drums' brass crowns;
  - the Pump Hall's sawtooth roof and stack on the left, Penguin Point's rocks and the sea on the right.

  Keep the canopy glass so it never draws a bar across the `play` view.
- **From mid (the deck):** the full ring.
  - One side: the low Reef Halls glowing under their canopy.
  - The other: the open Sea Promenades with the sea and the sky behind.
  - The two kelp drums east and west, and both gatehouses with their clocks.
  - Over each gatehouse, the enemy's or your own fin tower in neon.
- **From the promenades:** the court below, the sea behind, a Kelp Drum ahead, the enemy's promenade across the
  court.
- **From the arcades:** the reef fish in the window beside you, the deck through the colonnade, the drum ahead.

### 5.6 The far backdrop on every side (`env`)
The aquarium is on its own island in Inkopolis Bay.
- **North-west (behind Bravo's wing and the NW arcade):** the Inkopolis skyline across the water. Reuse the bay city
  (`bay: true`) if it frames right; otherwise put our own skyline in the backdrop.
- **East (beyond the E drum):** open sea to the horizon, a red-and-white breakwater lighthouse, sailing dinghies, a
  distant container ship.
- **South-east (behind Alpha's wing):** the harbour mole running back to the seafront, a palm esplanade, the ferry
  pier with a second ferry coming in, and a seaside Ferris wheel.
- **West (beyond the W drum):** the coast curving away, with pale cliffs, white villas and a marina.
- **Settings:** `gulls: true` (it's the seaside); `boats: false` (we place our own ferries); `edge: 'none'`, because
  the island's granite sea wall is dressed by us under every deck edge (`kit.runs`).

### 5.7 Day and dusk
- **Day: a bright summer late morning.**
  - Sun high from the south-west (sunAz ≈ 215, sunEl ≈ 50).
  - Clean blue sky with a few cumulus, a sparkling teal sea (kept a little desaturated).
  - Crisp white render, and caustic light dancing under the tanks.
- **Dusk: a sunset from the west.**
  - Apricot to violet sky (sunEl ≈ 6). The sea goes slate-violet.
  - **Every tank glows from within:** dark water, silhouetted sharks, white-lit kelp, softly lit jelly columns. The
    jellies are white-pink, low saturation, so they don't compete with Grape or Bubblegum.
  - The neon fins burn warm white, and the arcade lamp columns and the Tubeway's white chevrons light up.
  - The bathysphere's portholes are lit, the lighthouse beam sweeps, and the city lights across the bay come on.
  - `stars: true`, with bloom on the lamps.

### 5.8 Intro fly-in and stage-select hero shot
- **Intro:** it opens on the bathysphere.
  - Close on its riveted portholes, swinging slightly, sharks passing under it through the lens.
  - The camera pulls up and out over the E Kelp Drum as the brass maintenance pod spirals up the RISING Kelp Line and
    pops out on the balcony.
  - Then it sweeps over the Sea Promenade and back down to the player's own Fin Terrace.
  - Suggested values: `intro: { from: [24, 13, 18], lookFrom: [0, 8, 0], toBack: 3.0 }`.
- **Stage-select hero shot:** taken from high over the sea south-east of Alpha's Pump Hall.
  - **Foreground right:** the hall's sawtooth roof and its GA stack.
  - **Across the frame:** the forecourt, the Ticket Hall's canopy and the South Gate's clock.
  - **The round Ocean Court:** the Great Tank with the bathysphere hanging over it, both kelp drums, and the Tubeway's
    glinting curves round the NE promenade.
  - **On the horizon:** Bravo's fin tower and the Inkopolis skyline.
  - Suggested values: `art: { from: [34, 25, -70], look: [0, 3, -6], fov: 56 }`.
  - The dusk version is the same frame with every tank lit.
- **Stage-select blurb:** "The city aquarium on its island in the bay, where every drop is behind glass and the
  Tubeway whisks squids through the shark lagoon."

---

## 6. The three biggest risks, and how I would handle them

1. **The pipes could unbalance the long-stage pacing: exit camping on one side, untouchable flank pushes on the
   other.** Untouchable travel plus known exits can turn a pipe into a death chute or into a free flank.
   - **Already built in:** pipe speed ≈ your own swim speed (18 m/s); a 3 s cooldown; one rider per mouth per
     0.7 s; the 0.45 s pop shield; exits facing cover; two exits on the Kelp Lines; turn-back on two-way pipes; bomb
     mail. The flip keeps any one flank from being "the" pipe flank for more than 90 s.
   - **Measure on the Mac mini, before any polish:**
     - pipe use per minute;
     - splats within 2 s of an exit (target: under about 30 % of exits);
     - share of zone captures and Bazookarp checkpoint pushes that began with a ride;
     - spawn → mid with and without pipes (it must not change).
   - **Knobs, in order:** speed (16–22 m/s), the pop shield (0.35–0.6 s), the cooldown (2–5 s), and Kelp Line B
     ending at the balcony only (the shorter branch).
2. **Glass everywhere could make the stage confusing, expensive, or wash out team ink.** Players might not
   understand why they can't shoot someone they can see. Bots might perceive differently from players. Transparency
   and water look costly, and blue tanks fight Aqua/Cobalt/Mint ink.
   - **Readability:** a strong glass read (frames, reflections, fish, a white beaded splat and a "tock" on every hit);
     one `glass` flag in level / physics / botSight, so bots see what players see.
   - **Ink:** the dark desaturated water; white caustics on lighting only.
   - **Cost:**
     - each tank is one shaded cylinder or box with an interior parallax "water" shader;
     - fish and kelp are instanced in one shared system (≤ 6 draw calls for every tank on the stage);
     - the tubes are merged geometry with a fresnel material and instanced brass collars;
     - no real refraction.
   - **Proof:** perf at load at or under Halyard, and shots of all five palettes on the deck and in the Shark Arch.
3. **A round building with walls risks reading as a box arena, a bowl or a stadium. Its curves also fight the
   engine's boxes and the tower's straight lines.**
   - **Against "arena":**
     - the ring is broken (two gates; two open seaside promenades with the sea right there; two drums as vertical
       breaks; the Service Gates and Penguin Steps out to the wings);
     - heights step round it (0 / 1.3 / 2.4 / 3.8);
     - the middle is a raised island, not a pit;
     - the court is filled every 6–8 m.
   - **Proof:** cover-map ≥ 90 %, the `play` view and mid shots from both spawns, and a top shot next to Craters to
     show the silhouettes differ.
   - **Building the curves:**
     - the court floor, the ring's walls and the promenade face are faceted chords. Use `ARC` at 5–6° per segment,
       as Terraces' contour kit does.
     - The Kelp Ramp is six straight 30° segments.
     - Every place the tower meets a curved face, it crosses it on a straight, square edge: the Feeding Step, the
       Service Gate opening, the hall's back edge, the rock terrace's straight front. The track never climbs a curve.
   - **If a curve still causes nav or tower trouble,** straighten that facet locally rather than bend the track.
