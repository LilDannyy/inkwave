# Halyard Marina — the Long Stages stretch

Each half is **24 m longer** (Δ). The new land between the first build's quay front and the new one is the marina's
**visitor pontoons**, the **chandlery with its loading deck** and the boatyard's **travel-lift dock**: the three lanes
(Long Pier, fuel dock, boatyard) carry on across it, joined by the pontoons, the loading deck and the quay.

## The cut

Code: `src/world/props-marina-slice.js` — `HALYARD_D = 24`, `HALYARD_CUT = -31`, `hq(z)` (a base-side z of the first
build, moved out), `QUAY_FRONT = hq(-31) = -55`; `SLICE` holds the slice's rects (maps.js builds the blocks from them,
the same module places the dressing). Alpha's half; Bravo's is the mirror.

- **The cut is the first build's quay front (z ∓31).** Everything on the spawn side of it moved out 24 m: the quay, the
  clubhouse and its back wall, the spawn terrace, the grand stair and its parapets, the boathouse, the kiosk, the
  clubhouse's planters, café sets, harbour office, lamps, palms, flags, the spawn pads (z ∓42 → ∓66), the outer marina's
  gate. Mid (the ferry, the tug, the houseboat, the fuel hut, the finger piers, the side zones) is untouched.
- **Lanes carried on to the new quay front:** the Long Pier (x -24 … -19.5) and the fuel dock (x ±4.5) run on to z -55;
  the boatyard's hardstanding runs on round the new travel-lift slip (the yard is four blocks round it). The perimeter
  pier edges, the breakwater and the outer marina's walkway were lengthened (the walkway gains five berths, three with
  yachts, two left free); the sea, the deck rects and the wet rects follow the level (environment.js: no change).
- `bounds` z ±46 → ±70.

## The slice

**The visitor pontoons** (west) float in the slip between the Long Pier and the fuel dock, 0.9 m below the piers: an
east–west spine (gangways down from the Long Pier and from the fuel dock), a long finger north to the first build's
finger pier (a short gangway up onto it), a short finger between two berths and an access pontoon south to a gangway up
to the quay. Five visiting yachts are berthed between them (ORCA BAY alongside the Long Pier, SANDPIPER, MORWENNA, LADY
GREY, ARIEL): their hulls and deckhouses collide, so the pontoons are a lane of low, broken cover at water level with
the boats as walls. Pontoon dressing: galvanised float-deck sections (rub rails, cleats, fenders toward the boats), shore
power, a dock box, a VISITORS pontoon sign at the gangway head; the Long Pier's new stretch has shore power at ORCA BAY,
a dock box, a crate stack, crab pots, a bench facing the berths, bollard lights, a life ring, a kayak rack.

**The chandlery and its loading deck** (centre–east) are the slice's **strategic point**. The chandlery is a timber store
on the hardstanding's west edge (6 × 6.5 m, 4.2 m, slate roof off limits), shopfront to the quay (HALYARD CHANDLERY
fascia, display windows), CHANDLERY painted on its west wall over its berth, sliding loading doors onto the deck. The
**loading deck** (11 × 4.2 m, 1.3 m high) spans the channel between the fuel dock and the yard: 4 m ramps up from the
fuel dock (west) and from the hardstanding (east), a davit, crate stacks, a pallet of paint tins and a sack truck on it
(the cover), a railing along its north edge with a loading gap; from it you see down the channel to mid. Under its
north face: the chandlery's RIB. On the fuel dock beside it: the visitors' berthing booth (VISITORS hatch to the quay,
roof off limits), an ICE chest, fish boxes, a vending machine, a trolley and quay crates at the shore end.

**The travel-lift dock** (east) is a slip cut into the hardstanding from the channel (10 × 5 m, a plank across its
mouth), with the yard's big blue portal hoist straddling it and the motor cruiser BLUE HERON hanging in its slings
(the hull collides, off limits: cover for the yard). Round the slip's head: the workbench, a laid-up yacht on stands
(OYSTERCATCHER) by the quay, the mast rack, a dinghy trailer, drums, the gas cage and a pallet by the chandlery's side
door.

Routes through the slice into the base (all walkable, stairs / ramps only): **(1)** the Long Pier (west edge); **(2)**
the visitor pontoons (Long Pier or fuel dock → spine → access pontoon → the quay's gangway, or the long finger from the
finger pier); **(3)** the fuel dock (centre) to the grand stair; **(4)** over the loading deck (fuel dock ↔ yard);
**(5)** the hardstanding round the travel-lift slip's head or across the plank (east). The quay front ties them
together in front of the base. Cross links: the spine, the loading deck, the quay.

## Every mode

- **Zone Control:** the zones (mid and the side zones) are unchanged; the side zones now open south onto the pontoons
  and the yard.
- **Tower Command** (three checkpoints): the track is carried on to the goal 24 m further out: from the boatyard east
  along the yard's front between the tug's bow ramp and the hoist, round the slip's head and down the hardstanding past
  the laid-up yacht to the goal by the quay. **84.8 → 117.8 m**, speed 1.41 → 1.96 m/s, still **100 s** to the goal.
  In Tower Command the short visitor finger moves under the water-bus PUFFIN's gangway (tower-only), and the mast rack,
  drums, the dinghy trailer and SANDPIPER stay off the track (`notIn: 'tower'`).
