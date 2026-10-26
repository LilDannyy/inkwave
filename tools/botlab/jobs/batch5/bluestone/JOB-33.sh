#!/bin/bash
# kind: tests
# Bluestone fix round 3 (the art builder), JOB-33: the cold-cache proof the coordinator asked for — eras-jump 'frames' x3 with
# Chromium's GPU shader disk cache OFF (--disable-gpu-shader-disk-cache on the Electron command line, every page cold), both
# side jumps (the Bravo 2 -> 3 by day, the sunset 3 -> 1) and the real-schedule jump: the worst frame per jump per run and every
# frame over 50 ms with its split; then the settle diagnosis cold and 'first' cold.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/t"
echo "### bluestone JOB-33 head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R --disable-gpu-shader-disk-cache tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n (cache off): $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL load $(sysctl -n vm.loadavg)"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-700; }
for k in 1 2 3; do pg frames-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'; grep -oE '"worst":\[\[[^]]*\],\[[^]]*\]' "$J/t/frames-$k.log" | head -3 | sed "s/^/# frames-$k worst (main | bravo 2>3 | sunset 3>1) /"; done
pg settle-diag MAP=bluestone PAGE=tools/botlab/jobs/batch5/bluestone/settle-diag.js
grep -E '^PASS' "$J/t/settle-diag.log" | grep -oE '^PASS [^{]*|"worst":\[\{[^}]*\}|"envMiss":[0-9]+' | cut -c1-400 | sed 's/^/# diag /'
pg first MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'
echo "### done load $(sysctl -n vm.loadavg)"
