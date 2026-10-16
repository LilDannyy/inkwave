#!/bin/bash
# Highmark Foundry r3: bot matches at both lava levels, one Electron instance at a time (the Mac mini is down):
# Turf War ×2 and Zone Control ×2 per level, then an all-bot Tower Command match. Summaries next to the logs.
cd "$(dirname "$0")/../../../../../.."
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
R=tools/botlab/run.sh; O=tools/botlab/jobs/batch5/caldera/out/r3-local/matches; mkdir -p "$O"
sum() { echo "### $1"; grep -E '^== |^   stuck |^   splats by cause|^   per bot|^   held |^   checkpoints|^   result|^   score|^   turf|^   bots in the active zone|^   diag|^CONSOLE|^  \[|FRAME ERRORS|WATCHDOG|HARNESS|winner|knockout' "$O/$1.log" | cut -c1-420 | head -40; }
for k in ${KS:-1 2}; do
  for L in low high; do
    LAVA=$L MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$O/turf-$L-$k.log" 2>&1; sum turf-$L-$k
    LAVA=$L MAP=caldera MODE=zones $R tools/botlab/match.cjs > "$O/zones-$L-$k.log" 2>&1; sum zones-$L-$k
  done
done
[ -n "$NOTOWER" ] || { MAP=caldera $R tools/botlab/tower-match.cjs > "$O/towermatch-low.log" 2>&1; sum towermatch-low; }
echo "RESULT done"
