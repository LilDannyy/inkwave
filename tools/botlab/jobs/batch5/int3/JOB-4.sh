#!/bin/bash
# kind: balance
# after: JOB-3
# [b5-int3] the lead's set E, Zone Control half: SUBS=all=bomb / glide / sentry / bobber / dash at b97b3eb, bots normal,
# DIAG on, 8 matches each over halyard, saltpan, calamari, treehills (2 each). Table → $JOB_OUT/E.txt.
set -u
J=tools/botlab/jobs/batch5/int3; . $J/lib-int3.sh
H="$JOB_OUT/head"; pin "$H" b97b3eb
L="$JOB_OUT/lines.txt"; : > "$L"
for M in halyard saltpan calamari treehills; do for i in 1 2; do for SB in bomb glide sentry bobber dash; do
  echo "E-zones-$SB-$M-$i $H MAP=$M MODE=zones SUBS=all=$SB" >> "$L"; done; done; done
runs "$L"
node $J/agg-int3.cjs E "$JOB_OUT/m" > "$JOB_OUT/E.txt"; echo "## set E (Zone Control)"; cat "$JOB_OUT/E.txt"
echo "SUMMARY $(ls "$JOB_OUT"/m/*.json 2>/dev/null | wc -l | tr -d ' ') of $(wc -l < "$L" | tr -d ' ') matches wrote a result"
rm -r "$H"
