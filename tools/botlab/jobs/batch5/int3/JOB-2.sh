#!/bin/bash
# kind: balance
# [b5-int3] the lead's measurement sets A–C (the Mac mini helper, 2026-10-16), bots normal, DIAG on, 8 matches per code
# and config:
#   A  Zone Control forgiveness: random loadouts, 7759085 (the pre-batch base) vs b97b3eb — lead changes, time to first
#      take, knockouts, share of time contested, win margin
#   B  Cheer Orb in Zone Control at b97b3eb: SPECIALS=team<side>=booyah, the other team random, each side once a stage
#   C  all rollers, Turf War 3:00, 7759085 vs b97b3eb — turf per bot, splats
# Stages: B on halyard, saltpan, calamari, treehills; A and C on halyard, saltpan, crossmarket, lockgate (calamari and
# treehills don't exist at 7759085, so both codes play the same four). Code pinned: b97b3eb and 7759085 archived into
# $JOB_OUT (b97b3eb's harness laid over 7759085). Tables → $JOB_OUT/A.txt B.txt C.txt.
set -u
J=tools/botlab/jobs/batch5/int3; . $J/lib-int3.sh
H="$JOB_OUT/head"; O="$JOB_OUT/base"
pin "$H" b97b3eb; pin "$O" 7759085 "$H"
echo "### pinned: head $(git -C . rev-parse --short b97b3eb), base 7759085 (harness from b97b3eb)"
L="$JOB_OUT/lines.txt"; : > "$L"
for M in halyard saltpan crossmarket lockgate; do for i in 1 2; do
  echo "A-base-$M-$i $O MAP=$M MODE=zones" >> "$L"; echo "A-head-$M-$i $H MAP=$M MODE=zones" >> "$L"
  echo "C-base-$M-$i $O MAP=$M MODE=turf SECS=180 WEAPONS=all=roller" >> "$L"; echo "C-head-$M-$i $H MAP=$M MODE=turf SECS=180 WEAPONS=all=roller" >> "$L"
done; done
for M in halyard saltpan calamari treehills; do for s in 0 1; do echo "B-$M-t$s $H MAP=$M MODE=zones SPECIALS=team$s=booyah" >> "$L"; done; done
runs "$L"
for S in A B C; do node $J/agg-int3.cjs $S "$JOB_OUT/m" > "$JOB_OUT/$S.txt"; echo "## set $S"; cat "$JOB_OUT/$S.txt"; done
echo "SUMMARY $(ls "$JOB_OUT"/m/*.json 2>/dev/null | wc -l | tr -d ' ') of $(wc -l < "$L" | tr -d ' ') matches wrote a result"
rm -r "$H" "$O"
