#!/bin/bash
# b5-tuning balance sweeps (bot matches through match.cjs; the weapons mirrored across the teams, four comps cycled, the
# same comp for the same stage + run number in every config, so the configs are paired).
#   tools/botlab/jobs/batch5/tuning/sweep.sh <outdir> zones  "old A B" [N=8]    Zone Control, 5:00 + overtime
#   tools/botlab/jobs/batch5/tuning/sweep.sh <outdir> roller "before after" [N=8]   Turf War 3:00, a roller on each team
# Zone configs (TUNE patches the live ZONES / WEAPONS; anything left out is the branch's own default):
#   old  the rules before b5-tuning: take 80 %, neutralise 40 %, warn 30 %, no hold over the line; the roller at 4.4 m/s
#   A    take 70 %, neutralise 40 %, warn 30 %, 0.6 s over the line          (the branch defaults when this was written)
#   B    take 70 %, neutralise 35 %, warn 25 %, 0.6 s over the line
#   C    take 75 %, neutralise 40 %, warn 30 %, 0.6 s over the line
#   new  no TUNE at all: the branch as it stands
# Roller configs: before (rollSpeed 4.4, the old speed) · after (the branch's).
# Env: BOTLAB_OUT / SLOTS (run.sh's lock), PAR (matches at once, default 3), STAGES (else the kind's four).
# Resumable: a match whose JSON is already in <outdir> is skipped. Summary: node tools/botlab/jobs/batch5/tuning/agg.cjs <outdir>
set -u
OUT=${1:?usage: sweep.sh <outdir> zones|roller "<configs>" [N]}; KIND=${2:?kind}; CFGS=${3:?configs}; N=${4:-8}; PAR=${PAR:-3}
if [ "$KIND" = zones ]; then STAGES=${STAGES:-halyard saltpan crossmarket craters}; else STAGES=${STAGES:-tidewater halyard crossmarket lockgate}; fi
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd)
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
count() { local i=1; while [ "$i" -le "$1" ]; do echo "$i"; i=$((i + 1)); done; }
list() { for i in $(count "$N"); do for S in $STAGES; do for C in $CFGS; do echo "$KIND $S $C $i"; done; done; done; }
run_one() {
  local K=$1 S=$2 C=$3 I=$4 f="$OUT/$1-$2-$3-$4"
  [ -s "$f.json" ] && return 0
  local T='' MODE=zones
  case $C in
    old) T='zones.control=0.8,zones.contest=0.4,zones.warn=0.3,zones.flipHold=0,roller.rollSpeed=4.4';;
    A) T='zones.control=0.7,zones.contest=0.4,zones.warn=0.3,zones.flipHold=0.6';;
    B) T='zones.control=0.7,zones.contest=0.35,zones.warn=0.25,zones.flipHold=0.6';;
    C) T='zones.control=0.75,zones.contest=0.4,zones.warn=0.3,zones.flipHold=0.6';;
    before) T='roller.rollSpeed=4.4';;
  esac
  local COMPS
  if [ "$K" = zones ]; then COMPS=('shooter,roller,charger,blaster' 'twins,brush,bow,bucket' 'brolly,spinner,blade,shooter' 'mitts,charger,roller,twins')
  else MODE=turf; COMPS=('roller,shooter,charger,blaster' 'roller,twins,bow,bucket' 'roller,brolly,spinner,blade' 'roller,mitts,brush,shooter'); fi
  local Q=$(( (I + ${#S}) % 4 )); local W="${COMPS[$Q]},${COMPS[$Q]}"
  MAP=$S MODE=$MODE SECS=180 TUNE="$T" WEAPONS="$W" OUT="$f.json" WATCHDOG=1500000 "$ROOT/tools/botlab/run.sh" "$ROOT/tools/botlab/match.cjs" > "$f.log" 2>&1
  echo "$(date +%H:%M:%S) $K $S $C $I $([ -s "$f.json" ] && echo ok || echo FAILED)"
}
export -f run_one; export OUT ROOT
list | xargs -P "$PAR" -L 1 bash -c 'run_one "$0" "$1" "$2" "$3"'
node "$ROOT/tools/botlab/jobs/batch5/tuning/agg.cjs" "$OUT"
