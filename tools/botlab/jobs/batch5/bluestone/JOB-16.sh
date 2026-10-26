#!/bin/bash
# kind: tests
# after: JOB-15
# Bluestone art fix round 1, JOB-16: the round's final head (after the sweep fixes: rooms behind the civic arches, the
# engine hall, the huts and booths; the 3000s' troughs and coal bin; the boat doors) on a quiet machine — eras-jump
# 'first' and 'frames' x2 each on a fresh page, and the whole art-tests.sh suite (the engine's tests and the frozen
# geometry), eras-bake, stage-audit turf per era.
set -u
R=tools/botlab/run.sh
J="$JOB_OUT"; mkdir -p "$J/t"
echo "### bluestone JOB-16 head ${JOB_SHA:-?} load $(sysctl -n vm.loadavg)"
pg() { local n=$1; shift; env "$@" WATCHDOG=900000 $R tools/botlab/page.cjs > "$J/t/$n.log" 2>&1; echo "== $n: $(grep -E '^RESULT|^WATCHDOG|HARNESS ERR' "$J/t/$n.log" | tr '\n' ' ') $(grep -c '^FAIL' "$J/t/$n.log") FAIL"; grep -E '^FAIL' "$J/t/$n.log" | cut -c1-500; }
for k in a b; do
  pg first-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=first'
  pg frames-$k MAP=bluestone PAGE=tools/botlab/tests/eras-jump.js PAGE_ARGS='only=frames'
  grep -oE '"worst":\[\[[^]]*\]' "$J/t/frames-$k.log" | head -1 | sed "s/^/# frames-$k jump worst /"
done
bash tools/botlab/jobs/batch5/bluestone/art-tests.sh "$J/art" | tee "$J/art-tests.txt"
pg eras-bake MAP=bluestone PAGE=tools/botlab/tests/eras-bake.js
for e in 1 2 3; do MAP=bluestone MODE=turf ERA=$e WATCHDOG=900000 PAGE=tools/botlab/tests/stage-audit.js $R tools/botlab/page.cjs > "$J/t/audit-$e.log" 2>&1; echo "== stage-audit turf e$e: $(grep -E 'lightmap|^RESULT|WATCHDOG' "$J/t/audit-$e.log" | tr '\n' ' ' | cut -c1-300)"; done
echo "### done"
