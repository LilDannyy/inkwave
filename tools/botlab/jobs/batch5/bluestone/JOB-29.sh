#!/bin/bash
# kind: tests
# after: JOB-28
# push: tools/botlab/jobs/batch5/bluestone/out/sweep/fix3/day/*.jpg
# Bluestone fix round 3 (the art builder), JOB-29: the eye-level sweep (tools/botlab/stage-sweep.cjs) in every era by day at
# fix round 3's head (the real jump's lights, the five cover pieces dressed, real words up close): one overview page per 35
# clusters under out/sweep/fix3/day/; then the art-relevant tests once more at this head (eras-look with (i), eras-jump
# first / frames / sky, world-build, stage-audit turf e1-e3: the lightmap still applied).
set -u
O=tools/botlab/jobs/batch5/bluestone/out/sweep/fix3/day
A=tools/botlab/jobs/batch5/bluestone
R=tools/botlab/run.sh
mkdir -p "$O" "$JOB_OUT/t"
echo "### bluestone JOB-29 head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
SKIP='street,street-base,kerb,carriageway,carriageway-base,circus,terrace-base,prow-place-base,gpo-terrace-base,spawn-deck-base,arcade-floor-base,boathouse-base,rail'
for e in 1 2 3; do
  n="e$e-day"
  echo "# sweep $n load $(sysctl -n vm.loadavg)"
  MAP=bluestone TIME=day ERA=$e SKIP="$SKIP" OUT="$JOB_OUT/sw-$n" $R tools/botlab/stage-sweep.cjs > "$JOB_OUT/sw-$n.log" 2>&1
  grep -E 'views of|NO EYE|CONSOLE|WATCHDOG|HARNESS' "$JOB_OUT/sw-$n.log" | head -12
  python3 $A/sweep-overview.py "$JOB_OUT/sw-$n" "$O/sweep-$n" 1 7 5 980 300 "Bluestone sweep $n (fix round 3)" 2>&1 | tail -2
done
ls -la "$O"
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$JOB_OUT/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$JOB_OUT/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$JOB_OUT/t/$n.log") FAIL"; grep -E '^FAIL' "$JOB_OUT/t/$n.log" | cut -c1-1500; }
pg eras-look MAP=bluestone PAGE=tools/botlab/tests/eras-look.js
pg eras-jump-first MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'
pg eras-jump-frames MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'
grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$JOB_OUT/t/eras-jump-frames.log" | head -3 | sed 's/^/# frames worst /'
pg world-build-bluestone MAP=bluestone PAGE=tools/botlab/tests/world-build.js
echo "### done"
