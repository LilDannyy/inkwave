#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/bluestone/out/sweep/day/*.jpg
# Bluestone art phase, JOB-9: the eye-level sweep (tools/botlab/stage-sweep.cjs) of the finished art in every era, day, and Bravo's twins (TWIN=1) in era 2:
# every tagged structure of Alpha's half from where a player stands next to it; one overview page per 35 clusters (each
# cluster's first view, labelled) comes back under out/sweep/day/ (≤ 1 MB each, ≤ 20 files); the runs' clusters.txt heads too.
set -u
O=tools/botlab/jobs/batch5/bluestone/out/sweep/day
A=tools/botlab/jobs/batch5/bluestone
mkdir -p "$O"
echo "### bluestone JOB-9 head ${JOB_SHA:-?}"
SKIP='street,street-base,kerb,carriageway,carriageway-base,circus,terrace-base,prow-place-base,gpo-terrace-base,spawn-deck-base,arcade-floor-base,boathouse-base,rail'
for spec in 1:0 2:0 3:0 2:1; do
  e=${spec%%:*}; tw=${spec##*:}; n="e$e-day$( [ "$tw" = 1 ] && echo -B )"
  echo "# sweep $n load $(sysctl -n vm.loadavg)"
  if [ "$tw" = 1 ]; then
    MAP=bluestone TIME=day ERA=$e TWIN=1 SKIP="$SKIP" OUT="$JOB_OUT/sw-$n" tools/botlab/run.sh tools/botlab/stage-sweep.cjs > "$JOB_OUT/sw-$n.log" 2>&1
  else
    MAP=bluestone TIME=day ERA=$e SKIP="$SKIP" OUT="$JOB_OUT/sw-$n" tools/botlab/run.sh tools/botlab/stage-sweep.cjs > "$JOB_OUT/sw-$n.log" 2>&1
  fi
  grep -E 'views of|NO EYE|CONSOLE|WATCHDOG|HARNESS' "$JOB_OUT/sw-$n.log" | head -12
  python3 $A/sweep-overview.py "$JOB_OUT/sw-$n" "$O/sweep-$n" 1 7 5 980 300 "Bluestone sweep $n" 2>&1 | tail -2
  head -40 "$JOB_OUT/sw-$n/clusters.txt" > "$JOB_OUT/clusters-$n.txt"
done
ls -la "$O"
echo "### done"
