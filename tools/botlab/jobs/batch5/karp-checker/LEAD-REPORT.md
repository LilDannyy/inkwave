# Bazookarp WP4a: the checker and the stage kit (key `karp-checker`): lead report

## At a glance

- **Review 4's verdict (REDO) is answered: all 6 issues are fixed, each with proof** (§0). Reviews 1–3's issues stay
  fixed; every one of their cases passes.
- **The two blockers are closed.** A step, kerb or ledge whose face misses the 1 m nav grid is now a #7d probe of its own
  (`step`, 0.3–1.8 m up and 0.3–3.4 m down), and so is a squid tube of 3–8 m (`squidTube`, each crawled by a squid in
  #16). The review's L1t / L2t / L3t and T4, all "FAILING none" on 61cbc3d8, now FAIL #7 for that reason; the control
  L1tc still FAILs [jump].
- **D34 is now a switch the lead can flip, and the checker says which reading it used:** `KARP_SWIM=fail|warn|off`
  (default `fail`), `swim=…` on the RESULT line. **Every #7d find carries its cause** — layout, field rule or
  swim-jump — on the RESULT line (`7d=L/F/S`), in the text, the flag key and the table, and **one waiver covers a whole
  numbered flag**. On the stages, lockgate's 1 650 finds split 4 / 5 / 1 641 (layout / field rule / swim-jump): under `KARP_SWIM=warn` only 9 kid finds and 12 drops are left to close there. Halyard's 2 007 split 536 / 340 / 1 115, nantai's 4 576 split 20 / 326 / 4 230.
- **Self-test: 86/86, no console errors** (14 new cases), on 8c641d3b; the cases the two later checker commits can touch
  ran again on the final checker 645c1baa: 15/15. `MAP=all`: 13 stages, no harness or console errors.
- **Also fixed:** zone eras read strictly (and #1 FAILs a mistyped key, and eras on volumes the engine ignores), #2's hole
  and sweep and #12's stale / fresh lightmap planted, the Gate plinth one slab, the glyphs apart, the kit pictures
  showing only the kit. **The curtain is already right in WP2's branch** (st-b5-karp-face, `rotation.y = w.yaw`), and
  **calamari's empty "weir" picture was a placeholder stage with no kit**, not a mis-aimed camera.
- **TELL THE LEAD** (§0, §3): D34 and D33 (now switches / one constant); nav's neighbour-only jumps and drops leave D wrong
  across misaligned steps on every stage (WP0); the engine ignores `eras` on noRetreat / carrierBlock / noRest though
  SPEC §4.1 allows it (WP0); SPEC's 3 m lowGap bound is exceeded (8 m). Earlier rounds' items stand (§3, §6).
- Nothing was pushed and nothing ran on the Mac mini.

**Where and how this ran.**

- Worktree `st-b5-karp-checker`, branch `b5-karp-checker` from `b5-int3` b55f7472.
- Everything ran locally, as my task required (the Mac mini was unavailable to me), one Electron instance at a time
  under the shared SLOTS=3 lock, at load 10–47 this round.

**How the work got here.** The first builder (2026-10-10) wrote the checker, the self-test box, the kit, the stage-state
hook and the docs; a takeover (2026-10-16) finished it; reviews 1–3 (each REDO) were answered by fix rounds 1–3 (§0.2–
§0.4). Review 4 (REDO) read 61cbc3d8; this is fix round 4. **[r1]**–**[r3]**, **[r3b]** and **[r4]** mark what each
round changed.

## 0. Review 4 (verdict REDO, on 61cbc3d8): each issue, what was done, the proof

Review 4 ran on 61cbc3d8. Nothing was committed after it and the tree held only the lead's COMMON.md edit and the two
review JSONs, so there was no partial work to take over: this round (**[r4]**) starts from 61cbc3d8. All runs are local,
one Electron at a time under SLOTS=3, at load 10–47.

### Issue 1 (blocker): a hop or drop into a ring across an ordinary step whose face misses the nav grid passed every check. FIXED

**The reviewer is right, and the hole is wider than the 0.5–1.25 m band.** nav.js joins neighbour cells only (walks
|dy| ≤ 0.5, diagonals too; jumps 0.5–1.25 m up and drops 0.5–3.4 m down orthogonal only), its `_clear` keeps a floor node
≥ 0.46 m from a face, and the field's hops (1.25–1.8 m) join orthogonal neighbours ≤ 1.2 m apart only. So a misaligned
1.25–1.8 m ledge *on* the field was missed the same way (review 2 had noted it; riseGap only caught such ledges over open
air), and so was a misaligned step down.

**The new #7d probe, `step`** (d883e1f6; karp-check-page.js, after the vaults):

- Candidates: carrier-graph node pairs up to two cells apart, diagonals included, **0.3–1.8 m up or 0.3–3.4 m down**,
  with no carrier-graph edge between them, not joined by 6 m of walking, floor under the whole line at one end's height
  or the other (a step, not a gap), and the hop rule's waist and head tests (down: the waist line at the top, the head
  across, nothing over the landing). Every one that can matter (D33) is tried (73dcbda8; at first two a takeoff).
- #16 tries each, timed off the face (up: where the floor first stands half the rise, ≤ 0.3 m, above the low end; down:
  where it first falls that far), a step down first as a run-off, then jumps 0.2–2.0 m before the face (645c1baa: 1.7
  and 2.0 added to the five timings); the swimming carrier when
  the kid fails and the floor takes ink.
- A made one is a #7d find (`step`, cause **field rule**) or, from outside a Gate's ring to inside it, a #7a entrance
  with its own sight line ("step off the nav grid").

