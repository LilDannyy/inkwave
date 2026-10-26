#!/bin/bash
# kind: tests
# push: tools/botlab/jobs/batch5/bluestone/out/JOB-35-*.log
# [b5-bluestone] JOB-35 (the lead's, written by the Mac mini helper): the first Bazookarp balance data (SPEC §9.1) on the
# merged tree new-stages f8b630d4 (the Halyard and Lockgate reference layouts and their fresh bakes), pinned:
#   1. size-budget.js on halyard.bazookarp (the builder did not run it)
#   2. karp-match.cjs x10 on each of halyard and lockgate, bots vs bots, normal, full 5:00: two instances side by side,
#      each alternating the stages (one starts on halyard, the other on lockgate)
#   3. karp-agg.cjs: per match the RESULT line and every bot stuck over 5 s (where), then a table per stage
set -u
J="$JOB_OUT"; M="$J/m"; mkdir -p "$M"
git archive f8b630d4 | tar -x -C "$M"; ln -s "$PWD/node_modules" "$M/node_modules"
cp tools/botlab/jobs/batch5/bluestone/karp-agg.cjs "$J/karp-agg.cjs"
R=tools/botlab/run.sh
cd "$M" || exit 1
echo "### bluestone JOB-35 (Bazookarp balance data) on new-stages $(git -C "$OLDPWD" rev-parse --short f8b630d4) (pinned) load $(sysctl -n vm.loadavg)"
MAP=halyard MODE=bazookarp PAGE=tools/botlab/tests/size-budget.js WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/size.log" 2>&1
echo "== size-budget halyard.bazookarp: $(grep -E '^RESULT|^WATCHDOG|HARNESS' "$J/size.log" | tr '\n' ' ')"; grep -E '^PASS|^FAIL|console errors' "$J/size.log" | cut -c1-300
P1=""; P2=""; for i in 1 2 3 4 5; do P1+="halyard:normal:1,lockgate:normal:1,"; P2+="lockgate:normal:1,halyard:normal:1,"; done
PLAN="${P1%,}" WATCHDOG=2700000 $R tools/botlab/karp-match.cjs > "$J/karp-1.log" 2>&1 &
sleep 20; PLAN="${P2%,}" WATCHDOG=2700000 $R tools/botlab/karp-match.cjs > "$J/karp-2.log" 2>&1 &
wait
for f in "$J"/karp-[12].log; do echo "== $(basename "$f"): $(grep -c '^RESULT karp' "$f") matches $(grep -E '^WATCHDOG|^HARNESS|MAP MISMATCH' "$f" | tr '\n' ' ')"; done
echo "== console: $(grep -h '^CONSOLE' "$J"/karp-[12].log | sort | uniq -c | tr '\n' ' ') | lightmap warnings: $(grep -hc 'missing-lightmap' "$J"/karp-[12].log | tr '\n' ' ') | frame errors: $(grep -hc 'FRAME ERRORS' "$J"/karp-[12].log | tr '\n' ' ')"
node "$J/karp-agg.cjs" "$J/karp-1.log" "$J/karp-2.log"
cd "$OLDPWD"; rm -r "$M"
mkdir -p tools/botlab/jobs/batch5/bluestone/out; cp "$J/karp-1.log" tools/botlab/jobs/batch5/bluestone/out/JOB-35-karp-1.log; cp "$J/karp-2.log" tools/botlab/jobs/batch5/bluestone/out/JOB-35-karp-2.log
