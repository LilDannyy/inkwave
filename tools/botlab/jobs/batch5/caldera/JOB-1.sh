#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/caldera/out/*.jpg
# Highmark Foundry blockout, first sweep: bots in Turf War and Zone Control at both lava levels (the blockout builds one
# level per run: LAVA=low|high), Tower Command (track check with both ride tests, an all-bot match), and the
# performance REPORT next to Halyard's from the same machine.
R=tools/botlab/run.sh
J="$JOB_OUT"
O=tools/botlab/jobs/batch5/caldera/out
mkdir -p "$O" "$J/tc"
sum() { # name log -> compact summary
  { echo "### $1"; grep -E '^== |^   stuck |^   splats by cause|^   per bot|^   held |^   checkpoints|^   bots in the active zone|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH' "$2" | cut -c1-400 | head -40; } > "$J/$1.txt"
}
echo "== matches (3 in parallel)"
MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turf1.log" 2>&1 &
MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turf2.log" 2>&1 &
LAVA=high MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turfH.log" 2>&1 &
wait
MAP=caldera MODE=zones $R tools/botlab/match.cjs > "$J/zones1.log" 2>&1 &
LAVA=high MAP=caldera MODE=zones $R tools/botlab/match.cjs > "$J/zonesH.log" 2>&1 &
MAP=caldera $R tools/botlab/tower-match.cjs > "$J/towermatch.log" 2>&1 &
wait
for n in turf1 turf2 turfH zones1 zonesH towermatch; do sum "$n" "$J/$n.log"; done
echo "== tower-check (rides, pictures)"
MAP=caldera OUT="$J/tc" $R tools/botlab/tower-check.cjs > "$J/towercheck.log" 2>&1
grep -vE '^     run ' "$J/towercheck.log" | cut -c1-500 | head -60 > "$J/towercheck.txt"
[ -f "$J/tc/caldera-top.png" ] && sips -Z 1400 -s format jpeg -s formatOptions 70 "$J/tc/caldera-top.png" --out "$O/mm-tower-rail-top.jpg" >/dev/null
echo "== perf: Halyard and Highmark (LOW, HIGH), same machine, one after the other"
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard.log" 2>&1
MAP=caldera TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-caldera-low.log" 2>&1
LAVA=high MAP=caldera TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-caldera-high.log" 2>&1
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard2.log" 2>&1
{ for n in halyard caldera-low caldera-high halyard2; do echo "### perf $n"; grep -E '^REPORT|^CONSOLE' "$J/perf-$n.log" | cut -c1-600; done; } > "$J/perf.txt"
echo "RESULT done"