**Proof** (the full self-test, §2.1; the same cases on 61cbc3d8 were "FAILING none" in the review's e.log):

| case | the fault | 61cbc3d8 (review 4) | now |
|---|---|---|---|
| L1t | a 1.0 m no-ink ledge, face at x −15.4, into the ring between 3.6 m wall stretches, screened | FAILING none | **FAIL #7**: "(a) team 0: an entrance at (−14.5, 47.5) [step off the nav grid] not seen from the spawn deck" (and team 1's mirror); "(d) 12 … step [field rule] [16.5,0,−49.5]→[14.5,1,−48.5] 12.4 m …" |
| L2t | the same at 0.8 m | FAILING none | **FAIL #7**, the same two unseen step entrances |
| L3t | a 1.0 m walkway's end 0.1 m past a cell centre: a 1.0 m step down into the ring | FAILING none | **FAIL #7**: "(a) … (−13.5, 46.5) [step off the nav grid] not seen …"; "(d) 8 … step [field rule] [15.5,1,−48.5]→[13.5,0,−49.5] 14.8 m" (20 on the final checker, every candidate tried) |
| L1tc | the control, the face on the grid (x −15.0) | FAIL #7 [jump] | FAIL #7 [jump], unchanged |

The clean box has 0 step candidates that can matter (#16: "0 steps off the grid"), and every other case keeps its
verdict (86/86). `out/self-L1t-karpbox-s0-karp-top.jpg` shows the two unseen step arrows and the key "7a a step off the nav
grid into the ring, unseen from the deck" / "7d step [field rule] ×6: gain 10.4–12.4 m".

**The review's real-stage pairs** (`MAP=all`, §2.3): all five are now #7d `step` finds with both ends exact, each MADE by #16:

| stage | the review's pair | gain | now |
|---|---|---|---|
| terraces | (14.5, 0, −47.5) → (12.5, 1.2, −48.5) | 22.2 m | step [field rule], the kid "jump 1.7 m before the rim" (645c1baa) |
| nantai | (−4.5, 0, −15.5) → (−3.5, 1.25, −16.5) | 13.0 m | step [field rule], the kid |
| kelpline | (−10.5, 1.26, −27.5) → (−9.5, 2.17, −25.5) | 13.1 m | step [field rule], the kid |
| craters | (10.5, 2.34, −63.5) → (8.5, 3, −63.5) | 15.2 m | step [swim-jump]: the kid doesn't make it, the swimming carrier does |
| calamari | (16.25, −0.1, −37) → (15.5, 1, −39) | 10.1 m | step [field rule], the kid; its own flag 33 "7d step [field rule]: gain 10.1 m" |

Terraces' pair took two more fixes, both found by checking this table: it was a candidate, but (1) a cap of two steps a
takeoff (as the vaults have) tried two higher-gain ones from the same takeoff instead (73dcbda8: every step candidate is
tried, 12–45 a stage), and (2) its face stands 0.3 m short of the top node and the kid runs at it on a slant: it is made
only when the kid jumps 1.6 m before the face, beyond the five timings (0.2–1.4 m). Steps are now also jumped 1.7 and
2.0 m before the face (645c1baa); a page probe of the pair showed the step trial NOT MADE before and the same pair timed
off its midpoint MADE (`jump 0.8 m before the rim`). On the final checker the stages' steps are 0–45 tried, all made
but craters' 14 (§2.3).

**TELL THE LEAD (WP0):** nav's neighbour-only jump and drop edges, with its 0.46 m face clearance, leave D wrong across
every misaligned low step on every stage, not only for Bazookarp (bots route round them too). The clean fix is a
two-cell step search in nav or in karpField's extra edges; until then the checker FAILs each one that matters.

### Issue 2 (blocker): squid tubes longer than ~2 m were invisible. FIXED

**The new #7d probe, `squidTube`** (d883e1f6):

- Candidates: field node pairs **3–8 m apart** (flat), |dy| ≤ 0.6, the squid tube lowGap tests (rays 0.08 / 0.3 / 0.6 m
  up, ±0.28 m across at 0.3 m, through grates and rails; squid floor, not a grate, under the whole line), **a kid's line
  blocked at its waist (0.6 m) or its head (1.2 m)**, grates and rails counting (a roof or a barrier, not open floor), not
  joined by 6 m of walking, and able to matter in the move's own direction (D33: > 10 m nearer a Gate beating its own
  length by 6.2 m, or into a ring saving > 3 m; a tube goes both ways, so each way that can matter is a candidate).
- **#16 proves each with a squid**: the kid in squid form throughout, no jump, steering at the far node for
  (length / 1.5 + 2) s, made within 0.6 m of it; first crawling on dry floor, then (where the floor takes ink and
  `KARP_SWIM` allows) swimming its own ink.
- A made one is a #7d find (cause **layout**) or a #7a entrance ("squid gap"). lowGap (≤ 3 m) stays static, as SPEC.

**Proof:** **T4** (the review's culvert: 1.0 m high, 3.5 m long, into the ring, screened) was "FAILING none, lowGap 0"
on 61cbc3d8 (the review's b.log). Now **FAIL #7**: "(a) team 0: an entrance at (−12.5, 46.5) [squid gap] not seen from
the spawn deck" (two a side), "(d) 6 … squidTube [layout] [19.5,0,−48.5]→[11.5,0,−48.5] 15.7 m …", each made "a squid
crawling it on dry floor" (36 candidates, 6 tried, 6 made).

**The review's real-stage tubes:** all three spirhalite tubes are found and crawled: (±10.5, 1.3, ∓47.5) → (±17.5, 1.3, ∓47.5) and
(−10.5, 1.3, 47.5) → (−15.25, 1.3, 47.5), each "a squid crawling it on dry floor", gaining 8.5–11.8 m on 5–8 m tubes.
Into the ring they save more than 3 m, so each is a #7a entrance (D33); they join the walk entrance at (±12.3, ±51.1),
which lists "squid gap" among its moves and is seen from the deck, so #7a stays OK there. None is a #7d find: each saves
less than 6.2 m beyond its own length (D33). The tidewater tube (−10.5, 0.33, 1.3) → (−10.5, −0.2, 7.3), 10.3 m on a
6 m way and not into a ring, is not a candidate under D33 (it saves 4.3 m); under SPEC's literal 10 m it would be (D39).
Across the stages the probe tries 0–80 tubes and the squid gets through 0–63 of them (saltpan 63 / 63; crossmarket 0 / 12
and its 6 thinned-out neighbours, real non-passages); 645c1baa retries a not-made tube's neighbours (craters 26 → 60).

**TELL THE LEAD:** SPEC §4.4 bounds lowGap at 3 m; the checker now follows a squid 8 m, as D29 widened the other windows.

### Issue 3 (major): with D34 undecided the checker could not be acted on. FIXED (the decision itself stays the lead's)

I cannot take the lead's D34 / D33 decisions, so the checker now carries them as switches and says which it used:

- **`KARP_SWIM=fail|warn|off`** (default `CK.swim = 'fail'`, one constant for the lead): *fail* judges a move only the
  swimming carrier makes like any find (today's behaviour, D34 (a)); *warn* lists its finds, its ways into a ring and its
  drops into one as a WARN and judges #7 on the kid alone (D34 (c), SPEC #16's "a kid"); *off* does not model it (`o.kidOnly`,
  now reachable). The RESULT line prints `swim=<mode>`.
- **Every #7d find carries its cause**: **layout** (squid gaps and tubes, walls over 5.5 m, hops over 1.8 m, ground off
  the field: only the stage closes them), **field rule** (a kid's step off the grid, rising gap, gap beyond 3 m, vault,
  drop beyond 3.4 m: WP0 could absorb them), **swim-jump** (made only by the swimming carrier). The RESULT line prints
  `7d=<layout>/<field>/<swim>`, the #7 text adds "by cause: …", every flag says `[layout]` / `[field rule]` and the
  all-stages table has the column.
- **One waiver covers a whole numbered flag**: `waive: [{ check: '7d', at, why, probe?, r? }]` waives every find of the
  flag group (one probe and cause within one 3 m cluster) that has a find within max(2, r) m of the spot, of that probe
  if named. The RESULT line counts the waived finds.
- **The top-down** draws only each flag's own move bold and the rest of its group medium, so each flag's move stands out
  (the canal's fan is still dense: §6).

**Proof:**

| case | what | result |
|---|---|---|
| g5 | the 5 m moat only the swim-jump clears, default `fail` | FAIL #7 "(d) 98 … longGap (swim-jump) [swim-jump] …" (as before) |
| **g5w** | the same with `KARP_SWIM=warn` | #7 **WARN**, not FAIL: "WARN (KARP_SWIM=warn) made only by the swimming carrier: 98 #7d find(s) …, 130 way(s) into a ring, 0 drop(s)" |
| **g5o** | the same with `KARP_SWIM=off` | #7 OK; #16 "the swimming carrier not modelled (KARP_SWIM=off: the kid alone)" |
| **x7w** | g5 with **one** waiver (`probe: 'longGap'`, at one takeoff on the far bank) | #7 OK: "98 waived (2 flag group(s))" — both halves' groups from one mirrored entry |

**On the real stages** (§2.2, §2.3): the switch splits what a builder can act on from what waits on the lead. **Lockgate**: `fail`
gives #7d 1 650 = 4 layout + 5 field rule + 1 641 swim-jump (1 528 of them the lock canal's long gaps); `warn` leaves
FAIL #7 on 9 kid finds (4 low gaps by the lock steps, 3 vaults, 2 rising gaps) and 12 drops into the ring (22 with the
swim-jump's), with the 1 641 listed as a WARN, and entrances 5 / 5 instead of 8 / 8. **Halyard**: 2 007 = 536 layout
(jumps and hops onto the boats' decks, off the field) + 340 field rule (long gaps over the slips) + 1 115 swim-jump;
under `warn` still FAIL #7 on the 876 kid finds and 8 / 7 entrances (2–5).

### Issue 4 (minor): the static checks read zone era keys as strings. FIXED

`zoneOn` now compares as the engine's `karpField._zoneOn` does (`z.eras.includes(C.key)`, strict), and **#1 FAILs** a
free zone's `eras` entry that matches none of the field's state keys, and `eras` on a `noRetreat`, `carrierBlock` or
`noRest`: the engine honours eras on zones only (karpField.js line 482 is its only `eras` read), so those volumes are on
in every state whatever the data says (**TELL THE LEAD / WP0**: SPEC §4.1 says any entry may carry eras).

**Proof:** **x1e** (a second zone, `eras: ['1']`, on a box keyed 0 / 1) FAILs #1 "free zone 2's eras entry "1" matches
no field state (keys [0,1])"; **x1v** (a carrierBlock with `eras: [1]`) FAILs #1 "carrierBlock 2 carries eras [1], which
the engine ignores"; **x11z** (the spawn-deck zone `['0']`) is now caught by #1, and #9 FAILs too since the zone is gone
for the static checks as for the game (it was caught only by #11's zone visit before).

### Issue 5 (minor): #2's holes and reading sweep and #12's lightmap freshness were never planted. FIXED

- **x2h**: a 3.2 m platform north of the alley a kid drops off over the alley's 3 m wall, and a carrierBlock over the
  alley's mouth, its only way out. FAILs #2 "holes 210" (both halves), flagged.
- **x2s**: the data cannot plant a reading leak (the reading is the engine's own), so the case wraps the field's
  `fieldAt` to read 4 m low between the alley's nodes and exact at them (`sweepFault` in karp-check-box.js). FAILs #2
  "… > 2.5 m (worst …)". It proves the sweep's FAIL branch and its flags, not a real leak.
- **#12** now compares the bake's hash with the build's (the game applies a bake only when `level.layoutHash` equals it;
  without a loaded bake the build's hash comes from the level's own `layoutLightmap`, everything it sets put back), and
  takes a fixture (`o.lightmap`). **x12s** (a fixture with hash `stale0`) FAILs #12 "its lightmap is stale (… hash stale0
  baked, 28df3d74 built)"; **x12f** (hash `@level`: the build's own) passes #12 "lightmap karpbox.bazookarp fresh".
  A lightmap has no place, so x12s is marked `unplaced` (no flag asked).

### Issue 6 (minor): looks. FIXED where it is the kit's; the curtain is already fixed in WP2's branch

- **The curtain** (bazookarpFx, not the kit): the reviewer is right about this branch's placeholder (WP1a's
  `rotation.y = w.yaw + π/2`). **WP2 has already fixed it**: st-b5-karp-face 4e3d92e4, src/fx/bazookarpFx.js line 252,
  `cur.rotation.y = w.yaw`. I did not touch bazookarpFx (WP2 rebuilt it). The kit pictures now hide bazookarpFx's looks
  and their captions say so, so they claim nothing that isn't the kit's.
- **The Gate plinth** (d488929a): one 3.4 m square paving slab (0.15 m) on a darker 0.06 m base course 3.58 m square,
  stacked, not overlapping (check-maps calls overlapping pieces whose tops are < 0.08 m apart z-fighting). The octagon
  could not be one piece: with boxes only it was a plus of slabs and stepped corners. SPEC §4.2 asks only "a plinth
  0.15 m high and 3.4 m across"; WP2's sealed lid is a 1.6 m disc that sits on the slab. I looked at `out/kit-gate.jpg`, `halyard-kit-gate.jpg` and `lockgate-kit-gate.jpg`: one paving slab on its base course between the gold-banded posts.
- **The glyphs** (d488929a): each carrierBlock glyph stands at 0.72 of its edge (edges ≥ 3 m), the same way round the
  polygon, so opposite edges' glyphs no longer line up from a corner view. I looked at `out/kit-carrierblock.jpg`: four glyphs, none stacked.
- **Calamari's "weir" picture: the reviewer misread it.** Calamari has no `LAYOUT.bazookarp`, so it runs on the field's
  placeholder data and **no kit is built** (variants.js line 23 adds the kit only when `layout.bazookarp` exists); the
  camera was aimed at the placeholder weir's spot, an empty plaza. `kitPictures` now prints "placeholder data, no kit
  built" for such a stage and takes none. The re-run printed "kit pictures: calamari: placeholder data, no kit built (the kit comes from LAYOUT.bazookarp): no kit pictures".

## 0.2 Review 3 (verdict REDO, on 0ba0bded + fix round 2's tree): fix round 3

Fix round 3 answered all four issues; the full section is in this report at 61cbc3d8. In short (every case PASSES in
this round's self-test, §2.1):

| # | review 3's issue | fix | proof |
|---|---|---|---|
| 1 (blocker) | no probe saw a vault over a low wall or rail, or a squid slipping through a rail | the vault probe (D35); lowGap's squid tube through grates and rails; the waist line blocked by nav's test or a ray 0.3 / 0.6 m up (e1d4ae4a) | v5, v5h, rl, rlh; all ten of the review's real-stage crossings found |
| 2 (blocker) | only a running kid was modelled; a carrier swimming in its own ink jumps much further | #16's second mover, the swimming carrier (D34); `REACH.swim` measured to its 2.2 m ceiling (D36) | h20, g5, reachs |
| 3 (blocker) | fix round 2 unfinished and uncommitted, the self-test red | committed; the clean box's channel closed (D37) | clean, x9c, x7h, x7p4 |
| 4 (minor) | #8's distance / height / sight and #11's falls, narrow walk and zone ×3 never planted | x8n, x8f, x8u, x8s, x11f, x11w, x11z | each FAILs its own check (x11z now by #1: §0, issue 4) |

## 0.3 Review 2 (verdict REDO, on 68fa97bc): fix round 2

Fix round 2 was interrupted mid-round. Review 3 read its uncommitted working tree, and fix round 3 committed it as
0cd9479b; its cases are 0ba0bded. Review 3 found issues 1, 2, 4, 5 and 6 fixed and issue 3 caught, but not by the
pattern its case expected. Every case below PASSES in this round's self-test (§2.1).

| # | review 2's issue | what changed (0cd9479b) | proof |
|---|---|---|---|
| 1 (blocker) | A hop onto off-field ground into a ring was invisible when the ledge's face missed the 1 m grid | Hops onto off-field ground are taken from up to **two cells** out, diagonals included (0.5–2.25 m up, ≤ 2.3 m flat), with the hop rule's waist and head tests (D28) | **x7m2 / x7m4 / x7m6 / x7m8**: f7's ledge from x −17.2 / −17.4 / −17.6 / −17.8, and **x7m45**, the ledge turned 45°: each FAILs #7a as an unseen "hop over off-field ground" entrance |
| 2 (blocker) | The windows (riseGap ≤ 3.0 m, longGap / offGap ≤ 3.8 m) stopped short of what #16's kid makes | Every probe of a move the kid makes takes node pairs out to its **measured reach** (`REACH.air`, through `reachWin` / `probeWin`), with the coyote jump tried at and past the rim (D29). Fix round 3 adds the swimming carrier's reach (§0, issue 2) | **x7p2**: P2's 4 m rising gap into the ring FAILs #7a. **reach**: 55 platform pairs over the sea; every jump the kid makes lies inside the windows at the worst grid alignment |
| 3 (major) | A squid climb over 5.5 m onto off-field ground was only a WARN, its way down never followed | The top's exits are followed, as an off-hop's are. A drop of more than 2.5 m into a ring is #7c; an exit more than 10 m nearer a Gate is #7d. Only a top with no exit is a WARN (D30) | **x7p4**: P4's 6 m inkable tower through the ring wall FAILs #7c (the 6 m drop off its top) and #7d (tallWall) |
| 4 (minor) | A weir, Gate or Pond on a mover's track was not flagged | #1 FAILs a kit piece in a mover's swept volume, and #15 a weir's 3 m room (D31) | **x15m**: Wc, the weir where the car parks, FAILs #15 ("a mover sweeps within 3 m: kcar") and #1 ("in a mover's path") |
| 5 (minor) | The noRetreat-to-zone distance read crossing polygons as far apart | `polyPolyDist` is 0 when two edges cross or one polygon holds a vertex of the other | **x9n**: a 0.4 m noRetreat strip across an open-floor zone FAILs #9 ("within 3 m of team N's zone") |
| 6 (minor) | Flag pictures didn't mark the flagged move; some FAILs carried no flag | Every FAIL with a place carries a flag (#2–#6, #11, #12). `-flag-<n>` draws the move from → to with an arrow and its gain. The pictures come after #11, so its flags are numbered with the rest (D32) | The self-test's driver now FAILs a case whose target FAIL has no flag (that is how `x11f` showed up). Review 3 checked the arrows (e.g. `halyard-flag-23`); this round's are in §2.3 |

**TELL THE LEAD, from review 2:**

- **The field's own hop edges** (karpField: orthogonal neighbours only) have the same alignment hole for ledges *on* the
  field. Today the riseGap probe and the walk crossings catch them; the engine does not (WP0).
- **SPEC §4.4's long-gap band (3.0–3.8 m) undershoots the kid**, which clears 4.0 m of air level (its rim nodes up to
  ~6 m apart). The checker uses the measured reach; the band's words are kept only as the field's own gap rule.

## 0.4 Review 1 (verdict REDO, on 4387bed6): fix round 1

Fix round 1 answered all eight issues; the full section is in this report at a880d442. In short:

| # | review 1's issue | fix | proof (cases, all PASS now) |
|---|---|---|---|
| 1 (blocker) | #7 missed rising jumps across open air | the riseGap probe; jumps onto off-field ground across a real gap; a kid's move into a ring is a #7a entrance with its own sight line | x7r, x7rb, x7rq (H2p, H2bp, H2q) |
| 2 (major) | inkable 1.3–1.8 m steps counted as climb-only | climbs of ≤ 1.8 m the kid hops count as hops in every no-climb search | w4 (#4 / #9 must not fail) |
| 3 (major) | #15 sampled points and missed thin solids | each block measured exactly (its box clipped to the band, projected) | x15t (T1) |
| 4 (minor) | kit posts could float off a ledge | #1 FAILs a kit footing not resting on floor | x1 (W5) |
| 5 (minor) | the carrierBlock glyph drew on a cream square | the glyph is drawn on a transparent background again (`drawNoCarp` had turned `bg: null` into cream) | `out/kit-carrierblock.jpg` |
| 6 (minor) | the top-down's flags couldn't be decoded | numbered discs placed apart, a key panel, `-flag-<n>` | every top-down in `out/` |
| 7 (minor) | one sub-rule per check | 23 more cases | x3, x5b, x7a, x7c, x7t, x7l, x7h, x7g, x9d–x9g, x13, x14, x15a, x11, x11r |
| 8 (minor) | docs stale about the Mac mini | README, BUILDER.md, JOB-1 / JOB-2 | – |

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
     KARP_SWIM=fail|warn|off   [r4] how a move only the swimming carrier makes is judged (D34 / D40)
```

Always run it with `BOTLAB_OUT=…/inkwave-upstream/.botlab SLOTS=3 WATCHDOG=…`.

**What it prints and writes:**

- One line per check: `OK`, `WARN`, `FAIL` or `SKIP`, with its numbers.
- Then the result line:

  ```
  RESULT <id> ok|fail L=… weir=… gate=… routes=… zones=… hops=… walks=<routes ok/n>+<entrances ok/n> swim=fail|warn|off 7d=<layout>/<field rule>/<swim-jump>[ (n waived)] [FAIL=… SKIP=…]
  ```

- The numbered flags. Every flagged place, in the same numbering as the top-down's discs and key,
  the `-flag-<n>.jpg` pictures and the JSON's `flags`.
- `<id>-karp.json`: every check's numbers and flagged places, the flags, the walks, the carry walks and the drop
  coverage.
- The pictures.

`RESULT ok` needs all sixteen checks OK or WARN, with the physical proof and the carry walk run. One stage takes 40 s –
4 min here.

**Where the checks run:** in the game page (`tools/botlab/karp-check-page.js`), on the engine's own Carp Field
(`src/game/karpField.js`) and the level's own physics:

- the carrier graph is nav's valid nodes minus the spawn zones and carrierBlock volumes;
- its edges are nav's walk, jump, drop and climb edges plus the field's hop and gap edges.

Every team-dependent check runs for both teams. The data describes Alpha's attack; Bravo's attack is the mirror.

**"No climbs" (#4, #5, #7b, #9, #13, #16's walks, the carry walk) means no squid climb.** A climb edge of at most 1.8 m
that #16's kid hops counts as a hop (`climbHops`, review 1).

**How each check judges.** The numbers are SPEC §4.4 / §9.1's. A \* marks my reading where the spec left a gap (§3).
**[r1]**, **[r2]** and **[r3]** mark what fix rounds 1, 2 and 3 changed.

| # | check | judged |
|---|---|---|
| 1 | Data | FAIL any of: the Pond > 0.3 m off (0, 0); the Pond, any weir, either Gate or any sign (both teams) with no floor within 0.3 m under it, on a `roof` block, or inside a spawn zone (barrier + 0.6 m, above the pad − 1 m); no carrier-graph node under the Pond; a kit post / sign block (`karp-weir*`, `karp-gatepost*`, `karp-sign*`) that is not `roof` or takes ink.\* **[r1]** A kit piece that stands on the floor (each post's footing, the Gate's plinth and rim, the sill, each sign's foot) with floor more than 0.1 m below its bottom at any of 3 × 3 points over its footprint, both teams, each flagged.\* (The sill and the plinth are floor and take ink.) **[r2]** A kit piece, the Pond, a weir or a Gate trigger inside a mover's swept volume (D31). **[r4]** A free zone's `eras` entry that no field state's key matches, compared strictly as the engine does, and `eras` on a `noRetreat` / `carrierBlock` / `noRest`, which the engine ignores (D43). |
| 2 | Field | FAIL any of: \|L_A − L_B\| > 2 %; a hole (a node reached on the carrier graph from the Pond with D = ∞ for a team, unless the data waives it\*); \|fieldAt − D\| > 0.05 m at any node; any sweep point (¼, ½, ¾ of every walk edge, ±0.3 m across where the waist line is clear) more than 2.5 m below its proven lower bound. Reported: the hop / gap edges added, the largest gain across one, the points > 1.5 m low. The halfway line is drawn. |
| 3 | Distances and counts | FAIL any of: a weir's count outside 45–60 (40–55 % of L); a weir with no field reading at all; weir → Gate < 25 m or < 45 % of L; two weirs > 2 counts apart or < 12 m apart; 0 or > 2 weirs; L outside 55–85 m. Reported: Pond → weir → Gate along the field and on route 1; the Gate's distance from its pad; the lowest count within 3 m of each weir (reported, not judged: D1). |
| 4 | Reachability | FAIL: no carrier route for Pond → each weir or weir → Gate, either team, without squid climbs, spawn zones, the team's own free zones or carrierBlock. |
| 5 | Two routes | Route 1 is the shortest no-climb route. Route 2 is the shortest one avoiding every node within 2.5 m (3D\*) of route 1, except within 6 m of either end. Route 3 (squid climbs allowed, off both) is reported. FAIL: a leg with no route at all, no route 2, or route 2 > 1.6 × route 1, for every weir both ways, both teams. With two weirs, also FAIL when: their routes 1 meet (≤ 2.5 m apart outside 6 m of the ends); either route 1 passes within 4 m of the other weir; or the weirs are < 12 m apart. `routes` hints are measured and named. |
| 6 | Carry times | FAIL: Pond → Gate (L) outside 11.5–18 s at 4.8 m/s. Reported per leg via each weir, walking and swimming (9.44 m/s). |
| 7 | No shortcut into a base | **(a)** Every carrier-graph edge crossing into the Gate's 15 m ring, grouped single-linkage within 3 m. Also counted: a roof-less car's stop in the ring; every move #16 really makes from outside the ring to inside it (a high hop, long gap, rising gap or **[r3]** vault beyond the rules; a hop or jump onto off-field ground with an exit in the ring; **[r3]** a squid gap, through rails and grates too), at its landing, when it saves more than 3 m on the field's own way in (D33). FAIL: outside 2–5 entrances, or an entrance none of whose crossings is seen from 1.5 m above any edge node of the defenders' spawn deck (to 1 m above the crossing); a move into the ring needs its own line of sight (to its landing or an exit of it in the ring). **(b)** The field without squid climbs vs with, from every halfway-line node. FAIL: a with-climbs path saving > 20 % (its climb edges are listed; a climb the kid hops is not one). **(c)** FAIL: a drop or down-gap edge of > 2.5 m ending inside a ring; **[r2]** a squid-climb top's drop into the ring; **[r3]** a made move that ends in the ring more than 2.5 m below where it left. **(d)** The probes; each find is flagged (finds of one probe within 3 m are one flag) and pictured. FAIL when the find gains > 10 m and **[r2]** beats its own length by > 6.2 m (D33); WARN when one end is off the field with no exit (a hiding place, D3 / D30). The static probes measure \|ΔD\| as SPEC words it: low gaps (a 0.35 m squid tube 0.3 m up, between nodes ≤ 3 m apart not joined by ≤ 6 m of walking; **[r3]** through grates and rails, never standing on a grate); tall walls (nav's climb scan over 5.5 m; **[r2]** the top's exits followed); long drops (> 3.4 m with open air; signed). The moves #16 really makes are measured in their own direction: high hops (1.8–2.25 m up), long gaps, rising gaps (0.6–1.8 m up across open air, no 6 m walk), **[r3]** vaults (D35), hops onto off-field ground (**[r2]** up to two cells out, diagonals included: D28) and jumps onto off-field ground across a real gap (D21), whose gain is to their best exit. **[r2/r3]** Every one of them takes node pairs out to the mover's measured reach at its rise (D29): the kid's `REACH.air`, and from a takeoff whose floor takes ink the swimming carrier's `REACH.swim`. A move is tried when it can matter (worth > 10 m, or into a ring). **[r4]** Two more probes of moves the field lacks, both proved by #16: **steps off the grid** (field node pairs two cells apart, 0.3–1.8 m up or 0.3–3.4 m down, no edge, floor under the line: D38) and **squid tubes** (3–8 m, a kid's line blocked: D39). Every find carries its **cause** — layout, field rule or swim-jump (D41) — and `KARP_SWIM` decides whether a move only the swimming carrier makes FAILs, WARNs or is not tried (D40). A `waive` entry waives every find of each flag group it touches (within max(2, r) m, of its `probe` if named: D42).\* |
| 8 | Gate placement | FAIL any of: not 12–20 m from the defending pad (horizontal); more than 0.2 m above the pad; outside ±40° of the pad → Pond line; not seen from the deck; inside any free zone. |
| 9 | High ground and free zones | **Plateaus:** connected carrier-graph nodes ≥ 1.4 m above the lowest node within 3 m (≥ 2 nodes\*), on the half most of their nodes are on. FAIL a plateau the owner's carrier reaches (any carrier route from the Pond) and the enemy kid reaches only by a squid climb (no no-climb route from the halfway line, one with), unless every node is inside the owner's zones. **Zone entrances:** every carrier-graph edge (climbs included) into a zone's polygon and band; the crossings (edge midpoints\*) chained within 3 m. FAIL an entrance with no sign (of any of the owner's zones\*) within 2 m of a crossing, or one wider than 8 m without a sign within 2 m of each end (its two farthest crossings). **Also FAIL:** a zone node with D_owner ≤ D_other (both finite\*); a zone touching a weir trigger, a Gate trigger, or a route 1 / route 2 node of any leg; a `noRetreat` polygon within 3 m of a plateau or a zone (**[r2]** 0 when the polygons cross or one holds a vertex of the other). **WARN:** enemy arrival (walk 6 m/s, climb 7.5) > 2 × the owner's (from its deck), or a single entrance (plateaus ≥ 4 m²\*). |
| 10 | Retreat sanity | Route 1 and route 2 from each team's own Gate area to the Pond, on its own half. FAIL a dip of P (= L − D) below its running best of > 6 m outside `noRetreat`. Across every state switch the carrier's mark resets (§3.3), so the dip is 0 by rule; the raw change of P a still carrier would see on the routes is reported. |
| 11 | Carry walk | A fresh match per team, bots out, a scripted carrier (WASD + space): it picks the Bazookarp up at the Pond, walks route 1 to weir 1 (re-planning on the carrier graph after 2.5 s without progress: a stuck episode, logged with its place and edge, **[r1]** and flagged), plants, re-pops and walks to the Gate. Then four more walks: a retreat on its own half (×3 on at 8 m back, off at 3 m, measured from its own `mark`); a visit to its own zone (×3); a fall into the water from the wet node nearest the Pond on each half (own half → the Pond; enemy half → dropped by the last footing on that half, ≤ 12 m; up to 8 edges tried when a railing stops the fall); a splat on the narrowest walk near each weir (must rest on `wide` floor). **Drop coverage:** the field's drop spot at every 4th node of route 1 and route 2 of every leg, and at every node inside each zone (its enemy carrying). Each must land on the carrier's half, ≤ 12 m away except inside an enemy zone, never at the Pond. FAIL any of these. |
| 12 | Variant | FAIL any of: a piece in the Bazookarp build that Turf War lacks and that is neither the kit nor tagged `onlyIn: 'bazookarp'`; a Turf War piece missing without `notIn: 'bazookarp'`; no `assets/lightmaps/<id>.bazookarp.json`, or a stale one: **[r4]** the bake's hash is not the build's (D45). A test stage (karpbox) is never baked. |
| 13 | Deep spawns | **Ways off the deck** (a level flood from the pad, ≤ 16 m): nav edges leaving it, chained within 3 m; FAIL < 3. **The apron:** route 1 from the deck's edge to the Gate in front of it; FAIL < 2 solid static blocks (≥ 0.45 m across, prop colliders count, not the kit, not the deck's own blocks) rising ≥ 1.2 m above a route node within 4 m of it. |
| 14 | The Pond | FAIL: < 70 % of the 4.5–10 m ring is floor (nav cells at any level within ±5 m of the Pond\*), or the shell's centre (1.3 m up) is seen from fewer than 6 of 8 points 7 m out (1.5 m above their floor). |
| 15 | Weir room | FAIL any of: **[r1]** a solid block nearer than 3.0 m to the weir's axis between 0.3 and 3.6 m above its floor, measured exactly (the block's box clipped to that band, projected down: its hull's distance; any weir's own posts and sill excepted; the block and its distance named); no route to look along; its centre not seen from 1.5 m above route 1's node 8 m before it or 8 m after it; seen from fewer than 3 of 8 points 7 m out; **[r2]** a mover's swept volume within 3 m (D31). |
| 16 | Proved physically | **(i) The edges.** Tried: every hop and gap edge the field added; every #7d candidate beyond the rules that can matter (high hops, long gaps, rising gaps, **[r3]** vaults); the hops and jumps onto off-field ground that can matter; and, before any route is searched, every climb edge of at most 1.8 m that passes the hop rule's tests (`climbHops`: a made one counts as a hop in every no-climb search). A kid with `carry` set (4.8 m/s, the carrier's jump, both spawn barriers, carrierBlock) is stepped through `actor.update` at 1/60 s, alone (everyone else parked). It starts 1.5 m and 3 m before the low end, shortened toward it until it stands on floor (D11). It faces the far end and steers to it; a move down is first tried as a run-off; jump is pressed 0.2 / 0.5 / 0.8 / 1.1 / 1.4 m before the edge (a hop: its riser; a climb hop: the wall nav found; a gap: the rim, **[r2]** and the coyote jump at and past it; **[r3]** a vault: the obstacle's near face). Made = grounded on the far node's floor within 0.5 m of it inside 2 s (or on that floor ≤ 3 m away with a clear waist line). **[r3] The second mover:** when the kid fails and the takeoff's floor takes ink, the carrier swims in its own ink (the run-up inked into the paint grid, put back after) at 9.44 m/s from 2 m and 4 m back and swim-jumps at the same distances (a gap also at the rim and 0.3 / 0.6 / 0.9 m past it; a rise of 1.4 m or more also letting go of squid form at the top); made as the kid's, or on the far node's floor within 7 m (D34). A move made either way counts; `(swim-jump)` marks one only the swim made. **(ii) The walks.** The same kid walks every route 1 and route 2 of every leg, both teams, and goes through every entrance into each Gate's ring: one crossing per entrance with an 8 m run-up from the Pond side, then on to the Gate (squid climbs, rides and the moves proved apart excepted). It steers at the next node. It jumps on a jump, hop or climb-hop edge within 1.6 m of the node; on a walk edge only at a real riser; at a rim; and after 0.8 s without progress. A grounded kid whose own node is one of the next 8 path nodes has reached it. A hop, gap, climb-hop or nav jump edge it doesn't make on the way is decided by that edge's own trial. **FAIL:** an added edge never made (printed as `hopVeto` entries to paste, by kind); a walk stuck 2.5 s, fallen off or out of time (its place printed and drawn: ⊗). A walk stuck against a dynamic block is reported, not judged. Made candidates beyond the rules go to #7d / #7a with their gain. **[r4]** It also tries every step off the grid (timed off the face, jumped 0.2–2.0 m before it; a step down first as a run-off) and every squid tube (a squid crawling it on dry floor, then swimming it in its own ink where `KARP_SWIM` allows; made within 0.6 m of the far node; a tube not made has its thinned-out neighbours tried in its place). |

**Pictures** (JPEG < 290 KB; the page encodes them):

- **`<id>-karp-top.jpg`**: the whole stage from above, Alpha attacking left → right. **[r1]** The camera bounds now
  hold both Gates' rings. It shows:
  - Alpha's count as a heat map, with dots every 10 counts, and the halfway line;
  - Alpha's routes Pond → weir and weir → Gate (route 2 dashed);
  - both Gates with their 15 m rings and entrance arrows (red = unseen); weirs as diamonds; the Pond and its burst
    ring;
  - the free zones hatched in the owner's ink, with their signs and entrances (green ring = signed, red X = not);
  - `noRetreat` / `carrierBlock` / `noRest` outlined; plateaus (red = FAIL);
  - hop / gap edges as ticks: made faint green **[r1]**, not made thick red. Moves made beyond the rules (high hops,
    long gaps, rising gaps, jumps onto off-field ground) are faint magenta; **[r4]** each numbered #7d flag's own move bold, the rest of its group medium;
  - #16's failed walks as ⊗;
  - **[r1]** every flag as a numbered red disc on a leader (moved round its place until it covers no other), and
    **a key panel** under the map that lists every flag: its number, check, what it is and where.
- **The rest:**
  - `-pond`;
  - `-weir-<i>-approach` / `-defend` (from the farthest clear point 6–14 m back / on along the route, preferring open
    floor);
  - `-gate-approach`, `-gate-deck`, `-zone-<i>`, `-noretreat-<i>`;
  - **[r1]** `-flag-<n>`: one for every #7 flag, then the first FLAGSHOTS others, at most 40. The n is the flag's own
    number;
  - with `KITSHOTS=1`, the kit up close.

### 1.2 Stage states, generically

A stage module offers its field states through `R.karpStates() → [{ key, nodeOk(id), query }]`.
`G.match.stage.karpStates()` is new in `src/game/stageMods.js` (the first module offering any); it is the call the
engine already made. `query` is the page query of the module's own audit switch (`era=2`, `lava=high`).

- The checker lists the field's states. Without ERA / LAVA / KSTATE it checks each in turn, each on a page loaded with
  its `query`, so the world is in that state for the sight lines, the kid and the carry walk; the field is switched to
  it.
- `ERA=2` loads `?era=2` and checks the state keyed 2.
- docs/STAGE-MODS.md has the row, and T4 is marked served.

**Proof:** the self-test's `states` case. A test-only module, `tools/botlab/karp-check-states.js`, raises a wall 2.6 m
from the weir in its state `w` only. #15 passes in state 0 and FAILs in state `w`, built from `?kcstate=w`. karpbox's
own test-only state (`testStates`) is checked as a field state on the same page.

On this base `eras.js`, `lava.js` and `pipes.js` are 6-line placeholders that register nothing, so no shipped stage has
states yet.

### 1.3 The kit in final form (`src/world/bazookarp-kit.js`, `src/fx/karpKitFx.js`)

- **Weir:** two dressed stone posts, 5.4 m apart centre to centre across the walking direction. Each post is a 0.72 m
  footing (0.3 m high), a 0.5 m shaft, a dark band at 1.55–1.68 m and a 0.64 m capital: 2.4 m in all. Every part is
  `roof` and takes no ink. Between them is a 0.12 m stone sill for the curtain to fall onto; it is floor and takes ink.
  The shafts' inner faces are 2.45 m out, so the footings and capitals clear the shell's full 2.3 m swell at their
  heights.
- **Dragon Gate:** **[r4]** a square plinth: one 3.4 m paving slab up to 0.15 m on a darker 0.06 m base course 3.58 m
  square, stacked (D44; it was an octagon of a plus of slabs and stepped corners, which read as a cross). Two posts stand 4.4 m apart: a
  0.8 m footing, a 0.6 m shaft, a gold band and a capital, 3.2 m in all. The posts are `roof` with no ink.
- **NO CARP sign:** a stone foot, a 0.15 m wooden post and a 0.75 × 0.5 m board facing the sign's yaw, 1.9 m tall in all;
  every part `roof`, no ink. `karpKitFx` puts the crossed-out carp over "NO CARP" in the owning team's ink on both faces of
  the board.
- **Tags:** each post's shaft and each sign's post carry the plain tag (`karp-weir`, `karp-gatepost`, `karp-sign`: one
  per post, as bazookarp-rules L7 counts them). The other parts are suffixed (`-base`, `-band`, `-cap`, `-foot`,
  `-board`).
- **carrierBlock shimmer** (`karpKitFx`): a faint wall on each polygon edge, from the volume's floor up 2.4 m. Diagonal
  bands drift upward, brightest at the floor, with the NO CARP glyph (a dark violet carp) on it (**[r4]** at 0.72 of an edge of 3 m or more, the same way round the polygon, so opposite edges' glyphs no longer stack). Everyone sees it.
  **[r1]** The glyph is drawn on a transparent background again. `drawNoCarp` read `bg` with `??`, so the shimmer's
  `{ bg: null }` became the board's cream square.
- `karpKitFx` is its own module, built and cleared on `match:state` and animated in `onBeforeRender`, so WP2's rebuild of
  `bazookarpFx.js` doesn't collide with it.

Pictures (`out/`):

- `kit-weir.jpg`, `kit-weir-post.jpg`, `kit-gate.jpg`, `kit-sign.jpg`, and `kit-carrierblock.jpg` (**[r1]** re-taken:
  no cream squares) on karpbox;
- `halyard-kit-*.jpg` and `lockgate-kit-*.jpg` on the real stages;
- **[r4]** all re-taken on the final kit (`kit-*.jpg` on karpbox, `halyard-kit-*.jpg`, `lockgate-kit-*.jpg`), with
  bazookarpFx's looks hidden (the kit only; captions say so). A stage on placeholder data has no kit and gets none.

The kit pieces read as dressed stone and wood in the game's chunky style, and every perchable top is `roof` with no ink.
The curtain and the Gate's ring are bazookarpFx's placeholders, WP2's to finish (**[r4]** WP2's branch already stands the curtain between the posts).

### 1.4 `karp-field.js` in the regression set; the builder's template

- `tools/botlab/README.md`: the checker, its self-test (with `notFail` cases), `PROBE=`, **[r1]** the moves a kid makes,
  the climbs it hops and the numbered flags. Its Bazookarp regression set:
  - karp-field.js on karpbox and every stage;
  - the rules, gun and loop tests when the engine moves;
  - the checker's self-test and per-stage runs;
  - check-maps and karp-layout-diff for the other modes.

  **[r1]** It now runs locally or as a job on the Mac mini's runner, per COMMON.md.
- `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`: the per-stage builder's brief, pointing at SPEC §9:
  - the eight deliverables of §9.2 and their format;
  - the checker's usage and what to fix per check;
  - waivers, stage states and the regressions;
  - the NOTE.md template.

  **[r1]** Its Mac mini rows (the bake, the bot matches) point at COMMON.md's runner protocol. It now covers #1's kit
  footings, the climbs a kid hops (#4), #7's moves and entrances, #15's exact room and the numbered flags.

## 2. Tests and results (all local)

### 2.1 The checker's self-test (karpbox): 86/86

`KARP_SELFTEST=1` runs every case below. Each planted fault must FAIL its own check, and the check's text must match the
case's `expect` pattern, so the fault is caught for the reason it plants and not by a knock-on. Its target FAIL must
carry a flag (**[r4]** unless the case is `unplaced`: a lightmap has no place), and its `also` checks must FAIL too. A
`notFail` case must leave its checks unfailed (**[r4]** and its `notFailText` checks must say what the switch or waiver
did). The REACH cases must hold every jump their mover makes inside the windows. The clean karpbox must pass every
check, including the carry walk and #16's trials and walks.

**Result: 86/86, no console errors**, on 8c641d3b, in one Electron run: 27 min, 03:41–04:08, at load 10–21. The step
change after it (73dcbda8: every step candidate tried) can only touch the cases with steps or with `notFail` on #7:
those 12 (clean, f7, w4, g5, L1t, L2t, L3t, L1tc, T4, g5w, g5o, x7w) ran again on 73dcbda8, **12/12**, no console errors
(8 min). After the last checker commit (645c1baa: steps also jumped 1.7 / 2.0 m before the face, a not-made tube's
neighbours retried) the 15 cases with a step, a tube or a `notFail` on #7 (clean, f7, w4, g5, L1t, L2t, L3t, L1tc, T4,
x7d, rlh, g5w, g5o, x7w, x2h) ran on it: **15/15**, no console errors. The first run of the 17 new and changed cases
alone (03:33, before the full run) was also 17/17.

| case | check | the fault | result | checks failing |
|---|---|---|---|---|
| clean | – | the clean box | PASS | (none) |
| f1 | #1 | a NO CARP sign standing in the spawn zone | PASS | #1 |
| f2 | #2 | a wall on Bravo's half only (a `single`): Alpha's walk 50 % longer | PASS | #2 #15 |
| f3 | #3 | the weir at 85 % of the way (count ≈ 15) | PASS | #3 #15 |
| f4 | #4 | the weir on a 3 m box only a climb reaches | PASS | #3 #4 #5 #9 #15 |
| f5 | #5 | the weir at the end of a 3 m dead-end corridor | PASS | #1 #3 #5 #15 |
| f6 | #6 | a third ring opening, straight in from the south: Pond → Gate ≈ 10 s | PASS | #3 #6 |
| f7 | #7 | a 1.5 m non-inkable ledge through the ring wall that only a hop climbs, screened from the deck | PASS | #7 |
| f8 | #8 | the Gate 45° off the pad → Pond line | PASS | #3 #5 #6 #8 |
| f9 | #9 | a free-zone entrance with no sign | PASS | #9 |
| f10 | #10 | low walls either side of the Pond: the own-half route walks back | PASS | #10 |
| f11 | #11 | a noRest polygon over 26 m of the routes | PASS | #11 |
| f12 | #12 | a crate tagged notIn: 'turf' | PASS | #12 |
| f13 | #13 | the apron's crates gone | PASS | #13 |
| f14 | #14 | two 3 m walls 5.5 m out from the Pond: seen from 3 of 8 | PASS | #14 |
| f15 | #15 | a pillar 2 m from the weir | PASS | #15 |
| f16 | #16 | an awning over the flank lane's 1.5 m step: the field adds the hop, no kid makes it | PASS | #16 |
| f16w | #16 | a thin fence's 0.5 m slot on route 1: the graph walks through, no body fits | PASS | #16 |
| x5 | #5 | two weirs 8 m apart | PASS | #3 #5 #15 |
| x7b | #7 | a climb shortcut (an inkable stretch of ring wall, the opening far round) | PASS | #3 #5 #6 #7 #9 #10 |
| x7d | #7 | a squid-only gap (0.7 m headroom) through the ring wall | PASS | #7 |
| x9a | #9 | a climb-only 3 m plateau with a zone over half of it | PASS | #9 |
| x9b | #9 | a noRetreat polygon over the spawn deck's zone | PASS | #9 |
| states | #15 | a stage module's state `w` (its world on ?kcstate=w) raises a wall 2.6 m from the weir | PASS | #15 in `w` only |
| x9c | #9 | a free zone poking 2 m over the halfway line | PASS | #9 |
| x7r | #7 | **H2p** (review 1): a 2.0 m moat, a 1.0 m landing just inside the ring off the field, f7's screen | PASS | #7 |
| x7rb | #7 | **H2bp**: a 1.3 m moat, a 1.5 m landing off the field | PASS | #7 |
| x7rq | #7 | **H2q**: the moat in front of an on-field landing with a ramp into the ring, screened (a rising gap) | PASS | #7 |
| x7a | #7 | two more openings in the ring wall on the deck side (west): six entrances | PASS | #7 |
| x7c | #7 | a 3 m deck outside a west opening in the ring wall, up a ramp: its edge drops 3 m into the ring | PASS | #7 |
| x7t | #7 | a 5.8 m inkable platform up a long ramp: its far wall a squid climbs (nav stops at 5.5 m) | PASS | #7 |
| x7l | #7 | a 4 m platform up a long ramp: its far edge drops 4 m (nav stops at 3.4) | PASS | #7 |
| x7h | #7 | a 1.83 m ledge (no ink) in a west opening of the ring wall, a ramp down from it into the ring, the SW opening closed: a  | PASS | #5 #7 |
| x7g | #7 | the GAP's far platform moved 1 m on and 0.5 m down: 3.6 m of air (just beyond the gap rule), the long way round 14 m mor | PASS | #7 |
| x3 | #3 | the weir past its platform, 13 m from the ring (weir → Gate 10 m) | PASS | #3 #15 |
| x5b | #5 | a wall across the deck with a 3 m gap on route 1: route 2 round by the flank lane (2.23 ×) | PASS | #5 |
| x9d | #9 | a free zone over the weir's platform | PASS | #9 #15 |
| x9e | #9 | a free zone on the floor across the Pond → weir routes | PASS | #9 |
| x9f | #9 | an open-floor zone signed at one corner only: a 10 m entrance, an end unsigned | PASS | #9 |
| x9g | #9 | a free zone over the Gate | PASS | #8 #9 |
| x13 | #13 | two of the parapet's three openings closed: 1 way off | PASS | #13 |
| x14 | #14 | open water x 3…14, z 0…10 beside the Pond (mirrored): 65.5 % floor | PASS | #14 |
| x15t | #15 | **T1**: a 0.2 m lamp post 2.2 m from the weir (2.1 m to its corner) | PASS | #15 |
| x15a | #15 | the weir in the alley behind a chicane: its approach can't see it | PASS | #3 #5 #15 |
| x1 | #1 | **W5**: the weir at x 2 on its 8 m platform: a post off the edge | PASS | #1 |
| x11 | #11 | f16w's slot on route 1: the scripted carrier sticks (16 episodes), no plant | PASS | #11 |
| x11r | #11 | a noRetreat over each whole half: "retreat ×3 on at null m" | PASS | #9 #11 |
| w4 | – | W4: the weir's platform a 1.5 m inkable box, its ramps gone (nav gives it climb edges; a kid hops it) | PASS | (none) |
| x7m2 | #7 | f7's ledge from x -17.2: the cell centre at x −17.5 is 0.3 m from its west face (< 0.46: no node), so the floor node and | PASS | #7 |
| x7m4 | #7 | f7's ledge from x -17.4: the cell centre at x −17.5 is 0.1 m from its west face (< 0.46: no node), so the floor node and | PASS | #7 |
| x7m6 | #7 | f7's ledge from x -17.6: its west face clear of the cell centres (the floor node and the top node one cell apart: the al | PASS | #7 |
| x7m8 | #7 | f7's ledge from x -17.8: its west face clear of the cell centres (the floor node and the top node one cell apart: the al | PASS | #7 |
| x7m45 | #7 | f7's ledge turned 45° (a 3.6 m square, 1.5 m, no ink, its diamond filling the ring wall's west opening): every floor nod | PASS | #7 |
| x7p2 | #7 | P2: a 2.6 m moat in front of a 0.8 m landing inside the ring (a ramp down to the Gate), screened: a running jump 0.8 m u | PASS | #7 |
| x7p4 | #7 | P4: a 6 m inkable tower through the ring wall (its top off the field: nav climbs stop at 5.5 m), a screen inside: squid  | PASS | #7 |
| x15m | #15 | Wc: the weir on the east strip where the car parks (its stop moved to (18.5, 26)) | PASS | #1 #5 #15 |
| x9n | #9 | a 0.4 m noRetreat strip across an open-floor zone (crossing polygons) | PASS | #9 |
| reach | – | REACH: platform pairs over the sea, each a near rim a cell short of its rim node and a far platform `air` m on and `dy`  | PASS | every made jump inside the windows |
| v5 | #7 | V5: the ring wall's NW stretch (155–165°) a 1.4 m roof wall: a kid vaults it into the ring instead of walking round by t | PASS | #7 |
| v5h | #7 | V5h: the same stretch a 1.7 m roof wall | PASS | #7 |
| rl | #7 | RL: the ring wall's west opening (175–185°) closed by a 1.2 m railing (rail: true, 0.1 m), f7's screen inside: a kid hop | PASS | #7 |
| rlh | #7 | the same opening closed by a 2.6 m railing (beyond any vault or swim-jump), the screen inside: only a squid slips throug | PASS | #7 |
| h20 | #7 | H20: f7 with its ledge 2.0 m high (no ink), f7's screen: beyond a kid's hop, a carrier swim-jumping from its own ink on  | PASS | #7 |
| g5 | #7 | G5: a 5.0 m moat of open water through the ring wall's west opening (x −17…−12), inkable floor both sides: beyond a kid' | PASS | #7 |
| reachs | – | REACH (swimming): the same platform pairs with inkable near platforms (6 m: the run-up) and the stage widened to x ±44 f | PASS | every made jump inside the windows |
| x8n | #8 | the Gate 10 m from the pad | PASS | #8 |
| x8f | #8 | the Gate 22 m from the pad | PASS | #7 #8 |
| x8u | #8 | the Gate on a 3.4 m dais: 1 m above the pad | PASS | #1 #3 #7 #8 |
| x8s | #8 | a 4.6 m screen across the apron: the Gate unseen from the deck | PASS | #8 |
| x11f | #11 | a noRest polygon round the enemy half's water edge nearest the Pond: the fall dropped ≥ 13.5 m off | PASS | #11 |
| x11w | #11 | open water across the main floor, a 1 m causeway on route 1: the splat rests on narrow floor | PASS | #5 #11 #14 |
| x11z | #1 | **[r4]** the spawn-deck zone's eras written as strings (`['0']`): the engine never applies it; now caught by #1 (eras read strictly) | PASS | #1 #9 |
| x1e | #1 | **[r4]** a second zone with eras `['1']` on a box keyed 0 / 1 (numbers) | PASS | #1 |
| x1v | #1 | **[r4]** a carrierBlock with eras `[1]` (the engine ignores eras there) | PASS | #1 |
| L1t | #7 | **[r4]** a 1.0 m ledge off the grid (face at x −15.4) into the ring, 3.6 m wall stretches, screened | PASS | #7 |
| L2t | #7 | **[r4]** the same at 0.8 m | PASS | #7 |
| L3t | #7 | **[r4]** a 1.0 m walkway's end off the grid: a 1.0 m step down into the ring, screened | PASS | #7 |
| L1tc | #7 | **[r4]** the control: L1t's face on the grid (nav's jump edge, a plain entrance) | PASS | #7 |
| T4 | #7 | **[r4]** a 3.5 m squid culvert (1.0 m high) into the ring, screened | PASS | #7 |
| g5w | – | **[r4]** G5 with `KARP_SWIM=warn`: #7 must not FAIL, and must WARN the swim-jump finds | PASS | (none) |
| g5o | – | **[r4]** G5 with `KARP_SWIM=off`: #7 must not FAIL, #16 says the swimmer is not modelled | PASS | (none) |
| x7w | – | **[r4]** G5 with one waiver (probe longGap, one find's spot): its whole flag group waived | PASS | (none) |
| x2h | #2 | **[r4]** a hole: a drop over the alley's wall, a carrierBlock over its mouth | PASS | #2 |
| x2s | #2 | **[r4]** a reading fault planted in fieldAt between the alley's nodes (4 m low) | PASS | #2 |
| x12s | #12 | **[r4]** a fixture lightmap with a wrong hash (karpbox judged as baked) | PASS | #12 |
| x12f | – | **[r4]** the same fixture with the build's own hash: #12 must not FAIL, and say fresh | PASS | (none) |

**The clean box** (unchanged since 92b6a972): L 61.58 / 61.45 m, weir count 60; 10 hop and 24 gap edges, all made;
walks 8/8 routes and 8/8 entrances; 54 moves beyond the rules worth trying (32 long gaps, 22 vaults), none made; **0 steps
off the grid and 0 squid tubes that can matter**; the swimming carrier makes nothing the kid didn't (72 inkable
takeoffs, 796 swim trials); the carry knocks out both ways (weir 5.9 + Gate 7.7 s, and 5.7 + 7.9 s), stuck 0; retreat ×3
on at 8.22 m, off at 2.91 m; 248 drop splats fine. RESULT line: `RESULT karpbox@0 ok L=61.58/61.45 weir=60 gate=12
routes=2/2 zones=1 hops=10+24 walks=8/8+8/8 swim=fail 7d=0/0/0`.

**Pictures** (`out/`):

- `self-clean-*`, the clean set;
- **[r4]** the new cases' top-downs: `self-L1t`, `L2t`, `L3t`, `L1tc`, `T4`, `g5w`, `g5o`, `x7w`, `x2h`, `x2s`, `x12s`,
  `x12f`, `x1e`, `x1v`, `x11z` (`-karpbox-s0-karp-top.jpg`), and `selftest.json`;
- the earlier rounds' case top-downs as committed before (review 1's `self-x7r` … `self-x11`, review 2's
  `self-x7m2/4/6/8/45` …, review 3's `self-v5` … `self-x11f/w`).

I looked at `self-L1t-karpbox-s0-karp-top.jpg`: the two unseen step arrows sit on the west openings of both rings with
flags 1–4, and the key reads "#7a a step off the nav grid into the ring, unseen from the deck" and "#7d step [field rule]
×6: gain 10.4–12.4 m".

### 2.2 The honest report: halyard's and lockgate's first-cut data (the final checker)

Both still fail, as expected, on the same checks as before. The field-level numbers (L, counts, routes, #9–#15) are
unchanged since fix round 1. Neither stage has a step off the grid or a squid tube that can matter (0 candidates), so
this round changes their #7 only by the causes and the switch. `out/halyard-*` and `out/lockgate-*` hold the full sets
(a `-flag-<n>` for the #7 flags, up to 40) and the JSON, re-taken this round: **the flag numbers changed**.

**Halyard** (first cut: weir at (−8, 27.5), Gate at (0, 52.5)). L 54.8 / 54.7 m. FAIL #3 #5 #6 #7 #9 #10 #12 #13 #14 #16.

- **#3 / #5 / #6 / #9 / #10 / #12 / #13 / #14:** as in fix round 1: L 54.8 m (< 55), weir → Gate 24.4 m, route 2
  1.81 ×, 11.4 s walking, the deck's wings partly zoned, route 1 dips 6.6 m, no lightmap, 1 cover block on the apron,
  47.9 % of the Pond's ring floor.
- **#7:** (a) **10 / 9 entrances**, all seen (8 / 7 under `warn`); (c) 40 drops of 3.2 m off the spawn deck's edge
  into the ring (D4); (d) **2 007 finds = layout 536** (offGap 502, offHop 34: onto the moored boats' decks, off the
  field) **+ field rule 340** (longGap 289 over the slips, riseGap 48, vault 3) **+ swim-jump 1 115** (longGap 877,
  offGap 152, riseGap 86); 16 low gaps to a top with no count stay a WARN. 91 flags, 58 of them #7's.
- **#16:** 6 of 546 added edges not made; walks 8/8 routes, 10/10 entrances; 24 of 24 climbs ≤ 1.8 m hopped.
- **Passes:** #1, #2 (Δ 0.2 %, no holes), #4, #8, #11, #15.

**Lockgate** (first cut: weir at (0, 24), Gate at (0, 52)). L 58.0 / 57.9 m. FAIL #5 #7 #9 #11 #12 #14 #15 #16.

- **#5 / #9 / #11 / #12 / #14 / #15:** as in fix round 1: route 2 2.55 ×, a climb-only 14 m² plateau and unsigned zone
  entrances, the narrow-walk splat on narrow floor, no lightmap, the Pond's ring 63.9 % floor and seen from 4 of 8, the
  office 1.5 m from the weir.
- **#7:** (a) 8 / 8 entrances, all seen (**5 / 5 under `warn`**); (c) 22 drops of 3.1–3.3 m into the ring (12 under
  `warn`); (d) **1 650 finds = layout 4** (low gaps at the lock steps) **+ field rule 5** (3 vaults, 2 rising gaps)
  **+ swim-jump 1 641** (the canal's long gaps 1 528, rising gaps 82, high hops 26, vaults 5). 54 flags, 32 #7's.
- **#16:** 10 of 492 added edges not made (gaps down from the office's edge); walks 8/8, 8/8.
- **Passes:** #1, #2, #3 (count 50, weir → Gate 29.0 m), #4, #6 (12.1 s), #8, #10, #13.

**For WP4b:** lockgate's kid-only work is now nine finds and the drops; the canal is the swim-jump, the lead's D34.
Halyard's boats are layout (their decks want `roof`, a carrierBlock or a waiver per flag group).
### 2.3 Every shipped stage (`MAP=all`, the final checker)

`MAP=all` ran every shipped stage in one Electron on 73dcbda8 (26 min, 04:55–05:20, load 11–47), no harness or console
errors; terraces, craters and crossmarket, the only stages 645c1baa's step timing and tube retries can touch (the only
ones with a step or a tube not made), ran again on 645c1baa (5 min, no errors). The table is built from those runs'
JSONs (`out/all-stages.json`). The first run, on 8c641d3b (26 min, 04:09–04:35, no errors), failed the same checks on
every stage; with its cap of two steps a takeoff it tried fewer steps (craters 12 vs 38, calamari 14 vs 30) and found up
to 51 fewer #7d finds a stage.

Only halyard and lockgate have data. The other eleven run on the engine's placeholder data and fail by design
(DECISIONS #10); what the stage itself holds (edges, proof, finds, climbs) is real, what depends on the Pond, weir and
Gate spots is the placeholder's.

| stage | L (m) | weir counts | result | failing checks | hop + gap edges | #16 made / not made (hopVeto) | #16 walks: routes, entrances | beyond the rules made | rising gaps: tried / made | vaults: tried / made | steps off the grid: tried / made | squid tubes: tried / made | made only by the swimming carrier | climbs ≤ 1.8 m hopped | #7d finds (gain > 10 m) | #7d by cause: layout / field rule / swim-jump | entrances A/B | s |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tidewater (placeholder) | 57.02 / 55.45 | 100 | fail | #2 #3 #4 #5 #7 #11 #12 #15 #16 | 6 + 108 | 106 / 8 (h 0, g 0, g↓ 8) | 0/0, 12/12 | 1759 of 1811 | 3 / 3 | 66 / 66 | 30 / 30 | 40 / 40 | 614 (2 edges, 579 beyond, 33 off-field) | 11 of 11 | 1841: lowGap 84, longGap 1553, vault 60, squidTube 40, riseGap 3, step 30, longDrop 13, offGap 44, offHop 14 | 129 / 1132 / 554 | 7/10 | 110 |
| kelpline (placeholder) | 51.96 / 51.95 | 50 | fail | #3 #5 #6 #7 #9 #11 #12 #15 #16 | 40 + 1674 | 1708 / 6 (h 0, g 2, g↓ 4) | 8/8, 6/6 | 2092 of 2167 | 77 / 77 | 25 / 25 | 19 / 19 | 21 / 21 | 1061 (1 edges, 813 beyond, 247 off-field) | 52 of 52 | 1362: lowGap 10, riseGap 57, vault 21, squidTube 7, longGap 747, step 19, offHop 23, offGap 471, climbOff 2, highHop 5 | 269 / 562 / 531 | 5/5 | 95 |
| halyard | 54.8 / 54.68 | 45 | fail | #3 #5 #6 #7 #9 #10 #12 #13 #14 #16 | 16 + 530 | 540 / 6 (h 0, g 0, g↓ 6) | 8/8, 10/10 | 1677 of 2124 | 379 / 181 | 3 / 3 | 0 / 0 | 0 / 0 | 1388 (6 edges, 1230 beyond, 152 off-field) | 24 of 24 | 2007: lowGap 16, longGap 1166, offHop 34, offGap 654, riseGap 134, vault 3 | 536 / 340 / 1115 | 10/9 | 119 |
| saltpan (placeholder) | 83.48 / 81.06 | 50 | fail | #2 #7 #8 #9 #11 #12 #13 #15 | 91 + 186 | 277 / 0 | 8/8, 4/4 | 128 of 152 | 9 / 8 | 25 / 23 | 0 / 0 | 63 / 63 | 70 (16 edges, 54 beyond, 0 off-field) | 58 of 58 | 156: lowGap 47, riseGap 8, vault 21, squidTube 56, longGap 24 | 103 / 8 / 45 | 3/3 | 88 |
| crossmarket (placeholder) | 65.13 / 65.4 | 49 | fail | #5 #7 #8 #9 #11 #12 #13 #14 #15 #16 | 0 + 173 | 167 / 6 (h 0, g 0, g↓ 6) | 6/6, 8/8 | 502 of 521 | 42 / 36 | 38 / 38 | 4 / 4 | 12 / 0 | 139 (0 edges, 139 beyond, 0 off-field) | 0 of 0 | 374: highHop 15, longGap 291, riseGap 34, vault 30, step 4 | 0 / 251 / 123 | 6/6 | 83 |
| lockgate | 58.03 / 57.9 | 50 | fail | #5 #7 #9 #11 #12 #14 #15 #16 | 66 + 426 | 482 / 10 (h 0, g 0, g↓ 10) | 8/8, 8/8 | 1666 of 2070 | 174 / 85 | 18 / 12 | 0 / 0 | 0 / 0 | 1660 (3 edges, 1653 beyond, 4 off-field) | 90 of 94 | 1650: lowGap 4, highHop 26, riseGap 84, vault 8, longGap 1528 | 4 / 5 / 1641 | 8/8 | 143 |
| terraces (placeholder) | 66.01 / 61.2 | 48 | fail | #2 #7 #8 #9 #11 #12 #13 #15 #16 | 145 + 641 | 780 / 6 (h 2, g 2, g↓ 2) | 8/8, 10/10 | 930 of 1090 | 871 / 742 | 33 / 30 | 45 / 45 | 13 / 13 | 93 (0 edges, 91 beyond, 2 off-field) | 408 of 410 | 799: lowGap 11, longGap 60, riseGap 645, vault 24, step 39, squidTube 10, offHop 4, offGap 6 | 29 / 682 / 88 | 9/11 | 104 |
| nantai (placeholder) | 72.85 / 72.99 | 50 | fail | #7 #8 #9 #12 #13 #15 | 99 + 323 | 422 / 0 | 8/8, 4/4 | 4554 of 5468 | 206 / 130 | 21 / 21 | 30 / 30 | 0 / 0 | 4232 (2 edges, 4228 beyond, 2 off-field) | 371 of 371 | 4576: lowGap 18, vault 21, step 30, offHop 4, longGap 4373, riseGap 130 | 20 / 326 / 4230 | 2/2 | 226 |
| craters (placeholder) | 69.39 / 69.26 | 50 | fail | #7 #8 #9 #11 #12 #13 #15 #16 | 317 + 1376 | 1583 / 110 (h 2, g 2, g↓ 106) | 8/8, 2/2 | 597 of 648 | 409 / 392 | 19 / 18 | 38 / 24 | 80 / 60 | 259 (38 edges, 220 beyond, 1 off-field) | 226 of 226 | 590: lowGap 40, highHop 4, riseGap 373, vault 18, step 24, squidTube 60, longGap 53, offGap 7, offHop 11 | 121 / 298 / 171 | 3/3 | 62 |
| calamari (placeholder) | 64.82 / 64.82 | 48 | fail | #7 #8 #9 #11 #12 #13 #16 | 74 + 239 | 311 / 2 (h 0, g 0, g↓ 2) | 8/8, 12/12 | 509 of 562 | 218 / 165 | 11 / 11 | 30 / 30 | 0 / 0 | 265 (0 edges, 265 beyond, 0 off-field) | 138 of 138 | 495: lowGap 4, riseGap 165, vault 9, step 30, highHop 2, longGap 271, offHop 14 | 20 / 212 / 263 | 8/7 | 87 |
| spirhalite (placeholder) | 80.25 / 79.54 | 50 | fail | #5 #7 #8 #11 #12 #13 #14 #15 | 84 + 622 | 706 / 0 | 8/8, 2/2 | 601 of 773 | 198 / 166 | 27 / 24 | 14 / 14 | 13 / 13 | 275 (0 edges, 275 beyond, 0 off-field) | 284 of 284 | 578: lowGap 16, vault 18, riseGap 152, squidTube 2, longGap 331, step 14, highHop 41, offHop 4 | 58 / 257 / 263 | 2/1 | 69 |
| treehills (placeholder) | 70.93 / 70.48 | 52 | fail | #7 #8 #9 #11 #12 #13 #15 #16 | 197 + 200 | 393 / 4 (h 0, g 0, g↓ 4) | 8/8, 6/6 | 321 of 352 | 206 / 178 | 8 / 6 | 22 / 22 | 3 / 3 | 67 (0 edges, 67 beyond, 0 off-field) | 91 of 91 | 337: lowGap 16, longGap 112, riseGap 178, step 22, squidTube 3, vault 6 | 19 / 251 / 67 | 3/3 | 60 |
| cargo (placeholder) | 51.96 / 51.95 | 50 | fail | #3 #5 #6 #7 #9 #11 #12 #15 #16 | 40 + 1674 | 1708 / 6 (h 0, g 2, g↓ 4) | 8/8, 6/6 | 2092 of 2167 | 77 / 77 | 25 / 25 | 19 / 19 | 21 / 21 | 1061 (1 edges, 813 beyond, 247 off-field) | 52 of 52 | 1362: lowGap 10, riseGap 57, vault 21, squidTube 7, longGap 747, step 19, offHop 23, offGap 471, climbOff 2, highHop 5 | 269 / 562 / 531 | 5/5 | 86 |

Reading it (new or changed this round):

- **[r4] Steps off the grid: tried / made.** 0–45 a stage, nearly all made: these are the misaligned kerbs and terrace
  steps nav's grid misses. Their finds are field-rule finds (terraces 39, nantai 30, calamari 30, tidewater 30, craters
  24, treehills 22, kelpline / cargo 19, spirhalite 14, crossmarket 4).
- **[r4] Squid tubes: tried / made.** Crawlspaces and culverts 3–8 m long: saltpan 63, craters 60, tidewater 40,
  kelpline 21 made; crossmarket's 12 are not passable.
- **[r4] #7d by cause.** Where the swim-jump dominates (nantai, lockgate, halyard) the lead's D34 decides; where the
  field rule dominates (terraces, crossmarket, treehills, tidewater) the kid's own moves are the work, and WP0 could absorb
  them; layout is what only the stage can close.
- **Entrances A / B:** a move into the ring that saves more than 3 m is an entrance (D33): tidewater 7 / 10 (was 6 / 9:
  its tubes and steps), terraces 9 / 11 (was 8 / 10).

**Review 3's ten real-stage crossings** are all still #7d finds with both ends exact (checked in the final JSONs): nine
vaults, now marked [field rule], and tidewater's (5.5, 2.4, −58.7) pair a low gap [layout] as well as a vault.

**Pictures:** `out/<id>-karp-top.jpg` for all 13 stages, each with its flag key (terraces', craters' and crossmarket's from
645c1baa, the rest from 73dcbda8); the full sets for halyard and lockgate. Each numbered #7d flag's own move is drawn bold
and the rest of its group medium; on lockgate the canal is still a dense fan (`lockgate-karp-top.jpg`), but the flags'
own arrows and the key ("7d longGap (swim-jump) [swim-jump] ×405: gain 13.6–28.2 m") read.
### 2.4 Regressions (what this round could have broken)

This round changed the checker (`tools/botlab/`), its docs, and two small src files: the kit (`src/world/bazookarp-kit.js`,
the Gate's plinth) and `src/fx/karpKitFx.js` (where a glyph stands). Plus `bazookarp-data.js`'s header comment.

- **The checker's self-test:** 86/86 on 8c641d3b (27 min, 03:41–04:08, load 10–21), no console errors; the cases the
  later checker commits can touch 12/12 on 73dcbda8 and 15/15 on the final 645c1baa (§2.1).
- **`MAP=all`** twice: on 8c641d3b (26 min, 04:09–04:35) and on the final checker 73dcbda8 (26 min, 04:55–05:20, load 11–47; terraces, craters and crossmarket again on 645c1baa, 5 min); no harness
  or console errors either time.
- **check-maps** (`node build/check-maps.mjs`): every stage's default build **identical to base b55f7472** (both trees'
  full output diffed: no difference). `halyard.bazookarp` 145 pieces (155 before: the plinth is 2 pieces, not 7, per
  Gate) with only its known 25.7° ramp; `lockgate.bazookarp` 248 pieces with only its known weir-cap z-fight inside the
  office (#15 FAILs it). My first plinth (both pieces bedded 0.05 m into the floor) made check-maps report 8 new
  z-fights (tops 0.07 / 0.00 and 0.07 / 0.15 apart over the floor); the stacked plinth has none.
- **karp-layout-diff** against b55f7472: **RESULT same (96/96 builds and thumbnails identical)**.
- **bazookarp-rules.js group L** (the stage pieces, the variant, the signs; the kit is built there): **14/14**, no console
  errors (`MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/bazookarp-rules.js PAGE_ARGS='only=L'`).
- **Not re-run, because nothing they test changed:** karp-field.js (karpField untouched), karp-loop / karp-gun, the net and
  sfx tests.

## 3. Decisions where the spec left a gap (for the lead)

- **D1. #3's "each weir's count is the lowest within 3 m of it on its floor" is reported, not judged.**
  - On any floor that falls toward the Gate, the nodes 3 m on read about 5 counts lower, so the literal rule fails every
    placement (the clean box's weir: count 60, 55 within 3 m).
  - Its purpose ("landing it is never worth less than walking past it") already holds through the cap (§3.4): until the
    plant, the count stops at the highest weir count, and a plant sets the planted weir's.
  - The JSON keeps `low3` per weir. **TELL THE LEAD.**
- **D2. Hops onto off-field ground are a #7d probe, and #7a counts them.**
  - The field's hop edges join field nodes only, and nav keeps only nodes it can walk to and back from. So a ledge top
    that only a hop reaches is outside the field: no field edge, no entrance, no reading.
  - SPEC §4.4's own self-test fault (f7) is that case.
  - **[r1]** This is extended to jumps across a real gap (D21).
  - The engine could take such tops into the field (WP0's / the lead's call). **TELL THE LEAD.**
- **D3. A #7d find with one end off the field** (D = ∞) is a WARN, a hiding place, not a FAIL: its gain has no number.
- **D4. #7c counts drops off the defenders' own spawn deck into the ring**, as the spec's words say.
- **D5. Waivers live in the data:** `waive: [{ check: '7d', at: [x, z], why }]` (Alpha's attack, mirrored). A find of
  that check within 2 m of the spot is reported as waived.
- **D6. The self-test box is karpbox plus a clean variant** (`karp-check-box.js`). karpbox itself is left untouched,
  because the rules tests rely on it.
- **D7. The self-test.**
  - One fault per check, plus SPEC §4.4's own list.
  - **[r1]** One case per sub-rule that had none, and the reviewer's faults (§2.1): 48 cases.
  - `notFail` cases prove a false FAIL gone.
- **D8. #9's plateau WARNs** apply to plateaus of 4 m² or more. The FAIL rule is the spec's, for any size.
- **D9. #13's "ways off the deck"** are nav edges of any type leaving a level flood of the deck, chained within 3 m. The
  deck's own blocks are not apron cover.
- **D10. #14 counts floor at any level within ±5 m of the Pond.**
- **D11. #16's run-up:** when 1.5 m or 3 m back is not floor at the low end's height, the start moves toward the edge in
  0.3 m steps. With no start at all, the edge counts as not made.
- **D12. #11's falls** use the wet node nearest the Pond on each half. "The narrowest walkway near each weir" is the
  route node within 12 m of the weir (≥ 3 m from it) with the fewest nodes within 1.5 m.
- **D13. The kit's looks live in their own module** (`karpKitFx.js`).
- **D14. Stage states carry a `query`**, so one generic checker builds each state's world.
- **D15. One tagged line in the Carp Field (`src/game/karpField.js`, WP0's code): a one-way gap edge down needs open air
  over its landing below the ledge it leaves** (nav's drop rule).
  - Without it, deck tops had "gap" edges down to the floor under that same deck. Removing them took crossmarket from
    443 to 173 gap edges, calamari from 804 to 239 and lockgate from 684 to 426.
  - **TELL THE LEAD.**
- **D16. The self-test checks the reason, not only the check number:** each case carries an `expect` pattern on its
  check's text.
- **D17. #16's walks** run the routes and entrances the graph claims with a real body. The walker's habits were tuned
  on traces, not guessed.
- **D18. Craters' not-made gap edges are real:** thin balustrades the field's level waist line passes over. A down-gap
  waist line that follows the fall would drop most of them at the source (WP0). **TELL THE LEAD.**
- **D19. #5 FAILs a leg with no route at all.**

New in fix round 1 (review 1):

- **D20. Rising gaps** use the reviewer's definition:
  - rim pairs 1.2–3.0 m apart (flat), the far one 0.6–1.8 m up;
  - "open air" somewhere under the line (no floor within 1 m below it);
  - a clear waist line;
  - no 6 m carrier-graph walk joining them, so a step a kid can walk to and hop is no candidate.

  **Which ones #16 tries:** only those that can change a verdict, i.e. worth more than 10 m, or from outside a Gate's
  ring to inside it. The rest are counted (`candidates / tried / made` in the table). Their gain is in the move's own
  direction (D23).
- **D21. Jumps onto off-field ground:**
  - from a field rim node to an off-field rim node (nav-invalid, not a spawn zone, not a carrierBlock);
  - 1.2–3.8 m flat, from 3.4 m down to 1.8 m up;
  - across a **real gap**: somewhere along the line, no floor within 1 m below the lower end.

  The real-gap test is stricter than D20's. Measured against the rising line itself, a running jump onto a box across
  its own floor counted as "air". Kelpline had 56 such pairs onto one box by its spawn, and f7 had 26 onto its ledge.
  Those are the off-hop from the box's foot (D2) seen from further back.

  **An off-field top's exits** are nav's own edges off it, plus stepping or dropping off its edge: field floor up to 2
  cells out and 0.3–3.4 m lower, open above, with a clear waist line. Nav has no node right beside a ledge where a body
  doesn't fit against it, so H2p's landing had no nav exit at all.

  **Tried** when its best exit is more than 10 m nearer a Gate, or it has an exit inside a ring entered from outside.
- **D22. #7a's moves.**
  - A move #16's kid makes from outside a Gate's ring to inside it is an entrance at its landing (or, onto off-field
    ground, at the landing if that is in the ring, else its first exit in the ring).
  - It joins the entrance with a graph crossing nearest it within 3 m, so a jump beside a doorway does not add a sixth
    entrance. Otherwise it groups with the other moves.
  - It never chains two separate entrances into one (d5795858; at 69abedc0 tidewater's Bravo side lost one so).
  - It is never "seen" through that entrance's walk crossings. It needs its own line of sight, to its landing or to any
    of its exits in the ring.
- **D23. The gain of a one-way move** (a high hop, a long gap, a rising gap; the off-field moves already were) is
  measured in its own direction: D(from) − D(to), for the team it helps.
  - **Why:** #16 proves each move one way, and a move that lands further from both Gates is no shortcut. H2q's long gap
    back out of the ring went 14.8 m the wrong way.
  - The static probes keep SPEC's "differs" (\|ΔD\|): a squid gap goes both ways, and a tall wall's top is read
    through the drop off it.
  - **TELL THE LEAD** if SPEC's word should rule there too.
- **D24. Climbs a kid hops** (issue 2).
  - **What counts:** a nav climb edge of at most 1.8 m between field nodes that passes the hop rule's own tests (waist
    line, head over the foot, head across), and that #16's kid makes (its jump timed off the wall nav found). It counts
    as a hop in every no-climb search; #7b doesn't list it.
  - **What doesn't change:** the field's own D (a climb and a hop are the same length).
  - **PHYS=0:** the geometry alone decides, and the text says "unproven".
  - The climb edges above 1.8 m stay squid climbs.
- **D25. #1's kit footings.**
  - The check samples 3 × 3 points at ±80 % of each footing, plinth slab, sill and sign foot.
  - Floor (any solid non-kit top) must be at most 0.1 m below the piece's bottom. Buried is fine.
  - **The kit is not changed** to build each post at its own floor: a post sunk silently to the ground below a ledge
    would hide a weir spot the builder must move. It FAILs instead.
- **D26. The flags.**
  - One numbering for the picture, its key, the `-flag-<n>` pictures, the JSON and the console.
  - A check's flags of one kind (the text without its numbers) within 2 m of each other are one; #7d's finds of one
    probe within 3 m are one.
  - There are pictures for every #7 flag, then FLAGSHOTS others, at most 40.
- **D27. #15 excepts any weir's own posts and sill** (the `karp-weir*` / `karp-sill` tags). Gate posts and NO CARP signs
  count.

New in fix round 2 (review 2):

- **D28. Hops onto off-field ground from up to two cells out.** nav keeps a floor node at least 0.46 m from a face, so
  where a ledge's face falls just past a cell centre, the floor node and the top node stand two cells apart or on a
  diagonal. The off-hop takes every off-field top node within 2.3 m (flat) and 0.5–2.25 m up, diagonals included,
  with the hop rule's waist and head tests (the reviewer's first option; D21's real-gap test stays for the jumps across
  air).
- **D29. The windows are the mover's measured reach,** not SPEC's bands. `REACH.air` (the kid) and `REACH.swim` (the
  swimming carrier) hold, per rise, the first gap of the self-test's REACH rows not made beyond the last made one. A
  window adds a 0.3 m margin and a cell's worth at each rim (a rim node stands up to 0.95 m back from its edge). The
  `reach` and `reachs` cases prove every made jump lies inside, at the worst grid alignment. A wider window only costs
  trials: a candidate becomes a find only when #16 makes it.
- **D30. A squid climb onto off-field ground** (a tall wall's top) is followed through the top's exits, as the off-hop's
  tops are: nav's edges off it and stepping or dropping off its edge, down to the 20 m `dropMax`. Only a top with no exit
  at all is a WARN (a hiding place).
- **D31. Movers.** #1 FAILs a kit piece standing in a mover's swept volume (`movers.js` `sweepRect`, and
  `G.match.stage.sweeps()`); #15 FAILs a weir whose 3 m room it crosses. A Gate or Pond trigger in one FAILs #1 too.
- **D32. Every FAIL with a place carries a flag** (#2–#6, #11, #12 as well as #7). A route-ratio FAIL is flagged at the
  leg's far end. `-flag-<n>` draws a flagged move from → to with an arrow and its gain in the caption.
- **D33. When a move the field lacks is a find.** SPEC: "D differs by more than 10 m". The checker: the move lands more
  than 10 m nearer a Gate, in its own direction (D23), **and** that gain beats the move's own length by more than
  10 − 3.8 = 6.2 m (`SAVE_FIND`). Into a ring, a move is an entrance when it saves more than 3 m (`CK.entGroup`) on the
  field's own way in.
  - **Why:** inside SPEC's windows (≤ 3.8 m flat) the second condition follows from the first, so nothing changes there.
    The windows now reach 8 m for the kid and 16 m for the swimmer (D29). A long run-and-jump off a deck onto floor 6 m
    out gains as much D as the drop and walk the field already has, and is no shortcut.
  - **What it costs:** lockgate's two boat-frame jumps (10.8 / 12.5 m in review 2, at (±20.5, 1.08, ±38.5)) are not
    finds under it: each saves less than 6.2 m over its own length. Under SPEC's literal words they would be.
  - **TELL THE LEAD.** Choose between SPEC's literal 10 m and this. The switch is one constant.

New in fix round 3 (review 3):

- **D34. #16's second mover is the carrier swimming in its own ink** (§0, issue 2). It is tried only when the kid fails
  and the takeoff's floor takes ink (`inkFloor`: a paintable face right under the node). The ink is written into the
  paint grid only, never splatted, and put back after. Letting go of squid form at the top of the jump is tried for
  rises of 1.4 m or more. A move made only by the swim is marked `(swim-jump)`.
  - **What it costs:** on the real stages most #7d finds are now swim-jumps (§2.3): nantai 4 230 of 4 546, lockgate
    about 1 640 of 1 650 (its lock canal), halyard 1 115 of 2 007. They are real moves for a carrier who inks its
    run-up, but the stage briefs were built on the kid's 1.8 m / 4 m reach.
  - **TELL THE LEAD: choose one.**
    - (a) Keep it. Every barrier and moat beside inkable floor must beat the swim-jump: 2.3 m high, or wider than 8 m
      of air on the level. That is a rebuild brief for every stage.
    - (b) Shorten the carrier's swim-jump in the engine (WP0/WP1). For example, a carrier in the air keeps the squid's
      dry speed rather than its swim speed. The checker's windows follow from the self-test's `reachs` rows: re-run them
      and paste the new table.
    - (c) Judge #7d on the kid alone and report the swim finds as a WARN. The trial already has the switch
      (`o.kidOnly`); one line in the find rule would make it so.

    I have not chosen, because it changes what SPEC §2.4 lets a carrier do. As it stands the checker FAILs on (a).
- **D35. Vaults** (§0, issue 1): node pairs ≤ 3.5 m apart across a waist-high obstacle whose top is at most 2.25 m over
  the higher end, with 1.5 m of air above it and floor under the whole line; at most two per takeoff and one per 1.5 m.
  **The squid tube passes grates and rails**, as `collideBody` lets a squid through them, and never stands on a grate.
- **D36. The rise ceiling is 2.25 m** (`CK.hopHigh[1]`, the vault's top). The swim-jump letting go at the top lands on
  2.2 m and never on 2.25, 2.3, 2.4 or 2.5 m (§0, issue 2). 2.25 is the first rise measured as never made, so ledges
  between 2.2 and 2.25 m are still tried.
- **D37. The clean box's channel** is closed by a 2.6 m rail on its west edge (z 20.4–36), and its pier is widened into a
  bridge over the channel's north end (z 36–44). Review 2's #16 kid jumped the 3 m channel, gaining 14 m round by the
  pier, so the channel had to close; this way it no longer pinches the SE opening (review 3, issue 3). karpbox itself, the
  rules tests' stage, is unchanged.

New in fix round 4 (review 4):

- **D38. Steps off the grid are a #7d probe, wider than the review asked.** 0.3–1.8 m up (the review's 0.3–1.25 m, and
  the field's own hop band 1.25–1.8 m, whose hops join orthogonal neighbours ≤ 1.2 m apart only, so a misaligned ledge
  there was missed the same way) and 0.3–3.4 m down (nav's drop band; the drops the field's gap edges already hold are
  excluded by "no edge"). Every candidate that can matter is tried (12–45 a stage). A made one's cause is **field rule**:
  nav or karpField could hold it as an edge (TELL THE LEAD, WP0).
- **D39. Squid tubes (3–8 m) are judged by D33**, as every move beyond SPEC's windows: a find when it lands > 10 m nearer a
  Gate in its own direction *and* beats its own length by 6.2 m; into a ring an entrance when it saves > 3 m. lowGap
  (≤ 3 m) keeps SPEC's static |ΔD|. What it costs: the review's tidewater tube (−10.5, 0.33, 1.3) → (−10.5, −0.2, 7.3),
  10.3 m over a 6 m tube, saves 4.3 m and is not a find; under SPEC's literal 10 m it would be. The lead's D33 choice
  (one constant, `SAVE_FIND`) decides both. 8 m is my bound: no stage piece has a longer squid-only passage that the
  review or my runs found, and the scan's cost grows with its square.
- **D40. `KARP_SWIM` defaults to `fail`** (`CK.swim`): the strictest reading, the one SPEC §2.4 implies ("kid or squid
  freely") and the one BUILDER.md row 7 already briefs. It stays the lead's D34 to change; the RESULT line always says
  which reading a result was judged under, so a `RESULT ok` under `warn` cannot pass for one under `fail`.
- **D41. The causes.** *layout*: lowGap, squidTube, tallWall, climbOff, highHop, offHop, offGap (only the stage closes
  them; a top off the field is the stage's to make `roof` or give a way down). *field rule*: step, riseGap, longGap,
  vault, longDrop (moves a kid makes inside its measured reach that the field's rules leave out). *swim-jump*: any find
  made only by the swimming carrier (overrides the other two). A squid crawling a tube dry is not the swimming carrier.
- **D42. Waivers by flag group.** One `waive` entry for #7d waives every find of each flag group (one probe and cause
  within a 3 m single-linkage cluster: what one numbered flag shows) that has a find within max(2, `r`) m of its spot,
  of its `probe` if named. Waived finds are counted in the text and the RESULT line, never hidden silently.
- **D43. Eras are read strictly**, as the engine does, and #1 FAILs an `eras` entry no state key matches, and `eras` on a
  `noRetreat` / `carrierBlock` / `noRest` (the engine ignores it there: TELL THE LEAD, SPEC §4.1 promises it).
- **D44. The Gate plinth is square** (one 3.4 m slab, 0.15 m, on a 0.06 m base course), not an octagon: with boxes only
  an octagon is several slabs whose overlaps z-fight unless stepped, and SPEC §4.2 asks only "3.4 m across".
- **D45. #12 compares hashes**, the bake's against the build's (the level's own `layoutLightmap` computes it when no bake
  was loaded, and is put back), and takes a fixture JSON (`o.lightmap`) for the self-test. **x2s plants a reading fault
  by wrapping the field's `fieldAt`**, since stage data cannot make the engine's own reading leak: it proves the sweep's
  FAIL branch and its flags, not that a real leak exists anywhere.

## 4. Online, bots

Nothing crosses the wire:

- the checker is a tool;
- the kit pieces are static level pieces built the same on every screen, from the data, in `layoutFor`;
- `karpKitFx` is local looks;
- `G.match.stage.karpStates()` is a query.

No bot code changed. Bots walk nav, not the carrier graph, so D15 doesn't touch them. The checker's new findings
(rising gaps, off-field jumps, hopped climbs) are measurements, not engine changes.

**[r3]** The swimming carrier's trials write ink straight into the local paint grid of the offscreen check and put it back;
nothing is splatted, recorded or sent. Bots are untouched. The swim-jump's reach (2.2 m up, ~7.4 m of air level)
is something bot carriers could use; that is the bots package's call (karp-bots).

**[r4]** Still nothing crosses the wire: the squid trials write nothing (dry), or ink straight into the local paint grid and put
it back, as the swim trials do; the plinth is two static pieces built the same on every screen from the data.

## 5. Commits and shared files

**By the first builder (2026-10-10):** f9066b54, d076d897, f5d9cfa6, 41b3af85, 67fc76a0, 1fa1d0cf, 8a7bd6ca, da478a62.

**The takeover (2026-10-16 morning):** 6423a8b7, 8f19bfc0, ec272051, 3ecb30b6, e84f4669, cff56eaf, 49894ea9, d7f07321,
3f1ec4a7, 8c19a918, a51212ef. Scratch commits: 4d8e193a, 50ad9e2c, 746fe97e, 4387bed6.

**Fix round 1 (review 1):**

- ef762c16 karpKitFx: the carrierBlock glyph's background is transparent again (issue 5)
- 4cabc0db bazookarp-check (review 1):
  - #7 sees the moves no edge holds: rising gaps and jumps onto off-field ground;
  - kid moves into a ring are #7a entrances;
  - off-field exits by stepping off the edge;
  - climbs of ≤ 1.8 m the kid hops count as hops;
  - #15 is exact;
  - #1 checks the kit footings;
  - the numbered flags, the key and the padded bounds.

  (Issues 1, 2, 3, 4 and 6.)
- 5770f4db bazookarp-check.cjs: the flags printed and in the JSON; the self-test's notFail cases
- 5eb949cb README / karp-stages BUILDER.md: the Mac mini lines and the new rules (issue 8)
- bab228f5 (scratch) JOB-1.sh split into JOB-1 / JOB-2 (issue 8)
- 248405e8 bazookarp-check self-test: 23 more cases, 48 in all (issue 7)
- 98a679a4 bazookarp-check MAP=all table: rising gaps and hopped climbs per stage
- 2591cc21 (scratch) out/kit-carrierblock.jpg re-taken (issue 5)
- ab1e9afc bazookarp-check #7d: one-way moves gain in their own direction (D23)
- 3693a126 bazookarp-check #7d: a jump onto off-field ground needs a real gap (D21)
- 69abedc0 bazookarp-check flags: only flags of one kind merge
- deef4377 bazookarp-check pictures: under 290 KB by quality, then size
- ef4782a5 (scratch) out/: every stage's top-down, halyard's and lockgate's full sets, the self-test's pictures,
  selftest.json
- d5795858 bazookarp-check #7a: a kid's move joins the nearest entrance and never chains two (D22)
- 0398e735 (scratch) out/ on the final checker: MAP=all's top-downs and every stage's JSON, halyard's and lockgate's full
  sets, the self-test's entrance cases re-taken
- a880d442, 68fa97bc (scratch) the report

**Fix round 2 (review 2):**

- 0ba0bded bazookarp-check self-test (review 2): the reviewer's faults as cases before the fixes (x7m*, x7p2, x7p4, x15m,
  x9n, REACH), and the driver checks a case's `also` checks and that its target FAIL carries a flag
- 0cd9479b bazookarp-check fix round 2, committed by fix round 3 from the interrupted fixer's working tree: off-field
  hops from two cells out (D28), the measured windows (D29), squid-climb tops followed (D30), movers (D31),
  `polyPolyDist`, a flag for every FAIL with a place and the move drawn on `-flag-<n>` (D32), D33, the table's
  rising-gap column

**Fix round 3 (review 3):**

- 92b6a972 the self-test box: the channel closed by a 2.6 m rail and the pier widened into a bridge (D37); x7p4 expects
  its real reasons (issue 3)
- c0cd3a3b bazookarp-check: #16's swimming carrier (D34), the vault probe (D35), the squid tube through rails and grates,
  made moves dropping > 2.5 m into a ring as #7c; the table's vault and swim columns (issues 1, 2)
- a536364c the self-test: v5, v5h, rl, rlh, h20, g5, reachs; x8n, x8f, x8u, x8s, x11f, x11w, x11z (issues 1, 2, 4)
- 90e65be9 README / karp-stages BUILDER.md: the swimming carrier, vaults, squid gaps through rails
- **(takeover)** 8695f630 the swimming reach measured to its ceiling: REACH.swim, `hopHigh` and the vault's top 2.25 m,
  the ceiling rows (D36; issue 2)
- **(takeover)** c62b4153 the self-test: x11f's polygon to x 27, x11z's real reason (issue 4)
- **(takeover)** eb1f357e README / BUILDER.md: the swim-jump's measured ceiling
- **(takeover)** 2fdb592d comments on the vault and off-hop probes (no change in behaviour)
- **(takeover)** cdb87475 (scratch) out/ on eb1f357e: MAP=all's top-downs, every stage's JSON, halyard's and lockgate's
  full sets; the self-test's clean set and the new cases' top-downs, selftest.json
- **(takeover)** e1d4ae4a bazookarp-check #7d vaults: the waist line blocked by nav's test or a ray 0.3 / 0.6 m up
  (review 3's calamari crossing; issue 1)
- **(takeover)** 8165118f (scratch) out/ on e1d4ae4a: every stage's JSON and all-stages.json, terraces' / craters' /
  calamari's top-downs, selftest.json (72/72)
- **(takeover)** this report: one `(scratch)` commit after these

**Fix round 4 (review 4):**

- d883e1f6 bazookarp-check: #7d steps off the grid and squid tubes, `KARP_SWIM`, the finds' causes, waivers by flag group,
  eras read strictly and #1's eras rules, #12's hash and fixture, kit pictures (placeholder stages, bazookarpFx hidden),
  the top-down's bold flag moves (issues 1–6)
- 771da54f the self-test: L1t, L2t, L3t, L1tc, T4, g5w, g5o, x7w, x2h, x2s, x12s, x12f, x1e, x1v; x11z by #1 (issues 1–5)
- d488929a the kit: the square plinth, the glyphs apart (issue 6)
- 8c641d3b README / BUILDER.md / bazookarp-data.js header (issues 1–4)
- 73dcbda8 #7d steps: every candidate tried (the cap hid review 4's terraces pair)
- 645c1baa #16: steps also jumped 1.7 / 2.0 m before the face (the terraces pair); a not-made tube's neighbours retried
- 7e9719a6 (scratch) out/ on the final checker; this report, one `(scratch)` commit after it

**Shared files touched** (each hook tagged `[b5-karp-checker]`):

- `src/game/karpField.js`: one condition in the gap scan (D15, the first builder's). It is untouched since.
- `src/game/stageMods.js`: `'karpStates'` in `R_HOOKS`, and `StageRun.karpStates()`.
- `src/main.js`: the import of `KarpKitFx` and one constructor line.
- `src/world/bazookarp-kit.js`: the kit, rewritten (WP0's file); **[r4]** the Gate's plinth two pieces.
- `src/world/bazookarp-data.js`: the `waive` field documented in its header (**[r4]** `probe`, `r`, the flag group; eras).
- `src/fx/karpKitFx.js` (new; **[r1]** one line in `drawNoCarp`; **[r4]** the glyph's place on its edge).
- `docs/STAGE-MODS.md`: the `karpStates` row, and T4 served.
- `tools/botlab/README.md`: the checker, PROBE and the regression set (**[r1]**; **[r3]** the swimming carrier, vaults, squid gaps through rails, the measured ceiling; **[r4]** steps, squid tubes, KARP_SWIM, causes, group waivers).
- New files:
  - `tools/botlab/bazookarp-check.cjs`, `karp-check-page.js`, `karp-check-box.js` and `karp-check-states.js`;
  - `tools/botlab/jobs/batch5/karp-stages/BUILDER.md`.

## 6. Unfinished, uncertain

- **[r4] D34 and D33 are still the lead's.** The checker now runs either way (`KARP_SWIM`, `SAVE_FIND`) and says which;
  it defaults to the strictest reading (`fail`), so every stage still FAILs #7 on the swim-jump until the lead decides
  or the stages are built against it.
- **[r4] A squid tube is a straight line.** A bent crawlspace with no straight 0.6 m-high line through it, or one longer
  than 8 m, is not seen; the squid steers straight at the far node.
- **[r4] x2s plants its reading fault in code** (the data can't): the sweep's FAIL branch is proven, a real leak is not
  shown to be caught by a stage case. **#12's freshness** is proven on a fixture: no stage has a `.bazookarp` bake yet.
- **[r4] The plinth is square** (D44). If the lead wants the octagon back, it needs a single-piece shape the level
  can't build from boxes, or stepped pieces again.
- **[r4] This branch's bazookarpFx (WP1a's placeholder) still stands the curtain across the walking direction**; WP2's
  rebuild (st-b5-karp-face) has it right, and replaces this file at integration.
- **[r4] The top-downs are still busy where the swim-jump floods** (lockgate's canal: hundreds of medium-magenta lines
  under the bold flag arrows). The flags and their key read; fainter group lines would be a one-line change in
  `pictures()` if the lead wants it.
- **[r4] Steps and tubes are tried from fixed run-ups and timings**, like every #16 move. The terraces pair needed a
  1.6 m-early jump to be made; a step that needs another line could still read as not made (craters has 14 such).
- **The field itself still lacks these moves** (TELL THE LEAD, WP0). The checker finds and FAILs them; the engine does
  not read them:
  - rising gaps and jumps onto off-field ground;
  - hop edges where nav already has a climb edge, and on-field hops whose ledge face misses the grid (review 2);
  - **[r3] vaults over low walls and rails, and squid gaps through rails and grates**;
  - **[r3] the swimming carrier's reach** (about twice the kid's, up to 2.2 m);
  - **[r4] steps whose face misses the 1 m grid** (nav joins neighbour cells only), and squid tubes beyond 3 m.

  A carrier who makes one of these reads the far side at once, which the continuity clamp may reject. A carrier on an
  off-field top keeps its last value.
- **[r3] The swim-jump's 2.2 m is measured on the carrier only** (9.44 m/s). A player without the Bazookarp swims at
  11.8 m/s with the same jump velocity. It should reach at least as high and further, but that is not measured. If the
  lead wants the game-wide number, it is one more REACH run without `carry`.
- **[r3] The vault probe tries a pruned set:** at most two candidates per takeoff (the best gains) and one per 1.5 m of
  the same place. A wall is tried where it gains most, not at every node along it. The squid gap counts as an entrance
  only when it saves more than 3 m on the field's own way in (D33).
- **[r3] The swimming carrier swims only from floor that takes ink**, inked straight in its own colour. It doesn't model
  half-inked run-ups or an enemy's ink in the way. It is the best case, which is the right case for a shortcut check.
- **Moves worth 10 m or less, not into a ring, are not tried.** They could not change a verdict; the table counts them.
- **An off-field top's exits are not proved physically.** The kid proves the jump onto the top. An exit is a step or
  drop off its edge with a clear waist line, which only a rail at waist height would stop.
- **D23 and D33 read SPEC's "differs by more than 10 m"** as the move's own direction, beating its own length by 6.2 m.
  The lead may want SPEC's literal \|ΔD\| back (§3).
- **Halyard's boat finds are real moves**, a yacht's deck bridging a slip, but they are many. For WP4b: `roof` boat
  tops, a carrierBlock, or a waiver.
- **#16 tries a fixed set of moves.** It steers straight at the far node from fixed run-ups with fixed jump timings. A
  move that needs another line could read as not made. A builder should run `PROBE=` on a listed edge before pasting its
  hopVeto.
- **COMMON.md was changed in this worktree, not by me** (uncommitted: "THE MAC MINI IS BACK", 2026-10-16). My task says
  the Mac mini is unavailable and to push nothing, so everything ran locally and the file is left as I found it. JOB-1 /
  JOB-2 (committed, not pushed) are ready for the runner once the lead pushes `botlab-b5-karp-checker`.
- **The 60 ms field budget is still unmeasured on a quiet machine** (JOB-1). karpField is untouched since the first
  builder.
- **The gimmick stages have no states yet on this base.** The generic state path is proved only with the test module
  and karpbox's test state.
- **A `-flag-<n>` camera can stand behind an occluder.** Review 3 saw it on lockgate (the flag numbers changed since):
  a camera behind the bridge's arch, the move's "from" end drawn over brickwork. The arrow, ends and caption are right; the scene is not readable. The
  camera does not search for a clear view.
- **The kit's look was judged from pictures only, with no lightmap.** **[r4]** The plinth and the glyphs are changed
  (§0, issue 6); WP2 owns the moving parts.
