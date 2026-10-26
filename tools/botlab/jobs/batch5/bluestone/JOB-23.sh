#!/bin/bash
# kind: tests
# after: JOB-22
# push: tools/botlab/jobs/batch5/bluestone/out/sweep/fix2/day/*.jpg
# Bluestone fix round 2 (the art builder), JOB-23: the eye-level sweep (tools/botlab/stage-sweep.cjs) in every era by day at
# fix round 2's head (the trams, the drum's ceiling, the 3000s' furniture, the statue's monument, the fountain and buffer
# of light, the wharf rails per era, the dusks' fill): one overview page per 35 clusters under out/sweep/fix2/day/.
set -u
O=tools/botlab/jobs/batch5/bluestone/out/sweep/fix2/day
A=tools/botlab/jobs/batch5/bluestone
mkdir -p "$O"
echo "### bluestone JOB-23 head ${JOB_SHA:-?}"
SKIP='street,street-base,kerb,carriageway,carriageway-base,circus,terrace-base,prow-place-base,gpo-terrace-base,spawn-deck-base,arcade-floor-base,boathouse-base,rail'
for e in 1 2 3; do
  n="e$e-day"
  echo "# sweep $n load $(sysctl -n vm.loadavg)"
  MAP=bluestone TIME=day ERA=$e SKIP="$SKIP" OUT="$JOB_OUT/sw-$n" tools/botlab/run.sh tools/botlab/stage-sweep.cjs > "$JOB_OUT/sw-$n.log" 2>&1
  grep -E 'views of|NO EYE|CONSOLE|WATCHDOG|HARNESS' "$JOB_OUT/sw-$n.log" | head -12
  python3 $A/sweep-overview.py "$JOB_OUT/sw-$n" "$O/sweep-$n" 1 7 5 980 300 "Bluestone sweep $n (fix round 2)" 2>&1 | tail -2
done
ls -la "$O"
echo "### done"
