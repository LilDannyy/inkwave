#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/stages/aquarium/out/blockout/mm-*.jpg
# Gulper Aquarium blockout, first sweep: bots in Turf War (3) and Zone Control (2), Tower Command (track check with both
# ride tests and pictures, an all-bot match), and the performance REPORT next to Halyard's on the same machine.
R=tools/botlab/run.sh
J="$JOB_OUT"
O=tools/botlab/jobs/batch5/stages/aquarium/out/blockout
mkdir -p "$O" "$J/tc"
sum() { # name log -> compact summary
  { echo "### $1"; grep -E '^== |^   stuck |^   splats by cause|^   per bot|^   held |^   checkpoints|^   bots in the active zone|^   DIAG|^     [0-9.]+ s |^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH|^RESULT_JSON' "$2" | cut -c1-500 | head -50; } > "$J/$1.txt"
}
echo "== matches (3 in parallel)"
DIAG=1 MAP=aquarium MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turf1.log" 2>&1 &
DIAG=1 MAP=aquarium MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turf2.log" 2>&1 &
DIAG=1 MAP=aquarium MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turf3.log" 2>&1 &
wait
DIAG=1 MAP=aquarium MODE=zones $R tools/botlab/match.cjs > "$J/zones1.log" 2>&1 &
DIAG=1 MAP=aquarium MODE=zones $R tools/botlab/match.cjs > "$J/zones2.log" 2>&1 &
MAP=aquarium $R tools/botlab/tower-match.cjs > "$J/towermatch.log" 2>&1 &
wait
for n in turf1 turf2 turf3 zones1 zones2 towermatch; do sum "$n" "$J/$n.log"; done
grep -h -A3 "stuck episode" "$J"/turf*.log "$J"/zones*.log | cut -c1-400 | head -40 > "$J/stuck-episodes.txt"
echo "== tower-check (rides, pictures)"
MAP=aquarium OUT="$J/tc" $R tools/botlab/tower-check.cjs > "$J/towercheck.log" 2>&1
grep -vE '^     run ' "$J/towercheck.log" | cut -c1-500 | head -70 > "$J/towercheck.txt"
[ -f "$J/tc/aquarium-top.png" ] && sips -Z 1400 -s format jpeg -s formatOptions 70 "$J/tc/aquarium-top.png" --out "$O/mm-tower-rail-top.jpg" >/dev/null
echo "== perf: Halyard and Gulper Aquarium, same machine, one after the other"
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard.log" 2>&1
MAP=aquarium TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-aquarium.log" 2>&1
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard2.log" 2>&1
MAP=aquarium TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-aquarium2.log" 2>&1
{ for n in halyard aquarium halyard2 aquarium2; do echo "### perf $n"; grep -E '^REPORT|^CONSOLE' "$J/perf-$n.log" | cut -c1-600; done; } > "$J/perf.txt"
echo "RESULT done"
