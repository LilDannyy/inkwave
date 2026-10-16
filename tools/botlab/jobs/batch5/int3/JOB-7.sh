#!/bin/bash
# kind: balance
# push: tools/botlab/jobs/batch5/int3/out/A3-*.txt
# [b5-int3] the lead's third Zone Control set (the Mac mini helper, 2026-10-16): where does the late run-away open?
# Random loadouts, bots normal, DIAG on, 7759085 vs b97b3eb, halyard / saltpan / crossmarket / lockgate ×4 = 16 per code.
# Per match: the counts (and penalties) every 30 s to the end, every take of the objective (time, objective, taker, the
# last team that held it, the penalty its loser got, both counts then, and whether the taker led, trailed or was level),
# and the last lead change. Means: the gap at each 30 s mark, the mean time of the last lead change, the takes after
# 180 s by the leader vs the trailer, the mean penalty per take. match-int3.cjs = match.cjs + these counters (lib-int3.sh
# patch_match + patch_match3; the repo's harness untouched); code pinned as in JOB-2.
# → $JOB_OUT/A3.txt (rows + means); out/A3-timeline.txt and out/A3-takes.txt (every match), pushed with the results.
set -u
J=tools/botlab/jobs/batch5/int3; . $J/lib-int3.sh
H="$JOB_OUT/head"; O="$JOB_OUT/base"
pin "$H" b97b3eb; pin "$O" 7759085 "$H"
for d in "$H" "$O"; do patch_match "$d"; patch_match3 "$d"; done
L="$JOB_OUT/lines.txt"; : > "$L"
for M in halyard saltpan crossmarket lockgate; do for i in 1 2 3 4; do
  echo "A3-base-$M-$i $O MAP=$M MODE=zones" >> "$L"; echo "A3-head-$M-$i $H MAP=$M MODE=zones" >> "$L"
done; done
runs2 "$L"
mkdir -p $J/out
node $J/agg-int3.cjs A3 "$JOB_OUT/m" > "$JOB_OUT/A3.txt"
node $J/agg-int3.cjs A3T "$JOB_OUT/m" > $J/out/A3-timeline.txt
node $J/agg-int3.cjs A3F "$JOB_OUT/m" > $J/out/A3-takes.txt
echo "## set A3"; cat "$JOB_OUT/A3.txt"
echo "SUMMARY $(ls "$JOB_OUT"/m/*.json 2>/dev/null | wc -l | tr -d ' ') of $(wc -l < "$L" | tr -d ' ') matches wrote a result"
rm -r "$H" "$O"
