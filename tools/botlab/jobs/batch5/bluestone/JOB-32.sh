#!/bin/bash
# kind: tests
# Bluestone fix round 3 (the art builder), JOB-32: are the ~400 ms 'bad run' frames this round's? eras-jump 'frames' x5 at
# this head and x5 with the reviewed code's src (9012ec65, before fix round 3), alternating in one job on one machine (the
# way JOB-17 alternated); each run: the worst frame of the real-schedule jump, the Bravo 2 -> 3 and the sunset 3 -> 1, and
# every frame over 50 ms with its split [total, J + s, era update, render, rest, programs, textures, geometries].
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/t"
echo "### bluestone JOB-32 head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
fr() { local n=$1; env MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames' WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1
  echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') load $(sysctl -n vm.loadavg)"
  grep -oE '"worst":\[\[[^]]*\]' "$J/t/$n.log" | head -3 | sed "s/^/# $n worst (main | bravo | sunset) /"
  grep -oE '\[[0-9]{2,}\.[0-9],-?[0-9.]+,("[a-z]+"|[0-9.]+),[^]]*\]' "$J/t/$n.log" | awk -F, '$1+0 > 50' | sort -u | sed "s/^/# $n over 50 ms /"; }
for k in 1 2 3 4 5; do
  fr head-$k
  git checkout -q 9012ec65 -- src; fr base-$k; git checkout -q HEAD -- src
done
git status --short src | head -3
echo "### done load $(sysctl -n vm.loadavg)"
