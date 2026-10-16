# Bazookarp per-stage layout: the builder's brief and note template

You are giving one stage (or two) its Bazookarp layout. This file is the template every per-stage builder copies; the
contract itself is `tools/botlab/jobs/batch5/bazookarp/SPEC.md` **§9** (read all of it: §9.1 the requirements table,
§9.2 what you deliver, §9.3 your stage's row, §9.4 if yours is bluestone, aquarium or caldera). `../COMMON.md` (standing
orders), `../DECISIONS.md` (binding) and the two reference layouts (halyard and lockgate, `karp-ref`'s note) come with it.
The user's bar: "our high level of quality, especially when it comes to map design" — the Halyard bar (cover every
6–10 m, varied heights, a reason for every piece, nothing a kid can stand on that it shouldn't: `roof` and no ink on it).

## 1. What you deliver (SPEC §9.2), in this format

| # | what | where / format |
|---|---|---|
| 1 | **The data** | `BAZOOKARP_DEFS.<id>` in `src/world/bazookarp-data.js`. It describes **Alpha's attack**: the weirs and the Gate stand on **Bravo's half** (+z), `freeZones` are Bravo's own; the engine mirrors everything for the other team. The Long Stages notes give Alpha's half: **negate x and z** (§9.3 has them converted). The format is the file's header: `start`, `weirs` (1, or 2 on different routes at the same count ±2), `gate`, `freeZones` (each with `signs: [[x, z, yaw°]]` at every entrance), and as needed `noRetreat`, `carrierBlock`, `noRest`, `hopVeto`, `routes`, `waive`. |
| 2 | **Mode-only pieces and redesigns** | in your stage's own files (`src/world/stages/<id>/layout.js`, `props.js`, its dressing), tagged `onlyIn: 'bazookarp'` / `notIn: 'bazookarp'` (`variants.js`). Never in the kit (`bazookarp-kit.js` builds the weir posts, the Gate and the signs from your data) and never in `layout.half` unfiltered. Fully dressed: cover map ≥ 90 % on the variant, climb-audit clean, the 1.8 m kid-reach rule (a top a kid can't reach is `roof`; a barrier is proved with the physical way-round search). |
| 3 | **The lightmap variant** | `assets/lightmaps/<id>.bazookarp.{png,json}`, baked once the layout is final, inside `size-budget.js`: a `JOB-<n>.sh` for the Mac mini's runner (`../COMMON.md` says whether it is up and how to send one); only when COMMON.md says the Mac mini is down, locally, and only the final bake. |
| 4 | **The checker clean** | `RESULT <id> ok` from `bazookarp-check.cjs` (below), in **every** stage state for a gimmick stage; its JSON and pictures in `tools/botlab/jobs/batch5/karp-<id>/out/` (`(scratch)` commits). |
| 5 | **Bot matches** | a `JOB-<n>.sh` for the Mac mini's runner (`../COMMON.md`: the protocol, the cap per mode and config): 16 × `karp-match.cjs` at normal (and 16 at hard where the lead asks), summarised by `karp-agg.py`, inside §9.1's targets. Locally only 2–4 matches per question while you iterate; when COMMON.md says the Mac mini is down, commit the JOB file for when it returns. |
| 6 | **Pictures** (JPEG < 300 KB, looked at before you claim anything) | the checker's set; a player's view from each spawn exit toward its Gate; from the Pond toward each weir; an aerial of each redesigned area, before and after. |
| 7 | **The note** | `tools/botlab/jobs/batch5/karp-<id>/NOTE.md`, the template in §4 below. |
| 8 | **Other modes untouched** | the regressions in §3 pass; Turf War, Zone Control and Tower Command build byte-identical; the stage card unchanged. |

## 2. The checker: your proof

```
MAP=<id> tools/botlab/run.sh tools/botlab/bazookarp-check.cjs
  env: OUT=dir            (default .botlab/karp-check: point it at tools/botlab/jobs/batch5/karp-<id>/out for the record)
       KARP_DEF='{…}'     try data without editing bazookarp-data.js
       SHOTS=0 CARRY=0 PHYS=0   quick iterations (a RESULT ok needs all three on)
       DEVSTAGE=1         Cargo (noBots: the scripted carrier walks; there are no bot matches on Cargo)
       ERA=1|2|3, LAVA=low|high, KSTATE=<key>   one stage state; without one, every state in turn
       PROBE='[x, y, z, x, y, z]'   one move traced: #16's kid on the node pair nearest those two points, every frame of
                          every trial, and the blocks (pieces and prop colliders) where each trial stopped — before
                          you paste a hopVeto entry or argue with a #7d find, look at why
MAP=all … (every shipped stage), MAPS=a,b … (some)
```

