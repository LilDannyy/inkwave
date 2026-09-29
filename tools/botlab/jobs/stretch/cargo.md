# Cargo Terminal (`cargo`) — the Long Stages stretch

Scratch job note (never merged). Pictures: `out/cargo/`. Cargo is PR #8's rebuilt Kelpline (online only, humans only,
noBoss): the same berth in its own kit (`src/world/stages/cargo/`, types `cargo_*`, surfaces on slots 46–48). It got
the same stretch and the same slice as Kelpline, ported hunk for hunk (see `kelpline.md` for the design, the cut, the
routes and the Bazookarp notes — every coordinate there holds here too). Differences from Kelpline:

- Cargo never had Kelpline's Tower Command variant (the reefer rack's aisle, the lifted boxes) or a drawn track.
- **Zone Control:** no drawn zones — the game builds placeholder squares (zones.js `placeholderZones`: a 10 m square at
  mid, a side square at 0.4 / 0.45 of the spawn pad's position). That side square would have followed the moved pad ~9 m
  out, so the layout now pins the placeholder squares where they stood (`PLACEHOLDER_ZONES` in layout.js, still flagged
  `placeholder`): the side zone keeps its distance from mid, as the brief asks.
- **Tower Command:** no drawn track — the stand-in route (tower.js `placeholderPath`, the nav route from the centre to
  a goal outside the moved spawn barrier) follows the stretch by itself.
- It doesn't boot offline, so everything here ran with the new `DEVSTAGE=1` botlab option (`?devstage`: a solo walk,
  no bots) — page tests, shots, the tower audit, the bake and the stage art. No bot matches are possible (noBots), and
  tower-check's ride test needs two bot riders, so it ran with `RIDE=0` (track audit + pictures only).

## Numbers (before = new-stages 0cd3945 + the DEVSTAGE commit; after = this branch)

| | before | after |
|---|---|---|
| `check-maps` | 185 pieces, ok | 283 pieces, ok |
| spawn → mid, straight | 43.6 m | 66.6 m (× 1.53; the brief's target: straight × 1.5) |
| spawn-mid.js t0 / t1 (avg) | 4.04 / 4.28 s (4.16) | 6.20 / 6.44 s (**6.32**) |
| cover map | 92.3 % of 4514 cells | **94.5 %** of 6372 cells |
| climb-audit | 424 climbs, 0 barred | 520 climbs, 0 barred |
| size-budget | 730 rows, 30 ppm, 4508 nodes, A* 1500 | 1007 rows, 25.4 ppm, 6118 nodes, A* 3000 |
| Zone Control (placeholder, pinned) | centre 10 m square at mid; side square at world (−10.0, −16.1) | the same squares: centre 1604 cells, side 881 cells centred (−10.1, 0.1, −15.7) |
| Tower Command (stand-in route) | 40.6 m / side | 61.0 m / side, 100 s to the goal; audit (`RIDE=0`): 0 holes, clearance clean |
| bots | n/a (noBots) | n/a (noBots) |
| boss | n/a (noBoss) | n/a (noBoss) |
| perf at load (shoot.cjs REPORT, day) | 132–133 calls, 1.72 M tris, cpuRender 2.36 ms, loadMs 13.5 s | 135–136 calls, 2.03 M tris (× 1.18), cpuRender 1.92 ms, loadMs 6.1 s |

Perf: best of three / four samples (before and after alternating) on a machine at load average 50–110 — the load times
swing 6–22 s with it; calls and triangles are the steady numbers. Cargo has no bots, so its frame is the stage alone.

## Known issues

- Tower Command is still the stand-in route (as before the stretch): it now runs up the lane and over the transfer
  platform's stairs, and hops a twistlock bin by the Landing (a piece that was there before). A drawn track needs Tower-only pieces like
  Kelpline's reefer-rack aisle — the lead's call (Kelpline's track would work only with those).
- Zone Control is still placeholder squares (pinned). Cargo's geometry matches Kelpline's, so Kelpline's drawn zones
  (the Landing, Block 4A's plateau) would fit as they are, if the lead wants real zones here.
- tower-check's ride test needs bot riders: not possible on a noBots stage (`RIDE=0`).
