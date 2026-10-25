#!/bin/bash
# kind: tests
# after: JOB-12
# Bluestone art fix round 1, JOB-15: the GPU's own time per frame (EXT_disjoint_timer_query_webgl2 round the game's render,
# median of 24 frames at each of perf6's eight fixed views, the default settings; gpu-views.js) on a quiet machine — the
# review's perf probe compared draw calls, triangles and CPU render time only; on the loaded shared Mac Bluestone's frames
# measured ×1.6 Halyard's GPU time already at the reviewed head. A/B: the reviewed head's src (f2e8c182) against this
# round's, alternating, eras 1 / 2 / 3, day and dusk, 2 runs each, and Halyard day and dusk; one Electron at a time, a
# fresh profile. The working tree's src is restored at the end.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/g"
P=tools/botlab/jobs/batch5/bluestone/gpu-views.js
cp "$P" "$J/gpu-views.js"
echo "### bluestone JOB-15 head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
run() { local tag=$1 map=$2 e=$3 T=$4; if [ "$e" = 0 ]; then BOTLAB_OUT="$J/bo" SLOTS=1 MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$J/gpu-views.js" $R tools/botlab/shoot.cjs > "$J/g/$tag-$map$e-$T.log" 2>&1; else BOTLAB_OUT="$J/bo" SLOTS=1 ERA=$e MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$J/gpu-views.js" $R tools/botlab/shoot.cjs > "$J/g/$tag-$map$e-$T.log" 2>&1; fi; echo "== gpu $tag $map e$e $T: $(grep -oE '"avg":\{[^}]*\}|"views":\[[^]]*\]' "$J/g/$tag-$map$e-$T.log" | tr '\n' ' ') $(grep -E 'WATCHDOG|PRE ERROR' "$J/g/$tag-$map$e-$T.log" | head -1)"; }
for r in 1 2; do
  for T in day dusk; do run halyard$r halyard 0 $T; done
  git checkout -q f2e8c182 -- src
  for T in day dusk; do for e in 1 2 3; do run before$r bluestone $e $T; done; done
  git checkout -q HEAD -- src
  for T in day dusk; do for e in 1 2 3; do run after$r bluestone $e $T; done; done
done
git checkout -q HEAD -- src; git status --short src | head -3
grep -h '^== gpu' "$J"/*.log 2>/dev/null | head -0
echo "### done"
