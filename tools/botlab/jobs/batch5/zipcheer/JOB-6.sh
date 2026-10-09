#!/bin/bash
# kind: tests
# zipcheer JOB-6 (fix round 2, after JOB-5): the whole zipcheer test six times (three at a time) — the hint check now has
# a kill-card case and notes / clears a stray card (JOB-5: one run of three had one up) — plus zipcheer's tower part, and
# bot-specials three times (JOB-5: its Bubble Guard 'off' control, an old-behaviour bot's shots into the shield, came in
# under 20 once; locally 80-180).
# Summary → $JOB_OUT/summary.txt; the hint check's info and the Bubble Guard line of every run → $JOB_OUT/detail.txt.
set -u
echo "### zipcheer JOB-6 at $(git rev-parse --short HEAD)"
mkdir -p "$JOB_OUT/logs"
run() {   # name env…
  local name=$1; shift
  local L="$JOB_OUT/logs/$name.log"
  env WATCHDOG=900000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$L" 2>&1
  echo "== $name: $(grep -E '^RESULT' "$L" | tail -1) $(grep -c '^FAIL' "$L") FAIL"
  grep -E '^FAIL|HARNESS|WATCHDOG|console errors: [^n]' "$L" | cut -c1-700
}
export -f run; export JOB_OUT
{
  for i in 1 2 3 4 5 6; do echo "zipcheer-$i MAP=testbox MODE=turf PAGE=tools/botlab/tests/zipcheer.js"; done
  echo "zipcheer-tower MAP=testbox MODE=tower PAGE=tools/botlab/tests/zipcheer.js"
  for i in 1 2 3; do echo "bot-specials-$i MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-specials.js"; done
} | xargs -P 3 -L 1 bash -c 'run "$@"' _ | tee "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/logs/zipcheer-[0-9]*.log; do echo "$(basename "$f" .log): $(grep -E 'hint line showing' "$f" | grep -oE '"gaps".*' | cut -c1-900)"; done > "$JOB_OUT/detail.txt"
for f in "$JOB_OUT"/logs/bot-specials-*.log; do echo "$(basename "$f" .log): $(grep -E 'Bubble Guard: no shots' "$f" | cut -c1-5) $(grep -E 'Bubble Guard: no shots' "$f" | grep -oE '"off":\{[^}]*\}')"; done >> "$JOB_OUT/detail.txt"
cat "$JOB_OUT/detail.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines, $(grep -cE '^== zipcheer-[0-9]: RESULT 36/36 0 FAIL' "$JOB_OUT/summary.txt")/6 zipcheer 36/36"
