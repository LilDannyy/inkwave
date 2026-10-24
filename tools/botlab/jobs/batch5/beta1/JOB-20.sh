#!/bin/bash
# kind: tests
# Beta fix round 1, review 1, JOB-20: the pinned watch on the final bots.js (a draw made walking a route counts; 1.2 m),
# after JOB-17's 5.25 s Lockgate episode (a nav lane node 0.09 m off a post: a bow / charger stood there for good):
#  1. bot-stuck: lockpost ×3 (MAP=lockgate), pocket ×2, the aquarium set ×3 (step, bobber, refill, tank);
#  2. matches printing their stranded / pinned jumps: Lockgate Turf War ×4, all-bow / all-charger lineups on Lockgate,
#     Halyard and Bluestone, the other stages the pinned / stranded watch has caught bots on, Zone Control, Tower Command
#     and Bazookarp (DIAG=1: every stuck episode of 2 s or more listed beside the jumps); ≤ 1 % stuck, none over 5 s;
#  3. karp-bots ×2; the lava-bots gate ×4 alternating with 3aa1c7b8 (before the refill's floor aim went to -0.88, the one
#     change since JOB-16 that reaches a lava stage's bots): JOB-19 had one escape death in 3 runs.
set -u
J=${JOB_OUT:-.botlab/beta1-job20}
mkdir -p "$J/logs" "$J/pre"; J=$(cd "$J" && pwd)
git archive 3aa1c7b8 | tar -x -C "$J/pre" && ln -s "$PWD/node_modules" "$J/pre/node_modules" && echo "## pre: 3aa1c7b8"
PAR=${PAR:-3}
echo "### beta1 JOB-20 head ${JOB_SHA:-?}"
pt() { local n=$1; shift
  env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/$n.log" 2>&1
  echo "[$n] $(grep -E '^RESULT' "$J/logs/$n.log" | tail -1)"
  grep -E '^FAIL' "$J/logs/$n.log" | cut -c1-900 | sed "s/^/[$n] /"
  grep -E '^PASS|^FAIL' "$J/logs/$n.log" | cut -c1-1200 > "$J/$n.txt"; }
for k in 1 2 3; do pt lockpost-$k MAP=lockgate MODE=turf PAGE_ARGS='only=lockpost' PAGE=tools/botlab/tests/bot-stuck.js; grep -h -E '^PASS lockpost' "$J/logs/lockpost-$k.log" | grep -oE '"rows":.*' | cut -c1-700 | sed "s/^/[lockpost-$k] /"; done
for k in 1 2; do pt pocket-$k MAP=bluestone MODE=turf PAGE_ARGS='only=pocket' PAGE=tools/botlab/tests/bot-stuck.js; done
for k in 1 2 3; do pt bot-stuck-$k MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js; done
run() { local n=$1; shift
  ( env WATCHDOG=1200000 DIAG=1 "$@" > "$J/logs/$n.log" 2>&1
    grep -h -E '^RESULT karp|^   stuck [0-9.]+%|bots stuck|^   STUCK|^   STRANDED|^   DIAG|^   stuck \{|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^CONSOLE' "$J/logs/$n.log" | sed -E 's/fast fuse.*bots stuck/bots stuck/' | cut -c1-700 | sed "s/^/[$n] /" ) & }
i=0; step() { i=$((i + 1)); if (( i % PAR == 0 )); then wait; fi; }
for k in 1 2 3 4; do run "turf-lockgate-$k" MAP=lockgate MODE=turf SECS=180 tools/botlab/run.sh tools/botlab/match.cjs; step; done
for s in lockgate halyard; do run "bow-$s" MAP=$s MODE=turf SECS=180 WEAPONS='all=bow' tools/botlab/run.sh tools/botlab/match.cjs; step; done
for s in lockgate bluestone; do run "charger-$s" MAP=$s MODE=turf SECS=180 WEAPONS='all=charger' tools/botlab/run.sh tools/botlab/match.cjs; step; done
for s in halyard bluestone aquarium treehills nantai; do run "turf-$s" MAP=$s MODE=turf SECS=180 tools/botlab/run.sh tools/botlab/match.cjs; step; done
for s in halyard aquarium bluestone; do run "zones-$s" MAP=$s MODE=zones tools/botlab/run.sh tools/botlab/match.cjs; step; done
run "tower-bluestone" MAP=bluestone tools/botlab/run.sh tools/botlab/tower-match.cjs; step
for s in aquarium halyard; do run "karp-$s" MAP=$s tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done
wait
for k in 1 2; do pt karp-bots-$k MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js; done
lb() { local n=$1 dir=$2
  ( cd "$dir" && env WATCHDOG=1500000 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js tools/botlab/run.sh tools/botlab/page.cjs ) > "$J/logs/$n.log" 2>&1
  grep -h -E '^RESULT' "$J/logs/$n.log" | sed "s/^/[$n] /"
  grep -h -E '^(PASS|FAIL) the gate' "$J/logs/$n.log" | grep -o '"esc":[0-9]*,"fight":[0-9]*,"list":.*' | cut -c1-400 | sed "s/^/[$n] gate /"; }
N=$PWD
for k in 1 2 3 4; do lb "lava-bots-new-$k" $N; lb "lava-bots-pre-$k" "$J/pre"; done
echo "### done"
