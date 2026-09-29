# Tidewater Plaza — the Long Stages stretch

Each half is **19.2 m longer** (Δ; eight 2.4 m herringbone repeats, so the square's brickwork at mid and at every seam
lies exactly as before). New land per half: the **Winter Gardens**, the promenade's straight **esplanade**, and a
fourth house on the Crescent, the **Assembly Rooms**.

## The cut

Code: `src/world/stages/tidewater/layout.js` `TD` / `tq(z)` (a base-side z of the first build, moved out). The cut
follows the seams between the base and mid (Alpha's half, Bravo's is the mirror):

- **Promenade:** at the pier forecourt's end (the crescent's 180° point, z -4). The whole crescent moved out (its centre
  `PROM.c` is now [19, -23.2]); `ESPL` is the new straight section along the sea from the forecourt to the crescent, so
  the curve still starts tangent to it (no kink). The ice-cream kiosk and the cart stay at mid.
- **Square:** between the mid terrace's flights / the flower border / Tower Command's loop and the bandstand's north
  steps. The bandstand (both builds), the floral clock, the fountain band, the tea rooms and everything round them
  moved; the big square slab now runs from mid to the fountain band.
- **Crescent:** at the joint between its second and third sections (24.5, -19). The first two houses (and the spawn
  wing, the colonnade end, the corner house) moved; the new straight section in line with the corner house is the
  Assembly Rooms (`COLO.front` has five points; `chainSections` now handles sections in line).
- Moved with the base: the Town Hall (+ its ground storey prop, placed 19.2 m out), the loggia, flights, wing walk and
  steps, the lifeboat station, the promenade's shelter, Punch & Judy, deckchairs and collection box, the fountain,
  bandstand, floral clock, tea rooms, lamps, trees, urns, fingerpost, kerbs, the spawn pads, the flags, the Tower
  Command bandstand (`TW.band`) and goal. Mid (the Jubilee terrace, the clock tower, the pier forecourts, the side
  zone, the colonnade stair and its landing, the border, the anchor) is untouched.
- `bounds` z ±47 → ±66.2; the sea, deck edges and pilings follow the deck (environment.js: no change needed).

## The slice

**The Winter Gardens** fill the square's widest stretch between mid and the bandstand. A cast-iron **Palm House**
(12.8 × 6.3 m: two glazed wings with barrel roofs either side of a pavilion carrying a ribbed glass dome and a lit
lantern, a brick stove stack behind) stands on a stone plinth; in front of it, facing mid, its **raised terrace**
(1.2 m, 12.8 × 3.2 m) is the slice's **strategic point**: twin stone flights come down from its front corners toward
mid, its ends are a hop (1.4 m) or a squid climb from the side walks, a balustrade with urns between the flights, THE
WINTER GARDENS · 1887 on its front. Round it: a carpet bed at the terrace's foot and one on each side walk (stone
kerbs, carpet bedding, tiered yews at their corners), tub palms, clipped cones and lollipops in Versailles planters
along the north walk, a cast-iron drinking fountain, the coxswain's statue on the south walk, benches, lamps, a
fingerpost. The walks either side of the Palm House (x ±6.6 … ±9.4) are kept clear: the direct way from the bandstand
to mid runs down them.

The promenade's **esplanade** (8 m wide, 19.2 m long) carries on the sea-front dressing — cast-iron railing, basket
lamps with bunting, benches and a telescope facing the bay, a lifebuoy, a bin — and a lean-to **seat shelter** backing
onto the garden. The Crescent's **Assembly Rooms** (24 m of palazzo front: tall round-headed ballroom windows between
giant pilasters, a pedimented frontispiece of four columns with ASSEMBLY ROOMS on the frieze, a parapet with urns, a
glazed roof lantern) carry the colonnade and the 3.7 m terrace walk on, with three shops under it (BOX OFFICE, READING
ROOM, TEA ROOM), and a **new stair up to the terrace walk from the garden** (foot z -39.1, landing -30.1 … -27.1,
under the frontispiece).

Routes through the slice into the base (walkable by a slow carrier: stairs and ramps only): the esplanade → the
crescent (west); the garden's west walk; the garden's east walk; the Crescent's covered walk under the Assembly Rooms;
the terrace walk on top (from mid via the old stair, down the new one) — plus the cross links: the north walk, the
Palm House terrace, the south walk behind the Palm House. Squid routes: the terrace's end walls, the Assembly Rooms'
landing face (like the north landing's).

Defenders' side: the bandstand and the fountain forecourt in front of the Town Hall are the apron (the balcony and its
two flights + the wing walk = three ways out of the spawn, as before).

## Every mode

- **Zone Control:** the centre (the Jubilee terrace) and the side zone (x 10 … 17.5, z -20 … -10, by the colonnade
  stair) are unchanged; the side zone now opens onto the garden's north-east corner as well.
