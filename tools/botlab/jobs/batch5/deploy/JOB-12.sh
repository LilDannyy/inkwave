#!/bin/bash
# kind: tests
# deploy JOB-12 (fix round 1, resumed 2026-10-09): the final head — botSpecials looks again the frame a known danger goes
# (a missile's notice handed to its vortex at once), the reworked bot checks (the Vortex scene with its old-order control;
# the foe gone by a splat), surf's buoy scene with every foe behind the wall. (JOB-11 was not picked up within 20 min:
# the builder ran these locally; this is the Mac mini's copy for when the runner is back.)
# 1. the full regression set once (regress.sh) + 2 Tower Command matches; 2. deployables only=bots ×6, surf ×4,
# bot-specials ×3, sub-tweaks only=windup ×3.
set -u
D=tools/botlab/jobs/batch5/deploy
S="$JOB_OUT/summary.txt"
echo "### deploy JOB-12 at $(git rev-parse --short HEAD)" | tee "$S"
LOG="$JOB_OUT/logs" PAR=3 MATCHES="halyard saltpan" $D/regress.sh 2>&1 | tee -a "$S"
mkdir -p "$JOB_OUT/x"
x() {   # name i env…
  local n=$1 i=$2; shift 2
  local L="$JOB_OUT/x/$n-$i.log"
  env WATCHDOG=900000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$L" 2>&1
  echo "== $n $i: $(grep -E '^RESULT' "$L" | tail -1)"
  grep -E '^FAIL' "$L" | cut -c1-400
}
export -f x; export JOB_OUT
T=tools/botlab/tests
{ for i in 1 2 3 4 5 6; do echo "bots $i MAP=testbox MODE=turf PAGE=$T/deployables.js PAGE_ARGS=only=bots"; done
  for i in 1 2 3 4; do echo "surf $i MAP=testbox MODE=turf PAGE=$T/surf.js"; done
  for i in 1 2 3; do echo "bot-specials $i MAP=testbox MODE=turf PAGE=$T/bot-specials.js"; echo "windup $i MAP=testbox MODE=turf PAGE=$T/sub-tweaks.js PAGE_ARGS=only=windup"; done; } \
  | xargs -P 3 -L 1 bash -c 'x "$@"' _ | tee "$JOB_OUT/repeats.txt"
for f in "$JOB_OUT"/logs/*.log "$JOB_OUT"/x/*.log; do
  if grep -qE '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS' "$f"; then echo "--- $(basename "$f")"; grep -E '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS|^CONSOLE [1-9]' "$f" | head -12 | cut -c1-2000; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$S") runs, $(grep -c '^FAIL' "$S") FAIL lines; repeats: $(grep -c '^== ' "$JOB_OUT/repeats.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/repeats.txt") FAIL lines"
