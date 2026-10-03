# Bluestone Junction (`bluestone`): the design

The lead's design, written for the builder, 2026-10-04, **revision 2** (after the review by the user's advocate and the
build / modes engineer; every issue and what was done about it is in §7, the review log). It judges the three concepts
next to this file (`concept-play.md`, `concept-place.md`, `concept-gimmick.md`) and the engine programmer's design, takes
the strongest as the base, and grafts the best of the others onto it. The engine programmer's design was `engine.md`. It
is kept unchanged as `engine-draft.md`, because this disk is case-insensitive and `ENGINE.md` would otherwise have
overwritten it. The final engine contract for exactly this layout is `ENGINE.md` (next to this file). Where the draft
and `ENGINE.md` differ, `ENGINE.md` wins.

The user's words are in `../../REQUEST.md` ("stages:"); the rules are in `../STAGE-RULES.md`; the Bazookarp rules are in
`../../bazookarp/SPEC.md` (§9.4 has this stage's guarantees). They outrank this document.

**Conventions.** World metres and seconds. +x is east, +z is north (Bravo). Alpha spawns at −z and Bravo at +z. A kid
facing +z has +x on its *left*. Every `half` piece is Alpha's, and Bravo's is its 180° twin (x, z) → (−x, −z). Heights
are tops. Water (the river) is the death plane at y −1.6. "Era 1" is the 1880s, "era 2" is today and "era 3" is the
3000s. An era tag uses the engine's format: `'1'`, `'12'`, `'2'`, `'23'` or `'3'`, and no tag means all three. Bearings
are measured from +z toward +x (0° = north, 90° = east, 180° = Alpha's spawn), so they read as a clock face: 12 o'clock
is Bravo's spawn, 6 o'clock is Alpha's. Flathead Street's frame: "along" = p·(0.9063, 0.4226) and "off" =
p·(−0.4226, 0.9063); `AO(a, o)` is the world point at along a, off o.

Every number in §2 to §4 comes out of one plan model (revision 2: `geo2.py` is the piece list; `plan2.py` rasterises it
at 0.5 m per era and per mode; `m1.py` … `m11.py` and `groups.py` measure it), so the plan, the tables and the
measurements agree. They are raster estimates. The real tools (`spawn-mid.js`, `cover-map.js`, `tower-check.cjs`,
`bazookarp-check.cjs`, `check-maps`) are the acceptance, and §6 says when to run them.

---

## 0. The judgement

### 0.1 Scores (1–10)

| | play (`concept-play.md`) | place (`concept-place.md`) | gimmick (`concept-gimmick.md`) |
|---|---|---|---|
| **The place** (identity, landmark, would the user recognise and love it) | **8**. The most faithful corner of the city it never names (the Swanston / Flinders crossing, Degraves, Hosier Lane, Centre Place, Young & Jackson's, the Yarra) with fish-pun names. The clock arch is right. Tartar is lost up in a lantern at 17–20 m. | **9**. The best writing: a gold-boom city where the bluestone, the street plan and the telephone are the only constants, the Flatiron, the Royal Arcade's striker clock, the flood marks as Tartar's clue. | **7**. A clear picture (the domed Terminus, the clock rows, Tartar hanging inside the dome on his cord) but less of the real city in it. |
| **The play** (mid, lanes, flanks, heights, cover, spawn depth) | **7**. The sharpest reading of an X: each arm is where one team's home flank meets the other's away flank. But mid is a 16 × 14 m plate 2.4 m up between 46 m arms, the footprint is 100 × 162 m in two rotated frames, and the side zone is 77 m². | **5**. In era 1 the whole map funnels over a 26 m bridge between two lagoons. The side zone sits 21 m from its own pad, and Engine Street is a 64 × 9 m bar. | **7**. The best mid: a round circus with an open ring 10.5 m wide round a 1.3 m octagon under the dome, and clock-face callouts. Four lanes per side even in era 1, and two raised corners per team. But its lanes are 5 m wide (Calamari taught us "cramped"). |
| **The gimmick** (better matches, readable, fair, buildable per the engine draft) | **7**. Era 2 only opens and era 3 only adds, plus the "one collider, three looks" kit. But its floating trams leave a 0.8 m squid gap under a solid tram. | **6**. "The future is already there, boarded up" is the right principle. But it invents its own contract (dormant blocks, per-era flags), and its Skytram stair unfolds onto a standable box. | **8**. Fitted to every engine rule, with blueprints and pre-jump clocks. The clock-hand sweep is clever but puts both bases and all of the main street at J + 0. The Halo is the showpiece. |
| **Every mode** | **6**. Bazookarp L = 52 m (under the 55 m minimum) with the weir at 62 %. The Boss is in era 3 under its own sky-bridges. | **4**. Opening the arcade shrinks the checkpoint → goal leg from 52 m to 23 m: the Carp Field must stay within ±5 % across eras (SPEC §9.4). The tower is 138 m. | **6**. Bazookarp's weir sits at 66 % with a 19.6 m last leg (both outside SPEC §9.1). The tower is 135 m. Boss in era 3 under the Halo: BossNav walls anything solid at floor + 5.2 m, so the Halo shuts the boss out of the circus. |
| **Uniqueness** (vs the twelve stages and aquarium / caldera) | **7**. A skewed X, but a tilted 58 m band with spurs risks reading as a tilted rectangle. | **8**. A bow-tie whose silhouette grows in era 3. | **8**. A skewed X with river corners and railyard corners and a round heart. |
| **Total** | **35** | **32** | **36** |

### 0.2 What I took from whom (five lines)

1. **Base: gimmick.** I kept its layout: Swimston Street on the spawn axis, a round circus with a 1.3 m octagonal concourse under the dome, a diagonal street out to a wharf on each side, river corners and railyard corners, era-1 gates and era-3 builds, the Halo, the tower riding the tram line and the weir by the Post Office steps.
2. **From play:** I took the real corner's names and buildings (Swimston / Flathead Streets, Degrayling and Hoki Lanes, Centre Plaice, the Young & Jackfish, the Yabby) and the era-slot kit (one collider, three looks). I also took the home-arm / away-arm reading of the X, the early bell at J − 20 with the clocks counting down, phone kiosks ringing with Tartar, Tartar's lines and (revision 2) its "living" idea of a second storey that only the future builds.
3. **From place:** I took the identity (bluestone and the telephone are the only things that never change), the light pulses that run out along the overhead wires before the wave and the Royal Arcade's striker clock. I also took the flood marks and storm bank as Tartar's clue, the frozen-wave hero shot and the rewind under the results.
4. **From the engine draft:** I kept the union world, the radial front from Tartar at 25 m/s and every hard rule. What I changed (in `ENGINE.md`): Boss Battle runs in era 2, highlights use neutral colours, a roof-to-floor rule for appearing on roofs (19b), a pre-bell, era masks on murals, and rule 4 is restated.
5. **Mine:** I redrew and measured the whole plan twice. Revision 2 tapers the Swimston strokes and lengthens the Flathead strokes so the stage reads as an X, closes real routes in the 1880s, builds a real new area in the 3000s (the Signal Garden over the railyards), raises the base onto a terrace and puts free-standing cover in every lane.

### 0.3 Revision 2 in one paragraph

The reviewers were right that revision 1 was a 54 m band with stubs, that its lanes were bare, that its 1880s closures
closed nothing, that its 3000s added 5 % and that its sky-bridge appeared over the hotel balcony. Revision 2 tapers both
Swimston strokes toward the circus (the river quay comes in from x 27 to 21.5 and the viaduct from x −27 to −24),
lengthens the Flathead strokes from along ±50 to ±62, and cuts the hotel's low wing so Prow Place opens north. Era 1 now
has three routes per team: Degrayling Lane north is stacked with crates, the Royal Arcade is a building site, and the
river side has neither its boardwalk nor its bridge. Jump 1 opens all of them. Jump 2 builds the Halo, two glass stairs up
to it out of the Swimston superstops, the **Signal Garden** (about 300 m² of park on a deck over each team's railyard,
reached by three stairs) and the Tide Steps on the river: era 3 has 12.0 % more floor than era 2. The sky-bridge and the
roof garden are gone. Every lane has free-standing cover at most 25 m apart, 48 % of the floor is at street level, and
the base stands on a 1.0 m forecourt terrace.

---

## 1. Name, identity, story, landmark

**Name:** **Bluestone Junction**.

**Stage-select blurb:** "Under the station clocks, Commander Tartar is winding the city forward: the streets jump from
the 1880s to today to the 3000s, opening new routes and raising new ground as the match goes on."

**Identity.** A southern river city paid for by a gold boom and paved in dark blue-grey basalt: every kerb, gutter,
laneway and plinth is bluestone, in 1888, today and in the 3000s. The stage is its heart, **Clockface Circus**: the round
plaza where the tram boulevard, **Swimston Street**, meets the old river road, **Flathead Street**, which cuts across the
grid on the diagonal because it follows the river bend. In the middle stands **Flathead Street Station's dome**: an open
domed booking hall on eight cast-iron columns, with a **row of five clocks over each flight of steps**. "Meet you under
the clocks." Around the circus stand the city everyone knows without its name: the flatiron corner pub (**the Young &
Jackfish**) with its iron-lace balcony, the **General Post Office** with its colonnaded steps, the glass-roofed **Royal
Arcade** that runs under the hotel through an arch to the circus, the café lane **Degrayling Lane**, the street-art lane
**Hoki Lane** under the railway viaduct, the **Boathouse** on the river bend, the bond stores and the **Customs House**,
the **Iron Bridge** over the bend, the railyards behind the viaduct, and at each end of Swimston Street the **Cable Tram
Engine House** (the spawns) on its forecourt terrace with its chimney. The city is never named. Every sign uses the
fish-pun names. "Melbourne" appears nowhere: not in a string, a comment that ships, or an asset name.

**Story (the user's lore).** **Commander Tartar** is an AI built 12,000 years ago that looks like an old telephone: a
rounded cream-and-brass body, a curly-corded handset on its cradle, and a dial for a face that glows like an eye. He
wired himself into the city's first telephone exchange the year it opened. Now he hangs from the crown of the station
dome by his own coiled cord, winding the city's clock forward to see how the Earth is destroyed, so he can go back and
tell his creator, **the Professor**, how to start the world anew. He rings twice a match. Each time, a wave of
clock-light sweeps out of the dome and the city around the players becomes its own future:
- the **1880s**: gaslight, cable trams, horse troughs, hoardings, a produce lane stacked with crates, an arcade still
  being built, a riverfront still missing its promenade and its bridge;
- **today**: electric trams, café laneways, street art, glass towers rising behind the old facades, a riverside boardwalk
  and the finished Iron Bridge;
- the **3000s**: light, glass and gardens: the city has grown a second storey. A glass ring walkway floats round the
  dome, glass stairs climb out of the tram stops, white towers and vertical farms rise out of the old buildings, the
  railyards have been roofed over as a park (the Signal Garden), and flood marks stand on every river wall. That last
  detail is Tartar's clue to how it ends.
Tartar himself is the one thing on the stage that is the same in every era: he is outside time. At the end of a match,
under the results, he gets his answer and goes back (§3.10).

**The landmark.** The dome (drum at 8–10 m, copper dome to 15 m, lantern to 19 m) with **the clock rows over the steps
and Tartar hanging beneath the dome at 5.4–7.8 m**, framed by the column arches. It is visible straight up Swimston
Street from both spawn decks, past the superstop's canopy. In the 3000s, **the Halo** (a glass ring walkway at 5.4 m)
floats round it, and a glass stair rises to it out of each team's superstop.

---

## 2. The plan

### 2.1 Macro shape: a skewed X

Two streets cross at the circus, and each is drawn as two strokes that reach out from it:
- **Swimston Street** runs along z (the spawn axis). Each team's **Swimston stroke** is a fan that narrows toward the
  circus: 54 m wide across its base (x ±27), **45.5 m at its waist** (x −24 … 21.5). Its river side is a diagonal quay
  from (27, −54) to (21.5, −30), its railyard side a diagonal viaduct from (−27, −58) to (−24, −33).
- **Flathead Street** runs through (0, 0) on bearing **65°**. Its land is the band **|off| ≤ 14** out to **along ±62**
  (the wharves). Alpha's arm is along < 0 (west-south-west, 8 o'clock); Bravo's arm is along > 0.
- The four corners between them are out of play and reach in close to the circus. The **river bends** fill the
  north-west and south-east corners: the water comes up to the circus's edge at 4 and 10 o'clock (the apex is 22 m from
  the centre). The **railyards** fill the south-west and north-east corners, raised behind a bluestone viaduct wall; their
  apex is 36 m from the centre.
- The X is skewed (65° / 115°). The Swimston strokes are 83 m long (to the engine house), the Flathead strokes 62 m (to
  the wharf ends). In era 2 a boardwalk and a bridge web each river corner; in era 3 a garden deck fills the inner part of
  each railyard corner and a ring floats over the middle.

**Land outline** (Alpha's chain Q1 … Q13; the full outline is the chain plus its mirror, which starts again at −Q13 = Q1):

| Point | (x, z) | What it is |
|---|---|---|
| Q1 | (−21.50, 5.42) | Alpha's arm's river edge (off 14) meets Bravo's quay (the NW river apex) |
| Q2 | (−62.11, −13.51) | the West Wharf's north corner (along −62, off 14) |
| Q3 | (−50.27, −38.89) | the West Wharf's south corner (along −62, off −14) |
| Q4 | (−24.00, −26.64) | the SW railyard apex: the arm's railyard edge (off −14) meets the viaduct |
| Q5 | (−24.00, −33.00) | the viaduct's bend |
| Q6 | (−27.00, −58.00) | the viaduct reaches the west yard |
| Q7 | (−27.00, −68.00) | the west yard's outer corner |
| Q8 | (−16.00, −83.00) | the engine house's west corner |
| Q9 | (16.00, −83.00) | the engine house's east corner |
| Q10 | (27.00, −68.00) | the east yard's outer corner |
| Q11 | (27.00, −54.00) | the quay leaves the forecourt |
| Q12 | (21.50, −30.00) | the quay's bend beside Centre Plaice |
| Q13 | (21.50, −5.42) | the quay meets Bravo's arm's river edge (off −14): the SE river apex |

Q1–Q2 is Alpha's arm's river edge (off 14), Q2–Q3 the wharf end (along −62), Q3–Q4 the railyard edge (off −14), Q4–Q6
the viaduct, Q6–Q10 the base, Q10–Q13 the river quay.

**Bounds:** x −63 … 63, z −85 … 85. The farthest arena points are the boiler house's and tram shed's outer back corners
(±22, −82), 84.9 m from (0, 0) (ENGINE rule 37: ≤ 85 m); the wharf ends are 63.6 m out.

**Build the ground from the outline**, as Spirhalite does (`src/world/stages/spirhalite/islands.js`): a bluestone kerb
bar a few centimetres lower along each diagonal edge, and axis-aligned cores inside. Two floor slabs must never share a
top where they overlap (check-maps: tops ≥ 8 cm apart). Copy the helper into `bluestone/ground.js` rather than
importing another stage's file. **One exception: the circus floor is a single `single` block** x −20 … 20, z −20 … 20,
top 0 (it carries the hour-ring mural, §5.4); the ground helper leaves that square out.

**Why it reads as an X.** Seen from above (the stage-select thumbnail draws era 1), each Swimston stroke is a fan whose
sides close in on the circus; the water reaches the circus at 4 and 10 o'clock. A plain band with jagged edges
(revision 1, Kelpline, Cargo) has long straight sides; this has none: the longest
straight stretch of either Swimston stroke's side is 25 m (the quay beside the Plaice and the Boathouse), and the
Flathead strokes run 30–45 m past the Swimston strokes' sides.
§6.1 #1 makes this a check: the `check-maps --svg` thumbnail, side by side with Kelpline's and Treehills'.

**Unlike every other stage:** Kelpline and Cargo are one skewed band, Treehills a diamond, Terraces and Spirhalite an S,
Craters round, and the rest bands. In this batch, the aquarium is a ring and the caldera a crescent.

### 2.2 The whole stage (era-3 union; 2 m per character across, 4 m per row; +z at the top)

Legend: `.` floor at 0 · `:` 0.6 (Degrayling's pavements, the arcade, the West Wharf) · `;` 1.0 (the forecourt
terraces and yards) · `=` 1.2–1.6 (the concourse, the GPO terrace, the loading platform) · `+` 2.4 (the balcony and its
gallery, the Boathouse deck) · `/` stairs and ramps · `S` spawn deck (3.3) · `#` buildings, walls and parapets (`roof`)
· `o` cover objects (0.9–3 m) · `|` railings · `~` river · `Y` railyards (out of play: a roof embankment behind the
viaduct). Era pieces: `x` era 1 only (crates, hoardings, the wagon, bridge-works barriers) · `w` eras 2–3 (the boardwalk)
· `b` eras 2–3 (the Iron Bridge) · `s` the superstop (eras 1–2) that becomes the Halo stair (era 3) · `h` era 3 (the
Halo, 5.4) · `p` the poster column that becomes a light-pylon (era 3) · `g` era 3 (the Signal Garden, 3.18) · `t` era 3
(the Tide Steps). The map overlays all eras: the era-1 crates in Degrayling Lane (`x`) and the era-3 garden (`g`) never
exist at the same time.

```
        -62  -52  -42  -32  -22  -12  -2   8    18   28   38   48   58
        |    |    |    |    |    |    |    |    |    |    |    |    |
    82 |~~~~~~~~~~~~~~~~~~~~~~~................~~~~~YYYYYYYYYYYYYYYYYY
    78 |~~~~~~~~~~~~~~~~~~~~######################~~YYYYYYYYYYYYYYYYYY
    74 |~~~~~~~~~~~~~~~~~~~~####.SSSSSSSSSSSS.####~~YYYYYYYYYYYYYYYYYY
    70 |~~~~~~~~~~~~~~~~~##;;;///SSSSSSSSSSSS///;;;;YYYYYYYYYYYYYYYYYY
    66 |~~~~~~~~~~~~~~~~~;;;;;;;;SSSSSSSSSSSS;;;;;;;YYYYYYYYYYYYYYYYYY
    62 |~~~~~~~~~~~~~~~~~;;;;;;;;o//;;;;;;//;;;;;;#;YYYYYYYYYYYYYYYYYY
    58 |~~~~~~~~~~~~~~~~~;o;;oo;;o;;;;;;;o;;;;;;;;#;YYYYYYYYYYYYYYYYYY
    54 |~~~~~~~~~~~~~~~~~;;;;;;;;;;o;;;;;;;;;;;;;#;;YYYYYYYYYYYYYYYYYY
    50 |~~~~~~~~~~~~~~~~~~;;;;;;;;;;/////;;;;;;;;;;;YYYYYYYYYYYYYYYYYY
    46 |~~~~~~~~~~~~~~~~~~.o...............xx.......ggggggggggYYYYYYYY
    42 |~~~~~~~~~~~~~~~~~~~..##:::#.o#.::.####xx.o.#gggggggggggYYYYY~~
    38 |~~~~~~~~~~~~~~~~~~~..##:::#..#.:#/====xx...gggggggggggg:~~~~~~
    34 |~~~~~~~~~~~~~~~~~~~~......#.o#.../====xx...ggggggg#:##:::~~~~~
    30 |~~~~~~~~~~~~~~~~~~~~..............====xx...ggg#.o..:#::===~~~~
    26 |~~~~~~~~~~~~~~~~~tww//....#.o.ss.+====xx.....o.###..::::===~~~
    22 |~~~~~~~~~~~~~~~~~~wwoooxxx#...ss.+####::...#####.....::::===~~
    18 |~~~~~~~~~~~~~~~~bbwwoooxxx....ss.+++++...........:o:..::o::::~
    14 |~~~~~~~~~~~~~~~bbbwwooo....hhhhhhh//.........:.........:::::::
    10 |~~~~~~~~~~~~~~bbb~ww./....hh.////.hh.o...........#####..::|~~~
     6 |~~~~~~~~~~~~~bbb~~ww./..hh..======//hhp........##.....~~~~~~~~
     2 |~~~~~~~~~~~~bbb~~.......h.=========..h....###...bbb~~~~~~~~~~~
    -2 |~~~~~~~~~~~bb....###....h.=========..h........~bbb~~~~~~~~~~~~
    -6 |~~~~~~~~.....##..#.....phh//======..hh....w~~~bbb~~~~~~~~~~~~~
   -10 |~~~~::...####............hhh.////.hh..../.w~~bbb~~~~~~~~~~~~~~
   -14 |::::::.........:#:...o...//hhhhhhhh....+++w~bbb~~~~~~~~~~~~~~~
   -18 |~::::o:...:o............++++o.ss....xxx+++wbb~~~~~~~~~~~~~~~~~
   -22 |~~==::::.......###...#::###+..ss..##xxx++bwb~~~~~~~~~~~~~~~~~~
   -26 |~~~==::::...###.......::...+..ss..##..../.wtt~~~~~~~~~~~~~~~~~
   -30 |~~~~==::::...o..gggo.#xx===............./.wtt~~~~~~~~~~~~~~~~~
   -34 |~~~~|:::##:#ggggggg..#xx===//..##.##......~~~~~~~~~~~~~~~~~~~~
   -38 |~~~~~::ggggggggggg#..#xx===//:.##.##.......~~~~~~~~~~~~~~~~~~~
   -42 |~~~YYYYggggggggggg...#xx###..#.##.##:o:##o.~~~~~~~~~~~~~~~~~~~
   -46 |YYYYYYYggggggggggg...#xx..................o|~~~~~~~~~~~~~~~~~~
   -50 |YYYYYYYYYYgggggggg..........................~~~~~~~~~~~~~~~~~~
   -54 |YYYYYYYYYYYYYYYYY#;;;;;;;;;;;;;;;;o;;;;;#;;;~~~~~~~~~~~~~~~~~~
   -58 |YYYYYYYYYYYYYYYYY;##;;;;;o;;;;;;;;;;;;;o;;;o~~~~~~~~~~~~~~~~~~
   -62 |YYYYYYYYYYYYYYYYY;##;;;;;o//;;;;;;//;;;;;;;;~~~~~~~~~~~~~~~~~~
   -66 |YYYYYYYYYYYYYYYYY;;;;o;;;///;;;;;;//;;;;;;;;~~~~~~~~~~~~~~~~~~
   -70 |YYYYYYYYYYYYYYYYY;;;;;///SSSSSSSSSSSS///;;;#~~~~~~~~~~~~~~~~~~
   -74 |YYYYYYYYYYYYYYYYY~~.####.SSSSSSSSSSSS.####~~~~~~~~~~~~~~~~~~~~
   -78 |YYYYYYYYYYYYYYYYY~~~######################~~~~~~~~~~~~~~~~~~~~
   -82 |YYYYYYYYYYYYYYYYY~~~######################~~~~~~~~~~~~~~~~~~~~
        -62  -52  -42  -32  -22  -12  -2   8    18   28   38   48   58
        |    |    |    |    |    |    |    |    |    |    |    |    |
```

### 2.3 Alpha's half (1.25 m per character, 2 m per row), all eras overlaid

```
        -50     -40     -30     -20     -10     0       10      20      30
        |       |       |       |       |       |       |       |       |
     9 |~~~~~~~~~~~~~bbbb~~~www.//.....hhh...//////.//hhh...............
     7 |~~~~~~~~~~~~bbbb~~~~www.//...hhhh...=#====#=///hhhh........o....
     5 |~~~~~~~~~~~bbbb~~~~~www.....hhh...============/..hhh...o....###.
     3 |~~~~~~~~~~bbbb~~~~~......o..hhh..==============..hhh.....#######
     1 |~~~~~~~~~bbbbb~|............hhh..==============..hhh......###...
    -1 |~~~~~~~~bbbb........##......hhh..==============..hhh............
    -3 |~~~~~~~bxbbb....######......hhh..===o======o===..hhh..o.......~~
    -5 |~~~~~...bbb..#...###....o...hhh../============...hhh.....wxw~~~~
    -7 |~~........####.............phhhh////========....hhhh..//.www~~~~
    -9 |......########................hhhh//.======...hhhh....//.www~~~b
   -11 |....######...................o..hhhh.//////.hhhh......//.www~~bb
   -13 |:...###....o....:##:....o......///hhhhhhhhhhhh.......++++www~bbb
   -15 |:...............:..............////h...ss...h...xxxxx++++wwwbbbb
   -17 |::.==....:...................+++++++...ss..o....xxxxx++++wwwbbbb
   -19 |:::...:oo:....o..........::::#####++...ss.......xxxxx++++wwwbbb~
   -21 |::::............####.....::::#####++...ss.....##xxxxx++++wwwbb~~
   -23 |::::........########.....::::.....++...ss...o.##xxxxx++++wwwb~~~
   -25 |:=:::....#######.........::::.....++...ss.....##......///wwwttt~
   -27 |::::::..=####...oo.......xxxx=====++..........##......///wwwttt~
   -29 |::::::...........#gg#...oxxxx=====++..................///wwwttt~
   -31 |=:::##:.......gggggg#....xxxx=====...o...................|~~~~~~
   -33 |:::####:..##Yggggggg#....xxxx=====//.....##...##.....o....~~~~~~
   -35 |::::##:#gggggggggggg#....xxxx=====//.....##...##..o.......~~~~~~
   -37 |::::gggggggggggggggg....oxxxx=====//.....##.o.##..oo......~~~~~~
   -39 |#ggggggggggggggggggg.....xxxx=====//.##..##...##:::::###...~~~~~
   -41 |Yggggggggggggggggggg.....xxxx#####...##..##...##:::::###o..~~~~~
   -43 |YYggggggggggggggggg#...o.xxxx#####.......##...##:::::###....~~~~
   -45 |YYgggggggggggggggggg.....xxxx.oo.....oo..........oo.........~~~~
   -47 |YYYgggggggggggggggg#..........xxx.........................o.~~~~
   -49 |YYYYggggggggggggggg...........xxx............................~~~
   -51 |YYYYYYYYYYYYYYYYYY;;;;;;;;;;;;;;;;;;////////;;;;;;;;;;;;;;;;;~~~
   -53 |YYYYYYYYYYYYYYYYYY#;;;;;;;;oooooooo;;;;;;;;;;;;;;;;;;;;;;;;;;~~~
   -55 |YYYYYYYYYYYYYYYYYY#;;;;#;;;;;;;;;;;;;;;;;;;;;oo;;;;;;;;#;;;;;;~~
   -57 |YYYYYYYYYYYYYYYYYY;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;~~
   -59 |YYYYYYYYYYYYYYYYYY;;##;;;;;;;;;o;;;o;;;;;;;;o;;;o;;;;;;;;;;;;;~~
   -61 |YYYYYYYYYYYYYYYYYY;;##;;;;;;;;;o///;;;;;;;;;;///o;;;;;;;;;;;;;~~
   -63 |YYYYYYYYYYYYYYYYYY;;##;;;;;;;;;o///;;;;;;;;;;///o;;;;;;;;;;;;;~~
   -65 |YYYYYYYYYYYYYYYYYY;;##;;oo;;;;;////;;;;;;;;;;////;;;;;;;;;;;;;~~
   -67 |YYYYYYYYYYYYYYYYYY;;;;;;;;;;;;SSSSSSSSSSSSSSSSSSSS;;;;;;;;;###~~
   -69 |YYYYYYYYYYYYYYYYYY;;;;;;;;;;;;SSSSSSSSSSSSSSSSSSSS;;;;;;;;;###~~
   -71 |YYYYYYYYYYYYYYYYYY;;;;;;;;////SSSSSSSSSSSSSSSSSSSS////;;;;;###~~
   -73 |YYYYYYYYYYYYYYYYYY;;;;;;;;////SSSSSSSSSSSSSSSSSSSS////;;;;;;;;~~
   -75 |YYYYYYYYYYYYYYYYYY~~~~#######.SSSSSSSSSSSSSSSSSSSS.#######~~~~~~
   -77 |YYYYYYYYYYYYYYYYYY~~~~####################################~~~~~~
   -79 |YYYYYYYYYYYYYYYYYY~~~~####################################~~~~~~
   -81 |YYYYYYYYYYYYYYYYYY~~~~####################################~~~~~~
   -83 |YYYYYYYYYYYYYYYYYY~~~~~~~~~..........................~~~~~~~~~~~
        -50     -40     -30     -20     -10     0       10      20      30
        |       |       |       |       |       |       |       |       |
```

### 2.4 Mid close-up (1 m per character, 2 m per row), all eras overlaid

```
        -30  -25  -20  -15  -10  -5   0    5    10   15   20   25   30
        |    |    |    |    |    |    |    |    |    |    |    |    |
    25 |~ttttwww.///.......####.....sss....++.......::::............
    23 |~~~~bwwwoooooxxxxxx####oo...sss...o++.......::::....o...####
    21 |~~~bbwwwoooooxxxxxx####.....sss....++#######::::#......#####
    19 |~~bbbwwwoooooxxxxxx####.....sss...o++#######::::#.......#...
    17 |bbbbbwwwoooooxxxxxx.........sss....+++++++++................
    15 |bbbbbwwwoooooxxxxxx.........sss....//////...................
    13 |bbbb~wwwooooo.........hhhhhhhhhhhhhhh////.......oo.....::##:
    11 |bb~~~www.///........hhhhh.///////..hhhh................::...
     9 |b~~~~www.///......hhhhh...///////..//hhhh...................
     7 |~~~~~www.///....hhhhh....=#=====#==////hhhhh..........o.....
     5 |~~~~~www.......hhhh....==============//..hhhh....o.....###..
     3 |~~~|.......oo..hhh...=#==========o===#=..hhh.......########.
     1 |...............hhh...==================..hhh........####....
    -1 |....###........hhh...==================..hhh.............o..
    -3 |########.......hhh...=#==o===========#=..hhh...o.........~~~
    -5 |.####.....o....hhh.../===============....hhhh......wwww~~~~~
    -7 |..............phhhhh////===========....hhhhh...///.wwww~~~~~
    -9 |..................hhhh///.=======....hhhhh.....///.wwww~~~bb
   -11 |................o...hhhh..///////..hhhhh.......///.wwww~~bbb
   -13 |:###:.....o........///hhhhhhhhhhhhhhhh........+++++wwww~bbbb
   -15 |:................../////h...sss...hh....xxxxxx+++++wwwwbbbbb
   -17 |................+++++++++...sss..oo.....xxxxxx+++++wwwwbbbb~
   -19 |...........:::::#######++...sss.........xxxxxx+++++wwwwbbb~~
   -21 |####.......:::::#######++...sss...o..###xxxxxx+++++wwwwbb~~~
   -23 |#####......:::::.......++...sss....o.###xxxxxx+++++wwwwb~~~~
   -25 |...........:::::.......++...sss...o..###........///wwwwttt~~
   -27 |oo.........xxxxx=======++............###........///wwwwttt~~
   -29 |.##gg#...ooxxxxx=======++.......................///wwwwttt~~
        -30  -25  -20  -15  -10  -5   0    5    10   15   20   25   30
        |    |    |    |    |    |    |    |    |    |    |    |    |
```

### 2.5 Heights, what a 1.8 m climb means, and how much of the ground is flat

| Tier | Where | How a kid gets up |
|---|---|---|
| −0.16 … −0.08 | the boardwalk (eras 2–3), the Iron Bridge (eras 2–3), the Tide Steps (era 3) | level with the quay (an 8–16 cm step) |
| 0 | streets, lanes, the circus, Customs Lane, Centre Plaice, Prow Place, the arms | — |
| 0.3 | the tram islands (Flathead), the west-track stop (Swimston, not in Tower Command) | a step |
| 0.6 | Degrayling Lane's raised pavements (both ends of the Plaice), the Royal Arcade's floor and arch, the West Wharf | a step-hop from anywhere |
| 1.0 | the forecourt terraces and yards round each base | hop up anywhere; full-width steps from Swimston |
| 1.2 | the GPO terrace | hop up its north and east faces; the GPO steps (8 m wide) |
| 1.3 | the concourse | hop up anywhere; steps and ramps as listed |
| 1.6 | the West Wharf's loading platform | a hop from the wharf |
| 2.4 | the Young & Jackfish balcony and gallery, the Boathouse deck | **stairs only** (2.4 is a wall to a kid), two 3 m stairs each; squids swim the inkable faces |
| 3.18 | the Signal Garden (era 3) | three 3 m stairs (from Hoki Lane, the arm's south walk and the West Wharf) |
| 3.3 | the spawn decks | grand stairs and side ramps |
| 5.3 / 5.4 | the Halo stairs' tops and the Halo (era 3) | the glass stair out of each superstop (23.8°), or squids up the inkable light-pylon (5.4 m) |
| roof | buildings 6–9 m, verandas 3.2–3.4, trams 3.2, superstops 3.2 (eras 1–2), the viaduct and railyard walls (4.1 parapets), every gate | never: off-limits, slide off |

**Floor by height** (the plan model's raster; walkable tops):

| Era | Total | at 0 | 0.3–1.0 | 1.2–1.6 | 2.4 | 3.1–3.8 | 5.3–5.4 |
|---|---|---|---|---|---|---|---|
| 1 | 8,196 m² | **47 %** | 32 % | 9 % | 5 % | 6 % | — |
| 2 | 8,954 m² | **48 %** | 33 % | 8 % | 5 % | 6 % | — |
| 3 | 10,025 m² | 44 % | 30 % | 8 % | 5 % | 11 % | 3 % |

No single height holds more than 48 % of the floor in any era (the user's rule: varied heights on the ground itself; our
check: ≤ 65 %). Revision 1 had 78 % at 0.

Rules this layout keeps:
- Every gate is 2.8 m with a `roof` top and `paint: false` faces, and nothing standable lies within 3 m of a gate unless
  it is at least 0.8 m below the gate's top. Nobody climbs a closed gate. (Checked: the nearest standable top to a gate
  is the Boathouse deck at 2.4 beside the Degrayling crates' 3.4 top: 1.0 m below.)
- Every building face is inkable from 0 to 3.0 m and `paint: false` above that (§2.6: each building is two stacked
  blocks). Squids cannot reach a roof, and the paint and lightmap budgets stay small.
- Every walkable top is reachable on foot in every era it exists in, by nav-legal steps (hops ≤ 1.25 m, stairs, ramps;
  measured from Alpha's pad, metres):

| Top | Era 1 | Era 2 | Era 3 |
|---|---|---|---|
| GPO terrace | 42.3 | 42.3 | 42.3 |
| balcony gallery | 50.3 | 50.3 | 50.3 |
| balcony N (Alpha's raised corner) | 59.7 | 59.7 | 59.7 |
| Boathouse deck | 61.7 | 61.7 | 61.7 |
| West Wharf loading platform | 90.0 | 90.0 | 77.3 |
| Royal Arcade | — | 44.2 | 44.2 |
| Signal Garden | — | — | 46.9 |
| Halo (south side) | — | — | 58.9 |


### 2.6 The pieces (Alpha's half plus the single pieces; Bravo's half is the 180° twin)

Shapes are `B` boxes (x, z extents), `O` oriented boxes (w across × d along, turned rotY° = the bearing of the box's
long axis, mapkit `O()`), `R` ramps (`R(low, high, width)`; the slope is shown), `OCT` octagons (mapkit `OCT`). Flags:
`roof`, `rail`, `paint:false`, `hidden`, and `notIn:tower` (a Tower Command variant, §4.3). The Era column shows the mask
and the `eraGroup` (§3). Dressing (props) that adds no collider is in §5.

**How to build what the tables don't show** (each was a guess in revision 1):
1. **Buildings are two stacked blocks.** Every building listed `0–7`, `0–8` or `0–9` with `roof` (shops, the hotel's
   H1, the GPO's corner shop, the arcade walls, the bond store, the Customs House, the warehouses, the engine house, the
   tram shed, the boiler house) is built as an inkable block from 0 to 3.0 m (paint on; its top face is hidden by the
   block above) plus a `roof, paint:false` block from 3.0 m to the listed top. That is 2 level blocks per building and
   keeps paint and lightmap to the 0–3 m band. The hotel's arch block (3.8–9) and every wall, pier and parapet are a
   single `paint:false` block.
2. **Ramps are solid.** Every ramp here is a ground wedge (no `thin`): level.js gives it `thickness = max(0.6,
   rise·cos θ + 0.35)`, so its body reaches the floor or the tier it stands on. One ramp sets its own thickness: the
   Halo stair's upper flight, `thickness: 5.4`, so its body reaches the street under its high end (that space was
   inside the superstop).
3. **The railyards** (outside the land, behind the viaduct and the arm's railyard wall, out to the bounds) are a
   `hidden: true, roof: true, paint: false` embankment with its top at 3.1: collision only, no faces, no paint, no
   lightmap. Build it from boxes and oboxes that follow Q3–Q4–Q5–Q6 and the bounds. Anyone who lands on it (an Ink Jet)
   slides to its nearest edge, which is the viaduct side for anyone within 20 m of the lanes. The visible railyard (track
   fans, trains and coal stages per era) is backdrop dressing standing on that top. The Signal Garden (era 3) sits on it.
4. **The balcony** is two boxes that meet without overlapping (balcony N and the gallery, joined at x −7) plus the
   landing box at the front stair's top. Posts 0.25 × 0.25 m stand at ≤ 2.5 m along their outer edges (z −15.6 for
   x −14 … −5, x −5.1 for z −29 … −15.6, z −12.6 for the landing), except where a stair abuts.
5. **Rails and gaps** are listed with their ends. Every river rail's two ends lie on the outline (§2.1) or on another
   rail's end (checked in the plan model: every end within 0.08 m of the outline).
6. **Corners of walls and parapets** meet at piers (0.8 × 0.8 m, top 0.3 m above the walls), so no two wall blocks
   overlap with equal tops.

**Mid: the station and the circus**

| Piece | Centre (x, z) | Shape / size | y | Flags | Era / group | Purpose |
|---|---|---|---|---|---|---|
| circus floor (single) | (0, 0) | x −20…20, z −20…20 | −0.4–0 | | | one ground block under the whole circus: carries the hour-ring mural (§5.4) |
| concourse (single) | (0, 0) | OCT R 9.5 | 0–1.3 | | | mid: the booking-hall floor; centre zone, Pond, tower start. Build its centre (\|x\|, \|z\| ≤ 6.2) as one block (it carries the dial mural) |
| drum / dome / lantern (single) | (0, 0) | OCT R 8.8 / OCT R 6.5 / 3 × 3 | 8–10 / 10–15 / 15–19 | roof, paint:false | | the dome (colliders for the look) |
| clock steps S | (0, −10.39) | R (0, 0, −12) → (0, 1.3, −8.78), w 7 | 0>1.3 (22.0°) | | | Alpha's grand flight onto the concourse |
| ramp SW | (−7.62, −7.62) | R (−9.03, 0, −9.03) → (−6.21, 1.2, −6.21), w 5 | 0>1.2 (16.7°) | | | onto the concourse from the hotel corner and Alpha's arm |
| columns 112.5 / 157.5 / 202.5 / 247.5 | r 8.2 at those bearings | 0.9 × 0.9 | 1.3–8 | roof | | dome columns: inkable base 1.3–3.3, `paint:false` shaft 3.3–8 |
| clock beam S | (0, −7.57) | x −3.1…3.1, z −7.85…−7.3 | 4.3–6 | roof, paint:false | | the row of five clocks over the steps |
| ticket barriers 135 / 225 | (±3.54, −3.54) | 0.5 × 3 @ ±45° | 1.3–2.4 | | | concourse cover (era-slot kit) |
| cart 140 | (8.36, −9.96) | 1.2 × 2.2 @ 230° | 0–1.2 | | | ring cover (era-slot kit) |
| cart 160 | (5.99, −16.44) | 1.2 × 2.2 @ 250° | 0–1.2 | | | ring cover at the east footpath's mouth (clear of the lane) |
| ring bollards E | (10.4, −6) | x 9.8…11, z −6.6…−5.4 | 0–1.2 | | | ring cover (keeps the tower's lane 0.75 m clear) |
| phone kiosk 100 | (17.73, −3.13) | x 17.13…18.33, z −3.73…−2.53 | 0–2.4 | roof | | Tartar's telephone kiosk: rings with him, never changes |
| phone kiosk 232 | (−13.4, −10.47) | x −14…−12.8, z −11.07…−9.87 | 0–2.4 | roof | | Tartar's telephone kiosk |
| poster column 247.5 | (−15.24, −6.31) | x −15.94…−14.54, z −7.01…−5.61 | 0–2.6 | roof, paint:false | 12 `pylon-w` | bill-poster / advertising column: cover |
| light-pylon 247.5 | (−15.24, −6.31) | same footprint | 0–5.4 | | 3 `pylon-w` | inkable glass pylon: squids swim up onto the Halo |
| arm mouth planter | (−19.5, −4.6) | x −20.1…−18.9, z −5.6…−3.6 | 0–1.2 | | | cover where the arm meets the ring |

The north Clock Steps, the NE ramp, Bravo's columns, clock beam, barriers, carts, bollards, kiosks and pylon are the
mirror. The 202.5° poster column of revision 1 is gone: the balcony's front stair stands there now.

**The Halo, the superstops and their stairs (the Halo is era 3; the superstops eras 1–2)**

| Piece | Centre (x, z) | Shape / size | y | Flags | Era / group | Purpose |
|---|---|---|---|---|---|---|
| halo 90/1 | (13.1, −2.4) | 3 × 4.8 @ 180° | 5–5.4 | | 3 `halo-1` | the Halo: glass ring walkway, inner apothem 11.6, outer 14.6 |
| halo corner 112.5 | (13.12, −5.43) | 3.4 × 3.4 @ 112.5° | 4.9–5.3 | | 3 `halo-1` | corner (tucked 0.1 under the sides) |
| halo 135/0 | (10.96, −7.56) | 3 × 4.8 @ 225° | 5–5.4 | | 3 `halo-2` | |
| halo 135/1 | (7.56, −10.96) | 3 × 4.8 @ 225° | 5–5.4 | | 3 `halo-3` | |
| halo corner 157.5 | (5.43, −13.12) | 3.4 × 3.4 @ 157.5° | 4.9–5.3 | | 3 `halo-3` | |
| halo 180/0 | (2.4, −13.1) | 3 × 4.8 @ 270° | 5–5.4 | | 3 `halo-4` | |
| halo 180/1 | (−2.4, −13.1) | 3 × 4.8 @ 270° | 5–5.4 | | 3 `halo-5` | |
| halo corner 202.5 | (−5.43, −13.12) | 3.4 × 3.4 @ 202.5° | 4.9–5.3 | | 3 `halo-5` | |
| halo 225/0 | (−7.56, −10.96) | 3 × 4.8 @ 315° | 5–5.4 | | 3 `halo-6` | |
| halo 225/1 | (−10.96, −7.56) | 3 × 4.8 @ 315° | 5–5.4 | | 3 `halo-7` | |
| halo corner 247.5 | (−13.12, −5.43) | 3.4 × 3.4 @ 247.5° | 4.9–5.3 | | 3 `halo-7` | |
| halo 270/0 | (−13.1, −2.4) | 3 × 4.8 @ 0° | 5–5.4 | | 3 `halo-8` | |
| halo planters 112.5 / 157.5 / 202.5 / 247.5 | r 13.4 at those bearings | 1.2 × 1.2 | 5.3–6.4 | | 3 `halo-1` / `-3` / `-5` / `-7` | Halo cover (1.0 above the deck) |
| superstop A | (0, −23.6) | x −1.5…1.5, z −26.6…−20.6 | 0–3.2 | roof, paint:false | 12 `stair-s1` | the 1880s cable-tram shelter and turnstiles / today's superstop with its glass canopy: a solid median in Swimston that hides the concourse from the spawn deck |
| superstop B | (0, −17.6) | x −1.5…1.5, z −20.6…−14.6 | 0–3.2 | roof, paint:false | 12 `stair-s2` | its north half |
| halo stair 1 | (0, −23.6) | R (0, 0, −26.6) → (0, 2.65, −20.6), w 3 | 0>2.65 (23.8°) | | 3 `stair-s1` | the 3000s glass stair, lower flight, inside superstop A |
| halo stair 2 | (0, −17.6) | R (0, 2.65, −20.6) → (0, 5.3, −14.6), w 3, thickness 5.4 | 2.65>5.3 (23.8°) | | 3 `stair-s2` | upper flight, inside superstop B; lands 0.1 m below the Halo's south side |

Plus, all era 3:
- **Halo balustrades**: glass, 1.0 m high, 0.12 m thick (`rail`), along both edges of every Halo half-side and corner,
  each in the group of the deck it stands on (24 per half). Gaps: the outer edge where the stair lands (x −1.5 … 1.5 on
  the 180° side), the outer edge at the light-pylon (the 247.5° corner, 1.4 m), and two 2 m drop gaps in the inner edge
  at the middles of the 135° and 225° sides.
- **Stair side walls**: one glass `rail` plate per side per flight (4 blocks, groups `stair-s1` / `stair-s2`),
  x ±1.5 … ±1.62, from the street to 1.0 m above the flight's top end.

**Swimston Street (the centre lane)**

| Piece | Centre (x, z) | Shape / size | y | Flags | Era / group | Purpose |
|---|---|---|---|---|---|---|
| tram car 1 / 2 | (2.25, −41) / (2.25, −35) | x 0.95…3.55, z −44…−38 / −38…−32 | 0–3.2 | roof | | Alpha's parked tram on the east track (era-slot kit) |
| west stop island | (−2.4, −40) | x −3.8…−1, z −42.5…−37.5 | 0–0.3 | notIn:tower | | the west-track tram stop: breaks the west lane (absent in Tower Command, where the tower runs there) |
| west stop shelter | (−2.4, −40) | x −3.4…−1.4, z −42…−38 | 0.3–2.6 | roof, notIn:tower | | its shelter |
| west lane planter | (−3, −30.9) | x −3.6…−2.4, z −31.5…−30.3 | 0–1.2 | notIn:tower | | west-lane cover between the stop and the superstop |
| veranda E1 / E2 | (5.75, −23) / (5.75, −37.5) | x 4.5…7, z −27…−19 / −44…−31 | 3.2–3.4 | roof, paint:false | | iron-lace verandas over the east footpath |
| veranda W | (−5.75, −42) | x −7…−4.5, z −44…−40 | 3.2–3.4 | roof, paint:false | | veranda over the corner shop |
| news kiosk Sw | (5.8, −36.6) | x 5.1…6.5, z −37.6…−35.6 | 0–2.2 | roof | | footpath cover (era kit) |
| coffee cart Sw | (5.8, −23) | 1.2 × 2.2 @ 0° | 0–1.5 | | | footpath cover (era kit) |
| kerb planters E | (4.9, −25.5), (4.9, −21), (4.9, −34), (4.9, −42.5) | x 4.6…5.2, 2 m long each | 0–1.5 | | | footpath cover; 1.5 m so BossNav sees them (it samples 1.45 m) and keeps its shell out from under the verandas; kids pass the gaps |
| kerb planters W | (−4.9, −27.5), (−4.9, −23), (−4.9, −18.6) | x −5.2…−4.6, 2 m long each | 0–1.5 | | | the same under the hotel gallery |

The carriageway is x −4.5 … 4.5, with flush tram tracks at x ±2.25 (props and decals). The footpaths are x ±4.5 … ±7.
The revision-1 tram-stop island and shelter (x 1…3.6) are gone: the superstop is the tram stop. Veranda posts
(0.2 × 0.2 m) stand on the kerb line at x ±4.7, every 2.5 m.

**The west side (Alpha's right): the GPO, the Royal Arcade, the Young & Jackfish, Hotel Lane, Prow Place, Hoki Lane**

| Piece | Centre (x, z) | Shape / size | y | Flags | Era / group | Purpose |
|---|---|---|---|---|---|---|
| GPO terrace | (−10.15, −33) | x −13.3…−7, z −40…−26 | 0–1.2 | | | the Post Office terrace: the Bazookarp weir. 1.2 m: its north face (Hotel Lane) and its east face north of the steps are hop-ups |
| GPO steps | (−5.65, −36) | R (−4.3, 0, −36) → (−7, 1.2, −36), w 8 | 0>1.2 (24.0°) | | | grand steps from Swimston (z −40…−32) |
| GPO piers N / S | (−11.9, −27.9) / (−11.9, −38.1) | 1 × 1 | 1.2–3.2 | roof | | terrace cover (cast pier + lamp), 5.4 m from the weir |
| GPO stair | (−8.5, −27.5) | R (−10, 1.2, −27.5) → (−7, 2.4, −27.5), w 3 | 1.2>2.4 (21.8°) | | | from the terrace up to the hotel gallery: the balcony's second way up |
| corner shop | (−10.15, −42) | x −13.3…−7, z −44…−40 | 0–7 | roof | | shop on the Customs Lane corner |
| arcade E wall | (−13.65, −36) | x −14…−13.3, z −46…−26 | 0–7 | roof | | the arcade's east wall = the GPO's west facade |
| arcade W wall | (−18.8, −36) | x −19.1…−18.5, z −46…−26 | 0–7 | roof | | the arcade's west wall (Hoki Lane's murals on its back) |
| arcade floor | (−16.25, −32.3) | x −18.5…−14, z −46…−18.6 | 0–0.6 | | | the Royal Arcade's mosaic floor, continuing across Hotel Lane and through the hotel arch (+0.6) |
| arcade glass roof | (−16.25, −36) | x −18.5…−14, z −46…−26 | 6–6.3 | roof, paint:false | | glass vault (off-limits) |
| arcade sites 1 / 2 / 3 | (−16.25, −42.67 / −36 / −29.33) | x −18.5…−14; z −46…−39.33 / −39.33…−32.67 / −32.67…−26 | 0.6–3.4 | roof, paint:false | 1 `arcade-1` / `-2` / `-3` | 1880s: the arcade under construction, hoarded at both mouths and filled with scaffold and bricks |
| arcade kiosk | (−16.25, −43) | 1.2 × 1.6 @ 0° | 0.6–1.8 | | 23 `arcade-1` | era 2+: a flower-and-paper kiosk inside the old hoarding's footprint (rule 19) |
| arcade flower stall | (−16.25, −36) | 1.2 × 2 @ 0° | 0.6–1.8 | | 23 `arcade-2` | era 2+: cover inside the arcade |
| arcade bench island | (−16.25, −29.5) | 1.2 × 2.4 @ 0° | 0.6–1.6 | | 23 `arcade-3` | era 2+: cover inside the arcade |
| hotel H1 | (−10.5, −20.55) | x −14…−7, z −22.5…−18.6 | 0–9 | roof | | the Young & Jackfish: its NW corner is the prow (a chamfered look; corner turret to 13 m) |
| hotel arch block | (−16.55, −20.55) | x −19.1…−14, z −22.5…−18.6 | 3.8–9 | roof, paint:false | | the hotel's west wing, carried over the arcade's line on an arch (soffit 3.8) |
| hotel arch pier | (−18.8, −20.55) | x −19.1…−18.5, z −22.5…−18.6 | 0–3.8 | roof | | the arch's west pier |
| balcony N | (−9.5, −17.1) | x −14…−5, z −18.6…−15.6 | 2.1–2.4 | | | Alpha's raised corner over mid (7 o'clock) |
| balcony gallery | (−6, −23.8) | x −7…−5, z −29…−18.6 | 2.1–2.4 | | | iron-lace gallery over Swimston's west footpath, down to the GPO stair |
| balcony landing | (−12.5, −14.1) | x −14…−11, z −15.6…−12.6 | 2.1–2.4 | | | the front stair's top |
| balcony front stair | (−8, −14.1) | R (−5, 0, −14.1) → (−11, 2.4, −14.1), w 3 | 0>2.4 (21.8°) | | | the balcony's first way up, from the circus at 6:30 |
| kerb planters balcony W / E | (−12.4, −16.1) / (−8, −16.1) | 2 × 0.6 | 0–1.5 | | | under the balcony's edge: cover, and BossNav sees them |
| fountain | (−22.8, −23.8) | x −23.6…−22, z −24.6…−23 | 0–1.2 | | | Prow Place drinking fountain |
| Hoki crates 1 / Hoki crates E | (−22.4, −30.5) / (−19.8, −29.2) | 1 × 2.4 / x −20.4…−19.2, z −30…−28.4 | 0–1 | | | Hoki Lane cover, alternating sides |
| Hoki bins / Hoki bins E | (−22.6, −37) / (−19.7, −36.4) | 1.2 × 1.2 | 0–1.2 | | | Hoki Lane cover |
| Hoki planter | (−20.85, −43) | x −21.6…−20.1, z −43.75…−42.25 | 0–1 | | | lane tree in a planter |

Notes:
- **Hotel Lane** is the 3.5 m street between the GPO terrace (z −26) and the hotel (z −22.5). It runs from Swimston's
  west footpath (under the gallery) west across the arcade's north end (a 0.6 m step up and down) into Prow Place.
- **The hotel arch** is the arcade's continuation under the hotel's west wing, x −18.5 … −14, z −22.5 … −18.6, floor
  0.6, soffit 3.8 (3.2 m headroom). It is open in every era: from Hotel Lane and Prow Place it leads straight north onto
  the circus at 7:30. From era 2 the whole arcade feeds it.
- **Prow Place** is the square west of the hotel, x −24 … −19.1, z −26.6 … −18.6: Hoki Lane's north end, Hotel Lane's
  west end and the arm's south walk meet there. It opens north across its full 4.9 m width onto Flathead's carriageway
  (8 o'clock), and the arch beside it gives a second, separate exit to 7:30. The revision-1 low wing and the 3 m gap are
  gone.
- **Hoki Lane** runs from the forecourt terrace (z −50, a 1.0 m hop down) north to Prow Place, between the arcade's
  west wall (x −19.1) and the viaduct: 6.5 m wide at Customs Lane, 4.9 m at its north end (the viaduct tapers).

**The viaduct, the railyard and the Signal Garden (era 3)**

| Piece | Centre (x, z) | Shape / size | y | Flags | Era / group | Purpose |
|---|---|---|---|---|---|---|
| viaduct piers | (−24.3, −27.3), (−24.3, −33), (−25.44, −42.5), (−25.92, −46.5) | 0.8 × 0.8 | 0–4.4 | roof, paint:false | | where viaduct segments meet |
| viaduct walls (parapet) | centred 0.3 m outside the viaduct line (Q4–Q5–Q6): z −27.7…−29.5, −33.4…−36, −39…−42.1, −46.9…−58 | 0.6 thick | 0–4.1 | roof, paint:false | | the railyard wall over Hoki Lane: Hoki Lane's street-art wall (murals on the arcade side; posters and bills here) |
| viaduct wall along the west yard | x −27.6…−27, z −68…−58 | 0.6 thick | 0–4.1 | roof, paint:false | | the railyard wall behind the west yard (3.1 m above the yard terrace) |
| viaduct drop gaps | z −29.5…−32.5 and −36…−39 | 0.6 thick | 0–3.1 | roof, paint:false | | where the parapet stops: from the garden you can drop 3.18 m into Hoki Lane |
| viaduct wall at the Hoki stair | (−25.68, −44.5) | 0.6 × 3.2 @ 186.8° | 0–4.1 | roof, paint:false | 12 `garden-t3` | the arch the garden stair breaks through in era 3 |
| railyard walls (parapet) | along off −14.6…−14: along −50…−48, −45…−44.5, −41.5…−38.5, −35.5…−34 | 0.6 thick | 0–4.1 | roof, paint:false | | the railyard wall over the arm's south walk |
| railyard drop gaps | along −48…−45 and −38.5…−35.5 | 0.6 thick | 0–3.1 | roof, paint:false | | drop points from the garden onto the arm |
| railyard wall at the arm stair | along −44.5…−41.5 | 0.6 thick | 0–4.1 | roof, paint:false | 12 `garden-sa` | opens in era 3 for the arm stair |
| railyard walls on the wharf | along −62…−59.6 and −56.4…−50 | 0.6 thick | 0.6–4.1 | roof, paint:false | | the wall along the West Wharf |
| railyard wall at the wharf stair | along −59.6…−56.4 | 0.6 thick | 0.6–4.1 | roof, paint:false | 12 `garden-sc` | opens in era 3 for the wharf stair |
| railyard embankment | the SW railyard corner to the bounds | boxes / oboxes | 0–3.1 | roof, paint:false, **hidden** | | collision only (point 3 above) |
| garden caps t1 … t7 | the garden outline (below), split into the 8 m cells listed | ground-helper blocks | 3.1–3.18 | | 3 `garden-t1` … `garden-t7` | the Signal Garden's floor; each cap lies on the embankment's roof top, 0.08 above it (rule 19b) |
| garden parapets 1 … 6 | along the garden's outer edges (below) | 0.4 thick | 3.1–4.0 | roof, paint:false | | stop anyone walking off the garden onto the railyard roof (all eras; unreachable in eras 1–2) |
| garden stair Hoki | (−28.98, −44.5) | R (−25.38, 0, −44.5) → (−32.58, 3.18, −44.5), w 3 | 0>3.18 (23.8°) | | 3 `garden-t3` | from Hoki Lane up into the garden, through the viaduct |
| garden stair arm | (−31.53, −34.12) | R (−33.05, 0, −30.86) → (−30.01, 3.18, −37.39), w 3 | 0>3.18 (23.8°) | | 3 `garden-sa` | from the arm's south walk up into the garden |
| garden stair wharf | (−45.4, −39.87) | R (−46.65, 0.6, −37.2) → (−44.16, 3.18, −42.55), w 3 | 0.6>3.18 (23.6°) | | 3 `garden-sc` | from the West Wharf up into the garden |
| signal pavilion | (−37.75, −39.55) | x −40…−35.5, z −41.8…−37.3 | 3.18–8.38 | roof | 3 `garden-t4` | the garden's landmark: a glass shard pavilion built round the old signal box |
| garden planters 1 … 5 | (−27.5, −32.3), (−28, −48.8), (−44, −38.8), (−33.6, −35.8), (−44.8, −46.2) | 1.2 × 2.4 | 3.18–4.38 | | 3 `garden-t1`, `-t3`, `-t6`, `-t4`, `-t7` | garden cover at 6–10 m spacing |
| garden lawn mound | (−34.05, −48.1) | x −35.5…−32.6, z −49.6…−46.6 | 3.18–3.78 | | 3 `garden-t5` | a raised lawn (walkable, varied height) |

**The Signal Garden's outline** (Alpha's; G1 … G10): G1 (−24.6, −27.58) · G2 (−24.6, −33.0) · G3 (−26.64, −50.0) ·
G4 (−40.0, −50.0) · G5 (−44.96, −49.1) · G6 (−48.5, −41.6) · G7 (−48.5, −38.73) · G8 (−38.0, −33.83) · G9 (−32.5,
−34.0) · G10 (−32.5, −31.26). G1–G3 runs along the viaduct, G7–G8 and G10–G1 along the arm's railyard wall. Area 359 m²
(about 330 m² of floor after the pavilion and cover). The parapets run G3–G4–G5–G6–G7 and G8–G9–G10 (the notch at G8–G10
keeps a strip of railyard roof between the garden and the wall there). The tile cells (each block of the floor lies in
one): t1 x −32.5…−24.6, z −34…−27.58; t2 x −32.5…−24.6, z −42…−34; t3 x −32.5…−25.6, z −50…−42; t4 x −40.5…−32.5,
z −42…−34; t5 x −40.5…−32.5, z −50…−42; t6 x −48.5…−40.5, z −42…−35; t7 x −48…−40.5, z −50…−42.

**Alpha's arm: Flathead Street WSW and the West Wharf** (along −62 … −17)

| Piece | Centre (x, z) | Shape / size | y | Flags | Era / group | Purpose |
|---|---|---|---|---|---|---|
| customs house | (−31.97, −23.73) | 4 × 14 @ 65° (along −46…−32, off −10…−6) | 0–8 | roof | | the Customs House: the arm's south frontage |
| warehouse W1 | (−38.73, −9.23) | 4 × 14 @ 65° (along −46…−32, off 6…10) | 0–7 | roof | | riverside bond warehouse |
| warehouse W2 | (−25.59, −3.1) | 4 × 7 @ 65° (along −28…−21, off 6…10) | 0–7 | roof | | riverside warehouse; its end faces the circus |
| tram island arm / shelter | (−28.1, −13.1) | 2.4 × 6 / 1 × 4 @ 65° | 0–0.3 / 0.3–2.6 | — / roof | | Flathead tram stop |
| tram island arm 2 / arm planter 2 | (−39.42, −18.38) | 2.4 × 5 / 1.2 × 3 @ 65° | 0–0.3 / 0.3–1.5 | | | a second kerb island with a planter |
| arm cover N / N2 / S / S2 | (−35.42, −12.54) / (−25.09, −7.73) / (−19.61, −13.56) / (−31.84, −19.26) | 1.2 × 2.2 @ 65° | 0–1.2 | | | carriageway kerb cover (era kit) |
| north walk benches 1 / 2, north walk bollards | (−44.95, −7.72), (−37.7, −4.34), (−27.73, 0.31) | 0.8–1.2 × 2 @ 65° | 0–1 | | | the riverside promenade's cover |
| south walk crates / bins | (−35.26, −29.68), (−28.82, −26.68) | 1.2 × 2 / 1.2 × 1.2 @ 65° | 0–1.2 | | | cover along the railyard wall |
| wharf approach crates N / S | (−45.19, −16.66), (−40.12, −27.54) | 1.2 × 2.4 @ 65° | 0–1.2 | | | cover where the carriageway meets the wharf |
| west wharf | (−50.75, −23.67) | 28 × 12 @ 65° (along −62…−50) | 0–0.6 | | | the West Wharf's timber deck (+0.6) |
| loading platform | (−53.5, −26.05) | 14 × 5 @ 65° (along −62…−57, off −8…6) | 0.6–1.6 | | | a raised dock at the wharf's end: a long view back up the arm |
| goods shed | (−43.96, −32.91) | 4.5 × 4.5 @ 65° | 0.6–4 | roof | | |
| crane base / cargo / barrels / crates / winch | (−51.48, −17.38), (−53.36, −12.75), (−47.88, −25.09), (−57.03, −16.11), (−53.5, −26.05) | 1.4–2.5 m | 0.6–2.6 | | | wharf cover |
| wharf end rail | along −62.15…−62, off −14…14 | 0.15 | 0.6–1.6 | rail, paint:false | | the wharf's end over the river |
| arm river rail W | along −62…−39.23, off 14…14.15 | 0.15 | 0–1 (0.6–1.6 on the wharf, along −62…−50) | rail, paint:false | | the river railing |
| arm river rail E | along −31.14…−21.22, off 14…14.15 | 0.15 | 0–1 | rail, paint:false | | the river railing |
| arm river rail boardwalk | along −21.22…−17.39, off 14…14.15 | 0.15 | 0–1 | rail, paint:false | 1 `bw-4` | era 1: railing where Bravo's boardwalk lands (in eras 2–3 that boardwalk opens here). Its centre is at z > 0, so the engine groups it with Bravo's `bw-4` |

The gap along −39.23 … −31.14 (8.1 m) is where Bravo's Iron Bridge lands; the mirror of Alpha's `bridge works barrier`
(below) fills it in era 1. The arm's cross-section: carriageway |off| ≤ 6 with the tram track on its axis; frontages at
off ±6 … ±10; the north walk (off 10 … 14) is the riverside promenade, the south walk (off −14 … −10) runs under the
railyard wall. Gaps between buildings: along −32 … −28 on the north side (Wharf Lane, to the promenade) and the open
stretch along −50 … −46 on both sides (the wharf approach).

**The east side (Alpha's left): Degrayling Lane, Centre Plaice, the Boathouse, the quay**

| Piece | Centre (x, z) | Shape / size | y | Flags | Era / group | Purpose |
|---|---|---|---|---|---|---|
| shops E1 / E2 | (8.75, −23) / (8.75, −37.5) | x 7…10.5; z −27…−19 / −44…−31 | 0–7 | roof | | Swimston's east shops; Little Lane (z −31…−27) between them |
| Degrayling S | (13.5, −41) | x 10.5…16.5, z −44…−38 | 0–0.6 | | | Degrayling Lane's raised pavement south of the Plaice |
| Degrayling N | (13.5, −19.3) | x 10.5…16.5, z −24…−14.6 | 0–0.6 | | | Degrayling Lane's raised pavement north of the Plaice |
| degrayling crates 1 / 2 | (13.5, −21.65) / (13.5, −16.95) | x 10.5…16.5; z −24…−19.3 / −19.3…−14.6 | 0.6–3.4 | roof, paint:false, notIn:tower | 1 `crates-1` / `crates-2` | 1880s: the produce lane, stacked with crates, barrows and a hay cart: Degrayling Lane north is shut |
| degrayling cafe N1 / N2 | (13.5, −21.4) / (13.5, −16.9) | 1.2 × 1.2 | 0.6–1.6 | notIn:tower | 23 `crates-1` / `crates-2` | era 2+: café tables in the middle of the lane, inside the old crates' footprint |
| degrayling cafe S | (13.6, −41.4) | 1.2 × 1.2 | 0.6–1.6 | notIn:tower | | café tables in the lane south of the Plaice |
| bond store | (18, −41) | x 16.5…19.5, z −44…−38 | 0–7 | roof | | bluestone bond store |
| Centre Plaice | — | x 10.5…the quay, z −38…−24 | 0 | | | the side zone's square (floor) |
| plaice cart / cafe tables / planter / bench | (16.4, −33), (13.6, −34.4), (13.2, −37.1), (17.2, −36) | 1.2 × 2.2 / 1.2 × 1.2 / 2.4 × 1 / 0.6 × 2 | 0–1.5 / 0–1 / 0–1 / 0–0.9 | | | side-zone cover |
| boathouse | (19, −18) | x 16.5…21.5, z −24…−12 | 0–2.4 | | | the Boathouse; its roof deck (2.4) is Alpha's left raised corner; its east wall is the river wall |
| boathouse Plaice stair | (19.5, −27) | R (19.5, 0, −30) → (19.5, 2.4, −24), w 3 | 0>2.4 (21.8°) | | | the deck's way up from the Plaice |
| boathouse ring stair | (19, −9) | R (19, 0, −6) → (19, 2.4, −12), w 3 | 0>2.4 (21.8°) | | | the deck's way up from the circus at 4 o'clock |
| boathouse deck rail | (21.43, −18) | x 21.35…21.5, z −24…−12 | 2.4–3.4 | rail, paint:false | | the deck's river edge |
| boathouse deck racks / planter | (18.2, −22.2) / (19, −15.4) | 2.4 × 0.8 / 1.2 × 1.6 | 2.4–3.4 | | | deck cover (rowing eights / tables / glass planters per era) |
| quay bench, walk bollards 1 | (21, −41) / (22.9, −46.2) | 1 × 2 / 1 × 1.6 | 0–1 | — / notIn:tower | | cover on the quay |
| river rail base | x 27.08, z −66…−54 | 0.15 | 1–2 | rail, paint:false | | on the forecourt terrace |
| river rail terrace + quay | from (27.08, −54) along the quay to (26.16, −50) at 1–2, then (26.16, −50) → (21.58, −30.1) at 0–1 | 0.15 | | rail, paint:false | | the Yabby quay's railing (the terrace's east edge follows the quay: build it from the outline) |
| river rail Plaice | x 21.5…21.65, z −30…−24 | 0.15 | 0–1 | rail, paint:false | 1 `bw-1` | era 1: the Plaice's river edge (the boardwalk joins here from era 2) |
| river rail apex | x 21.5…21.65, z −12…−10.2 and −10.2…−5.62 | 0.15 | 0–1 | rail, paint:false | 1 `bw-3` / `bw-4` | era 1: the river edge north of the Boathouse |

Notes:
- **Little Lane** is the 4 m gap between the two shop blocks (z −31 … −27). It links Swimston to Centre Plaice.
- **Centre Plaice** is the riverside square, x 10.5 … the quay (23.3 at its south edge, 21.5 at its north), z −38 … −24.
  The side zone sits in its west part (§4.2). Degrayling Lane enters it from the south (a 0.6 m step down) and leaves it
  north (a 0.6 m step up); the quay enters at its south-east; Little Lane at its west; the Boathouse's stair rises from
  its north-east corner; from era 2 the boardwalk opens off its river edge.
- **The Yabby quay** is the riverside walk from the forecourt terrace down to Customs Lane and north past the bond store
  into the Plaice: x 19.5 … the quay line, 5.2 m wide at Customs Lane, 3.8 m at the Plaice.

**The river works: the boardwalk (eras 2–3), the Iron Bridge (eras 2–3) and the Tide Steps (era 3)**

| Piece | Centre (x, z) | Shape / size | y | Flags | Era / group | Purpose |
|---|---|---|---|---|---|---|
| boardwalk 1 … 4 | x 21.5…25; z −30…−23.4 / −23.4…−16.8 / −16.8…−10.2 / −10.2…−3.49 | 3.5 × 6.6–6.7 | −0.6…−0.08 | | 23 `bw-1` … `bw-4` | the riverside boardwalk: the Plaice's river edge to Bravo's arm; piece 4's north end tucks 8 cm under Bravo's arm walk |
| boardwalk rail 1a | x 25…25.15, z −30…−24.6 | 0.15 | −0.08…0.92 | rail, paint:false | **2** `tide` | era 2 only: where the Tide Steps join in era 3 |
| boardwalk rails 3b / 4b | x 25…25.15; z −15.4…−10.2 / −10.2…−3.72 | 0.15 | −0.08…0.92 | rail, paint:false | 23 `bw-3` / `bw-4` | the boardwalk's river rail (gap z −24.6…−15.4 where the bridge leaves) |
| boardwalk planters 1 / 3 | (24.2, −28) / (24.2, −13.6) | 1.2 × 1.6 | −0.08…1 | | 23 `bw-1` / `bw-3` | boardwalk cover |
| iron bridge 1 … 7 | centreline from BA (25, −20) on bearing 30°; spans between m = −4, 1.96, 7.92, 13.88, 19.84, 23.09, 26.35, 29.0 along it | 4.5 wide | −0.6…−0.16 | | 23 `bridge-1` … `bridge-7` | the Iron Bridge: starts tucked 8 cm under the boardwalk, ends with both corners 16 cm under Bravo's arm walk (no deck top shares a height with what it meets) |
| bridge rails | both sides at ±2.32 m off the centreline, per span, each stopping where it reaches Bravo's arm edge | 0.15 | −0.16…0.84 | rail, paint:false | 23, the span's group | |
| bridge lamps 1 / 2 | (27.59, −18.31) / (31.13, −6.59) | 1 × 1.4 @ 30° | −0.16…1.2 | | 23 `bridge-2` / `bridge-4` | lamp-standard plinths (cover) |
| bridge works barrier | along 31.14…39.23 on Bravo's arm edge (off −14.15…−14) | 0.15 | 0–1 | rail, paint:false | 1 `landing` | 1880s: the BRIDGE WORKS barrier where Alpha's bridge will land on Bravo's arm; its own group (8.1 m long) |
| tide steps | x 25.15…28.15, z −30…−24.6 | 3 × 5.4 | −0.6…−0.08 | | 3 `tide` | era 3: a river terrace beside the boardwalk |
| tide rails S / E / N | its three water edges | 0.15 | −0.08…0.92 | rail, paint:false | 3 `tide` | |
| tide obelisk | (26.8, −27.8) | 1.2 × 1.2 | −0.08…2.4 | roof | 3 `tide` | "FLOOD LEVEL 3026 ▲": the clue, and cover |

Span centres (all members of a span sit on one side of z = 0: ENGINE rule 4): spans 1–5 (z −20.88 … −1.41, rails
−22.04 … −0.59) on Alpha's side; spans 6–7 (z 1.41 and 3.97, rails 0.25 and 2.78) on Bravo's side; the landing barrier
at z 2.11. The bridge's two side lines cross Bravo's arm edge at along 31.14 and 39.23, which is exactly the barrier and
exactly the arm rail's gap: no water edge on the landing is left unrailed. On the boardwalk side the side lines cross
x = 25 at z −24.5 and −15.5, which is the boardwalk rail's gap.

**Customs Lane and the base: the Cable Tram Engine House and its forecourt terrace**

| Piece | Centre (x, z) | Shape / size | y | Flags | Era / group | Purpose |
|---|---|---|---|---|---|---|
| customs lane wagon | (−10.75, −47.8) | x −12.5…−9, z −49.6…−46 | 0–2.8 | roof, paint:false | 1 `crossing` | 1880s: a goods wagon on the GPO siding with the crossing gates shut: era-1 cover (it closes no route) |
| customs lane bike dock | (−10.75, −47.8) | x −11.8…−9.7, z −48.4…−47.2 | 0–1 | | 23 `crossing` | era 2+: a bike-share dock inside the wagon's footprint |
| customs lane bench NW | (−10.8, −45) | x −12…−9.6, z −45.4…−44.6 | 0–1 | | | against the corner shop |
| customs lane crates W | (−22.2, −48.1) | x −23.4…−21, z −48.6…−47.6 | 0–1 | | | Customs Lane's west end |
| customs lane bench N1 / planter N2 / planter E / bollards E | (−2.8, −45), (12.2, −44.9), (6.8, −48.1), (16, −48) | 2.4 × 0.8–1 | 0–1 | notIn:tower | | Customs Lane cover where the tower runs in Tower Command |
| forecourt terrace W / C / E / E2 | x −27…−5 / −5…5 / 5…27 / 5…26; z −66…−50 / −66…−52.4 / −66…−54 / −54…−50 | | 0–1.0 | | | the terminus forecourt terrace (+1.0): the base stands a hop above Customs Lane. Its east edge follows the quay (build from the outline) |
| forecourt steps | (0, −51.2) | R (0, 0, −50) → (0, 1, −52.4), w 10 | 0>1 (22.6°) | | | full-width steps from Swimston |
| yard floors W / E | x −27…−12 / 12…27, z −73…−66 | | 0–1.0 | | | the yards beside the deck |
| spawn deck | (0, −71) | x −12…12, z −76…−66 | 0–3.3 | | | the Engine House gallery: pad (0, 3.3, −72); 2.3 m above the terrace |
| front stairs W / E | (∓8.5, −63.25) | R (∓8.5, 1, −60.5) → (∓8.5, 3.3, −66), w 5 | 1>3.3 (22.7°) | | | grand stairs |
| side ramps W / E | (∓15, −71) | R (∓18, 1, −71) → (∓12, 3.3, −71), w 4 | 1>3.3 (21.0°) | | | ramps to the yards |
| engine house | (0, −79) | x −14…14, z −82…−76 | 0–9 | roof | | the Cable Tram Engine House (chimney 24 m) |
| tram shed / boiler house | (±18, −77.5) | x 14…22 / −22…−14, z −82…−73 | 0–6 | roof | | fill the yards' back corners |
| grip car | (−23.7, −61) | x −25…−22.4, z −65…−57 | 1–4 | roof | | parked grip car and trailer (era kit) |
| stable | (25.5, −69.25) | x 24…27, z −72…−66.5 | 1–5 | roof | | the tramway stables (moved to x 24 so the east side ramp's foot opens onto 6 m of yard) |
| coal bin | (−19, −65.2) | x −20…−18, z −66…−64.4 | 1–2.4 | | | west-yard cover |
| turntable benches W / E | (∓5.5, −59) | 1.2 × 2 | 1–2.25 | | | 1.25 m: the Gate's apron cover (SPEC checker #13 needs ≥ 1.2) |
| buffers W / E | (∓4, −64) | 1.2 × 1.2 | 1–2.25 | | | tram buffer stops, 1.25 m |
| apron bank NW / NE | (−11.25, −52.3) / (9.55, −51.5) | x −16…−6.5, z −53…−51.6 / x 6.5…12.6, z −52.2…−50.8 | 1–2.4 | roof | | bluestone planter banks on the terrace's north edge: they shape the Gate's approaches (§4.4) |
| apron banks W / E | (∓10.1, −60) | x ∓(9.4…10.8), z −63…−57 | 1–2.4 | roof | | planter banks either side of the turntable |
| forecourt bench W2 | (−8, −55.6) | x −9.2…−6.8, z −56…−55.2 | 1–2 | | | terrace cover |
| forecourt planter C / kiosk E | (7.2, −54.2) / (19.7, −54.1) | 2.4 × 1.2 / 1.4 × 1.4 | 1–2 / 1–3.2 | — / roof; both notIn:tower | | terrace cover off the tower's turntable approach |
| ticket booth | (−20.7, −55) | x −21.5…−19.9, z −55.8…−54.2 | 1–3.2 | roof | | the tramway's ticket and telephone booth: its TELEPHONE end rings with Tartar |
| trough / forecourt bollards SE | (17.6, −58) / (25, −58) | 2.4 × 0.8 / 1.2 × 1.2 | 1–1.9 / 1–2 | | | east-yard cover |

Notes:
- **Spawn pad** (0, 3.3, −72), `spawnBarrier` 4.2. The deck is x −12 … 12, z −76 … −66: 6 m in front of the pad, 4 m
  behind, 12 m to each side, 2.3 m above the terrace (revision 1's 3.4 m drop sat on nav's 3.4 m limit).
- Exits: two grand stairs at x ±8.5 (5 m wide); two side ramps at z −71 to x ±18; the deck's front edge between the
  stairs, a one-way 2.3 m drop onto the terrace. The front edge has an iron railing (`rail`, 1.0 m) with gaps at the
  stair heads and over the turntable.
- **The forecourt terrace** (z −66 … −50) is the re-forming apron, a hop (1.0 m) above Customs Lane (z −50 … −44), with
  full-width steps where Swimston arrives. **The turntable** (r 4.5, flush with the terrace) at (0, 1.0, −59) is the
  Bazookarp Gate; the tower goal is at (0, 1.0, −60.5).
- **Customs Lane** (z −50 … −44) runs from Hoki Lane's mouth to the quay. The arcade's walls step 2 m into it
  (z −46 … −44), a canopied porch at its south mouth.

### 2.7 Spawn to mid

- Straight from the pad to the centre: **72 m**.
- On foot: **71.5 m** of nav in every era (deck edge drop → terrace → steps → Swimston → the south Clock Steps → the
  centre), about **6.06 s** swimming at 11.8 m/s. This is inside ENGINE rule 33 (5.4–6.6 s) and the Long Stages
  standard (about 6 s). Measure with `spawn-mid.js ERA=1/2/3`.
- Nothing changes within 12 m of a pad or on the first 15 m of any way out (ENGINE rule 14). The nearest era piece is
  the Customs Lane wagon, 24 m from Alpha's pad; the Signal Garden's south edge is 34.5 m from it and 22 m from the
  deck's nearest corner.

### 2.8 Lanes and flanks (Alpha's; Bravo's mirror)

**Routes to mid.** Each route is measured along its own corridor (the plan model blocks the other corridors), from
Alpha's pad to the point where it enters the circus; "—" means the corridor is shut in that era.

| Route | Enters the circus at | Era 1 | Era 2 | Era 3 | What it is |
|---|---|---|---|---|---|
| **Centre: Swimston Street** (14 m, trams, the superstop) | the south Clock Steps, 6 o'clock | 59 | 59 | 59 | the tram boulevard: the trams, the superstop (a glass stair from era 3), the GPO steps on the right, verandas on the left |
| **Balcony walk** (raised) | the balcony's landing over the circus, 6:30–7 | 64 | 64 | 64 | up the GPO steps and the GPO stair onto the hotel gallery, along it to the balcony (then down the front stair: 71) |
| **Inner right: Hotel Lane → the hotel arch** (from era 2 also the Royal Arcade) | the arch's mouth, 7:30 | 61 | 61 | 61 | west footpath, Hotel Lane, then north through the arch under the hotel; from era 2 the arcade runs straight from Customs Lane into it, covered |
| **Outer right: Hoki Lane → Prow Place → Alpha's arm** | the arm's mouth, 8 o'clock | 72 | 72 | 72 | the street-art lane under the viaduct, into the home arm |
| **Inner left: Degrayling Lane north** | Degrayling's mouth, 5 o'clock | — | 62 | 62 | the café lane. In the 1880s its north end is stacked with crates |
| **Outer left: the quay → the Plaice → the Boathouse deck** (era 1), **or the boardwalk** (eras 2–3) | the SE corner, 4 o'clock, and on into Bravo's arm | 72 (over the deck) | 72 | 72 | the river side. In era 1 the only way north from the Plaice besides Little Lane is up over the Boathouse's roof deck |
| **Away flank: the Iron Bridge** (eras 2–3) | Bravo's arm at along 40, bypassing mid | — | 94 | 94 | from the boardwalk across the river corner to the enemy's arm and wharf |

**What jump 1 changes, measured between the places it joins** (metres on foot, plan model):

| From → to | Era 1 | Era 2 | Shorter by |
|---|---|---|---|
| Centre Plaice (15, −31) → the circus at 5 o'clock | 21.0 (over the Boathouse deck, or Little Lane and Swimston) | 16.0 (Degrayling Lane north) | **24 %** (left side) |
| the arcade's south mouth (−16.25, −47) → the hotel arch's north mouth | 33.3 (Hoki Lane and Prow Place) | 29.2 (straight through the arcade) | **12 %** (right side) |
| Centre Plaice → Bravo's arm at along 40 (without crossing the circus) | no way | 47.7 (the boardwalk and the Iron Bridge) | a route that did not exist |
| Alpha's pad → Bravo's arm at along 40, any way | 98.9 (through the circus) | 94.3 (the bridge) | 5 % |

**What jump 2 changes:** Hoki Lane (−22, −44) → the home wharf: 46.9 → 41.0 (13 % shorter, over the Signal Garden); the
west yard (−22, −62) → the home arm's south walk at along −44: 46.5 → 38.8 (17 %); Swimston → the Halo: no way → 16.6 m
up the superstop's glass stair.

**Why the pad-to-mid lengths barely move, and what does change.** Swimston runs straight from each pad to the centre and
is open in every era, so every point at mid is 59–72 m from a pad by some route in every era; a closure can only make a
pad-to-mid route ≥ 15 % longer by blocking Swimston itself, which would break the spawn-to-mid budget (ENGINE rule 33)
and the Bazookarp's ±5 % rule. What the 1880s really take away is *routes*. Counting flanks to mid per team (the
balcony walk is high ground beside the centre, and the arcade feeds the same 7:30 entry as Hotel Lane, so neither counts
as a separate flank): **era 1 has the centre plus three flanks** (7:30 by Hotel Lane and the arch, 8 o'clock by Hoki
Lane and the arm, 4 o'clock over the Boathouse deck), **eras 2–3 have the centre plus four flanks** (Degrayling Lane north
to 5 o'clock opens, and 4 o'clock is reached at street level along the boardwalk) **plus the away flank** over the Iron
Bridge into Bravo's arm. That is within ENGINE rule 32 (2–4 flanks per team) in every era. Between the places they join,
the jump-1 shortcuts are 12–24 %, and the bridge turns "no way" into a route.

Cross links: Little Lane (Swimston ↔ Centre Plaice) and Hotel Lane (Swimston ↔ the arch ↔ Prow Place) in every era;
Customs Lane along the base. Era 2 adds the Royal Arcade, Degrayling north, the boardwalk and the Iron Bridge.

What it means in play:
- **Routes meet mid at distinct points**: 4, 5, 6, 6:30 (the balcony's front stair), 7:30 (the arch), 8 o'clock (the
  arm), plus the bridge into Bravo's arm. No two flanks share a doorway: Prow Place opens 4.9 m wide onto the arm, the
  arch is a separate 4.5 m passage to 7:30, and Degrayling and the boardwalk leave the Plaice on opposite sides of the
  Boathouse.
- **The X's arms are where flanks cross.** Alpha's arm (8 o'clock) is fed by Alpha's Hoki Lane (home) and, from era 2,
  by Bravo's Iron Bridge landing on it (away); from era 3 Alpha's own Signal Garden overlooks it and has a stair down
  onto it. Bravo's arm is the mirror. Holding the enemy's arm at a jump pays off.
- **Era 1 is the tight version** (one left flank, over the Boathouse; no arcade; no river crossing). **Era 2 is the open
  version** (every lane, the boardwalk and the bridges). **Era 3 is the vertical version** (the Halo over mid, glass
  stairs out of Swimston, the Signal Garden over each railyard, the Tide Steps).

### 2.9 Mid: Clockface Circus

- **The circus** is an open ring 10.5 m wide (r 9.5–20) round the concourse, at 0, in bluestone. Twelve bronze hour
  numerals are set in the floor at r 18 (mural 4): XII faces Bravo's spawn and VI faces Alpha's. Players can call
  "Alpha arm, eight o'clock". The circus is about 1,250 m² on two levels in eras 1–2, plus 260 m² of Halo in era 3.
- **The concourse** is an OCT with R 9.5 (apothem 8.78) and top 1.3, in pale sandstone. A clock-face mosaic is inlaid
  in it (mural 5). Ways up: the two **Clock Steps** (N and S, 7 m wide, 22°); two **ramps** (NE and SW, 5 m wide, 17°);
  four plain 1.3 m faces (E, W, NW, SE) that a kid hops up anywhere. Eight ways in; squids swim every face.
- **Cover on the concourse:** the 8 dome columns at r 8.2 (0.9 m square, at the octagon's corners, so every face's middle
  stays open) and 4 ticket barriers at r 5 on the diagonals. The middle (r < 4.7) stays clear for the Bazookarp shell
  (r ≤ 2.3) and the tower's start; the E and W lines stay clear for the tower (|z| ≤ 2.48 free against a 1.25 half-width).
- **Cover in the ring** (per half): 2 carts (140° r 13, 160° r 17.5), the ring bollards (10.4, −6), the arm mouth planter,
  the poster column at 247.5° (a light-pylon in era 3), 2 phone kiosks (100° r 18, 232° r 17), the superstop's north end
  (eras 1–2) and the balcony's front stair; the concourse's own 1.3 m faces; the buildings round the edge (the hotel, the
  Boathouse, the shop corners, the warehouse end). None of it is on the tower track.
- **High ground over mid:**
  - each team's balcony (2.4, 6:30–7:30 for Alpha, 15–19 m from the centre), two 3 m stairs;
  - each team's Boathouse deck (2.4, 4–5 o'clock, 20–25 m), two 3 m stairs;
  - in era 3, the shared Halo (5.4), reached by each team's superstop stair and light-pylon.
- **The dome:** the drum (OCT R 8.8, 8–10 m), the dome (OCT R 6.5, 10–15) and the lantern (3 × 3 m, 15–19), all `roof`
  and `paint:false` colliders under the looks; **the clock beams** (6.2 × 0.55 m, 4.3–6.0 m, `roof`) between the column
  pairs over each flight of steps, carrying five double-faced clocks; **Tartar** at (0, 5.4 … 7.8, 0) with no collider.
  The Bazookarp shell under him tops out at 4.9 m, the tower's cap at 5.02 m.
- **Why it plays:**
  - The concourse is a king-of-the-hill both teams reach from their own steps, but its ramps face the arms and its plain
    faces face the corners, so holding it means watching eight ways in.
  - The columns break it into lanes, so it is never a bare plate.
  - **Sightlines from the base (corrected):** the superstop (x −1.5 … 1.5, 3.2 m tall, z −26.6 … −14.6) blocks every
    line from the spawn deck to the concourse's centre, the zone and the Clock Steps, in every era (in era 3 the glass
    stair does). The lines that run past its sides along the tram tracks (an eye at x ±3 on the deck's front) still reach
    the concourse's two front corners, about 60 m away: charger range, but not the zone. From the concourse you see down
    each Swimston to the GPO steps (25–35 m).

### 2.10 Cover

- **The era-slot kit.** Every piece of cover has one collider in every era, and only its look changes (an era prop on a
  shared collider). A jump therefore never moves cover and never puts a collider in anyone's space. The only colliders
  that change are the era pieces in §3.

| Slot (collider, w × d × h) | 1880s | Today | 3000s |
|---|---|---|---|
| tram car 2.6 × 6 × 3.2, `roof` (2 per half on Swimston) | cable grip car and saloon trailer, green and cream | low-floor tram, white and graphite, thin yellow band | glass float-tram on a glowing magnetic plinth (the plinth fills the gap: no see-through) |
| grip car 2.6 × 8 × 3.0, `roof` (west yard) | grip car and trailer on the terminus loop | heritage tram (the tram museum) | float-tram on its dock |
| tram shelter 1 × 4 × 2.3 on a 0.3 island, `roof` (the arm; Swimston's west stop) | timber shelter | glass shelter | light canopy |
| ticket barrier 0.5 × 3 × 1.1 | timber barrier | steel ticket gates | solid light gate |
| cart 1.2 × 2.2 × 1.2–1.5 | barrow / hand-cart | coffee cart | hover planter |
| kiosk 1.4 × 2.0 × 2.2, `roof` | newsboy stand | news kiosk / espresso window | info pylon |
| bench / trough 2.4 × 0.8 × 0.9–1.0 | bluestone horse trough | bench and bike hoop | light bench |
| bollards 1.2–2 × 0.8 × 1.0 | mooring bollards and rope | bollards and bins | glowing bollards |
| crates 1.0 × 2.4 × 1.0 | tea chests / wool bales | bins and café crates | sealed cargo pods |
| planter 2.4 × 1.0 × 1.0–1.5 | flower barrow | planter box | glass planter with light |
| buffer stop 1.2 × 1.2 × 1.25 | timber buffers | steel buffers | light bollard |
| apron bank 1.4 high, `roof` | bluestone kerbed flowerbed | bluestone planter with a bench back | bluestone planter with a light rail |
| phone kiosk 1.2 × 1.2 × 2.4, `roof` | cast-iron **TELEPHONE** kiosk, **the same in every era** (Tartar's: the joke) | same | same |

- **Measured** (plan model, raster; "free-standing" leaves out every building, wall, tier and deck, which is what the
  advocate asked for; revision 1 only reported the first column):

| Era | within 5 m of cover, walls counted | within 5 m of free-standing cover | 2 m strips > 25 m with no free-standing cover |
|---|---|---|---|
| 1 | 93.6 % | 81.4 % | **0** |
| 2 | 93.7 % | 77.2 % | **0** |
| 3 | 93.8 % | 79.8 % | **0** |

  The strip test scans every 2 m-wide straight strip on every floor tier (0, 0.6, 1.0, 1.2) along four directions (N–S,
  E–W, along Flathead, across Flathead) and finds none longer than 25 m without a 0.9 m object standing in it, in the
  Turf War / Zone Control / Bazookarp build. Revision 1 had 49 m in Swimston's west track, Degrayling and the Yabby walk.
  In the Tower Command build the ten longest strips are all the tower's own lane (Swimston's west track, Customs Lane,
  Little Lane, the terrace's north strip): the tower stands in them. Halyard measures 94.2 % with `cover-map.js`; the
  dressing in §5 (lamp bases, bins, café screens, hydrants) must lift every era to at least that with `cover-map.js ERA=n`.
- **Longest bare lines per area** (the longest 2 m strip with no free-standing cover, every era): the circus ring
  24.5 m, the arm 23.5 m, the forecourt terrace 23 m, Swimston 22.5 m, Degrayling Lane 15.8 m, Customs Lane 15 m, the
  quay and the Plaice 10.8 m, Hoki Lane 10 m, the Signal Garden under 8 m. The long lines for chargers are the Iron Bridge
  (32 m), the arm seen from the West Wharf's loading platform, and the Halo.

### 2.11 Where each weapon class shines

- **Chargers, bows and splatlings:** the Iron Bridge and the boardwalk; the West Wharf's loading platform down the arm;
  from the concourse down Swimston to the GPO steps; the Signal Garden over Hoki Lane and the arm; in era 3, the Halo.
- **Shooters, dualies and twins:** everywhere; the circus ring, the Plaice, Prow Place.
- **Rollers, brushes, blades and mitts:** the lanes (Degrayling 6 m, Hoki 5–6.5 m, Little 4 m, Hotel 3.5 m), the Royal
  Arcade and the arch (4.5 m, covered, eras 2–3), the boardwalk (3.5 m).
- **Blasters, sloshers and buckets:** over the concourse's faces, onto the GPO terrace and the terrace's 1.0 m edge,
  round the trams, the superstop and the columns, and from the balconies and the Boathouse deck.
- **Brollies:** the arcade, the lanes and Customs Lane.

---

## 3. The gimmick: Tartar winds the clock

### 3.1 The rules in one paragraph

Twice a match, at a third and two thirds of regulation time on the clock, Commander Tartar rings. Ten seconds later a
ring of clock-light leaves the dome at (0, 0) at 25 m/s and rewrites the city as it passes. Each piece switches whole
(look, collision, ink and nav together) when the front reaches its centre:
- **Jump 1, the 1880s → today, opens.** Gates nobody can stand on (2.8 m crates and hoardings, `roof`, non-inkable)
  vanish: Degrayling Lane north and the Royal Arcade open, and the goods wagon in Customs Lane rolls away (a bike dock
  appears in its footprint). Over the river, where nobody can stand, the riverside boardwalk and the Iron Bridge appear,
  and the 1 m bridge-works barriers on the quay and the arms vanish.
- **Jump 2, today → the 3000s, only adds**, and only where nobody can be:
  - 5.0 m overhead (the Halo);
  - inside the footprint of the solid it replaces (the superstops become glass stairs; the poster column becomes a
    light-pylon; three railyard wall arches open for the garden's stairs);
  - on a railyard `roof` nobody stands on (the Signal Garden's floor, 8 cm above it: ENGINE rule 19b);
  - over water (the Tide Steps).

Ink on everything that exists in both eras stays; ink travels through time. Nothing a team relies on is taken away, no
objective or spawn is touched, and nobody is hurt, pushed or trapped.

### 3.2 The data (the contract's format, `ENGINE.md` §3.3, with this stage's real values)

```js
// src/world/stages/bluestone/layout.js (excerpt; the full piece list is §2.6)
eras: {
  names: ['1880s', 'TODAY', '3000s'],
  at: [1 / 3, 2 / 3],
  warn: 10, prebell: 20, speed: 25, guard: 0.5,
  modes: { boss: { fixed: 2 }, practice: { cycle: 60 }, attract: { cycle: 40 } },
  tartar: { type: 'bluestone_tartar', pos: [0, 5.4, 0], rotY: 0 },
  clocks: [{ type: 'bluestone_clockhands', pos: [0, 5.15, -7.88], rotY: 180, faces: 5 }],   // Alpha's row; mirrored
  phones: [[17.73, 1.2, -3.13], [-13.4, 1.2, -10.47], [-20.7, 2.1, -55.0]],               // Alpha's kiosks; mirrored
  pulses: [                                                       // overhead-wire routes for the warn's light pulses
    [[0, 9, 0], [0, 6.5, -20], [0, 6.5, -50], [0, 7, -64]],                        // Swimston's tram wire
    [[0, 9, 0], [-17, 6.5, -8], [-52, 6.5, -24]],                                   // Flathead's tram wire, to the wharf
    [[0, 9, 0], [13.5, 6, -14], [13.5, 6, -45]],                                    // Degrayling's telephone wire
    [[0, 9, 0], [21, 6, -8], [24, 6, -40], [26, 7, -56]],                           // the river lamps, quay to terrace
    [[0, 9, 0], [-16, 7, -20], [-21.5, 6, -26], [-22, 6, -48]],                     // the arch, Prow Place, Hoki Lane
  ],
  tint: { 1: [1.05, 0.99, 0.90, 0.20], 2: [1, 1, 1, 0], 3: [0.97, 1.0, 1.03, 0.08] },
  remap: [
    { base: SURF.granite, eras: [SURF.granite, PATTERN.asphalt, PATTERN.pavers] },     // the carriageways
    { base: PATTERN.planks, eras: [PATTERN.planks, PATTERN.planks, PATTERN.glasstile] }, // wharves, decks, balcony
  ],
  murals: { 4: '123', 5: '123', 6: '23', 7: '23', 8: '2', 9: '1', 10: '123', 11: '3' },  // mural id → eras (§5.4)
  colors: { appear: '#f4e9c8', vanish: '#a9a49a' },               // white-gold and warm grey: never a team ink hue
  look: {
    1: { theme: { all: { haze: [1 / 900, 0.9, 200], fog: [30, 520], horizon: '#e9dcc4' },
                  dusk: { zenith: '#3f3766', horizon: '#a996c2', sun: '#ffe6c8' } },             // violet twilight (§5.7)
         lamps: '#ffe0b8' },                                                                     // warm-white gas
    2: { lamps: '#ffd9a8' },
    3: { theme: { all: { horizon: '#e6eef6', zenith: '#4a86d0' } }, lamps: '#eef4ff' },
  },
  timelapse: { sunSwing: 60, cloudRate: 20 },                     // [rev 2] §3.4: the sun and clouds race from J to done
},
```

Era pieces carry `eras` and `eraGroup` exactly as listed in §2.6. Per half (Alpha's listing; r_g from the plan model):

| Jump | Group (`eraGroup`) | Pieces | r_g (m) | Flips at |
|---|---|---|---|---|
| 1 | `crates-2` / `crates-1` | the Degrayling crates, 2 blocks of 6 × 4.7 × 2.8 m (`'1'`, `notIn: 'tower'`); café tables inside (`'23'`) | 21.7 / 25.5 | J + 0.87 / 1.02 |
| 1 | `bw-4` … `bw-1` | the boardwalk, 4 pieces of 3.5 × 6.6 m over water (`'23'`) with rails and planters; the era-1 quay and arm rails where it joins (`'1'`) | 24.3 / 27.0 / 30.7 / 35.4 | J + 0.97 / 1.08 / 1.23 / 1.42 |
| 1 | `bw-4` (key `:b`) | the era-1 rail on Alpha's arm where Bravo's boardwalk lands | 23.9 | J + 0.96 |
| 1 | `bridge-1` … `bridge-7` | the Iron Bridge's spans, rails and lamps (`'23'`) | 31.7–39.1 | J + 1.27 … 1.56 |
| 1 | `landing` (key `:b`) | the bridge-works barrier on Bravo's arm (`'1'`) | 37.9 | J + 1.52 |
| 1 | `arcade-3` / `-2` / `-1` | the arcade's hoardings, 3 blocks of 4.5 × 6.7 × 2.8 m (`'1'`); a kiosk, a flower stall and a bench island inside (`'23'`) | 33.5 / 39.5 / 45.7 | J + 1.34 / 1.58 / 1.83 |
| 1 | `crossing` | the goods wagon (`'1'`) and the bike dock in its footprint (`'23'`) | 49.0 | J + 1.96 |
| 1 and 2 | `tide` | the boardwalk's rail 1a (`'2'`): appears with the boardwalk, goes when the Tide Steps arrive | 38.2 | J + 1.53 |
| 2 | `halo-1` … `halo-8` | the Halo's half-sides, corners, planters and balustrades (`'3'`) | 13.3–13.7 | J + 0.53–0.55 |
| 2 | `pylon-w` | poster column (`'12'`) → light-pylon (`'3'`), the same footprint | 16.5 | J + 0.66 |
| 2 | `stair-s2` / `stair-s1` | superstop B / A (`'12'`) → the Halo stair's upper / lower flight and side walls (`'3'`) | 17.6 / 23.6 | J + 0.70 / 0.94 |
| 2 | `tide` | the Tide Steps, their rails and the obelisk (`'3'`) | 38.2 | J + 1.53 |
| 2 | `garden-t1` … `garden-t7` | the Signal Garden's floor caps and the cover on them (`'3'`); `t3` also holds the Hoki stair and the viaduct arch it breaks through (`'12'`) | 42.0–63.8 | J + 1.68 … 2.55 |
| 2 | `garden-sa` / `garden-sc` | the arm and wharf stairs (`'3'`) and the wall arches they break through (`'12'`) | 46.5 / 60.4 | J + 1.86 / 2.42 |

Every group's union AABB is ≤ 8.0 m on its longest side (the largest: the garden cells at 8.0 × 8.0 and the bridge
spans at 7.1 × 7.6), and every member's centre sits on its group's side of z = 0 (the bridge's spans 6–7 and the landing
barrier are on Bravo's side: their key is `:b`). **Jump 1 changes 20 groups per half and jump 2 changes 20** (ENGINE
rule 6: ≤ 24). Blocks that change: about 47 per half in jump 1 and 76 per half in jump 2 (the Halo with its 24
balustrades is 40 of them), so 94 and 152 per jump (rule 6: ≤ 160).

**Turf** (walkable floor, the raster estimate; wall area changes by only a few percent between eras):

| Era | Floor | Change |
|---|---|---|
| 1 | 8,196 m² | — |
| 2 | 8,954 m² | +9.2 % (rule 11: ±10 %) |
| 3 | 10,025 m² | **+12.0 %** over era 2 (rule 12: ≤ 1.25×; the review's target +12–20 %) |

No inkable area vanishes in either jump (rule 13): every vanishing piece is `paint: false`.

### 3.3 The schedule in each mode

| Mode | Regulation | Jump 1 (1880s → today) | Jump 2 (today → 3000s) | Last era |
|---|---|---|---|---|
| Turf War 3:00 | 180 s | 60 s played (2:00 on the clock) | 120 s played (1:00) | the final minute is always the 3000s, opened with the final-minute music |
| Turf War 1:30 | 90 s | 30 s | 60 s | the last 30 s |
| Zone Control | 300 s | 100 s (3:20) | 200 s (1:40) | the 3000s, overtime included; the final 30 s centre-only lock is always in era 3 |
| Tower Command | 300 s | 100 s | 200 s | era 3 and overtime |
| Bazookarp (SPEC S0: 5:00 + overtime) | 300 s | 100 s | 200 s | era 3 and overtime |
| Boss Battle | — | none | none | **fixed: TODAY** (§4.5 says why) |
| Practice (online and offline) | — | every 60 s: 1 → 2 → 3, then the same warning and a rewind 3 → 1 | | cycles |
| Menu backdrop (attract) | — | every 40 s, as Practice | | cycles |

Players learn "the city jumps at 2:00 and 1:00" (Turf War) and "at 3:20 and 1:40" (the five-minute modes). The HUD shows
the next jump from second 0.

### 3.4 One jump, second by second (jump 1 of a 3:00 Turf War; J = 60 s played)

| Clock | Every screen, from its own stage clock |
|---|---|
| **J − 20** | **Pre-bell.** One distant ring from the dome. The centre clock of each clock row turns gold and its hands count down to J. The HUD era chip shows "TODAY in 20" in small type. Cosmetic: it gives teams time to move toward the routes that are about to open. |
| **J − 10** | **Warn.** Tartar rings (`era_ring`: a two-tone 400 / 480 Hz bell burst with a wooden resonance, synthesised) and shakes on his cord. **Every telephone kiosk on the stage rings with him** (six positional rings), so you hear it wherever you are. HUD callout: "TIME JUMP: 1880s → TODAY in 10", with the era chip pulsing. **Gates about to vanish flicker with a sepia film grain** (the Degrayling crates, the arcade's hoardings, the wagon, the quay barriers); **pieces about to appear show as white-gold wireframe holograms** pulsing at 2 Hz (the boardwalk and the bridge in jump 1; the Halo, the glass stairs and the Signal Garden in jump 2). The minimap outlines both (white-gold dashes for "appearing", warm-grey hatching for "vanishing"). **Light pulses run out along the overhead wires** from the dome to the stage's edges (`pulses`). The bots' danger layer goes on. |
| J − 5 | Second ring. The clock hands start to spin. |
| J − 3 … J − 1 | Short rings each second. The Royal Arcade's striker clock (two carved fish-folk giants with hammers) strikes three, and the lamps across the city flicker on each strike. |
| J − 1 | Tartar lifts his receiver (`era_pickup`), his dial spins as if he is dialling the year, and a thin beam drops from the dome's crown to the concourse. HUD line, credited "COMMANDER TARTAR": "Advancing the clock. Do keep up." (jump 2: "Further. I must see how it ends.") |
| **J** | **The front leaves (0, 0) at 25 m/s.** A curtain 10 m tall stands up out of it: brass at its foot, a white crest, Roman numerals and gear shadows drifting up through it in jump 1, pearl-white with hexagonal light shards in jump 2. `era_swell` plays with a 0.25 screen shake, and a ticking whoosh loop rides the front past you. **Time-lapse** (revision 2): from J to done the sky runs fast: the sun swings 60° across the sky, every shadow sweeps across the streets, clouds race at 20× speed, and (jump 1) the backdrop's chimney smoke streams away. It runs only on H13's cheap theme uniforms (sun direction, cloud offset) and never changes exposure or brightness, so ink stays as readable as before. |
| J + 0.5 … 1.0 | (Jump 2.) The Halo builds itself segment by segment over the circus at J + 0.53; the light-pylon at J + 0.66; the superstops' canopies fold into glass stairs at J + 0.70 and 0.94. (Jump 1.) The Degrayling crates tumble away at J + 0.87 and 1.02; the boardwalk lays itself plank by plank along the river from J + 0.97 to 1.42. |
| J + 1.2 … 2.6 | (Jump 1.) The bridge's girders slide out span by span (J + 1.27 … 1.56) and the bridge-works barrier on the far arm folds away (J + 1.52). The arcade's hoardings burst into flurries of poster paper (J + 1.34 … 1.83). The wagon rolls off its siding (J + 1.96). (Jump 2.) The Tide Steps rise out of the river at J + 1.53. The Signal Garden grows across each railyard cell by cell, the garden's three stairs breaking through the viaduct's arches (J + 1.68 … 2.55). |
| J + 2.9 | The front reaches both spawn decks (72 m) at the same instant. |
| J + 3.4 | The front leaves the arena (R_max ≈ 85 m). The backdrop's "horizon run" (1.3 s) swaps the far city. |
| **J + 4.0** | **Done.** The nav switches era and bots replan. The minimap base swaps. HUD: "NEW ROUTES OPEN" (jump 1) or "NEW AREAS!" (jump 2). Every new opening and piece pulses white-gold for 4 s and pings on the minimap. The time-lapse settles at the new era's sky. |
| J + 5.0 | Atlas rects of vanished faces are cleared (the ENGINE's done + 1 s). |

**What the wave changes on shared ground** (per fragment, at the front, no collision change):
- the carriageways re-skin from granite setts to asphalt (with tram rails) to pale pavers;
- the decks re-skin from planks to glass;
- the era tint (the 1880s are a warm 20 % desaturation of the bare surface, never of the ink);
- the AO channel;
- the era props (gas lamps → street lights → light masts, cable trams → trams → float-trams, troughs → benches →
  light benches) and the rooftop superstructures (§5.2: today's towers rise behind the facades; the 3000s' spires, shells
  and farms grow out of them);
- the facades' trims and the dome (fresh copper → verdigris → a lattice of light; the clocks → rings of light;
  **Tartar unchanged**).

### 3.5 How it is announced

- **World:** the clock rows count down from J − 20; Tartar shakes and rings and every kiosk rings with him; sepia
  flicker on what will go and white-gold holograms of what will come; pulses run along the wires and the striker clock
  strikes; then the wave itself, the time-lapse sky, and the 4 s gold pulse on what is new.
- **HUD** (`ENGINE.md` H15): the era chip under the timer ("1880s · TODAY · 3000s", the current era lit, and a thin bar
  to the next jump from second 0); the J − 20 small countdown; the "TIME JUMP" callout at J − 10; the era banner at J;
  "NEW ROUTES OPEN" or "NEW AREAS!" at done; Tartar's line.
- **Sound** (all synthesised in code): the ring; the kiosks' rings (positional); the striker clock; the pickup click;
  the swell; the ticking whoosh riding the front; era ambiences under the music: horses and cable hum (1880s); tram bells
  and café chatter (today); a soft hum and chimes (3000s).
- **Minimap and TAB map:** outlines from warn to done, and the base raster swaps at done.
- **Colours.** Holograms, pulses, outlines and the gold pulse are white-gold (#f4e9c8) and warm grey (#a9a49a).
  **Never cyan, amber, orange or magenta**, which are team inks in some pairings.
- **Before the match:** the blurb says it, and the intro fly-in (§5.8) ends with Tartar ringing once.

### 3.6 Fairness rules (each checked; numbers are ENGINE §5 rules)

1. **Point-symmetric in time and space.** The front is radial from (0, 0), so mirrored groups flip at the same instant
   and both pads at J + 2.9 s. The schedule is a pure function of the stage clock, never of score.
2. **Era 2 only opens; era 3 only adds** (rules 19–28). No inkable surface vanishes; no route is removed without
   another way to the same place (35).
3. **Never inside a player.** The plan model checks every appearing piece against every walkable top beneath it in the
   era before, in both the Turf War and the Tower Command builds: **0 violations** (revision 1's sky-bridge over the hotel
   balcony is gone). Appearing pieces are 5.0 m overhead (the Halo; corners 4.9; its smallest clearance over
   anything walkable is 3.8 m, over the 1.2 m tops of the ring bollards and cart 140), over water (the boardwalk, the bridge, the Tide Steps), inside the old solid (the
   glass stairs in the superstops, the light-pylon in the poster column, the garden stairs in the railyard's wall
   arches, the café tables in the crates, the arcade's stalls in the hoardings, the bike dock in the wagon) or on a
   railyard `roof` (the garden's caps, rule 19b). The engine's shove and rescue are the safety net, and
   `stats.eraShoves` must read 0 in every bot match.
4. **Never dropped.** Vanishing gates have `roof` tops: nobody stands on them. The only standable pieces that vanish in a
   match are the 1 m bridge-works rails on the quays and arms, which stand on the quay (a 1 m drop onto it).
5. **Objectives untouched.** Nothing changes within 2 m of a zone (15: the Degrayling crates end exactly 2.0 m north of
   the side zone; the boardwalk is 3.5 m east of it), within 1.0 m of the tower's swept platform plus 3.72 m (16:
   superstop A ends exactly 1.0 m from the Little Lane leg; the Degrayling crates and cafés are `notIn: 'tower'`), within
   3 m of the Pond, a weir or a Gate (17: the nearest era piece to the weir is the arcade's hoarding, 3.85 m; to the Gate
   the wagon, 13 m), within 12 m of a pad (14: the wagon, 24 m), or at Tartar's dome (18). The Halo clears the tower
   track by 1.18 m (its corners at 4.9 against 3.72).
6. **Warned 10–20 s ahead on five channels** (world, HUD, sound, minimap, bots). No damage, knockback or slow from the
   wave.
7. **Each era is a complete map.** The centre plus three flanks per team in era 1, plus four and the away bridge in eras
   2–3; spawn to mid 6.06 s in every era; no bare 2 m strip over 25 m in any era; ≥ 93 % of the floor within 5 m of
   cover (walls counted) in every era.

### 3.7 Ink, players and devices

| Case | What happens |
|---|---|
| Ink on ground and walls present in both eras | **Stays.** The surface under it re-skins and the ink stays on top. |
| A gate that vanishes (crates, hoardings, wagon, a wall arch, a superstop, a poster column) | It was never inkable, so no ink is lost. The floor it covered comes alive as blank turf at its flip (or is filled by the new piece). |
| A piece that appears | Arrives blank (its faces are cleared at the warn) and takes no ink until 0.5 s after its flip. |
| Ground an appearing piece covers (the pylon's footprint, the stairs) | Stops counting; the ink stays in the grid, unseen. |
| Turf % | Always out of the turf that exists now. The Turf War result is counted on era 3, the host's count as today. |
| A player against or under a vanishing gate | The space simply opens. A squid on a gate's face can't be there (`paint: false`); a kid sliding on a gate's roof drops ≤ 2.8 m. |
| A player on a bridge-works rail | Drops 1 m onto the quay. |
| A player airborne where the Halo appears (an Ink Jet hovering, a high jump off the balcony) | The engine's shove: up onto the deck if the feet are within 0.8 m below its top, otherwise down and out. Counted in `stats.eraShoves`. |
| A special user sliding on the railyard roof as the Signal Garden appears | The garden's cap appears 8 cm above their feet: the shove puts them on it. A planter or the pavilion appearing on them shoves them aside. |
| Devices (sprinkler, beacon, Drip Curtain, Lurk Mine, cling bomb) stuck to a vanishing gate | Popped with the shot-down pop by the owner's screen (ENGINE H17). |
| Surf N' Turf buoy anchored on a gate | Falls and anchors again. |
| Zipline anchored to a gate | Ends at once; the rider lands where they are. |
| Bombs, shots, the tower, the Bazookarp in flight or at rest | Untouched; they collide with whatever is solid at that moment. Nothing changes near the tower or Bazookarp objects. |
| Practice rewind 3 → 1 | The boardwalk, bridge and Tide Steps vanish over water and the Signal Garden over the railyard roof: anyone on them is **rescued** to the nearest valid node within 10 m (ENGINE §4.2: the rescue covers a roof with nothing walkable within 3.4 m below, as well as water). The Halo vanishes: anyone on it drops 5.4 m (no fall damage) after the full warning (`ENGINE.md` rule 27, rewind note). |

### 3.8 What both teams can do with it

- **Before jump 1:**
  - Stack at your own Royal Arcade's south mouth on Customs Lane: it opens into a covered lane straight to the circus at
    7:30.
  - Hold Centre Plaice: at J + 1 Degrayling Lane north opens a 16 m line from the side zone to 5 o'clock, and the
    boardwalk opens along the river beside it.
  - Gather at the Plaice's river edge: the bridge builds at J + 1.3 … 1.6 s and leads to the enemy's arm and wharf.
  - Defenders who read the minimap's outlines know which doors open behind them.
- **Before jump 2:**
  - Stand by your superstop: at J + 0.7 … 0.9 it becomes a stair straight up onto the Halo.
  - Ink the poster column at 247.5°: at J + 0.66 it is a 5.4 m inkable pylon onto the Halo.
  - Move to Hoki Lane, the arm's south walk or the West Wharf: the Signal Garden's three stairs open there at
    J + 1.9 … 2.4 and the garden overlooks the enemy's arm landing.
- **The fresh-turf rush.** About 760 m² opens at jump 1 and about 1,070 m² appears at jump 2, all blank, the same for
  both teams. It is the comeback lever (the Mahi-Mahi lesson in the research).
- **Specials:** a Booyah, Ink Storm or Tempest dropped into the circus at J lands as the Halo builds above it. An Ink Jet
  saved for the 3000s gets the Halo and the garden.
- Nobody can trigger, stall or hurry a jump.

### 3.9 Bots

They use the engine (`ENGINE.md` §4.3):
- one union nav graph with era bits on the edges;
- the danger layer from warn to done (they leave gate faces and hologram footprints);
- replans at done;
- a ×2 paint weight on fresh nodes for 30 s (they rush the opened lane, arcade, boardwalk and bridge, then the Halo and
  the garden);
- the era-3 high routes with no special help: the superstop stairs and the garden's three stairs are walk edges, the
  light-pylon a climb edge (an inked wall ≤ 5.5 m), the garden's drop gaps drop edges (3.18 m ≤ 3.4).

Two small additions, in the bots package and tagged `[b5-eras]`, using only what the HUD shows everyone:
1. **Pre-position.** In the 8 s before jump 1, a bot whose next route is at least 25 % shorter through a gate that opens
   in that jump may wait 3–4 m from it instead of detouring.
2. **Perches.** In era 3 the Halo and the Signal Garden join the 1.3–2.4 m perches (balconies, the Boathouse deck) bots
   already pick.

No wall-hacks.

### 3.10 The end of a match (cosmetic)

When the whistle goes and the results camera still shows the stage, the clocks spin once more. For two seconds the city
is shown far in the future: dark sea at the rooftops under a dead sky (the seas rose). Tartar says "…So that is how it
ends." Then a rewind wave sweeps *inward* from the edges to the dome, the city returns to the 1880s, and Tartar's
receiver settles: "Returning to the Professor." This never touches play, nothing is counted, and it can be cut with no
other change.

---

## 4. Every mode

### 4.0 The objectives on Alpha's half (all eras overlaid; Bravo's are the mirror)

`Z` zone outlines (the centre octagon and Centre Plaice) · `*` the tower track (Bravo's push to its goal in front of
Alpha's base) · `1` `2` tower checkpoints · `E` the tower goal · `K` the Pond · `W` the Bazookarp weir (the GPO terrace) ·
`G` the Gate (the turntable). The rest of the legend is §2.2. In the Tower Command build the Degrayling crates under the
track are absent (`notIn: 'tower'`).

```
        -50     -40     -30     -20     -10     0       10      20      30
        |       |       |       |       |       |       |       |       |
     9 |~~~~~~~~~~~~~bbbb~~~www.//.....hhh...//////.//hhh...............
     7 |~~~~~~~~~~~~bbbb~~~~www.//...hhhh...=#ZZZZ#=///hhhh........o....
     5 |~~~~~~~~~~~bbbb~~~~~www.....hhh...=ZZZ====ZZZ=/..hhh...o....###.
     3 |~~~~~~~~~~bbbb~~~~~......o..hhh..==Z========Z==..hhh.....#######
     1 |~~~~~~~~~bbbbb~|............hhh..=ZZ===KK***ZZ*****h......###...
    -1 |~~~~~~~~bbbb........##......hhh..=ZZ===KK***ZZ*****h............
    -3 |~~~~~~~bxbbb....######......hhh..==Zo======oZ==..h*h..o.......~~
    -5 |~~~~~...bbb..#...###....o...hhh../=ZZZ====ZZZ=...h*h.....wxw~~~~
    -7 |~~........####.............phhhh////==ZZZZ==....hh*h..//.www~~~~
    -9 |......########................hhhh//.======...hhhh*...//.www~~~b
   -11 |....######...................o..hhhh.//////.hhhh..*...//.www~~bb
   -13 |:...###....o....:##:....o......///hhhhhhhhhhhh....*..++++www~bbb
   -15 |:...............:..............////h...ss...h...xx*xx++++wwwbbbb
   -17 |::.==....:...................+++++++...ss..o....xx*xx++++wwwbbbb
   -19 |:::...:oo:....o..........::::#####++...ss.......xx*xx++++wwwbbb~
   -21 |::::............####.....::::#####++...ss.....##xx*xx++++wwwbb~~
   -23 |::::........########.....::::.....++...ss...o.##xx*xx++++wwwb~~~
   -25 |:=:::....#######.........::::.....++...ss.....##ZZZZZZZ//wwwttt~
   -27 |::::::..=####...oo.......xxxx=====++..........##ZZZZZZZ//wwwttt~
   -29 |::::::...........#gg#...oxxxx=====++..**********Z**...Z//wwwttt~
   -31 |=:::##:.......gggggg#....xxxx=====...o1.........Z.....Z..|~~~~~~
   -33 |:::####:..##Yggggggg#....xxxx==W==//..*..##...##Z....oZ...~~~~~~
   -35 |::::##:#gggggggggggg#....xxxx=====//..*..##...##Z.o...Z...~~~~~~
   -37 |::::gggggggggggggggg....oxxxx=====//..*..##.o.##ZZZZZZZ...~~~~~~
   -39 |#ggggggggggggggggggg.....xxxx=====//.#*..##...##:::::###...~~~~~
   -41 |Yggggggggggggggggggg.....xxxx#####...#*..##...##:::::###o..~~~~~
   -43 |YYggggggggggggggggg#...o.xxxx#####....*..##...##:::::###....~~~~
   -45 |YYgggggggggggggggggg.....xxxx.oo.....o*..........oo.........~~~~
   -47 |YYYgggggggggggggggg#..........xxx.....*************2******o.~~~~
   -49 |YYYYggggggggggggggg...........xxx........................*...~~~
   -51 |YYYYYYYYYYYYYYYYYY;;;;;;;;;;;;;;;;;;////////;;;;;;;;;;;;;*;;;~~~
   -53 |YYYYYYYYYYYYYYYYYY#;;;;;;;;oooooooo;;;;;;;;;;;;;;;;;;;;;;*;;;~~~
   -55 |YYYYYYYYYYYYYYYYYY#;;;;#;;;;;;;;;;;;;;;*************;;;#;*;;;;~~
   -57 |YYYYYYYYYYYYYYYYYY;;;;;;;;;;;;;;;;;;;;;**;;;;;;;;;;*;;;;;*;;;;~~
   -59 |YYYYYYYYYYYYYYYYYY;;##;;;;;;;;;o;;;o;;;GG;;;o;;;o;;*;;;;;*;;;;~~
   -61 |YYYYYYYYYYYYYYYYYY;;##;;;;;;;;;o///;;;;EE;;;;///o;;*******;;;;~~
   -63 |YYYYYYYYYYYYYYYYYY;;##;;;;;;;;;o///;;;;;;;;;;///o;;*******;;;;~~
   -65 |YYYYYYYYYYYYYYYYYY;;##;;oo;;;;;////;;;;;;;;;;////;;;;;;;;;;;;;~~
   -67 |YYYYYYYYYYYYYYYYYY;;;;;;;;;;;;SSSSSSSSSSSSSSSSSSSS;;;;;;;;;###~~
   -69 |YYYYYYYYYYYYYYYYYY;;;;;;;;;;;;SSSSSSSSSSSSSSSSSSSS;;;;;;;;;###~~
   -71 |YYYYYYYYYYYYYYYYYY;;;;;;;;////SSSSSSSSSSSSSSSSSSSS////;;;;;###~~
   -73 |YYYYYYYYYYYYYYYYYY;;;;;;;;////SSSSSSSSSSSSSSSSSSSS////;;;;;;;;~~
   -75 |YYYYYYYYYYYYYYYYYY~~~~#######.SSSSSSSSSSSSSSSSSSSS.#######~~~~~~
   -77 |YYYYYYYYYYYYYYYYYY~~~~####################################~~~~~~
   -79 |YYYYYYYYYYYYYYYYYY~~~~####################################~~~~~~
   -81 |YYYYYYYYYYYYYYYYYY~~~~####################################~~~~~~
   -83 |YYYYYYYYYYYYYYYYYY~~~~~~~~~..........................~~~~~~~~~~~
        -50     -40     -30     -20     -10     0       10      20      30
        |       |       |       |       |       |       |       |       |
```

### 4.1 Turf War

- The whole city is turf: the floors, the tier faces (the concourse, the GPO terrace, the forecourt terrace's 1.0 m edge,
  the wharf, the decks), the building faces up to 3.0 m, the Halo and the garden.
- **The match arc.**
  - The **1880s** (0:00–1:00) are a three-lane map per team: Swimston, Hotel Lane and the arch, Hoki Lane and the arm,
    with the left side reached only over the Boathouse's roof. The fight is for the circus, the Plaice and Prow Place.
  - **Today** (1:00–2:00) opens about 760 m² of blank turf (Degrayling Lane north, the arcade, the wagon's footprint,
    the boardwalk and the bridges) and rewards a team that splits.
  - The **3000s** (the final minute) add about 1,070 m² of blank high ground and river ground (the Halo, the glass
    stairs, each team's Signal Garden, the Tide Steps). **The last minute is always a new map.**
- Specials charge as usual. The jumps add no special charge.

### 4.2 Zone Control (`LAYOUT.zones`)

- **Centre zone**: one regular octagon of circumradius 6.5 on the concourse top. `y0 1.0`, `y1 1.8`, **119.5 m²**.
  - `poly: [[2.49, 6.01], [6.01, 2.49], [6.01, -2.49], [2.49, -6.01], [-2.49, -6.01], [-6.01, -2.49], [-6.01, 2.49], [-2.49, 6.01]]`
  - Cover: the 4 ticket barriers inside it (r 5), and the 8 dome columns just outside it (r 8.2).
  - Ways in: 2 Clock Steps, 2 ramps and 4 hop-up faces.
  - High ground over it: both balconies, both Boathouse decks and, in era 3, the Halo (5.4, from 5 m outside its edge).
  - "Hold the floor under the telephone."
- **Side zone (Alpha's; Bravo's is mirrored automatically)**: **Centre Plaice**.
  - `poly: [[10.5, -37.5], [18.0, -37.5], [18.0, -26.0], [10.5, -26.0]]`, `y0 -0.2`, `y1 0.4`, **86 m²**, flat at 0.
  - Its centre (14.25, −31.75) is 34.8 m from mid and **42.7 m from Alpha's pad** (revision 1's "43.0" was measured
    wrongly; it was 44.9): a mid-side zone, as on the Long Stages.
  - Cover: the coffee cart, the café tables and the bench inside it, the planter on its south edge.
  - Ways in: era 1: Degrayling Lane south (a 0.6 m step down), Little Lane from Swimston, the quay from the south-east,
    and the Boathouse's stair down from the deck = **4**; eras 2–3 also Degrayling Lane north and the boardwalk = **6**.
  - High ground: the Boathouse deck (2.4) on its north-east corner.
- **The jumps never touch a zone.** They only change how you reach the side zone (era 2 opens its north and its river
  side) and add the Halo over the centre (era 3).
- Rotation: the existing rule. The final 30 s are centre-only and always in era 3.

### 4.3 Tower Command (`LAYOUT.tower`): "the tower takes the City Loop"

It leaves the station by the concourse's plain east face, runs down Degrayling Lane through Centre Plaice, along Little
Lane to the tram line, down Swimston's west tram track past the GPO steps, along Customs Lane to the quay, up onto the
forecourt terrace, round the east yard and back across the terrace to the turntable. Straight runs and square corners;
the platform's heading is the world grid (`yaw: 0`).

Alpha's half (Bravo's push toward its goal in front of Alpha's base):

| # | From → to | m | What it runs on |
|---|---|---|---|
| 1 | (0, 1.3, 0) → (13.5, 0) | 13.5 | Across the concourse between the 67.5° and 112.5° columns (z ±2.69 clear). **Drop 1.3** off the plain east face at x 8.78. On to the ring under the Halo's east side (era 3; underside 5.0). |
| 2 | (13.5, 0) → (13.5, −29) | 29.0 | South across the ring (the ring bollards 1.25 m clear), **climb 0.6** onto Degrayling Lane's north pavement at z −14.6 (x 10.5 … 16.5: 1.75 m clear each side), **drop 0.6** into Centre Plaice at z −24. |
| 3 | (13.5, −29) → (−2.25, −29) | 15.75 | West along Little Lane (4 m: 0.75 m clear each side), across Swimston's east footpath (no veranda over the lane mouth) to the west tram track; 1.0 m south of superstop A. |
| 4 | (−2.25, −29) → (−2.25, −47) | 18.0 | South down the west track past the GPO steps' foot (0.7 m clear) and the parked tram (1.95 m clear). **Checkpoint 1 at (−2.25, −31)**, 40 %. |
| 5 | (−2.25, −47) → (21.5, −47) | 23.75 | East along Customs Lane to the quay. **Checkpoint 2 at (14, −47)**, 62 %, at Degrayling Lane's south mouth. |
| 6 | (21.5, −47) → (21.5, −62) | 15.0 | South down the quay; **climb 1.0** onto the forecourt terrace at z −50; on along the terrace's east side. |
| 7 | (21.5, −62) → (14, −62) → (14, −55) | 14.5 | The U-turn round the east yard's trough. |
| 8 | (14, −55) → (0, −55) → (0, −60.5) | 19.5 | West along the terrace's north strip (the NE apron bank 1.55 m clear), then south between the grand stairs to the **goal (0, 1.0, −60.5)**, 11.5 m short of the pad and outside the 4.2 m barrier, in full view of the deck. |

```js
// LAYOUT.tower: drawn on Bravo's half (Alpha's goal), the mirror of the table above
tower: {
  path: [[0, 1.3, 0], [-13.5, 0], [-13.5, 29], [2.25, 29], [2.25, 47], [-21.5, 47], [-21.5, 62],
         [-14, 62], [-14, 55], [0, 55], [0, 60.5]],
  checkpoints: [[2.25, 31], [-14, 47]],
  yaw: 0,
},
```

- **Length 149.0 m**, two checkpoints, so `TOWER.twoCheckpoints` applies: 80 track points at **1.86 m/s**, 10 s per
  checkpoint, **100 s** to the goal with one rider (the doubled-track stages run 1.8–2.1 m/s). Measure with `tower-len.js`.
- **Two climbs, two drops** (1.3 down, 0.6 up, 0.6 down, 1.0 up); everything else is flat.
- **The Tower Command build (`bluestone.tower`)** leaves out the cover that would stand in the tower's lane:
  `notIn: 'tower'` on the west stop island and shelter, the west lane planter, the Degrayling crates and all three café
  islands, the quay's walk bollards, Customs Lane's bench N1, planters N2 and E and bollards E, and the terrace's planter C
  and kiosk E (17 pieces per half). Every other mode keeps them, so the lanes have cover there; in Tower Command the tower
  itself stands in those lanes. This adds a `bluestone.tower` world key: 3 more AO passes on the Mac mini (§6, step 7).
- **Headroom (3.72 m):** the dome drum (8.0 over the 1.3 start: 6.7); the Halo (5.0 / corners 4.9 over the ring floor:
  1.18 m above the headroom, so ENGINE rule 16's 1.0 m holds); no veranda over a lane mouth the track crosses; the clock
  beams are not on the track. The track is clean in every era (plan model: no clutter in the platform's 2.5 m square,
  nothing but shops E1's corner and veranda E1's edge at exactly 0.75 m, no era piece within 1 m).
- **The two sides' tracks never meet** except at the centre.
- **The jumps and the tower:** nothing near the track changes. The jumps add routes beside it (the arcade, the boardwalk,
  the bridge in era 2; the Halo over its first 30 m and the glass stairs in era 3). The "tower destroys deployables in
  its path" rule is unaffected.

### 4.4 Bazookarp (`LAYOUT.bazookarp` in `src/world/bazookarp-data.js`, SPEC §4.1)

Positions for Alpha's half are given first; the data is drawn on Bravo's half (Alpha's attack), as the SPEC requires.

- **The Pond** is the concourse centre (0, 1.3, 0) under Tartar ("Tartar's prize, under the clocks"). It is raised,
  central and shootable from 360°. There is 4.3 m of deck outside the 4.5 m burst radius, then the ring (SPEC §9.1 #10).
- **Weir (one per side):** the **GPO terrace**, Alpha's at (−10.15, 1.2, −33.0).
  - A raised colonnaded terrace on Swimston's west side, lowered from 1.3 to **1.2 m** so its north face (on Hotel Lane)
    and its east face north of the steps are hop-ups (nav's jump edges stop at 1.25 m).
  - Ways on: the GPO steps (8 m), the east face (3 m, z −32 … −29), the north face (3.3 m, x −13.3 … −10), and from the
    gallery down the GPO stair.
  - Room (#15): nothing solid within 3.0 m of its centre between 1.5 and 4.8 m (the arcade wall is 3.15 m away, the GPO
    stair 4.0 m, the piers 5.4 m).
  - Defenders come up Swimston, down the gallery or out of Hotel Lane; from era 2 also out of the arcade.
- **Gate:** the cable-tram **turntable** on the forecourt terrace, Alpha's at (0, 1.0, −59).
  - A level below the spawn deck (3.3), 13.0 m from the pad, on the pad → Pond axis, in full view of the deck.
  - Apron cover (#13): the two turntable benches (x ±5.5) and two buffers (x ±4), all 1.25 m, within 4 m of route 1.

```js
bluestone: {
  start: [0, 1.3, 0],
  weirs: [{ at: [10.15, 1.2, 33.0] }],                 // Bravo's GPO terrace
  gate: { at: [0, 59], yaw: 0 },                        // Bravo's turntable, on the terrace (y 1.0)
  freeZones: [{ poly: [[-12, 66], [12, 66], [12, 76], [-12, 76]], y0: 2.9, y1: 5.9,
                signs: [[-8.5, 66.3, 0], [8.5, 66.3, 0], [-12.3, 71, 90], [12.3, 71, 270]] }],   // Bravo's spawn deck
  routes: {
    swimston: [[0, 12], [3, 26], [5.5, 34], [10.15, 33], [5.5, 36], [3, 47], [0, 52], [0, 59]],
    arch:     [[8, 8], [16.25, 17], [16.25, 24], [12, 24.5], [10.15, 30], [10.15, 33]],     // the second way to the weir
    east:     [[10.15, 33], [5.5, 32], [-4, 33], [-4, 48], [-1, 53], [0, 59]],               // the second way to the Gate
  },
  noRetreat: [], field: { block: [] },
},
```

Measured (Carp Field metres on the plan model, nav-legal hops ≤ 1.25 m; identical in all three eras):

| Measure | Value | SPEC band |
|---|---|---|
| L = Pond → Gate | **59.4 m** (12.4 s walking, 6.3 s swimming) | 55–85 m; 11.5–18 s |
| Weir → Gate | 29.2 m → count **50** | count 45–60 |
| Last weir → Gate | 29.2 m = 49 % of L | ≥ 25 m and ≥ 45 % |
| Pond → weir | 36.5 m | — |
| Pad → Gate | 13.0 m, y 1.0 against the pad's 3.3, in the ±40° cone, seen from the deck | 12–20 m; y ≤ pad + 0.2 |
| Variation across eras | **0 %** (Swimston is the shortest route in every era; every era-2 opening is a detour for the carrier) | ±5 % (SPEC §9.4) |

**Two routes per leg in every era** (checker #5: route 2 ≤ 1.6 × route 1, 2.5 m apart except near the ends):

| Leg | Route 1 | Route 2 |
|---|---|---|
| Pond → weir | the S steps, Swimston's west footpath (or the GPO steps), 36.5 m | the SW ramp, round the hotel through the arch, east along Hotel Lane and up the terrace's north face, 40.6 m (1.11×) |
| Weir → Gate | down the GPO steps and Swimston's west half, up the terrace steps, 29.2 m | off the east face, across Swimston to its east lane past the trams, Customs Lane, the terrace steps' east half, 42.0 m (1.44×) |

- **No hidden shortcut into a base.**
  - The Gate's 15 m ring reaches north into Customs Lane, so its north arc is crossed along the whole lane; the apron
    banks (1.4 m, `roof`: no hop, no climb) on the terrace's north edge at x −16 … −6.5 and 6.5 … 12.6 and the banks
    either side of the turntable shape the rest. The intended entrances are **three**: north (Customs Lane and the
    terrace steps), west (the west yard from Hoki Lane) and east (the east yard from the quay), all in sight of the deck.
    The plan model's raster cannot group nav crossings the way checker #7a does (in the raster every arc of the ring is
    joined to the next through open terrace); **if `bazookarp-check` #7a groups them into fewer than 2 or more than 5,
    the lead records a waiver** for an open, fully visible apron (the review allowed it), or the builder closes the
    terrace's ledge between the banks and the yards with more banks.
  - The Iron Bridge lands on the enemy's *arm*, about 60 m from their Gate; the Signal Garden's stairs come down in Hoki
    Lane (29 m from the Gate) and on the arm.
  - No climb saves more than 20 %: the only squid shortcut is the light-pylon at mid.
  - No drop over 2.5 m into the ring except the spawn deck's own front edge (2.3 m now).
- **High ground:** the balcony and gallery (stairs), the Boathouse deck (stairs), the GPO terrace (steps, hop-ups), the
  concourse (steps), the Halo (the superstop stairs, era 3) and the Signal Garden (three stairs, era 3) are all reachable
  by the enemy without climbing. The only Carp-Free Zone is each spawn deck beyond the barrier (SPEC S46). The checker's
  plateau test runs with `ERA=1/2/3`.
- **The jumps and Bazookarp** (SPEC §9.4 guarantees):
  - The Carp Field is computed for all three eras at load and switched at each done; nothing is rebuilt mid-match. L and
    the weir's count are unchanged (0 %).
  - A carrier who stands on ground whose field value is ∞ in the old era (newly opened ground between its group's flip
    and done) keeps its last value: `ENGINE.md` H21 now says so, and `eras-karp.js` tests it.
  - Nothing appears or vanishes within 3 m of the Pond, the weir or the Gate.
  - The drop spot avoids the danger layer's nodes from warn to done.
  - Resting spots (SPEC §2.7, revision with Q19): a node must be valid in the current era *and every later one*. The
    boardwalk and the bridge are legal from era 2, the Halo, the stairs, the garden and the Tide Steps from era 3 (none
    of them ever vanishes in a match); in era 1 a carrier splatted on the quay rests on the quay. Every point of the
    garden and the Tide Steps is a legal rest itself in era 3, so no drop from them needs the 12 m search (revision 1's
    floating garden, whose far corner was 14.9 m from land, is gone).
- **Carry:** unopposed, 12.4 s of walking from the Pond to the Gate plus the plant and re-pop. Expected contested legs:
  20–35 s to the weir, then 15–30 s to the Gate, inside the 60 s fuse.
- **Variant:** no bluestone-only Bazookarp pieces. The SPEC's kit builds the weir posts, Gate and signs
  (`onlyIn: 'bazookarp'`), which makes a `bluestone.bazookarp` world key with its own RGB bake.

### 4.5 Boss Battle: yes, held in era 2 (`modes: { boss: { fixed: 2 } }`)

- **Why TODAY and not the 3000s.** `BossNav` (`src/boss/bossNav.js`) marks a cell as a wall when anything solid stands at
  floor + 1.45 / 2.6 / 3.8 / 5.2 m. The Halo's deck at 5.0–5.4 m therefore walls the circus in era 3 (plan model: the
  circus component is 0 m² in era 3). The era is applied before `BossMode` builds its nav (ENGINE H10), so the boss never
  sees a jump.
- **The arena** (era 2, plan model, boss centre ≥ 2.9 m from walls): **the circus ring, 648 m²**, a roundabout round the
  dome (the concourse at 1.3 is under the boss's 1.35 m stride, but the 8 dome columns, 5.4 m apart against the 5.8 m it
  needs, make the dome a walled island it circles). The forecourt terraces (329 m² each) are separate pockets. The
  superstop and the parked trams close Swimston to it, so revision 1's "Hull Charge straight down Swimston" is gone: the
  ring is the arena, and the columns, the superstops, the hotel front and the Boathouse are its stun walls ("make it
  charge the dome").
- **Overhangs (corrected).** BossNav samples cell centres at 1.45, 2.6, 3.8 and 5.2 m, so the balcony (2.1–2.4) and
  the verandas (3.2–3.4) fall between its heights and thin posts between its cells: revision 1's "post spacing keeps the
  boss out" was false. Revision 2 lines the balcony's and verandas' kerbs with 1.5 m planters (§2.6), which BossNav sees
  at 1.45 m. The plan model still finds 8 m² of the ring (per half) where the boss's 2.5 m-radius shell could
  reach under an overhang: at the balcony landing's west end (−16, −14), at the front stair's foot (−5, −14) and at
  veranda E1's north end (4.5, −17). Check them in the era-2 boss pictures; if they show, add a 1.5 m planter under each
  (x −14 … −13.4, z −15.4 … −13.4; x −5.2 … −4.6, z −13.4 … −12.6; x 4.6 … 5.2, z −19.6 … −19.0), or accept it in
  writing.
- `boss: { floorY: 0 }`. Copy `tools/botlab/jobs/new-stages/out/craters/boss-check.js`: home ground ≥ 150 m², no long
  stuck.

---

## 5. The look

The palette rule: **team ink is the loudest colour on screen in every era.** Large surfaces sit at mid value and low
chroma (saturation ≤ 0.25 on anything bigger than a prop). The 1880s' sepia comes from warm materials, smoke haze and a
warm sky by day, plus the engine's tint on bare surfaces only (`uSat` stays ≥ 0.95). The 3000s' light is white-gold and
pale lilac-white at low saturation, with no cyan, orange or magenta glow. Orange appears only in small flames (lamp
flames, the furnace door), never across a sky or a floor: two team inks are Tangerine #ff8a14 and Lemon #f2e312.

### 5.1 Architecture, building by building, era by era

| Building / area | 1880s | Today | 3000s |
|---|---|---|---|
| **Flathead Street Station dome** (the centre) | Fresh copper dome (a warm bronze), ochre-and-cream drum, cast-iron columns in green, clock cases in timber with Roman numerals, gas globes | Weathered verdigris dome, gold lettering "FLATHEAD STREET STATION" on the drum, the clocks lit from behind, the famous row over each flight | A lattice of white light over the old drum rising to 22 m, the clocks as rings of light, vertical gardens on the columns; **Tartar unchanged** |
| **The Young & Jackfish** (the flatiron hotel: the Swimston wing to 9 m, the prow with its corner turret to 13 m, the arch over the arcade, the iron-lace balcony and gallery) | Bluestone and render, iron-lace balcony and gallery in dark green, gilt "HOTEL" lettering, a coach lamp in the arch | Repainted cream and ochre, gold signs, beer-garden umbrellas on the balcony, a glass hotel extension rising behind the turret | The facade kept under a glass crown; a 20 m pearl-glass spire grows out of the prow; the balcony's iron lace lit from inside |
| **The General Post Office** (terrace, colonnade, clock tower at its NE corner to 16 m) | Sandstone, a time ball on a mast, mail carts | A shopping gallery with banners; a glass office tower set back behind the facade | A white ceramic shell over the old roof to 16 m; the time ball a light orb |
| **The Royal Arcade** (glass roof at 6.0, shopfronts, the striker clock over the north mouth, the arch under the hotel) | Under construction: timber hoardings at both mouths ("THE ROYAL ARCADE: GRAND OPENING 1889"), scaffold and stacked bricks inside under a half-glazed roof | Mosaic floor, glass vault, chocolatier, toy shop, barber; a kiosk, a flower stall and benches; the two fish-folk giants on the striker clock | Light-wrapped gallery, plants climbing the iron |
| **Degrayling Lane / Centre Plaice** | The produce lane: its north end stacked with crates, barrows and a hay cart; washing lines; the Plaice a market square | Café lane: umbrellas, espresso windows, chalkboard menus, café islands in the lane | Hanging gardens, floating café pods, light strips |
| **Hoki Lane** | "GOODS YARD LANE": bins, crates, the viaduct's arches with stables in them, posters on the viaduct | **Hoki Lane**: wall-to-wall street art (mural 7, painted in by the wave) | The murals turned to slow-moving light (same mural, era-3 tint) |
| **The Boathouse** (single storey, roof deck at 2.4, on the river bend) | A rowing shed with racked eights and a flagpole | A boathouse café with deck tables | A glass pavilion; its deck the gateway to the Tide Steps below |
| **Bond stores, the Customs House, riverside warehouses** | Bluestone and red brick, hoist beams, "H.M. CUSTOMS: BONDED" | Lofts and galleries; rooftop glass boxes; a gold-crowned office tower behind the Customs House | Vertical farms grown out of the roofs; sky-bridges between the Customs House and the warehouses, high over the arm |
| **The quay, the boardwalk, the wharves** | Timber wharves, bollards, a jib crane, a moored paddle steamer, barrels; no promenade on the river bend, only falsework piles | The riverside boardwalk on its piles, café pontoons, the rowing club's eights | The floodwall promenade: glass flood barriers, "FLOOD LEVEL 3026 ▲" marks (mural 11), the Tide Steps |
| **The Iron Bridge** | Iron arch ribs over the river on timber falsework, no deck; "BRIDGE OPENS 1889" boards on the barriers | Finished iron bridge with heritage lamp standards | Light-rail balustrades |
| **The superstops** (Swimston's median) | The cable-tram shelter and turnstiles, timber and cast iron | A tram superstop with a glass canopy and a timetable screen | Gone: a glass stair climbs out of the stop to the Halo |
| **The railyards** (out of play, behind the viaduct) | Steam engines, goods wagons, coal stages, the signal box | Electric suburban trains under catenary gantries | Roofed over: the **Signal Garden**, a park on a deck over the tracks, with the old signal box inside a glass shard pavilion and the signal gantry kept as a sculpture; a maglev guideway on the viaduct beyond it |
| **The Engine House** (spawn) and its forecourt terrace | Bluestone engine hall, arched windows on huge winding wheels, the cable's hum, **the chimney smoking**; the terrace in bluestone with flowerbeds | A tram museum and depot, the chimney cold with a café sign | A float-tram dock; **a beam of light rises from the old chimney** |

**Hero props** (shared, never change, animated by `EraFx`):
- **Tartar** (`bluestone_tartar`, 2.0 × 2.4 m): a rounded cream-and-brass body, a curly-corded handset on the cradle, a
  dial face. He hangs from a coiled cord 7 m long from the dome's crown and has two bell domes on his back.
- **The clock hands** (`bluestone_clockhands`, five faces per row).
- **The telephone kiosks** (`bluestone_kiosk`).

### 5.2 Props (types `bluestone_*`; era props are static merged parts, ≤ 5 materials per era mask, ENGINE rule 40)

- **The era-slot kit** (§2.10): 14 slots × 3 looks.
- **Era-1 only:** the hoarding posters and scaffold in the arcade; the goods wagon with crossing gates and a warning
  disc on posts; the goods-siding rails across Customs Lane; the crates, barrows and hay cart in Degrayling Lane;
  "BRIDGE WORKS" boards and falsework under the bridge ribs and along the river bend; gas lamps (on the shared lamp
  positions), horse troughs and hitching posts; telephone poles with a cat's cradle of wires over every street;
  cable-tram slot rails; bill-poster columns; steam engines and coal stages on the railyard.
- **Era-2 only:** street lights and tram wires on catenary poles; bike racks, café screens, recycling bins; tram-stop
  signs and the superstop's timetable screen; the big screen on the bond store's north face (showing the turf meter);
  advertising columns; electric trains on the railyard.
- **Era-3 only:** light masts, light benches, drone docks; planters with irrigation; the boardwalk's lily-pad edges;
  the light-rail plinths under the float-trams; the garden's lawns, trees and the signal gantry.
- **Shared** (all eras; the only animated ones): Tartar, the clock hands, the kiosks; the striker clock's two giants;
  veranda posts and iron lace; the station's columns and arches; the chimney smoke (era-1 particle emitter, a backdrop
  object).
- **Lane clutter by area** (every area has a reason): **Swimston:** the superstop, newsstand, coffee cart, kerb planters,
  fire hydrants. **Hoki Lane:** crates, bins, a lane tree. **Prow Place:** a drinking fountain, a phone kiosk, cab-rank
  posts. **Customs Lane:** the level crossing (era 1), benches, bollards, crates. **The terrace:** turntable rails,
  buffers, the ticket booth, benches, the planter banks. **West yard:** grip car, coal bins. **East yard:** stables,
  trough. **The wharf:** crane base, cargo, barrels, the goods shed, the loading platform's winch.

**Rooftop superstructures** (revision 2). Each arena building gets an era-2 and an era-3 superstructure on its roof,
set back from the street faces, above play height. They are static era props with **no colliders** (the buildings' own
`roof` colliders below them are unchanged), so they cost no level blocks and never touch play; an Ink Jet (hover height
3.8 m over the ground beneath it) stays below all of them. Materials per era mask: era 2 uses blue-grey glass, white
mullion metal, warm render and gold leaf (4); era 3 uses pearl glass, emissive light seam, white ceramic, planting and
the maglev's clear tube (5).

| Building (Alpha's; Bravo's mirrored) | Era 2: today | Era 3: the 3000s |
|---|---|---|
| The Young & Jackfish (roof 9, turret 13) | a glass hotel extension 3 m behind the turret, 9 → 22 m, blue-grey glass and white mullions | a 20 m pearl-glass spire out of the prow, 9 → 29 m, light seams up its edges |
| The GPO and its corner shop (roof 7) | a glass office tower over the corner shop, set 3 m back, 6 × 4 m, 7 → 30 m | a white ceramic shell arching over the GPO's roof, 7 → 16 m, with the time ball as a light orb at its crown |
| Shops E1 / E2 (roof 7) | two slim glass towers 2 m back from Swimston, 7 → 25 m and 7 → 34 m | living-wall towers on the same footprints, 7 → 20 m, planting and pearl glass |
| The bond store (roof 7) | a glass rooftop loft box, 7 → 10 m | a vertical-farm tower, 7 → 25 m, green glass louvres and planting |
| The Customs House (roof 8) | a gold-crowned office tower behind it on the railyard side, 8 → 40 m | a sky-bridge from its roof to warehouse W1's farm tower, underside 12 m, over the arm |
| Warehouses W1 / W2 (roof 7) | loft conversions with glass rooftop boxes, 7 → 10 m | vertical-farm towers, 7 → 25 m (W1) and 7 → 18 m (W2) |
| The arcade (glass roof 6.3) | rooftop signage frame "ROYAL ARCADE", 6.3 → 8 m | planted pergola of light over the vault, 6.3 → 9 m |
| The viaduct and railyard (top 3.1–4.4) | catenary gantries, 4.4 → 9 m | the maglev guideway on the viaduct's far side, 4.4 → 7 m, a clear tube with a pod gliding through it (backdrop object) |
| The dome (lantern 19) | floodlit, no superstructure | the lattice of light rising to 22 m |
| The Engine House (roof 9, chimney 24) | a café sign on the cold chimney | the chimney's light beam (backdrop) |

From the spawn deck in era 2 the skyline past the circus fills with towers behind the 1880s facades; in era 3 the
nearest roofs grow spires, shells and farms and the Halo and the glass stairs glow over Swimston. Checkpoint C tests it
(§6).

### 5.3 Surfaces (texlib; the batch lead assigns the slot numbers)

| Slot | Name | Look | Where |
|---|---|---|---|
| stage slot 1 | `bluestone` | dark blue-grey basalt setts #57606b, paler joints #3d434b, a dished gutter channel | laneways, the circus, kerbs, plinths, the terrace: **the constant** in every era, so ink always reads against the same dark mid-grey |
| stage slot 2 | `granite` | grey granite setts #8a8478 with cable-tram slot rails | Swimston and Flathead carriageways in the 1880s |
| stage slot 3 | `sandstone` | pale sandstone flags **#b5a990** (saturation 0.20, value 0.71) | the concourse, the GPO terrace and steps, the station's bases |

Shared patterns: `asphalt` (the carriageways today), `pavers` (the carriageways in the 3000s, replacing revision 1's
fourth `lightstone` slot), `planks` (wharves, decks, the balcony, the bridge, the boardwalk), `glasstile` (decks and the
Halo in the 3000s), `render`, `brick`, `weatherboard`, `wood` (the hoardings and crates).

Remaps (≤ 4): the carriageways (granite → asphalt → pavers) and the decks (planks → planks → glasstile). The concourse and
the bluestone never change.

**Slots.** Bluestone needs the usual three stage slots. All 36 stage slots today (28–63) are taken
(`src/world/stages/surfaces.js`: `LAST_STAGE_SLOT = 63`, `TL_SLOTS = 64`), so the slot table must grow for batch 5's
three stages at once: a shared change the batch lead makes (with aquarium and caldera), costing 3 vec4 uniforms per slot
(ENGINE risk 9). Bluestone takes no more than its three.

### 5.4 Murals and signage (stage mural ids 4–11; one image per id, on one face; each with its era mask)

`murals.js` places a stage mural as one atlas rectangle on one face per id, so each id here is one image on one block's
face, chosen so the face is big enough:

| Id | Eras | Image | The face it goes on |
|---|---|---|---|
| 4 | all | the circus hour ring: twelve bronze Roman numerals at r 18, XII toward Bravo | the top face of the `circus floor` single block (x −20 … 20, z −20 … 20) |
| 5 | all | the concourse's inlaid clock dial (r 6) with the station's name round its rim | the top face of the concourse's centre block (\|x\|, \|z\| ≤ 6.2) |
| 6 | 2–3 | a café-lane mural (cups, fish-folk, the dome) | shops E2's east face on Degrayling Lane (x 10.5, z −44 … −31, 0–3 m) |
| 7 | 2–3 | Hoki Lane's street art (squids, fish-folk, a giant telephone): chalky, ≤ 35 % saturation, painted in by the wave | the arcade's west wall, west face (x −19.1, z −46 … −26, 0–3 m) |
| 8 | 2 | the superstop's road markings: TRAM STOP and the yellow platform lines | the top face of Swimston's carriageway block round the superstop (the ground helper keeps x −4.5 … 4.5, z −30 … −12 one block) |
| 9 | 1 | a painted 1880s ghost sign, "CABLE TRAMS 3d · FLATHEAD ST" (painted out by the wave at jump 1) | the bond store's north face on the Plaice (z −38, x 16.5 … 19.5, 0–3 m) |
| 10 | all | the turntable ring | the top face of the forecourt terrace's centre block (x −5 … 5, z −66 … −52.4) |
| 11 | 3 | "FLOOD LEVEL 3026 ▲" tide marks | the Boathouse's river face (x 21.5, z −24 … −12) |

Everything else is on props, per era: the street names (enamel plates on corners: SWIMSTON ST, FLATHEAD ST, DEGRAYLING
LANE, HOKI LANE, LITTLE LANE, HOTEL LANE, CUSTOMS LANE, CENTRE PLAICE), the GPO's lettering, "CABLE TRAMWAY ENGINE HOUSE
1885" on the spawn deck's face, the hoarding posters, "H.M. CUSTOMS: BONDED", "BRIDGE OPENS 1889", café menus,
tram-stop flags, "FREE TRAM ZONE", the 3000s' light seams (light-strip props along the kerbs). Every telephone kiosk
carries an enamel "TELEPHONE" plate that never changes. The clock rows carry destination plates (INKOPOLIS, THE CAPE,
SALTWATER, NORTH QUAY, THE PLAINS, RIVERSIDE, KELP HILL).

### 5.5 The far backdrop (one set per era, ≤ 6 draw calls each, swapped by the horizon run; shared terrain in the main set)

| Side | 1880s | Today | 3000s |
|---|---|---|---|
| North and south (behind each base) | The city grid climbing away: two-storey terraces, a cathedral with three spires, a brick shot tower, the domed exhibition hall on a hill, gasometers, smoking chimneys | Glass towers among the old spires; one tall tower with a gold crown; the shot tower inside a glass shopping cone | Arcology towers with hanging gardens and sky-bridges between them; the shot tower and the exhibition dome preserved under glass bells; float-trams crossing between towers |
| East and west (beyond the river corners and the wharves) | The river winding between parkland and wharf sheds, tall ships' masts, a paddle steamer | An arts precinct with a white lattice spire, stadium light towers, a big observation wheel, rowing eights on the river | Floating garden platforms on the river; a glass city on the bay; **a sea wall and tide gates across the bay mouth, the sea visibly high against it** |
| The railyard corners (dressing on the embankment) | Track fans, steam and coal stages, signal gantries | Suburban electric trains under gantries | The Signal Garden in the near part; maglev guideways into a hillside beyond |
| Every era, the far horizon | Low blue ranges inland: the same hills in every era, the constant that says it is the same place | | In the 3000s, **a dark bank of storm cloud low on the southern horizon** (never in play): the coming end |

### 5.6 `env`

- `bay: false`, `edge: 'none'` (the stage dresses its own quay walls and viaduct), `boats: false` (the river's boats are
  backdrop objects), `gulls: true`, `stars: true`, no weather.
- Era 1 adds chimney smoke (backdrop particle objects, era-1 set).
- **The river**: an olive-green river, the same in every era (seaDeep #2e3f36, seaShallow #4f6a5a, seaCrest #9fb3a6).
  The water level never changes; the flood marks tell the story.
- **The sun** is in the west, a little north (`sunAz 168`, `sunEl 48` by day; `sunAz 176`, `sunEl 8` at dusk), so
  neither spawn looks into it along Swimston. Shadows fall east. (During a jump the time-lapse swings it 60° and back to
  the new era's setting, §3.4.)
- **Per-era theme overrides** (`eras.look`, applied over the time of day):
  - **1880s:** by day a warmer, hazier sky (horizon #e9dcc4, haze `[1/900, 0.9, 200]`, fog `[30, 520]`); at dusk a
    **violet twilight** (zenith #3f3766, horizon #a996c2, a pale warm sun #ffe6c8), not an orange sunset.
  - **Today:** the base theme, crisp blue with fast cumulus.
  - **3000s:** a clean bright sky (zenith #4a86d0, horizon #e6eef6) with the faint arc of an orbital ring (an era-3
    backdrop object).

### 5.7 Day and dusk; lamps

| Era | Day | Dusk |
|---|---|---|
| 1880s | Warm sun through coal haze | **Violet twilight** over the river; gas lamps a warm white #ffe0b8 with small orange flames; the engine-house furnace door glows (small); chimney smoke lit from below |
| Today | Crisp clear blue | Pink-violet sunset; warm-white street lights #ffd9a8, tram headlights, the dome floodlit gold, café fairy lights |
| 3000s | Bright clean sky, the orbital ring | Violet dusk; light seams and the Halo glow softly white-gold; lamps cool white #eef4ff; the chimney's light beam; stars |

**Tartar's dial is the warmest light under the dome in every era and time of day.**

`decor.lamps` (shared positions, colour per era from `eras.look[e].lamps`; ENGINE rule 42 caps them at 12). Six in
Alpha's half, mirrored:

| Lamp | x, z | Where |
|---|---|---|
| 1 | (−5.4, −16.0) | the balcony's corner |
| 2 | (5.2, −29.0) | Swimston at Little Lane |
| 3 | (−11.9, −27.9) | on the GPO terrace's north pier |
| 4 | (10.8, −13.8) | Degrayling Lane's mouth at the ring (clear of the era-1 crates) |
| 5 | (21.2, −20.0) | the Boathouse's river corner, over the boardwalk |
| 6 | (0.0, −53.0) | the forecourt terrace, over the steps |

### 5.8 The intro and the hero shot

- **Intro** (era 1, since every match starts there): `intro: { from: [-58, 16, -24], lookFrom: [0, 7, 0], toBack: 3.2 }`.
  It starts high over Alpha's West Wharf, looking east-north-east along Flathead Street at the dome with Tartar hanging
  under it; **Tartar rings once** as the camera passes the clocks, teaching the sound; then it swings back to the team's
  spawn deck, the chimney smoking.
- **Stage-select art:** `art: { from: [44, 26, -46], look: [0, 4, -6], fov: 56 }`: high over the south-east river bend,
  the boardwalk, the Iron Bridge and the Tide Steps in the foreground, looking north-west over the Boathouse and
  Degrayling Lane to the dome and its clocks, with Swimston running off to Bravo's chimney. **It is rendered mid-jump,
  with the front frozen at r 30 m.** Day art is jump 1: inside the ring it is today (the finished dome, trams, murals,
  the boardwalk and the bridge); outside it, the 1880s (sepia, hoardings, crates, the bridge's bare ribs, a cable tram).
  Dusk art is jump 2: the 3000s inside (the Halo, the glass stairs, the spires), today outside. It needs
  `stageart.cjs ERA_FROM=1 ERA_TO=2 FRONT=30` (`ENGINE.md` T3).

---

## 6. Build order, checkpoints, acceptance

The engine (`ENGINE.md` §6, steps 1–5 on the Halyard fixture) runs in parallel with steps 1–3 below. The stage needs the
engine from step 4.

| Step | Work | Ends with |
|---|---|---|
| 1 | **Blockout, union world.** The land outline and ground helper (the circus slab and Swimston's carriageway block kept whole); every piece in §2.6 as plain boxes with its `eras` / `eraGroup` / `notIn`; the railyard embankment; spawn pads, bounds. Run `check-maps bluestone` and `bluestone.tower` (and the era-aware `#1/#2/#3` once T2 lands); `?era=n` or `ERA=n` top shots. | **CHECKPOINT A: stop and look.** Top shots of eras 1, 2, 3; the `check-maps --svg` thumbnail beside Kelpline's and Treehills' (§6.1 #1); the `play` view from both spawns; mid from the concourse; the lead compares the shape with §2.2. |
| 2 | **Measure the blockout.** `spawn-mid.js`, `cover-map.js`, `climb-audit.js` and `size-budget.js`, each with `ERA=1/2/3`; the 2 m strip test (§6.1 #2); the paint ppm and lightmap rows (`check-maps` prints them); **loadMs and draw calls per era** (`shoot.cjs` REPORT), and the decision on ENGINE step 4b (dirty-region nav for eras 2–3) if nav ×3 costs more than 700 ms. | The numbers against §6.1. |
| 3 | **Modes on the blockout.** Zones; the tower (`tower-check.cjs ERA=1/2/3` on `bluestone.tower`, `tower-len.js`); the Bazookarp data (`bazookarp-check.cjs ERA=1/2/3` when WP4 lands, #7a in particular); the boss check in era 2. On the Mac mini: 6 Turf War matches each with era 1 locked, era 2 locked, era 3 locked and the real schedule, plus 4 Zone Control and 4 Tower Command matches. | **CHECKPOINT B**: modes and bots pass on the blockout before any dressing. |
| 4 | **The place.** The hero buildings (the dome with Tartar, the hotel and its arch, the GPO, the arcade, the Boathouse, the engine house), the era-slot kit, era props, the rooftop superstructures (§5.2), the Signal Garden's dressing, surfaces, murals. | **CHECKPOINT C: stop and look.** Each era, day and dusk, from 6 cameras (spawn `play`, mid, the GPO steps, Centre Plaice, the arm, the bridge), next to the same cameras on Halyard. Nothing empty, every area dressed. **With the far backdrop hidden, each era must be recognisable from the spawn's `play` view by the arena buildings alone.** |
| 5 | **The jump on the stage.** StageEras schedule; EraFx (curtain numerals, holograms, flicker, kiosks, wire pulses, clocks, Tartar's animation, the time-lapse sky); the HUD chip and callouts; sounds. | **CHECKPOINT D: stop and look.** Pictures at J − 10, J + 0.6, J + 1.5 and J + 3.0 from the concourse, the GPO steps, Centre Plaice and a spawn deck, and a 20 s recording of each jump (the time-lapse included) for the lead and then the user. Tune hologram opacity, flicker, the time-lapse's speed and the wording from it. |
| 6 | **The world round it.** Backdrop sets per era, `env`, lamps, the intro, the frozen-front stage art. | **CHECKPOINT E: stop and look.** The intro and both art pictures. |
| 7 | **Bake and finish.** The RGB AO bakes on the Mac mini (`bluestone`, `bluestone.tower`, `bluestone.bazookarp`: 9 bakes); perf per era; load time; `net-eras.cjs`; regressions; the full bot sweep. | Acceptance below. |

### 6.1 What the lead will judge against (all with `ERA=1/2/3` unless said otherwise)

1. **Shape.** The `check-maps --svg` thumbnail, side by side with Kelpline's and Treehills': it reads as a skewed X
   (each Swimston stroke a fan narrowing onto the circus, the Flathead strokes running 30–45 m past them, river corners
   reaching the circus at 4 and 10 o'clock, railyard corners behind the viaduct). A band with jagged edges fails.
2. **No empty areas.** Every area listed in §5.2 is dressed. **No 2 m-wide straight strip at floor level (any tier) longer
   than 25 m without a free-standing object of 0.9 m or more in it**, measured per era in the Turf War build (in the
   Tower Command build only the tower's own lane may exceed it). A cover map **at least as good as Halyard's**: ≥ 94.2 % of
   floor within 5 m of cover with `cover-map.js` in every era; no open circle over 6 m radius except the concourse top,
   the zones and the spawn decks.
3. **Routes.** Spawn to mid 5.4–6.6 s in every era, both teams (plan 6.06 s). Era 1: the centre and three flanks per
   team; eras 2–3: the centre, four flanks and the away bridge; every route enters the circus at its own point (§2.8). No
   dead ends; `climb-audit` clean.
4. **check-maps** ok for `bluestone`, `#1`, `#2`, `#3`, `bluestone.tower` and `bluestone.bazookarp`, with the T2 static
   rules: group size and side, **every appearing piece against every walkable top beneath it in the era before** (rules
   19–22), vanishing tops (27), objective distances (14–17), **every river rail's ends on the outline**, blocks per jump
   ≤ 160, era-only blocks ≤ 35 %, union area, lightmap rows.
5. **The gimmick's fairness tests** (`ENGINE.md` §6): mirrored groups flip within 1 frame of each other;
   `stats.eraShoves` = 0 and 0 bots on a vanishing top at its flip, in every bot match; a splat inside the guard window
   claims nothing; a sprinkler on a gate is popped on every screen; `net-eras.cjs`: flip skew < 0.4 s at
   `netlag=150&netjitter=50`, equal grid cells on fresh faces, the host's count on both results screens, a host change
   keeps the schedule, and a Practice late joiner gets the era in 2 s.
6. **The jumps do not decide matches.** In 24 Mac mini Turf War matches with the real schedule: Alpha / Bravo wins
   40–60 %; the team ahead at J changes in at most 35 % of jumps within the 20 s after it; locked-era matches show each
   era playable on its own (stuck ≤ 1 %, kills spread over all routes, no route unused).
7. **Zones:** zone cells identical before and after each jump; a full zones match sane.
8. **Tower:** `tower-check` 0 holes and no clearance problems other than the deliberate drops and climbs, every era;
   `tower-len` 149 ± 4 m and 100 s; `tower-match` sane.
9. **Bazookarp:** `bazookarp-check` RESULT ok for every era (#7a: 2–5 entrances, or the lead's recorded waiver for the
   open apron); L 59 ± 3 m and identical across eras; the 16-match targets (SPEC §9.1) on the Mac mini.
10. **Boss:** the era-2 boss check: home ground ≥ 150 m² (plan: the circus ring, 648 m²); no long stuck; the dome is a
    stun island; the three overhang spots of §4.5 checked in pictures.
11. **Bots:** stuck ≤ 1 %, no episode > 10 s; every bot visits an era-3 area within 20 s of done (median); bots use the
    garden's stairs and the superstop stairs (path logs).
12. **Performance against Halyard** (334 calls, 3.0 M triangles, 3.75 ms cpuRender, loadMs ≈ 6.8 s): each era ≤ 334
    calls and ≤ 3.0 M tris, with the era props, superstructures and that era's backdrop set ≤ 60 calls of it; during a
    jump ≤ 390 calls and ≤ 3.6 M; loadMs ≤ 7.6 s (measured at step 2, step 4b decided there); no frame > 50 ms during a
    jump; paint ≥ 20 ppm on high; lightmap ≤ 1,800 rows.
13. **Looks:** day and dusk in all three eras; the spawn `play` view clean (no beam across it); no z-fighting, floating
    props or see-through gaps (the float-tram plinth); Tartar visible from both spawns; ink the loudest colour in every
    era (a picture of each era after `PLAY=20`), and **an era-1 dusk picture after `PLAY=20` with the tangerine-cobalt
    and the lemon-grape palettes** (the sandstone at mid and the 1880s light must not compete with Tangerine #ff8a14 or
    Lemon #f2e312).
14. **The 3000s read as the 3000s:** Checkpoint C's backdrop-hidden test passes for every era.

### 6.2 Risks and the levers (in the order I would pull them)

1. **The Halo dominates the last third.**
   - Watch: era-3 kills from the Halo, and centre-zone hold time in era 3 against era 2.
   - Levers: fewer Halo planters (bare glass); then lower the Halo to 5.0 m (it must stay ≥ 4.72 over the track); then
     open gaps in its deck at the N and S sides so it is two arcs.
2. **The Signal Garden dominates its corner** (3.18 m over Hoki Lane, the arm's south walk and the home wharf).
   - Watch: kills from the garden; time teams spend there; Bazookarp carries routed through it.
   - Levers: close one drop gap per edge; lower the lane-side parapets to 0.8 m above the garden (more exposed); remove
     the wharf stair.
3. **Era 1 feels too tight on the left** (the only left flank goes over the Boathouse deck).
   - Lever: open Degrayling Lane north from era 1 for half its length (keep only `crates-1`).
4. **Size: this is a big stage** (about 10,000 m² of floor in era 3, against Calamari's 6,000).
   - Watch: paint ppm, lightmap rows, draw calls and loadMs at step 2.
   - Cuts, in order: the Tide Steps; the garden's cells t6 and t7 (era 3 stays at +10 %); the West Wharf's loading
     platform; the yards' outer corners (chamfer Q6–Q8).
5. **Era-only blocks** (rule 7: ≤ 35 %). About 122 era blocks per half against about 330 layout blocks per half (37 %)
   before the dressing's colliders; about 30 % once the dressing (lamp bases, bins, hydrants: about 200 colliders) is in.
   Lever if T2 says otherwise: the Halo's inner balustrade becomes prop glass over a 0.3 m kerb (−12 blocks per half).
6. **Bazookarp entrances (#7a)**: the ring reaches Customs Lane. Lever: the lead's waiver, or more apron banks on the
   terrace's ledge.
7. **Readability of the jump.** Lever: the recording at checkpoint D, then tune hologram opacity, the flicker, the
   time-lapse and the callout words from the user's reaction.
8. **Bazookarp L at 59.4 m sits near the 55 m floor.** If knockouts land before 1:15 in the Mac mini set, move the
   turntable and the spawn deck 2 m back (L 61 m, spawn to mid 6.2 s, still inside both bands).

---

## 7. Review log

Two reviews of revision 1: **A** = the user's advocate, **B** = the build / modes engineer. Every number below comes from
the revision-2 plan model (`geo2.py`, `plan2.py` and the measuring scripts), which replaced revision 1's.

### A. The user's advocate

| # | Severity | Issue | What I did | Status |
|---|---|---|---|---|
| A1 | blocker | The silhouette is a 54 m band with two short stubs, not a skewed X | Redrew the outline (§2.1). Each Swimston stroke is now a fan that narrows onto the circus: the river quay runs diagonally from (27, −54) to (21.5, −30) and the viaduct from (−27, −58) to (−24, −33), so the waist is 45.5 m against the base's 54 m. The water reaches the circus at 4 and 10 o'clock (the apex 22 m from the centre, was 27). The Flathead strokes run to along ±62 (were ±50), 30–45 m past the Swimston strokes. No straight side is longer than 25 m. Re-measured spawn-mid (71.5 m), L (59.4 m) and the tower (149.0 m). §6.1 #1 now compares the `check-maps --svg` thumbnail with Kelpline's and Treehills'. I tried the review's notches literally first (river cut to x 17 at z −8…−36, railyard to x −21 at z −30…−52): drawn, it still read as a jagged band and it deleted Hoki Lane and the Boathouse, so I used the tapered fans instead. | Resolved |
| A2 | blocker | The lanes are long and bare; the cover number counts building walls; the §2.10 sightline claims are false | Free-standing cover in every lane at ≤ 25 m: Swimston's superstop median, the west-track stop and lane planter, kerb planters on both footpaths; café islands in Degrayling; crates, bins and a planter alternating sides of Hoki Lane; benches and planters in Customs Lane; quay bench and bollards; a second kerb island, kerb cover, promenade benches and wharf crates in the arm; banks, benches and a kiosk on the forecourt terrace; ring bollards and a third cart in the circus. The plan model's strip test (every 2 m strip on every tier, four directions, every era) finds **0 strips over 25 m** in the Turf War build (revision 1: 49.5 m in Swimston, 49 m in Degrayling, 44 m on the Yabby walk, 47.5 m on the forecourt). Where the tower's 0.75 m keep-clear band forbids cover I took the review's first option: those 17 pieces per half are `notIn: 'tower'` (a `bluestone.tower` key, 3 more AO passes); in Tower Command only the track's own lane exceeds 25 m. §2.10 now reports both cover numbers (walls counted 93.6–93.8 %; free-standing only 77–81 %) and the per-area longest bare strips. §2.9's sightline claim is corrected: the superstop hides the concourse's centre and the zone from the deck; lines along the tram tracks still reach the concourse's front corners at 60 m. The acceptance line is §6.1 #2. | Resolved |
| A3 | major | Era 3 barely adds new areas (+5.4 %) | Era 3 now adds **+12.0 %** floor over era 2 (8,954 → 10,025 m²). The new area per half is the **Signal Garden** (§2.6): a park on a deck over the railyard, outline area 359 m² (about 330 m² of floor), with its own landmark (the glass shard pavilion round the old signal box), cover at 6–10 m (five planters, the pavilion, a lawn mound), **three** ways in on foot (stairs from Hoki Lane, the arm's south walk and the West Wharf, all 3 m wide) and reasons to fight (it overlooks Hoki Lane, the arm where the enemy's bridge lands and the home wharf, and it is a raised short cut: Hoki Lane → wharf 13 % shorter, west yard → arm 17 %). It is the Federation-Square answer to the railyards beside the real crossing. Also new: the Tide Steps on the river and two glass stairs. Paid for by dropping revision 1's floating gardens and roof garden; the forecourt was not trimmed (it became a terrace instead). | Resolved |
| A4 | major | The 3000s are not "super futuristic" inside the arena; no buildable superstructures | §5.2 now lists, per arena building, an era-2 and an era-3 rooftop superstructure with heights and materials (e.g. the hotel's 20 m pearl-glass spire to 29 m, the GPO's white ceramic shell to 16 m, vertical-farm towers to 25 m on the bond store and warehouses, a sky-bridge at 12 m between the Customs House and W1, the maglev guideway, the dome's lattice to 22 m; today's glass towers to 22–40 m behind the facades). They are static era props without colliders, ≤ 5 materials per era mask. Checkpoint C and §6.1 #14 add the test: with the backdrop hidden, each era is recognisable from the spawn by the arena buildings alone. | Resolved |
| A5 | major | Jump 1's "new routes" change almost nothing | Real era-1 closures now: **Degrayling Lane north** is stacked with crates (the user's "a lane full of crates"), **the Royal Arcade** is a building site and now runs straight under the hotel through an arch to 7:30 (the review's second option), **the river side has neither the boardwalk nor the Iron Bridge** (the review's first option, adapted to the new quay). The goods fence is gone (it leaked); the wagon stays as era-1 cover (B9). Era 1 has the centre plus three flanks per team, eras 2–3 the centre plus four flanks and the away bridge. Shortcuts between the places each closure separates: Centre Plaice → 5 o'clock **24 % shorter** after jump 1 (left side); the arcade's mouth → the arch **12 %** (right side); Centre Plaice → Bravo's arm without crossing mid: no way → 47.7 m. **Where the review is wrong:** a pad-to-mid route cannot get ≥ 15 % shorter on this layout without closing Swimston, because Swimston runs straight from each pad to the centre and is open in every era (the spawn-to-mid budget, ENGINE rule 33, and the Bazookarp's ±5 % rule both need it). §2.8 explains this and shows both kinds of measure. The right side's 12 % could only reach 15 % by also closing the hotel arch in era 1, which would make Prow Place's single 4.9 m exit carry both right flanks again (A7). | Resolved for the left side and in spirit; right side 12 % (see the note) |
| A6 | major | The era-3 sky-bridge appears 1.75–2.6 m over the hotel balcony | The sky-bridge, its ramp and the roof garden are gone. The Halo is reached by a glass stair that grows inside each team's Swimston superstop (eras 1–2: a solid 3.2 m `roof` median; ENGINE rule 19) and by the light-pylon. The plan model now checks every appearing piece against every walkable top beneath it in the era before, in the Turf War and Tower Command builds: 0 violations; the Halo's smallest clearance over anything walkable is 3.8 m. The check is in §6.1 #4 and ENGINE T2. | Resolved |
| A7 | major | Both right-side flanks squeeze through one 3 m gap; the 7 o'clock length is mismeasured | The hotel's low wing is gone: Prow Place opens north across its full 4.9 m onto Flathead's carriageway (8 o'clock), and the new **hotel arch** (4.5 m wide, soffit 3.8 m) gives a separate exit to 7:30, fed by Hotel Lane in every era and by the arcade from era 2. §2.8 is re-measured to distinct circus entries (4, 5, 6, 6:30 balcony, 7:30, 8). The balcony has two 3 m ways up (the front stair from the circus, and the GPO stair from the terrace onto its new gallery); the Boathouse deck has two 3 m stairs (from the Plaice and from the ring). | Resolved |
| A8 | major | The ground is mostly flat (78 % at y 0) | **47–48 % at y 0** in every era (§2.5): the base stands on a 1.0 m forecourt terrace (with full-width steps), Degrayling Lane's pavements are 0.6 m above the Plaice (the review's idea), the Royal Arcade and its arch are 0.6 m up, the West Wharf is a 0.6 m timber deck with a 1.6 m loading platform, the GPO terrace is 1.2 m, and the garden adds 3.18 m in era 3. The tower's climbs and drops follow these (§4.3); the zones stay flat. The riverside promenade 0.8 m below the street was not used: the boardwalk and the bridge would then have needed 0.8 m steps at every join. | Resolved |
| A9 | minor | The sandstone at mid and the 1880s dusk compete with orange and yellow inks | Sandstone → #b5a990 (saturation 0.20). The 1880s dusk is a violet twilight with warm-white gas lamps #ffe0b8; orange only in small flames (§5.6, §5.7, `eras.look`). §6.1 #13 adds era-1 dusk pictures after `PLAY=20` with the tangerine-cobalt and lemon-grape palettes. | Resolved |
| A10 | minor | The era-2 arcade and the wagon's footprint open up bare | Era-'23' cover inside the old footprints (rule 19): a kiosk, a flower stall and a bench island in the arcade (1.0–1.2 m), and a bike-share dock in the wagon's footprint. | Resolved |
| A11 | minor | The jump could sell "going forward in time" more | From J to done the sky time-lapses (§3.4): the sun swings 60°, shadows sweep the streets, clouds race at 20×, on H13's cheap uniforms, with no change of exposure. In the Checkpoint D recording. ENGINE H13 takes `eras.timelapse`. | Resolved |

### B. The build / modes engineer

| # | Severity | Issue | What I did | Status |
|---|---|---|---|---|
| B1 | blocker | The era-3 sky-bridge deck and ramp appear on top of the hotel balcony | Removed (A6). The Halo's walk-ups are the superstop stairs, which appear inside a solid of the era before in their own groups; option (b) of the review, put on Swimston's centre rather than in the ring so it blocks no route and also hides the concourse from the spawn. 0 appear violations against every walkable top. | Resolved |
| B2 | major | The roof garden (and through it the Halo) has no nav route from the balcony | The roof garden is gone. Every era-3 top is reached by stairs (walk edges): the Halo by the superstop stairs (pad → Halo 58.9 m on foot), the Signal Garden by three stairs (pad → garden 46.9 m). ENGINE rule 25 is restated as the review wrote it: "≤ 1.25 m step (a nav jump edge), stair, ramp, or an inkable wall 1.3–5.5 m tall whose own block holds the top". | Resolved |
| B3 | major | Iron Bridge landings: barriers in the wrong place, open water edges, coplanar deck ends, a 9.3 m group | Rebuilt (§2.6): the bridge leaves the boardwalk on bearing 30° and lands on Bravo's arm. Its deck is at −0.16, 8 cm under the boardwalk (−0.08) and 16 cm under the arm walk, and it runs on until both end corners are over land, so no deck top shares a height with what it meets and no triangle of water is left at either end. Its side rails stop where they reach land; the arm rail's gap (along 31.14 … 39.23) is exactly where the side lines cross the edge, and the era-1 barrier fills exactly that gap, in its own group `landing` (8.1 m long). Seven spans; every group ≤ 7.6 m; spans 5 and 6 are cut at the bridge's z = 0 crossing so every member sits on its group's side. | Resolved |
| B4 | major | River rail arm N runs 6.3 m past the river edge across the Yabby walk | All river rails recomputed from the new outline (§2.6); every rail's two ends lie within 0.08 m of the outline or another rail's end (plan model), and §6.1 #4 / ENGINE T2 add the check. | Resolved |
| B5 | major | Bazookarp Gate: the 15 m ring is one open arc; the apron cover is too short | The turntable benches and buffers are 1.25 m (checker #13 needs 1.2). The base is now a 1.0 m terrace whose north edge carries 1.4 m `roof` planter banks (no hop, no climb) with the steps between them, and banks either side of the turntable: the intended entrances are north, west and east. **Not proved:** the ring's north arc lies in Customs Lane, and the plan model cannot group nav crossings the way checker #7a does, so §4.4 records the fallback the review offered: if #7a counts fewer than 2 or more than 5, the lead waives it for an open, fully visible apron (or more banks close the terrace's ledge). L is 59.4 m (risk lever 6.2 #8 kept for the bot sweep). | Partly: depends on checker #7a |
| B6 | major | The weir terrace has one walk-up; route 2 is a climb | The GPO terrace is lowered to **1.2 m** (steps 0 → 1.2 at 24.0°, piers on 1.2), so its north and east faces are nav jump edges. Pond → weir: route 1 36.5 m, route 2 (the SW ramp, the hotel arch, Hotel Lane, the north face) 40.6 m (1.11×). Weir → Gate: 29.2 m and 42.0 m (1.44×), 6 m apart. The weir room (#15) holds: nearest solid 3.15 m. | Resolved |
| B7 | minor | The Carp Field reads the old era between a group's flip and done | ENGINE H21 now says D = ∞ counts as "no own node" (keep the last value) and `eras-karp.js` tests a carrier stepping onto newly opened ground before done. | Resolved |
| B8 | minor | Floating garden 2's far corner is outside the 12 m drop search | The floating garden is gone. Under the SPEC's revised `restOk` (valid in the current era and every later one, Q19) the Tide Steps, the garden and the Halo are themselves legal rests in era 3, and every point of the Tide Steps is within 3.5 m of the boardwalk. | Resolved |
| B9 | minor | The goods wagon closes nothing | Accepted as era-1 cover, as the review suggested; moved to x −12.5 … −9 so it no longer stands in the arcade's mouth; §2.8, §4.4 and §6.2 no longer claim it opens anything; a bike dock appears in its footprint (A10). | Resolved |
| B10 | minor | The Boathouse deck touches the goods fence; the Plaice is reachable from the river walk | The fence is gone. The Plaice's ways in are listed per era in §4.2 (4 in era 1, 6 from era 2), the Boathouse stair included. | Resolved |
| B11 | minor | Pieces that overlap | Kiosk 232 vs balcony W1: W1 is gone (the kiosk stays at r 17, 1.5 m from the new landing). The cab shelter is gone. Arm cover S vs the balcony stair: that stair is gone. Poster column 202.5 is gone. The plan model's overlap check (exact separating-axis test, equal tops within 8 cm, per era and mode) finds none left except wall-to-parapet corner joints, which §2.6 point 6 resolves with piers. | Resolved |
| B12 | minor | The balcony and verandas are invisible to BossNav | The claim is corrected (§4.5). 1.5 m kerb planters under the balcony's and verandas' edges (BossNav samples 1.45 m) keep the shell out; the plan model leaves 8 m² per half at three spots, listed with their fix and checked in the era-2 boss pictures. | Resolved (pictures to confirm) |
| B13 | minor | The spawn deck's drop sits at nav's limit; the east side ramp ends in a pocket | The deck is 3.3 m and drops 2.3 m onto the 1.0 m terrace. The stable moved to x 24 … 27, so the east side ramp's foot opens onto 6 m of yard. Spawn to mid re-measured: 71.5 m, 6.06 s. | Resolved |
| B14 | minor | Murals and texlib slots don't fit the engine | One image per mural id on one face, each face named (§5.4): the circus floor and the concourse's centre are built as single blocks for the two floor murals, street names and lettering moved to props. Bluestone now needs the standard three texlib slots (the fourth became the shared `PATTERN.pavers`), and §5.3 says the slot table must grow for all three batch-5 stages, a shared change for the batch lead. | Resolved (slot numbers from the batch lead) |
| B15 | minor | Things the builder would have to guess | §2.6 opens with the answers: two stacked blocks per building (0–3 inkable, 3–top `paint:false`); every ramp solid, and the one custom thickness; the railyards as a hidden `roof` embankment at 3.1; the balcony as non-overlapping boxes with posts; every rail with its ends and gaps; piers at wall corners. | Resolved |
| B16 | minor | Numeric slips; load time | Re-measured everything on the new plan: the side zone is 42.7 m from the pad (its centre moved); jump 1 changes 20 groups per half and jump 2 changes 20, about 47 and 76 blocks per half; done is J + 4.0 s (R_max 84.9 + 2 m). Load: step 2 now measures loadMs and draw calls per era on the blockout and decides ENGINE step 4b there, and §6.1 #12 sets a per-era budget of ≤ 60 draw calls for era props, superstructures and the backdrop set. The plan is bigger than revision 1 (10,025 m² of floor in era 3), so the load risk is higher, not lower: §6.2 #4 lists the cuts. | Resolved as a plan; the measurement is step 2 |
