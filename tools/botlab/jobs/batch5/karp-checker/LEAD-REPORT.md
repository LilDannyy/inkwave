# Bazookarp WP4a: the checker and the stage kit (key `karp-checker`): lead report

Worktree `st-b5-karp-checker`, branch `b5-karp-checker` from `b5-int3` b55f7472. Nothing pushed. Everything ran
locally (my task: the Mac mini unavailable), one Electron instance at a time under the shared SLOTS=3 lock. The machine was saturated
the whole time (load average 230–760, all three slots busy with other builders), which matters only for the field's
timing rows (§2.4).

**Takeover.** The first builder (2026-10-10) was cut off after about two hours. It left the checker, the self-test box,
the kit, the stage-state hook, the README section and the builders' brief committed, a draft of this report with every
result still a placeholder, and small uncommitted carry-walk fixes. Nothing it ran had survived (its output folder was
gone). I read all of it, kept it (it is sound and careful), committed the carry-walk fixes, and then:

- **added what the package asked for and the checker lacked:** #16's walks. A kid with the carrier's rules now walks
  every route and goes through every entrance into each Gate's ring;
- **fixed a regression the kit had caused:** bazookarp-rules L7 was at 116/117;
- **fixed four checker defects** found in the runs (silent OK / wrong messages on stages with no route), hardened
  the self-test so each fault must fail *for its own reason*, and added a `PROBE=` tool that traces one move;
- **ran everything:** the self-test, the all-stages table, the regressions and the pictures.

## 1. What was built

### 1.1 `tools/botlab/bazookarp-check.cjs`: the checker (SPEC §4.4)

```
MAP=halyard tools/botlab/run.sh tools/botlab/bazookarp-check.cjs      one stage
MAP=all  …   every shipped stage (the twelve and Cargo) in one go, then the table   (WIP=1 adds bluestone, aquarium, caldera)
MAPS=a,b …   some stages
KARP_SELFTEST=1 … the self-test on karpbox (CASES=clean,f7,… picks cases)
PROBE='[x,y,z,x,y,z]' MAP=<id> …   one move traced: #16's kid frame by frame on the node pair nearest those points, and
                                   the blocks (pieces, prop colliders) where each trial stopped
PROBE='walk:<text>' MAP=<id> …     one of #16's walks (the one whose name holds <text>) again, every frame, with its path
env: OUT=dir (default .botlab/karp-check)   KARP_DEF='{…}' trial data   SHOTS=0 / CARRY=0 / PHYS=0 (quick; a RESULT ok
     needs all three)   DEVSTAGE=1 (Cargo; MAP=all adds ?devstage for Cargo itself)   ERA=1|2|3 / LAVA=low|high /
     KSTATE=<key> one stage state, else every state in turn   FLAGSHOTS=n   KITSHOTS=1 (the kit up close)
```

Always with `BOTLAB_OUT=…/inkwave-upstream/.botlab SLOTS=3 WATCHDOG=…`. It prints one line per check (`OK`, `WARN`,
`FAIL` or `SKIP`, with numbers), then:

```
RESULT <id> ok|fail L=… weir=… gate=… routes=… zones=… hops=… walks=<routes ok/n>+<entrances ok/n> [FAIL=… SKIP=…]
```

It also writes `<id>-karp.json` (every check's numbers, its flagged places, the walks, the carry walks, the drop
coverage) and the pictures. `RESULT ok` needs all sixteen checks OK or WARN, with the physical proof and the carry walk
run. One stage takes 40 s – 4 min here (calamari is the slowest).

The checks run in the game page (`tools/botlab/karp-check-page.js`). They use the engine's own Carp Field
(`src/game/karpField.js`) and the level's own physics:

- the carrier graph is nav's valid nodes minus the spawn zones and carrierBlock volumes;
- its edges are nav's walk, jump, drop and climb edges plus the field's hop and gap edges.

Every team-dependent check runs for both teams. The data describes Alpha's attack; Bravo's attack is the mirror.

**How each check judges.** The numbers are SPEC §4.4 / §9.1's. My readings where the spec left a gap are marked \*
(the decisions are in §3).

