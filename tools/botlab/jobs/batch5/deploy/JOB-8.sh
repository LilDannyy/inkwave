#!/bin/bash
# kind: balance
# after: JOB-7
# deploy JOB-8 (fix round 1): Zone Control with the bots' device shooting on (DEV_AI=1) and off (DEV_AI=0), 8 matches per
# config (the cap). Both teams carry devices (per slot, mirrored: sprinkler, beacon, Skitter Bomb, sprinkler); weapons as
# shipped. A bot in Zone Control walks only to a device on a live zone; others it shoots from its post if in reach.
# halyard / saltpan / calamari / treehills × 2, on / off: 16 full matches, 3 at a time → zones.txt
set -u
mkdir -p "$JOB_OUT/zones"
zn() {   # map i ai
  local f="$JOB_OUT/zones/$1-$2-ai$3.log"
  env MAP=$1 MODE=zones DEV_AI=$3 SUBS=sprinkler,beacon,seeker,sprinkler,sprinkler,beacon,seeker,sprinkler WATCHDOG=1500000 tools/botlab/run.sh tools/botlab/match.cjs > "$f" 2>&1
  echo "### zones $1 $2 DEV_AI=$3"; grep -E "^== |^   held A|bots in the active zone|DEPLOY|FRAME ERRORS|^CONSOLE [1-9]|WATCHDOG|MAP MISMATCH" "$f" | cut -c1-420 | head -8
}
export -f zn; export JOB_OUT
echo "### deploy JOB-8 at $(git rev-parse --short HEAD)"
for M in halyard saltpan calamari treehills; do for i in 1 2; do for ai in 1 0; do echo "$M $i $ai"; done; done; done | xargs -P 3 -L 1 bash -c 'zn "$@"' _ > "$JOB_OUT/zones.txt" 2>&1
cat "$JOB_OUT/zones.txt"
echo "SUMMARY zones $(grep -c '^== ' "$JOB_OUT/zones.txt")/16; frame errors $(grep -c 'FRAME ERRORS' "$JOB_OUT/zones.txt"), console $(grep -c '^CONSOLE [1-9]' "$JOB_OUT/zones.txt")"
