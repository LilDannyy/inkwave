#!/bin/bash
# kind: tests
# after: JOB-13
# Beta fix round 1, JOB-14: bot-stuck ×3 and karp-bots ×2 on the final code (2b7eaa67 reverts the stranded count's decay:
# JOB-13 had bot-stuck 5/6 ×3 with it) — each failing check's line kept (in $JOB_OUT/fails.txt).
set -u
J=${JOB_OUT:-.botlab/beta1-job14}
mkdir -p "$J/logs"
echo "### beta1 JOB-14 head ${JOB_SHA:-?}"
pt() { local n=$1; shift
  env WATCHDOG=1500000 "$@" tools/botlab/run.sh tools/botlab/page.cjs > "$J/logs/pt-$n.log" 2>&1
  grep -E '^RESULT|^WATCHDOG|HARNESS' "$J/logs/pt-$n.log" | cut -c1-300 | sed "s/^/[$n] /"
  grep -E '^FAIL' "$J/logs/pt-$n.log" | cut -c1-700 | sed "s/^/[$n] /" >> "$J/fails.txt"; }
for k in 1 2 3; do pt bot-stuck-$k MAP=aquarium MODE=turf PAGE=tools/botlab/tests/bot-stuck.js; done
for k in 1 2; do pt karp-bots-$k MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js; done
echo "## fails"; cat "$J/fails.txt" 2>/dev/null | cut -c1-390
echo "### done"
