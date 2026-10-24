# int4: the beta integration (a brief for Codex, written by the batch lead, 2026-10-17)

You are integrating INKWAVE's batch 5 onto ONE branch, `b5-int4`, in this worktree (`/Users/danielosling/Desktop/1/st-b5-int4`,
created from `b5-int3`). Work only here. Read `tools/botlab/jobs/batch5/COMMON.md` first (the standing orders: how to
run Electron tests under the shared lock, git identity, what never to touch), then `tools/botlab/jobs/batch5/DECISIONS.md`
(#33 is the rule this integration implements), `docs/STAGE-MODS.md`, `docs/NET.md`, `tools/botlab/README.md`.

## What to merge, in this order (each `--no-ff`, author `LilDannyy <94884334+LilDannyy@users.noreply.github.com>`)
1. `b5-karp-checker` (Bazookarp WP4a: `tools/botlab/bazookarp-check.cjs`, the stage kit, `karp-stages/BUILDER.md`)
2. `b5-karp-face` (WP2: the netcode, HUD, menus, looks, sound of Bazookarp)
3. `b5-karp-bots` (WP3: `src/game/botsKarp.js` and its hooks)
4. `b5-stage-aquarium` (Gulper Aquarium: the stage, `src/game/pipes.js`)
5. `b5-stage-bluestone` (Bluestone Junction: the stage, `src/game/eras.js`)
6. `b5-stage-caldera` (Highmark Foundry: the stage, `src/game/lava.js`; this branch already merged an older `b5-int3`)
Each package's own report is `tools/botlab/jobs/batch5/<key>/LEAD-REPORT.md` on its branch (`git show <branch>:<path>`),
its last review `LEAD-REVIEW.json`, and the lead's decisions `stages/<id>/LEAD-NOTES.md`. Read them before resolving
a conflict in that package's files. Expected conflict points: `src/game/bots.js` (the subs' polish vs `botsKarp` vs
the stages' `[b5-caldera]` / `[b5-eras]` hooks), `src/ui/hud.js` and `menus.js`, `src/game/deployables.js`
(`crushIn`), `src/config.js` (stage entries, PATTERN slots 64–72, `WIP_MODES`), `docs/STAGE-MODS.md` and `docs/NET.md`
(keep every package's section), `src/game/karpField.js` (apply
`tools/botlab/jobs/batch5/bluestone/karp-anyValid.patch` from the bluestone branch, then run `eras-karp.js` part B).
Resolve by understanding both sides; never by dropping one. Say in the report what each conflict was and what you kept.

## Then the user's rule (DECISIONS #33): playable-but-unfinished content is tagged BETA, not hidden
- The three stages (`bluestone`, `aquarium`, `caldera` in `src/config.js` MAPS): replace `wip: true` with `beta: true`.
  A `beta` stage appears in every player-facing stage list (offline stage select, the lobby's stage picker, Random,
  Practice, the results) with the same badge Boss Battle's mode card uses (`src/ui/menus.js` ~1136: `iw-beta`,
  'PUBLIC BETA'; also the lobby ~3678 and the results ~4969): add a small badge on the stage tile and next to the
  stage name in the lobby. Keep `wip` working for a stage that is not playable at all (none today).
- Bazookarp: remove it from `WIP_MODES` (`src/config.js` ~776) and give its mode card `beta: true` like Boss Battle's.
  In Bazookarp a stage with no layout of its own is hidden in that mode's picker (DECISIONS #10; WP2 built this).
