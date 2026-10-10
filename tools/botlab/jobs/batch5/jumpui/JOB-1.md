# JOB-1 — jumpui: the package's tests ×3 and its regressions (branch botlab-b5-jumpui)

`git fetch fork && git checkout botlab-b5-jumpui && git pull` (or the equivalent on your clone of the fork), caffeinate,
SLOTS=3. Results → `tools/botlab/jobs/batch5/jumpui/results/JOB-1.txt` on botlab-b5-jumpui (commit + push). (~25 min)

What changed: super-jump alerts ("NAME is jumping to you!"), named landing tags with a countdown ring (world view,
minimap, TAB map), Ink Jet / Zipline return marks named and counted down, the remote super jump's target / flight on
every screen (`src/game/jumpMarks.js`, `src/ui/hud-jumps.js`, small hooks in actor.js / netmatch.js / hud.js /
diorama.js / specials.js).

```bash
REP=3 SLOTS=3 PAR=3 LOG=.botlab/jumpui-j1 tools/botlab/jobs/batch5/jumpui/regress.sh
```

That runs, in this order: `jump-ui` ×3 (testbox turf) and once in zones, `hud-lead` (turf / zones / tower),
`map-reveal`, `input-swim`, `bot-specials` (3 at a time); then `sfx-cues` ALONE; then online one at a time:
`net-jump-ui` ×3, `net-practice`, `net-turf`.

Into the results file: the script's whole output (one `== name: RESULT n/m k FAIL` line per test plus its FAIL lines;
no raw logs), and a first line with the commit you ran at and a one-line verdict. If a test fails, add the 30 lines of
its log around the first FAIL (`.botlab/jumpui-j1/<name>.log`).
