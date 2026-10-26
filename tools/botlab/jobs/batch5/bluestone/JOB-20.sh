#!/bin/bash
# kind: tests
# Bluestone fix round 2 (the art builder), JOB-20: where Bluestone's GPU time goes, attributed on the quiet machine before
# the fix. gpu-ab.js: ONE page per config, the base and each variant switched on alone and off again, 3 rounds alternating
# (each variant against the base measured beside it; runtime switches and shader patches only, the source unchanged).
# Bluestone e2 day and dusk (the art per style, the generic level shader's parts, the era chunks, the lamps, the passes),
# e1 / e3 day (the base and the art), Halyard day and dusk (the same generic parts). Also the level's screen coverage per art
# style and its distance histogram. A fresh profile, one Electron at a time.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/g"
P=tools/botlab/jobs/batch5/bluestone/gpu-ab.js; H=tools/botlab/jobs/batch5/bluestone/gshoot.cjs
echo "### bluestone JOB-20 (fix round 2) head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
run() { local map=$1 e=$2 T=$3 V=$4 f="$J/g/$1$2-$3.log"; local EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$P" PRE_ARGS="$V" WATCHDOG=1500000 $R "$H" > "$f" 2>&1
  echo "== ab $map e$e $T: $(grep -E '^PRE ' "$f" | cut -c1-2600) $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -2 | cut -c1-200)"; }
BV='noart,artrt,skip:1,skip:2,skip:3,skip:4,skip:5,skip:6,skip:7,skip:8,nofine,copefix,hexoff,nomural,noera,nolamps,nolampsF,lod25,prepass,plain,nogtao,nobloom,nosea,shadowheld'
HV='plain,nofine,copefix,hexoff,nomural,nolamps,nolampsF,prepass,nogtao,nobloom,nosea,shadowheld'
{
run halyard 0 day "$HV;rounds=3"
run bluestone 2 day "$BV;rounds=3"
run halyard 0 dusk "$HV;rounds=3"
run bluestone 2 dusk "$BV;rounds=3"
run bluestone 1 day "noart,nofine,plain;rounds=3"
run bluestone 3 day "noart,nofine,plain;rounds=3"
run bluestone 3 dusk "noart,nofine,nolamps,plain;rounds=3"
} | tee "$J/ab.txt"
echo "### done"
