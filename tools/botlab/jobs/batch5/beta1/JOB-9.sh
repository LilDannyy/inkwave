#!/bin/bash
# kind: tests
# after: JOB-8
# Beta fix round 1, JOB-9: JOB-7's two misses, repeated on the final code, each alone once the 1-min load is under 4:
# net-eras (13/14: the guest's Iron Bridge splats, 1 cell of 368 differing; JOB-3 14/14) and eras-jump only=frames
# (3/4: a 301 ms frame in a jump, a 161 ms baseline frame; JOB-3 4/4) — three times each.
set -u
J=${JOB_OUT:-.botlab/beta1-job9}
mkdir -p "$J/logs"
echo "### beta1 JOB-9 head ${JOB_SHA:-?}"
load1() { sysctl -n vm.loadavg | awk '{print $2}'; }
calm() { local k=0; while awk -v l="$(load1)" 'BEGIN { exit !(l >= 4) }' && (( k < 40 )); do sleep 15; k=$((k + 1)); done; }
one() { local n=$1; shift
  calm; echo "## $n  load $(sysctl -n vm.loadavg)"
  env WATCHDOG=1500000 "$@" > "$J/logs/$n.log" 2>&1
  grep -E '^FAIL|^RESULT|WATCHDOG|HARNESS' "$J/logs/$n.log" | cut -c1-390 | sed "s/^/[$n] /"; }
for k in 1 2 3; do one net-eras-$k CLIENTS=2 URLQ=wipstages NET=tools/botlab/tests/net-eras.cjs tools/botlab/run.sh tools/botlab/netpage.cjs; done
for k in 1 2 3; do one eras-jump-frames-$k MAP=bluestone PAGE_ARGS='only=frames' PAGE=tools/botlab/tests/eras-jump.js tools/botlab/run.sh tools/botlab/page.cjs; done
echo "### done"
