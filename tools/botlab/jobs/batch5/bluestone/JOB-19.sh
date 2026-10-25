#!/bin/bash
# kind: tests
# Bluestone art review 2 (the reviewer's), JOB-19: JOB-18 found Bluestone's GPU time flat at 43-48 ms in every view (x1.46-1.73
# Halyard) and still 37 ms with the level hidden; the level art, the re-skin loop, the rooms and the front-cut discard
# explain only ~2-4 ms. Where is the view-independent rest? rv2-gpu-attr2.js: one thing off at a time (the shadow map held,
# GTAO, bloom, EraFx, transparent meshes, a plain material on the level, everything hidden) on Bluestone e1 / e2 / e3 by
# day and e2 at dusk, and Halyard day and dusk, 2 rounds alternating, a fresh profile, one Electron at a time.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/g"
P=tools/botlab/jobs/batch5/bluestone/rv2-gpu-attr2.js
echo "### bluestone JOB-19 (art review 2) head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
run() { local map=$1 e=$2 T=$3 r=$4 S=$5 f="$J/g/$1$2-$3-r$4-$5.log"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $( [ "$e" != 0 ] && echo ERA=$e ) MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$P" PRE_ARGS=$S WATCHDOG=900000 $R tools/botlab/shoot.cjs > "$f" 2>&1
  echo "== attr2 $S $map e$e $T r$r: $(grep -E '^PRE ' "$f" | cut -c1-1800) $(grep -E 'WATCHDOG|PRE ERROR|Error' "$f" | head -2 | cut -c1-200)"; }
for r in 1 2; do
  for S in A B; do run halyard 0 day $r $S; run bluestone 2 day $r $S; run bluestone 1 day $r $S; run bluestone 3 day $r $S; run halyard 0 dusk $r $S; run bluestone 2 dusk $r $S; done
done | tee "$J/attr2.txt"
echo "### done"
