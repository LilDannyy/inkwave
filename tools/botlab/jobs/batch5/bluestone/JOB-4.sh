#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/bluestone/out/mm4-*.jpg
# Bluestone Junction blockout, fix round 1 (2026-10-09): the page tests in every era at the fix head (ERA=n → ?era=n, the
# blockout's era filter), Halyard's cover map beside them, the era-2 Boss Battle check, the Halo's dominance (Zone
# Control locked to era 3 against era 2: centre hold time, splats from the Halo), perf beside Halyard.
#   (JOB-2 and JOB-3 never ran: the runner was down from 10-04; this job and JOB-5 replace them.)
R=tools/botlab/run.sh
J="$JOB_OUT"
D=tools/botlab/jobs/batch5/bluestone
O=$D/out
mkdir -p "$O"
pt() { # name era map mode page
  WATCHDOG=900000 ERA=$2 MAP=$3 MODE=$4 PAGE=$5 $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
for e in 1 2 3; do
  echo "== era $e: spawn-mid, size-budget, climb-audit"
  pt spawnmid$e $e bluestone turf tools/botlab/tests/spawn-mid.js & pt size$e $e bluestone turf tools/botlab/tests/size-budget.js & pt climb$e $e bluestone turf tools/botlab/tests/climb-audit.js & wait
  echo "== era $e: stage-audit turf / tower, cover-map"
  pt audit$e $e bluestone turf tools/botlab/tests/stage-audit.js & pt audittower$e $e bluestone tower tools/botlab/tests/stage-audit.js & pt cover$e $e bluestone turf tools/botlab/tests/cover-map.js & wait
done
echo "== Halyard cover map; the era-2 boss check"
pt coverhalyard 1 halyard turf tools/botlab/tests/cover-map.js & pt boss2 2 bluestone boss $D/boss-check.js & wait
echo "== the Halo: Zone Control locked to era 3 and to era 2, two each"
pt haloA3 3 bluestone zones $D/halo-dominance.js & pt haloB3 3 bluestone zones $D/halo-dominance.js & pt haloA2 2 bluestone zones $D/halo-dominance.js & wait
pt haloB2 2 bluestone zones $D/halo-dominance.js
{ for f in spawnmid1 spawnmid2 spawnmid3 size1 size2 size3 climb1 climb2 climb3 audit1 audit2 audit3 audittower1 audittower2 audittower3 boss2 haloA3 haloB3 haloA2 haloB2; do
    echo "### $f"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG|^CONSOLE|^  \[' "$J/$f.log" | cut -c1-700; done; } > "$J/tests.txt"
grep -E '^FAIL|^RESULT|WATCHDOG' "$J/tests.txt"
{ for f in cover1 cover2 cover3 coverhalyard; do
    echo "### $f"; grep -E '^RESULT|WATCHDOG' "$J/$f.log"
    python3 $D/cover-stretches.py "$J/$f.log" "$f" 2>&1 | head -12
  done; } > "$J/cover.txt"
grep -E '% of|stretches' "$J/cover.txt"
for f in cover1 cover3 coverhalyard; do
  python3 tools/botlab/cover-map.py "$J/$f.log" "$J/$f.png" "$f" > /dev/null 2>&1 && sips -Z 1400 -s format jpeg -s formatOptions 70 "$J/$f.png" --out "$O/mm4-$f.jpg" > /dev/null
done
echo "== perf: Halyard and Bluestone eras 1/2/3, same machine, one after the other"
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard.log" 2>&1
for e in 1 2 3; do ERA=$e MAP=bluestone TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-bluestone$e.log" 2>&1; done
ERA=1 MAP=bluestone TIME=day MODE=tower OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-bluestone1-tower.log" 2>&1
MAP=halyard TIME=day MODE=turf OUT="$J/perf" SHOTS='top' $R tools/botlab/shoot.cjs > "$J/perf-halyard2.log" 2>&1
{ for n in halyard bluestone1 bluestone2 bluestone3 bluestone1-tower halyard2; do echo "### perf $n"; grep -E '^REPORT|^CONSOLE' "$J/perf-$n.log" | cut -c1-600; done; } > "$J/perf.txt"
grep REPORT "$J/perf.txt" | cut -c1-300
echo "RESULT done"
