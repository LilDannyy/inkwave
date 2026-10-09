#!/bin/bash
# kind: tests
# after: JOB-4
# push: tools/botlab/jobs/batch5/bluestone/out/mm5-*.jpg
# Bluestone Junction blockout, fix round 1 (2026-10-09): the bots and the tower at the fix head, each era locked.
#   Turf War 180 s ×3 per era, and Halyard ×3 beside them (total ink: the review asks Bluestone within 5 points of
#   Halyard); Zone Control ×1 per era (DIAG=1); tower-check per era (pieces, holes, clearance, both rides, pictures);
#   an all-bot tower-match in eras 1 and 3.
R=tools/botlab/run.sh
J="$JOB_OUT"
O=tools/botlab/jobs/batch5/bluestone/out
mkdir -p "$O"
sum() { { echo "### $1"; grep -E '^== |^   stuck |^      plan |^   splats by cause|^   held |^   checkpoints|^   bots in the active zone|^   wall climbs|^   DIAG|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH|^TOWER|^RESULT |tower' "$2" | grep -v '^RESULT_JSON' | cut -c1-420 | head -60; } > "$J/$1.txt"; }
for e in 1 2 3; do
  echo "== era $e: Turf War x3"
  for k in a b c; do ERA=$e MAP=bluestone MODE=turf SECS=180 DIAG=1 $R tools/botlab/match.cjs > "$J/turf$e$k.log" 2>&1 & done; wait
  for k in a b c; do sum "turf$e$k" "$J/turf$e$k.log"; grep -E '^== |^   stuck [0-9]' "$J/turf$e$k.log" | head -2; done
done
echo "== Halyard: Turf War x3 (same machine)"
for k in a b c; do MAP=halyard MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turfH$k.log" 2>&1 & done; wait
for k in a b c; do sum "turfH$k" "$J/turfH$k.log"; grep -E '^== ' "$J/turfH$k.log" | head -1; done
echo "== Zone Control, one per era"
for e in 1 2 3; do ERA=$e MAP=bluestone MODE=zones DIAG=1 $R tools/botlab/match.cjs > "$J/zones$e.log" 2>&1 & done; wait
for e in 1 2 3; do sum "zones$e" "$J/zones$e.log"; grep -E '^== |^   stuck [0-9]|^   held ' "$J/zones$e.log" | head -3; done
for e in 1 2 3; do
  echo "== era $e: tower-check"
  mkdir -p "$J/tc$e"
  ERA=$e MAP=bluestone OUT="$J/tc$e" $R tools/botlab/tower-check.cjs > "$J/towercheck$e.log" 2>&1
  grep -vE '^     run ' "$J/towercheck$e.log" | cut -c1-500 | head -70 > "$J/towercheck$e.txt"
  grep -E '^RESULT|holes|clearance' "$J/towercheck$e.log" | head -6
  [ -f "$J/tc$e/bluestone-top.png" ] && sips -Z 1400 -s format jpeg -s formatOptions 70 "$J/tc$e/bluestone-top.png" --out "$O/mm5-tower-rail-top-era$e.jpg" >/dev/null
done
echo "== tower-match, eras 1 and 3"
ERA=1 MAP=bluestone $R tools/botlab/tower-match.cjs > "$J/towermatch1.log" 2>&1 & ERA=3 MAP=bluestone $R tools/botlab/tower-match.cjs > "$J/towermatch3.log" 2>&1 & wait
for e in 1 3; do sum "towermatch$e" "$J/towermatch$e.log"; grep -E '^== |RESULT' "$J/towermatch$e.log" | grep -v RESULT_JSON | head -3; done
echo "RESULT done"
