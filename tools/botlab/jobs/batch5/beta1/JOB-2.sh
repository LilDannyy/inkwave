#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/beta1/out/lm/* tools/botlab/jobs/batch5/beta1/out/before/*.jpg
# Beta fix round 1, JOB-2: the lightmaps the beta ships without, and the "before" pictures of Highmark Foundry.
#  1. Highmark Foundry before its bake: 4 views (spawnA, mid, aerialA, sideL) at day and dusk, as JPEGs.
#  2. The bakes: caldera (its Turf War / Zone Control / Tower Command world: the stage has no tower-only piece, so
#     'caldera.tower' is the same world), caldera.boss, bluestone.tower, bluestone.boss (Bluestone's per-era RGB bake).
#     Copied to out/lm/ (they come back with the results; the builder commits them under assets/lightmaps).
#  3. With the bakes in place: tests/lightmaps.js (every reachable world lit, the quiet Bazookarp fallback),
#     tests/stage-audit.js on caldera ("lightmap applied"), tests/issue-log.js (the stuck watch).
set -u
J=${JOB_OUT:-.botlab/beta1-job2}
O=tools/botlab/jobs/batch5/beta1/out
mkdir -p "$J/logs" "$O/lm" "$O/before"
echo "### beta1 JOB-2 head ${JOB_SHA:-?}"
jpg() { for f in "$1"/*.png; do [ -e "$f" ] || continue; sips -s format jpeg -s formatOptions 72 --resampleWidth 1280 "$f" --out "$2/$(basename "${f%.png}").jpg" > /dev/null 2>&1; done; }
# 1. before
for t in day dusk; do
  MAP=caldera TIME=$t SHOTS='spawnA,mid,aerialA,sideL' OUT="$J/shots-before-$t" tools/botlab/run.sh tools/botlab/shoot.cjs > "$J/logs/shoot-before-$t.log" 2>&1
  grep -E 'no lightmap|REPORT|WATCHDOG|MAP MISMATCH' "$J/logs/shoot-before-$t.log" | cut -c1-300 | sed "s/^/[before $t] /"
  jpg "$J/shots-before-$t" "$O/before"
done
ls -la "$O/before"
# 2. the bakes (one Electron, one key after another)
tools/botlab/run.sh tools/botlab/bake.cjs caldera caldera.boss bluestone.tower bluestone.boss > "$J/logs/bake.log" 2>&1
grep -E '\[bake\].*(done|failed|no map|no .* variant|does not fit)|WATCHDOG|Error' "$J/logs/bake.log" | cut -c1-300
for k in caldera caldera.boss bluestone.tower bluestone.boss; do cp "assets/lightmaps/$k.png" "assets/lightmaps/$k.json" "$O/lm/" 2>/dev/null || echo "FAIL no bake for $k"; done
ls -la "$O/lm"; cat "$O"/lm/*.json; echo
# 3. the checks, with the bakes in place
MAP=halyard WATCHDOG=1500000 PAGE=tools/botlab/tests/lightmaps.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/lightmaps.log" 2>&1
grep -E '^PASS|^FAIL|^RESULT|^WATCHDOG|HARNESS|console errors' "$J/logs/lightmaps.log" | cut -c1-600 | sed 's/^/[lightmaps] /'
for mode in turf zones tower; do
  MAP=caldera MODE=$mode WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/audit-caldera-$mode.log" 2>&1
  grep -E 'lightmap|^RESULT|^WATCHDOG|HARNESS' "$J/logs/audit-caldera-$mode.log" | cut -c1-300 | sed "s/^/[stage-audit caldera $mode] /"
done
MAP=halyard WATCHDOG=900000 PAGE=tools/botlab/tests/issue-log.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/issue-log.log" 2>&1
grep -E '^PASS|^FAIL|^RESULT|^WATCHDOG|HARNESS|console errors' "$J/logs/issue-log.log" | cut -c1-400 | sed 's/^/[issue-log] /'
cp "$J/logs/lightmaps.log" "$J/lightmaps.txt"; cp "$J/logs/bake.log" "$J/bake.txt"
echo "### done"
