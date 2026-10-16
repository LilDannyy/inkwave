#!/bin/bash
# kind: balance
# Gulper Aquarium, fix round 1 (geometry at b088274+: the pavilion back at DESIGN.md's spot, the plaza's front row
# rebuilt, the Express re-seated and bent, the Service Gate shifted, the Kelp Ramp railed). Review issues 3 and 4:
#   zones: 4 matches on aquarium and the same 4 mirrored loadouts on Halyard (lead changes rebuilt by zones-lead.py)
#   tower: 4 aquarium + 2 Halyard tower-match runs (the control log gives the tower's position at every control change)
#   turf: 2 aquarium matches (stuck episodes on the new plaza)
# then the page checks (spawn-mid, size-budget, climb-audit, stage-audit ×3, cover-map, cover-plus, landings,
# ball-view, pipe-aprons, karp-data, reach-probe), tower-check, perf next to Halyard.
# Locally: PAR=1 JOB_OUT=<dir> bash tools/botlab/jobs/batch5/aquarium/JOB-3.sh (one Electron at a time).
R=tools/botlab/run.sh
J="$JOB_OUT"; A=tools/botlab/jobs/batch5/aquarium
P=${PAR:-3}
mkdir -p "$J/tc" "$J/perf"
par() { while [ "$(jobs -rp | wc -l)" -ge "$P" ]; do sleep 2; done; }
L1=shooter,roller,charger,spinner; L2=blaster,brush,bow,bucket; L3=twins,blade,spinner,brolly; L4=mitts,shooter,bow,roller
echo "== zones: aquarium and halyard x4, mirrored loadouts"
k=0
for L in $L1 $L2 $L3 $L4; do k=$((k+1))
  for M in aquarium halyard; do par; MAP=$M MODE=zones WEAPONS="$L,$L" $R tools/botlab/match.cjs > "$J/zones-$M-$k.log" 2>&1 & done
done; wait
echo "== tower-match: aquarium x4, halyard x2"
for k in 1 2 3 4; do par; MAP=aquarium $R tools/botlab/tower-match.cjs > "$J/tower-aquarium-$k.log" 2>&1 & done
for k in 1 2; do par; MAP=halyard $R tools/botlab/tower-match.cjs > "$J/tower-halyard-$k.log" 2>&1 & done
wait
echo "== turf: aquarium x2"
for k in 1 2; do par; MAP=aquarium MODE=turf SECS=180 $R tools/botlab/match.cjs > "$J/turf-aquarium-$k.log" 2>&1 & done; wait
{ python3 $A/zones-lead.py "$J"/zones-*.log; } > "$J/zones-lead.txt" 2>&1
{ for f in "$J"/zones-*.log "$J"/turf-*.log; do echo "### $(basename $f)"; grep -E '^== |^   held |^   stuck|^   control log|^   loadouts|^   best shares|FRAME ERRORS|WATCHDOG|HARNESS|MAP MISMATCH|^CONSOLE' "$f" | cut -c1-400 | head -14; done; } > "$J/matches.txt"
{ for f in "$J"/tower-*.log; do echo "### $(basename $f)"; grep -E '^== |^   held |^   checkpoints|^   control log|^   checkpoint log|^   teams:|^   stuck|FRAME ERRORS|WATCHDOG|^CONSOLE' "$f" | cut -c1-500 | head -14; done; } > "$J/tower.txt"
echo "== page checks"
for M in turf zones tower; do MAP=aquarium MODE=$M WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js $R tools/botlab/page.cjs > "$J/audit-$M.log" 2>&1; done
for p in tools/botlab/tests/spawn-mid.js tools/botlab/tests/size-budget.js tools/botlab/tests/climb-audit.js tools/botlab/tests/cover-map.js $A/cover-plus.js $A/landings.js $A/ball-view.js $A/pipe-aprons.js $A/karp-data.js $A/reach-probe.js; do
  n=$(basename $p .js); MAP=aquarium MODE=turf WATCHDOG=900000 PAGE=$p $R tools/botlab/page.cjs > "$J/page-$n.log" 2>&1
done
python3 $A/cover-stats.py "$J/page-cover-map.log" > "$J/cover-stats.txt" 2>&1
python3 $A/cover-hop.py "$J/page-cover-plus.log" aquarium > "$J/cover-hop.txt" 2>&1
{ for f in "$J"/audit-*.log "$J"/page-*.log; do echo "### $(basename $f)"; grep -E '^(PASS|FAIL|RESULT)|WATCHDOG|console' "$f" | grep -v '"cells":\[' | cut -c1-420; done; } > "$J/pages.txt"
echo "== tower-check"
MAP=aquarium OUT="$J/tc" $R tools/botlab/tower-check.cjs > "$J/towercheck.log" 2>&1
grep -vE '^     run ' "$J/towercheck.log" | cut -c1-500 | head -40 > "$J/towercheck.txt"
echo "== perf: Halyard and Gulper Aquarium, alternating"
for k in 1 2; do
  MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard$k.log" 2>&1
  MAP=aquarium TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-aquarium$k.log" 2>&1
done
{ for n in halyard1 aquarium1 halyard2 aquarium2; do echo "### perf $n"; grep -E '^REPORT|^CONSOLE|^  \[' "$J/perf-$n.log" | cut -c1-500; done; } > "$J/perf.txt"
rm -f "$J"/perf/*.png "$J"/tc/*.png 2>/dev/null
echo "RESULT done"
