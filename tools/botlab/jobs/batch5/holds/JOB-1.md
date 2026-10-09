# JOB-1 — batch 5 `holds`: both hands on the brush, the roller, the blaster and the brolly (branch botlab-b5-holds)

`git fetch && git checkout botlab-b5-holds && git pull`, caffeinate, SLOTS=3. Results →
`tools/botlab/jobs/batch5/holds/results/JOB-1.txt` on botlab-b5-holds (commit + push).

What changed: src/game/character.js only (the pose layers: the four weapons keep the off hand on them in every
state, the dances included). Nothing in the sim, the netcode or the bots' brains.

## 1. Regressions + the holds test ×3 (~15 min)

```bash
SLOTS=3 PAR=3 REP=3 tools/botlab/jobs/batch5/holds/regress.sh
```

It runs, three at a time: `holds` (tools/botlab/tests/holds.js) three times, `world-build`, `hud-lead` (turf, zones,
tower), `input-swim`, `loadout-picker`; then `net-mock` alone; then three 90 s all-bot matches (the four weapons
mirrored on Halyard turf and Crossmarket zones, the default loadouts on Calamari). Put its whole output (compact: one
`==` line per run, its FAIL lines, the matches' `by weapon` / `CONSOLE` / `FRAME ERRORS` lines) in the results file.
If anything FAILs, add the first 40 lines of that run's log from `.botlab/b5-holds-regress/<name>.log`.
