#!/bin/bash
# kind: tests
# after: JOB-6
# Beta fix round 1, JOB-7: the brief's section 3 online and audio tests once more on the final code, each alone and only
# once the 1-minute load average is under 4 (JOB-3 ran them one at a time, but at 4.2–6.9 for all but net-eras): the
# runner waits up to 10 min before each, and prints the load it started at. sfx-cues alone and last.
set -u
J=${JOB_OUT:-.botlab/beta1-job7}
mkdir -p "$J/logs"
echo "### beta1 JOB-7 head ${JOB_SHA:-?}"
keep='^PASS|^FAIL|^RESULT|^WATCHDOG|HARNESS|console errors'
load1() { sysctl -n vm.loadavg | awk '{print $2}'; }
calm() { local k=0; while awk -v l="$(load1)" 'BEGIN { exit !(l >= 4) }' && (( k < 40 )); do sleep 15; k=$((k + 1)); done; }
one() {   # one <name> <env…> <harness>: alone, once the load is under 4
  local n=$1; shift
  calm
  echo "## $n  load $(sysctl -n vm.loadavg)"
  local t0=$(date +%s)
  env WATCHDOG=1500000 "$@" > "$J/logs/$n.log" 2>&1
  echo "## $n  exit $?  $(( $(date +%s) - t0 )) s"
  grep -E "$keep" "$J/logs/$n.log" | grep -E '^FAIL|^RESULT|WATCHDOG|HARNESS' | cut -c1-400 | sed "s/^/[$n] /"
  grep -E "$keep" "$J/logs/$n.log" | cut -c1-600 | head -150 > "$J/$n.txt"
}
one net-eras CLIENTS=2 URLQ=wipstages NET=tools/botlab/tests/net-eras.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-lava WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-pipes WIPSTAGES=1 CLIENTS=2 Q0=autopilot Q1='autopilot&netlag=80&netjitter=40' NET=tools/botlab/tests/net-pipes.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-stagemods CLIENTS=2 NET=tools/botlab/tests/net-stagemods.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-lobbykit CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-lobbykit.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-practice CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-practice.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-karp-2 CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-karp-3 CLIENTS=3 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' Q2='autopilot&wipmodes' NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one lava-karp MAP=caldera MODE=bazookarp PAGE=tools/botlab/tests/lava-karp.js tools/botlab/run.sh tools/botlab/page.cjs
one eras-jump-frames MAP=bluestone PAGE_ARGS='only=frames' PAGE=tools/botlab/tests/eras-jump.js tools/botlab/run.sh tools/botlab/page.cjs
one karp-match-karpbox MAP=karpbox tools/botlab/run.sh tools/botlab/karp-match.cjs
one karp-match-halyard MAP=halyard tools/botlab/run.sh tools/botlab/karp-match.cjs
one sfx-cues MAP=testbox MODE=turf PAGE=tools/botlab/tests/sfx-cues.js tools/botlab/run.sh tools/botlab/page.cjs
echo "### done"
