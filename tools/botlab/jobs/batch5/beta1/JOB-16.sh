#!/bin/bash
# kind: tests
# after: JOB-15
# Beta fix round 1, review 1, JOB-16: the matches and gates the review's bot changes can move, then the online and audio tests.
#  1. the stuck set (the issue log's stage / modes, 2 each, DIAG=1) + 3 more Bluestone Turf Wars (the pinned escape: every
#     match prints its stranded / pinned super jumps and why), ≤ 1 % stuck and no episode over 5 s each;
#  2. all-bobber Bluestone Turf War ×3, this branch and b0cc406c (no marks, no dry-plan fix), with match.cjs's stuck share
#     counting the holds on purpose beside the usual one (review 1, issue 6);
#  3. the lava-bots gate ×4, this branch against 194eeb75 (the round's head before review 1), alternating — the refill's
#     floor aim, its arrival and _inkStep's facing touch Highmark Foundry's bots;
#  4. the online tests (the warm runs in _netStage too), each alone once the load is under 4; sfx-cues alone and last.
set -u
J=${JOB_OUT:-.botlab/beta1-job16}
mkdir -p "$J/logs" "$J/base" "$J/pre"; J=$(cd "$J" && pwd)
PAR=${PAR:-3}
echo "### beta1 JOB-16 head ${JOB_SHA:-?}"
git archive b0cc406c | tar -x -C "$J/base" && ln -s "$PWD/node_modules" "$J/base/node_modules" && cp tools/botlab/match.cjs "$J/base/tools/botlab/" && echo "## base: b0cc406c + this branch's match.cjs"
git archive 194eeb75 | tar -x -C "$J/pre" && ln -s "$PWD/node_modules" "$J/pre/node_modules" && echo "## pre: 194eeb75"
summ() { grep -E '^== |^   stuck |^      plan |^   STUCK|^   STRANDED|^   DIAG|^CONSOLE|^RESULT|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH' "$1" | cut -c1-420 | head -150; }
run() { local n=$1 dir=$2; shift 2
  ( cd "$dir" && env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1; summ "$J/logs/$n.log" > "$J/$n.txt"
    grep -h -E '^RESULT karp|^   stuck [0-9.]+%|bots stuck|^   STUCK|^   STRANDED|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^CONSOLE' "$J/logs/$n.log" | sed -E 's/fast fuse.*bots stuck/bots stuck/' | cut -c1-300 | sed "s/^/[$n] /" ) & }
i=0; step() { i=$((i + 1)); if (( i % PAR == 0 )); then wait; fi; }
N=$PWD
# 1. the stuck set
for s in aquarium bluestone lockgate halyard; do for k in 1 2; do run "karp-$s-$k" $N MAP=$s DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done; done
for s in aquarium bluestone; do for k in 1 2; do run "zones-$s-$k" $N MAP=$s MODE=zones DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done; done
for k in 1 2; do run "tower-bluestone-$k" $N MAP=bluestone DIAG=1 tools/botlab/run.sh tools/botlab/tower-match.cjs; step; done
for k in 1 2 3 4 5; do run "turf-bluestone-$k" $N MAP=bluestone MODE=turf SECS=180 DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done
# 2. all-bobber Bluestone, this branch and the shipped code
for k in 1 2 3; do run "bobber-new-$k" $N MAP=bluestone MODE=turf SECS=180 SUBS='all=bobber' tools/botlab/run.sh tools/botlab/match.cjs; step; run "bobber-base-$k" "$J/base" MAP=bluestone MODE=turf SECS=180 SUBS='all=bobber' tools/botlab/run.sh tools/botlab/match.cjs; step; done
wait
# 3. the lava-bots gate, alternating
lb() { local n=$1 dir=$2
  ( cd "$dir" && env WATCHDOG=1500000 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js tools/botlab/run.sh tools/botlab/page.cjs ) > "$J/logs/$n.log" 2>&1
  grep -h -E '^RESULT' "$J/logs/$n.log" | sed "s/^/[$n] /"
  grep -h -E '^FAIL' "$J/logs/$n.log" | cut -c1-260 | sed "s/^/[$n] /"
  grep -h -E '^(PASS|FAIL) the gate' "$J/logs/$n.log" | grep -o '"esc":[0-9]*,"fight":[0-9]*,"list":.*' | cut -c1-300 | sed "s/^/[$n] /"; }
for k in 1 2 3 4; do lb "lava-bots-new-$k" $N; lb "lava-bots-pre-$k" "$J/pre"; done
# 4. online and audio, each alone at a load under 4
keep='^PASS|^FAIL|^RESULT|^WATCHDOG|HARNESS|console errors'
load1() { sysctl -n vm.loadavg | awk '{print $2}'; }
calm() { local k=0; while awk -v l="$(load1)" 'BEGIN { exit !(l >= 4) }' && (( k < 40 )); do sleep 15; k=$((k + 1)); done; }
one() { local n=$1; shift
  calm; echo "## $n  load $(sysctl -n vm.loadavg)"
  env WATCHDOG=1500000 "$@" > "$J/logs/$n.log" 2>&1
  grep -E "$keep" "$J/logs/$n.log" | grep -E '^FAIL|^RESULT|WATCHDOG|HARNESS' | cut -c1-400 | sed "s/^/[$n] /"
  grep -E "$keep" "$J/logs/$n.log" | cut -c1-600 | head -150 > "$J/$n.txt"; }
one net-practice CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-practice.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-karp-2 CLIENTS=2 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-karp-3 CLIENTS=3 Q0='autopilot&wipmodes' Q1='autopilot&wipmodes' Q2='autopilot&wipmodes' NET=tools/botlab/tests/net-karp.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-stagemods CLIENTS=2 NET=tools/botlab/tests/net-stagemods.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-eras CLIENTS=2 URLQ=wipstages NET=tools/botlab/tests/net-eras.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-lava WIPSTAGES=1 CLIENTS=2 NET=tools/botlab/tests/net-lava.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-pipes WIPSTAGES=1 CLIENTS=2 Q0=autopilot Q1='autopilot&netlag=80&netjitter=40' NET=tools/botlab/tests/net-pipes.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-lobbykit CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-lobbykit.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-zones CLIENTS=3 Q0=autopilot Q1=autopilot Q2=autopilot NET=tools/botlab/tests/net-zones.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-tower CLIENTS=3 Q0=autopilot Q1=autopilot Q2=autopilot NET=tools/botlab/tests/net-tower.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-surf CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-surf.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-drainbow CLIENTS=2 NET=tools/botlab/tests/net-drainbow.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-sub-bobber CLIENTS=2 Q0=autopilot Q1=autopilot NET=tools/botlab/tests/net-sub-bobber.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one net-mock CLIENTS=1 Q0='netmock=1&mockauto=0' NET=tools/botlab/tests/net-mock.cjs tools/botlab/run.sh tools/botlab/netpage.cjs
one lava-karp MAP=caldera MODE=bazookarp PAGE=tools/botlab/tests/lava-karp.js tools/botlab/run.sh tools/botlab/page.cjs
one eras-jump-frames MAP=bluestone PAGE_ARGS='only=frames' PAGE=tools/botlab/tests/eras-jump.js tools/botlab/run.sh tools/botlab/page.cjs
one sfx-cues MAP=testbox MODE=turf PAGE=tools/botlab/tests/sfx-cues.js tools/botlab/run.sh tools/botlab/page.cjs
echo "### done"
