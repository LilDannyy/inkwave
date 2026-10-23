# Highmark Foundry: the lava engine — fix round 5 (after review 5)

Worktree /Users/danielosling/Desktop/1/st-b5-caldera, branch b5-stage-caldera. **Merged new-stages 632398c3** (the
shipped PUBLIC BETA) first: a fast-forward (it already held this branch), no conflicts; the uncommitted COMMON.md edit in
the worktree was byte-identical to new-stages' and was dropped for it. Then check-maps for every caldera variant (ok) and
the stage's own page test — which **failed after the merge** (two causes, both fixed first, below). Every run local, one
Electron of mine at a time under the shared SLOTS=3 lock (BOTLAB_OUT=inkwave-upstream/.botlab), WATCHDOG=900000. Nothing
pushed (so no Mac mini jobs). The reviewer's probe files of review 5 (`cal-rev5/`) were gone from /tmp (cleaned
2026-10-22): its probe-notch5b is rebuilt as a committed test, `tools/botlab/tests/lava-notch.js`.

## 0. Found at the start, fixed first

1. **The PUBLIC BETA's issue log throws on Highmark Foundry in the desktop build** (src/core/issueLog.js, new in the beta).
   Every row carries `lava: m.lava.state` — on this stage a *method* (`StageLava.state()`); the desktop build sends rows over
   IPC (`inkwaveNative.issue` → `ipcRenderer.send`), which cannot clone a function, so **every row threw**: inside
   `Game._frame` for a bot stuck 5 s or a slow frame, and inside every `console.warn` / `console.error` (the wrapper throws
   before the real call). lava.js died on it at boot (HARNESS "An object could not be cloned"). Fixed (39efb4c7, tagged):
   the row logs the lava's phase ('low' | 'rise' | 'high' | 'fall'), and a row IPC cannot clone is sent as its JSON — the
   log never throws into its caller. **For the lead / integrator: the shipped beta has this bug on Highmark in the desktop
   app; this commit is the hotfix.** (int4's "Caldera … 1 / 1 / 1 warning/error lines" may be it.)
2. **lava.js F8 parked three idle bots inside the gauge deck** (x −12…−5.4, z −0.6…6.6, 1.2–2.4). b5-int3's collideBody (in
   the merge) no longer pushes a body out through a top more than a step over its feet: they went down through the island
   into the lava and F8 failed. The test parks them on the deck's top (x −8). lava.js 59/59.

## 1. The list, in its order, each with its proof

### 1. Rule 44 — decided again: option 1, with margin — DONE

- **The margin.** The three running crossings over 15 m (19.26 m from (±13.5, 1.1, ∓6.5), 17.27 m from (±14.5, 1.4,
  ∓5.5), both onto the deck stair's corner, and 17.29 m from the pocket beside the deck stair onto race 7~) were **one nav
  hole, not a shortcut**: the gauge deck's corner stands 0.85 m from the lava's edge at each deck stair, no 1 m grid
  cell's centre fell on the copings there, so every nav route from the East Pool's coping to the deck stair's foot went
  over the deck (23.7 m, and 24.5 m from the pocket to race 7~). A kid walks it in **4.1 m** and **7.4 m** (probe-walk:
  the real physics through the corner, both halves). Pulling back or kerbing the corner would not have changed that
  measure, so the fix is the hole: `LavaWorld.navEdges` serves the layout's new `lava.walks` (nav walk links between two
  static floors the grid misses, both ways, twins turned) — one round each deck's corner (d0759240). Nav now 5.4 / 7.7 m;
  those crossings save under 1 m; bots can use the passage.