- **Boss Battle:** home ground 187 → 267 m² (the brief's bar: ≥ 150 m², no long stuck — idle ≤ 4 s). HULLBREAKER
  walks down the fuel dock to the front of its home and plays all its moves; it roamed 55 m in one run and 27–28 m in
  two (it holds the front edge and barrages while the players are at mid), against 5 m and missing moves before the
  stretch. The copied check's own roam line (> 50 m) passes 1 run in 3.

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint:** the chandlery's loading deck, **(10, -46.4), y 1.3**. In the middle of the slice, reached from the
  fuel dock and the yard by the two 4 m ramps: both teams cross the slice round or over it; it looks down the channel to
  mid (attackers) and onto the quay front (defenders); cover on it = the crate stacks, the davit post, the store wall.
- **Goal:** the fuel dock's shore end in front of the grand stair, **(0, -52.5), y 0**: in full view of the spawn terrace
  and the stair, reached from the fuel dock, the quay front both ways, the pontoons' quay gangway and the deck's west ramp.
- **Routes mid → goal** (walking lines, ≈): down the fuel dock **48 m**; the Long Pier and the pontoons **82 m**; the
  Long Pier and the quay **94 m**; the yard and the loading deck **92 m**; the yard and the quay **104 m**.
- **High ground:** the loading deck (1.3 m, ramps); the tug's deck and the ferry's sun deck at mid (reachable, as
  before); the spawn terrace. Roofs — the chandlery, the booth, the boathouse, the kiosk, the clubhouse, the hung
  cruiser — are `roof` (off limits, slide off). **Watch:** the travel lift's leg tops (5.45 m) are colliders without the
  roof flag (as before the stretch: the hoist only moved); only specials get up there — flag them or keep the carrier
  away if Bazookarp needs it.

## Numbers (before 0cd3945 → after)

| | before | after |
|---|---|---|
| spawn → mid (spawn-mid.js) t0 / t1 | 3.99 / 4.37 s (avg 4.18) | 6.02 / 6.41 s (avg **6.22**, ×1.49) |
| straight spawn → mid | 42 m | 66 m |
| tower track / side | 84.8 m, 1.41 m/s, 100 s to the goal | **117.8 m**, 1.96 m/s, **100 s**; tower-check clean, both rides knockout |
| cover map (≥ 90 % within 5 m) | 94.2 % (open r 17 m, the houseboat's roof) | **96.4 %** (the same spot) |
| turf bots, stuck % (180 s) | 0.4 / 1.1 / 0.2 % (longest 2.5 s) | 1.5 / 0.7 / 0.2 % (mean 0.8; longest 4.75 s, the ferry's stairs at mid) |
| zones (5:00 + OT) | stuck 0.5 / 1.7 / 1.4 % (longest 4.75 s) | stuck 0.9 / 2.4 / 0.8 / 2.0 % (longest 6.25 s); last run a draw 81 : 81 |
| tower-match | — | knockout (Bravo, 117.8 m, all 3 checkpoints), stuck 0.6 % |
| boss check | 187 m², roamed 5 m, moves FAIL | **267 m²**, idle ≤ 4 s, all moves (barrage, slam, sweep, charge); roamed 27–55 m |
| climb audit | — | clean (112 climbs) |
| perf at load (shoot REPORT, side by side) | calls 305–365, tris 2.84–3.05 M (mean 2.95), cpuRender 4.5–5.7 ms, loadMs 6.9–8.0 s | calls 312–379, tris 3.63–3.86 M (×1.23–1.31), cpuRender 5.2–6.1 ms, loadMs 8.1–8.9 s |
| lightmap rows (8 ppm, 2048²) | 481 | 740 (zones 747, tower 800) |
| paint atlas | 30 ppm | 27.6 ppm |
| nav nodes / A* cap needed | 2824 / 3000 | 4176 / 3000 |

Stuck episodes: almost all on the ferry's cabin stairs and sun deck at mid (untouched; the same spots and the same
spread before the stretch — before-build zones runs 0.5 / 1.7 / 1.4 %). In the base, one short recurring spot (≤ 2.25 s)
on the quay beside the spawn terrace's side wall (x ±8.9) — the same spot as before, moved out 24 m. In the slice, one
short one (0.75 s, 1 run in 3): the yard's corner north of the loading deck (x 10.5, z -43.9), between the deck's
1.3 m north face and the water.

check-maps: `halyard.zones` ok; `halyard` has one issue, **pre-existing** (the tug's stern ramp is 25.7°, max 24; the
same on 0cd3945). Lightmaps rebaked: halyard, halyard.zones, halyard.tower. Stage art re-rendered day + dusk from the
reframed art camera (now in the layout's `art`, off the Long Pier's end over the pontoons and the chandlery to the
ferry and the far clubhouse); the intro (the ferry's sun deck → your spawn) is unchanged.

Perf: the marina renders the stage twice (a planar reflection) plus a shadow pass, and props are merged per material,
so every added triangle costs ~3×. To stay well inside 1.35× the dressing was trimmed after the first pass: the outer
marina's yachts drop rails, lifelines and fenders (`far`), the visitor float decks their bolt heads (`lite`), the
chandlery's lettering is painted (flat) and shorter, a second pump-out, a shore-power post, a life ring, an extra RIB
and two lamps went. Most of the run-to-run spread in `tris` is the number of kids drawn at hero detail at the moment
of the report (±100 k scene triangles each).

## Pictures (`out/halyard/`)

top-before.jpg, top-after.jpg, top-tower.jpg (the track through the yard to the goal), spawn-play.jpg (the player's
camera on the spawn terrace: the quay, the fuel dock, the chandlery and the pontoons ahead), slice-base.jpg (over the
quay front toward mid: the fuel dock, the booth, the loading deck, the pontoons), slice-pontoons.jpg (from the Long
Pier's shore end along the visitor pontoons), slice-yard.jpg (over the hardstanding: the travel lift and BLUE HERON),
slice-deck.jpg (from the fuel dock: the loading deck, the chandlery, the clubhouse).
