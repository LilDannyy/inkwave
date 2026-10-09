#!/bin/bash
# [b5-zipcheer] Zipline / Cheer Orb balance: bot matches with one team's specials forced to the Zipline or the Cheer Orb
# (both sides in turn), against the usual random rolls; four stages, the weapons mirrored across the teams (four comps,
# cycled), the special gauge ×3 (SPCHARGE: more specials per match).
#   tools/botlab/jobs/batch5/zipcheer/balance.sh <outdir> [N_TURF=2] [N_ZONES=2]      (per stage, config and side)
# Configs (CFGS): a name = what's forced + a tag of your choosing, e.g. zipO / zipN (Zipline on the old / new code),
# orbO / orbN (Cheer Orb), bubN (Bubble Guard), base (random rolls, nothing forced: both "sides" run, as a check that the two halves come out even). A config's what-if tuning:
# TUNE_<cfg>='booyah.lift=0,…' (match.cjs TUNE). The files are <mode>-<stage>-<cfg>-<side>-<i>, so runs of other
# configs into the same <outdir> add up (resumable: a finished match's JSON is skipped).
# Env: BOTLAB_OUT / SLOTS (run.sh's lock), PAR (matches at once, default 3), STAGES, SRC (the checkout to run: default
# this one). Summary: node tools/botlab/jobs/batch5/zipcheer/agg.cjs <outdir>
set -u
OUT=${1:?usage: balance.sh <outdir> [N_TURF] [N_ZONES]}; NT=${2:-2}; NZ=${3:-2}; PAR=${PAR:-3}
STAGES=${STAGES:-halyard crossmarket craters spirhalite}
CFGS=${CFGS:-zipN orbN base}
HERE=$(cd "$(dirname "$0")" && pwd)
SRC=${SRC:-$(cd "$HERE/../../../../.." && pwd)}
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
count() { local i=1; while [ "$i" -le "$1" ]; do echo "$i"; i=$((i + 1)); done; }
list() {
  for i in $(count "$NT"); do for S in $STAGES; do for C in $CFGS; do for T in 0 1; do echo "turf $S $C $T $i"; done; done; done; done
  for i in $(count "$NZ"); do for S in $STAGES; do for C in $CFGS; do for T in 0 1; do echo "zones $S $C $T $i"; done; done; done; done
}
run_one() {
  local MODE=$1 S=$2 C=$3 T=$4 I=$5 f="$OUT/$1-$2-$3-$4-$5"
  [ -s "$f.json" ] && return 0
  local SP='' TU=''
  case $C in
    zip*) SP="team$T=zipcaster";;
    orb*) SP="team$T=booyah";;
    bub*) SP="team$T=bubbler";;
  esac
  eval "TU=\${TUNE_$C:-}"
  local COMPS=('shooter,roller,charger,blaster' 'twins,brush,bow,bucket' 'brolly,spinner,blade,shooter' 'mitts,charger,roller,twins')
  local K=$(( (I + ${#S} + T) % 4 )); local W="${COMPS[$K]},${COMPS[$K]}"
  MAP=$S MODE=$MODE SECS=180 SPCHARGE=3 SPECIALS="$SP" TUNE="$TU" WEAPONS="$W" OUT="$f.json" WATCHDOG=1500000 "$SRC/tools/botlab/run.sh" "$SRC/tools/botlab/match.cjs" > "$f.log" 2>&1
  echo "$(date +%H:%M:%S) $MODE $S $C $T $I $([ -s "$f.json" ] && echo ok || echo FAILED)"
}
export -f run_one; export OUT SRC
for C in $CFGS; do eval "export TUNE_$C=\"\${TUNE_$C:-}\""; done
list | xargs -P "$PAR" -L 1 bash -c 'run_one "$0" "$1" "$2" "$3" "$4"'
node "$HERE/agg.cjs" "$OUT"
