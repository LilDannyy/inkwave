#!/bin/bash
# kind: tests
# Beta fix round 1, JOB-3: the integration's unfinished proof (int4 LEAD-REPORT "Still open"; the brief's section 3), ONE AT
# A TIME (each Electron alone; the load average printed before each), sfx-cues alone and last:
#   net-eras, net-lava, net-pipes, net-stagemods, net-lobbykit, net-practice, net-karp with 2 clients and with 3 (and the
#   three-client host migration, net-karp-host part=bots), lava-karp.js, eras-jump.js only=frames, karp-match on karpbox
#   and halyard; then the int4 failures to explain: lava.js (58/59), bot-specials.js (18/19); sfx-cues.js last.
set -u
J=${JOB_OUT:-.botlab/beta1-job3}
mkdir -p "$J/logs"
echo "### beta1 JOB-3 head ${JOB_SHA:-?}"
keep='^PASS|^FAIL|^RESULT|^WATCHDOG|HARNESS|console errors|^== |^RESULT karp|^CONSOLE|^  \[|FRAME ERRORS|MAP MISMATCH|^   stuck [0-9]|^   STUCK|^   fast fuse'
one() {   # one <name> <env…> <harness>: alone, with the load first
  local n=$1; shift
  echo "## $n  load $(uptime | sed 's/.*averages*: //')"
  local t0=$(date +%s)
  env WATCHDOG=1500000 "$@" > "$J/logs/$n.log" 2>&1
  echo "## $n  exit $?  $(( $(date +%s) - t0 )) s"
  grep -E "$keep" "$J/logs/$n.log" | cut -c1-400 | sed "s/^/[$n] /"
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
one net-karp-host-3 CLIENTS=3 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' Q2='autopilot&wipmodes' NET_ARGS='part=bots' NET=tools/botlab/tests/net-karp-host.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one lava-karp MAP=caldera MODE=bazookarp PAGE=tools/botlab/tests/lava-karp.js tools/botlab/run.sh tools/botlab/page.cjs
one eras-jump-frames MAP=bluestone PAGE_ARGS='only=frames' PAGE=tools/botlab/tests/eras-jump.js tools/botlab/run.sh tools/botlab/page.cjs
one karp-match-karpbox MAP=karpbox tools/botlab/run.sh tools/botlab/karp-match.cjs
one karp-match-halyard MAP=halyard tools/botlab/run.sh tools/botlab/karp-match.cjs
one lava MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava.js tools/botlab/run.sh tools/botlab/page.cjs
one bot-specials MAP=testbox MODE=turf PAGE=tools/botlab/tests/bot-specials.js tools/botlab/run.sh tools/botlab/page.cjs
one sfx-cues MAP=testbox MODE=turf PAGE=tools/botlab/tests/sfx-cues.js tools/botlab/run.sh tools/botlab/page.cjs
echo "### done"
