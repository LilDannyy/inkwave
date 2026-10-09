#!/bin/bash
# kind: balance
# after: JOB-6
# deploy JOB-7 (fix round 1): the bots' device shooting on (DEV_AI=1) and off (DEV_AI=0), 8 matches per config (the cap):
# time each bot spends on enemy devices (device mode s/bot, walking s/bot), picks / re-picks / give-ups, Skitter Bombs
# thrown vs popped (now 60 hp), and the objective numbers.
#  turf.txt   Turf War 180 s, JOB-5's loadouts (Alpha: Skitter Bomb, Twirl Sprinkler, Hop Beacon, Skitter Bomb; Bravo:
#             Splat Bombs; weapons mirrored), halyard ×4 + saltpan ×4, on / off (16 matches) — compare JOB-5's old/new
#  tower.txt  Tower Command 300 s, halyard / calamari / treehills / saltpan × (team0 sprinkler + team1 beacon, and swapped),
#             on / off (16 matches): riders while held, roles' share of bot-time, best pushes, the DEPLOY line
# 32 matches, 3 at a time.
set -u
mkdir -p "$JOB_OUT/turf" "$JOB_OUT/tower"
tf() {   # map i ai
  local f="$JOB_OUT/turf/$1-$2-ai$3.log"
  env MAP=$1 MODE=turf SECS=180 DEV_AI=$3 WEAPONS=shooter,roller,charger,splatling,shooter,roller,charger,splatling SUBS=seeker,sprinkler,beacon,seeker,bomb,bomb,bomb,bomb WATCHDOG=900000 tools/botlab/run.sh tools/botlab/match.cjs > "$f" 2>&1
  echo "### turf $1 $2 DEV_AI=$3"; grep -E "^== |splats by cause|DEPLOY|FRAME ERRORS|^CONSOLE [1-9]|WATCHDOG" "$f" | cut -c1-420
}
tw() {   # map subs ai
  local f="$JOB_OUT/tower/$1-${2//[^a-z0-9]/}-ai$3.log"
  env MAP=$1 SUBS="$2" DEV_AI=$3 WATCHDOG=900000 tools/botlab/run.sh tools/botlab/tower-match.cjs > "$f" 2>&1
  echo "### tower $1 | $2 | DEV_AI=$3"; grep -E "^== |riders avg while held|^   roles \(%|DEPLOY|FRAME ERRORS|^CONSOLE [1-9]|WATCHDOG|MAP MISMATCH" "$f" | cut -c1-420
}
export -f tf tw; export JOB_OUT
echo "### deploy JOB-7 at $(git rev-parse --short HEAD)"
for M in halyard saltpan; do for i in 1 2 3 4; do for ai in 1 0; do echo "$M $i $ai"; done; done; done | xargs -P 3 -L 1 bash -c 'tf "$@"' _ > "$JOB_OUT/turf.txt" 2>&1
cat "$JOB_OUT/turf.txt"
for M in halyard calamari treehills saltpan; do for S in 'team0=sprinkler;team1=beacon' 'team0=beacon;team1=sprinkler'; do for ai in 1 0; do echo "$M|$S|$ai"; done; done; done \
  | xargs -S 4096 -P 3 -I{} bash -c 'IFS="|" read M S AI <<< "{}"; tw "$M" "$S" "$AI"' > "$JOB_OUT/tower.txt" 2>&1
cat "$JOB_OUT/tower.txt"
echo "SUMMARY turf $(grep -c '^== ' "$JOB_OUT/turf.txt")/16, tower $(grep -c '^== ' "$JOB_OUT/tower.txt")/16; frame errors $(cat "$JOB_OUT"/turf.txt "$JOB_OUT"/tower.txt | grep -c 'FRAME ERRORS'), console $(cat "$JOB_OUT"/turf.txt "$JOB_OUT"/tower.txt | grep -c '^CONSOLE [1-9]')"
