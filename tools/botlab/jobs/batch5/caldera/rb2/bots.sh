#!/bin/bash
# round B fix 2 bot matches, one Electron instance at a time: turf at each level, zones LOW, a tower match
F=/private/tmp/claude-501/-Users-danielosling-Desktop-1/dd09cb28-6f60-4591-8992-4f7ec6fb49a8/scratchpad/fx2
cd /Users/danielosling/Desktop/1/st-b5-caldera
export BOTLAB_OUT=/Users/danielosling/Desktop/1/inkwave-upstream/.botlab SLOTS=3 WATCHDOG=900000
R=tools/botlab/run.sh; O=$F/logs/matches
sum() { echo "### $1"; grep -E '^== |^   stuck |^   splats by cause|^   held |^   checkpoints|^   result|^   score|^   turf|^   diag|^CONSOLE|FRAME ERRORS|WATCHDOG|HARNESS|winner|knockout|longest' "$O/$1.log" | cut -c1-420 | head -30; }
LAVA=low MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$O/turf-low.log" 2>&1; sum turf-low
LAVA=high MAP=caldera MODE=turf SECS=180 $R tools/botlab/match.cjs > "$O/turf-high.log" 2>&1; sum turf-high
LAVA=low MAP=caldera MODE=zones $R tools/botlab/match.cjs > "$O/zones-low.log" 2>&1; sum zones-low
LAVA=low MAP=caldera $R tools/botlab/tower-match.cjs > "$O/towermatch-low.log" 2>&1; sum towermatch-low
echo "RESULT bots done"
