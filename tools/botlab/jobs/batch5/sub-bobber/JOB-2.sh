#!/bin/bash
# kind: balance
# sub-bobber JOB-2 (fix round 1): SPEC C11's web arm on treehills Zone Control — tools/botlab/tests/bobber-web.js, a scripted
# player laying 12- and 24-bobber webs (lane and zone layouts) against 4 enemy bots at normal, set off (trigger) or left
# for them to clear (clear), 10 webs a cell: 80 webs. Prints one line per web, one per cell, the C11 target lines and a
# SUMMARY json (the lead's consolidated balance pass reads these; its 'all=bomb' arm gives the Splat Bomb's splats per
# 100 ink to compare the 24-web with). 3 at a time, then the 4th.
set -u
mkdir -p "$JOB_OUT/x"
x() {   # name args
  local n=$1 a=$2
  local L="$JOB_OUT/x/$n.log"
  env WATCHDOG=3000000 MAP=treehills MODE=zones PAGE=tools/botlab/tests/bobber-web.js PAGE_ARGS="$a" tools/botlab/run.sh tools/botlab/page.cjs > "$L" 2>&1
  echo "== $n: $(grep -E '^RESULT' "$L" | tail -1)"
  grep -E '^(PASS|FAIL) (cell|target|SUMMARY)|^FAIL|harness error|WATCHDOG' "$L" | cut -c1-1200
}
export -f x; export JOB_OUT
echo "### sub-bobber JOB-2 (treehills) at $(git rev-parse --short HEAD)"
{ echo "trig12 n=12_layout=lane,zone_variant=trigger_reps=10"; echo "trig24 n=24_layout=lane,zone_variant=trigger_reps=10"
  echo "clear12 n=12_layout=lane,zone_variant=clear_reps=10"; echo "clear24 n=24_layout=lane,zone_variant=clear_reps=10"; } \
  | xargs -P 3 -L 1 bash -c 'x "$1" "${2//_/ }"' _ | tee "$JOB_OUT/summary.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines"