| # | check | judged |
|---|---|---|
| 1 | Data | FAIL any of: the Pond > 0.3 m off (0, 0); the Pond, any weir, either Gate or any sign (both teams) with no floor within 0.3 m under it, on a `roof` block, or inside a spawn zone (barrier + 0.6 m, above the pad − 1 m); no carrier-graph node under the Pond; a kit post / sign block (`karp-weir*`, `karp-gatepost*`, `karp-sign*`) that is not `roof` or takes ink.\* (The sill and the plinth are floor and take ink.) |
| 2 | Field | FAIL any of: \|L_A − L_B\| > 2 %; a hole (a node reached on the carrier graph from the Pond with D = ∞ for a team, unless the data waives it\*); \|fieldAt − D\| > 0.05 m at any node; any sweep point (¼, ½, ¾ of every walk edge, ±0.3 m across where the waist line is clear) more than 2.5 m below its proven lower bound. Reported: the hop / gap edges added, the largest gain across one, the points > 1.5 m low. The halfway line is drawn. |
| 3 | Distances and counts | FAIL any of: a weir's count outside 45–60 (40–55 % of L); a weir with no field reading at all; weir → Gate < 25 m or < 45 % of L; two weirs > 2 counts apart or < 12 m apart; 0 or > 2 weirs; L outside 55–85 m. Reported: Pond → weir → Gate along the field and on route 1; the Gate's distance from its pad; the lowest count within 3 m of each weir (reported, not judged: D1). |
| 4 | Reachability | FAIL: no carrier route for Pond → each weir or weir → Gate, either team, without climbs, spawn zones, the team's own free zones or carrierBlock. |
| 5 | Two routes | Route 1 is the shortest no-climb route. Route 2 is the shortest one avoiding every node within 2.5 m (3D\*) of route 1, except within 6 m of either end. Route 3 (climbs allowed, off both) is reported. FAIL: a leg with no route at all, no route 2, or route 2 > 1.6 × route 1, for every weir both ways, both teams. With two weirs, also FAIL when: their routes 1 meet (≤ 2.5 m apart outside 6 m of the ends); either route 1 passes within 4 m of the other weir; or the weirs are < 12 m apart. `routes` hints are measured and named. |
| 6 | Carry times | FAIL: Pond → Gate (L) outside 11.5–18 s at 4.8 m/s. Reported per leg via each weir, walking and swimming (9.44 m/s). |
| 7 | No shortcut into a base | (a) Every carrier-graph edge crossing into the Gate's 15 m ring, grouped single-linkage within 3 m. Also counted: a roof-less car's stop in the ring, and a made hop over off-field ground whose exit is in the ring (D2). FAIL: outside 2–5 entrances, or an entrance none of whose crossings is seen from 1.5 m above any edge node of the defenders' spawn deck (to 1 m above the crossing). (b) The field without climbs vs with, from every halfway-line node. FAIL: a with-climbs path saving > 20 % (its climb edges are listed). (c) FAIL: a drop or down-gap edge of > 2.5 m ending inside a ring. (d) Six probes; each find is listed with a picture. FAIL when the two ends' D differ by > 10 m; WARN when one end is off the field (a hiding place, D3). The probes: low gaps (a 0.35 m squid tube 0.3 m up, between nodes ≤ 3 m apart not joined by ≤ 6 m of walking); tall walls (nav's climb scan over 5.5 m); long drops (> 3.4 m with open air); high hops (1.8–2.1 m) and long gaps (3.0–3.8 m) that #16's kid really makes; hops onto off-field ground (D2) that it makes. A find within 2 m of a `waive` entry of that check is waived.\* |
| 8 | Gate placement | FAIL any of: not 12–20 m from the defending pad (horizontal); more than 0.2 m above the pad; outside ±40° of the pad → Pond line; not seen from the deck; inside any free zone. |
| 9 | High ground and free zones | **Plateaus:** connected carrier-graph nodes ≥ 1.4 m above the lowest node within 3 m (≥ 2 nodes\*), on the half most of their nodes are on. FAIL a plateau the owner's carrier reaches (any carrier route from the Pond) and the enemy kid reaches only by climbing (no route without climbs from the halfway line, one with), unless every node is inside the owner's zones. **Zone entrances:** every carrier-graph edge (climbs included) into a zone's polygon and band; the crossings (edge midpoints\*) chained within 3 m. FAIL an entrance with no sign (of any of the owner's zones\*) within 2 m of a crossing, or one wider than 8 m without a sign within 2 m of each end (its two farthest crossings). **Also FAIL:** a zone node with D_owner ≤ D_other (both finite\*); a zone touching a weir trigger, a Gate trigger, or a route 1 / route 2 node of any leg; a `noRetreat` polygon within 3 m of a plateau or a zone. **WARN:** enemy arrival (walk 6 m/s, climb 7.5) > 2 × the owner's (from its deck), or a single entrance (plateaus ≥ 4 m²\*). |
| 10 | Retreat sanity | Route 1 and route 2 from each team's own Gate area to the Pond, on its own half. FAIL a dip of P (= L − D) below its running best of > 6 m outside `noRetreat`. Across every state switch the carrier's mark resets (§3.3), so the dip is 0 by rule; the raw change of P a still carrier would see on the routes is reported. |
| 11 | Carry walk | A fresh match per team, bots out, a scripted carrier (WASD + space): it picks the Bazookarp up at the Pond, walks route 1 to weir 1 (re-planning on the carrier graph after 2.5 s without progress: a stuck episode, logged with its place and edge), plants, re-pops and walks to the Gate. Then four more walks: a retreat on its own half (×3 on at 8 m back, off at 3 m, measured from its own `mark`); a visit to its own zone (×3); a fall into the water from the wet node nearest the Pond on each half (own half → the Pond; enemy half → dropped by the last footing on that half, ≤ 12 m; up to 8 edges tried when a railing stops the fall); a splat on the narrowest walk near each weir (must rest on `wide` floor). **Drop coverage:** the field's drop spot at every 4th node of route 1 and route 2 of every leg, and at every node inside each zone (its enemy carrying). Each must land on the carrier's half, ≤ 12 m away except inside an enemy zone, never at the Pond. FAIL any of these. |
| 12 | Variant | FAIL any of: a piece in the Bazookarp build that Turf War lacks and that is neither the kit nor tagged `onlyIn: 'bazookarp'`; a Turf War piece missing without `notIn: 'bazookarp'`; no `assets/lightmaps/<id>.bazookarp.json`, or a stale one (the level applied none). A test stage (karpbox) is never baked. |
| 13 | Deep spawns | **Ways off the deck** (a level flood from the pad, ≤ 16 m): nav edges leaving it, chained within 3 m; FAIL < 3. **The apron:** route 1 from the deck's edge to the Gate in front of it; FAIL < 2 solid static blocks (≥ 0.45 m across, prop colliders count, not the kit, not the deck's own blocks) rising ≥ 1.2 m above a route node within 4 m of it. |
| 14 | The Pond | FAIL: < 70 % of the 4.5–10 m ring is floor (nav cells at any level within ±5 m of the Pond\*), or the shell's centre (1.3 m up) is seen from fewer than 6 of 8 points 7 m out (1.5 m above their floor). |
| 15 | Weir room | FAIL any of: a solid block within 3.0 m of the weir's centre between 0.3 and 3.6 m above its floor (its own posts and sill excepted); no route to look along; its centre not seen from 1.5 m above route 1's node 8 m before it or 8 m after it; seen from fewer than 3 of 8 points 7 m out. |
| 16 | Proved physically | **(i) The edges.** Tried: every hop and gap edge the field added, every high-hop and long-gap candidate of #7d, and every hop onto off-field ground. A kid with `carry` set (4.8 m/s, the carrier's jump, both spawn barriers, carrierBlock) is stepped through `actor.update` at 1/60 s, alone (everyone else parked). It starts 1.5 m and 3 m before the low end, shortened toward it until it stands on floor (D11). It faces the far end and steers to it; a move down is first tried as a run-off; jump is pressed 0.2 / 0.5 / 0.8 / 1.1 / 1.4 m before the edge (a hop: its riser; a gap: the rim). Made = grounded on the far node's floor within 0.5 m of it inside 2 s (or on that floor ≤ 3 m away with a clear waist line). **(ii) The walks (new).** The same kid walks every route 1 and route 2 of every leg, both teams, and goes through every entrance into each Gate's ring: one crossing per entrance with an 8 m run-up from the Pond side, then on to the Gate (climbs, rides and off-field hops excepted: they are proved apart). It steers at the next node. It jumps on a jump or hop edge within 1.6 m of the node; on a walk edge only at a real riser (the floor 0.45 m ahead above the step-up, never a ramp's slope); at a rim; and after 0.8 s without progress. Standing on something right over its node, it heads for the next one. A grounded kid whose own node (the field's reading rule) is one of the next 8 path nodes has reached it. A hop, gap or nav jump edge it doesn't make on the way is decided by that edge's own five-timing trial (made: it is set down on the far node and goes on, counted). **FAIL:** an added edge never made (printed as `hopVeto` entries to paste, broken down by kind); a walk stuck 2.5 s, fallen off or out of time (its place is printed and drawn: ⊗). A walk stuck against a dynamic block (a parked mover) is reported, not judged. Made candidates beyond the rules go to #7d with their gain. |

**Pictures** (JPEG < 290 KB; the page encodes them):

