#!/bin/bash
# kind: tests
# Bluestone fix round 2 (the art builder), JOB-21: the GPU gate after the first cut (2d4f7a6b: static level programs at
# rest, the depth prepass, the generic shader trims, no hex anti-tiling) against the pre-fix head (BASE 2310eed9 = review
# 2's src) with Halyard alongside, day and dusk, every era; gpu-ab.js on e2 day / dusk for the next levers; eras-jump
# 'first' and 'frames' (the program swap at the warning compiles nothing mid-jump). One Electron at a time, fresh profiles.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/g" "$J/t"
echo "### bluestone JOB-21 (fix round 2) head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
SETS="halyard:0 bluestone:1 bluestone:2 bluestone:3" TIMES="day dusk" ROUNDS=2 BASE=2310eed9 bash tools/botlab/jobs/batch5/bluestone/gpu-time.sh > "$J/t/gpu-time.log" 2>&1
grep -E '^###|ms \[|GPU ms' "$J/t/gpu-time.log" | head -24
cp "$J/t/gpu-time.log" "$J/gpu-time.txt"
P=tools/botlab/jobs/batch5/bluestone/gpu-ab.js; H=tools/botlab/jobs/batch5/bluestone/gshoot.cjs
run() { local map=$1 e=$2 T=$3 V=$4 f="$J/g/$1$2-$3.log"; local EA=""; [ "$e" != 0 ] && EA="ERA=$e"
  env BOTLAB_OUT="$J/bo" SLOTS=1 $EA MAP=$map TIME=$T MODE=turf SHOTS='[]' OUT="$J/g" PRE="$P" PRE_ARGS="$V" WATCHDOG=1500000 $R "$H" > "$f" 2>&1
  echo "== ab $map e$e $T: $(grep -E '^PRE ' "$f" | grep -oE '"base":[0-9.]+,"delta":\{[^}]*\}') $(grep -E 'WATCHDOG|PRE ERROR' "$f" | head -2 | cut -c1-200)"; }
V='live,noprepass,nolamps,nolampsF,lod25,lod40,nofine,nomural,artrt,plain;rounds=2;cover=0'
{ run bluestone 2 day "$V"; run bluestone 2 dusk "$V"; run halyard 0 day 'plain,nolamps;rounds=2;cover=0'; run halyard 0 dusk 'plain,nolamps;rounds=2;cover=0'; } | tee "$J/ab.txt"
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-900; }
for k in 1 2; do pg first-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'; done
for k in 1 2; do pg frames-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'; grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/t/frames-$k.log" | head -1 | sed "s/^/# frames-$k jump worst /"; done
echo "### done"
