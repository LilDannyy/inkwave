#!/bin/bash
# kind: tests
# after: JOB-1
# batch5 stages JOB-2: the final head (presence for shared blocks, the TAB-map hook, the early hook lists): the
# registry's page and two-client tests ×3 (flakiness), and world-build, movers, pods, net-stageclock, net-practice
# (APP_CSP) and check-maps once more on this head. Summary → $JOB_OUT/summary.txt; failing runs → fails.txt.
set -u
echo "### stages JOB-2 at $(git rev-parse --short HEAD)"
LOG="$JOB_OUT/logs" REP=3 ONLY="stage-mods net-stagemods world-build movers pods net-stageclock net-practice check-maps" tools/botlab/jobs/batch5/stages/regress.sh | tee "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/logs/*.log; do
  if grep -q '^FAIL' "$f"; then echo "--- $(basename "$f")"; head -40 "$f" | cut -c1-400; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines"
