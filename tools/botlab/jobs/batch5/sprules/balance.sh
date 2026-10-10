#!/bin/bash
# [b5-sprules] balance of the two new barrages: one team's special forced (both sides, alternately), against the usual
# random special rolls — weapons mirrored across the teams (four comps, cycled), the special gauge ×3 (more specials a
# match). Turf War (3:00) and Zone Control (3:00 + overtime).
#   tools/botlab/jobs/batch5/sprules/balance.sh <outdir> [N_TURF=2] [N_ZONES=2]     (per stage, config and side)
# Configs (CFGS, default wad mys bar base): wad = barrage_waddle forced · mys = barrage_mystery forced · bar = barrage (the
# Splat Bomb Barrage, the existing one: a reference) · ski = barrage_seeker (the Skitter Bomb Barrage: another reference)
# · base = random rolls on both teams (side 0 reported; twice the runs so its cell is as big as a forced one's two sides)
# · fix round 1 (the reviewer: the Waddle Bomb Barrage in Zone Control), barrage_waddle forced with a what-if TUNE of a
# barrage's Waddle (config.js barrage_waddle.waddleSense / waddleLife / gap): wadS = sense 5 m, chase 5 s · wadSG = the
# same and a 0.65 s gap.
# Resumable (a finished match's JSON is skipped). Summary: node tools/botlab/jobs/batch5/sprules/agg.cjs <outdir>
set -u
OUT=${1:?usage: balance.sh <outdir> [N_TURF] [N_ZONES]}; NT=${2:-2}; NZ=${3:-2}; PAR=${PAR:-3}
STAGES=${STAGES:-halyard crossmarket craters spirhalite}
CFGS=${CFGS:-wad mys bar base}
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd)
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
count() { local i=1; while [ "$i" -le "$1" ]; do echo "$i"; i=$((i + 1)); done; }
list() {
  for M in ${MODES:-turf zones}; do
    local N=$NT; [ "$M" = zones ] && N=$NZ
    for i in $(count "$N"); do for S in $STAGES; do for C in $CFGS; do
      if [ "$C" = base ]; then echo "$M $S $C 0 $i"; echo "$M $S $C 0 $((i + 100))"; else for T in 0 1; do echo "$M $S $C $T $i"; done; fi
    done; done; done
  done
}
run_one() {
  local MODE=$1 S=$2 C=$3 T=$4 I=$5 f="$OUT/$1-$2-$3-$4-$5"
  [ -s "$f.json" ] && return 0
  local SP='' TU=''
  case $C in
    wad) SP="team$T=barrage_waddle";;
    mys) SP="team$T=barrage_mystery";;
    bar) SP="team$T=barrage";;
    ski) SP="team$T=barrage_seeker";;
    wadS) SP="team$T=barrage_waddle"; TU='barrage_waddle.waddleSense=5,barrage_waddle.waddleLife=5';;
    wadSG) SP="team$T=barrage_waddle"; TU='barrage_waddle.waddleSense=5,barrage_waddle.waddleLife=5,barrage_waddle.gap=0.65';;
  esac
  local COMPS=('shooter,roller,charger,blaster' 'twins,brush,bow,bucket' 'brolly,spinner,blade,shooter' 'mitts,charger,roller,twins')
  local K=$(( (I + ${#S} + T) % 4 )); local W="${COMPS[$K]},${COMPS[$K]}"
  MAP=$S MODE=$MODE SECS=180 SPCHARGE=3 SPECIALS="$SP" TUNE="$TU" WEAPONS="$W" OUT="$f.json" WATCHDOG=1500000 "$ROOT/tools/botlab/run.sh" "$ROOT/tools/botlab/match.cjs" > "$f.log" 2>&1
  echo "$(date +%H:%M:%S) $MODE $S $C $T $I $([ -s "$f.json" ] && echo ok || echo FAILED)"
}
export -f run_one; export OUT ROOT
list | xargs -P "$PAR" -L 1 bash -c 'run_one "$0" "$1" "$2" "$3" "$4"'
node "$ROOT/tools/botlab/jobs/batch5/sprules/agg.cjs" "$OUT"
