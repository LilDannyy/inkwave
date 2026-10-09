#!/bin/bash
# kind: tests
# zipcheer JOB-4 (fix round 1: the name tag over the orb, the ground cue, the cheer sounds on the cue bus): regress.sh —
# zipcheer (turf + its tower part), tower-rules, bot-specials (turf + tower), hud-lead (turf + zones), input-swim,
# track-arrows (the ally markers), three at a time; sfx-cues and audio-pause ALONE; net-zipcheer, net-practice, net-turf one
# at a time — then zipcheer and net-zipcheer twice more (flakiness), then two 120 s all-bot matches with one team's
# specials forced to the Cheer Orb (halyard turf, crossmarket zones; SPCHARGE=3) for frame / console errors.
# Summary → $JOB_OUT/summary.txt; the first 40 lines of any failing log → $JOB_OUT/fails.txt.
set -u
echo "### zipcheer JOB-4 at $(git rev-parse --short HEAD)"
D=tools/botlab/jobs/batch5/zipcheer
mkdir -p "$JOB_OUT/logs"
LOG="$JOB_OUT/logs" PAR=3 $D/regress.sh | tee "$JOB_OUT/summary.txt"
for i in 2 3; do LOG="$JOB_OUT/logs-$i" PAR=3 ONLY="zipcheer net-zipcheer" $D/regress.sh | tee -a "$JOB_OUT/summary.txt"; done
mt() {   # name env…
  local name=$1; shift
  local L="$JOB_OUT/logs/$name.log"
  env "$@" OUT="$JOB_OUT/$name.json" WATCHDOG=1500000 tools/botlab/run.sh tools/botlab/match.cjs > "$L" 2>&1
  echo "== $name: $(grep -E '^== ' "$L" | head -1 | cut -c1-160) | $(grep -E 'FRAME ERRORS|^CONSOLE' "$L" | tr '\n' ' ' | cut -c1-240)"
  echo "   $name $(grep -E '^   special ends' "$L" | cut -c1-700)"
}
mt orb-turf MAP=halyard MODE=turf SECS=120 SPCHARGE=3 SPECIALS=team0=booyah >> "$JOB_OUT/m1.out" &
mt orb-zones MAP=crossmarket MODE=zones SECS=120 SPCHARGE=3 SPECIALS=team1=booyah >> "$JOB_OUT/m2.out" &
wait
cat "$JOB_OUT/m1.out" "$JOB_OUT/m2.out" | tee -a "$JOB_OUT/summary.txt"
for f in "$JOB_OUT"/logs*/*.log; do
  if grep -qE '^FAIL|FRAME ERRORS|WATCHDOG|HARNESS' "$f"; then echo "--- $f"; head -40 "$f" | cut -c1-400; fi
done > "$JOB_OUT/fails.txt"
echo "SUMMARY $(grep -c '^== ' "$JOB_OUT/summary.txt") runs, $(grep -c '^FAIL' "$JOB_OUT/summary.txt") FAIL lines, $(grep -c 'FRAME ERRORS' "$JOB_OUT/summary.txt") with frame errors"
