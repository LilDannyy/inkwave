# Bazookarp WP4a: the checker and the stage kit (key `karp-checker`): lead report

Worktree `st-b5-karp-checker`, branch `b5-karp-checker` from `b5-int3` b55f7472. Everything ran locally (the Mac mini
is away), one Electron at a time under the shared SLOTS=3 lock. Nothing pushed.

## 1. What was built

### 1.1 `tools/botlab/bazookarp-check.cjs`: the checker (SPEC §4.4)

```
MAP=halyard tools/botlab/run.sh tools/botlab/bazookarp-check.cjs          one stage
MAP=all  …   every shipped stage (the twelve and Cargo) in one go, then a table   (WIP=1 adds bluestone, aquarium, caldera)
MAPS=a,b …   some stages
KARP_SELFTEST=1 … the self-test on karpbox (CASES=clean,f7,… picks cases)
env: OUT=dir (default .botlab/karp-check)   KARP_DEF='{…}' trial data   SHOTS=0 / CARRY=0 / PHYS=0 (quick; a RESULT ok
     needs all three)   DEVSTAGE=1 (Cargo; MAP=all adds ?devstage for Cargo itself)   ERA=1|2|3 / LAVA=low|high /
     KSTATE=<key> one stage state, else every state in turn   FLAGSHOTS=n   KITSHOTS=1 (the kit up close)
```

