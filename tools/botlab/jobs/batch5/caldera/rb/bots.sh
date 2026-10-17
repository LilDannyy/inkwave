#!/bin/bash
# round B bot matches, one Electron instance at a time (after the pictures): turf + zones at each level, a tower match
S=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/rb1
until grep -q "RESULT pics done" $S/logs/pics.out; do sleep 5; done
cd /Users/danielosling/Desktop/1/st-b5-caldera
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3
R=tools/botlab/run.sh; O=$S/logs/matches
sum() { echo "### $1"; grep -E '^== |^   stuck |^   splats by cause|^   held |^   checkpoints|^   result|^   score|^   turf|^   diag|^CONSOLE|FRAME ERRORS|WATCHDOG|HARNESS|winner|knockout|longest' "$O/$1.log" | cut -c1-420 | head -30; }
for L in low high; do
  LAVA=$L MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$O/turf-$L.log" 2>&1; sum turf-$L
  LAVA=$L MAP=caldera MODE=zones $R tools/botlab/match.cjs > "$O/zones-$L.log" 2>&1; sum zones-$L
done
MAP=caldera $R tools/botlab/tower-match.cjs > "$O/towermatch-low.log" 2>&1; sum towermatch-low
echo "RESULT bots done"
