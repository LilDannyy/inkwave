#!/bin/bash
# Bluestone fix round 2 (scratch): more Turf War ink runs, locally, one at a time.  fix2-ink-more.sh <work dir> "<cells>"
#   cells: space-separated <era><tag> (e.g. "1e 1f 2e Hg") — era 1/2/3 locked on bluestone, H = Halyard
W="$1"; R=tools/botlab/run.sh
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$W"
for c in $2; do
  e=${c:0:1}; k=${c:1}
  if [ "$e" = H ]; then MAP=halyard MODE=turf SECS=180 $R tools/botlab/match.cjs > "$W/turfH$k.log" 2>&1; f="$W/turfH$k.log"
  else ERA=$e MAP=bluestone MODE=turf SECS=180 DIAG=1 $R tools/botlab/match.cjs > "$W/turf$e$k.log" 2>&1; f="$W/turf$e$k.log"; fi
  echo "### turf$e$k"; grep -E '^== |^   stuck |^   DIAG|WATCHDOG|HARNESS|FRAME ERRORS' "$f" | cut -c1-260 | head -4
done
echo "### done $(date)"
