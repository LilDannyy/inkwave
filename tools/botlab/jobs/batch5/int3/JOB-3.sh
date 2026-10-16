#!/bin/bash
# kind: balance
# after: JOB-2
# [b5-int3] the lead's sets D and E (Turf War half), b97b3eb, bots normal, DIAG on, 8 matches per config over halyard,
# saltpan, calamari, treehills (2 each), Turf War 3:00:
#   D  SPECIALS=all=barrage / all=barrage_waddle / all=barrage_mystery: splats per use, deaths during the special (turf
#      per use: match.cjs has no per-special turf counter — the inked total ÷ uses is given as a rough stand-in)
#   E  SUBS=all=bomb / glide / sentry / bobber / dash: hits, splats, ink per splat; the sentry's lock-on share, the
#      bobber's chains set off / expired / disarmed, the dash's dodges and sea deaths
# Tables → $JOB_OUT/D.txt, E.txt.
set -u
J=tools/botlab/jobs/batch5/int3; . $J/lib-int3.sh
H="$JOB_OUT/head"; pin "$H" b97b3eb
L="$JOB_OUT/lines.txt"; : > "$L"
for M in halyard saltpan calamari treehills; do for i in 1 2; do
  for SP in barrage barrage_waddle barrage_mystery; do echo "D-$SP-$M-$i $H MAP=$M MODE=turf SECS=180 SPECIALS=all=$SP" >> "$L"; done
  for SB in bomb glide sentry bobber dash; do echo "E-turf-$SB-$M-$i $H MAP=$M MODE=turf SECS=180 SUBS=all=$SB" >> "$L"; done
done; done
runs "$L"
for S in D E; do node $J/agg-int3.cjs $S "$JOB_OUT/m" > "$JOB_OUT/$S.txt"; echo "## set $S"; cat "$JOB_OUT/$S.txt"; done
echo "SUMMARY $(ls "$JOB_OUT"/m/*.json 2>/dev/null | wc -l | tr -d ' ') of $(wc -l < "$L" | tr -d ' ') matches wrote a result"
rm -r "$H"
