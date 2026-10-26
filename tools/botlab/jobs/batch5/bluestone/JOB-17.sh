#!/bin/bash
# kind: tests
# Bluestone art fix round 1, JOB-17: JOB-16's art-tests run failed eras-jump 'frames' once (3/4; the standalone runs
# a / b passed with the jump's worst frame 41.8 / 37.1 ms, JOB-12 had 32-34 at 7ac4bf62). Which check, and is the jump
# frame heavier at the final head? 'frames' x3 at this head and x3 at JOB-12's src (7ac4bf62), alternating, each on a fresh
# page, every FAIL line printed in full; then the GPU's own time per frame at perf6's views (gpu-time.sh), this head
# against 7ac4bf62 (BASE=), eras 1-3 by day.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/t"
echo "### bluestone JOB-17 head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
fr() { local n=$1; MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames' WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ')"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-1400; grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/t/$n.log" | head -1 | sed "s/^/# $n jump worst /"; }
for k in 1 2 3; do
  fr head-$k
  git checkout -q 7ac4bf62 -- src; fr base-$k; git checkout -q HEAD -- src
done
git status --short src | head -3
if [ -f tools/botlab/jobs/batch5/bluestone/gpu-time.sh ]; then SETS="halyard:0 bluestone:1 bluestone:2 bluestone:3" TIMES=day ROUNDS=2 BASE=7ac4bf62 bash tools/botlab/jobs/batch5/bluestone/gpu-time.sh 2>&1 | grep -E '^==|^#|gpu' | head -40; fi
git checkout -q HEAD -- src
echo "### done"
