# Highmark Foundry: the lava engine (the Bellows' breath) — after fix round 4

The lava is a registry stage module (key `lava`). Fix round 4 answers the engine's fourth review (`LEAD-REVIEW.json`,
verdict REDO: two major issues — an escape death in the lava-bots gate, rule 44 — and five minor ones). There is no new
lead note for this round (`LEAD-NOTES.md` is round 3's), so each issue is worked as the review's own fix list asks; rule
44's decision stays the lead's. **Takeover:** the worktree held no commit after the review and no uncommitted work of a
previous fixer (only the lead's COMMON.md edit "the Mac mini is back", left uncommitted as before); I started from
7738a878. My instructions say the Mac mini is unavailable and push nothing: every run is local, one Electron of mine at a
time under the shared SLOTS=3 lock (BOTLAB_OUT=inkwave-upstream/.botlab), WATCHDOG=900000. Nothing is pushed.

Worktree /Users/danielosling/Desktop/1/st-b5-caldera, branch b5-stage-caldera. Review 4 ran at 7738a878 (code 5b42e5bf).
**Final code 17578ed4** (only the report's scratch commit after it). Runs, probes and logs: the session scratchpad
`cf5/` (`status.txt` lists every run with its code state; `logs/`; the probes `probe-*.js`).

## 0. Review 4's issues: each one, what was done, the proof

### 1 (major). The lava-bots gate failed on an escape death off Race 7 — FIXED; the gate met twice at the final code

**What happened** (the review's trail read against the geometry, `probe-geo`): the escape's next node (−16.5, 1.25, 2.5)
is **a node of race7 itself** (its HIGH pose, y 1.25). In the rise the stone's top was 0.6 m lower, so the escape read its
own stone's node as a step up and ran straight at it (guards off) along the stone's edge beside the island's coping, then
at the coping beyond. Three faults killed it:
- **a)** rider nodes were read at their pose's height, not where the rider is now (lava.js `botAct`);
- **b)** presses the hop guards refused still burned the jump cool-down (0.6–1.0 s each), so the escaper's own asks waited
  (no J in the trail for 0.6 s at a time) (bots.js `_tail`);
- **c)** pressed against the face at a slant, actor.js keeps the run speed along a face it is pushed into (5.7 m/s along +z
  while the move pointed +x); the hop was judged by the ballistic arc along that slide (`_hopSafe`), off the stone's end,
  and refused.

**Fixed** (df33ceab; the step became a shared helper in cf429792):
- lava.js: an escaper reads a rider node at the rider's **current top** (`ry`); pressed against the step's face it hops
  **straight across the face**, to the top 1 m in (`_escHop`); its ask names that spot (`b.hopAt`).
- bots.js `[b5-caldera]`: `hopAt` — a module's ask is judged by the flight steered at its spot (`_hopLands`) and flown
  there; `_jRef` — an ask goes ahead whatever cool-down a **refused** press left (refusals are retried each frame, still
  checked); an escaper's **route** hop near the lava is judged by its flight at the node too (cf429792: it was judged along
  its velocity and flown at the node — this round's own lava.js run caught it: F8b, two escapers off stones hopped at an
  Organ top across the lake and drowned).
- **The 6 m/s step off the 1.3 m coping** that the review asked about is no guard miss: no jump / squid / fire in the trail;
  the fight walked it off the coping's west edge onto race7, which had surfaced 0.05 s before — solid and rising, floor to
  every guard (the momentum look-ahead lands on its top) — and it landed on it. It died 1.5 s later, in the escape (a–c).
