# Calamari County (`calamari`): design

**Name:** Calamari County. **Times:** day (cold, bright, low winter sun, snow on everything) / dusk (blue snow, warm
windows, lanterns and vending machines glowing).

## The place

Calamari County is where Callie, Marie and Cap'n Cuttlefish come from: a small fishing village at the far end of the
line out of Inkopolis, three and a half hours by train. It is on the coast (the air smells of salt) and it is cold.
Winter: snow on every roof, the harbour's edge rimed with ice, steam from the bath-house chimney.

The stage is the village's heart: **Calamari County Station**, the railway through it, and the lanes either side.
The Squid Sisters' country roots show in the architecture: a rural, lightly Japanese-flavoured seaside village (timber
houses with deep tiled roofs heavy with snow, sliding doors and paper-lantern light, noren curtains on the shop, a stone
lantern or two, drying racks for seaweed on the quay, a vending machine at the station). Keep it respectful and
secular: no shrines or gates.

What the players should read from any camera:
- **The station**: an island platform in the middle between two tracks, with a timber canopy (snow on it: a roof you
  slide off), a wooden nameboard "CALAMARI COUNTY" with the next / previous stops ("← INKOPOLIS 3 h 30 min"), benches,
  a stove waiting room, a clock, a timetable board, a snow shovel leaning on a post.
- **The railway**: two tracks on ballast crossing the whole map (along x), with a level crossing (crossing barriers,
  flashing lights, a bell), snow between the rails.
- **Two small trains**: a one-car local railcar on each track (mirrored, parked at opposite ends), painted in a
  county livery, snow on the roof, lit windows at dusk. They are big cover.
- **Footbridges** over the tracks: a covered footbridge (timber, windows, snow on its roof) from each half's side of
  the station onto the island platform: high ground over mid.
- **The village**: snowy lanes between wooden houses and shops (a general store with noren, a post office with a round
  post box, a small bath house with a steaming chimney, a fish shop with ice boxes), snowbanks shovelled against walls,
  bicycles half-buried, a snowman.
- **The harbour** on one flank of each half: a stone quay with fishing boats moored (snow on the decks), stacked crates
  and fish boxes, nets, glass floats, seaweed drying racks, a small ice-covered slipway. The water is the death plane.
- **Cap'n Cuttlefish nod**: one small weathered cottage with a nameplate "CUTTLEFISH", an anchor by the door and a
  battered sea chest, as a one-off (`mirror: false` for the nameplate / details; the building itself can be mirrored).
- **Spawns**: the upper deck (a covered veranda) of the Fishermen's Co-op warehouse at each end of the village, with
  stairs down to the lanes.

## Layout (world metres; Alpha at −Z, Bravo at +Z; bounds ≈ ±26 × ±45)

A **railway cut across mid**: the tracks run along x through the centre and every push crosses them.
- **Island platform** (single, self-symmetric): |z| < ~2.6, |x| < ~12–14, top at +1.0. The canopy over its middle
  (roof), benches and the waiting room as cover.
- **Two tracks**: trackbeds at y 0 (ballast), |z| ≈ 2.6 … 6.6, running the full width of the stage. A train on each (the
  one on Bravo's track at the −x end, Alpha's mirror at +x), each ~14–16 m long, 2.6 m wide, roof 3.2 (roof: true, or a
  squid-reachable perch; decide by play).
- **Station side** of each half (z ≈ ∓6.6 … ∓12): the side platform / forecourt at +1.0 with a fence and gaps, the
  footbridge stair (up to ~4.4, deck over the track, down onto the island platform), the level crossing at one end
  (x ≈ +16 on Bravo's half: the road crosses at track level) and a ramp down to the tracks at the other.
- **Village** (|z| ≈ 12 … 40): three lanes.
  - left lane: the harbour quay (0), boats as cover, crates; the water on the outside.
  - mid lane: the main street with shops, the village square with the post box (the side zone), then up to the co-op.
  - right lane: a hillside lane with stone stairs up to a snowy terrace (1.3 / 2.6) above the street: rooftop-height
    views over the square, the bath house.
- **Co-op warehouse** spawn deck at ~3.2–3.8 with a stair down to the main street and a ramp down to the quay.
- The footprint: the coastline is jagged (the quay's straight stone edges at angles, the slipway, a breakwater stub),
  the hillside side stepped: not a rectangle.

Heights: 0 streets, quay, trackbeds · 1.0 platforms · 1.3 / 2.6 hillside terraces · 3.2 train roofs · ~4.4 footbridge
deck · 3.2–3.8 spawn deck.

How it plays differently: close-quarters village lanes and a long, open railway corridor across the middle; the trains
and footbridges create a two-storey fight over the tracks; snowbanks and boats give low, scattered cover.

## Modes

- **Zone Control.** Centre: the middle of the island platform and both trackbeds beside it (one zone spanning
  |x| < ~5, |z| < ~6.6, y −0.2…1.2) or two zones (one on each trackbed + platform edge); pick the one that plays
  better with the canopy and trains. Side: the village square (flat, y 0, ~10 × 9 m) with the post box and a snowbank.
- **Tower Command.** "The tower rides the railway." Suggested (Alpha pushing toward +z; refine it): the island platform
  centre (y 1.0) → +z off the platform edge, a **drop** onto Bravo's track → +x along the rails (the tower on the
  railway; the train on that track is parked at the −x end, out of the way) → checkpoint 1 on the level crossing → +z
  up the crossing road into the village → −x along the main street (checkpoint 2 by the square) → a **climb** onto the
  co-op's loading dock (1.0–1.3) → +z to the goal in front of the co-op stair, ~12 m short of the spawn pad. About
  80–95 m. Check the footbridge and canopy don't sit over the track (or are high enough: 3.72 m above the platform
  floor).
- **Boss Battle.** Probably tight (narrow lanes, trains, a platform). Test the boss on the railway corridor and the
  square; if it can't roam, say so (noBoss).

## The world round it (env)

- `bay: false`. Your backdrop: snowy hills rising behind the village (terrain with `env.snow` cover high, bare trees and
  snow-laden pines, instanced), more village roofs beyond the stage (snow-capped, a few chimneys with smoke if you can),
  the railway line running off inland between snowy fields with telegraph poles, a small fishing harbour mouth with a
  breakwater light, and the grey winter sea with a few ice floes near the shore.
- `weather.snow` (gentle snowfall), `theme` overrides: a cold day (lower, whiter sun, blue-grey sky, cooler shadows,
  slightly desaturated grade) and a blue dusk; the sea cold slate-blue-green, whitecaps; gulls stay.
- `edge: 'none'` if you dress the quay edges yourself (stone quay walls, fenders, ladders, ice); `boats: false` (your own
  boats are props).

## Surfaces (your 3 slots)

Suggestions: snow (packed, trodden, with tyre and boot marks; team ink must read strongly on it: slightly grey-blue,
never pure white), snowy stone paving / quay setts with snow in the joints, and dark weathered timber (station platform
boards, footbridge). Tiled roofs are out of reach (roof: true), so they can be a prop texture, not a surface.