Always run with `BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3 WATCHDOG=900000`, one Electron
at a time. One stage takes 1–4 minutes (the physical proof and the two carry walks are most of it).

It prints one line per check — `OK`, `WARN`, `FAIL` or `SKIP` with its numbers — then
`RESULT <id> ok|fail L=… weir=… gate=… routes=… zones=… hops=…`, then **the flags**: every flagged place, numbered as the
red discs on `<id>-karp-top.jpg` and in its key, and as the `<id>-flag-<n>.jpg` pictures (one for every #7 flag, then the
first `FLAGSHOTS` others). `<id>-karp.json` holds every number (each check's `nums`, `flags` with the same numbers, the
carry walks, the drop coverage). How each check judges is in `../karp-checker/LEAD-REPORT.md`
(and SPEC §4.4); in short:

| # | check | what you fix when it FAILs |
|---|---|---|
| 1 | data on floor, nothing in a spawn zone or on a roof, kit posts `roof`; every kit footing (weir and Gate posts, the plinth, the sill, the signs' feet) rests on floor across its footprint | move the spot; floor under it (a weir by a ledge stands a post in the air: the kit builds the posts at the weir's floor height) |
| 2 | the field: L_A ≈ L_B (2 %), no holes, the reading sweep | asymmetric `single` pieces; pits with no way out |
| 3 | weir counts 45–60 (40–55 %), weir → Gate ≥ 25 m and ≥ 45 % of L, two weirs ±2 counts and ≥ 12 m apart, L 55–85 | move the weir; lengthen the base front |
| 4 | Pond → weir → Gate with no climbs, own zones and carrierBlock off (an inkable step of ≤ 1.8 m that #16's kid hops counts as a hop, not a climb — here and in #5, #7b, #9 and the walks) | a ramp or stair |
| 5 | route 2 ≤ 1.6 × route 1 on every leg, 2.5 m apart (6 m free at the ends); two weirs: disjoint routes 1, neither within 4 m of the other weir | a second way in |
| 6 | Pond → Gate 11.5–18 s walking | L |
| 7 | (a) 2–5 entrances into the Gate's 15 m ring, each seen from the spawn deck — every carrier-graph edge into the ring, and every move #16's kid really makes from outside it to inside (a rising gap, a jump onto ground off the field, a hop or gap beyond the rules), each such move with its own line of sight; (b) no climb saving > 20 % from the halfway line; (c) no drop > 2.5 m into the ring; (d) no connection the graph lacks gaining > 10 m: squid gaps (squids pass rails and grates), walls over 5.5 m, drops over 3.4 m, and the moves a carrier really makes — hops 1.8–2.25 m, long gaps, **rising gaps**, **jumps onto ground off the field** (a top no walk reaches) and **vaults** over a low wall or a railing (its top ≤ 2.25 m over the far floor). The windows are the carrier's measured reach, running as a kid (~4.4 m of air level, 1.8 m up) and swimming in its own ink from any floor that takes ink (~7.4 m of air level, up to 2.2 m up): a barrier or a moat beside inkable floor must beat the swim-jump (a ledge or a wall top 2.3 m or more over the floor it is jumped from, a moat wider than 8 m), not only the kid's hop | geometry, `onlyIn` walls, `carrierBlock`, or a `waive` the lead accepted |
| 8 | the Gate 12–20 m from the pad, ≤ pad + 0.2 m, in the ±40° cone, seen from the deck, not in a zone | move the Gate |
| 9 | climb-only plateaus wholly inside the owner's zone; zones wholly on their owner's half, a sign within 2 m of every entrance (both ends of one wider than 8 m), never on a weir / the Gate / route 1 / route 2; `noRetreat` ≥ 3 m from plateaus and zones | the zone polygon and its signs (the checker lists each entrance with its crossings) |
| 10 | no own-half route dips > 6 m in progress | the route, or a `noRetreat` within #9's limits |
| 11 | the scripted carrier knocks out both ways, stuck 0, retreat ×3 on at 8 m / off at 3 m, ×3 in its own zone, falls (own half → the Pond, enemy half → by the last footing), a splat on the narrowest walk by each weir rests on wide floor, every splat on the routes and in the zones finds a drop spot on its half within 12 m | `noRest`, wider floor |
| 12 | the variant differs only by tagged pieces and the kit; its lightmap exists and is fresh | tags; bake |
| 13 | ≥ 3 ways off the spawn deck; ≥ 2 cover blocks ≥ 1.2 m within 4 m of route 1 deck → Gate | openings, cover |
| 14 | ≥ 70 % of the Pond's 4.5–10 m ring is floor; the shell seen from ≥ 6 of 8 | clear the centre (`notIn: 'bazookarp'`) |
| 15 | nothing solid within 3 m of a weir (0.3–3.6 m up, its posts excepted; measured exactly per block, so a lamp post, a bollard, a rail or a NO CARP sign counts); seen from both approaches and ≥ 3 of 8 | move it off the wall |
| 16 | every hop / gap edge the field adds is made by a kid with the carrier's jump, or by the carrier swimming in its own ink (the text counts the moves only the swim made); the same kid (the carrier's speed, both spawn barriers, carrierBlock) walks every route 1 and route 2 of every leg and through every entrance into each Gate's ring | paste the printed `hopVeto` entries into your data (then the field drops them), or open the move up; a route or entrance it can't walk (the place is printed and drawn: a slot narrower than a body, a lip, a rail the graph's centre ray missed) gets widened, or the piece that fools the graph gets a real wall |

**Waivers.** A #7 or #9 find you can't close goes to the lead with a picture and a reason. Once the lead accepts it, add
`waive: [{ check: '7d', at: [x, z], why: '…' }]` to your data (Alpha's attack, like everything): a find of that check
within 2 m of the spot is then reported as waived. List every waiver in the note.

**Stage states** (bluestone's eras, caldera's lava). Your stage module offers its states through
`R.karpStates() → [{ key, nodeOk(id), query }]` (`G.match.stage.karpStates()`, docs/STAGE-MODS.md); `query` is the page
query that shows your world in that state (your audit switch, `era=2` / `lava=high`). The checker then builds each
state's world and checks it; `ERA=` / `LAVA=` pick one.

## 3. The regressions you run (one at a time; only what your change touches)

```
node build/check-maps.mjs <id> <id>.bazookarp            # pieces, overlaps, the variant with the kit
node tools/botlab/karp-layout-diff.mjs <base tree>       # every other mode's build and the stage card byte-identical
DEVSTAGE=1 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-field.js PAGE_ARGS='only=<id>' … page.cjs   # the field on your stage
MAP=<id> MODE=<turf|zones|tower> PAGE=tools/botlab/tests/stage-audit.js … page.cjs     # each mode's lightmap and routes
MAP=<id> tools/botlab/run.sh tools/botlab/tower-check.cjs                              # if a shared piece moved
MAP=<id> MODE=bazookarp PAGE=tools/botlab/tests/cover-map.js … page.cjs + climb-audit.js
MAP=<id> tools/botlab/run.sh tools/botlab/karp-match.cjs                               # 2–4 while iterating
```

## 4. The note: `tools/botlab/jobs/batch5/karp-<id>/NOTE.md`

```markdown
# <Stage name>: the Bazookarp layout

## What was redesigned and why
(each mode-only piece or redesigned area: what it is in the stage's story, which §9.1 row it serves; before / after pictures)

## The numbers (checker, <commit>)
| | Alpha | Bravo |
|---|---|---|
| L (m), carry time walking / swimming | | |
| weir(s): count, % of L, weir → Gate (m) | | |
| routes per leg: route 1 / route 2 (× route 1), route 3 with climbs | | |
| Gate: from the pad, vs the pad's height, cone, entrances (types, all seen) | | |
| plateaus (climb-only ones and the zone over each) | | |
| free zones: entrances and their signs | | |
| hop / gap edges added, made by the kid, hopVeto entries | | |
| #7d finds and how each was closed | | |

## Polygons
(every noRetreat, carrierBlock and noRest: its picture and its reason)

## Bot matches
(karp-agg.py's §9.1 rows; the JOB file; what changed between runs)

## Waivers asked of the lead
(none, or each with its picture and reason)

## Other modes
(check-maps, karp-layout-diff, stage-audit per mode, tower-check, the stage card: results)
```