- **Tower Command** (two checkpoints): the track is **224.4 m** a side (was 112.8; target 225.6 ± 4 %), speed 2.81 m/s,
  **100 s** to the goal. Every run the user drew is kept; out of the mid loop the track now winds through the Winter
  Gardens: west along the north walk (z -18, clear of the loop's leg), out onto the esplanade and down it (x -23.3),
  back east into the west walk, **up the Palm House terrace's end wall, along the terrace — checkpoint 2 — and off its
  far end**, a jog up the east walk and back down it (x 13.2 / 16.0), west along the south walk behind the Palm House
  to the bandstand, then the drawn run through the bandstand to the goal by the fountain (19.2 m further out, like the
  spawn). Garden cover standing on the track is Turf War / Zone Control only (`notIn: 'tower'`); two inflatables stand
  off it in Tower Command.
- **Boss Battle:** home ground 348 m² (was 342); HULLBREAKER roams 31–46 m in the 120 s check (was 6 m) — still under the
  check's 50 m bar, as it was before the stretch.

## Bazookarp notes (Alpha's half; Bravo's is the mirror)

- **Checkpoint:** the Palm House terrace, **(0, -24.3), y 1.2**. The only raised floor in the slice, in the middle of
  it: both teams cross the garden round it, it overlooks the parterre, the north walk and the Jubilee terrace, the
  flights face mid (attackers) and the end walls / side walks face the base (defenders); cover round it = the Palm
  House behind, the terrace bed's topiary, the tub palms and the balustrade (see-through).
- **Goal:** the fountain forecourt below the Town Hall's balcony, **(5.0, -47.5), y -0.2** (east of the fountain, north of
  the balcony's east flight): in full view of the loggia and the balcony, reached from the bandstand's two sides and
  from the promenade's tip / the tea rooms' side.
- **Routes mid → goal** (walking lines, ≈): centre down the garden walks past the Palm House and the bandstand **42 m**;
  centre over the Palm House terrace (a flight up, an end wall down) **57 m**; east along the Crescent's covered walk
  under the Assembly Rooms **76 m** (or the terrace walk on top, down the Assembly Rooms stair); west down the
  esplanade and the crescent **90 m**.
- **High ground:** the Crescent's terrace walk (3.7 m) — reachable from the spawn wing, the mid stair and the new
  Assembly Rooms stair (fine: a carrier up there can be reached three ways); the Palm House terrace (1.2 m, flights);
  the bandstand's stage (0.8 m, steps). Roofs (the Palm House, its dome, the Assembly Rooms, the Crescent, the Town
  Hall, the shelters) are `roof` (off limits, slide off). Nothing needs a no-carrier zone.

## Numbers (before 0cd3945 → after)

| | before | after |
|---|---|---|
| spawn → mid (spawn-mid.js) t0 / t1 | 3.66 / 4.32 s (avg 3.99) | 5.73 / 6.70 s (avg **6.22**, ×1.56) |
| straight spawn → mid | 41.8 m | 61.0 m |
| tower track / side | 112.8 m, 100 s to the goal (80 s track + 2 × 10 s) | **224.4 m**, 2.81 m/s, **100 s** |
| cover map (≥ 90 % within 5 m) | 89.9 % (open r 10.1 m, the bandstand's stage) | **93.3 %** (open r 9.5 m, the same stage) |
| turf bots, stuck % (180 s) | 0.2 % (longest 0.75 s) | 0.1–0.2 % (longest 2.5 s) |
| zones (full 5:00 + OT) | — | stuck 0.3–0.4 %, longest 1.75 s |
| tower-match | — | knockout (Alpha 0 : 96), 0 % stuck; an earlier run went to time 3 : 100 |
| boss check | 342 m², roamed 6 m | 348 m², roamed 31–46 m, idle ≤ 7 s, all moves |
| climb audit | — | clean (45 climbs) |
| perf at load (shoot REPORT, side by side, 2 runs each) | calls 360–361, tris 2.74–2.89 M, cpuRender 4.99–5.77 ms, loadMs 9.1–9.2 s | calls 297–343, tris 3.55–3.59 M (×1.27), cpuRender 4.16–5.27 ms, loadMs 6.7–8.6 s |
| lightmap rows (8 ppm, 2048²) | 710 | 1006 (tower 995) |
| paint atlas | 27.6 ppm | 23.4 ppm |
| nav nodes / A* cap needed | 3354 / 1500 | 4818 / 6000 |

check-maps: `tidewater` ok (411 pieces), `tidewater.tower` ok (415). Lightmaps rebaked: tidewater, tidewater.zones,
tidewater.tower. Stage art re-rendered day + dusk; art camera reframed (from off the esplanade over the Palm House to
the Town Hall and the Assembly Rooms, the clock tower in front); the intro (mid → your loggia) is unchanged.

## Pictures (`out/tidewater/`)

top-before.jpg, top-after.jpg, top-tower.jpg (both tracks through the gardens), spawn-play.jpg (the player's camera at
the loggia: the fountain, the bandstand, the Palm House behind), slice-garden.jpg (the terrace from the north walk),
slice-terrace.jpg (on the terrace, toward the Assembly Rooms), slice-aerial.jpg (the whole slice), slice-esplanade.jpg.
