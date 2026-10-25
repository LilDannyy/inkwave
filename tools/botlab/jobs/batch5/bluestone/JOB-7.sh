#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/bluestone/out/lm/*
# Bluestone art phase, JOB-7: the nine-pass bake (three keys x three eras: W.bakePasses traces era 1 / 2 / 3 into R / G / B)
# of the stage as finished for play — the art adds no collider, so the bake is the geometry's — and its proof:
#  1. bake.cjs bluestone bluestone.tower bluestone.boss (one Electron, one key after another); the PNG / JSON copied to
#     out/lm/ (they come back with the results; the builder commits them under assets/lightmaps)
#  2. with the bakes in place: tests/stage-audit.js on bluestone in every mode it has (turf, zones, tower, boss) and every
#     era (ERA=1/2/3; boss is fixed in era 2): "lightmap applied" per era; tests/lightmaps.js (every reachable world lit)
set -u
J=${JOB_OUT:-.botlab/bs-job7}
O=tools/botlab/jobs/batch5/bluestone/out/lm
mkdir -p "$J/logs" "$O"
echo "### bluestone JOB-7 head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg 2>/dev/null)"
for k in bluestone bluestone.tower bluestone.boss; do echo "# before: $k $(head -c 200 assets/lightmaps/$k.json 2>/dev/null)"; done
tools/botlab/run.sh tools/botlab/bake.cjs bluestone bluestone.tower bluestone.boss > "$J/logs/bake.log" 2>&1
grep -E '\[bake\].*(done|failed|no map|no .* variant|does not fit|pass|channel)|WATCHDOG|Error' "$J/logs/bake.log" | cut -c1-300
for k in bluestone bluestone.tower bluestone.boss; do cp "assets/lightmaps/$k.png" "assets/lightmaps/$k.json" "$O/" 2>/dev/null || echo "FAIL no bake for $k"; echo "# after: $k $(head -c 200 assets/lightmaps/$k.json)"; done
ls -la "$O"
for mode in turf zones tower boss; do
  for e in 1 2 3; do
    [ "$mode" = boss ] && [ "$e" != 2 ] && continue
    MAP=bluestone MODE=$mode ERA=$e WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/audit-$mode-$e.log" 2>&1
    grep -E 'lightmap|^RESULT|^WATCHDOG|HARNESS|^FAIL' "$J/logs/audit-$mode-$e.log" | cut -c1-300 | sed "s/^/[stage-audit $mode era $e] /"
  done
done
MAP=halyard WATCHDOG=1500000 PAGE=tools/botlab/tests/lightmaps.js tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/lightmaps.log" 2>&1
grep -E '^PASS|^FAIL|^RESULT|^WATCHDOG|HARNESS|console errors' "$J/logs/lightmaps.log" | cut -c1-600 | sed 's/^/[lightmaps] /'
cp "$J/logs/bake.log" "$J/bake.txt"
echo "### done"
