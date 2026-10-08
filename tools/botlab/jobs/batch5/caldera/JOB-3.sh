#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/caldera/out/*.jpg
# Highmark Foundry blockout, the bot and mode sweep at both lava levels (the blockout builds one level per run:
# LAVA=low|high): Turf War (2 at LOW, 2 at HIGH), Zone Control (LOW, HIGH), each with its six longest stuck episodes and their
# place), tower-check (both rides, pictures) and an all-bot tower match, stage-audit per mode, the performance REPORT
# beside Halyard's in the same run, and the ink after 20 s of bots.
R=tools/botlab/run.sh
J="$JOB_OUT"
O=tools/botlab/jobs/batch5/caldera/out
mkdir -p "$O" "$J/tc" "$J/perf" "$J/ink"
sum() { # name log -> compact summary
  { echo "### $1"; grep -E '^== |^   stuck |^   splats by cause|^   per bot|^   held |^   checkpoints|^   bots in the active zone|^   diag|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH' "$2" | cut -c1-420 | head -50; } > "$J/$1.txt"
}
echo "== matches, round 1 (3 in parallel)"
MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turfL1.log" 2>&1 &
MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turfL2.log" 2>&1 &
LAVA=high MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turfH1.log" 2>&1 &
wait
echo "== matches, round 2"
LAVA=high MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turfH2.log" 2>&1 &
MAP=caldera MODE=zones $R tools/botlab/match.cjs > "$J/zonesL.log" 2>&1 &
LAVA=high MAP=caldera MODE=zones $R tools/botlab/match.cjs > "$J/zonesH.log" 2>&1 &
wait
echo "== tower match + stage audits"
MAP=caldera $R tools/botlab/tower-match.cjs > "$J/towermatch.log" 2>&1 &
MAP=caldera MODE=zones PAGE=tools/botlab/tests/stage-audit.js WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/audit-zones.log" 2>&1 &
MAP=caldera MODE=tower PAGE=tools/botlab/tests/stage-audit.js WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/audit-tower.log" 2>&1 &
wait
for n in turfL1 turfL2 turfH1 turfH2 zonesL zonesH towermatch; do sum "$n" "$J/$n.log"; done
{ for n in zones tower; do echo "### stage-audit $n"; grep -E '^PASS|^FAIL|^RESULT|HARNESS|console errors' "$J/audit-$n.log" | cut -c1-400; done; } > "$J/audits.txt"
echo "== tower-check (rides, pictures)"
MAP=caldera OUT="$J/tc" $R tools/botlab/tower-check.cjs > "$J/towercheck.log" 2>&1
grep -vE '^     run ' "$J/towercheck.log" | cut -c1-500 | head -60 > "$J/towercheck.txt"
[ -f "$J/tc/caldera-top.png" ] && sips -Z 1400 -s format jpeg -s formatOptions 70 "$J/tc/caldera-top.png" --out "$O/mm-tower-rail-top.jpg" >/dev/null
echo "== perf: Halyard, Highmark LOW, Highmark HIGH, Halyard again (same machine, one after the other)"
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard.log" 2>&1
MAP=caldera TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-caldera-low.log" 2>&1
LAVA=high MAP=caldera TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-caldera-high.log" 2>&1
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard2.log" 2>&1
{ for n in halyard caldera-low caldera-high halyard2; do echo "### perf $n"; grep -E '^REPORT|^CONSOLE' "$J/perf-$n.log" | cut -c1-600; done; } > "$J/perf.txt"
echo "== the ink after 20 s of bots (LOW)"
PLAY=20 MAP=caldera TIME=day MODE=turf OUT="$J/ink" SHOTS='top,mid' $R tools/botlab/shoot.cjs > "$J/ink.log" 2>&1
for f in top mid; do [ -f "$J/ink/caldera-day-$f.png" ] && sips -Z 1600 -s format jpeg -s formatOptions 78 "$J/ink/caldera-day-$f.png" --out "$O/mm-ink-play20-$f.jpg" >/dev/null; done
grep -E '^REPORT|^CONSOLE|^  \[' "$J/ink.log" | cut -c1-300 > "$J/ink.txt"
echo "RESULT done"
