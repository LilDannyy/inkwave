#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/bluestone/out/mm-cover*.jpg
# Bluestone Junction blockout (taken over 2026-10-09): the page tests in every era (ERA=n → ?era=n, the blockout's era
# filter, src/world/stages/bluestone/era.js), and Halyard's cover map from the same tool on the same machine.
#   spawn-mid, size-budget, stage-audit (turf + tower), climb-audit, cover-map; cover stretches over 10 m per era
R=tools/botlab/run.sh
J="$JOB_OUT"
O=tools/botlab/jobs/batch5/bluestone/out
mkdir -p "$O"
pt() { # name era map mode page
  WATCHDOG=900000 ERA=$2 MAP=$3 MODE=$4 PAGE=tools/botlab/tests/$5.js $R tools/botlab/page.cjs > "$J/$1.log" 2>&1
}
for e in 1 2 3; do
  echo "== era $e: spawn-mid, size-budget, climb-audit"
  pt spawnmid$e $e bluestone turf spawn-mid & pt size$e $e bluestone turf size-budget & pt climb$e $e bluestone turf climb-audit & wait
  echo "== era $e: stage-audit turf / tower, cover-map"
  pt audit$e $e bluestone turf stage-audit & pt audittower$e $e bluestone tower stage-audit & pt cover$e $e bluestone turf cover-map & wait
done
echo "== Halyard cover map (same tool, same machine)"
pt coverhalyard 1 halyard turf cover-map
{ for f in spawnmid1 spawnmid2 spawnmid3 size1 size2 size3 climb1 climb2 climb3 audit1 audit2 audit3 audittower1 audittower2 audittower3; do
    echo "### $f"; grep -E '^PASS|^FAIL|^RESULT|WATCHDOG|^CONSOLE|^  \[' "$J/$f.log" | cut -c1-600; done; } > "$J/tests.txt"
grep -E '^FAIL|^RESULT|WATCHDOG' "$J/tests.txt"
{ for f in cover1 cover2 cover3 coverhalyard; do
    echo "### $f"; grep -E '^RESULT|WATCHDOG' "$J/$f.log"
    python3 tools/botlab/jobs/batch5/bluestone/cover-stretches.py "$J/$f.log" "$f" 2>&1 | head -40
  done; } > "$J/cover.txt"
grep -E '% of|stretches' "$J/cover.txt"
for f in cover1 cover2 cover3 coverhalyard; do
  python3 tools/botlab/cover-map.py "$J/$f.log" "$J/$f.png" "$f" > /dev/null 2>&1 && sips -Z 1400 -s format jpeg -s formatOptions 70 "$J/$f.png" --out "$O/mm-$f.jpg" > /dev/null
done
ls "$O"/mm-cover* 2>/dev/null
echo "RESULT done"