- **`<id>-karp-top.jpg`**, the whole stage from above, Alpha attacking left → right:
  - Alpha's count as a heat map, with dots every 10 counts, and the halfway line;
  - Alpha's routes Pond → weir and weir → Gate (route 2 dashed);
  - both Gates with their 15 m rings and entrance arrows (red = unseen); weirs as diamonds; the Pond and its burst
    ring;
  - the free zones hatched in the owner's ink, with their signs and entrances (green ring = signed, red X = not);
  - `noRetreat` / `carrierBlock` / `noRest` outlined; plateaus (red = FAIL);
  - hop / gap edges as ticks: made thin green, not made thick red. Made moves beyond the rules are faint magenta, bold
    when they are a #7d find;
  - #16's failed walks as ⊗; numbered flags on leaders; a legend.
- **The rest:** `-pond`, `-weir-<i>-approach` / `-defend` (from the farthest clear point 6–14 m back / on along the
  route, preferring open floor), `-gate-approach`, `-gate-deck`, `-zone-<i>`, `-noretreat-<i>`, `-flag-<n>` (the first
  8 flagged places), and with `KITSHOTS=1` the kit up close.

### 1.2 Stage states, generically

A stage module offers its field states through `R.karpStates() → [{ key, nodeOk(id), query }]`.
`G.match.stage.karpStates()` is new in `src/game/stageMods.js` (the first module offering any); it is the call the
engine already made. `query` is the page query of the module's own audit switch (`era=2`, `lava=high`).

- The checker lists the field's states. Without ERA / LAVA / KSTATE it checks each in turn, each on a page loaded
  with its `query`, so the world is in that state for the sight lines, the kid and the carry walk; the field is switched
  to it.
- `ERA=2` loads `?era=2` and checks the state keyed 2.
- docs/STAGE-MODS.md has the row, and T4 is marked served.

**Proof:** the self-test's `states` case. A test-only module, `tools/botlab/karp-check-states.js`, raises a wall 2.6 m
from the weir in its state `w` only. #15 passes in state 0 and FAILs in state `w`, built from `?kcstate=w`.
karpbox's own test-only state (`testStates`) is checked as a field state on the same page.

On this base `eras.js`, `lava.js` and `pipes.js` are 6-line placeholders that register nothing, so no shipped stage
has states yet.

### 1.3 The kit in final form (`src/world/bazookarp-kit.js`, `src/fx/karpKitFx.js`)

- **Weir:** two dressed stone posts, 5.4 m apart centre to centre across the walking direction. Each post is a 0.72 m
  footing (0.3 m high), a 0.5 m shaft, a dark band at 1.55–1.68 m and a 0.64 m capital: 2.4 m in all. Every part is
  `roof` and takes no ink. Between them is a 0.12 m stone sill for the curtain to fall onto; it is floor and takes ink.
  The shafts' inner faces are 2.45 m out, so the footings and capitals clear the shell's full 2.3 m swell at their
  heights (the clean box's weir passes #15, and the rest flags' `clear`).
- **Dragon Gate:** an octagonal plinth 3.4 m across the flats, 0.15 m high. It is built as mapkit's OCT in the Gate's
  own frame: a plus of slabs with its four corners a 0.05 m step, and no shared tops. Two posts stand 4.4 m apart: a
  0.8 m footing, a 0.6 m shaft, a gold band and a capital, 3.2 m in all. The posts are `roof` with no ink.
- **NO CARP sign:** a stone foot, a 0.15 m wooden post and a 0.75 × 0.5 m board facing the sign's yaw, 1.9 m tall in
  all; every part `roof`, no ink. `karpKitFx` puts the crossed-out carp over "NO CARP" in the owning team's ink on both
  faces of the board.
- **Tags:** each post's shaft and each sign's post carry the plain tag (`karp-weir`, `karp-gatepost`, `karp-sign`:
  one per post, as the first kit had). The other parts are suffixed (`-base`, `-band`, `-cap`, `-foot`, `-board`).
  This takeover restored the plain tags, because bazookarp-rules L7 counts sign posts by `karp-sign` and had dropped
  to 116/117.
- **carrierBlock shimmer** (`karpKitFx`): a faint wall on each polygon edge, from the volume's floor up 2.4 m. Diagonal
  bands drift upward, brightest at the floor, with the NO CARP glyph mid-wall. Everyone sees it. This takeover changed
  the glyph's carp to dark violet (drawn white, it vanished against pale floor and sky) and lifted the shimmer slightly.
- `karpKitFx` is its own module, built and cleared on `match:state` and animated in `onBeforeRender`, so WP2's rebuild
  of `bazookarpFx.js` doesn't collide with it. The moving parts stay bazookarpFx's: the carp-head caps that sink, the
  curtain and the Gate's arch.

Pictures (`out/`):

- `kit-weir.jpg`, `kit-weir-post.jpg`, `kit-gate.jpg`, `kit-sign.jpg`, `kit-carrierblock.jpg` (karpbox);
- `halyard-kit-weir.jpg`, `halyard-kit-weir-post.jpg`, `halyard-kit-gate.jpg`, `halyard-kit-sign.jpg` and the same
  four `lockgate-kit-*.jpg` (real stages, their Bazookarp variants unbaked);
- the checker's own `halyard-gate-deck.jpg`, `halyard-weir-1-approach.jpg` and `self-clean-zone-1.jpg` (karpbox's zone and its signs).

The weir posts, Gate posts and boards read as dressed pieces in the game's chunky bevelled stone and wood. Nothing is a
bare box, and every top a kid could perch on is `roof` with no ink. The board's NO CARP glyph is in the owning team's
ink on both faces (`self-clean-zone-1`: Bravo's purple). The curtain in the weir pictures (a flat translucent plane) and
the Gate's ring are bazookarpFx's placeholders, WP2's to finish.

### 1.4 `karp-field.js` in the regression set; the builder's template

- `tools/botlab/README.md`: the checker, its self-test, `PROBE=`, and a **Bazookarp regression set**:
  - karp-field.js on karpbox and every stage;
  - the rules, gun and loop tests when the engine moves;
  - the checker's self-test and per-stage runs;
  - check-maps and karp-layout-diff for the other modes.
- `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`: the per-stage builder's brief, pointing at SPEC §9:
  - the eight deliverables of §9.2 and their format;
  - the checker's usage, with what to fix per check (#16's walks included) and `PROBE=` before pasting a hopVeto;
  - waivers, stage states and the regressions;
  - the NOTE.md template.

## 2. Tests and results (all local)

### 2.1 The checker's self-test (karpbox): 25/25

`KARP_SELFTEST=1`. Each planted fault must FAIL its own check *and* the check's text must match the case's `expect`
pattern (new: the fault is caught for the reason it plants, not by a knock-on). The clean karpbox must pass every
check, including the carry walk and #16's trials and walks. Three runs, no console errors:

- the full run gave 24/25: f16's pattern was stale after the #16 text gained its by-kind breakdown;
- with the pattern fixed, `CASES=clean,f16` gave 2/2;
- the physical cases (clean, f7, f16, f16w) re-ran on the final walker: 4/4.

The table takes those cases from the last run.

