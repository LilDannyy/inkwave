# JOB-1 — batch 5 "deploy": the full regression set + Tower Command bot matches (branch botlab-b5-deploy)

`git fetch fork && git checkout botlab-b5-deploy && git pull` (or `git fetch origin botlab-b5-deploy` — whichever remote
is the LilDannyy fork in your clone), caffeinate, SLOTS=3. Results → `tools/botlab/jobs/batch5/deploy/results/JOB-1.txt`
on botlab-b5-deploy (commit + push). (~45–60 min)

What changed: enemy fire of every kind hurts Hop Beacons / Twirl Sprinklers / Skitter Bombs / the Surf N' Turf buoy
(src/game/deployables.js); the tower crushes sprinklers, beacons, Drip Curtains and buoys in its way; every placed /
stuck device rides any moving floor (tower, railcars, pods) and is lifted / shoved by moving blocks like the buoy; bots
walk up to enemy devices and shoot them (src/game/deployables-bots.js). Shared files touched: subs.js, weapons.js,
specials.js, sp-surf.js, tower.js, bots.js, botSpecials.js, actor.js, config.js, kits/*.js.

Run once, from the repo root:

```bash
LOG=.botlab/b5-deploy-j1 MATCHES="halyard calamari treehills saltpan" SLOTS=3 PAR=3 tools/botlab/jobs/batch5/deploy/regress.sh 2>&1 | tee .botlab/b5-deploy-j1.txt
```

It runs (in this order): 17 page tests three at a time (deployables ×4 configs, sub-tweaks, sub-tweaks2, sub-scale, surf,
surf-movers ×3, tower-rules, tower-ink, bot-specials ×2, movers, pods), then sfx-cues and audio-pause ALONE, then six
two-client tests (net-deploy, net-deploy tower scene, net-surf, net-surf tower scene, net-practice, net-turf), then four
full Tower Command bot matches (tower-match.cjs, one per stage).

Put the whole printed output (it is already compact: a `== name: RESULT n/m k FAIL` line per test with its FAIL lines;
per match its `==` summary line, its `DEPLOY` line, FRAME ERRORS / CONSOLE lines) into the results file. Do not paste
raw logs. If a test fails, add the first 40 lines of its log from `.botlab/b5-deploy-j1/<name>.log` that are FAIL /
error lines (`grep -E '^FAIL|Error|WATCHDOG' … | head -40`). If Electron dies at boot, rerun that one test once.
