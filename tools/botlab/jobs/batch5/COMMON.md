# Batch 5: standing orders for every builder and reviewer (read all of this first)

This folder is scratch. It is never merged into a PR. `REQUEST.md` next to this file is the user's request, verbatim:
your work package is judged against the user's own words there, not against a paraphrase.

INKWAVE is a Splatoon-style 4v4 ink shooter: three.js ES modules, no build step, an Electron desktop app plus a web
build, online private rooms (`docs/NET.md`), bots, four modes so far (Turf War, Zone Control, Tower Command, Boss
Battle). Read `README.md`, `tools/botlab/README.md` and the docs your package touches before you write code.

## Who is who
- **The lead** (overseeing this batch) wrote your instructions and will judge your result: the diff, the tests, the
  pictures. An independent reviewer checks your work before the lead does. A claim without proof (a test that ran, a
  picture, a number) counts as not done. Expect to be told to redo things; say plainly what is unfinished or uncertain.
- **The user** plays this game with friends, online, on the build you produce. They notice feel, looks and bots.
- **Other builders** work in parallel in other worktrees on the same shared files.

## Engineering rules
1. **Work only in your own worktree** (the path in your instructions). Use absolute paths. `node_modules` is a symlink.
2. **Fit the code that is there.** Find how the nearest existing feature does it (records, ghosts, HUD hints, bot hooks,
   tests) and follow that. New main / sub weapons are self-registering kit modules in `src/game/kits/`; specials register
   through `registerSpecial` in `src/game/specials.js` (see `sp-surf.js`, `sp-drainbow.js`).
3. **Keep shared-file edits small.** Put the bulk in new modules; make hook-ins in the big shared files (`config.js`,
   `specials.js`, `subs.js`, `bots.js`, `hud.js`, `menus.js`, `netmatch.js`, `main.js`, `actor.js`) short and tagged
   with a comment `[b5-<your key>]`, so the integrator can merge several builders' work.
4. **Append-only orders.** `SUB_ORDER`, `SPECIAL_ORDER`, `WEAPON_ORDER`, stage and mode lists that online records index
   into only ever grow at the END.
5. **Online is not optional.** Whatever you add must behave in an online room on every screen: the owner simulates, the
   others replay from records; damage is judged where the victim is authoritative. Update `docs/NET.md`. A two-client
   test (`tools/botlab/netpage.cjs`, see `net-surf.cjs`, `net-practice.cjs`) is part of the proof whenever something new
   crosses the wire.
6. **Bots are players too.** They must use what you add and cope with it used against them (`bots.js`, `botSpecials.js`,
   `botSight.js`), without wall-hacks.
7. **Everything a player needs to know is on screen:** HUD hints, icons (SVG glyphs in the existing style), names,
   blurbs, the loadout pickers, "Can't use" feedback. Sounds are synthesized in code (`src/audio/`); no audio files.
8. **No regressions in the other modes, the menus, or the desktop / web builds.**

## Proof you owe
- A page test in `tools/botlab/tests/` that checks every rule in your package (and fails without your change), plus the
  regressions your instructions list. Fix or report flaky checks; never loosen a check to hide a real problem.
- Pictures (JPEG, under 300 KB each) in `tools/botlab/jobs/batch5/<your key>/out/`, committed in separate commits whose
  message starts with `(scratch)`. Look at your own pictures before you claim something looks right.
- Balance numbers from bot matches where your change can swing balance (the Mac mini runs them, below).

## Running things
**Locally (this Mac is shared with about eight other builders and the user):**
- Electron ONLY through `tools/botlab/run.sh`, always with
  `BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3` (one global lock: you may wait for a slot).
  One instance at a time, for quick single checks and pictures while you iterate. Give page tests `WATCHDOG=900000`
  and Bash calls a timeout up to 600000 ms.
- If Electron dies at boot (network service crash), repeat that Bash call with `dangerouslyDisableSandbox: true`.
- Never run `npm start`. Never touch `/Users/danielosling/Desktop/1/inkwave` or any `dist/` (the user's own app, often
  open). Never kill a process you did not start. Never use the deployed relay or the user's live trycloudflare link:
  online tests use the local relay the harness starts.
- Audio tests (`sfx-cues`, `audio-pause`) only pass when run alone.

