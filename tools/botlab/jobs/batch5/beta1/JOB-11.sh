#!/bin/bash
# kind: tests
# after: JOB-10
# Beta fix round 1, JOB-11: the final bots.js (27b7e13b: stranded judged at the floor under the bot; ce42771a: _inkStep to 3.5 m) —
# the bot page tests (bot-stuck ×3) and the stuck set again (turf on bluestone ×3: JOB-8 had a 60.75 s episode there),
# (lava-bots: JOB-10; the tank watch: JOB-8).
set -u
J=${JOB_OUT:-.botlab/beta1-job11}
PAR=${PAR:-3}
mkdir -p "$J/logs"
echo "### beta1 JOB-11 head ${JOB_SHA:-?}"
summ() { grep -E '^== |^   stuck |^      plan |^   STUCK|^   DIAG|^CONSOLE|^RESULT|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^PASS|^FAIL|^   fast fuse' "$1" | cut -c1-420 | head -150; }
pt() { local n=$1; shift
  env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/pt-$n.log" 2>&1
  grep -E '^FAIL|^RESULT|^WATCHDOG|HARNESS' "$J/logs/pt-$n.log" | cut -c1-300 | sed "s/^/[$n] /"; grep -E '^PASS|^FAIL|^RESULT' "$J/logs/pt-$n.log" | cut -c1-390 | head -60 > "$J/pt-$n.txt"; }
pt bot-stuck MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js
pt bot-stuck-2 MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js
pt bot-stuck-3 MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js
pt bot-stuck-karpspot MAP=halyard MODE=bazookarp PAGE_ARGS='only=karpspot' PAGE=tools/botlab/tests/bot-stuck.js
pt karp-bots MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
pt karp-bots-2 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
pt holds MAP=testbox MODE=turf PAGE=tools/botlab/tests/holds.js
pt pipes MAP=aquarium PAGE=tools/botlab/tests/pipes.js
pt sub-bobber MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-bobber.js
pt issue-log MAP=halyard PAGE=tools/botlab/tests/issue-log.js
run() { local n=$1; shift
  ( env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1; summ "$J/logs/$n.log" > "$J/$n.txt"
    grep -h -E '^RESULT karp|^   stuck [0-9.]+%|bots stuck|^   STUCK|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^CONSOLE' "$J/logs/$n.log" | sed -E 's/fast fuse.*bots stuck/bots stuck/' | cut -c1-260 | sed "s/^/[$n] /" ) & }
i=0; step() { i=$((i + 1)); if (( i % PAR == 0 )); then wait; fi; }
for k in 1 2; do run "karp-halyard-$k" MAP=halyard DIAG=2 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done
for k in 1 2; do run "karp-aquarium-$k" MAP=aquarium DIAG=2 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done
for s in bluestone lockgate; do for k in 1 2; do run "karp-$s-$k" MAP=$s DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done; done
for s in aquarium bluestone; do for k in 1 2; do run "zones-$s-$k" MAP=$s MODE=zones DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done; done
for k in 1 2; do run "tower-bluestone-$k" MAP=bluestone DIAG=1 tools/botlab/run.sh tools/botlab/tower-match.cjs; step; done
for k in 1 2 3; do run "turf-bluestone-$k" MAP=bluestone MODE=turf SECS=180 DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done
wait
echo "### done"
