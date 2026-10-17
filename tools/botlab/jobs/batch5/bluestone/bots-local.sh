#!/bin/bash
# Bluestone Junction blockout: the bots and the tower, LOCALLY, one Electron at a time (scratch; the Mac mini runner was
# down on 2026-10-09):  bots-local.sh <work dir> <picture dir>
#   per era: a Turf War match (180 s) and a Zone Control match (DIAG=1: every stuck episode ≥ 2 s with its place);
#   tower-check in every era (pieces, holes, clearance, both rides, the rail pictures); a tower-match in era 1
W="$1"; O="$2"; R=tools/botlab/run.sh
mkdir -p "$W" "$O"
sum() { { echo "### $1"; grep -E '^== |^   stuck |^      plan |^   splats by cause|^   held |^   checkpoints|^   bots in the active zone|^   wall climbs|^   DIAG|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH|^RESULT ' "$2" | grep -v '^RESULT_JSON' | cut -c1-420 | head -40; } > "$W/$1.txt"; }
for e in 1 2 3; do
  ERA=$e MAP=bluestone MODE=turf SECS=180 DIAG=1 $R tools/botlab/match.cjs > "$W/turf$e.log" 2>&1; sum turf$e "$W/turf$e.log"
  ERA=$e MAP=bluestone MODE=zones DIAG=1 $R tools/botlab/match.cjs > "$W/zones$e.log" 2>&1; sum zones$e "$W/zones$e.log"
done
for e in 1 2 3; do
  mkdir -p "$W/tc$e"
  ERA=$e MAP=bluestone OUT="$W/tc$e" $R tools/botlab/tower-check.cjs > "$W/towercheck$e.log" 2>&1
  grep -vE '^     run ' "$W/towercheck$e.log" | cut -c1-500 | head -40 > "$W/towercheck$e.txt"
  [ -f "$W/tc$e/bluestone-top.png" ] && sips -Z 1400 -s format jpeg -s formatOptions 68 "$W/tc$e/bluestone-top.png" --out "$O/era$e-tower-check-rail.jpg" > /dev/null
done
ERA=1 MAP=bluestone $R tools/botlab/tower-match.cjs > "$W/towermatch1.log" 2>&1; sum towermatch1 "$W/towermatch1.log"
cat "$W"/turf*.txt "$W"/zones*.txt "$W"/towermatch1.txt; for e in 1 2 3; do grep -E 'RESULT_JSON|holes|clearance|ride ' "$W/towercheck$e.txt"; done
