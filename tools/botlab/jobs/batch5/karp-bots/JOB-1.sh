#!/bin/bash
# kind: balance
# Bazookarp — the shared balance pass (SPEC §10.3's Mac mini JOB template, WP3 karp-bots; WP4b and the stage builders
# copy it): N all-bot karp-match.cjs matches per stage at normal, and N at hard on the reference stages, run PAR at a
# time under the slot lock; only karp-agg.py's summary (the §9.1 PASS / FAIL rows) comes back, one file per stage and
# difficulty, plus one RESULT line per match.
#   STAGES   stages at normal            (default: karpbox halyard lockgate)
#   HARD     stages also at hard         (default: halyard lockgate — the reference layouts)
#   N        matches per stage and difficulty (default 16: the SPEC's §9.1 targets are for ≥ 16)
#   SUBS     passed to karp-match.cjs (optional)
# A stage builder copies this file to tools/botlab/jobs/batch5/karp-<id>/JOB-<n>.sh and sets STAGES="<id>" HARD="".
set -u
STAGES=${STAGES:-"karpbox halyard lockgate"}
HARD=${HARD:-"halyard lockgate"}
N=${N:-16}
PAR=${PAR:-3}
J=${JOB_OUT:-.botlab/karp-job}
mkdir -p "$J/m"
echo "### Bazookarp balance pass: N=$N per cell, normal on [$STAGES], hard on [$HARD], head ${JOB_SHA:-?}"
run_cell() {
  local stage=$1 diff=$2 dir="$J/m/$1-$2"
  mkdir -p "$dir"
  local i
  for i in $(seq 1 "$N"); do
    ( MAP=$stage DIFF=$diff OUT="$dir/$i.json" WATCHDOG=900000 tools/botlab/run.sh tools/botlab/karp-match.cjs > "$dir/$i.log" 2>&1
      grep -h "^RESULT karp\|FRAME ERRORS\|^HARNESS\|^WATCHDOG\|MAP MISMATCH" "$dir/$i.log" | sed "s/^/[$stage $diff #$i] /" ) &
    if (( i % PAR == 0 )); then wait; fi
  done
  wait
  python3 tools/botlab/karp-agg.py "$dir" > "$J/agg-$stage-$diff.txt" 2>&1
  echo "== $stage $diff"
  grep "^== \|^   \|^SUMMARY" "$J/agg-$stage-$diff.txt"
}
for s in $STAGES; do run_cell "$s" normal; done
for s in $HARD; do run_cell "$s" hard; done
# the per-cell summaries also go back as files (their first 150 lines each)
ls "$J"/agg-*.txt > /dev/null 2>&1 && echo "### done: $(ls "$J"/agg-*.txt | wc -l | tr -d ' ') cells"
