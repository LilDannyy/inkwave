#!/bin/bash
# Drainbow balance, round 2: variants side by side (each with one team's specials forced; both sides), against Bubble
# Guard forced and the usual random rolls — the weapons mirrored (four comps, cycled), the special gauge ×3.
#   tools/botlab/jobs/drainbow/balance2.sh <outdir> [N_TURF=2] [N_ZONES=1]      (per stage, config and side)
# Configs (CFGS, default all): name=special|TUNE …
#   db     drainbow as shipped        dbnh   … bots don't hold inside (drainbow.botHold=0)
#   dbnp   … no footprint ink (paintFoot=0)       dbv2   … bigger / longer / stronger drain (see V2)
#   dbhv / dblt   … the other team's bots read it as a heavy (botDanger=1) / light (0) area   dbx   … TUNE from $DBX
#   bub    Bubble Guard               base   random rolls (turf only; side 0 reported)
# Resumable (a finished match's JSON is skipped). Summary: node tools/botlab/jobs/drainbow/agg2.cjs <outdir>
set -u
OUT=${1:?usage: balance2.sh <outdir> [N_TURF] [N_ZONES]}; NT=${2:-2}; NZ=${3:-1}; PAR=${PAR:-3}
STAGES=${STAGES:-halyard crossmarket craters spirhalite}
CFGS=${CFGS:-db dbnh dbnp dbv2 bub base}
V2=${V2:-drainbow.radius=4.7,drainbow.duration=9.5,drainbow.inkDrain=13,drainbow.specialDrain=0.08}; DBX=${DBX:-}
ROOT=$(cd "$(dirname "$0")/../../../.." && pwd)
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
count() { local i=1; while [ "$i" -le "$1" ]; do echo "$i"; i=$((i + 1)); done; }
list() {
  for i in $(count "$NT"); do for S in $STAGES; do for C in $CFGS; do for T in 0 1; do [ "$C" = base ] && [ "$T" = 1 ] && continue; echo "turf $S $C $T $i"; done; done; done; done
  for i in $(count "$NZ"); do for S in $STAGES; do for C in $CFGS; do [ "$C" = base ] && continue; for T in 0 1; do echo "zones $S $C $T $i"; done; done; done; done
}
run_one() {
  local MODE=$1 S=$2 C=$3 T=$4 I=$5 f="$OUT/$1-$2-$3-$4-$5"
  [ -s "$f.json" ] && return 0
  local SP='' TU=''
  case $C in
    db) SP="team$T=drainbow";;
    dbnh) SP="team$T=drainbow"; TU='drainbow.botHold=0';;
    dbnp) SP="team$T=drainbow"; TU='drainbow.paintFoot=0';;
    dbv2) SP="team$T=drainbow"; TU="$V2";;
    dbx) SP="team$T=drainbow"; TU="${DBX:-}";;
    dbhv) SP="team$T=drainbow"; TU='drainbow.botDanger=1';;
    dblt) SP="team$T=drainbow"; TU='drainbow.botDanger=0';;
    bub) SP="team$T=bubbler";;
  esac
  local COMPS=('shooter,roller,charger,blaster' 'twins,brush,bow,bucket' 'brolly,spinner,blade,shooter' 'mitts,charger,roller,twins')
  local K=$(( (I + ${#S} + T) % 4 )); local W="${COMPS[$K]},${COMPS[$K]}"
  MAP=$S MODE=$MODE SECS=180 SPCHARGE=3 SPECIALS="$SP" TUNE="$TU" WEAPONS="$W" OUT="$f.json" WATCHDOG=1500000 "$ROOT/tools/botlab/run.sh" "$ROOT/tools/botlab/match.cjs" > "$f.log" 2>&1
  echo "$(date +%H:%M:%S) $MODE $S $C $T $I $([ -s "$f.json" ] && echo ok || echo FAILED)"
}
export -f run_one; export OUT ROOT V2 DBX
list | xargs -P "$PAR" -L 1 bash -c 'run_one "$0" "$1" "$2" "$3" "$4"'
node "$ROOT/tools/botlab/jobs/drainbow/agg2.cjs" "$OUT"