Always with `BOTLAB_OUT=…/inkwave-upstream/.botlab SLOTS=3 WATCHDOG=…`. It prints one line per check (`OK` / `WARN` /
`FAIL` / `SKIP` with numbers), then `RESULT <id> ok|fail L=… weir=… gate=… routes=… zones=… hops=…` (plus `FAIL=` /
`SKIP=` lists), writes `<id>-karp.json` (every check's numbers, flagged places, the carry walks, the drop coverage) and
the pictures. `RESULT ok` needs all sixteen checks OK or WARN, with the physical proof and the carry walk run.

The checks run in the game page (`tools/botlab/karp-check-page.js`), through the engine's own Carp Field
(`src/game/karpField.js`: the carrier graph is nav's valid nodes minus spawn zones and carrierBlock, its walk / jump /
drop / climb edges plus the field's hop and gap edges) and the level's own physics. Every team-dependent check runs for
both teams (the data describes Alpha's attack; Bravo's is the mirror). One stage takes 1–4 minutes.

**How each check judges** (numbers from SPEC §4.4 / §9.1; my readings where the spec left a gap are marked *):

| # | check | judged |
|---|---|---|
| 1 | Data | FAIL: the Pond > 0.3 m off (0, 0); the Pond, any weir, either Gate or any sign (both teams) with no floor within 0.3 m under it, on a `roof` block, or inside a spawn zone (barrier + 0.6 m, above the pad − 1 m); no carrier-graph node under the Pond; a kit post / sign block (`karp-weir*`, `karp-gatepost*`, `karp-sign*`) not `roof` or taking ink.* (The sill and the plinth are floor and take ink.) |
| 2 | Field | FAIL: \|L_A − L_B\| > 2 %; a hole (a node reached on the carrier graph from the Pond with D = ∞ for a team, unless the data waives it*); \|fieldAt − D\| > 0.05 m at any node; any sweep point (¼, ½, ¾ of every walk edge, ±0.3 m across where the waist line is clear) more than 2.5 m below its proven lower bound. Reported: hop / gap edges added, the largest gain across one, points > 1.5 m low. The halfway line is drawn. |
| 3 | Distances and counts | FAIL: a weir's count outside 45–60 (40–55 % of L); weir → Gate < 25 m or < 45 % of L; two weirs > 2 counts apart or < 12 m apart; 0 or > 2 weirs; L outside 55–85 m. Reported: Pond → weir → Gate along the field and on route 1, the Gate's distance from its pad, the lowest count within 3 m of each weir (reported, not judged: decision D1). |
| 4 | Reachability | FAIL: no carrier route, without climbs, spawn zones, the team's own free zones or carrierBlock, for Pond → each weir or weir → Gate, either team. |
| 5 | Two routes | Route 1 the shortest no-climb route; route 2 the shortest avoiding every node within 2.5 m (3D*) of route 1 except within 6 m of either end; route 3 with climbs, off both, reported. FAIL: a leg with no route 2 or route 2 > 1.6 × route 1, every weir both ways, both teams. Two weirs: their routes 1 meet (≤ 2.5 m apart outside 6 m of the ends), either route 1 passes within 4 m of the other weir, or the weirs < 12 m apart. `routes` hints are measured and named. |
| 6 | Carry times | FAIL: Pond → Gate (L) outside 11.5–18 s at 4.8 m/s. Reported per leg via each weir, walking and swimming (9.44 m/s). |
| 7 | No shortcut into a base | (a) every carrier-graph edge crossing into the Gate's 15 m ring (and a roof-less car's stop, and — new — a made hop over off-field ground at its exit, D2), grouped single-linkage within 3 m; FAIL outside 2–5, or an entrance none of whose crossings is seen from 1.5 m above any edge node of the defenders' spawn deck (to 1 m above the crossing). (b) the field without climbs vs with, from every halfway-line node: a with-climbs path saving > 20 % lists its climb edges: FAIL. (c) a drop or down-gap edge of > 2.5 m ending inside a ring: FAIL. (d) six probes, each find listed with a picture when the two ends' D differ > 10 m (FAIL), or one end is off the field (WARN: a hiding place, D3): low gaps (a 0.35 m squid tube 0.3 m up, nodes ≤ 3 m apart not joined by ≤ 6 m of walking), tall walls (nav's climb scan over 5.5 m), long drops (> 3.4 m with open air), high hops (1.8–2.1 m) and long gaps (3.0–3.8 m) that #16's kid really makes, and hops onto off-field ground (D2) that it makes. A find within 2 m of a `waive` entry of that check is waived.* |
| 8 | Gate placement | FAIL: 12–20 m from the defending pad (horizontal) not met; more than 0.2 m above the pad; outside ±40° of the pad → Pond line; not seen from the deck; inside any free zone. |
| 9 | High ground and free zones | Plateaus: connected carrier-graph nodes ≥ 1.4 m above the lowest nav node within 3 m (≥ 2 nodes*), on the half most of their nodes are on. FAIL: one the owner's carrier reaches (any carrier route from the Pond) and the enemy kid only by climbing (no route without climbs from the halfway line, one with), unless every node is inside the owner's zones. Zone entrances: every carrier-graph edge (climbs included) into the zone's polygon and band, the crossings (edge midpoints*) chained within 3 m; FAIL an entrance with no sign (of any of the owner's zones*) within 2 m of a crossing, or one wider than 8 m without a sign within 2 m of each end (its two farthest crossings). FAIL a zone node with D_owner ≤ D_other (both finite*); a zone touching a weir trigger, a Gate trigger, or a route 1 / route 2 node of any leg; a `noRetreat` polygon within 3 m of a plateau or a zone. WARN: enemy arrival (walk 6 m/s, climb 7.5) > 2 × the owner's (from its deck), or a single entrance (plateaus ≥ 4 m²*). |
| 10 | Retreat sanity | Route 1 and route 2 from each team's own Gate area to the Pond, on its own half: FAIL a dip of P (= L − D) below its running best of > 6 m outside `noRetreat`. Across every state switch the carrier's mark resets (§3.3), so the dip is 0 by rule; the raw change of P a still carrier would see on the routes is reported. |
| 11 | Carry walk | On a fresh match per team, bots out: a scripted carrier picks it up at the Pond, walks route 1 to weir 1 (WASD + space, jumping the hops and gaps, re-planning on the carrier graph after 2.5 s without progress — a stuck episode), plants, re-pops, walks to the Gate. Then a retreat walk on its own half (×3 on at 8 m back, off at 3 m: measured from its own `mark`), a visit to its own zone (×3), a fall into the water from the wet node nearest the Pond on each half (own half → the Pond; enemy half → dropped by the last footing, on that half, ≤ 12 m), a splat on the narrowest walk near each weir (rests on `wide` floor). Drop coverage: the field's drop spot at every 4th node of route 1 and route 2 of every leg and every node inside each zone (its enemy carrying): a spot on the carrier's half, ≤ 12 m away except inside an enemy zone, never the Pond. FAIL any of these. |
| 12 | Variant | FAIL: a piece in the Bazookarp build that Turf War lacks and that isn't the kit or tagged `onlyIn: 'bazookarp'`; a Turf War piece missing without `notIn: 'bazookarp'`; no `assets/lightmaps/<id>.bazookarp.json`, or a stale one (the level applied none). A test stage (karpbox) is never baked. |
| 13 | Deep spawns | Ways off the deck (a level flood from the pad, ≤ 16 m): nav edges leaving it, chained within 3 m: FAIL < 3. The apron: route 1 from the deck's edge to the Gate in front of it; FAIL < 2 solid static blocks (≥ 0.45 m across, prop colliders count, not the kit, not the deck's own blocks) rising ≥ 1.2 m above a route node within 4 m of it. |
| 14 | The Pond | FAIL: < 70 % of the 4.5–10 m ring is floor (nav cells at any level within ±5 m of the Pond*), or the shell's centre (1.3 m up) seen from fewer than 6 of 8 points 7 m out at 1.5 m above their floor. |
| 15 | Weir room | FAIL: any solid block within 3.0 m of the weir's centre between 0.3 and 3.6 m above its floor (its own posts and sill excepted); its centre not seen from 1.5 m above route 1's node 8 m before it or 8 m after it; seen from fewer than 3 of 8 points 7 m out. |
| 16 | The hop and gap edges, proved | Every hop and gap edge the field added, every high-hop and long-gap candidate of #7d and every hop onto off-field ground: a kid with `carry` set (4.8 m/s, the carrier's jump) stepped through `actor.update` at 1/60 s, alone (everyone else parked), from 1.5 m and from 3 m before the low end (shortened toward it until it stands on floor), facing the far end, steering to it, jump pressed when 0.2 / 0.5 / 0.8 / 1.1 / 1.4 m before the edge (a hop: its riser; a gap: the rim); made = grounded on the far node's floor within 0.5 m of it inside 2 s. FAIL: an added edge never made (printed as `hopVeto` entries to paste). Made candidates beyond the rules go to #7d with their gain. |

