#!/bin/bash
# Bluestone fix round 3 (scratch): Turf War ink, locally, one at a time.   fix3-ink.sh <work dir> "<cells>"
#   cells: space-separated <kind><era><tag>: m = match.cjs (both teams' turf, DIAG), r = ink-regions.js (ink by region),
#   e.g. "m3a m3b r3a"; era H = Halyard (m only)
W="$1"; R=tools/botlab/run.sh; J=tools/botlab/jobs/batch5/bluestone
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
mkdir -p "$W"
for c in $2; do
  k=${c:0:1}; e=${c:1:1}; t=${c:2}
  if [ "$k" = m ]; then
    if [ "$e" = H ]; then MAP=halyard MODE=turf SECS=180 $R tools/botlab/match.cjs > "$W/turfH$t.log" 2>&1; f="$W/turfH$t.log"
    else ERA=$e MAP=bluestone MODE=turf SECS=180 DIAG=1 $R tools/botlab/match.cjs > "$W/turf$e$t.log" 2>&1; f="$W/turf$e$t.log"; fi
    echo "### turf$e$t"; grep -E '^== |^   stuck |^   DIAG|WATCHDOG|HARNESS|FRAME ERRORS|MAP MISMATCH' "$f" | cut -c1-260 | head -4
  else
    WATCHDOG=900000 ERA=$e MAP=bluestone MODE=turf PAGE=$J/ink-regions.js $R tools/botlab/page.cjs > "$W/regions$e$t.log" 2>&1
    echo "### regions$e$t"; grep -E '^PASS ink|^FAIL|WATCHDOG' "$W/regions$e$t.log" | cut -c1-1500
  fi
done
echo "### done $(date)"
