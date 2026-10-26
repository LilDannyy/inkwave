#!/bin/bash
# kind: tests
# Bluestone fix round 3 (the art builder), JOB-31: the coordinator's proof for the settle — at this head the settle (done +
# 0.7) changes only uniforms and texture references (each era's clouds and env map built at load). eras-jump 'frames' x4
# (each run: the real-schedule jump, the Bravo viewer's 2 -> 3 by day, the sunset 3 -> 1: the worst frame per jump), the
# settle diagnosis in both side jumps (settle-diag.js: compiles / links / programs / textures / PMREM per frame), 'first' x2,
# 'sky', eras-look in full (with (i)).
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/t"
echo "### bluestone JOB-31 head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-1500; }
for k in 1 2 3 4; do pg frames-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'; grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/t/frames-$k.log" | head -3 | sed "s/^/# frames-$k worst (main | bravo 2>3 | sunset 3>1) /"; done
pg settle-diag MAP=bluestone PAGE=tools/botlab/jobs/batch5/bluestone/settle-diag.js
grep -E '^PASS' "$J/t/settle-diag.log" | grep -oE '^PASS [^{]*|"worst":\[\{[^}]*\}|"changes":\[[^]]*\]|"envMiss":[0-9]+' | cut -c1-600 | sed 's/^/# diag /'
for k in 1 2; do pg first-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'; done
pg sky MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=sky,freeze,modes'
pg eras-look MAP=bluestone PAGE=tools/botlab/tests/eras-look.js
grep -oE '"frameRealVsSeek":\[[^]]*\]' "$J/t/eras-look.log" | head -1 | sed 's/^/# (i) /'
echo "### done load $(sysctl -n vm.loadavg)"
