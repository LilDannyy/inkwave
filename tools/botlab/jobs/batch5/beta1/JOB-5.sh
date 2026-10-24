#!/bin/bash
# kind: tests
# after: JOB-4
# Beta fix round 1, JOB-5: the stuck set again on the round's last bots.js change (3d56a43a: a refilling charge weapon
# lets its draw go), since JOB-4 ran on the code before it: 2 DIAG matches per stage and mode the issue log names
# (Bazookarp on aquarium, bluestone, lockgate, halyard — halyard twice more with DIAG=2: its local refill episodes),
# Zone Control on aquarium and bluestone, Tower Command and Turf War on bluestone; then bot-stuck, lava-bots ×2,
# karp-bots, holds, bot-climb, sub-bobber.
set -u
J=${JOB_OUT:-.botlab/beta1-job5}
PAR=${PAR:-3}
mkdir -p "$J/logs"
echo "### beta1 JOB-5 head ${JOB_SHA:-?}"
summ() { grep -E '^== |^   stuck |^      plan |^   STUCK|^   DIAG|^CONSOLE|^  \[|^RESULT|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^PASS|^FAIL|^   fast fuse|^   carrier-stuck' "$1" | cut -c1-420 | head -150; }
run() { local n=$1; shift
  ( env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1; summ "$J/logs/$n.log" > "$J/$n.txt"
    grep -h -E '^RESULT karp|^   stuck [0-9.]+%|bots stuck|^   STUCK|FRAME ERRORS|^WATCHDOG|^HARNESS|MAP MISMATCH|^CONSOLE' "$J/logs/$n.log" | cut -c1-260 | sed "s/^/[$n] /" ) & }
i=0; step() { i=$((i + 1)); if (( i % PAR == 0 )); then wait; fi; }
for s in aquarium bluestone lockgate halyard; do for k in 1 2; do run "karp-$s-$k" MAP=$s DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done; done
for k in 3 4; do run "karp-halyard-$k" MAP=halyard DIAG=2 tools/botlab/run.sh tools/botlab/karp-match.cjs; step; done
for s in aquarium bluestone; do for k in 1 2; do run "zones-$s-$k" MAP=$s MODE=zones DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done; done
for k in 1 2; do run "tower-bluestone-$k" MAP=bluestone DIAG=1 tools/botlab/run.sh tools/botlab/tower-match.cjs; step; done
for k in 1 2; do run "turf-bluestone-$k" MAP=bluestone MODE=turf SECS=180 DIAG=1 tools/botlab/run.sh tools/botlab/match.cjs; step; done
wait
pt() { local n=$1; shift
  env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/pt-$n.log" 2>&1
  grep -E '^FAIL|^RESULT|^WATCHDOG|HARNESS' "$J/logs/pt-$n.log" | cut -c1-300 | sed "s/^/[$n] /"; grep -E '^PASS|^FAIL|^RESULT' "$J/logs/pt-$n.log" | cut -c1-300 | head -60 > "$J/pt-$n.txt"; }
pt bot-stuck MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js
pt lava-bots MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js
pt lava-bots-2 MAP=caldera MODE=turf PAGE=tools/botlab/tests/lava-bots.js
pt karp-bots MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js
pt holds MAP=testbox MODE=turf PAGE=tools/botlab/tests/holds.js
pt bot-climb MAP=lockgate MODE=turf PAGE=tools/botlab/tests/bot-climb.js
pt sub-bobber MAP=testbox MODE=turf PAGE=tools/botlab/tests/sub-bobber.js
echo "### done"
