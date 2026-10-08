#!/bin/bash
# kind: tests
# batch5 stages JOB-3 (the takeover, 2026-10-09): the registry after the hand-over fixes (a nav rule's cost on climb
# edges, the minimap's solid test beside mapBlock, R.noPlace through G.level.noPlace, backdrop sets with instances, the
# overlay / heat cleanup, multi-pass bakes): stage-mods (33) ×2, stage-mods-bake (6: one pass byte-identical to 9f2cdef),
# net-stagemods ×2, the lead's regression list (world-build, movers, pods, treehills-pods, surf-movers, tower-rules,
# bot-sight, climb-audit, wip-stages, net-stageclock, net-practice with APP_CSP, net-turf), check-maps, nine bot matches
# (calamari / treehills / halyard × turf / zones / tower) and the cost A/B on halyard (this head vs 9f2cdef, ×3).
# Summary → $JOB_OUT/summary.txt; the first 40 lines of any failing run → fails.txt.
set -u
echo "### stages JOB-3 at $(git rev-parse --short HEAD)"
LOG="$JOB_OUT/logs" REP=2 tools/botlab/jobs/batch5/stages/regress.sh | tee "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/logs/*.log; do
  if grep -q '^FAIL' "$f"; then echo "--- $(basename "$f")"; head -40 "$f" | cut -c1-400; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines"