| case | check | the fault | result | checks failing |
|---|---|---|---|---|
| clean | – | the clean box | PASS | (none) |
| f1 | #1 | a NO CARP sign standing in the spawn zone | PASS | #1 |
| f2 | #2 | a wall on Bravo's half only (a `single`): Alpha's walk 50 % longer, L_A ≠ L_B | PASS | #2 #15 |
| f3 | #3 | the weir at 85 % of the way (count ≈ 15) | PASS | #3 #15 |
| f4 | #4 | the weir on a 3 m box only a climb reaches | PASS | #3 #4 #5 #9 #15 |
| f5 | #5 | the weir at the end of a 3 m dead-end corridor (one way in, 12 m long) | PASS | #3 #5 #15 |
| f6 | #6 | a third opening in the ring wall, straight in from the south: Pond → Gate ≈ 10 s | PASS | #3 #6 |
| f7 | #7 | a 1.5 m non-inkable ledge through the ring wall into the Gate's ring that only a hop climbs, screened from the spawn deck | PASS | #7 |
| f8 | #8 | the Gate 45° off the pad → Pond line | PASS | #3 #5 #6 #8 |
| f9 | #9 | a free-zone entrance with no sign | PASS | #9 |
| f10 | #10 | low walls either side of the Pond: the own-half route walks back toward its own base | PASS | #10 |
| f11 | #11 | a noRest polygon over 26 m of the routes: splats there find no resting spot within 12 m | PASS | #11 |
| f12 | #12 | a crate tagged notIn: 'turf' (it leaks into Zone Control and Tower Command too) | PASS | #12 |
| f13 | #13 | the apron's crates gone (no cover between the deck and the Gate) | PASS | #13 |
| f14 | #14 | two 3 m walls 5.5 m out from the Pond (N and NE; mirrored S and SW): seen from 3 of 8 | PASS | #14 |
| f15 | #15 | a pillar 2 m from the weir | PASS | #15 |
| f16 | #16 | an awning over the flank lane's 1.5 m step: the field adds the hop, no kid makes it | PASS | #16 |
| f16w | #16 | a 2.5 m thin fence across the Pond → weir approach with a 0.5 m slot on route 1's line: the graph walks through the slot (its centre ray passes), no carrier's 0.76 m body fits | PASS | #16 |
| x5 | #5 | two weirs 8 m apart | PASS | #3 #5 #15 |
| x7b | #7 | a climb shortcut: the ring's only opening far round by the deck, and an inkable stretch of its wall facing the Pond (a climb saves 30 %) | PASS | #3 #5 #6 #7 #9 #10 |
| x7d | #7 | a squid-only gap (0.7 m headroom) through the ring wall into the Gate's ring | PASS | #7 |
| x9a | #9 | a climb-only 3 m plateau with a zone over half of it | PASS | #9 |
| x9b | #9 | a noRetreat polygon over the spawn deck's zone | PASS | #9 |
| states | #15 | a stage module's second state (G.match.stage.karpStates(), its world on ?kcstate=w) puts a wall 2.6 m from the weir | PASS | (none) |
| x9c | #9 | a free zone poking 2 m over the halfway line | PASS | #9 |

The clean box: L 61.58 / 61.45 m, weir count 60, Gate 12 m from its pad, 4 entrances each side (all seen), 18 hop and
24 gap edges all made, walks 8/8 routes and 8/8 entrances. The carry walk knocks out both ways (weir 5.9 s + Gate
7.5 s), stuck 0, retreat ×3 on at 8.22 m / off at 2.9 m, ×3 in its own zone, both falls right, and 250 drop splats all
fine.

Pictures: `out/self-clean-karp-top.jpg` (and the perspective set), `out/self-f7-karp-top.jpg` (the ledge's unseen
entrance), `out/self-f16w-karp-top.jpg` (the slot's ⊗), `out/self-x7d-karp-top.jpg`, `out/self-x9a-karp-top.jpg`.

### 2.2 The honest report: halyard's and lockgate's first-cut data

Both fail, as expected. What fails, and what WP4b has to do:

**Halyard** (first cut: weir at (−8, 27.5), Gate at (0, 52.5), a spawn-deck zone with two signs). L 54.8 / 54.7 m.
FAIL #3 #5 #6 #7 #9 #10 #12 #13 #14 #16. Top-down and the full set: `out/halyard-*.jpg`, numbers in
`out/halyard-karp.json`.

- **#3 / #6, L and the weir:** L is 54.8 m (< 55) and weir → Gate is 24.4 m (< 25 m, and < 45 % of L). Weir count 45,
  the band's edge. Pond → Gate takes 11.4 s walking (< 11.5). So: lengthen the Gate's approach by a few metres (§9.3:
  "round the slip's head, down a level") and the weir lands mid-band.
- **#5:** Pond → weir route 2 is 51.2 m = 1.81 × route 1. The second way to the weir is too long: it needs a shorter
  parallel lane, or a second weir on the boatyard lane (§9.3).
- **#7:**
  - (c) 20 drops of 3.2 m off the spawn deck's edge into the Gate's ring, at (±6.5…±9.5, ±61.5…±62.5) (D4: a rail,
    a zone, or the lead's waiver);
  - (d) 18 finds over 10 m:
    - four long gaps a kid really makes from the 2.6 m tops at (17.5…19.5, −13.5…−21.5) down to the yard (10.3–26.4 m
      gained; on Alpha's half only, their mirrors gain less);
    - six slipway gaps at (±6.5, −0.24, ±39) (14.9–16.9 m);
    - two at (−8.5, 0.7, −15) → (−9…−8.5, 0, −11.5) (12–13 m);
    - six hops onto off-field tops at x ±22.5…23.95, one gaining 39.4 m at (23.95, 0, −25.5) → (23.5, 1.5, −26.5);
  - WARN: 16 squid-only gaps behind the spawn deck at (±4.5…±6.5, 2.4, ±66.5…±68.5) (hiding places).
- **#9:**
  - climb-only plateaus not wholly in a zone: the spawn deck's two 21 m² wings at (±7.8, 2.3, ±65.9) (9 / 21 nodes
    in the zone), two 4 m² tops at (±7, 3.2, ±62.5) (3 / 4), and a 15 m² top at (±14.5, 3.2, ±18.5) (0 / 15);
  - all four zone entrances a side unsigned: the data's two signs at (±6.4, 59.6) are not within 2 m of the crossings
    at (±8.1, 65.9) and (±3, 61.5).
- **#10:** route 1 on its own half dips 6.6 m (> 6) at (∓11.5, 2.4, ∓1.5), by the ferry deck's stair next to the Pond.
- **#12:** no `halyard.bazookarp` lightmap yet (expected until the layout is final).
- **#13:** only one cover block on the apron between the deck and the Gate (≥ 2).
- **#14:** the Pond's 4.5–10 m ring is only 47.9 % floor (the Pond sits on the ferry's roof with water round it;
  §9.3: "clear or move the centre piece").
- **#16:** 12 of 546 added edges not made (10 gaps down, 2 level): hopVeto entries printed. Walks: routes 8/8, entrances 10/10 (two deck-edge entrances needed the walker fix, D17).
- **Passes:**
  - #1, #2 (L within 0.2 %, no holes, the sweep's worst 1.53 m), #4, #8 (13.5 m from the pad, 2.25 m below it, on the
    line, seen), #15;
  - **#11:** the scripted carry knocks out both ways (weir 6.2 s + Gate 6.3 s), stuck 0, retreat ×3 on at 8.11 m /
    off at 2.91 m, ×3 in its own zone, falls (own half → the Pond, enemy half → dropped there), the narrow-walk splat
    on wide floor, 204 drop splats fine.