- **Rule 44 at the final geometry** (the Race kerbs below included): plain running jumps **752 at LOW, 1,161 at HIGH, the
  largest 12.5 m** (LOW: the Lakefront's coping and the deck's socket notch onto the causeway; HIGH: the same and the
  causeway onto Organ A, 12.1) — none over 15 m (the margin met), none over 20 (the gate). Swim / dash: 1,732 at LOW (817
  save > 20 m, the most 56.9) and 2,019 at HIGH (202 > 20, 4 > 40, the most 40.8; was 248 / 37 / 52.6 before the walk
  link). **lava-audit's two rule-44 gates rewritten** (5dc1d0bf): running ≤ 20 m is the gate (the largest and the 15 m
  margin printed); swim / dash is an information row, no gate.
- **DESIGN §3.5** (5f77c0bf, scratch): the decision, the numbers, the East Pool corner explained, the options kept for the
  record. **out/fix5/rule44-crossings.json** (4f57d742, scratch): every crossing at the final geometry, the fix4 format.
- **The Bazookarp handoff — the carrier field never relies on a jump over the lava** (583ca969, a512192c): karpField adds
  hop / gap edges (1.2–3.0 m over "open air") and the lava read as open air: **422 such edges crossed it**. Now
  `LAYOUT.bazookarp.hopVeto = karpVeto.js`: (a) every hop / gap pair crossing the lava where both ends stand (over the lake
  and the Spillways at every level, or at HIGH between two dry ends) — 192 pairs, Alpha's frame (the field adds each turn;
  3 edges the field builds on Bravo's half only are listed turned); 44 that end on drowning floor are kept (the HIGH state
  masks that end; at LOW they are real moves); (b) the 75 pairs checker #16 proved no carrying kid makes (as built and at
  LOW: 124 of 150 were gaps from Organ L's HIGH-pose top down to its own LOW-pose top, 16 hops Organ B LOW → HIGH: pose
  pairs). **lava-karp.js K8** (new) checks the field has no lava-crossing edge left and prints the entries to paste when
  the nav moves: **10/10**. Field: hops 36 → 18, gaps 686 → 198; L 57.3 → 58.1 m.
  **Bazookarp checker on caldera after it (OUT scratch, ~9 min):** #16 **OK** as built and at LOW (216 / 216 made; it was
  150 not made); at HIGH 48 not made — every one an edge onto drowning floor that the HIGH state masks (the checker tries
  them anyway: a checker question, below). Still failing, not on this list: **#7** (7 / 6 entrances into each Gate's 15 m
  ring; #7d finds by cause layout / field / swim 6 / 85 / 462 as built), **#12** (no lightmap for caldera.bazookarp).
  **Note for the lead:** "a Bazookarp carrier cannot make them" holds for dash jumps (no subs while carrying) but not for
  swim jumps — SPEC §2.4 lets the carrier swim its own ink at 9.44 m/s, and the checker (swim=fail) counts its swim-jumps
  over the lava among #7d's finds.

### 2. Rule 21 — the notches closed — DONE