**Pictures** (JPEG < 290 KB; `sips` not needed, the page encodes them): `<id>-karp-top.jpg` (the whole stage from above,
Alpha attacking left → right: Alpha's count as a heat map with dots every 10 counts, the halfway line, Alpha's routes
Pond → weir and weir → Gate with route 2 dashed, both Gates with their 15 m rings and entrance arrows (red = unseen),
weirs as diamonds, the Pond and its burst ring, free zones hatched in the owner's ink with their signs and entrances
(green ring signed, red X not), noRetreat / carrierBlock / noRest outlined, plateaus (red = FAIL), hop / gap edges as
ticks (green made, red not), made candidates beyond the rules in magenta, numbered flags and a legend); `-pond`,
`-weir-<i>-approach` / `-defend` (from the farthest clear point 6–14 m back / on along the route), `-gate-approach`,
`-gate-deck`, `-zone-<i>`, `-noretreat-<i>`, `-flag-<n>` (the first 8 flagged places), and with KITSHOTS the kit up
close.

### 1.2 Stage states, generically

A stage module offers its field states through `R.karpStates() → [{ key, nodeOk(id), query }]`;
`G.match.stage.karpStates()` (new in `src/game/stageMods.js`, the first module offering any) is what the engine already
asked for. `query` is the page query of the module's own audit switch (`era=2`, `lava=high`). The checker lists the
field's states; without ERA / LAVA / KSTATE it checks each in turn, each on a page loaded with its `query` (so the world
is in that state for the sight lines, the kid and the carry walk) and the field switched to it; `ERA=2` loads `?era=2`
and checks the state keyed 2. docs/STAGE-MODS.md has the row and T4 marked served. Proof: the self-test's `states` case
(a test-only module, `tools/botlab/karp-check-states.js`, raising a wall 2.6 m from the weir in its state `w` only):
#15 passes in state 0 and FAILs in state `w`, built from `?kcstate=w`. karpbox's own test-only state (`testStates`)
is checked as a field state on the same page. The era, lava and pipe modules are still placeholders on this base, so no
shipped stage has states yet.

