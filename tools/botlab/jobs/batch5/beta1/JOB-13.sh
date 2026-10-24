#!/bin/bash
# kind: tests
# after: JOB-12
# Beta fix round 1, JOB-13: the last two fixes (d3748e2e: a breaker's other refill spot well inside its band — karp-bots
# B(b2); a6f4c9c7: the stranded count decays — bot-stuck 'tank'): bot-stuck ×3, karpspot, karp-bots ×3, and Bazookarp on
# aquarium and halyard ×2 each.
set -u
J=${JOB_OUT:-.botlab/beta1-job13}
PAR=${PAR:-3}
mkdir -p "$J/logs"
echo "### beta1 JOB-13 head ${JOB_SHA:-?}"
pt() { local n=$1; shift
  env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/pt-$n.log" 2>&1
  grep -E '^FAIL|^RESULT|^WATCHDOG|HARNESS' "$J/logs/pt-$n.log" | cut -c1-300 | sed "s/^/[$n] /"; }
for k in 1 2 3; do pt bot-stuck-$k MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js; done
pt bot-stuck-karpspot MAP=halyard MODE=bazookarp PAGE_ARGS='only=karpspot' PAGE=tools/botlab/tests/bot-stuck.js
for k in 1 2 3; do pt karp-bots-$k MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js; done
run() { local n=$1; shift
  ( env WATCHDOG=1200000 "$@" > "$J/logs/$n.log" 2>&1
    grep -h -E '^RESULT karp|bots stuck|^   STUCK|FRAME ERRORS|^WATCHDOG|^HARNESS|^CONSOLE' "$J/logs/$n.log" | sed -E 's/fast fuse.*bots stuck/bots stuck/' | cut -c1-260 | sed "s/^/[$n] /" ) & }
run karp-aquarium-1 MAP=aquarium DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs
run karp-aquarium-2 MAP=aquarium DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs
run karp-halyard-1 MAP=halyard DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs
wait
run karp-halyard-2 MAP=halyard DIAG=1 tools/botlab/run.sh tools/botlab/karp-match.cjs
wait
echo "### done"