- **The Race kerbs** (172484d4, layout.js `raceKerb`): copings in each stone's own frame, their face **0.2 m** from the stone
  (a seam it rises and sinks past), into the bank behind; both halves (mirrored). Race 1 west: the south head's wedge out to
  the stone (top 1.5, over its 1.1–1.4 copings) and on along the stone, short of the shelf's lake edge, to 0.2 m from race
  2's end (1.2) — a kerb that stopped at the wedge left a 1.9 m notch at race 2's end instead (races 2 / 4 stand 0.9 m
  further west); race 1 south-east: the head's corner past its tip coping (1.2); race 5 west: the north head's wedge (1.5)
  and on to race 4 (1.2); race 6: north of its west end under the rim's curve (1.1). Tops 0.1 off every coping they
  overlap (check-maps' z-fight rule), ≥ HIGH + 0.3 (rule 6). The step links are untouched.
- **Proof:** lava-audit rule 21 **0 pinches** (was 18); rules 14, 22, 25, 38, 44, 45, 46 pass. **lava-notch.js** (new;
  the reviewer's probe rebuilt): at HIGH every outline sample with a static top within 2.5 m — 134 samples, walking (0.5),
  running (1.0) and swimming off toward the top, and walking back on: **670 trials, 0 deaths**; controls (2 s on each of 14
  stones; stone → stone across every seam, both Races, both halves) all alive. **Teeth:** `nokerb=1` (the kerbs not solid)
  → **40 deaths, all in the gaps** (race 1: 7 + 7, race 5: 10 + 10, race 6: 3 + 3). lava-bots.js once: **7/7, 0 escape and
  0 fight deaths in 360 bot-trials.** Matches below. check-maps: caldera / .zones / .tower / .practice 1,747 pieces,
  .bazookarp 1,809, .boss 1,642 — ok.

### 3. The boss — DONE (and two more traps found on the way)

- `layout.boss.noGo: [[−20.5, −25.5, 3.5], [20.5, 25.5, 3.5]]` (bossNav.js, tagged): the west Lakefront wedge tips are
  never a goal (`randomPoint`) or a path's anchor (`nearestPlan`); the cells stay its ground (817.5 m²).
- The five-in-a-row then failed on other spots, each traced (probe-bossrun: a 0.5 s trail of the longest spell):
  **both causeways' feet** (95 s and 88 s): a leg string-pulled 0.3 m short of the plan's clearance cut the corner where
  the causeway's foot meets the lake (1.55 m from it); its body stopped fitting; **every 1 cm step was refused because the
  pose it stood in did not fit either**, though a pose 0.6 m on did (probe: 6 of 8 headings never left in 25 s); and the
  **tongue along the terrace face at the Moorings' east end** (88 s: cells it can't turn round in). Fixed on `roamAfter`
  stages only (Highmark): legs keep the plan's full clearance (slack 0); goals and anchors only where it can turn round
  (≥ 6 of 8 headings — the "clearance test on the cell" review 5 named; noGo cells too); off its plan or in such a cell it
  walks to the path's first cell first; out of a pose that doesn't fit, a step need only keep the turn's rule (a387c49c).
  Every stage without those keys runs the same code paths as before.
- **boss-check: 10 in a row 6/6** (two sets of 5): walked 85–192 m, 14–20 cells of 4 m, the longest spell 21–42 s,
  back-outs 0–1, halves e.g. 82 / 38, 60 / 60, 113 / 7. (On the way: 3 of 15 boss-check runs failed, 69–95 s, each traced and fixed above.)
  A Halyard boss-check (one run, a sanity run of the shared files) read 29 m walked: Halyard has neither key, so none of
  this round's code runs there; not investigated further.

### 4. lava.js F10 — DONE

- `_lookAct`: the foot wait's own time-out (5637d9c8): from the moment the lookout is climbable (its HIGH-pose nodes open),
  a claimant whose goal is still the climb's foot has found no way up in its 0.8 s re-plans; after **6 s** the claim goes
  and it is passed over 15 s (log `foot-timeout`, `stats.lookFootOuts`). F10 keeps each claimant's trail every 0.5 s (mode,
  route to foot / top, its length and step, footing, up, top open, foot wait) and prints it for a team never up.
- **lava.js 59/59 three runs in a row** at that code (claimants up at 50.2 / 50.2, — / 51.3, 50.7 / 51.4 s; foot-outs 0)
  and a fourth at the final code. **probe-footwait:** a claimant at its foot whose every plan up fails (`_pathTo` stubbed)
  lets the claim go at 56.1 s ('foot-timeout', 6.1 s after the top opened); with its plans working it is up at 51.8 s.

### 5. The lavafall — DONE (the band's cause was not a row seam)

