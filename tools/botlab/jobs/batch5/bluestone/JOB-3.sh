#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/bluestone/out/mm3-*.jpg
# Bluestone Junction blockout at the takeover head (2026-10-09: the landmark volumes, the paint budget), the same sweep as JOB-1. The era engine is not built yet, so the blockout builds ONE era per run
# (ERA=1|2|3 → ?era=n, src/world/stages/bluestone/era.js) and never jumps: every check runs in each era.
#   bots: Turf War 3 per era, Zone Control 2 per era (DIAG=1: every stuck episode ≥ 2 s with its place and plan)
#   Tower Command: tower-check per era (pieces, holes, clearance, both rides, pictures) and an all-bot tower-match per era
#   perf: shoot.cjs REPORT for Halyard and each era, same machine, one after the other
R=tools/botlab/run.sh
J="$JOB_OUT"
O=tools/botlab/jobs/batch5/bluestone/out
mkdir -p "$O"
sum() { # name log -> compact summary
  { echo "### $1"; grep -E '^== |^   stuck |^      plan |^   splats by cause|^   held |^   checkpoints|^   bots in the active zone|^   wall climbs|^   DIAG|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH|^TOWER|^RESULT |tower' "$2" | grep -v '^RESULT_JSON' | cut -c1-420 | head -60; } > "$J/$1.txt"
}
for e in 1 2 3; do
  echo "== era $e: Turf War x3"
  for k in a b c; do ERA=$e MAP=bluestone MODE=turf SECS=180 DIAG=1 $R tools/botlab/match.cjs > "$J/turf$e$k.log" 2>&1 & done
  wait
  for k in a b c; do sum "turf$e$k" "$J/turf$e$k.log"; grep -E '^== |^   stuck [0-9]' "$J/turf$e$k.log" | head -2; done
done
for e in 1 2 3; do
  echo "== era $e: Zone Control x2, tower-match"
  ERA=$e MAP=bluestone MODE=zones DIAG=1 $R tools/botlab/match.cjs > "$J/zones$e"a.log 2>&1 &
  ERA=$e MAP=bluestone MODE=zones DIAG=1 $R tools/botlab/match.cjs > "$J/zones$e"b.log 2>&1 &
  ERA=$e MAP=bluestone $R tools/botlab/tower-match.cjs > "$J/towermatch$e.log" 2>&1 &
  wait
  for k in a b; do sum "zones$e$k" "$J/zones$e$k.log"; grep -E '^== |^   stuck [0-9]' "$J/zones$e$k.log" | head -2; done
  sum "towermatch$e" "$J/towermatch$e.log"; grep -E '^== |RESULT' "$J/towermatch$e.log" | grep -v RESULT_JSON | head -3
done
for e in 1 2 3; do
  echo "== era $e: tower-check"
  mkdir -p "$J/tc$e"
  ERA=$e MAP=bluestone OUT="$J/tc$e" $R tools/botlab/tower-check.cjs > "$J/towercheck$e.log" 2>&1
  grep -vE '^     run ' "$J/towercheck$e.log" | cut -c1-500 | head -70 > "$J/towercheck$e.txt"
  grep -E '^RESULT|holes|clearance' "$J/towercheck$e.log" | head -6
  [ -f "$J/tc$e/bluestone-top.png" ] && sips -Z 1400 -s format jpeg -s formatOptions 70 "$J/tc$e/bluestone-top.png" --out "$O/mm3-tower-rail-top-era$e.jpg" >/dev/null
done
echo "== perf: Halyard and Bluestone eras 1/2/3, same machine, one after the other"
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard.log" 2>&1
for e in 1 2 3; do ERA=$e MAP=bluestone TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-bluestone$e.log" 2>&1; done
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard2.log" 2>&1
{ for n in halyard bluestone1 bluestone2 bluestone3 halyard2; do echo "### perf $n"; grep -E '^REPORT|^CONSOLE' "$J/perf-$n.log" | cut -c1-600; done; } > "$J/perf.txt"
cat "$J/perf.txt" | grep REPORT | cut -c1-300
echo "RESULT done"
