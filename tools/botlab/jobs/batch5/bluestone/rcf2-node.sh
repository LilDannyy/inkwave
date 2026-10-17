#!/bin/bash
# Bluestone round C fix 2 (scratch): every Node check of the blockout at the current tree, no Electron.
#   rcf2-node.sh <work dir>      (writes one file per check there, and node-checks.txt with them all, in order)
#   check-maps (bluestone, .tower, .zones, .bazookarp, .boss) per era; rc-check (holes, ground misses, floor, paint, lightmap
#   rows; the union's era groups and jumps); rc-cover (floor cells, cover within 5 m, open circles, floor by region);
#   rc-sight (deck-to-deck sightlines); appear-check (turf, tower, bazookarp, boss); the strip test; rc-routes (what
#   each jump changes); rc-halo-entries; nav-measure (spawn → mid, Bazookarp L); rc-spawnmid; rc-weir (3 m round the
#   weirs, Gates and Pond); rcf1-paths (pad → the Halo's 270° side, the knee → the balcony, the dock, the side zone);
#   rc-karp-ring (the Gate's 15 m ring); rcf1-dock-sight; rcf2-punt-wet (the punt's nodes by the nav's wet level)
W="$1"; mkdir -p "$W"
cd "$(dirname "$0")" || exit 1
ROOT=$(cd ../../../../.. && pwd)
N="node --import ./three-hook.mjs"
{ echo "# head $(git rev-parse --short HEAD) $(date +%H:%M:%S)$(git diff --quiet -- "$ROOT/src" || echo ' (+ uncommitted src changes)')"
  echo "### check-maps"; for e in 1 2 3; do (cd "$ROOT" && ERA=$e node build/check-maps.mjs bluestone bluestone.tower bluestone.zones bluestone.bazookarp bluestone.boss 2>&1 | sed "s/^/era $e  /"); done; } > "$W/checkmaps.txt"
for e in 1 2 3 all; do ERA=$e $N rc-check.mjs > "$W/rc$e.txt" 2>&1; done
for e in 1 2 3; do ERA=$e $N rc-cover.mjs > "$W/cover$e.txt" 2>&1; done
for e in 1 2 3; do ERA=$e $N rc-sight.mjs > "$W/sight$e.txt" 2>&1; done
for m in turf tower bazookarp boss; do for e in all 1 2 3; do ERA=$e MODE=$m node dump-layout.mjs > "$W/dump-$m-$e.json" 2> "$W/dump-$m-$e.err"; done; done
for m in turf tower bazookarp boss; do echo "== appear $m"; python3 appear-check.py "$W/dump-$m-all.json" | tail -3; done > "$W/appear.txt" 2>&1
for e in 1 2 3; do echo "== strips turf era $e"; python3 strips-check.py "$W/dump-turf-$e.json" 25 | tail -4; done > "$W/strips.txt" 2>&1
for e in 1 2 3; do ERA=$e $N rc-routes.mjs > "$W/routes$e.txt" 2>&1; done
ERA=3 $N rc-halo-entries.mjs > "$W/halo3.txt" 2>&1
for e in 1 3; do ERA=$e $N nav-measure.mjs > "$W/navm$e.txt" 2>&1; done
for e in 1 3; do ERA=$e $N rc-spawnmid.mjs > "$W/spawnmid$e.txt" 2>&1; done
(cd "$ROOT" && node -e "import('file://$ROOT/src/world/stages/bluestone/layout.js').then((m) => console.log(JSON.stringify(m.LAYOUT.bazookarp)))") > "$W/karp.json"
python3 rc-weir.py "$W/dump-bazookarp-all.json" "$W/karp.json" > "$W/weir.txt" 2>&1
for e in 1 2 3; do ERA=$e $N rcf1-paths.mjs > "$W/paths$e.txt" 2>&1; done
for e in 1 3; do ERA=$e $N rc-karp-ring.mjs > "$W/karp-ring$e.txt" 2>&1; done
ERA=1 $N rcf1-dock-sight.mjs > "$W/dock-sight1.txt" 2>&1
for e in 1 2 3; do ERA=$e $N rcf2-punt-wet.mjs > "$W/punt-wet$e.txt" 2>&1; done
(cd "$ROOT" && node -e "import('file://$ROOT/src/world/stages/bluestone/props.js').then(()=>console.log('props.js imports ok'))") > "$W/props.txt" 2>&1
O="$W/node-checks.txt"; : > "$O"
for f in checkmaps rc1 rc2 rc3 rcall cover1 cover2 cover3 sight1 sight2 sight3 appear strips routes1 routes2 routes3 halo3 navm1 navm3 spawnmid1 spawnmid3 weir paths1 paths2 paths3 karp-ring1 karp-ring3 dock-sight1 punt-wet1 punt-wet2 punt-wet3 props; do
  echo "### $f" >> "$O"; cat "$W/$f.txt" >> "$O"; done
echo "node checks → $O"