- **The band** was the *other half's* lavafall, seen from out past the lip through the void under the arena and through
  this half's curtain (transparent, no depth write, one merged mesh). Proof (diagnostic stills): with every other mesh
  hidden the band stayed; with depthWrite on it vanished. lavaFx.js (5fd94773): each curtain is its own mesh, writes depth,
  and the one nearer the camera draws first, so one never shows through the other — both the eng view and its mirror
  are clean. (A first try that re-mapped the curtain's UVs to metres did not touch the band and was reverted.)
- **Rule 42 viewpoints** (8c8e8b33): the Spillway Bridge's middle and bay-side end and the Horn Step, both halves. **Rule
  42 now FAILS from the bridge: 62 of 1,152 rays** — looking out through the breach just under the horizon (pitch −0.05 /
  −0.14, headings ~255–330°) they meet nothing: the stage has no far scenery (`buildBackdrop` returns nothing). The Horn Step
  sees none. By the lead's list the far scenery is the art phase's; the check now catches the gap from where a player
  stands. lava-audit at the final code: **38/39** (only rule 42).

### 6. Tests and docs — DONE

- net-lava.cjs: the live guest's non-lava cells bounded again, ratio ≥ 0.999 (192544c9). **Not run** — see §6.
- lava-match.js: the lookout line says "NOT APPLICABLE: no long-range kit in this match, passed for want of one" when so
  (7ece450b). In this round's four matches it applied every time (each had a long-range kit).
- STAGE-MODS.md: the botAct row's `b.hopCheck`, and the lava's `navEdges` walks (7ece450b).

## 2. Decisions where the list left a gap

1. **Rule 44's margin by the nav, not by geometry**: the > 15 m readings were a nav hole (a 4.1 m walk read as 23.7 m);
   closing the hole is the honest fix and helps bots. The deck stair's corner still overhangs the pool by 0.37 m (a running
   jump onto it now saves < 1 m).
2. **The carrier's veto list**: the 44 edges onto drowning floor are kept (masked at HIGH, real at LOW); a static list can't
   be per-state. The 75 #16 pairs added because the field must not hold moves no kid makes (the SPEC's own workflow).
