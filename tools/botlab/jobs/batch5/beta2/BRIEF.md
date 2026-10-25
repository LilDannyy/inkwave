# Batch 5 — beta round 2 (the lead's brief; written 2026-10-25, to run after the reset of 2026-10-30)

Everything here is PLAYABLE and shipped under the PUBLIC BETA badge (DECISIONS #33). This round closes what the reviews,
the Mac mini and the issue logs left open, then the acceptance reviews decide the tags. Read COMMON.md first; the rules
there stand (run.sh, SLOTS=3, the Mac mini runner, git identity, never the user's app or dist/, no audio files).

## 0. First: the issue logs
- Pull the desktop log (`~/Library/Application Support/INKWAVE/issues.log`, if the user played) and the hosted log
  (`issues.log` beside the site root on the Mac mini); summarise with `node tools/botlab/issues-summary.cjs <log>`; every
  class of row becomes an item below or is closed with a reason.

## 1. Bluestone Junction (BETA; art shipped at new-stages c0864291; acceptance = review 4)
- Review 4: the Opus reviewer with `tools/botlab/stage-sweep.cjs` in every era, day and dusk, against the Halyard bar;
  the real-jump looks (eras-look (i)), ink the loudest colour after a REAL jump, the cards. Pass → remove `beta: true`.
- The ~400 ms UNMEASURED stall around the settle (JOB-16 / 21 / 25 / 32: render 0.1 ms, nothing compiled, both codes,
  1 run in 3–5): find it (a GC pause from the jump's allocations? a texture or lightmap first bound? the lightmap swap? the
  main thread blocked by the audio or the net?) with a long-task observer and a heap snapshot across the window; fix or
  rule.
- Load-time warm-up (fix round 3): measure with `tools/botlab/first-frames-cold.sh`; ~0.9 s of GPU + a gl.finish per
  Bluestone load, and once per time of day in the menu backdrop — slice it over frames or do it behind the loading screen
  only; never in the menu.
- Not re-run at the final code (JOB-34 on the Mac mini at c0864291): net-eras + lagged, the GPU gate by method C per era
  day / dusk, perf6 ×3, eras-world / eras-hud / eras-modes, first-frames-cold.
- net-eras 13/14: 2 of 368 Iron Bridge cells differ on the two screens after a flip, the same 2 every try (deterministic):
  reconcile splats that land inside the flip window (host-authoritative paint for cells touched during the flip, or hold
  the guest's splats until the flip's paint is applied).
- Bots slow onto jump 1's new ground (2/8 within 30 s; review 3): `_pickPaintGoal` drawing from `E.fresh` for 30 s after
  done, measured on the Mac mini (reach ≥ 6/8 within 30 s without hurting turf outcomes).
- Stuck episodes from the desktop log: turf 60 s at the 120 s jump; zones roller 13 s — reproduce with the log's seeds.
- Minor art: the 3000s shop names read softer than TODAY's; the 45-word atlas grid is full (grow it before adding a sign);
  eras-look (h) flaked once under load (22/255 at the see-through window's edge); the main jump's own front frame is
  49–52 ms on a loaded Mac (31–37 on the Mac mini) and predates the art.
- Batch 6 list (CUT from batch 5, not beta): DESIGN §3.10 the end-of-match beat (the Professor), the timetabled tram.

## 2. Highmark Foundry (BETA; art by Antigravity, under independent review)
- The reviewer's JSON (`stages/caldera/LEAD-REVIEW-ART.json`) → Antigravity's rounds → acceptance; pass → remove `beta: true`.
- Engine minors carried from the lava reviews: tower stuck 1.5–2.4 %; boss camp 1/30; squid overshoot at LOW; push-off on
  the Tide Boards; "no lightmap for caldera" rows in the desktop log (the bake must ship for every variant; check the
  packaged app loads `assets/lightmaps/caldera*.json`).
- First-frame hitches 300–4899 ms from the desktop log: measure per stage with first-frames-cold; the worst are loads, not play.

## 3. Gulper Aquarium (accepted; not beta)
- Exit camping sample (the lead's open question): 10 matches on the Mac mini, count splats within 3 m of each tube exit in
  the 2 s after an exit; act only if one exit exceeds twice the others.
- Great Tank sand-bed entry (open item from int3).

## 4. Bazookarp (mode BETA)
- karp-bots B(b2) 2.83–2.88 m regression (WP3): find the commit, restore ≥ 3.0 m.
- Long stuck: halyard karp grabber; refill stands 4–8 s.
- karpKitFx warm (first use compiles); the bot-escape rows in the issue log.
- Reference layouts (Codex, WP4b): the lead's reviewer against SPEC §9 and the stage rules, then the 14 per-stage layouts
  (karp-stages/BUILDER.md); the bots' balance pass (SPEC §9.1) on the Mac mini.

## 4b. The menu and loads (both stages, pre-existing)
- A hitch ~2.6 s after the menu appears on a cold boot: one ~100 ms frame and one ~67 ms frame, on Halyard as on Bluestone,
  day and dusk (JOB-34). Find what runs there (an audio decode? the stage-art cards? the env map?) and move it or slice it.
- Bluestone's cold load is 2.9 s against Halyard's 2.3 s (warm-up 636 vs 122 ms): accepted; measure a live time-of-day change
  in the open menu (not measured in JOB-34) and slice the warm-up if it hitches.

## 5. The flaky set (Mac mini, ×10 each, before anything is called fixed)
bot-specials, eras-jump frames, karp-bots C / H, net-eras, lava-karp, 2-client net-karp, the isolated sfx-cues run.

## 6. Order
0 → 1 (review 4 first; it decides whether the rest of 1 is beta work or polish) → 2 (as Antigravity delivers) → 4 → 3 → 5.
