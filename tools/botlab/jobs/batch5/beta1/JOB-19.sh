#!/bin/bash
# kind: tests
# Beta fix round 1, review 1, JOB-19: the final bots.js (a stranded bot never starts its special; a bare-spot refill shot
# waits for a floor aim within ~7°): bot-stuck ×6 and its pocket, karp-bots ×2, the lava-bots gate ×3 (refill shots
# touch Highmark Foundry's bots), and 8 matches printing their stranded / pinned jumps. Every PASS / FAIL line kept.
set -u
J=${JOB_OUT:-.botlab/beta1-job19}
mkdir -p "$J/logs"; J=$(cd "$J" && pwd)
echo "### beta1 JOB-19 head ${JOB_SHA:-?}"
pt() { local n=$1; shift
  env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/$n.log" 2>&1
  echo "[$n] $(grep -E '^RESULT' "$J/logs/$n.log" | tail -1)"
  grep -E '^FAIL' "$J/logs/$n.log" | cut -c1-700 | sed "s/^/[$n] /"
  grep -E '^PASS|^FAIL' "$J/logs/$n.log" | cut -c1-900 > "$J/$n.txt"; }
for k in 1 2 3 4 5 6; do pt bot-stuck-$k MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js; grep -oE 'within 6 s  \{"bad":\[[^]]*\],"worst":[0-9.]+' "$J/logs/bot-stuck-$k.log" | grep -oE '[0-9.]+$' | sed "s/^/[bot-stuck-$k] RESULT refill worst /"; done
pt pocket MAP=bluestone MODE=turf PAGE_ARGS='only=pocket' PAGE=tools/botlab/tests/bot-stuck.js
pt karp-bots-1 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
pt karp-bots-2 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
for k in 1 2 3; do pt lava-bots-$k MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js; grep -h -E '^(PASS|FAIL) the gate' "$J/logs/lava-bots-$k.log" | grep -o '"esc":[0-9]*,"fight":[0-9]*' | sed "s/^/[lava-bots-$k] RESULT gate /"; done
run() { local n=$1; shift
  ( env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1
    grep -h -E '^   stuck [0-9.]+%|^   STUCK|^   STRANDED|FRAME ERRORS|^WATCHDOG|^HARNESS|^CONSOLE' "$J/logs/$n.log" | cut -c1-300 | sed "s/^/[$n] /" ) & }
i=0; step() { i=$((i + 1)); if (( i % 3 == 0 )); then wait; fi; }
for s in halyard aquarium bluestone treehills; do for k in 1 2; do run "turf-$s-$k" MAP=$s MODE=turf SECS=180 tools/botlab/run.sh tools/botlab/match.cjs; step; done; done
wait
echo "### done"
