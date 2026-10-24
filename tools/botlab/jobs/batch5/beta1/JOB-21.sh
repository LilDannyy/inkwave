#!/bin/bash
# kind: tests
# after: JOB-20
# Beta fix round 1, review 1, JOB-21: karp-bots H (bots leave a Big Burst's disc: ≥ 16 of 20) — is this branch lower than
# the shipped code? Full karp-bots runs: H 14 / 15 / 14 in three of eight on this branch (only-H runs 16–19 ×7), the
# shipped code 18 ×3 (JOB-15). Here 6 full runs each, the final code and b0cc406c (shipped), alternating, 3 at a time;
# every run's H count and every FAIL line kept.
set -u
J=${JOB_OUT:-.botlab/beta1-job21}
mkdir -p "$J/logs" "$J/base"; J=$(cd "$J" && pwd)
git archive b0cc406c | tar -x -C "$J/base" && ln -s "$PWD/node_modules" "$J/base/node_modules" && cp tools/botlab/tests/karp-bots.js "$J/base/tools/botlab/tests/" && echo "## base: b0cc406c + this branch's karp-bots.js"
echo "### beta1 JOB-21 head ${JOB_SHA:-?}"
N=$PWD
kb() { local n=$1 dir=$2
  ( ( cd "$dir" && env WATCHDOG=1500000 MAP=karpbox MODE=bazookarp PAGE=tools/botlab/tests/karp-bots.js tools/botlab/run.sh tools/botlab/page.cjs ) > "$J/logs/$n.log" 2>&1
    echo "[$n] $(grep -E '^RESULT' "$J/logs/$n.log" | tail -1) | H $(grep -h -E '^(PASS|FAIL) H ' "$J/logs/$n.log" | grep -oE '[0-9]+ of 20' | head -1)"
    grep -E '^FAIL' "$J/logs/$n.log" | cut -c1-500 | sed "s/^/[$n] /" ) & }
for k in 1 2 3; do kb "new-$k" "$N"; kb "base-$k" "$J/base"; kb "new-$((k + 3))" "$N"; wait; kb "base-$((k + 3))" "$J/base"; done
wait
echo "### done"
