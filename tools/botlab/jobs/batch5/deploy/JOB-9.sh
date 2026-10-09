#!/bin/bash
# kind: tests
# deploy JOB-9 (fix round 1, after JOB-6's failures): JOB-6 ran at 96fcfa4 and showed (a) the new bots checks flaky — a
# brain carrying a foe from an earlier scene (fixed: fresh brains), the danger scene's bot walking into a just-landed
# vortex (botSpecials: the vortex now takes over the missile's notice at once; no straight walk through a noticed
# danger); (b) surf's "a bot shoots an enemy buoy" (a bot hunting a lost foe skipped devices: it shoots one in reach now);
# (c) one sub-tweaks Skitter windup scene never armed (1 of 12; its end now reported).
# 1. the full regression set once (regress.sh) + 2 Tower Command matches; 2. the package's tests, surf, sub-tweaks and the
# bot ones twice more; 3. sub-tweaks only=windup ×6 (how each bomb ended); 4. deployables only=bots ×4 more.
set -u
D=tools/botlab/jobs/batch5/deploy
S="$JOB_OUT/summary.txt"
echo "### deploy JOB-9 at $(git rev-parse --short HEAD)" | tee "$S"
LOG="$JOB_OUT/logs" PAR=3 MATCHES="halyard saltpan" $D/regress.sh 2>&1 | tee -a "$S"
for i in 2 3; do
  echo "### repeat $i" | tee -a "$S"
  LOG="$JOB_OUT/logs-$i" PAR=3 ONLY="deployables deployables-tower surf sub-tweaks bot-specials bot-specials-tower net-deploy-leave" $D/regress.sh 2>&1 | tee -a "$S"
done
mkdir -p "$JOB_OUT/x"
x() {   # kind i
  local L="$JOB_OUT/x/$1-$2.log"
  if [ "$1" = windup ]; then env WATCHDOG=900000 MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-tweaks.js PAGE_ARGS=only=windup tools/botlab/run.sh tools/botlab/page.cjs > "$L" 2>&1
  else env WATCHDOG=900000 MAP=testbox MODE=turf PAGE=tools/botlab/tests/deployables.js PAGE_ARGS=only=bots tools/botlab/run.sh tools/botlab/page.cjs > "$L" 2>&1; fi
  echo "== $1 $2: $(grep -E '^RESULT' "$L" | tail -1)"
  grep -E '^FAIL' "$L" | cut -c1-1400
}
export -f x; export JOB_OUT
{ for i in 1 2 3 4 5 6; do echo "windup $i"; done; for i in 1 2 3 4; do echo "bots $i"; done; } | xargs -P 3 -L 1 bash -c 'x "$@"' _ | tee "$JOB_OUT/repeats.txt"
for f in "$JOB_OUT"/logs*/*.log "$JOB_OUT"/x/*.log; do
  if grep -qE '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS' "$f"; then echo "--- $f"; grep -E '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS|^CONSOLE [1-9]|^  \[' "$f" | head -20 | cut -c1-1400; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$S") runs, $(grep -c '^FAIL' "$S") FAIL lines; repeats: $(grep -c '^== ' "$JOB_OUT/repeats.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/repeats.txt") FAIL lines"