- Two decided tweaks from the lead's notes: Gulper Aquarium's pipe exit cooldown 2.5 → 3.5 s (`stages/aquarium/
  LEAD-NOTES.md`, the Mac mini's set), and `tools/botlab/tests/pipes.js` part 'cam' resets `g.settings` to the
  defaults (fov, quality) before the ride check.

## Prove it (Electron only through `tools/botlab/run.sh`, `BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3`, `WATCHDOG=900000`)
- `node build/check-maps.mjs` (every stage, every variant; the three stages in every era / lava state: `ERA=`, `LAVA=`).
- Page tests: `stage-mods`, `world-build`, `pipes`, `pipes-audit`, `eras-world`, `eras-jump`, `eras-modes`, `eras-karp`,
  `lava`, `lava-audit`, `lava-karp`, `bazookarp-rules`, `karp-bots`, `hud-karp`, `int3`, `sub-glide`, `sub-bobber`,
  `sub-sentry`, `sub-dash`, `deployables`, `bot-specials`, `tower-rules`, `loadout-picker`, `sfx-cues` (alone, last).
- Online: `net-karp.cjs` (2 and 3 clients), `net-eras.cjs`, `net-lava.cjs`, `net-pipes.cjs`, `net-stagemods.cjs`,
  `net-lobbykit.cjs`, `net-practice.cjs`.
- `bazookarp-check.cjs` on halyard and lockgate (their first-cut layouts may fail: report, do not fix).
- Bot matches (`tools/botlab/match.cjs`, DIAG=1): each new stage in Turf War, Zone Control and Tower Command; Bazookarp
  (`karp-match.cjs`) on karpbox and halyard; one Turf War on an old stage with every bot on the new subs
  (`SUBS='glide,sentry,bobber,dash,glide,sentry,bobber,dash'`). 0 console errors, 0 frame errors, stuck ≤ 1 %.
- Pictures (JPEG < 300 KB) of the BETA badge on a stage tile, in the lobby, on the Bazookarp mode card and on a results
  screen, in `tools/botlab/jobs/batch5/int4/out/`.
- Thumbnails and builds of the old stages and modes byte-identical to `new-stages` where nothing touches them.

## Rules
- Never run `npm start`; never touch `/Users/danielosling/Desktop/1/inkwave` or any `dist/`; never kill a process
  you did not start; never use the deployed relay or the live trycloudflare link; no audio files; commit nothing under
  `.botlab/`. Push only `b5-int4` to the fork (`git push fork b5-int4`), never `new-stages` or a PR.
- Commit small and often, messages ending with a `Co-Authored-By:` line naming your model.
- Final report in COMMON.md's format to `tools/botlab/jobs/batch5/int4/LEAD-REPORT.md` (the merge log with every
  conflict, every test with its result, the match table, what is still open). The lead reviews it on Friday.

## Known issue to fix on the way (found by the lead's verification of `b5-int3`, 2026-10-17)
In a Turf War with every bot on the new subs (crossmarket, `SUBS='glide,sentry,bobber,dash,…'`), stuck time was 2 %
(bar ≤ 1 %): five episodes of 2.5–6.5 s, every one a bot in paint mode with `path: true, hold: true` standing still
(Moxie / brush at (1.8, 0, −36.1) for 6.5 s; Suki / bucket at (8.2, 0, 31.7) for 5 s): a held sub press (the polish's
hold-fire near an own idle Chain Bobber web, or a Glide cook) that never times out, so the bot waits instead of moving.
Mixed lobbies read 0–0.8 %. Fix: a held press times out (about 1.5 s) and the bot moves on or re-plans; prove it with
the same match reading ≤ 1 % stuck and no `hold: true` episode over 2 s.
Note: `new-stages` is now a9974492 (= b5-int3 merged); start by merging it into `b5-int4` (it only adds the merge commit
and scratch docs on top of what this branch already has).

## Addendum (2026-10-17, the lead): ship as BETA now, and keep an issue log for the lead's later review
The user has decided: package and host this branch as it stands (bugs are acceptable in a PUBLIC BETA), but the
desktop app and the hosted server must each keep a log of issues for review when the lead's usage resets. Build this
before anything else, then commit; the lead merges, packages and hosts straight after.
1. **In the game (shared by both builds):** a small module `src/core/issueLog.js` that collects, with a timestamp,
   the build commit, mode, stage, era / lava state and whether online: every `console.error` / `console.warn` line
   (wrap them), `window.onerror`, `unhandledrejection`, the harness-style FRAME ERRORS (a frame over 250 ms outside
   loading), a bot stuck episode over 5 s, and any `match:end` whose result the screens disagreed on (the net results
   check already detects this). Keep it cheap (a ring buffer of 500 entries, no per-frame allocation), and never log
   room codes, names typed by players or anything personal beyond the player's chosen nickname.
2. **Desktop app:** `electron/main.cjs` writes those entries, appended as JSON lines, to
   `app.getPath('userData')/issues.log` (also forward the renderer's `console-message` events at warning level and
   above there), rotating at 5 MB. Print the path once at start-up in the terminal.
3. **Hosted web build:** `tools/host/selfhost.cjs` accepts `POST /issue` (JSON, ≤ 8 KB, same-origin only, rate
   limited to 20 a minute per IP, no other method change) and appends the entries to `issues.log` next to its site
   root, rotating at 20 MB; the game posts its buffer on each issue (batched, at most once every 10 s) and on
   `beforeunload`. Nothing is sent to any other host.
4. `tools/botlab/issues-summary.cjs`: reads either log and prints a table (count by kind, stage, mode, first and last
   seen, one example line each) so the lead can review a week of play in one screen.
5. Prove it: a page test `issue-log.js` (an error, a warning, a slow frame and a stuck bot each produce one entry with
   the right fields; a hosted POST lands in the file; the rate limit holds), and `net-practice` still passes.
Write what you built and where the logs live into `tools/botlab/jobs/batch5/int4/LEAD-REPORT.md`.
