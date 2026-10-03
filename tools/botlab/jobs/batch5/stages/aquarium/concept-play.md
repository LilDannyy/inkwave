# `aquarium` concept: COMPETITIVE PLAY FIRST

One of three independent concepts for the `aquarium` stage (batch 5). The user's words (REQUEST.md, "stages:"): *"an
aquarium. there's a gimmick on this map too, there's clear pipes that can suck you in one end and pop you out the other,
similar to Super Mario 3D World. Some pipes are bi-directional, and some are one way only."* Everything below is built
from how a 4v4 fight flows, then dressed as the place. All numbers are world metres and seconds.

Conventions used throughout:
- Alpha spawns at −Z, Bravo at +Z. Pieces are listed for **Alpha's half**; Bravo's are the 180° turn about Y
  ((x, z) → (−x, −z)). Pieces on the centre are listed once and are self-symmetric.
- Alpha faces +Z, so **Alpha's left is +X** (and Bravo's left is −X).
- The ASCII plans are **true top-down views**: +X to the right, **+Z down the page**, so Alpha's spawn is at the top.
  1 character = 1 m across, 1 row = 2 m down.

---

## 1. Name and identity

**Name options**
1. **Siphon Sound Aquarium** (preferred). A squid moves by jetting water through its siphon; the pipes suck you in and
   jet you out; "the Sound" is the sea inlet the aquarium stands in.
2. **Tubeworm Aquarium**. A sea creature that lives in a tube, for a stage about tubes.
3. **Halo Point Aquarium**. Named for the landmark (the Halo) and the headland it stands on.

**Identity.** Siphon Sound Aquarium stands at the end of a breakwater in a deep sea inlet, an hour down the coast from
Inkopolis. Inklings cannot touch water, so in 1936 its founders built the **Siphon Line**: clear pneumatic tubes that
blow visitors through the great tanks as squids, dry, among the fish. The Line has just been restored, and on reopening
day the aquarium has handed its open-air Ocean Terrace over to a Turf War ("SIPHON LINE · REOPENED", bunting on the
bells). The landmark is **the Halo**, a ring of seawater 12 m across held 7 m up on eight bronze columns over the
central court. Manta rays and a shoal of sardines circle in it against the sky. The columns carry on above the ring as
ribs that meet in a lantern crown 23 m up, so you can see it over the great tanks from anywhere on the stage. A glass
sphere, **the Exchange**, hangs in the Halo's eye where the pipes meet. The two great tanks (the **Kelp Tank** on Alpha's
half, the **Reef Tank** on Bravo's) each have a walk-through tunnel and a pipe through their water. The architecture is
1930s ocean-liner moderne: white render with rounded corners, portholes, brass rails, terrazzo floors. Behind the
public galleries is green-painted back-of-house steel.

---

## 2. The plan

### 2.1 Macro shape

