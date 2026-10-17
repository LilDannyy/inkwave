#!/bin/bash
# Bluestone blockout round B fix 1 (scratch): every Node check of the blockout, no Electron.   rb1-node.sh <work dir>
#   check-maps (bluestone, .tower, .bazookarp, .boss) per era; check-blockout per era and the union (groups, jumps);
#   the layout dumps; appear-check (turf, tower); deadend (default band and BAND=tip) and the strip test per era
W="$1"; J=tools/botlab/jobs/batch5/bluestone
mkdir -p "$W"
cd "$(dirname "$0")/../../../../.." || exit 1
for e in 1 2 3; do for v in bluestone bluestone.tower bluestone.bazookarp bluestone.boss; do
  printf 'era %s %-20s ' $e $v; ERA=$e node build/check-maps.mjs $v 2>&1 | tail -1; done; done
for e in 1 2 3 all; do
  (cd $J && ERA=$e node --import ./three-hook.mjs check-blockout.mjs > "$W/cb$e.txt" 2>&1)
  echo "== check-blockout era $e"; grep -E '"(blocks|holes|floor_m2|paint_m2|groundMiss|groups|groupFails|eraShare|lightRows)"|jump|groupsPerHalf|blocks"|FAIL' "$W/cb$e.txt" | tr -d '\n' | sed 's/  */ /g'; echo
done
for e in 1 2 3 all; do for m in turf tower; do (cd $J && ERA=$e MODE=$m node dump-layout.mjs > "$W/dump-$m-$e.json"); done; done
for m in turf tower; do echo "== appear $m"; python3 $J/appear-check.py "$W/dump-$m-all.json" | grep -E '^== |RESULT' ; done
for e in 1 2 3; do
  echo "== era $e deadend (default band, tip band) / strips (turf, tower)"
  python3 $J/deadend.py "$W/dump-turf-$e.json" | grep -E 'Alpha|Bravo'
  BAND=tip python3 $J/deadend.py "$W/dump-turf-$e.json" | grep -E 'Alpha|Bravo'
  python3 $J/strips-check.py "$W/dump-turf-$e.json" | tail -1
  python3 $J/strips-check.py "$W/dump-tower-$e.json" | tail -1
done
