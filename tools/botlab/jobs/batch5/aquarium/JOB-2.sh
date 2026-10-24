#!/bin/bash
# kind: tests
# Gulper Aquarium blockout, the takeover's proof run (geometry at the cover fixes: Ø 2.4 bubble column, the pavilion
# skylights): bots in Turf War (3) and Zone Control (3) with the longest stuck episodes, Tower Command (track check with
# both ride tests, an all-bot match), stage-audit in zones and tower, and the perf REPORT next to Halyard's.
R=tools/botlab/run.sh
J="$JOB_OUT"
mkdir -p "$J/tc" "$J/perf"
sum() { # name log -> compact summary
  { echo "### $1"; grep -E '^== |^   stuck|^   splats by cause|^   held |^   checkpoints|^   bots in the active zone|^   captures|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH' "$2" | cut -c1-420 | head -40;
    grep -E '^RESULT_JSON' "$2" | cut -c1-300; } > "$J/$1.txt"
}
echo "== matches: turf x3"
MAP=aquarium MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turf1.log" 2>&1 &
MAP=aquarium MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turf2.log" 2>&1 &
MAP=aquarium MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turf3.log" 2>&1 &
wait
echo "== matches: zones x3"
MAP=aquarium MODE=zones $R tools/botlab/match.cjs > "$J/zones1.log" 2>&1 &
MAP=aquarium MODE=zones $R tools/botlab/match.cjs > "$J/zones2.log" 2>&1 &
MAP=aquarium MODE=zones $R tools/botlab/match.cjs > "$J/zones3.log" 2>&1 &
wait
echo "== tower-match x2, stage-audit (zones, tower)"
MAP=aquarium $R tools/botlab/tower-match.cjs > "$J/towermatch1.log" 2>&1 &
MAP=aquarium $R tools/botlab/tower-match.cjs > "$J/towermatch2.log" 2>&1 &
{ MAP=aquarium MODE=zones WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js $R tools/botlab/page.cjs > "$J/audit-zones.log" 2>&1;
  MAP=aquarium MODE=tower WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js $R tools/botlab/page.cjs > "$J/audit-tower.log" 2>&1; } &
wait
for n in turf1 turf2 turf3 zones1 zones2 zones3 towermatch1 towermatch2; do sum "$n" "$J/$n.log"; done
{ for n in zones tower; do echo "### stage-audit $n"; grep -E '^(PASS|FAIL|RESULT)|WATCHDOG|console' "$J/audit-$n.log" | cut -c1-400; done; } > "$J/audit.txt"
echo "== tower-check (rides, pictures)"
MAP=aquarium OUT="$J/tc" $R tools/botlab/tower-check.cjs > "$J/towercheck.log" 2>&1
grep -vE '^     run ' "$J/towercheck.log" | cut -c1-500 | head -70 > "$J/towercheck.txt"
echo "== perf: Halyard and Gulper Aquarium, same machine, alternating"
for k in 1 2; do
  MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard$k.log" 2>&1
  MAP=aquarium TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-aquarium$k.log" 2>&1
done
{ for n in halyard1 aquarium1 halyard2 aquarium2; do echo "### perf $n"; grep -E '^REPORT|^CONSOLE|^  \[' "$J/perf-$n.log" | cut -c1-600; done; } > "$J/perf.txt"
echo "RESULT done"
