#!/bin/bash
# kind: tests
# zipcheer JOB-5 (fix round 2: the cheer prompt over the hint line, the Super Jump note over the prompt; the 'bots cheer'
# check made deterministic): regress.sh (zipcheer turf + tower, tower-rules, bot-specials turf + tower, hud-lead turf +
# zones, input-swim, track-arrows three at a time; sfx-cues and audio-pause ALONE; net-zipcheer, net-practice, net-turf one
# at a time), then the whole zipcheer test twice more, then its 'bots' part ten times (three at a time) — the flakiness
# proof for the rewritten check.
# Summary → $JOB_OUT/summary.txt; the first 40 lines of any failing log → $JOB_OUT/fails.txt.
set -u
echo "### zipcheer JOB-5 at $(git rev-parse --short HEAD)"
D=tools/botlab/jobs/batch5/zipcheer
mkdir -p "$JOB_OUT/logs" "$JOB_OUT/bots"
LOG="$JOB_OUT/logs" PAR=3 $D/regress.sh | tee "$JOB_OUT/summary.txt"
for i in 2 3; do LOG="$JOB_OUT/logs-$i" PAR=3 ONLY="zipcheer" $D/regress.sh | tee -a "$JOB_OUT/summary.txt"; done
bots() {   # n
  local L="$JOB_OUT/bots/bots-$1.log"
  env WATCHDOG=900000 MAP=testbox MODE=turf PAGE=tools/botlab/tests/zipcheer.js PAGE_ARGS='only=bots' tools/botlab/run.sh tools/botlab/page.cjs > "$L" 2>&1
  echo "== bots-$1: $(grep -E '^RESULT' "$L" | tail -1) $(grep -c '^FAIL' "$L") FAIL | $(grep -E 'each bot teammate cheers' "$L" | grep -oE '\{.*\}' | cut -c1-200)"
  grep -E '^FAIL|HARNESS|WATCHDOG|console errors: [^n]' "$L" | cut -c1-600
}
export -f bots; export JOB_OUT
seq 1 10 | xargs -P 3 -I{} bash -c 'bots {}' | tee -a "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/logs*/*.log "$JOB_OUT"/bots/*.log; do
  if grep -qE '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS' "$f"; then echo "--- $f"; head -40 "$f" | cut -c1-400; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines, $(grep -cE '^== bots-.*RESULT 2/2 0 FAIL' "$JOB_OUT/summary.txt")/10 bots runs 2/2"