- **Zipline** (the review's other fight-death source): bots.js `_zipDry` — a bot zips only where the tether's line (every
  2 m), its end and, for a wall, the let-go's landing fan (1.5–6 m out, ±45°) stay off what the stage calls wet within 4 s
  (the stage's `wet` only: zips on other stages are as they were).

**Proof:**
- `probe-esc`: escapers on every stone node within 2.6 m of race1 / 5 / 6 / 7's ends, the stone 0.45–0.8 m under the step,
  run in at ±40° at 5.5 m/s with a refused press's cool-down, charger / roller / shooter — 324 cases: **HEAD 59 died;
  fixed 0 died, 0 stuck** (two runs).
- lava.js **F8c** (new): the same at t 39.6 / 40.4, 72 cases: **HEAD 18 died + 28 not up; fixed 0 / 0**. **F8d** (new):
  the Zipline from the island, the same aims at LOW and in the rise warning — 8 of 154 refused only in the warning, 129 still
  allowed. **F8b** gained case C (asked while escaping): 12 / 12.
- **The gate** (lava-bots.js, 20 trials × 6 bots per scenario = 360 bot-trials a run; the lead's: 0 escape deaths and ≤ 1
  fight death per 360, twice in a row):

| run | code | escape | fight | gate |
|---|---|---|---|---|
| A, B | 28f957b1 | 0, 0 | 0, 1 (stones, 78 s: a spinner in paint mode swam off a ledge's lip 1.8 s after it dried, 35 m from its stone) | pass, pass |
| C, D | 958d24a3 | 0, 0 | 0, 0 | pass, pass |
| E, F | 14cb2709 | 0, 0 | 1 (edges: a shooter at the north head's lake-corner notch — see "found" below), 0 | pass, pass |
| **G, H** | **17578ed4 (final)** | **0, 0** | **0, 0** | **pass, pass** |

### 2 (major). Rule 44 — the audit made whole; DESIGN §3.5 rewritten with the true numbers; the decision is the lead's

- lava-audit.js (37df2755): **every gap-march sample past a 0.35 m seam is tried physically** (a run, then a swim out of own
  ink, then the real Dash Pellet on the rise / apex / fall) and counts in the gates; a flight over lava that lands **> 1 m
  off its line is counted** (flagged `off`, its gain from where it landed). `PAGE_ARGS full=1` prints every crossing.
- Run at df33ceab (the stage has not changed since): **plain running jumps 822 at LOW** (754 over gaps < 4.4 m, 46
  off-line; 572 save ≤ 5 m, 230 5–10 m, **20 10–20 m, none > 20 — the most 12.5 m**; 94 places) and **1,244 at HIGH**
  (1,172 short, 52 off; 931 / 291 / **22** / 0 — **the most 19.3 m**: the East Pool's deck-stair corner, (13.5, 1.1, −6.5)
  across 3.5 m of lava); swim / dash **1,716 at LOW (801 save > 20 m, 243 > 40, the most 56.9)** and **2,021 at HIGH (254 >
  20, 39 > 40, the most 52.6)**. This matches the reviewer's probe (710 / 1,152 short + 28 / 48 off-line).
- DESIGN §3.5 (bcfd5198, scratch): "the narrowest level gap is 4.5 m" struck (shores come within 0.4 m); the table, the
  running places saving > 10 m, the skill areas saving > 20 m, why the round-3 decision cannot pass, and the options with the
  true numbers — **option 1 passes every running crossing, narrowly (19.3 m against the 20 m bar; the next 17.3, then ≤
  12.5)**; the one place over 15 m (HIGH only) is a local fix if the lead wants margin.
- **For Bazookarp checker #16:** `out/fix4/rule44-crossings.json` — every crossing at LOW and HIGH (take-off, heading, gap,
  kind, off-line, landing, floor, gain).
- Both rule-44 checks still fail: **not built — the lead decides** (no geometry changed this round).

### 3 (minor). Bazookarp's drop spots on drowned ledges in the fall warning — FIXED

- bazookarp.js `_dynOk` `[b5-caldera]` (c0a76eda): on a liquid stage (from its first `lava:warn`) the stage's `danger`
  counts at all times — the lava's is a floor it covers within 10 s. The field still switches at `lava:warn` (SPEC §5.5).
- lava-karp.js **K3b** (new): from the fall warning until the ledges dry, 60 ledge-level origins at 6 times — **0 drop
  spots on covered ground**; a real drop 1 s into the warning rests at (−25.5, 1.3, −2.5). **With the fix held off (`_liq`
  forced false): 30 of 60 covered at 70.5 / 71 / 74 / 79 s — K3b fails (8/9).** lava-karp **9/9** (14cb2709).
- A one-line `bazookarp.js` change: for the int4 integrator (tagged).

### 4 (minor). The four bot matches — FIXED: 2 Turf War + 2 Zone Control at the final code, every check passes

What held bots, found with trails (`probe-look`: all bots bows or chargers, the first surge from the pads, rows every
0.25 s; `lava-match.js` now records what a bot was doing in every ≥ 4 s stuck episode, `why`):
- **The claimants** — (i) a hop that fell back after the waypoint advance had passed the hop's node left a route whose next
  edge was a *walk* 1.05 m over its feet (6 s at Organ A~'s foot; another under the Horn Step's lip); (ii) at a column it
  asked to hop only after its walk stalled 0.3 s — never while a bow drew in a duel — and the edge guard stopped it 3.3 m off
  Organ B's node (the seam reads as lava): 2 s per column; (iii) on enemy ink at a column's foot whose shots missed its feet,
  one 1.5 s of inking, then refused hops (10.75 s in a Zone Control match); (iv) the team's only long-range kit claimed
  first, was splatted, and the claim stayed with a blaster for good (3 of 6 matches with one long-range kit had no
  long-range lookout time).
- **Fixed** (cf429792, 958d24a3, 17578ed4): the claimant's column hop is the escape's step (`_stepUp`: straight at the node,
  asked at once and every frame, judged by its flight even with the guards off — bots.js `hopCheck` — across the face when
  pressed) within 2.4 m, or 3.5 m where its line is floor up to the seam; a route whose next waypoint stands > 0.9 m over its
  feet on a walk edge is planned again; on enemy ink it inks 1.5 s in every 2.5 s; a claimant that makes no 0.6 m in 5 s on
  its way up lets the claim go (passed over 15 s, `lookStalls`); a mid-range claimant not yet up hands the claim to a free
  long-range kit of its team. Probes: every claimant that lived got up (44.6–50.6 s), hops 0.25–0.75 s; with both feet
  painted in enemy ink at 40 s, claimants up in 4 of 4 runs (painted once) and 1 of 2 (re-painted every 2 s).
- **The refill stalls** (the review's 11.25 s on the Lakefront corner; 13.5 s on a lookout's top here): a bot at its refill
  patch, too dry to paint (< 3 %) and with no own ink to step onto, stood for the kid's slow refill (9 / s). bots.js
  (7fb282e0): it looks elsewhere for 6 s, that patch excluded; lava.js: a claimant refilling on the lookout's top holds it
  on purpose (`perchUntil`, as when not refilling).
- lava-match.js (14cb2709): the lookout check applies when the match has a long-range kit; with none (twins / shooters /
  brollies / blades: lookouts held 47 / 67 s by mid-range claimants) it says so and passes.

| match (lava-match.js, all bots) | code | lava | sea | stuck % (longest) | at the stones ≥ 2 s | stone steps | Slump crossings | lookout s A / B (long-range) | checks |
|---|---|---|---|---|---|---|---|---|---|
| Turf War 1 | 17578ed4 | 0 | 0 | 0.03 | 0 | 1 | 8 | 0 / 15.6 (0 / 15.2) | **7/7** |
| Zone Control 1 | 17578ed4 | 0 | 0 | 0.18 | 0 | 0 | 0 | 26.0 / 41.2 (26.0 / 41.2) | **7/7** |
| Turf War 2 | 17578ed4 | 0 | 0 | 0.02 | 0 | 0 | 6 | 26.3 / 0 (26.3 / 0) | **7/7** |
| Zone Control 2 | 17578ed4 | 0 | 0 | 0.35 | 0 | 1 | 2 | 2.7 / 77.9 (2.7 / 0) | **7/7** |
| Tower Command | 17578ed4 | 0 | 0 | 0.52 (4 s, the Lower Surge Steps) | 0 | 0 | 0 | 5.5 / 16.6 (5.5 / 16.6) | **7/7** |

The sets before it, for the record: 28f957b1 3 of 4 all-pass (Zone Control: the claimant 10.75 s on enemy ink, iii);
958d24a3 3 of 4 (Zone Control: 13.5 s refilling on the lookout, and no long-range kit at all); 14cb2709 1 of 4 (two Turf
Wars whose only long-range kit died, iv; **a lava death in Zone Control at the north head's lake-corner notch** — below);
Bazookarp 5:00 at 14cb2709 7/7. 0 sea falls in all 18.

### 5 (minor). The tests — FIXED

- net-lava (760b96df): the live guest's grid after the Practice painting is judged on the lava cells (exact), as the
  results-screen check is; its other cells are reported (`guestOtherCellsDiffer`); the late joiner's imported grid stays
  exact and whole. **13/13** (28f957b1: lava cells 0 differ for both; whole grids 0 / 0).
- G5 (lava.js): **p90 ≤ 1.5 ms and max ≤ 5 ms**, each step its better of two passes, both from LOW. Doing so found that
  the first timed step had been a whole HIGH → LOW redraw (the pass began at HIGH: 9 ms in one run). Final: median 0.2–0.3,
  p90 0.3–1.1, max 0.3–1.1 ms.

### 6 (minor). The boss camping on one Lakefront wedge — IMPROVED (roamAfter stages only); boss-check 3 in a row

- bossBrain.js (d37b4c2c, 6dd86944): the camp spot is 8 m round (5 m was left every few seconds by its own charges); every
  further 12 s there counts again; from the second count its goals favour the far side and the other half (+0.5 / m to
  30 m, +8 across z = 0, its fight distance × 0.3) and it walks there before its next move (≤ 8 s); never a goal where it
  can't turn round (6 of 8 headings); wedged — no 1 m in 6 s of trying to walk — it backs out for 1.5 s.
- boss-check.js prints the seconds on each half, the longest spell within 6 m and the back-outs. At the final boss code:
  **6/6, 6/6, 6/6** — 64 / 91 / 103 m; halves 120 / 0, 48 / 72, 36 / 84; longest spells 84 / 36 / 28 s. Before the wedge
  rules one run in three failed (46 m: into the tip of the west Lakefront wedge, 70 s there).
- **Not solved:** it can still spend most of a round on Alpha's west Lakefront (84 s, 6 back-outs in one run) — BossNav's
  long body in the wedges; that run passed the roam bar (64 m).

### 7 (minor). The lavafall's slits — FIXED; the void named

- lavaFx.js (734425aa): the pour direction at a vertex two lip segments share is their mean, eased along each segment: one
  continuous curtain. `out/fix4/fix4-eng-lavafall-{low,high,side-low,side-high}.jpg` (looked at: no slits; the round-3
  `out/engine/eng-lavafall-*` are the before). A band of finer streaks where the curtain's rows meet, mid-height, is in both
  sets: the shader's, for the art phase.
- The open blue void the falls pour into and behind them is listed under Not built (the far scenery).

### Found this round, not fixed: pinches beside the Pumice stones (ENGINE rule 21)

- ENGINE rule 21 (every gap beside a rider is a seam ≤ 0.3 m or open lava ≥ 2.5 m) was never audited. lava-audit.js now does
  (03e5a411: each stone's outline at HIGH every 0.25 m, marched straight out) and **it fails: 18 samples at three places per
  half** — race5's west side at the north head's lake corner (0.95–1.25 m of lava between the stone and the 1.4 m coping),
  race1's end by the south head / the Lakefront (0.7–1.3 m), race6 by the north head (2.4 m). The 14cb2709 Zone Control
  death (a paint-mode bot carried across the coping at 4.8 m/s, stopped by its air guard over the notch, fell in) and
  lava-bots run E's fight death (its twin) were both in race5's notch. A player can drop into it too.
- The fix is stage geometry (close each to a 0.25 m seam — the coping out to the stone, or the stone in — or open it past
  2.5 m), with the nav links, rule 44 / 45 / 46 and the matches re-run: **for the lead; not built this round.** lava-audit
  is **38/41** (rule 21, rule 44 × 2).

## 1. What the lava is, rule by rule (unchanged this round)

**The level**: one horizontal surface over the region (the lake, both Spillways, both Slump bays), LOW −0.6, HIGH +0.8,
a pure function of the shared stage clock (lavaCore `lavaSchedule` / `lavaAt`), each move 10 s on a smoothstep (peak
0.21 m/s) after a 10 s warning; the region fitted at load (one half, turned) as a 0.25 m mask with two proximity channels.
**Schedules**: Turf War 3:00 rises 35 / 110, falls 70 / 140; 1:30 rise 30, fall 55; Zone Control, Tower Command,
Bazookarp 35 / 125 / 215 up, 80 / 170 / 260 down; every match ends at LOW (Turf War ≥ 25 s), nothing moves in the first
30 s or the last 12 s; overtime holds; Practice 20 / 35 / 35, the menu backdrop 8 / 15 / 15; Boss Battle held LOW.
**Notice**: ledges deadly 13.8 s after the rise warning, dry 16.2 s after the fall warning. **Touching lava kills** (cause
`lava`, the attacker credited within 4 s); covered floors' colliders off; no ink under the surface; the burn on the
furthest stage time reached; the Pumice Races (solid exactly while the shelf is deadly), the Organ Pipes (tops linear in L,
one hop apart); devices swept (through b5-int3's `crushIn`, the kits' devices included); shots, bombs and thrown subs
fizzle; super jumps redirected; every channel announces rise and fall as opposites (Surge Gauge, sounds, the chip,
callouts, the personal line from the feet, the minimap, the rind, embers up / steam down). The lavafall is one curtain.

## 2. Decisions where the request left a gap

1. **No new lead note**: each issue worked as review 4's fix list asks; rule 44's decision and the rule-21 geometry left to
   the lead.
2. **Escapes keep their unchecked hop** with the guards off (a straight run at a step, validated in F7 / F8c and the gate);
   the claimant's column hop is checked (`hopCheck`) — no lava at its heels, so a wasted hop is the worse risk.
3. **The Zipline check reads only the stage's `wet`** (the lava), not the sea round other stages: bots' zips elsewhere are
   unchanged.
4. **Bazookarp**: the field still switches at `lava:warn` (SPEC §5.5); the drop / rest spot reads the stage's `danger`
   instead of switching later.
5. **net-lava's live guest** is judged on the lava cells as the results-screen check is (the lead's round-3 rule); the late
   joiner's whole grid stays exact.
6. **The lookout check** applies only to a match that has a long-range kit (lava.js's LOOKOUT_KINDS).
7. **The boss's roam rules** are opt-ins of `layout.boss.roamAfter` (Highmark only); the blocked-walk detour of round 3
   stays the only shared change.
8. **The refill fallback** (look elsewhere when too dry to paint and no own ink to step onto) is in the shared brain: it
   only acts in that case, on every stage.

## 3. Online and bots

**Online**: no new record. The curtain is built per screen from the layout; the Bazookarp change is the host's drop / rest
choice, sent as before (`d` / `m` records); the bots' changes run where the bots run (offline, or the host); karpStates,
the lava's clock and the level are as round 3. net-lava 13/13.

**Bots** (they know what the HUD shows): round 3's footing, flights and guards, plus this round — a rider's node read at the
rider's current top; the step up (`_stepUp`) for escapes and claimants, its hop across the face when pressed against it,
its ask naming its spot (`hopAt`) and judged by the flight steered there; refused presses cost no cool-down; an escaper's
route hop judged by its flight; Zipline zips kept off the lava; the claimant's replan after a fallen hop, its ink cycle,
stall release and hand-back to a long-range kit; the refill fallback. Bots never jump over the lava (no nav links).

## 4. Tests, pictures, balance

Final code 17578ed4 unless a line says otherwise; local, one Electron of mine at a time:
- **lava.js 59/59** (F8b case C, F8c, F8d new; G5 p90 / max). **lava-audit.js 38/41** (03e5a411 = 14cb2709 + the audit) —
  every rule passes but rule 21 (new, the pinches) and rule 44's two gates; rule 45 PASS (1,120 outline texels, 0 bad,
  `fitTwin`).
- **lava-bots.js** G 0 / 360, H 0 / 360 — the gate twice (and A–F before it, table §0.1).
- **Bot matches**: 2 Turf War + 2 Zone Control + Tower Command, every check 7/7, 0 lava, 0 sea (§0.4).
- **lava-karp.js 9/9** (14cb2709). **net-lava.cjs 13/13** (28f957b1). **boss-check.js** 6/6 × 3 (958d24a3, the final boss
  code). **check-maps** (WIPSTAGES=1): caldera / .zones / .tower / .practice 1,735 pieces, .bazookarp 1,759, .boss 1,630 — ok.
- **The shared bots.js on other stages** (one Turf War each at 14cb2709, + A/B on Tidewater against 7738a878): Treehills stuck
  0.1 % (the reviewer: 1.2 / 0.1 / 0.2 head, 0.7 / 0.2 base); Tidewater head 0 / 0 / 0 % vs base 0.3 / 0.2 % (one run at
  958d24a3 had 1.2 %, two 8–9 s episodes of a blade bot in paint mode: not in the next three); 0 sea falls, 0 frame errors,
  0 console lines everywhere.
- Probes (scratch): probe-esc (324 kicked escapes: HEAD 59 deaths, fixed 0), probe-zip, probe-look (bows / chargers / enemy
  ink at the feet), probe-boss-tip, probe-notch (180 runs at the notch: 0 deaths — the trap needs the match's exact
  carry; the audit names the place), lava-karp no-fix (K3b 30 / 60).

**Pictures**: `out/fix4/fix4-eng-lavafall-{low,high,side-low,side-high}.jpg` (new); the round-3 `out/engine/eng-*` set
stands for everything else (no other visual source changed). Balance sets: none (the lead's consolidated pass); Slump
crossings in the final matches 8, 0, 6, 2, 0 (for the balance pass).

## 5. Commits and shared files

Round 4: df33ceab, 37df2755, c0a76eda, 734425aa, cf429792, 760b96df, 21732ea8, d37b4c2c, 6dd86944, 958d24a3, 7fb282e0,
14cb2709, 03e5a411, 17578ed4; scratch: bcfd5198 (DESIGN §3.5 + the crossing list), 6a402c62 (pictures), 28f957b1 (DESIGN
§4.5), and this report's.

**Shared files** (all tagged `[b5-caldera]`):
- `src/game/bots.js` — `_tail`: `hopAt` / `hopCheck` / `_jRef`, the escaper's route hop by `_hopLands`; `_zipDry` (the
  Zipline case of `_specialCtl`); the refill fallback (`_refillBad`, `_pickRefill`).
- `src/game/bazookarp.js` — `_dynOk` (`_liq`) and its `lava:warn` listener: two lines, for int4.
- `src/boss/bossBrain.js` — `_roam` (8 m spot, recount, `_reloc`), `_pickGoal` (far / other half, turnable goals), `_walk`
  (back-out); all behind `layout.boss.roamAfter`. `tools/botlab/jobs/stretch/boss-check.js` — the halves line.
- Module: `src/game/lava.js` (`_stepUp`, `_lineFloor`, `ry`, the claimant changes), `src/fx/lavaFx.js` (`_cascades`).
- Docs: `docs/STAGE-MODS.md` (a module's bot fields; Bazookarp and `danger`); DESIGN.md §3.5 / §4.5 (scratch).
- Tests: lava.js, lava-audit.js (rules 21, 44), lava-karp.js (K3b), lava-match.js (`why`, the lookout check), net-lava.cjs,
  lava-eng-scenes.js (`only=`).

**For the integrator (int4):** round 3's notes stand (`hud.karpDock` undefined, the chip under `.iw-kst`; the Carp Field
should start in `stateOf('low')` on Highmark — a Bazookarp line; karpField's `sweptBox` and bobber-bots' boss guard).
New: bazookarp.js's `_liq` (two tagged lines); bots.js's `hopAt` / `hopCheck` are generic stage-module fields (STAGE-MODS).

## 6. Unfinished, flaky or uncertain

- **Rule 44**: not built — the lead decides between DESIGN §3.5's options (option 1 passes every running crossing at 19.3 m).
- **Rule 21 (new audit, fails)**: three pinches per half beside race5, race1 and race6; one bot death in 18 matches and one
  fight death in 8 gate runs came from race5's. Stage geometry, for the lead.
- **The boss** can still spend most of a round on Alpha's west Lakefront (84 s in one run, passing at 64 m).
- **Fight deaths in lava-bots** remain possible (1 in 360 in two of eight runs): a squid off a just-dried ledge's lip, the
  rule-21 notch. The escape class is closed (0 in 2,880 bot-trials this round).
- **The lookout's long-range time** depends on the loadout and on the claimant living: the probes and the last six matches
  pass; a match with one long-range kit that dies twice can still end without it.
- Not built (unchanged): the stones' chains, the pig beds' glow, the Bellows Vent plume, the red under-light, **the far
  scenery (the void the lavafall pours into)**; the lightmap bake with the lava. The Organ Pipes still look blockout-plain.
- The harness profiles run at quality 'low'; the picture scenes rebuild the particles as at 'high'.

## Module API (for the art phase)

**Registration.** `registerStageMod({ key: 'lava', order: 20, worldAs: 'lavaWorld', matchAs: 'lava', liquid: true, world:
LavaWorld, match: StageLava })`, active when `LAYOUT.lava` exists (`low`, `high`, `region`, `falls`, `timing`,
`schedule`, `mirror`, `riders`, `steps`, `gauges` (may carry `onlyIn` / `notIn`), `cascades`, `vents`, `flotsam`,
`look`, `text`).

**Pure core** (lavaCore.js): `LAVA`, `lavaSchedule`, `lavaAt`, `lavaY`, `lavaMax`, `crossTime`, `stoneRel`, `riderTop`,
`expandLava`, `partPose`, `inRider`, `pointInPoly`.

**World** (`G.lavaWorld`): `inRegion`, `fallsIn`, `box`, `mask` (`fitAdded`, `fitTwin`, `fitTwinChanged`), `map`,
`uniforms`, `drown`, `floorY`, `riders`, `navMeta { kind, shutY, rider, pose, top, escD, exit, safe, safeD, reach }`,
`proxAt(x, z, y)`, `proxMs`, `look`.

**Match** (`match.lava`): state `clock`, `y`, `st`, `tMax`, `burnY`, `state()`, `stats { deaths, byTeam, warned, burned,
devices, fizzles, lookout, lookTeam, lookLong, lookClaims, lookHold, lookLog, lookStalls, lookReplans, stoneSteps, … }`;
queries `surfaceAt`, `liquidY`, `under`, `covers`, `wet`, `burns`, `noPlace`, `danger`, `inkClip`, `restMask`,
`karpStates`, `maxOver`, `yAt`, `_foot(a)`; tests `debugT(t)` and `?lava=low|high|rise|fall`.

**Registry hooks served:** update, seek, dispose, kill, fallCause, superJumpLanding, noPush, navEdge, navNode,
goalWeight, beforePath, botHold, botAct, wet, under, fizzle, liquidY, noPlace, restMask, karpStates, danger, sweeps,
splatTime, onSplat, drawMap, hud, state. **Bot fields it sets**: `stageUrgent`, `guardOff`, `_needJump` with `hopAt`,
`hopCheck` (fix round 4).

**Events:** `lava:warn`, `lava:move`, `lava:rest`, `lava:hold`, `lava:set`, `lava:rider`, `device:down` (how `lava` /
`crush`), `shake`; cause `lava`. **Sounds:** lava_rumble, lava_erupt, lava_hiss, lava_drain, lava_sizzle, lava_pop,
lava_lock, lava_tick, lava_bell, lava_siren_up, lava_siren_down, lava_whistle.

**Stage layout keys for Boss Battle:** `boss.maxRise`, `boss.roamAfter` (fix round 4: the 8 m spot, the recount, the far /
other-half goals, the walk before the next move, turnable goals, the back-out) — BossNav / BossBrain, any stage.

## For the art phase

- **Palette** (`LOOK` in lavaFx.js): crust #3b1f1a / #4a2219; seams #a3121a → #e0301e → (#ff7a1e, dropped for hot inks)
  → #fff0c8; lavafalls #ff8a1e / #ffc84a; rind (0.82, 0.80, 0.76) linear; basalt #646870 / #73777e; pumice #bdb8ae /
  #8f8a80; needle #c8202a; beacons #ff1206 / #f4f6ff; fizzles #ff7424 sparks / #5e524c ash.
- **Keep the region's surfaces at sRGB luminance ≥ 0.35** (rule 38; lava-audit.js checks it).
- **The region is fitted at load** against the layout's blocks (one half, turned): re-run lava-audit (rules 21, 44, 45)
  after the art. **Anything that changes the lake's shores or the copings by the stones changes rules 21 and 44.**
- **Boss Battle has no Surge Gauge**: a boss-mode landmark must stand outside the boss's 2.9 m wall clearance on the island
  and causeways; the terraces and stairs are not its ground (`maxRise`).
- **Lavafalls**: one continuous curtain now (`out/fix4/fix4-eng-lavafall-*`); a band of finer streaks where its rows meet;
  the void behind and below it needs the far scenery.
- **Not built**: the chains, the pig beds' glow, the Bellows Vent plume, the red under-light; the far scenery; the Organs'
  look. **Lightmap**: none baked for any caldera variant yet.