**Lockgate** (first cut: weir at (0, 24), Gate at (0, 52), a spawn-deck zone with two signs). L 58.0 / 57.9 m.
FAIL #5 #7 #9 #11 #12 #14 #15 #16. `out/lockgate-*.jpg`, `out/lockgate-karp.json`.

- **#5:** route 2 is 2.55 × route 1 to the weir (70.1 m) and 1.83 × from the weir to the Gate (49.7 m). Both legs need
  a real second way (§9.3: the weigh-house yard and the lock-side quay).
- **#7:**
  - (c) 10 drops of 3.1–3.3 m into the ring, at (8.5…9.5, 40.5) and (2.5, 59.5);
  - (d) 14 long gaps a kid makes from the 1.3 m quay at (±16.5…20.5, ±8.5…15.5) down into the lock chamber
    (−0.6 … −1.5) at (±17.5…20.5, ±11.75…12.25), each gaining 10.3–15.7 m.
- **#9:**
  - a climb-only 14 m² plateau at (±12.9, 2.5, ±29.4), 0 / 14 in a zone;
  - the spawn-deck zone's four entrances a side unsigned, at (∓4, ∓64.2), (±12, ∓63.5), (±1.8, ∓59) and
    (±6.3, ∓59): the data's two signs miss them all.
- **#11:** both teams' splat on the narrowest walk by the weir rests on narrow floor. The scripted carry itself
  knocks out both ways.
- **#12:** no lightmap yet.
- **#14:** the Pond ring is 63.9 % floor, and the shell is seen from 4 of 8 directions.
- **#15:** the weir at (0, 24) stands against the office: office, office-roof, office-parapet and a prop collider lie
  within 3 m, and the defenders' approach can't see it. Its mirrored post stands inside the office: check-maps
  reports the z-fight (§2.4). Move the weir into the weigh-house yard (§9.3).
- **#16:** 13 of 492 added edges not made, all gaps down from the office's top edge (3.05 m) to the floor: hopVeto
  entries printed. Walks: routes 8/8, entrances 8/8 (its two routes 2 needed the walker fix, D17).
- **Passes:** #1; #2 (0.2 %, no holes, sweep worst 1.15 m); #3 (weir count 50 = 50.1 % of L, weir → Gate 29.0 m);
  #4; #6 (12.1 s); #8 (12.6 m from the pad, 15° off the line, seen); #10; #13 (3 ways off the deck, 4 cover blocks).


### 2.3 Every shipped stage (`MAP=all`, the final code)