3. **Kerb tops** 1.1–1.5, each 0.1 off what it overlaps (check-maps), all over HIGH + 0.3; 0.2 m seams (0.25 sat on the
   audit's 0.3 m float edge).
4. **The boss**: the review asked for one wedge; the 5-in-a-row asked for three more fixes. All behind Highmark's own
   layout keys.
5. **The lavafall**: the depth / draw-order fix instead of a "seam blend" — there was no seam.

## 3. Online and bots

**Online:** no new record. The walk link and the kerbs are layout (every screen builds them); the veto list is the host's
field data; the issue-log fix is per screen. net-lava not run (load). **Bots:** the deck-corner link (a passage they never
had); the kerbs give a dry floor beside races 1, 5, 6 (bots still cross only by the step links); the claimant's foot
time-out; the boss's rules above. lava-bots 0 / 360; 0 lava deaths in all four matches.

## 4. Tests, pictures, balance

Local, final code unless said:

| test | result |
|---|---|
| lava.js | 59/59 × 4 (3 in a row at the F10 code, 1 at the final) |
| lava-audit.js | 38/39 — rules 14, 21, 22, 25, 38, 44, 45, 46 pass; 42 fails (bridge views, far scenery) |
| lava-notch.js (new) | 2/2: 670 trials 0 deaths; teeth (no kerbs) 40 deaths in the gaps |
| lava-bots.js | 7/7: escape 0, fight 0 in 360 |
| lava-karp.js | 10/10 (K8 new) |
| boss-check.js | 6/6 ten in a row |
| probe-footwait / probe-walk / probe-cross | pass / 4.1 and 7.4 m walks / the three crossings traced |
| Bazookarp checker (caldera) | as built and LOW: FAIL #7, #12 (#16 OK); HIGH: FAIL #7, #12, #16 (48 onto drowning floor) |
| check-maps | all six caldera variants ok |
| net-lava.cjs | not run (load average 12–54 all session; the rule is < 4) |

| match (lava-match.js) | lava deaths | sea | stuck % (longest) | Slump crossings | stone steps | lookout s A / B (long-range) | lookout check | checks |
|---|---|---|---|---|---|---|---|---|
| Turf War 1 | 0 | 0 | **2.01** (P1 11.75 s, Bravo's Lower Surge Steps' foot (2.7, 1.2, 26.8), paint mode, stick at rest; Drip 7.25 s on a causeway) | 9 | 0 | 17.3 / 9.1 (17.3 / 0) | applies (1 long-range kit) | **6/7** |
| Turf War 2 | 0 | 0 | 0.19 | 4 | 1 | 18.5 / 15.7 (18.5 / 15.7) | applies (3) | 7/7 |
| Zone Control 1 | 0 | 0 | 0.56 (4 s) | 4 | 2 | 70.6 / 25.7 (70.6 / 0) | applies (2) | 7/7 |
| Zone Control 2 | 0 | 0 | 0.36 (2.25 s) | 4 | 3 | 46.4 / 42.4 (46.4 / 0) | applies (1) | 7/7 |

**Pictures** (out/fix5/, 94029f5e): fix5-eng-top-{low,high}, -shelf-{low,warning,rising,high,falling-steam},
-stones-surfacing-{1,2,3}, -race-high, -rise-4-stones-surfacing, -rise-6-drowned, -stain-line-cliff-low,
-hud-stones-sinking (the kerbs: dark copings along races 1 and 5 by the heads, read as copings), -lavafall-{low,high,
side-low,side-high} (no band; the side views still pour into empty sky — the far scenery). Balance: none (the lead's pass).

## 5. Commits and shared files

39efb4c7, 172484d4, d0759240, 5dc1d0bf, 4f57d742 (scratch), 583ca969, 5f77c0bf (scratch), 8c8e8b33, a387c49c, a512192c,
7ce816ac (scratch), 7ece450b, 5637d9c8, 5fd94773, 94029f5e (scratch), 192544c9, and this report's.
**Shared files** (tagged `[b5-caldera]`): `src/core/issueLog.js` (`lavaOf`, the IPC guard — **a beta hotfix**);
`src/boss/bossNav.js` (`noGo`, `goalIds`, `isGoal`, legs' slack on roamAfter stages); `src/boss/bossBrain.js` (`pi` off
the plan, the step out of a bad pose); `docs/STAGE-MODS.md`. Module: `src/game/lava.js` (`navEdges`, the foot time-out),
`src/fx/lavaFx.js` (the curtains). Stage: `src/world/stages/caldera/layout.js` (the Race kerbs, `boss.noGo`, `hopVeto`),
`lava.js` (`walks`), `karpVeto.js` (new). Tests: lava.js (F8 parking, F10 trails), lava-audit.js (rules 42, 44),
lava-karp.js (K8), lava-match.js, net-lava.cjs, lava-notch.js (new).

## 6. Unfinished, flaky or uncertain

- **net-lava.cjs not run**: the load average stayed 12–54 (other builders); its one change is a bound (syntax-checked).
- **Rule 42 fails** from the Spillway Bridge (the far scenery through the breach): the art phase's, now measured.
- **Bazookarp checker**: #7 (Gate-ring entrances, #7d finds incl. the carrier's swim-jumps over the lava) and #12 (no
  lightmap) fail in every state; #16 at HIGH lists the 48 edges onto drowning floor the HIGH state masks — the checker
  tries masked edges (its owner's call, or a per-state veto the field doesn't have).
- **Turf War 1's stuck check failed** (2.01 %: the harness's own player P1 stood 11.75 s at Bravo's Lower Surge Steps'
  foot in paint mode, stick at rest, its next node on the steps 1.7 m away) — not lava (0 lava deaths), not traced; the
  other three matches pass it (0.19–0.56 %). The gate ("0 lava deaths") holds.
- The foot time-out never fired in the four lava.js runs (the probe shows it works).
- Halyard boss-check read 29 m walked in one run; the changed code paths don't run on Halyard (no baseline taken).
- The deck stair's corner still overhangs the East Pool by 0.37 m; the Organ Pipes' look and the far scenery stay the art
  phase's.
