#!/bin/bash
# kind: tests
# batch5 holds JOB-6: the full regression set on the final head (after the Tidal Slam landing fix; JOB-5 ran the head before it) (the autonomous runner's protocol): the holds test ×3,
# world-build, hud-lead (turf / zones / tower), input-swim, loadout-picker (three at a time); net-mock; net-holds (roller +
# brolly, brush + blaster); three 90 s all-bot matches (the four mirrored on Halyard turf and Crossmarket zones, the
# default loadouts on Calamari). Summary → $JOB_OUT/summary.txt; the first 40 lines of any failing run → fails.txt.
set -u
echo "### holds JOB-6 at $(git rev-parse --short HEAD)"
LOG="$JOB_OUT/logs" REP=3 tools/botlab/jobs/batch5/holds/regress.sh | tee "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/logs/*.log; do
  if grep -q '^FAIL' "$f"; then echo "--- $(basename "$f")"; head -40 "$f" | cut -c1-400; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines"