`MAP=all`: one Electron, about 35 minutes at load average 550–760. The `s` column is wall time per stage on that
saturated machine. Only halyard and lockgate have data; the other eleven run on the engine's placeholder data
(`placeholderKarp`) and fail by design (DECISIONS #10). Their rows are for the stage builders: what the stage itself
holds (edges, proof, finds) is real, while what depends on the Pond / weir / Gate spots is the placeholder's.

| stage | L (m) | weir counts | result | failing checks | hop + gap edges | #16 made / not made (hopVeto) | #16 walks: routes, entrances | beyond the rules made | #7d finds (gain > 10 m) | entrances A/B | s |
|---|---|---|---|---|---|---|---|---|---|---|---|
| tidewater (placeholder) | 57.02 / 55.45 | 100 | fail | #2 #3 #4 #5 #7 #11 #12 #15 #16 | 6 + 108 | 104 / 10 (h 0, g 0, g↓ 10) | 0/0, 12/12 | 41 of 46 | 49: lowGap off-field, lowGap 28, lowGap off-field | 5/7 | 196 |
| kelpline (placeholder) | 51.96 / 51.95 | 50 | fail | #3 #5 #6 #7 #9 #11 #12 #15 #16 | 40 + 1674 | 1707 / 7 (h 0, g 2, g↓ 5) | 8/8, 6/6 | 323 of 325 | 12: lowGap 11.6, lowGap 12.6, lowGap 10.6 | 3/3 | 93 |
| halyard | 54.8 / 54.68 | 45 | fail | #3 #5 #6 #7 #9 #10 #12 #13 #14 #16 | 16 + 530 | 534 / 12 (h 0, g 2, g↓ 10) | 8/8, 10/10 | 148 of 150 | 34: lowGap off-field, lowGap off-field, lowGap off-field | 5/5 | 61 |
| saltpan (placeholder) | 83.48 / 81.06 | 50 | fail | #2 #7 #8 #9 #11 #12 #13 #15 #16 | 91 + 186 | 261 / 16 (h 0, g 6, g↓ 10) | 8/8, 4/4 | 163 of 177 | 30: lowGap 11.2, lowGap 11.2, lowGap 10.6 | 2/2 | 179 |
| crossmarket (placeholder) | 65.13 / 65.4 | 49 | fail | #5 #7 #8 #9 #11 #12 #13 #14 #15 #16 | 0 + 173 | 167 / 6 (h 0, g 0, g↓ 6) | 6/6, 8/8 | 115 of 123 | 25: longGap 14.9, longGap 14.9, longGap 10.2 | 4/4 | 178 |
| lockgate | 58.03 / 57.9 | 50 | fail | #5 #7 #9 #11 #12 #14 #15 #16 | 66 + 426 | 479 / 13 (h 0, g 0, g↓ 13) | 8/8, 8/8 | 208 of 235 | 14: longGap 10.5, longGap 11.2, longGap 15.7 | 4/4 | 209 |
| terraces (placeholder) | 66.01 / 61.2 | 48 | fail | #2 #7 #8 #9 #11 #12 #13 #15 #16 | 145 + 641 | 780 / 6 (h 2, g 2, g↓ 2) | 8/8, 12/12 | 161 of 165 | 15: lowGap 21.5, lowGap 20, lowGap 20.9 | 5/5 | 276 |
| nantai (placeholder) | 72.85 / 72.99 | 50 | fail | #7 #8 #9 #12 #13 #15 #16 | 99 + 323 | 420 / 2 (h 0, g 2, g↓ 0) | 8/8, 4/4 | 121 of 135 | 18: lowGap 10.1, lowGap 12.1, lowGap 13.1 | 2/2 | 52 |
| craters (placeholder) | 69.39 / 69.26 | 50 | fail | #7 #8 #9 #11 #12 #13 #16 | 317 + 1376 | 1545 / 148 (h 16, g 20, g↓ 112) | 8/8, 2/2 | 405 of 419 | 5: lowGap 10.3, longGap 18.7, longGap 18.1 | 1/1 | 74 |
| calamari (placeholder) | 64.82 / 64.82 | 48 | fail | #7 #8 #9 #12 #13 #16 | 74 + 239 | 311 / 2 (h 0, g 0, g↓ 2) | 8/8, 12/12 | 107 of 123 | 10: lowGap 11.6, lowGap 12, lowGap 10.6 | 5/5 | 157 |
| spirhalite (placeholder) | 80.25 / 79.54 | 50 | fail | #5 #7 #8 #9 #11 #12 #13 #14 #15 | 84 + 622 | 706 / 0 | 8/8, 2/2 | 190 of 206 | 22: lowGap 15.1, lowGap 16.1, lowGap 15.5 | 1/1 | 117 |
| treehills (placeholder) | 70.93 / 70.48 | 52 | fail | #7 #8 #9 #11 #12 #13 #15 #16 | 197 + 200 | 393 / 4 (h 0, g 0, g↓ 4) | 8/8, 6/6 | 168 of 190 | 24: lowGap 10.8, lowGap 11.7, lowGap 11.1 | 3/3 | 104 |
| cargo (placeholder) | 51.96 / 51.95 | 50 | fail | #3 #5 #6 #7 #9 #11 #12 #15 #16 | 40 + 1674 | 1707 / 7 (h 0, g 2, g↓ 5) | 8/8, 6/6 | 323 of 325 | 12: lowGap 11.6, lowGap 12.6, lowGap 10.6 | 3/3 | 57 |

Reading it:

- **Hop + gap edges** are what the field added. **#16 made / not made** is the per-edge proof: h = hops, g = gaps up
  or level, g↓ = gaps down. Every not-made edge is printed in that stage's JSON (`checks.16.nums.hopVeto`), ready to
  paste.
  - Craters' 148 are real: thin balustrades and rails at the spawn decks' sides that the field's level waist line
    passes over (D18, traced with `PROBE=`).
  - Elsewhere it is 0–16 per stage, mostly gaps down.
- **#16 walks** (routes, entrances): every route 1 and route 2 of every leg and every entrance into both Gates' rings
  is walked by the kid with the carrier's rules, on all 13 stages.
  - Tidewater has 0 routes: its placeholder weir has no field reading (#3 / #4).
  - On the first full run, 6 walks failed: halyard's two deck-edge entrances, lockgate's two routes 2, and one
    entrance each on kelpline / Cargo and treehills. All 6 were the walker's habits, not the stages, each traced with
    `PROBE='walk:…'` and fixed (D17): a jump that cleared a one-cell top and landed past it, and jumps up a ramp's
    slope.
- **Beyond the rules made:** the 1.8–2.1 m hops and 3.0–3.8 m gaps the kid really makes. Nearly all long-gap
  candidates are made (kelpline 323 of 325), because a carrier jumping *down* across a gap reaches well past the
  field's 3.0 m. Most gain under 10 m; the ones that gain more are #7d finds.
- **#7d finds** (gain > 10 m): count and the first three. The full list with both ends is in `out/all-stages.json`
  (`c7.d`) and each stage's JSON. "off-field" = a WARN (D3).
- **Entrances A / B:** #7a's count per Gate. Craters' and spirhalite's single entrance comes from the placeholder
  Gate's spot.

Pictures: `out/<id>-karp-top.jpg` for all 13 stages, plus the full set for halyard and lockgate.

### 2.4 Regressions

- **`bazookarp-rules.js` (karpbox): 117/117.** It was **116/117** before the kit's tag fix: L7, "a post for every NO
  CARP sign", counts `karp-sign` pieces and found 0 of 4 after the final kit renamed them. Fixed in the kit
  (cff56eaf), not in the test.
- **`karp-field.js` (DEVSTAGE=1, karpbox + 16 stages): 19/21.** Every correctness row passes on every stage: L, NaN,
  holes, the halfway line, hop / gap edges, checker #2's sweep, karpbox's hop, gap, thin wall and second state, and
  lockgate's clamp step.
  - The two **load-cost rows** failed: warm worst 69.7 ms (craters), match start worst 121.4 ms (calamari). That was
    at a **load average of 230–290** with every slot taken. WP1 measured these rows at 7–66 ms at load 25–50 and
    already called them noise-bound on this machine.
  - D15 removes 38–70 % of the gap edges on the stages it touches most (lockgate, crossmarket, calamari); per surviving one-way down-gap candidate it adds at
    most ~10 point tests. It cannot have made the field slower in any way these rows could see, but **I could not
    measure that here.**
- **`node build/check-maps.mjs` (every stage):** output byte-identical to b55f7472's.
  - halyard's 25.7° ramp (half[41]) is there on the base too.
  - `halyard.bazookarp`: the same ramp only.
  - `lockgate.bazookarp`: lockgate's first-cut weir at (0, 24) puts its mirrored post inside the office block, which
    z-fights with the office's top (0.64 m, tops 2.40 / 2.45). This is a data issue for WP4b (#15 flags the same
    weir), not the kit.
- **`node tools/botlab/karp-layout-diff.mjs <b55f7472 tree>`: RESULT same (96/96 builds and thumbnails identical).**
  That covers every stage's Turf War / Zone Control / Tower Command / Boss Battle build and both stage-card
  thumbnails, re-run after the last kit change.
- **`karp-loop.js` (karpbox): 6/6.** The host and the shadow follower agree on the field D15 changed.
- **Not run this round:** `karp-gun.js` (the Carp Shot doesn't read the field), `sfx-cues` and the net tests (nothing
  here crosses the wire or makes a sound).

## 3. Decisions where the spec left a gap (for the lead)

- **D1. #3's "each weir's count is the lowest within 3 m of it on its floor" is reported, not judged.**
  - On any floor that falls toward the Gate, the nodes 3 m on read about 5 counts lower, so the literal rule fails every
    placement (the clean box's weir: count 60, 55 within 3 m).
  - Its purpose ("landing it is never worth less than walking past it") already holds through the cap (§3.4): until the
    plant, the count stops at the highest weir count, and a plant sets the planted weir's.
  - The JSON keeps `low3` per weir. **TELL THE LEAD.**
- **D2. Hops onto off-field ground are a sixth #7d probe, and #7a counts them.**
  - The field's hop edges join field nodes only, and nav keeps only nodes it can walk to and back from. So **a ledge top
    that only a hop reaches is outside the field**: no field edge, no entrance, no reading (a carrier up there keeps its
    last value).
  - SPEC §4.4's own self-test fault ("a 1.5 m non-inkable ledge into one Gate's ring that only a hop climbs") is exactly
    that case.
  - The checker tries every 1.25–1.8 m hop from a field node onto a non-field node, with that ground's exits. A made one
    is a #7d find (its gain to the best exit). If it starts outside a Gate's ring and exits inside it, it is also a #7a
    entrance at the exit.
  - The engine could take such tops into the field (WP0's / the lead's call). **TELL THE LEAD.**
- **D3. A #7d find with one end off the field** (D = ∞) is a WARN, a hiding place, not a FAIL: its gain has no number.
- **D4. #7c counts drops off the defenders' own spawn deck into the ring**, as the spec's words say (the deck's nodes
  beyond the barrier are carrier-graph nodes). Halyard has 20 of them.
- **D5. Waivers live in the data:** `waive: [{ check: '7d', at: [x, z], why }]` (Alpha's attack, mirrored). A find of
  that check within 2 m of the spot is reported as waived. A tool can't read the stage note, so the data carries the
  lead's word and the note explains it.
- **D6. The self-test box is karpbox plus a clean variant** (`karp-check-box.js`). karpbox itself fails §9.1 by design
  (L 47 m, an open Gate front, unsigned zones, a climb-only plateau), and the rules tests rely on it, so it is
  untouched.
- **D7. The self-test has one fault per check plus SPEC §4.4's own list:**
  - f1–f16 and f16w (#16's walk);
  - x5 (two weirs 8 m apart), x7b (a climb shortcut), x7d (the squid-only gap), x9a (a half-covered plateau), x9b
    (a noRetreat over a zone), x9c (a zone over the halfway line);
  - `states`;
  - the spec's "weir against a wall" is f15.
- **D8. #9's plateau WARNs** (enemy arrival > 2 × the owner's, a single entrance) apply to plateaus of 4 m² or more.
  The FAIL rule is the spec's, for any size.
- **D9. #13's "ways off the deck"** are nav edges of any type (drops included) leaving a level flood of the deck,
  chained within 3 m. The deck's own blocks are not apron cover.
- **D10. #14 counts floor at any level within ±5 m of the Pond** (a raised Pond has its fighting room below it).
- **D11. #16's run-up:** when 1.5 m / 3 m back is not floor at the low end's height, the start moves toward the edge
  in 0.3 m steps. With no start at all, the edge counts as not made.
- **D12. #11's falls** use the wet node nearest the Pond on each half. "The narrowest walkway near each weir" is the
  route node within 12 m of the weir (≥ 3 m from it) with the fewest nodes within 1.5 m.
- **D13. The kit's looks live in their own module** (`karpKitFx.js`). The sill and the Gate plinth take ink (they are
  floor); only posts, signs and boards are `roof` with no ink.
- **D14. Stage states carry a `query`** (the page query of the module's audit switch), so one generic checker builds
  each state's world. ERA= / LAVA= map to `era=` / `lava=` and pick the state with that key.
- **D15. One tagged line in the Carp Field itself (`src/game/karpField.js`, WP0's code): a one-way gap edge *down* now
  needs open air over its landing below the ledge it leaves.**
  - nav.js already applies this rule to its drop edges (`_openAbove`).
  - Without it, every deck top had "gap" edges down to the floor under that same deck. No kid makes them, and they
    made the field read those tops closer to the Gate than they are.
  - Measured on the first-cut all-stages run: crossmarket 443 → 173 gap edges, calamari 804 → 239, lockgate 684 → 426
    (lockgate's L 57.15 → 58.03 m).
  - The rules (117/117) and karp-field (all correctness rows) pass with it. **TELL THE LEAD.**
- **D16. The self-test checks the reason, not only the check number:** each case carries an `expect` pattern on its
  check's text.
- **D17. #16's walks (new): what they judge, and how.**
  - They run the routes the graph claims (#4 / #5) and the entrances #7a counts with a real body. This is the task's
    "every route and every entrance into a Gate's ring".
  - A hop, gap or nav jump edge on the way that the walking kid doesn't take is settled by that edge's own five-timing
    trial rather than failing the walk on one steering line. Each such hand-over is counted.
  - A walk stuck against a dynamic block (a parked railcar) is reported, not judged, because the world is not stepped.
  - The fault they catch is real and cheap to make: nav's walk test is one ray down the centre line at waist height,
    so a slot narrower than a body (0.76 m) reads as walkable (the self-test's f16w).
  - The walker's habits were tuned on traces, not guessed. On the first full run 6 walks failed; `PROBE='walk:…'`
    showed all 6 were the walker, not the stages:
    - a jump that cleared a one-cell top and landed 0.62 m from the node beyond it (fixed by the own-node advance, and
      a jump edge's own trial when stuck);
    - jumps up ramps whose cells rise 0.34–0.44 m, which threw the kid onto a prop top or off the ramp's side (fixed
      by jumping on walk edges only at a real riser, and stepping off a top).
  - The scripted carry walk (#11) keeps the first builder's own walker, with re-planning; it was not changed.
- **D18. Craters' not-made gap edges are real (traced with `PROBE=`).**
  - At the spawn deck's sides, a 0.1 m stair balustrade (a prop collider 3.1–4 m tall) and a 1.1 m rail on the cliff
    lip stand where the field's gap scan sees open air. The field tests a gap's waist line at the higher node's height
    (3.6 m there), which passes just over the 3.54 m balustrade; a falling body cannot.
  - So the checker is right to list them for `hopVeto`. A field rule whose down-gap waist line follows the fall (from
    0.6 m above the high node down to 0.6 m above the low one) would drop most of them at the source, on every stage.
    That is WP0's code. **TELL THE LEAD.**
- **D19. #5 now FAILs a leg with no route at all.** Before, it was silently OK with an empty text, as on tidewater's
  placeholder weir. #3 and #15 say "no field reading" / "no route to look along" instead of "-Infinity %" / "not
  seen".

## 4. Online, bots

Nothing crosses the wire:

- the checker is a tool;
- the kit pieces are static level pieces built the same on every screen, from the data, in `layoutFor`;
- `karpKitFx` is local looks;
- `G.match.stage.karpStates()` is a query.

No bot code changed. Bots walk nav, not the carrier graph, so D15 doesn't touch them.

## 5. Commits and shared files

By the first builder (2026-10-10):

- f9066b54 Bazookarp kit in final form: dressed stone weir posts (footing, shaft, band, capital; roof, no ink) 5.4 m apart with their curtain sill, the octagonal Gate plinth and …
- d076d897 bazookarp-check.cjs: the Bazookarp stage checker (SPEC §4.4): sixteen checks on the carrier graph, #16's kid stepped through actor.update, #11's scripted carrier, …
- f5d9cfa6 bazookarp-check: hops onto off-field ground (a top only a hop reaches is outside the field): #16 tries them, a made one is a #7d find and, ending in a Gate's ring, a …
- 41b3af85 README: the Bazookarp stage checker and the Bazookarp regression set (karp-field.js in it); karp-stages/BUILDER.md: the per-stage builder's brief and note template …
- 67fc76a0 bazookarp-check #13: the spawn deck's own blocks are not apron cover; #2: a hole the lead waived doesn't count; noretreat-<i> pictures
- 1fa1d0cf STAGE-MODS.md: G.match.stage.karpStates() (key, nodeOk, query) and bazookarp-check's ERA= served; bazookarp-check KITSHOTS=1: the kit up close
- 8a7bd6ca bazookarp-check #11: a fall tries the next water edge when a railing stops the carrier (up to 8); a carry with no route says so; the self-test's climb-shortcut fault …
- da478a62 karpField: a one-way gap down needs open air over its landing below the ledge it leaves (nav's drop rule) — the field had gap edges from a deck's top down to the …

This takeover (2026-10-16):

- 6423a8b7 bazookarp-check #11: the carry walk logs where each stuck episode happened and on which edge; jumps any riser above a kid's step-up (a stair's too); a humans-only …
- 8f19bfc0 bazookarp-check self-test: each planted fault must FAIL its check for the reason it plants (an expect pattern on the check's text), not a knock-on; the top-down's …
- ec272051 bazookarp-check: #5 FAILs a leg with no route at all, #3 / #15 say 'no reading' / 'no route to look along' instead of -Infinity % / unseen; #16 breaks the not-made …
- 3ecb30b6 bazookarp-check #16: a kid with the carrier's rules walks every route 1 and route 2 of every leg and through every entrance into each Gate's ring (hop / gap edges on …
- e84f4669 README / karp-stages BUILDER.md: #16's route and entrance walks, PROBE= (one move traced)
- cff56eaf Bazookarp kit: each post's shaft and each sign's post keep the first kit's plain tag (karp-weir / karp-gatepost / karp-sign: one piece per post, as bazookarp-rules L7 …
- 49894ea9 bazookarp-check self-test: f16's pattern names the not-made hops (the #16 text now breaks them down by kind)
- d7f07321 karpKitFx: the carrierBlock glyph's carp in dark violet (white vanished on pale floor and sky), the shimmer and glyph a little stronger
- 3f1ec4a7 bazookarp-check #16 walks: a grounded kid standing on one of the next 8 path nodes (the field's own-node rule) has reached it — a jump that clears a one-cell top …
- 8c19a918 bazookarp-check #16 walks: on a walk edge the kid jumps only at a real riser (the floor 0.45 m ahead above its step-up), never up a ramp's slope; standing on …
- a51212ef bazookarp-check KITSHOTS: the weir and Gate shots look for an eye point out of every block with a clear line (a pier's kiosk filled halyard's); RESULT prints walks= …
- 4d8e193a (scratch) karp-checker out/: the all-stages table's top-downs, halyard's and lockgate's full sets and JSON, the self-test's clean set and fault top-downs, the kit up …
- 50ad9e2c (scratch) karp-checker JOB-1.sh for the record: the Carp Field's 60 ms load budget on the Mac mini (unmeasurable here at load 230–760), the checker's self-test and …
- (this report: one `(scratch)` commit after these)

**Shared files touched** (each hook tagged `[b5-karp-checker]`):

- `src/game/karpField.js`: one condition in the gap scan (D15).
- `src/game/stageMods.js`: `'karpStates'` in `R_HOOKS`, and `StageRun.karpStates()`.
- `src/main.js`: the import of `KarpKitFx` and one constructor line.
- `src/world/bazookarp-kit.js`: the kit, rewritten (WP0's file).
- `src/world/bazookarp-data.js`: the `waive` field documented in its header.
- `docs/STAGE-MODS.md`: the `karpStates` row, and T4 served.
- `tools/botlab/README.md`: the checker, PROBE and the regression set.
- **New files:**
  - `src/fx/karpKitFx.js`;
  - `tools/botlab/bazookarp-check.cjs`, `karp-check-page.js`, `karp-check-box.js` and `karp-check-states.js`;
  - `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`.

## 6. Unfinished, uncertain

- **`tools/botlab/jobs/batch5/COMMON.md` was changed in this worktree at 12:04, not by me.**
  - The new paragraph says the Mac mini is back as of 2026-10-16 and its runner protocol applies again.
  - My task said the Mac mini is unavailable and to push nothing, so I ran everything locally and pushed nothing. I left
    the file as I found it: uncommitted, not reverted.
  - `JOB-1.sh` (committed, not pushed) is ready for the runner if the lead pushes `botlab-b5-karp-checker`. It measures
    the field's 60 ms budget on a quiet machine, then repeats the self-test and the table.
- **Nothing ran on the Mac mini.** Every run above is local (my task: the Mac mini unavailable, push nothing). There are no balance sets; none apply to this
  package.
- **The 60 ms field budget is unmeasured** (§2.4): the machine was at load 230–760. D15's own cost is a handful of
  point tests per surviving down-gap candidate.
- **The gimmick stages have no states yet on this base** (eras / lava / pipes are placeholders). The generic state
  path is proved only with the test module and karpbox's test state. When bluestone and caldera land, their modules
  need `R.karpStates()` with a `query` each (docs/STAGE-MODS.md says how). The wip stages were not run (`WIP=1` does
  it; on placeholder data they fail by design).
- **#16's kid tries a fixed set of moves** (run-ups of 1.5 m or 3 m, or from the low end itself; a run-off for a move
  down; jump at five distances) and steers straight at the far node. A move that needs another line (a curve round a
  post) could read as not made. I traced two classes: D15's veranda edges and D18's balustrades. A builder should run
  `PROBE=` on a listed edge before pasting its hopVeto.
- **The walks steer node to node with one set of habits** (jump at a riser, at a rim, when stalled). A walk stuck at a
  spot a player would pass with a different line is possible. On the final run every walk on the clean box and on all
  13 stages passed (after the two walker fixes of D17, each found by a trace). Each failed walk prints its place and edge, and `PROBE=` traces a single move.
- **#7d's long gaps a kid makes are many** (halyard: 148 of 150 candidates made, 18 of them gaining > 10 m). The field's
  gap rule (≤ 3.0 m flat) is short of what a carrier jumping *down* across a gap reaches. The checker lists them per
  the spec; the lead may prefer to widen the field's rule for down-gaps (WP0's code). **TELL THE LEAD.**
- **Hops onto off-field ground (D2)** are a gap in the field itself. The checker catches them; the engine does not
  read them.
- **The kit's look was judged from these pictures only,** with no lightmap: the Bazookarp variants are not baked, and
  their kit pieces show the turf bake's patchy light until WP4b / the stage builders bake them. WP2 owns the moving
  parts (caps, curtain, arch) and may want the board glyph drawn its own way; `karpKitFx` is self-contained if so.
- **lockgate's first-cut weir post z-fights with the office** (check-maps on `lockgate.bazookarp`): WP4b moves the
  weir.