**A figure-of-eight of round galleries whose waist swells into a third ring, with a square annex bolted to the off side
of each outer ring.** From above you see three rounds in a row along Z: Alpha's ring (radius 23 round the Kelp Tank),
the **Halo Court** (radius 22 round the Halo), and Bravo's ring. On each outer ring, the side away from the public
galleries is replaced by a square back-of-house block, the **Pump Hall**. Because the stage is turned 180°, Alpha's
Pump Hall is on −X and Bravo's on +X. So each long side of the outline alternates: on +X, round (Alpha's jelly gallery),
then pinched (the waist), then round (the court), then square (Bravo's Pump Hall). −X is the reverse. Behind each ring a
semicircular spawn balcony sticks out on the axis, with a wing on each side.

This is unlike the existing set:
- Craters is a stadium.
- Spirhalite and Terraces are S shapes.
- Treehills is a diamond.
- Calamari, Halyard and Crossmarket are bands.

It is also unlike the other two batch-5 stages (a skewed X and a crescent). The outline pinches to ±14 m on one side
of each waist while the Pump Hall holds ±25 m on the other, so it never reads as a band or a rectangle.

Footprint: playable x −25 … +25, z −71 … +71. `bounds` { minX −32, maxX 32, minZ −74, maxZ 74 }. About 5,400 m² of
floor, close to Craters after its stretch. The sea (y −1.6) surrounds the stage and comes right up to the outer walls
at the two waists (the seal coves).

### 2.2 The plan in ASCII (Turf War; whole stage)

Legend:

| char | meaning |
|---|---|
| `.` | floor 0 |
| `-` | 1.0, the Feeding Platform |
| `:` | 1.2 / 1.3 |
| `=` | 2.4 |
| `#` | 3.4, spawn balcony |
| `S` | spawn pad |
| `/` | stairs and ramps |
| `O` | great tank (glass, off-limits) |
| `T` | tunnel floor (0) through the tank |
| `o` | solid cover ≥ 0.7 m (columns, pumps, pools, jelly columns, crates…) |
| `~` | sea / outside |

In the notes beside the plan, W means −X and E means +X.

```
   x =  -30      -20       -10        0        10        20        30
     z  |         |         |         |         |         |         |
   -72  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   -70  ~~~~~~~~~~~~~~~~~~~~~~~###############~~~~~~~~~~~~~~~~~~~~~~~   ALPHA: the Rotunda Balcony (3.4)
   -68  ~~~~~~~~~~~~~~~~~~~~~~#################~~~~~~~~~~~~~~~~~~~~~~
   -66  ~~~~~~~~~~~~~::::::::###################::::::::~~~~~~~~~~~~~   Staff Yard (W) / Members' Landing (E)
   -64  ~~~~~~~~~~~~~:::://///#######SSS#######/////::::~~~~~~~~~~~~~
   -62  ~~~~~~~~~~~~~::::::::###################:::::oo:~~~~~~~~~~~~~
   -60  ~~~~~~~~~~~~~:oo:::::###################::::::::~~~~~~~~~~~~~
   -58  ~~~~~~~~~::::::::::::::::::///////::::::::::::::~~~~~~~~~~~~~   Grand Stair
   -56  ~~~~~~~:::::ooo::::::::::::///////::::::::::::::~~~~~~~~~~~~~
   -54  ~~~~~::::::::::::::::::::::///////::::::::::::::~~~~~~~~~~~~~   Arrival Terrace (1.3) + Loading Dock
   -52  ~~~~~::::::::::::::::::::::::::::::::ooo::::::::~~~~~~~~~~~~~
   -50  ~~~~~======.////.:::::::::::::://///////::::::::~~~~~~~~~~~~~
   -48  ~~~~~======.////.............../////////...::::::~~~~~~~~~~~~   Back Walk (0)
   -46  ~~~~~======................................../////.~~~~~~~~~~
   -44  ~~~~~======.............oo.........oo........=======~~~~~~~~~
   -42  ~~~~~======/////..........TTTTTTTTT..........===oo==~~~~~~~~~
   -40  ~~~~~======/////........OOTTTTTTTTTOO........========~~~~~~~~
   -38  ~~~~~======.oooo.......OOOTTTTTTTTTOOO.......======o=~~~~~~~~
   -36  ~~~~~======...........OOOOTTTTTTTTTOOOO......========~~~~~~~~   KELP TANK + Kelp Tunnel
   -34  ~~~~~======...........OOOOTTTTTTTTTOOOO......========~~~~~~~~   W: Pump Hall A + Valve Gallery
   -32  ~~~~~======............OOOTTTTTTTTTOOO.......========~~~~~~~~   E: Jelly inner walk + Jelly Tier
   -30  ~~~~~======/////........OOTTTTTTTTTOO........========~~~~~~~~
   -28  ~~~~~======/////..........TTTTTTTTT..........====oo=~~~~~~~~~
   -26  ~~~~~======..................................=======~~~~~~~~~
   -24  ~~~~~======..oo......oo.............o.......=======~~~~~~~~~~   Kelp Steps (apron) / Ray Pool (1.2)
   -22  ~~~~~======.........................o::ooo:======~~~~~~~~~~~~
   -20  ~~~~~======..........................::ooo======~~~~~~~~~~~~~
   -18  ~~~~~======................o.............=====~~~~~~~~~~~~~~~   Gallery Walk (2.4) through the E waist
   -16  ~~~~~...oo.....oo...oo..................======~~~~~~~~~~~~~~~
   -14  ~~~~~................................o...======~~~~~~~~~~~~~~
   -12  ~~~~~~~~~~~~====.........o.........o.....========~~~~~~~~~~~~   HALO COURT
   -10  ~~~~~~~~~~~========/......o.......o....../========~~~~~~~~~~~   W: Reef Balcony (Bravo's home)
    -8  ~~~~~~~~~~=======//////...oo.....oo...//////=======~~~~~~~~~~   E: Kelp Balcony (Alpha's home)
    -6  ~~~~~~~~~==o=====...///......///......///...=====o==~~~~~~~~~
    -4  ~~~~~~~~~=======............-----............=======~~~~~~~~~
    -2  ~~~~~~~~~=======..........-o-----o-..........=======~~~~~~~~~
     0  ~~~~~~~~==oo====..........---------..........====oo==~~~~~~~~   the Feeding Platform under the Halo
     2  ~~~~~~~~~=======..........-o-----o-..........=======~~~~~~~~~
     4  ~~~~~~~~~=======............-----............=======~~~~~~~~~
     6  ~~~~~~~~~==o=====...///......///......///...=====o==~~~~~~~~~
     8  ~~~~~~~~~~=======//////...oo.....oo...//////=======~~~~~~~~~~
    10  ~~~~~~~~~~~========/......o.......o....../========~~~~~~~~~~~
    12  ~~~~~~~~~~~~========.....o.........o.........====~~~~~~~~~~~~
    14  ~~~~~~~~~~~~~~======...o................................~~~~~
    16  ~~~~~~~~~~~~~~~======..................oo...oo.....oo...~~~~~
    18  ~~~~~~~~~~~~~~~=====.............o................======~~~~~
    20  ~~~~~~~~~~~~~======ooo::..........................======~~~~~
    22  ~~~~~~~~~~~~======:ooo::o.........................======~~~~~
    24  ~~~~~~~~~~=======.......o.............oo......oo..======~~~~~
    26  ~~~~~~~~~=======..................................======~~~~~
    28  ~~~~~~~~~=oo====..........TTTTTTTTT........../////======~~~~~
    30  ~~~~~~~~========........OOTTTTTTTTTOO......../////======~~~~~
    32  ~~~~~~~~========.......OOOTTTTTTTTTOOO............======~~~~~   REEF TANK (Bravo's half, the mirror)
    34  ~~~~~~~~========......OOOOTTTTTTTTTOOOO...........======~~~~~
    36  ~~~~~~~~========......OOOOTTTTTTTTTOOOO...........======~~~~~
    38  ~~~~~~~~=o======.......OOOTTTTTTTTTOOO.......oooo.======~~~~~
    40  ~~~~~~~~========........OOTTTTTTTTTOO......../////======~~~~~
    42  ~~~~~~~~~==oo===..........TTTTTTTTT........../////======~~~~~
    44  ~~~~~~~~~=======........oo.........oo.............======~~~~~
    46  ~~~~~~~~~~./////..................................======~~~~~
    48  ~~~~~~~~~~~~::::::.../////////...............////.======~~~~~
    50  ~~~~~~~~~~~~~:::::::://///////::::::::::::::.////.======~~~~~
    52  ~~~~~~~~~~~~~::::::::ooo::::::::::::::::::::::::::::::::~~~~~
    54  ~~~~~~~~~~~~~::::::::::::::///////::::::::::::::::::::::~~~~~
    56  ~~~~~~~~~~~~~::::::::::::::///////::::::::::::ooo:::::~~~~~~~
    58  ~~~~~~~~~~~~~::::::::::::::///////::::::::::::::::::~~~~~~~~~
    60  ~~~~~~~~~~~~~::::::::###################:::::oo:~~~~~~~~~~~~~
    62  ~~~~~~~~~~~~~:oo:::::###################::::::::~~~~~~~~~~~~~
    64  ~~~~~~~~~~~~~:::://///#######SSS#######/////::::~~~~~~~~~~~~~   BRAVO
    66  ~~~~~~~~~~~~~::::::::###################::::::::~~~~~~~~~~~~~
    68  ~~~~~~~~~~~~~~~~~~~~~~#################~~~~~~~~~~~~~~~~~~~~~~
    70  ~~~~~~~~~~~~~~~~~~~~~~~###############~~~~~~~~~~~~~~~~~~~~~~~
        |         |         |         |         |         |         |
```

(The bubble column in the middle of each tunnel, r 0.8 at (0, ∓35), falls between the 2 m rows and does not show.)

### 2.3 The pieces (Alpha's half + the centre)

| piece | centre x / z | size | floor | purpose |
|---|---|---|---|---|
| **Halo Court** (single) | 0 / 0 | disc r 22 | 0 | Mid. Spacious open floor under the Halo, terrazzo with a brass sea-chart compass rose. |
| **Feeding Platform** (single) | 0 / 0 | disc r 4.5; ramps N and S 3 m wide × 2.5 m | 1.0 | The structure at mid. Bazookarp start, tower start, the Drop's landing. Hop up anywhere (1.0). |
| Feeding troughs ×4 (single) | r 3.0–4.2 at 45°, 135°, 225°, 315° | curved, about 1.5 × 1.2 m | +0.9 on the platform | Cover on the platform; the axes stay open. |
| **The Halo** (single) | 0 / 0 | ring r 6 … 12 | underside 7.0, top 10.0 | Landmark (off-limits roof). Caustic light over the court. Ribs rise to a lantern crown at 23 m. |
| Halo columns ×8 (single) | r 13 at 22.5° + 45°·k: (±12.0, ±5.0), (±5.0, ±12.0) | d 1.0, to 7.0 | — | A ring of cover 10 m apart round the zones and the platform; they stun the boss's charge. |
| Touch pools ×4 (single) | radial at 65°, 115°, 245°, 295°, r 7.5 – 11.0 | 3.5 × 2.2 m | rim 0.9 (roof inside) | Low cover between the zones and the axis (ray and starfish pools). |
| **Kelp Balcony** (Alpha's home overlook; its twin is Bravo's **Reef Balcony** on −x) | r 15 – 22, angle −40° … +40° about +x | 7 m deep, about 30 m along its curve | 2.4 | High ground over the Kelp-side centre zone. Front wall at r 15 is inkable. Glass balustrade (rail) at r 22. Halo Line bell at (19.6, 0). The far end (+40°) is a 2.4 m face over Bravo's Pump Hall front. |
| Balcony stairs ×2 | radial at ±37° from r 15.2 to r 9.6 | 3.6 m wide | 2.4 → 0 | One near each end, down into the court beside the zone (not in it). |
| Brass telescopes ×2 | (19.0, ±6.2) | d 0.9 | 1.2 | Cover at the back of the balcony. |
| **Gallery Walk** | from the Jelly Tier's north end round the east waist to the balcony's south end: polygon (14.5, −26) (21.2, −26) (19.0, −22) (16.5, −19) (14.1, −16.9) (15.1, −16.0) (17.0, −14.0) (18.0, −12.6) (12.3, −8.6) (9.6, −15.5) (11.3, −19.5) (13.4, −22.6) | about 5 m wide | 2.4 | Alpha's high road from its Jelly Tier onto its home balcony; hugs the outer balustrade through the waist. |
| **Ray Pool terrace** | x 7.0 – 12.5, z −23.5 – −18.5 (cut by the Gallery Walk) | about 5 × 5 m | 1.2 | Hop chain 0 → 1.2 → 2.4 onto the Gallery Walk. Ray pool basin on it (rim 0.7). |
| **Kelp Steps** (apron) | x −8.5 – 9.6, z −26.5 – −13 | about 18 × 13 m | 0 | Between the court and the tank. The side zone. The tunnel's front mouth. |
| **Kelp Tank** | 0 / −35 | cylinder r 8.5, glass to 10.0 | — | Great tank (kelp forest), off-limits roof. You fight round it. |
| **Kelp Tunnel** | x −4.5 – 4.5 through the tank, z −42.5 – −27.5 | 9 m wide, 15 m long, clear height 6.5 (acrylic vault) | 0 | The centre lane, through the tank. |
| Bubble column | 0 / −35 | d 1.6, floor to vault | — | Splits the tunnel into two 3.7 m lanes; blocks the axis sightline. |
| **Jelly inner walk** | between the tank (r 8.5) and x 14.5, z −46 – −20 | 6 – 10 m wide | 0 | Alpha's left lane at floor level, along the tank glass. Bazookarp checkpoint CP-J. |
| Moon-jelly drums ×3 | (11.0, −43.0), (12.6, −33.0), (10.4, −27.0) | d 1.4 | 1.2 | Cover along the inner walk. |
| **Jelly Tier** (Moon Jelly Gallery A) | x 14.5 → outer balustrade (lobe r 23), z −44 – −26 | 18 m long, 7 – 8.5 m deep | 2.4 | Alpha's defensive high ground over its left lane. Front wall at x 14.5 is inkable, with jelly windows set in it. |
| Jelly columns ×3 | (18.5, −42.5), (20.8, −37.5), (19.5, −27.5) | d 1.6, 3.4 m tall, glowing | — | Cover on the tier, about 6 m apart; tops off-limits. |
| Tier south stair | x 15 – 19, z −46.5 – −44 | 4 m wide | 1.3 → 2.4 | From the Members' Landing / east wing onto the tier. |
| **Pump Hall A** (back-of-house annex) | x −25 – −8.5, z −50 – −13 | 16.5 × 37 m, open sides, steel canopy at 9.5 (roof) | 0 | Alpha's right lane: close quarters among pumps. The tower track runs along it. Bazookarp checkpoint CP-P. |
| **Valve Gallery** | x −25 – −19.5, z −50 – −18 | 5.5 × 32 m | 2.4 | Steel catwalk along the outer wall: high ground over the Pump Hall. Two pipe bells in its outer wall. The tower rides it. |
| Valve Gallery stairs ×2 | x −19.5 → −14.1 at z −29 and z −41 | 3 m wide | 2.4 → 0 | Inward stairs to the Pump Hall floor. |
| Pumps ×2 | (−16.5, −45), (−16.5, −23.5) | d 2.2 | 2.2 (roof) | Big cover. |
| Pipe racks ×2 | x −18.8 – −14.4 at z −38.2 and z −32.8 | 4.4 × 0.8 m | 1.0 (hop onto) | Low cover either side of CP-P. |
| Pump Hall front cover | forklift (−21.5, −15.5) 1.6 m; crate stack (−14.5, −16.8) 1.4 m; manifold (−9.5, −16.0) 1.2 m; drum pallet (−8.8, −23.6) 1.0 m | — | — | Cover where Alpha's right lane meets the court (under the Reef Balcony's far end). |
| Forklift ramp | x −18.5 – −15, z −50 – −47 | 3.5 m wide | 0 → 1.3 | Pump Hall floor up to the Loading Dock: a walkable route for a slow carrier. |
| **Back Walk** | x −13 – 13, z −50 – −43.5 (and round the tank's back) | 26 × 6.5 m | 0 | Behind the tank. The tunnel's back mouth (the Kelp Gate). Defenders re-form here. |
| Kelp Gate piers ×2 | (±5.6, −44.0) | 1.2 × 1.2 m | 2.0 | Cover beside the tunnel's back mouth. |
| Foyer steps | x 1 – 9, z −50 – −47 | 8 m wide | 0 → 1.3 | Back Walk up to the Arrival Terrace (east side, off the tower track). |
| **Arrival Terrace** | x −13 – 13, z −58.5 – −50 | 26 × 8.5 m | 1.3 | The spawn's forecourt, a level below the balcony. Bazookarp goal (0, 1.3, −51.8). Info desk (8, −52.1) 1.1 m; planters (±9, −56.6) 0.9 m. |
| **Loading Dock** | x −25 – −13, z −58.5 – −50 (outer corner chamfered) | 12 × 8.5 m | 1.3 | Joins the terrace. The tower's last run. Fish-food crates (−17, −56.5) 1.4 m. |
| Staff Yard (west landing) | x −17 – −9, z −66 – −58.5 | 8 × 7.5 m | 1.3 | Bottom of the west ramp. Ice-maker (−15.5, −60.3) 2.0 m. |
| Members' Landing + east wing | x 9 – 17, z −66 – −58.5 and x 13 – 19.6, z −58.5 – −46.5 | — | 1.3 | Bottom of the east stair; leads to the tier's south stair. Membership kiosk (15.4, −61.5) 2.2 m; jelly-nursery bench (16.2, −55) 1.1 m. |
| **Rotunda Balcony** (spawn) | x −9 – 9, z −71 – −58.5, rounded back | 18 × 12.5 m | 3.4 | Spawn pad (0, 3.4, −64.5), barrier 4.2. A 2.1 m drop to the terrace (nobody climbs back up it). |
| Grand Stair | x −3.5 – 3.5, z −58.5 – −53.5 | 7 m wide, 22.8° | 3.4 → 1.3 | Spawn exit 1 (forward). |
| East stair | from x 9 to x 13.8, z −65.75 – −62.25 | 3.5 m wide | 3.4 → 1.3 | Spawn exit 2 (to the Jelly Tier side). |
| West ramp | from x −9 to x −13.8, same z | 3.5 m wide | 3.4 → 1.3 | Spawn exit 3 (to the Pump Hall side). |
| Entrance Rotunda (scenery) | 0 / −80 | drum r 12, 11 m, shallow glass dome | — | What the spawn is built on: the aquarium's front door, with the name in letters. Out of play. |

Spawn exit 4 is the Annex Express pipe (§3).

### 2.4 Heights and what a 1.8 m climb means

Heights: **0** (court, aprons, inner walk, Pump Hall, Back Walk, tunnel), **1.0** (Feeding Platform), **1.2 / 1.3** (Ray
Pool terrace, Arrival Terrace, Loading Dock, landings), **2.4** (balconies, Gallery Walk, Jelly Tier, Valve Gallery),
**3.4** (spawn balcony). There is no playable 3.8: everything above 2.4 is the spawn or off-limits.

A kid's ~1.8 m climb (hop plus ledge assist) works out like this:
- **Hop up anywhere** (a carrier too): every 1.0 / 1.2 / 1.3 edge, and the 1.1 m step from the Loading Dock or the east
  wing to 2.4.
- **Walls** (2.4 faces): the balcony fronts, the Jelly Tier front, the Gallery Walk's inner face, the Valve Gallery
  face. They are all inkable and swim-climbable, and each has stairs.
- **The 2.1 m drop** from the spawn balcony can't be climbed back up.
- **The one hop chain to high ground** is the Ray Pool terrace: 0 → 1.2 → 2.4 onto the Gallery Walk.
- **Off-limits tops** (`roof`): the tanks, pumps (2.2), jelly columns (3.4), Halo columns, telescopes, the Pump Hall
  canopy and all pipes and bells.
- **Pipes add routes, never the only route.** Every inkable area is reachable on foot.

### 2.5 How the 4v4 flows

**Spawn to mid (Long Stages standard).** Straight line from the pad (0, −64.5) to the centre: **64.5 m**. Walking
routes (my estimates from the plan; measure with `spawn-mid.js`):

| route | nav ≈ | swim |
|---|---|---|
| Centre, through the tunnel: Grand Stair, terrace, foyer steps, Back Walk, Kelp Tunnel, Kelp Steps, court | 66 m | 5.6 s |
| Left / Jelly side: east stair, wing, inner walk or Tier → Gallery Walk, waist, court | 75 – 83 m | 6.4 – 7.0 s |
| Right / Pump Hall: west ramp, dock, forklift ramp, Pump Hall floor, court | 80 m | 6.8 s |

Average ≈ 6.3 s. The Annex Express (one-way pipe, §3) puts a respawning player on the Valve Gallery's front end
(−24.6, −21.5) in about 3.3 s.

**The opening.** Each team leaves its balcony three ways and makes first contact at about 5–6 s:
- **Centre:** the tunnels feed the Kelp / Reef Steps.
- **Left:** each team's Gallery Walk reaches its home balcony.
- **Right:** each team's Pump Hall front sits under the *other* team's balcony end. The express riders arrive there
  first and are the opening flank.

**The mid fight (the Halo Court).** Mid is the biggest open space on the stage: 44 m across.
- **Power positions:** the two balconies (2.4). Each covers its centre zone 1–10 m away and the Feeding Platform at
  15 m. Neither can reach the other balcony 40 m away (charger reach is 27 m), so the balconies don't snipe each other.
- **The scramble:** the Feeding Platform (1.0) in the middle.
- **The brawl ring:** the columns and pools.

**Ways into mid from one half** (seven, meeting mid at different points):
1. The Kelp Steps on the axis.
2. The Pump Hall front (wide, on −X for Alpha).
3. The Gallery Walk at 2.4 (on +X for Alpha).
4. The Ray Pool hop chain.
5. The balcony stairs.
6. The Halo Line pipe.
7. The Drop, in the last minute.

Each team has a **home balcony** on its left, joined at 2.4 to its own Jelly Tier, and attacks the **away balcony** on
its right from the court (stair), its Pump Hall front (wall climb) or the Halo Line. Each team's home balcony overlooks
the enemy's Pump Hall front, so a push up your right flank always runs under enemy high ground.

**Lanes and flanks in each half.** Three walking lanes plus the high road, all round the great tank:

| lane | height | character | meets mid at |
|---|---|---|---|
| Left (Jelly) | 0 inner walk / 2.4 Tier | ranged; the defenders' high tier over a 6–10 m lane along the tank glass | the east waist: the Gallery Walk at 2.4, and the floor beside the Ray Pool |
| Centre (Kelp Tunnel) | 0 | a 15 m tunnel, two 3.7 m lanes round the bubble column | the axis, through the side zone |
| Right (Pump Hall) | 0 / 2.4 Valve Gallery | close quarters among pumps; a narrow high catwalk on the outer wall | the west front, a wide floor under the enemy's balcony end |

Cross-links:
- the Back Walk behind the tank;
- the Kelp Steps in front of it;
- the **Kelp Line** pipe through the tank's water, two-way, linking the Jelly Tier and the Valve Gallery.

That pipe is a flank switch no walking route can match: across 40 m in 3.4 s.

**Pushing a base and re-forming.** The tank is a 17 m wall of water between mid and each base: from mid you can't
see the spawn, the terrace or the Back Walk, except down the tunnel's lanes. Defenders spawn behind it and get 35 m of
depth to re-form (balcony → Arrival Terrace → Back Walk). Then they pick the tunnel, their Tier (Members' Landing → south
stair) or their Pump Hall (Staff Yard → dock → forklift ramp), or ride the Annex Express past attackers camping the
terrace. Attackers who get to the Back Walk have three ways to be flanked: both arcs and the express exit.

**Sightlines and where each weapon class shines.**

| weapon class | where it shines | lines (≤ 27 m charger reach) |
|---|---|---|
| Charger, bow, spinner | the balconies (their zone, the Feeding Platform, the near half of the far zone); the Jelly Tier's north end (the side zone, the waist, the apron, 12–18 m); the tunnel's back mouth down its lanes to the Kelp Steps (15–25 m); the Valve Gallery down the Pump Hall | the bubble column blocks the axis; a tank blocks everything behind it; from the spawn balcony you see only the terrace and the Back Walk |
| Shooter, twins, brolly | the court floor, the Kelp Steps, the inner walk | 10–15 m fights round the columns and pools |
| Roller, brush, blade, mitts, blaster | the Pump Hall (pumps every 7–10 m, racks, corners), the tunnel's lanes and mouths, the Gallery Walk's bend at the waist, the Feeding Platform scramble, pipe exits | ≤ 10 m |
| Bucket (slosher) | over the balcony fronts, the Tier front and the pipe racks | lobs over 1–2.4 m cover |

**Cover spacing.** Cover sits every 6–10 m on all open ground:
- **Court:** columns 10 m apart on r 13; pools at r 9; troughs on the platform.
- **Inner walk:** jelly drums about 8 m apart.
- **Tier:** jelly columns about 6 m apart.
- **Pump Hall:** a pump or rack every 6–7 m, plus the front cover.
- **Back Walk and terrace:** the gate piers, bench, desk and planters.

A rough raster check of this plan (floor cells and their distance to the nearest solid ≥ 0.9 m or wall face ≥ 0.9 m)
gives **95 % of the floor within 5 m of cover**. The remaining open spots are the spawn balcony, the tower track's own
lane and the zones, which is on purpose. Confirm with `tools/botlab/tests/cover-map.js` once built.

**Callouts players will use** (the names are fixed per half, whoever is Alpha):

| on the Kelp side (−z) | in the centre | on the Reef side (+z) |
|---|---|---|
| Kelp Tank, Kelp Tunnel, Kelp Steps, Kelp Balcony, Jelly A, Pump Hall A, Valve A | the Halo, the Platform, the pools | Reef Tank, Reef Tunnel, Reef Steps, Reef Balcony, Jelly B, Pump Hall B, Valve B |

The kelp-versus-reef dressing is a `mirror: false` content difference only. The geometry is identical, and it gives
everyone a fixed name for "which half".

---

## 3. The gimmick: the Siphon Line (clear pipes)

### 3.1 The network: seven lines

| line | kind | ends (Alpha's half; the Reef side is the mirror) | length | ride | what it does |
|---|---|---|---|---|---|
| **Kelp Line** (Reef Line on Bravo's side) | two-way | Jelly Tier bell (15.2, 2.4, −37) ⇄ Valve Gallery bell (−24.6, 2.4, −37) | 48.6 m | 2.7 s | Rises from the Tier's front edge, runs *through the tank's water* at y 8.0 (above the tunnel's vault), crosses over Pump Hall A under its canopy, and comes down inside the outer wall. Links a loop's two flanks across the tank. |
| **Jelly Lift A** (B) | one-way up | inner-walk bell set in the Tier's front wall (14.3, 0, −31) → nozzle in the Tier floor (17.5, 2.4, −31) | 3.8 m | 0.2 s | A glass elevator: retake the Tier from below without the stairs 13 m away. |
| **Annex Express A** (B) | one-way out of spawn | balcony bell (−8.6, 3.4, −68.5) → nozzle in the Valve Gallery's outer wall (−24.6, 2.4, −21.5) | 62.5 m | 2.6 s (express: 24 m/s) | Spawn exit 4, at y 11.2 over the Pump Hall canopy. A safe flank exit when the terrace is camped; the opening flank. |
| **Halo Line** (single) | two-way, with a junction | Kelp Balcony bell (19.6, 2.4, 0) ⇄ Reef Balcony bell (−19.6, 2.4, 0), through the Halo's water at y 8.5 and the Exchange at (0, 9.5, 0) | 55.8 m | 3.1 s | The rotation between the two balconies and the two centre zones, high over mid. |
| **The Drop** (Halo Line's third branch) | one-way down, **Feeding Time only** | the Exchange → nozzle (0, 5.2, 0) above the Feeding Platform | 2.7 m + a 4.2 m fall | 0.2 s + 0.55 s fall | In the last minute, a way straight down into the middle of mid. |

That makes three two-way lines (the Kelp Line, the Reef Line, the Halo Line), four one-way lines (two lifts, two
expresses) plus the Drop branch: 15 mouths in all. Every exit is at least 31 m from either spawn pad. No exit is inside
a zone, on a checkpoint or goal, on a spawn balcony, or on a tower track's footprint. The Drop's nozzle hangs above the
tower's headroom at the start.

### 3.2 The rules

1. **Who rides.** Any squidkid whose body is free: the same test as a super jump (`canSuperJump()`: alive, not super
   jumping, no body-owning special running). Kid or squid form both work.
   - **The Bazookarp carrier can't ride:** the bell flashes red with a buzzer, and the HUD says "Too heavy for the
     Siphon Line!".
   - **Shots, bombs, sub weapons and specials can't ride.** Each bell's mouth is covered by a shimmering air curtain:
     shots and bombs splash on it like on glass; only squidkids pass.
2. **Getting in.** Run, swim or squid-hop **into** a bell: you must be inside its 1.4 m mouth disc, moving at ≥ 2 m/s
   within 45° of its axis, for 0.1 s. Standing beside a bell or strafing past it never takes you in. Every bell is set
   against a wall, a balustrade or a tier front, never on a through-route.
   - **The suck** lasts **0.3 s**: you are drawn into the bell as a squid and can't act. You can still be hit; you
     become untouchable only once you are inside.
3. **The ride.**
   - **Speed:** 18 m/s along the line (the Annex Expresses 24 m/s), eased over the first and last 0.2 s.
   - **No damage:** riders take none. The glass stops shots and ink, and blasts don't reach inside.
   - **Nothing to do:** riders can't shoot, ink, refill or charge their special.
   - **Any number can ride.** Riders going opposite ways on a two-way line pass each other.
   - **The camera** chases the rider 3 m behind and 1.5 m above along the tube. Through a tank it goes into the water
     (blue grade, bubbles, kelp or coral sweeping past). In the last 0.8 s it swings to look out of the exit, so the
     rider sees what is waiting and can aim on the pop.
4. **The exit pop.** A rider leaves along the bell's opening at 6 m/s plus 5 m/s up, a short arc landing about 2 m out.
   - **Lift nozzles and the Drop** pop straight up or straight down.
   - **Air control is normal,** and the rider can fire from 0.2 s after the pop.
   - **No protection after the pop.** The landing paints a 1.2 m splat of the rider's ink, so they can dive at once.
   - **Two riders arriving together** pop 0.15 s apart.
   - **Anyone standing in the pop zone** is shoved aside by the stage kit's `shoveActor`, never into a wall or the sea.
5. **Cooldown.** After a pop, no bell takes you for **2.5 s**. The ring of the nearest bell shows a small pie timer. One-way
   lines can't be ping-ponged at all.
6. **The telegraph** (the anti-ambush rule, both ways).
   - When a rider is committed (after the 0.3 s suck), the **exit bell's ring lights in the rider's team colour** and
     plays a rising bubbling gurgle. Everyone hears it in 3D within 30 m.
   - The pipe's light beads run in the rider's team colour ahead of them, so the whole line glows: you can see the
     rider and where they are going from across the map.
   - The warning lasts as long as the ride: 2.7 s on a Kelp Line, 2.6 s on an express, about 1.4 s from the Exchange to
     a balcony.
7. **The Exchange junction** (Halo Line). Outside Feeding Time riders go straight through to the other balcony.
   - **During Feeding Time** a rider entering the Exchange circles the sphere once (0.6 s). The HUD says "↓ SQUID to
     drop". Holding the squid button (or the stick back) takes the Drop; otherwise they carry on.
   - The exit ring of the chosen branch lights when the choice is made.
8. **No blocking the mouths.** Each bell sits in a 1.5 m brass apron ring on the floor. No placed device (sprinkler,
   beacon, Drip Curtain, Lurk Mine, Surf N' Turf buoy, turret) can be placed or land inside an apron: it slides off, or
   the throw says "Can't place here". Players may stand there, and riders shove them.
9. **Splatted at the mouth.** A player splatted during the 0.3 s suck is splatted normally. The match ending mid-ride
   pops the rider at the exit.

### 3.3 How a one-way line reads differently from a two-way line

The shapes carry the meaning first, so it works in every team colour and for colour-blind players. The pipes' own
lights are always warm white; team colour appears on a pipe only while someone rides it.

| | two-way (Kelp / Reef Lines, Halo Line) | one-way (lifts, expresses, the Drop) |
|---|---|---|
| ends | two identical **intake bells**: a 1.6 m flared brass trumpet, a white ring light, an open air curtain | IN: the same intake bell. OUT: a narrow **nozzle with a clear hinged flap**, shut, with a dark ring and no curtain. Walking into it is just walking into a wall. |
| glass | plain straight ribs | **spiral ribs**: a corkscrew that visibly turns in the flow direction |
| lights inside | bead lights pulse **from the middle out to both ends** | chevron beads run **one way, in → out**, all the time |
| floor apron | "⇄ RIDE" and the far end's name | IN: "▶ IN · JELLY TIER" etc. OUT: "OUT ONLY" with a bar |
| minimap / TAB map | thin white line, a dot at each end | thin white line, an arrowhead at the OUT end |

### 3.4 Timeline over a match

| when | what happens |
|---|---|
| intro / countdown | Bells spin up; the beads run white. PA: "Welcome to Siphon Sound. The Siphon Line is open." |
| GO | Every line runs except the Drop: its valve iris under the Exchange is shut, with a dark ring. |
| 70 s left (all modes) | PA chime and HUD: "FEEDING TIME IN 10 s: the Exchange opens a drop to the Feeding Platform". A searchlight beam shines from the Exchange onto the Platform. The keeper's bell rings at 63, 62 and 61 s. |
| 60 s left | **FEEDING TIME.** The Drop opens; its ring turns white. Food clouds drift down through the Halo and the mantas and sardines swirl and feed (visual only). Stays open to the end and through overtime. |
| match end | Riders still in a pipe pop at their exit. |

Feeding Time is driven by the match clock through `StageClock` (the host's clock), so it is identical on every screen
and for a late joiner. It is off in Boss Battle (§4).

### 3.5 The set pieces

1. **The Halo Line.** A squid in team colour streaks up out of a balcony bell, through the ring of seawater among
   mantas, round the Exchange and down the other side. Everyone in the court sees it, and the far bell glows.
2. **The Kelp and Reef Lines.** The ride through a 10 m-tall tank of kelp (or coral) at 8 m, over the tunnel and the
   players walking under the water. From the Tier and the Valve Gallery you watch riders slide through the fish.
3. **The Drop.** In the last minute someone falls out of the sky onto the Feeding Platform in a bubble that bursts on
   landing (a 1.4 m splat, no hard-landing slowdown).
4. **The Annex Express.** A long glass tube over the Pump Hall canopy, the fastest thing on the stage, the visible tell
   that defenders are coming round the right flank.

### 3.6 What both teams do with it

Everything is mirrored, so every use is open to both teams.
- **Rotate between the two centre zones** (Zone Control) or the two balconies: the Halo Line in about 3.4 s,
  untouchable, landing on the far balcony's high ground behind whoever holds it.
- **Switch flanks inside a loop:** the Kelp/Reef Line, defending your own checkpoint pair or splitting the enemy's
  defence when attacking.
- **Retake your Tier:** the Jelly Lift.
- **Break a spawn camp:** the Annex Express pops you out behind the campers, on your Pump Hall's front.
- **Escape:** dive into a nearby bell at low health. The exit is telegraphed, so the enemy can meet you there.
- **Ambush or camp an exit:** watch a ring light up and trade with the arriving rider. Counterplay: the rider sees out,
  arcs, can shoot within 0.2 s, and lands in their own ink.
- **Feeding Time:** drop straight into the middle of mid.

### 3.7 How it is announced

- **Match start, 6 s:** "SIPHON LINE · run into a pipe mouth to ride · ⇄ both ways · ▶ one way".
- **Within 3 m of a bell, facing it:** a small prompt with the destination name. Examples: "⇄ VALVE GALLERY",
  "▶ JELLY TIER", "▶ VALVE GALLERY (express)", "OUT ONLY".
- **While riding:** "→ VALVE GALLERY" and a thin progress bar.
- **Feeding Time:** the 70 s and 60 s banners, the PA, the bell and the searchlight.
- **Sound** (synthesised in code):
  - suck: rising filtered "shloop"
  - ride: hollow glassy whoosh with Doppler as it passes you
  - exit warning: rising bubbling gurgle
  - pop: cork pop and splash
  - Feeding Time: three ship's-bell strikes and the PA's two-tone chime
  - carrier refused: a low buzzer
- **Minimap:** the lines as in §3.3. An occupied line flashes the rider's team colour, with a dot moving along it, for
  everyone: the pipes are glass, so the rider is in plain sight.

### 3.8 Fairness

- **Symmetry:** rotational; the only line on the centre is the Halo Line, which is self-symmetric.
- **No surprise exits:** the exit telegraph runs the whole ride.
- **Riders are protected only inside the glass:** not in the 0.3 s suck, not after the pop.
- **No spam:** a 2.5 s cooldown, and one-way lines can't be ridden back.
- **No skipping the walk to a goal:** carriers are refused.
- **Nothing rides but squidkids:** no projectiles, no devices; no devices on the aprons.
- **Every exit can be left:** each has at least 2 ways off and cover within 3 m.
  - Kelp bells: the Tier (stair, Gallery Walk, drop) and the Gallery (two stairs, dock).
  - Halo bells: the balcony's two stairs and its front wall.
  - Lift nozzle: on the Tier.
  - Express nozzle: the Gallery's stairs and the climb face.
- **The time saved is small:** a Kelp Line saves about 2 s over walking round, the Halo Line about 1 s over crossing the
  court, the express about 1.5 s. What the pipes buy is a new route and safety in transit, not raw speed. Walking
  routes stay the main way to move.

### 3.9 Ink and turf

- Pipes, bells, nozzles, the Exchange and the air curtains are glass or brass: never inkable (`noPaint`), off-limits
  tops.
- The floor round them, including the brass apron rings (a floor decal), inks normally.
- The pipes cover, remove and reveal no ground: they are static.
- The pop splat (1.2 m) and the Drop landing (1.4 m) count as the rider's turf, like a super-jump landing.
- Tanks and the Halo are off-limits glass; the tunnels' floors ink normally. Turf counts as on any stage.

### 3.10 Bots

- **Nav.** Each line adds directed **pipe links** to the nav graph: from the floor node in front of the IN bell to the
  landing node at the exit.
  - **Cost** = (0.3 + length ÷ speed + 0.4) s × 11.8 m/s, plus a risk term of 3 m.
  - **Direction:** two-way lines add both directions; one-way lines only theirs.
  - **The Drop's link** exists only during Feeding Time: a nav layer switched on by the stage clock, like the movers'
    blocked layer.
  - **Riding:** the bot's path follower walks into the bell; the actor's pipe state takes over; the bot resumes after
    the pop.
- **Tactics** (each a small hook in `bots.js`):
  1. A bot whose goal is across a tank takes the Kelp/Reef Line when A* says so.
  2. Zone Control: a bot sent to the other centre zone takes the Halo Line.
  3. A bot at low health being chased dives into a bell within 6 m, unless it has seen an enemy near that exit in the
     last 3 s.
  4. Feeding Time: a bot heading for the centre takes the Drop if it hasn't seen 2+ enemies on the Platform.
  5. A respawned bot on a camped balcony (2+ enemies seen on the terrace) takes the Annex Express.
- **No wall-hacks.** A bot avoids a line only if *it* saw enemies near the exit. When it hears an enemy's exit gurgle
  within 20 m and has line of sight to that bell, it aims at the pop point for up to 1.5 s, scaled by difficulty.
- **Carrier bots** never use pipe links (filtered by a carrier flag).
- **A new page test** `tools/botlab/tests/pipes.js` checks: rides on both lines, refusals (carrier, bombs), one-way
  refusal, telegraph timing, cooldown, the Drop only in Feeding Time, bots using links, and no stuck bots at bells.

### 3.11 Online

- **The owner simulates the ride.** It is an actor state like a super jump (`pipeState`). On entering, it emits a record
  `['pp', actor, line, end, t0]`; at the junction `['pj', actor, branch, t]`.
- **Every other client plays the same ride.** Lines have fixed speeds and paths, so they reproduce the ride from `t0`
  with no per-frame traffic: the squid in the tube, the beads, the exit ring, invulnerability.
- **Damage:** riders are untouchable on every screen. Damage is judged where the victim is authoritative, as it is
  today.
- **Feeding Time** comes from `StageClock`.
- **Late joiners** rebuild riders in transit from the records. A host change hands nothing over: everything is
  deterministic.
- **Two-client test:** `tools/botlab/tests/net-pipes.cjs`.

### 3.12 Engine and data

One new module, **`src/game/pipes.js`** (`StagePipes`, built like `StageMovers` / `StagePods`). It reuses
`stageKit.js` (StageClock, shoveActor, buildLook) and reads `LAYOUT.pipes`. Tagged hook-ins `[b5-aquarium]`:
- `actor.js`: the ride state, next to `superJumpState`.
- `nav.js`: an `addLink()` for pipe edges.
- `bots.js`: links and tactics.
- `netmatch.js`: the two records.
- `minimap.js`: lines and riders.
- `hud.js`: prompts and banners.
- `src/audio/`: five synthesised sounds.

The data, with real numbers (Alpha's frame; `mirror: true` makes the Reef side):

```js
LAYOUT.pipes = {
  mirror: true,
  speed: 18, suck: 0.3, pop: [6, 5], cooldown: 2.5, apron: 1.5,
  feeding: { at: 60, warn: 10, branch: 'drop' },          // s left in the match
  modes: { boss: { feeding: false } },
  lines: [
    { id: 'kelp', kind: 'two', names: ['KELP LINE', 'REEF LINE'],
      path: [[15.2, 2.8, -37], [13.6, 3.4, -37], [11.6, 8.0, -37], [-25.0, 8.0, -37], [-25.0, 3.4, -37], [-24.6, 2.8, -37]],
      ends: [{ at: [15.2, 2.4, -37], face: [1, 0, 0], name: 'JELLY TIER' }, { at: [-24.6, 2.4, -37], face: [1, 0, 0], name: 'VALVE GALLERY' }] },
    { id: 'jelly-lift', kind: 'one',
      path: [[14.3, 0.8, -31], [15.3, 0.8, -31], [16.2, 1.8, -31], [17.5, 2.4, -31]],
      in: { at: [14.3, 0, -31], face: [-1, 0, 0] }, out: { at: [17.5, 2.4, -31], pop: 'up', name: 'JELLY TIER' } },
    { id: 'express', kind: 'one', speed: 24,
      path: [[-8.6, 4.2, -68.5], [-9.8, 4.6, -68.5], [-10.5, 11.2, -67.5], [-25.2, 11.2, -21.5], [-25.2, 3.4, -21.5], [-24.6, 2.8, -21.5]],
      in: { at: [-8.6, 3.4, -68.5], face: [1, 0, 0] }, out: { at: [-24.6, 2.4, -21.5], face: [1, 0, 0], flap: true, name: 'VALVE GALLERY' } },
    { id: 'halo', kind: 'two', single: true,
      path: [[19.6, 2.8, 0], [20.6, 3.4, 0], [20.6, 8.5, 0], [6.0, 8.5, 0], [1.6, 9.5, 0], [-1.6, 9.5, 0], [-6.0, 8.5, 0], [-20.6, 8.5, 0], [-20.6, 3.4, 0], [-19.6, 2.8, 0]],
      ends: [{ at: [19.6, 2.4, 0], face: [-1, 0, 0], name: 'KELP BALCONY' }, { at: [-19.6, 2.4, 0], face: [1, 0, 0], name: 'REEF BALCONY' }],
      junction: { at: [0, 9.5, 0], r: 1.6, branch: { id: 'drop', path: [[0, 7.9, 0], [0, 5.2, 0]], out: { at: [0, 5.2, 0], pop: 'down', name: 'FEEDING PLATFORM' }, open: 'feeding' } } },
  ],
};
```

Colliders:
- Each straight pipe segment below 3.5 m gets an OBB collider (`roof: true`, `noPaint`). It stops moves and shots; mark
  it see-through for sight if `botSight` supports a glass flag.
- Segments higher up are visual, with an OBB for shots only.
- The Halo, tanks and canopy are ordinary `roof` blocks.

---

## 4. Every mode on this layout

### 4.1 Turf War

The whole stage. Paintable floor is about 5,400 m²:

| height | area |
|---|---|
| 0 | ~2,550 m² |
| 1.0 – 1.3 | ~1,050 m² |
| 2.4 | ~1,150 m² |
| 3.4 | ~440 m² |
| stairs | ~270 m² |

The balconies and Tiers are big paint, so high ground is worth holding. All lines run, and Feeding Time comes in the
last 60 s (in a 90 s match it starts 30 s in).

### 4.2 Zone Control

- **Centre: two zones that must both be held.** The **Kelp-side pool** zone and the **Reef-side pool** zone are annular
  sectors r 5.5 – 14.5 m about the centre, angles −25° … +25° about +X and about −X. Each is **78.5 m²**, flat at y 0
  (zone y0 −0.2, y1 0.4).
  - **Cover inside:** two Halo columns in each (at r 13, ±22.5°).
  - **High ground:** each zone sits under one balcony, 0.5 m from its front wall, and is attacked from it.
  - **Ways in:** from the Feeding Platform side, from both balcony stairs beside it, and along the court floor from
    both halves (the strips between the zone, the stairs and the pools).
  - **The tension:** each team's home balcony favours one zone, so to hold *both* you must take the away balcony.
  - **The gimmick's job:** the Halo Line runs balcony to balcony over both zones in about 3.4 s (the rotation pipe).
    Feeding Time's Drop lands on the Platform between the zones, exactly when the last 30 s lock play onto the centre.
- **Side zone (Alpha's; Bravo's is the mirror): the Kelp Steps.**
  - **Where:** x −5 … 5, z −25 … −17, **80 m²**, flat 0, right in front of the tunnel's mouth. 21 m from mid and 43.5 m
    from Alpha's pad, so closer to mid as the user wants.
  - **Cover inside:** two kelp planters (0.8 m) at (3.2, −21) and (−3.2, −18).
  - **Cover beside it:** the bench wall (6.1, −23.7) and the info plinth (−8, −21).
  - **Ways in:** the tunnel (from the defenders' side), the court (three ways), the Ray Pool terrace (1.2), the Pump
    Hall front.
  - **High ground over it:** the Gallery Walk at the waist (2.4, 6–10 m away) and the Ray Pool terrace (1.2). No pipe
    end is near it.

Objective plan (Alpha's half and mid). `Z` centre zones, `z` side zones, `G` Bazookarp goal, `C` Bazookarp
checkpoints, `K` Kelp Line bells, `L` / `l` Jelly Lift in / out, `E` / `e` Annex Express in / out (the `e` at the
bottom right is Bravo's), `H` Halo Line bells, `X` the Exchange overhead and the Drop's landing:

```
   x =  -30      -20       -10        0        10        20        30
     z  |         |         |         |         |         |         |
   -70  ~~~~~~~~~~~~~~~~~~~~~~~###############~~~~~~~~~~~~~~~~~~~~~~~
   -68  ~~~~~~~~~~~~~~~~~~~~~E#################~~~~~~~~~~~~~~~~~~~~~~
   -66  ~~~~~~~~~~~~~::::::::###################::::::::~~~~~~~~~~~~~
   -64  ~~~~~~~~~~~~~:::://///#######SSS#######/////::::~~~~~~~~~~~~~
   -62  ~~~~~~~~~~~~~::::::::###################:::::oo:~~~~~~~~~~~~~
   -60  ~~~~~~~~~~~~~:oo:::::###################::::::::~~~~~~~~~~~~~
   -58  ~~~~~~~~~::::::::::::::::::///////::::::::::::::~~~~~~~~~~~~~
   -56  ~~~~~~~:::::ooo::::::::::::///////::::::::::::::~~~~~~~~~~~~~
   -54  ~~~~~::::::::::::::::::::::///////::::::::::::::~~~~~~~~~~~~~
   -52  ~~~~~:::::::::::::::::::::::::G::::::ooo::::::::~~~~~~~~~~~~~
   -50  ~~~~~======.////.:::::::::::::://///////::::::::~~~~~~~~~~~~~
   -48  ~~~~~======.////.............../////////...::::::~~~~~~~~~~~~
   -46  ~~~~~======................................../////.~~~~~~~~~~
   -44  ~~~~~======.............oo.........oo........=======~~~~~~~~~
   -42  ~~~~~======/////..........TTTTTTTTT..........===oo==~~~~~~~~~
   -40  ~~~~~======/////........OOTTTTTTTTTOO........========~~~~~~~~
   -38  ~~~~~K=====.oooo.......OOOTTTTTTTTTOOO...C...K=====o=~~~~~~~~
   -36  ~~~~~K=====...C.......OOOOTTTTTTTTTOOOO......K=======~~~~~~~~
   -34  ~~~~~======...........OOOOTTTTTTTTTOOOO......========~~~~~~~~
   -32  ~~~~~======............OOOTTTTTTTTTOOO......L==ll====~~~~~~~~
   -30  ~~~~~======/////........OOTTTTTTTTTOO.......L==ll====~~~~~~~~
   -28  ~~~~~======/////..........TTTTTTTTT..........====oo=~~~~~~~~~
   -26  ~~~~~======..................................=======~~~~~~~~~
   -24  ~~~~~======..oo......oo..zzzzzzzzzzzo.......=======~~~~~~~~~~
   -22  ~~~~~e=====..............zzzzzzzzzzzo::ooo:======~~~~~~~~~~~~
   -20  ~~~~~======..............zzzzzzzzzzz.::ooo======~~~~~~~~~~~~~
   -18  ~~~~~======..............zzozzzzzzzz.....=====~~~~~~~~~~~~~~~
   -16  ~~~~~...oo.....oo...oo..................======~~~~~~~~~~~~~~~
   -14  ~~~~~................................o...======~~~~~~~~~~~~~~
   -12  ~~~~~~~~~~~~====.........o.........o.....========~~~~~~~~~~~~
   -10  ~~~~~~~~~~~========/......o.......o....../========~~~~~~~~~~~
    -8  ~~~~~~~~~~=======//////...oo.....oo...//////=======~~~~~~~~~~
    -6  ~~~~~~~~~==o=====Z..///......///......///..Z=====o==~~~~~~~~~
    -4  ~~~~~~~~~=======.ZZZZZ......-----......ZZZZZ.=======~~~~~~~~~
    -2  ~~~~~~~~~=======ZZZZZZZZZ.-o-----o-.ZZZZZZZZZ=======~~~~~~~~~
     0  ~~~~~~~~==Ho====ZZZZZZZZZ.----X----.ZZZZZZZZZ====oH==~~~~~~~~
     2  ~~~~~~~~~=======ZZZZZZZZZ.-o-----o-.ZZZZZZZZZ=======~~~~~~~~~
     4  ~~~~~~~~~=======.ZZZZZ......-----......ZZZZZ.=======~~~~~~~~~
     6  ~~~~~~~~~==o=====Z..///......///......///..Z=====o==~~~~~~~~~
     8  ~~~~~~~~~~=======//////...oo.....oo...//////=======~~~~~~~~~~
    10  ~~~~~~~~~~~========/......o.......o....../========~~~~~~~~~~~
    12  ~~~~~~~~~~~~========.....o.........o.........====~~~~~~~~~~~~
    14  ~~~~~~~~~~~~~~======...o................................~~~~~
    16  ~~~~~~~~~~~~~~~======..................oo...oo.....oo...~~~~~
    18  ~~~~~~~~~~~~~~~=====.....zzzzzzzzozz..............======~~~~~
    20  ~~~~~~~~~~~~~======ooo::.zzzzzzzzzzz..............======~~~~~
    22  ~~~~~~~~~~~~======:ooo::ozzzzzzzzzzz..............=====e~~~~~
        |         |         |         |         |         |         |
```

### 4.3 Tower Command

**"The visitor route: up the middle, through the tunnel, round the back, back down the Pump Hall, up onto the Valve
Gallery."** Two checkpoints. The track is drawn from the centre to Alpha's goal on Bravo's side (z > 0), Bravo-frame
coordinates as `LAYOUT.tower` takes them. Straight runs, square corners, one heading all match (the stage's X/Z grid,
`yaw: 0`).

| # | run | from → to (x, z) | floor | length | notes |
|---|---|---|---|---|---|
| 1 | north up the axis | (0, 0) → (0, 21) | 1.0, then down the Platform's 3 m-wide north ramp (1.0 → 0 over 2.5 m, z 4.5 – 7.0), then 0 | 21.0 | Starts on the Feeding Platform `[0, 1.0, 0]`; under the Halo (7.0 clear). Passes between the columns at x ±5 (3.25 m clear) and the touch pools (0.9 m clear of the footprint at their nearest corner). |
| 2 | jog east | (0, 21) → (2.65, 21) | 0 | 2.65 | In front of the Reef Tunnel; the apron's planters stay ≥ 1.1 m off. |
| 3 | through the Reef Tunnel's east lane | (2.65, 21) → (2.65, 46.5) | 0 | 25.5 | Tunnel clear height 6.5; bubble column 0.6 m off the platform's west edge; tunnel wall 0.6 m off its east edge. **Checkpoint 1 at (2.65, 35)**, in the tunnel beside the bubble column. |
| 4 | east along the Back Walk | (2.65, 46.5) → (11.75, 46.5) | 0 | 9.1 | Behind the tank; 1.75 m short of the terrace's 1.3 face. |
| 5 | south down Pump Hall B (the detour loop) | (11.75, 46.5) → (11.75, 20) | 0 | 26.5 | Between the tank and the pump row; nothing within 0.6 m of the 2.5 m footprint. |
| 6 | east, **climb** onto the Valve Gallery | (11.75, 20) → (22, 20) | 0 → **climb 2.4** at x 19.5 → 2.4 | 10.25 | The deliberate climb, up the gallery's north face. |
| 7 | north along the Valve Gallery | (22, 20) → (22, 52.5) | 2.4 → **drop 1.1** at z 50 → 1.3 (Loading Dock) | 32.5 | **Checkpoint 2 at (22, 26)**, on the Gallery. The two bells in the outer wall stand 0.95 m off the platform; the rail on the inner edge 1.25 m. |
| 8 | west along the Loading Dock and Arrival Terrace | (22, 52.5) → (6, 52.5) | 1.3 | 16.0 | **Goal (6, 1.3, 52.5)**, 13.4 m from Bravo's pad, outside the barrier, in sight of the spawn balcony. |

The data:
- **Total 143.5 m.** Speed = 143.5 ÷ 80 = 1.79 m/s with one rider: 100 s to the goal with two 10 s checkpoints. That is
  in line with Lockgate (145), Nantai (144) and Treehills (156).
- **Checkpoints** at s = 37.7 m (26 %) and s = 101 m (70 %).
- `path: [[0, 1.0, 0], [0, 21], [2.65, 21], [2.65, 46.5], [11.75, 46.5], [11.75, 20], [22, 20], [22, 52.5], [6, 52.5]]`
- `checkpoints: [[2.65, 35], [22, 26]]`, `yaw: 0`.
- The two sides' tracks share only the start.

**Headroom and clutter, solved in the layout (no Tower-only pieces needed):**
- **Under the Halo:** 7.0 clear over 1.0 / 0.
- **The Drop's nozzle** at 5.2 sits 0.56 m above the pillar cap of a tower parked at the start.
- **In the tunnel:** a 6.5 m vault. I chose this height so riders *and their cameras* stay clear, the same standard
  Calamari's overpass was raised to (5.9 m).
- **Pipes overhead:**
  - the Reef Line at 8.0 over runs 5 and 7: 5.6 m over the Gallery;
  - the express at 11.2;
  - the Pump Hall canopy at 9.5: 7.1 m over the Gallery.
- **Kept off the 2.5 m footprint plus 0.6 m:** the pumps at x 16.5, the pipe racks at x 14.4 – 18.8, the Valve Gallery
  stairs (ending at x 14.1), the forklift, crates, drum pallet, the info desk and the planters.

The schematic below cuts these 0.6 m margins finer (the pipe racks and the apron planters show within a cell of the
track at 1 m). The builder keeps the 0.6 m and confirms with `tower-check.cjs`.

What the track does to the fight:
- **Checkpoint 1** stops the tower in the enemy tunnel for 10 s: fights at both mouths and in the other lane.
- **The U-turn** brings the tower back past the enemy's Pump Hall front, where the defenders' express pops out.
- **Checkpoint 2** is on the Valve Gallery, with the Reef Line bell 11 m ahead and the express nozzle 4.5 m behind:
  the pipe-heavy final stand.
- **Riders on the tower can't enter pipes,** and no bell is on the track.

Tower plan (Bravo's half; `x` the drawn track, `y` its mirror, `1` `2` checkpoints, `G` goal):

```
   x =  -30      -20       -10        0        10        20        30
     z  |         |         |         |         |         |         |
     0  ~~~~~~~~==oo====..........---xxx---..........====oo==~~~~~~~~
     2  ~~~~~~~~~=======..........-o-xxx-o-..........=======~~~~~~~~~
     4  ~~~~~~~~~=======............-xxx-............=======~~~~~~~~~
     6  ~~~~~~~~~==o=====...///......xxx......///...=====o==~~~~~~~~~
     8  ~~~~~~~~~~=======//////...oo.xxx.oo...//////=======~~~~~~~~~~
    10  ~~~~~~~~~~~========/......o..xxx..o....../========~~~~~~~~~~~
    12  ~~~~~~~~~~~~========.....o...xxx...o.........====~~~~~~~~~~~~
    14  ~~~~~~~~~~~~~~======...o.....xxx........................~~~~~
    16  ~~~~~~~~~~~~~~~======........xxx.......oo...oo.....oo...~~~~~
    18  ~~~~~~~~~~~~~~~=====.........xxx.o................======~~~~~
    20  ~~~~~~~~~~~~~======ooo::.....xxxxx.......xxxxxxxxxxxxx==~~~~~
    22  ~~~~~~~~~~~~======:ooo::o....xxxxx.......xxx......=xxx==~~~~~
    24  ~~~~~~~~~~=======.......o.......xx....oo.xxx..oo..=xxx==~~~~~
    26  ~~~~~~~~~=======................xx.......xxx......=x2x==~~~~~
    28  ~~~~~~~~~=oo====..........TTTTTTxxT......xxx./////=xxx==~~~~~
    30  ~~~~~~~~========........OOTTTTTTxxTOO....xxx./////=xxx==~~~~~
    32  ~~~~~~~~========.......OOOTTTTTTxxTOOO...xxx......=xxx==~~~~~
    34  ~~~~~~~~========......OOOOTTTTTTx1TOOOO..xxx......=xxx==~~~~~
    36  ~~~~~~~~========......OOOOTTTTTTx1TOOOO..xxx......=xxx==~~~~~
    38  ~~~~~~~~=o======.......OOOTTTTTTxxTOOO...xxx.oooo.=xxx==~~~~~
    40  ~~~~~~~~========........OOTTTTTTxxTOO....xxx./////=xxx==~~~~~
    42  ~~~~~~~~~==oo===..........TTTTTTxxT......xxx./////=xxx==~~~~~
    44  ~~~~~~~~~=======........oo......xx.oo....xxx......=xxx==~~~~~
    46  ~~~~~~~~~~./////................xxxxxxxxxxxx......=xxx==~~~~~
    48  ~~~~~~~~~~~~::::::.../////////...............////.=xxx==~~~~~
    50  ~~~~~~~~~~~~~:::::::://///////::::::::::::::.////.=xxx==~~~~~
    52  ~~~~~~~~~~~~~::::::::ooo:::::::::::xGxxxxxxxxxxxxxxxxx::~~~~~
    54  ~~~~~~~~~~~~~::::::::::::::///////::::::::::::::::::::::~~~~~
    56  ~~~~~~~~~~~~~::::::::::::::///////::::::::::::ooo:::::~~~~~~~
    58  ~~~~~~~~~~~~~::::::::::::::///////::::::::::::::::::~~~~~~~~~
    60  ~~~~~~~~~~~~~::::::::###################:::::oo:~~~~~~~~~~~~~
        |         |         |         |         |         |         |
```

### 4.4 Bazookarp

These follow the user's rules and the research in REQUEST.md: distance to the goal matters most; at least two routes
to each checkpoint; no hidden shortcut into a base; no unreachable high ground; the goal in front of the spawn or a
level below it. Alpha's half is described (Bravo scores here); Bravo's is the mirror.

- **Start:** the centre of the Feeding Platform, **(0, 1.0, 0)**: raised at mid under the Halo's eye, as Rainmaker
  usually starts. A carrier splatted on its own side resets it here.
- **Checkpoints: two, side by side; planting on either lowers both.** One on each flank of the Kelp Tank, so the
  carrier chooses a side and the defence must cover both or read the push.
  - **CP-J (the Jelly Walk): (11.3, 0, −38),** on the inner walk under the Jelly Tier's front wall. Ways in:
    1. Up the inner walk from the east waist: ≈ 40 m from the start.
    2. Along the Tier (2.4) via the Gallery Walk, then dropping off its front edge onto the checkpoint: ≈ 42 m.
    3. Through the tunnel and round the Back Walk from behind: ≈ 62 m.
  - **CP-P (the Pump Floor): (−16.3, 0, −35.5),** on the Pump Hall floor between the two pipe racks, under the Valve
    Gallery. Ways in:
    1. Down the Pump Hall from its front: ≈ 42 m.
    2. Along the Valve Gallery (from its north face or its north stair), dropping off its inner edge: ≈ 44 m.
    3. Through the tunnel, the Back Walk and the forklift ramp end of the hall: ≈ 64 m.
- **Goal:** the pedestal on the **Arrival Terrace, (0, 1.3, −51.8)**: a level below the spawn balcony, at the foot of
  the Grand Stair, 12.7 m from the pad. Defenders on the balcony see all of it.
  - From CP-J: Back Walk → foyer steps → goal, ≈ 19 m.
  - From CP-P: Pump Hall → forklift ramp → Loading Dock → terrace, ≈ 24 m.
  - Also: the 1.3 m terrace front (a hop), and the east wing from the Tier's south stair.
  - The direct line from mid through the tunnel is ≈ 52 m, but a checkpoint must be planted first, so the real routes
    are 59 – 66 m. That is comparable to Craters after its stretch (57.5 m shortest, 60 – 112 m by route).
- **No shortcut into the base.** The carrier can't use pipes. The only ways into the foyer are the three lanes round
  the tank and the tunnel, all on foot.
- **Free zones** ("BAZOOKARP-FREE" signposts; for Alpha's carrier on Alpha's own side): the Staff Yard and the Members'
  Landing / east wing (the 1.3 areas beside the spawn, |x| > 9, z −66 … −46.5), the Jelly Tier south of z −38 with its
  south stair, and the Valve Gallery south of z −38. These are the high back corners near the spawn where a carrier
  could stall. The Arrival Terrace (the goal) and the Back Walk are not free zones.
- **High ground a carrier could hide on:** none unreachable. The Tiers, Valve Galleries, balconies and Gallery Walk all
  have stairs and are in plain view. Bells, tanks, pumps and canopies are off-limits.
- **Carry times I expect.** The carrier moves at 0.8 × speed: 4.8 m/s on foot, 9.4 m/s swimming in its own ink.
  - Unopposed: about 4–8 s to a checkpoint and 2–5 s from it to the goal.
  - Realistic: 20–35 s to plant (well inside the 60 s timer), then 15–30 s from the replant to the goal against
    defenders spawning 13 m away.
  - A knockout should take a won mid fight *and* a second won fight at the Back Walk. Most matches should end on
    "furthest carried".
- **Mode-only pieces** (`onlyIn: 'bazookarp'`): the goal pedestal; two flush checkpoint discs; the free-zone signs.
  Nothing else changes.
- **What the pipes do in Bazookarp.**
  - Escorts use the Kelp/Reef Line to switch to the checkpoint the carrier is heading for, and the Halo Line to cross
    mid ahead of the carrier.
  - Defenders use the same Line to cover both checkpoints, and the express to re-enter at their Pump Hall front.
  - Feeding Time's Drop puts players on the Bazookarp's start spot in the last minute.

### 4.5 Boss Battle: yes

- **Its home ground** is the Halo Court floor inside the balconies: the ring between the Feeding Platform (r 4.5) and
  the balcony fronts (r 15), about 640 m², plus the two aprons and the Pump Hall fronts. Well over 150 m².
- **It fits:** the Halo's underside at 7.0 clears HULLBREAKER's 5–6 m shell.
- **The columns** (1 m bronze, 10 m apart) are walls that stun its Hull Charge: the stun windows are built in.
- **The squad** shoots from the balconies and the Gallery Walks.
- **Off its nav:** the tunnels, inner walks and Pump Halls beyond their fronts (too tight among tanks and pumps). The
  Feeding Platform is a 1.0 step it walks round (a wall to it, like Treehills' plaza).
- **Pipes:** all lines run (escape and repositioning). The boss can't ride; its moves ignore riders, who are untouchable.
- **Feeding Time is off** (`modes.boss.feeding: false`): no Drop onto the boss's head.

### 4.6 The gimmick per mode (summary)

| mode | lines | Feeding Time / Drop | notes |
|---|---|---|---|
| Turf War | all | last 60 s | — |
| Zone Control | all | last 60 s (the last 30 s are centre-only) | The Halo Line is the rotation between the two centre zones; no pipe end in or next to a zone. |
| Tower Command | all | last 60 s | No bell on the track. Checkpoint 2 sits between the Reef Line bell and the express nozzle. Riders on the tower can't enter. |
| Bazookarp | all; the carrier is refused | last 60 s | No pipe reaches the foyer. Pipes serve escorts and defenders only. |
| Boss Battle | all | off | The boss ignores riders. |

---

## 5. The look

**Architecture: 1930s ocean-liner moderne seaside aquarium.**
- **The buildings:** white render with rounded corners and three thin horizontal "speed lines", round porthole
  windows, brass handrails with ball ends on chrome posts, terrazzo floors with brass inlay lines, navy deco lettering.
  The public side curves (galleries, balconies, the rotunda); the back of house is square.
- **The pipes** are the building's own: clear glass tubes in polished brass collars every 3 m, on slim bronze brackets,
  with intake bells like ship's ventilator cowls.
- **The great tanks** stand on bronze-banded plinths with riveted rims and a lit brass nameplate ring.
- **The Halo's columns** carry kelp relief, and above the water they become ribs.
- **The Pump Halls:**
  - grey-green riveted steel, chequer plate, dull-red valve wheels;
  - big blue-grey centrifugal pumps, pressure gauges, flanged pipes in bundles;
  - a steel truss canopy with skylights;
  - "PUMP HALL A — STAFF ONLY" stencils, a forklift, fish-food sacks and crates.

**Landmarks and dressing, area by area.**

| area | dressing |
|---|---|
| Halo Court | the Halo (mantas, sardine shoal, light through the water), the Exchange sphere, the lantern crown; the bronze columns; ray and starfish touch pools ("TWO FINGERS, GENTLY"); the brass sea-chart compass rose under the Platform; the feeding troughs with buckets and a long-handled feeding pole on the Platform |
| Balconies | balustrades over the Sound, coin-op brass telescopes, flags, the Halo Line bells |
| Kelp Steps | kelp planters, the ray pool, the tunnel's portal (a deco arch with "KELP TUNNEL" in brass), information plinths |
| Jelly side | the Tier's front wall with lit jellyfish windows; free-standing jelly columns (glowing cylinders of moon jellies); benches; the sign "WILD MOON JELLIES: distant cousins of our jellyfish neighbours. Please don't tap the glass." |
| Kelp Tank | a kelp forest swaying to the top, garibaldi and rockfish, light shafts |
| Reef Tank (Bravo, `mirror: false` contents) | coral heads, a reef shark, a turtle, sea fans. The geometry is identical. |
| Back Walk | the Kelp Gate (the tunnel's back portal), a plankton-snack cart, a bench |
| Arrival Terrace | planters, the information desk, turnstiles at the balcony's foot (rail), the "SIPHON LINE · REOPENED" banner |

**Surfaces (3 slots).**
1. `aquarium_terrazzo`: warm white terrazzo with grey-blue and shell chips, brass divider strips on a 2 m grid. For the
   court, aprons, walks, terraces and tunnel floors.
2. `aquarium_teak`: weathered silver-grey teak promenade planks with dark caulk lines. For the balconies, Gallery
   Walks, Tiers and the spawn balcony.
3. `aquarium_plate`: grey-green chequer plate with worn edges and a faded hazard stripe at edges. For the Pump Halls,
   Valve Galleries and Loading Docks.

Walls use the shared render pattern. Glass, water and brass are prop materials.

**Palette (team ink stays the loudest colour).**

| element | colour |
|---|---|
| terrazzo | `#e8e3d6` |
| render | `#efeae0` |
| teak grey | `#a59f94` |
| slate trim | `#55656e` |
| bronze | `#7d6648` |
| navy accents | `#26384a` |
| glass tint, sea-glass | `#c3d6cf` |
| Pump Hall steel | `#6c7a70` |
| valve red | `#8a4a3e` |
| tank water, deep | `#17384a` |
| tank water, brightest | `#2f6a7a` |
| kelp | `#5b5a33` |
| coral | `#c99a8a` |
| sand | `#d6c9a8` |
| jelly glow | `#f2eefa` |

The risk is real: the palettes include Aqua (`#10d2e6`) and Mint (`#18d48c`), and an aquarium is full of water. So:
- the water is always deep and desaturated, never bright cyan;
- light through the water is sunlight-white and gold, not cyan;
- caustics draw on bare floor only, about ±10 % brightness, under ink at full strength;
- jelly glow is near-white with a hint of lilac (not Grape);
- coral is pastel at about half saturation (not Bubblegum or Cherry);
- the pipe lights are warm white.

**Signage and murals (ids 4–11):**
- "SIPHON SOUND AQUARIUM" in navy deco letters on each Entrance Rotunda;
- "THE HALO" and "THE EXCHANGE" plaques;
- the line names on every bell collar ("KELP LINE ⇄ VALVE GALLERY");
- the floor aprons (⇄ RIDE / ▶ IN / OUT ONLY);
- "FEEDING TIME DAILY · 2 PM" boards;
- "MOON JELLY GALLERY A / B";
- "PUMP HALL A / B · STAFF ONLY";
- the terrazzo compass rose with a chart of the Sound.

**The far backdrop on every side** (`env.bay: false`, own backdrop):

| side | what you see |
|---|---|
| Behind Alpha (−Z) | The breakwater causeway back to the mainland: a promenade with lamp posts and a tram stop, the aquarium's ticket pavilion and flags. Beyond, a white seaside town climbing green hills, and blue mountains. |
| Behind Bravo (+Z) | The mouth of the Sound: the aquarium's research wing on a rocky islet with a jetty and the research vessel *Siphonophore* moored, a striped lighthouse on the headland, open sea to the horizon. |
| +X | The Sound widening to the ocean: sea stacks (the Siphon Rocks) with seabird colonies, dark kelp beds under the surface, marker buoys, a distant cargo ship. |
| −X | Across the Sound, a wooded headland with a cliff-top village and a funicular; fishing boats in a small harbour. |

Gulls on, `boats: false` (our own vessels in the backdrop), stars at dusk, light sea mist on the far side only, sea
deep blue-green with whitecaps at the stacks.

**Day.** Late-morning coastal light: sun azimuth ≈ 135°, elevation ≈ 52°, high enough that the Halo throws a moving
ring of caustics across the court and the tank tops glow. Clean blue sky with a few cumulus; a crisp, slightly cool
grade.

**Dusk: "Night at the Aquarium".** Sun azimuth ≈ 250°, elevation ≈ 6°, an orange-violet sky over the sea.
- The tanks are lit from inside: the kelp warm green-gold, the reef cool blue.
- The jelly columns glow soft white.
- The Halo is lit from below, a ring of light hanging over the court, with the lantern crown glowing at 23 m.
- The pipes' beads twinkle and the brass balustrade lamps are lit (`decor.lamps`).
- The Rotunda's letters glow.

**Intro fly-in.**
1. From over the open sea on +X, low over the water toward the Kelp Balcony.
2. Rise over the balustrade, through the Halo's eye past the Exchange (a single squid streaks through the Halo Line in
   neutral white).
3. Turn and follow the Kelp Line down into the Kelp Tank: a moment underwater among the kelp.
4. Out over the Jelly Tier, settling behind Alpha's balcony.

In the current intro format: `intro: { from: [32, 9, 24], lookFrom: [0, 9.5, 0], toBack: 3.2 }`. The builder can
extend it if the format allows waypoints.

**Stage-select hero shot.** `art: { from: [30, 17, 26], look: [-2, 6, -6], fov: 58 }`.
- **Foreground:** the Reef Balcony's balustrade and a brass telescope.
- **Centre:** the Halo across the frame, a manta silhouetted against the sky through the water, the Exchange with a
  team-coloured squid mid-ride on the Halo Line, the lantern crown above.
- **Behind:** the Kelp Tank's column of kelp and the Pump Hall canopy, the Sound and the lighthouse.

Day and dusk versions.

---

## 6. The three biggest risks and how I would handle them

1. **The pipes could make fights feel random:** surprise exits, exit camping, accidental entries, bots that misuse them.
   - **Design limits:** only seven lines, each with one clear job. A full-ride telegraph in team colour. A 0.3 s
     vulnerable suck. No protection after the pop. A 2.5 s cooldown. Entry only when moving *into* a bell, and bells
     only against walls, never on a through-route. Exits with 2+ ways off.
   - **Measure** (Mac mini bot sweeps, and the user's own play): rides per minute per line, splats within 2 s of a pop
     (exit-camp rate), share of zone and tower swings that followed a ride. Turf, zones and tower matches with pipes
     on vs off (a `pipes: false` switch).
   - **Tuning order if it's too strong:** cooldown 2.5 → 4 s; Halo Line speed 18 → 14 m/s; then remove a line (the
     Annex Express first).
2. **Mid could stalemate in Zone Control,** and the halves are asymmetric. Each team's home balcony favours one of the
   two centre zones, so "one each" might be a stable, boring state. Inside each half, the round Jelly side and the
   square Pump Hall play differently.
   - **The intended breaker:** the Halo Line (rotate onto the away balcony from behind), plus the balcony stairs and
     climbable fronts.
   - **Measure:** time the centre objective sits neutral, and lead changes, against Treehills and Craters.
   - **Fallbacks:**
     a. A 2.5 m gap in each Gallery Walk at the waist (jumpable, about 4 m of air at run speed), so a home balcony is
        no longer level with its own Tier.
     b. Swap to one centre zone, as a Zone-only change: a 120 m² disc (r 6.2) under the Halo's eye covering the
        Feeding Platform and the floor round it.
   - **Tower:** the U-turn back past the defenders' express could favour defence at checkpoint 2. If tower-match shows
     that, close the express in Tower Command (`modes.tower` on that line) rather than move the track.
3. **Glass and water everywhere: readability, performance and sight rules.**
   - **Ink readability against water:** the colour rules in §5.
   - **Performance:** three transparent tanks plus the Halo, a lot of glass tube, fish, caustics.
     - each tank is one water volume and one glass shell;
     - fish are instanced shoals on simple paths;
     - each pipe line is one merged mesh plus one bead strip;
     - caustics are a single projected texture in the level shader;
     - target ≤ Halyard's calls and triangles at load.
   - **Sight:** can you see players through a tank? Treat tank glass and water as **opaque** for sight and shots:
     17 m of murky water is effectively a wall, and bots then need no special case. Pipes are see-through but
     shot-proof (a glass flag for `botSight` if needed).
   - **The tunnels:** they must not feel like corridors. 9 m wide, 6.5 m tall, two lanes and a bright bubble column;
     the `play` camera checked inside them and on the tower.

---

## 7. To verify first when it is blocked out

- `node build/check-maps.mjs aquarium` → ok.
- `spawn-mid.js` average 6.0 – 6.4 s; cover-map ≥ 90 %; climb-audit clean (every 2.4 face has a reachable top).
- `tower-check.cjs`: 143.5 m, 0 holes, and only the two deliberate height changes (the climb at x 19.5 and the drop at
  z 50). `tower-len` reads 100 s.
- A bot turf and zones match (stuck ≤ 1 %), with a pipe-use count per line.
- Boss check (home ground, charges into columns).
- The `play` view from both balconies: the tank should frame the view, and the lantern crown should show above it.
- Perf against Halyard at load, day and dusk.