### 1.3 The kit in final form (`src/world/bazookarp-kit.js`, `src/fx/karpKitFx.js`)

- **Weir:** two dressed stone posts 5.4 m apart centre to centre across the walking direction — a 0.72 m footing
  (0.3 m), a 0.5 m shaft, a dark band at 1.55–1.68 m, a 0.64 m capital (2.4 m in all) — every part `roof`, no ink;
  between them a 0.12 m stone sill the curtain falls onto (floor, takes ink). The shafts' inner faces are 2.45 m out
  and the footings / capitals clear the shell's full 2.3 m swell at their heights (the clean box's weir passes #15 and
  the rest flags' `clear`).
- **Dragon Gate:** an octagonal plinth 3.4 m across the flats (built as mapkit's OCT in the Gate's own frame: a plus of
  slabs 0.15 m high, its corners a 0.05 m step, no shared tops), two posts 4.4 m apart (0.8 m footing, 0.6 m shaft,
  gold band, capital: 3.2 m) — posts `roof`, no ink.
- **NO CARP sign:** a stone foot, a 0.15 m wooden post, a 0.75 × 0.5 m board facing the sign's yaw (1.9 m), all `roof`,
  no ink; `karpKitFx` puts the crossed-out carp over "NO CARP" in the owning team's ink on both faces of the board.
- **carrierBlock shimmer** (`karpKitFx`): a faint wall per polygon edge from the volume's floor up 2.4 m, diagonal bands
  drifting upward (brightest at the floor), the NO CARP glyph mid-wall; everyone sees it.
- `karpKitFx` is its own module (built and cleared on `match:state`, animated in `onBeforeRender`), so WP2's rebuild of
  `bazookarpFx.js` doesn't collide with it. The carp-head caps that sink, the curtain and the Gate's arch stay
  bazookarpFx's (they move).

Pictures: KIT-PICTURES

### 1.4 `karp-field.js` in the regression set; the builder's template

- `tools/botlab/README.md`: the checker, its self-test, and a **Bazookarp regression set** (karp-field.js on karpbox
  and every stage; the rules / gun / loop tests when the engine moves; the checker's self-test and per-stage runs;
  check-maps and karp-layout-diff for the other modes).
- `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`: the per-stage builder's brief pointing at SPEC §9 — the eight
  deliverables of §9.2 and their format, the checker's usage with what to fix per check, waivers, stage states, the
  regressions, and the NOTE.md template.

## 2. Tests and results (all local)

SELFTEST-RESULTS

HONEST-REPORT

ALL-STAGES

Other modes untouched:
- `node build/check-maps.mjs` on every stage: identical to b55f7472 (halyard's 25.7° ramp, half[41], is there on the
  base too). `<id>.bazookarp`: halyard the same ramp; lockgate's first-cut weir post stands inside the office (a data
  issue the checker's #15 reports, not the kit's).
