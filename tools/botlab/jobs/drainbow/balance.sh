#!/bin/bash
# Drainbow balance (src/game/sp-drainbow.js): bot matches with one team's specials forced to the Drainbow, against the
# same with Bubble Guard forced (another defensive special) and the usual random rolls, on four stages, the weapons
# mirrored across the teams (four comps, cycled), the special gauge ×3 (SPCHARGE: more specials per match).
#   tools/botlab/jobs/drainbow/balance.sh <outdir> [N_TURF=3] [N_ZONES=2]      (per stage and config)
# Configs: db0 / db1 (team 0 / team 1 all Drainbow), bub0 / bub1 (all Bubble Guard), base (as rolled; turf only).
# Env: BOTLAB_OUT / SLOTS (run.sh's lock), PAR (matches at once, default 3), STAGES.
# Resumable: a match whose JSON is already in <outdir> is skipped. Summary: node tools/botlab/jobs/drainbow/agg.cjs <outdir>
set -u
OUT=${1:?usage: balance.sh <outdir> [N_TURF] [N_ZONES]}; NT=${2:-3}; NZ=${3:-2}; PAR=${PAR:-3}
STAGES=${STAGES:-halyard crossmarket craters spirhalite}
ROOT=$(cd "$(dirname "$0")/../../../.." && pwd)
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
count() { local i=1; while [ "$i" -le "$1" ]; do echo "$i"; i=$((i + 1)); done; }
list() {
  for i in $(count "$NT"); do for S in $STAGES; do for C in db0 db1 bub0 bub1 base; do echo "turf $S $C $i"; done; done; done
  for i in $(count "$NZ"); do for S in $STAGES; do for C in db0 db1 bub0 bub1; do echo "zones $S $C $i"; done; done; done
}
run_one() {
  local MODE=$1 S=$2 C=$3 I=$4 f="$OUT/$1-$2-$3-$4"
  [ -s "$f.json" ] && return 0
  local SP=''
  case $C in db0) SP='team0=drainbow';; db1) SP='team1=drainbow';; bub0) SP='team0=bubbler';; bub1) SP='team1=bubbler';; esac
  local COMPS=('shooter,roller,charger,blaster' 'twins,brush,bow,bucket' 'brolly,spinner,blade,shooter' 'mitts,charger,roller,twins')
  local K=$(( (I + ${#S}) % 4 )); local W="${COMPS[$K]},${COMPS[$K]}"
  MAP=$S MODE=$MODE SECS=180 SPCHARGE=3 SPECIALS="$SP" WEAPONS="$W" OUT="$f.json" WATCHDOG=1500000 "$ROOT/tools/botlab/run.sh" "$ROOT/tools/botlab/match.cjs" > "$f.log" 2>&1
  echo "$(date +%H:%M:%S) $MODE $S $C $I $([ -s "$f.json" ] && echo ok || echo FAILED)"
}
export -f run_one; export OUT ROOT
list | xargs -P "$PAR" -L 1 bash -c 'run_one "$0" "$1" "$2" "$3"'
node "$ROOT/tools/botlab/jobs/drainbow/agg.cjs" "$OUT"
