#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/bluestone/out/sweep/twin/*.jpg
# Bluestone art phase, JOB-11: Bravo's twins (TWIN=1) of the eye-level sweep by day in every era (JOB-9's twin pages did not
# come back: sweep-overview.py now finds the -B shots), at the head with the sweep fixes (the rowing eights, the 3000s'
# booths and kiosk). One overview page per 35 clusters under out/sweep/twin/ (≤ 1 MB, ≤ 20 files).
set -u
O=tools/botlab/jobs/batch5/bluestone/out/sweep/twin
A=tools/botlab/jobs/batch5/bluestone
mkdir -p "$O"
echo "### bluestone JOB-11 head ${JOB_SHA:-?}"
SKIP='street,street-base,kerb,carriageway,carriageway-base,circus,terrace-base,prow-place-base,gpo-terrace-base,spawn-deck-base,arcade-floor-base,boathouse-base,rail'
for e in 1 2 3; do
  n="e$e-day-B"
  echo "# sweep $n load $(sysctl -n vm.loadavg)"
  MAP=bluestone TIME=day ERA=$e TWIN=1 SKIP="$SKIP" OUT="$JOB_OUT/sw-$n" tools/botlab/run.sh tools/botlab/stage-sweep.cjs > "$JOB_OUT/sw-$n.log" 2>&1
  grep -E 'views of|CONSOLE|WATCHDOG|HARNESS' "$JOB_OUT/sw-$n.log" | head -6
  ls "$JOB_OUT/sw-$n/shots" | head -3
  python3 $A/sweep-overview.py "$JOB_OUT/sw-$n" "$O/sweep-$n" 1 7 5 980 300 "Bluestone sweep $n (Bravo's twins)" 2>&1 | tail -2
done
ls -la "$O"
echo "### done"
