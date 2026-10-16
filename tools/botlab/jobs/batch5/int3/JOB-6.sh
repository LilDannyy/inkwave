#!/bin/bash
# kind: balance
# [b5-int3] the lead's follow-ups to JOB-2 (the Mac mini helper, 2026-10-16), bots normal, DIAG on:
#   A2  Zone Control forgiveness again at n 16 per code: random loadouts, 7759085 vs b97b3eb, halyard / saltpan /
#       crossmarket / lockgate ×4 — with each match's count at 60 / 120 / 180 / 240 s and its knockout time (does the
#       leader snowball, or were JOB-2's 3/8 vs 1/8 knockouts noise?)
#   C2  rollers in a mixed lobby: random weapons, slot 0 (Alpha) and slot 4 (Bravo) forced to the roller, TRACK=roller,
#       Turf War 3:00, 8 per code on the same four stages ×2 — each roller's turf vs the lobby's mean, splats, deaths,
#       and its share of alive time spent rolling
# match-int3.cjs = match.cjs + those counters (lib-int3.sh patch_match; the repo's harness is untouched). Code pinned
# as in JOB-2 (b97b3eb's harness over 7759085). Tables → $JOB_OUT/A2.txt, C2.txt.
set -u
J=tools/botlab/jobs/batch5/int3; . $J/lib-int3.sh
H="$JOB_OUT/head"; O="$JOB_OUT/base"
pin "$H" b97b3eb; pin "$O" 7759085 "$H"; patch_match "$H"; patch_match "$O"
L="$JOB_OUT/lines.txt"; : > "$L"
for M in halyard saltpan crossmarket lockgate; do
  for i in 1 2 3 4; do echo "A2-base-$M-$i $O MAP=$M MODE=zones" >> "$L"; echo "A2-head-$M-$i $H MAP=$M MODE=zones" >> "$L"; done
  for i in 1 2; do for c in base head; do D=$H; [ $c = base ] && D=$O
    echo "C2-$c-$M-$i $D MAP=$M MODE=turf SECS=180 WEAPONS=roller,,,,roller,,, TRACK=roller" >> "$L"; done; done
done
runs2 "$L"
for S in A2 C2; do node $J/agg-int3.cjs $S "$JOB_OUT/m" > "$JOB_OUT/$S.txt"; echo "## set $S"; cat "$JOB_OUT/$S.txt"; done
echo "SUMMARY $(ls "$JOB_OUT"/m/*.json 2>/dev/null | wc -l | tr -d ' ') of $(wc -l < "$L" | tr -d ' ') matches wrote a result"
rm -r "$H" "$O"