**On the Mac mini (about 5× faster; the user wants it used for everything heavy):** an autonomous runner there watches
the fork and runs job scripts from your scratch branch by itself, with no Claude session involved, so it keeps working
through usage limits. This is the protocol (it replaced the older "message the helper" one on 2026-10-04):
1. Write a job script `tools/botlab/jobs/batch5/<your key>/JOB-<n>.sh` (plain bash; the folder name must equal your
   key). Its first lines are comments the runner reads:
   - `# kind: tests` (page tests, online tests, a few matches for errors: these run first) or `# kind: balance`;
   - optionally `# after: JOB-<m>` (wait for that job's result on your branch);
   - optionally `# push: tools/botlab/jobs/batch5/<your key>/out/*.jpg` (up to 20 files, each ≤ 1 MB, only under your
     `out/` folder, are committed back with the results: this is how you get pictures made on the Mac mini).
2. The script runs with cwd = the repo root of your branch's head, and may rely on these env vars: `BOTLAB_OUT` (the
   lock and profile dir: leave it as is), `SLOTS=3`, `PAR=3`, `JOB_OUT` (a fresh dir for this job: write compact
   `*.txt` summaries there, their first 150 lines come back), `JOB_KEY`, `JOB_N`, `JOB_SHA`, `JOB_BRANCH`.
   **Do not set a job-wide `OUT`**: `match.cjs`, `page.cjs` and `netpage.cjs` read `OUT` as their own output path;
   pass `OUT=` per command when you want one. Run up to 3 things in parallel inside your script (the lock allows 3).
   Print clear lines: the runner keeps lines matching `== `, `### `, `RESULT`, `FAIL`, `HARNESS`, `WATCHDOG`,
   `CONSOLE`, `FRAME ERRORS`, `FAILED`, `SUMMARY`, lines starting with `#`, and the log's last 15 lines.
3. The runner refuses a script whose non-comment lines mention `sudo`, `launchctl`, `crontab`, `ssh`, `scp`, `curl`,
   `wget`, `git push`, `osascript`, `killall`, `pkill`, `defaults write`, `networksetup`, `security `, `rm -rf` on a
   home or root path, `inkwave-host`, `cloudflared` or `selfhost`. A job has 3 hours; one job runs at a time across
   all builders, so keep jobs focused and split long ones.
4. Commit the script and `git push fork HEAD:botlab-b5-<your key>` (only that branch name; never force; before any
   later push, `git fetch fork botlab-b5-<your key>` and merge it, because results are pushed onto it). Never write
   under `results/` yourself. A script that already ran is never re-run, even if you edit it: use a new `<n>`.
5. Within about 90 s the runner picks it up. The result arrives as
   `tools/botlab/jobs/batch5/<your key>/results/JOB-<n>.raw.txt` on your branch (head sha, exit code, wall time, the
   kept lines, your `$JOB_OUT/*.txt`), on success, failure or timeout alike. Poll with
   `git fetch fork botlab-b5-<your key> && git show fork/botlab-b5-<your key>:tools/botlab/jobs/batch5/<your key>/results/JOB-<n>.raw.txt`
   every 4–5 minutes and keep working meanwhile. If it seems missing, look at the branch `botlab-b5-<your key>-results`.
6. Send it: every regression batch, every repeat-for-flakiness run, lightmap bakes, picture sets you do not need
   instantly, and balance sets. **Balance sets are capped tonight at 8 matches per mode and config** (summed over the
   stages); the lead runs one consolidated balance pass after integration. Keep local only what you need to iterate.
7. You do not need to message anyone. (A Claude session on the Mac mini, "Inkwave botlab helper", adds a written
   `JOB-<n>.txt` when it is awake; do not wait for it.)

## Git
- Commit as you go: `git -c user.name=LilDannyy -c user.email=94884334+LilDannyy@users.noreply.github.com commit`,
  messages ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never commit `.botlab/`, profiles or audio files. Push nothing except your `botlab-b5-<key>` scratch branch. Never
  touch `new-stages`, `inkwave-1.2` or any PR.

## Your final message
1. What you built, rule by rule against the user's words, with the numbers you chose and why.
2. Every decision you made where the request left a gap (the lead will tell the user).
3. Online behaviour (records added, who judges what). Bots.
4. Tests and their results (local and Mac mini), pictures (file names), balance numbers.
5. Commits (hashes), the shared files you touched and where, for the integrator.
6. What is unfinished, flaky or uncertain. Do not hide it.
