#!/bin/bash
# kind: balance
# Bazookarp — a balance set (SPEC §10.3's Mac mini JOB template, WP3 karp-bots; WP4b and the stage builders copy it):
# all-bot karp-match.cjs matches at normal on STAGES and at hard on HARD, run PAR at a time under the slot lock; only
# karp-agg.py's summary (the §9.1 PASS / FAIL rows) comes back, one file per stage and difficulty, plus one RESULT line a
# match.
# THE CAP (COMMON.md): a balance set is at most 8 matches per mode and config, SUMMED OVER THE STAGES. So by default
# TOTAL=8 matches at normal are shared out over STAGES (karpbox 2, halyard 3, lockgate 3) and TOTAL=8 at hard over HARD
# (halyard 4, lockgate 4): 16 matches in all.
#   STAGES   stages at normal            (default: karpbox halyard lockgate)
#   HARD     stages also at hard         (default: halyard lockgate — the reference layouts; "" for none)
#   TOTAL    matches per difficulty, summed over its stages (default 8: the cap)
#   N        LEAD ONLY — matches per stage and difficulty for the lead's consolidated pass after integration (SPEC §9.1's
#            targets are for >= 16 a stage); set it explicitly, it overrides TOTAL. Builders never set it.
#   SUBS     the sub roster, passed to karp-match.cjs as SUBS= (optional; empty: the match's own)
# A stage builder copies this file into ITS OWN key's folder (tools/botlab/jobs/batch5/<your key>/JOB-<n>.sh: the folder
# name must equal your key, COMMON.md) and sets STAGES="<id>" HARD="" (or HARD="<id>" for a reference stage).
set -u
STAGES=${STAGES-"karpbox halyard lockgate"}
HARD=${HARD-"halyard lockgate"}
TOTAL=${TOTAL:-8}
N=${N:-}
SUBS=${SUBS:-}
PAR=${PAR:-3}
# matches for stage number $1 (from 0) of $2 stages: N when the lead set it, else TOTAL shared out (the remainder to the last)
count_for() { if [ -n "$N" ]; then echo "$N"; else local q=$(( TOTAL / $2 )) r=$(( TOTAL % $2 )); if (( $1 >= $2 - r )); then echo $(( q + 1 )); else echo "$q"; fi; fi; }
J=${JOB_OUT:-.botlab/karp-job}
mkdir -p "$J/m"
if [ -n "$N" ]; then SIZE="N=$N a stage (LEAD ONLY)"; else SIZE="TOTAL=$TOTAL a difficulty, shared over its stages"; fi
echo "### Bazookarp balance set: $SIZE, normal on [$STAGES], hard on [$HARD], SUBS=[${SUBS}], head ${JOB_SHA:-?}"
run_cell() {
  local stage=$1 diff=$2 n=$3 dir="$J/m/$1-$2"
  mkdir -p "$dir"
  (( n > 0 )) || return 0
  local i
  for i in $(seq 1 "$n"); do
    ( MAP=$stage DIFF=$diff SUBS="$SUBS" OUT="$dir/$i.json" WATCHDOG=900000 tools/botlab/run.sh tools/botlab/karp-match.cjs > "$dir/$i.log" 2>&1
      grep -h "^RESULT karp\|FRAME ERRORS\|^HARNESS\|^WATCHDOG\|MAP MISMATCH" "$dir/$i.log" | sed "s/^/[$stage $diff #$i] /" ) &
    if (( i % PAR == 0 )); then wait; fi
  done
  wait
  python3 tools/botlab/karp-agg.py "$dir" > "$J/agg-$stage-$diff.txt" 2>&1
  echo "== $stage $diff"
  grep "^== \|^   \|^SUMMARY" "$J/agg-$stage-$diff.txt"
}
set -- $STAGES; k=0; for s in "$@"; do run_cell "$s" normal "$(count_for $k $#)"; k=$((k + 1)); done
set -- $HARD; k=0; for s in "$@"; do run_cell "$s" hard "$(count_for $k $#)"; k=$((k + 1)); done
# the per-cell summaries also go back as files (their first 150 lines each)
ls "$J"/agg-*.txt > /dev/null 2>&1 && echo "### done: $(ls "$J"/agg-*.txt | wc -l | tr -d ' ') cells"
