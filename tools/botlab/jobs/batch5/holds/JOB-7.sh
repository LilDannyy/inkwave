#!/bin/bash
# kind: tests
# batch5 holds JOB-7 (fix round 1: the roll square to its path, HEY! waves, the blaster's dances): the full regression set
# on the fixed head — the holds test ×3 (now with the roll-square and lobby-emote checks), world-build, hud-lead (turf /
# zones / tower), input-swim, loadout-picker (three at a time); net-mock; net-holds (roller + brolly, brush + blaster);
# the lobby line-up's HEY! (lobby-shots.cjs); three 90 s all-bot matches. Summary → $JOB_OUT/summary.txt; the first 40
# lines of any failing run → fails.txt.
set -u
echo "### holds JOB-7 at $(git rev-parse --short HEAD)"
LOG="$JOB_OUT/logs" REP=3 tools/botlab/jobs/batch5/holds/regress.sh | tee "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/logs/*.log; do
  if grep -q '^FAIL' "$f"; then echo "--- $(basename "$f")"; head -40 "$f" | cut -c1-400; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines"