- `node tools/botlab/karp-layout-diff.mjs <b55f7472 tree>`: **RESULT same (96/96 builds and thumbnails identical)** —
  every stage's Turf War / Zone Control / Tower Command / Boss Battle build and both stage-card thumbnails.
- KARP-FIELD

## 3. Decisions where the spec left a gap (for the lead)

- **D1. #3's "each weir's count is the lowest within 3 m of it on its floor" is reported, not judged.** On any floor
  that falls toward the Gate the nodes 3 m on read about 5 counts lower, so the literal rule fails every placement (the
  clean box's weir: count 60, 55 within 3 m). Its purpose ("landing it is never worth less than walking past it") already
  holds by the cap (§3.4: until the plant the count stops at the highest weir count, a plant sets the planted weir's).
  The JSON keeps `low3` per weir. TELL THE LEAD.
- **D2. Hops onto off-field ground: a sixth #7d probe, and #7a counts them.** The field's hop edges join field nodes
  only, and nav keeps only nodes it can walk to and back from, so **a ledge top that only a hop reaches is outside the
  field**: no field edge, no entrance, no reading (a carrier up there keeps its last value). SPEC §4.4's own self-test
  fault — "a 1.5 m non-inkable ledge into one Gate's ring that only a hop climbs" — is exactly that, and the checker as
  first built missed it (self-test f7 failed). Now: every 1.25–1.8 m hop from a field node onto a non-field node, with
  that ground's exits (nav walks / drops back onto the field), is tried by #16's kid; a made one is a #7d find (its gain
  to the best exit) and, starting outside a Gate's ring and exiting inside, a #7a entrance at the exit (seen or not).
  **For the engine (not done here, it is WP0's / the lead's call):** the field could take such tops in (nodes reached by
  a hop edge) so a carrier on one has a reading; until then the checker makes builders close or show every such ledge.
- **D3. A #7d find with one end off the field** (D = ∞: a node no route reaches) is a WARN, listed as a hiding place,
  not a FAIL: its "gain" has no number. A made hop onto off-field ground is judged by its exits instead (D2).
- **D4. #7c counts drops off the defenders' own spawn deck** (its nodes beyond the barrier are carrier-graph nodes) into
  the ring, as the spec's words say. On halyard these are 20 of its finds; a stage closes them with a rail or a zone,
  or the lead waives them.
- **D5. Waivers live in the data:** `waive: [{ check: '7d', at: [x, z], why }]` (Alpha's attack, mirrored) — a find of
  that check (2, 7a–7d, 9) within 2 m is reported as waived. The spec says "waived by the lead in the stage note"; a
  tool can't read notes, so the data carries the lead's word and the note explains it. `bazookarp-data.js` documents it.
- **D6. The self-test box is karpbox plus a clean variant**, not karpbox as built: karpbox (WP0's test field) fails
  §9.1 by design (L 47 m, an open Gate front is one entrance, unsigned zones, a climb-only plateau). `karp-check-box.js`
  adds a ring wall round each Gate with two openings (L 61.6 m, four entrances), a deck parapet with three openings, two
  apron crates, the spawn-deck zone signed, karpbox's plateau out, its climb box roofed and its big drop-outside zone
  out. `karpbox.js` itself is untouched (the rules tests rely on it).
- **D7. One fault per check, plus SPEC §4.4's own list.** The task asks for sixteen faults; the spec's list has ten
  (several on the same check). The self-test has f1–f16 (one each) and x5 (two weirs 8 m apart), x7d (the squid-only
  gap), x7b (a climb shortcut saving 30 %), x9a (a half-covered plateau), x9b (a noRetreat over a zone), x9c (a zone over
  the halfway line), and `states`. The spec's "weir against a wall" is f15 (a pillar 2 m from the weir).
- **D8. #9's plateau WARNs** (enemy arrival > 2 × the owner's, single entrance) are given for plateaus of 4 m² or more;
  the FAIL rule is the spec's, for any size (so a 2 m² climb-only crate top on a team's half fails until its zone covers
  it or it is made `roof`).
- **D9. #13 "ways off the deck"** are nav edges of any type (drops included) leaving a level flood of the deck from the
  pad, chained within 3 m: a continuous drop front is one way. The deck's own blocks are not apron cover.
- **D10. #14 counts floor at any level within ±5 m of the Pond** (a raised Pond, like halyard's on the ferry roof, has
  its fighting room below it).
- **D11. #16's run-up**: when 1.5 m / 3 m back is not floor at the low end's height (a narrow ledge), the start moves
  toward the edge in 0.3 m steps; with no start at all the edge counts as not made (conservative: printed as hopVeto).
- **D12. #11's falls** use the wet node nearest the Pond on each half; "the narrowest walkway near each weir" is the
  route node within 12 m of the weir (≥ 3 m from it) with the fewest nodes within 1.5 m. The main carry starts from a
  shell burst by script (no shooting) and a re-pop by script.
- **D13. Kit looks in their own module** (`karpKitFx.js`), and the sill and the Gate plinth take ink (they are floor);
  only posts, signs and boards are `roof` with no ink.
- **D14. Stage states carry a `query`** (the page query of the module's audit switch) so one generic checker builds each
  state's world; ERA= / LAVA= map to `era=` / `lava=` and pick the state with that key; KSTATE= is the generic one.

## 4. Online, bots

Nothing crosses the wire: the checker is a tool, the kit pieces are static level pieces built the same on every screen
(from the data, in `layoutFor`), `karpKitFx` is local looks, `G.match.stage.karpStates()` is a query. No bot code.

## 5. Commits and shared files

COMMITS

## 6. Unfinished, uncertain

- **Nothing ran on the Mac mini** (away): every run above is local. No balance sets (none apply to this package).
- **The 60 ms field budget** (WP0 / WP1's open item) was not re-measured here; the checker reports its own time per
  check in the JSON (`ms`), not the field's load cost.
- **The gimmick stages have no states yet** on this base (eras.js / lava.js / pipes.js are placeholders), so the
  generic state path is proved only with the test module and karpbox's test state. When bluestone and caldera land,
  their modules need `R.karpStates()` with a `query` each (docs/STAGE-MODS.md says how); the wip stages were not run
  (`WIP=1` does it; on placeholder data they fail by design).
- **#16 is conservative**: an edge whose run-up can't stand anywhere (a ledge with no floor behind it at its height)
  counts as not made and is printed as a hopVeto entry; a builder who knows the move is real should open the run-up.
  The kid steers at the far node and presses jump at five distances; a move that needs a different timing (a long
  run-off with no jump) could read as not made. On halyard 72 of 546 added edges were not made: most are gap edges
  between pontoons (diagonal 2.8–3.0 m), which are plausibly real misses, but I did not look at each.
- **#7d's long gaps and high hops that a kid makes are many on some stages** (halyard: 122 of 150 long-gap candidates
  made, 11 of them gaining > 10 m): the field's gap rule (≤ 3.0 m flat) is short of what a carrier jumping *down* across
  a gap reaches. The checker lists them per the spec; the lead may prefer to widen the field's gap rule for down-gaps
  instead of closing each (that is WP0's code). TELL THE LEAD.
- **Hops onto off-field ground (D2)** are a gap in the field itself; the checker catches them, the engine does not read
  them. The lead decides whether WP0's field takes such tops in.
- **karpbox's checker variant** puts its Gate ring wall in `half` pieces only for the self-test (`karp-check-box.js`);
  net-karp and the rules tests keep karpbox as it is.
- **The kit's look** was judged from the pictures here only (no lightmap: the Bazookarp variants are not baked; WP4b and
  the stage builders bake them). WP2 owns the moving parts (caps, curtain, arch) and may want the board glyph drawn its
  own way; `karpKitFx` is self-contained if so.
